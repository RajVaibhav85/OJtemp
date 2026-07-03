const fs = require('fs');
const path = require('path');
const { v4: uuid } = require('uuid');
const { exec } = require('child_process');
const { performance } = require('perf_hooks'); 


const dirCodes = path.join(__dirname, '..', 'codes');
const hostCodesDir = process.env.HOST_CODES_DIR || dirCodes;

if (!fs.existsSync(dirCodes)) {
    fs.mkdirSync(dirCodes, { recursive: true });
}


const deleteFolderRecursive = (folderPath) => {
    if (fs.existsSync(folderPath)) {
        try {
            fs.rmSync(folderPath, { recursive: true, force: true });
        } catch (e) {
            console.error(`Failed to purge execution subdirectory: ${folderPath}`, e);
        }
    }
};


const LANGUAGE_CONFIG = {
    cpp: {
        dockerImage: 'frolvlad/alpine-gxx:latest',
        sourceFileName: 'code.cpp',
        runCommand: 'g++ /workspace/code.cpp -o /tmp/a.out && /tmp/a.out < /workspace/input.txt',
    },
    python: {
        dockerImage: 'python:3.11-alpine',
        sourceFileName: 'code.py',
        runCommand: 'python /workspace/code.py < /workspace/input.txt',
    },
    javascript: {
        dockerImage: 'node:20-alpine',
        sourceFileName: 'code.js',
        runCommand: 'node /workspace/code.js < /workspace/input.txt',
    },
    java: {
        dockerImage: 'eclipse-temurin:17-alpine',
        sourceFileName: 'Main.java',
        // javac outputs to /tmp, java runs from /tmp with class name Main
        runCommand: 'javac -d /tmp /workspace/Main.java && java -cp /tmp Main < /workspace/input.txt',
    },
};

const BASELINE_MEMORY_MB = {
    cpp: 4,
    python: 12,
    javascript: 22,
    java: 38,
};

// ─── Image warm-up ─────────────────────────────────────────────────────────
//
// `docker run` pulls an image transparently on a cache miss before it starts
// the container. That pull happens INSIDE the same 10s window we time as
// "execution", so the first run of any language after a fresh host/DinD
// daemon (redeploy, EC2 reboot, disk-pressure image eviction, etc.) can get
// killed and reported as a false "Time Limit Exceeded" purely from network
// pull time, before a single line of the user's code has run.
//
// Pulling every configured image once at startup means the 10s execution
// timeout only ever measures real compile+run time from then on.
const warmUpDockerImages = () => {
    const images = [...new Set(Object.values(LANGUAGE_CONFIG).map(c => c.dockerImage))];
    images.forEach(image => {
        console.log(`[compiler] Pulling ${image} to warm the local Docker cache...`);
        exec(`docker pull ${image}`, { timeout: 5 * 60 * 1000 }, (error, stdout, stderr) => {
            if (error) {
                console.error(`[compiler] Failed to pre-pull ${image} — the first run using it may be slow or falsely TLE. ${stderr?.trim() || error.message}`);
            } else {
                console.log(`[compiler] ${image} ready.`);
            }
        });
    });
};
// Fire on module load (server startup). Runs in the background — the server
// doesn't wait on it, but subsequent code runs will hit a warm cache almost
// as soon as it finishes rather than staying cold indefinitely.
warmUpDockerImages();

// ─── Docker Sandbox Executor ──────────────────────────────────────────────────

/**
 * Runs user code inside an isolated Docker container.
 *
 * Security constraints applied:
 *   --network none     → no internet access from inside the container
 *   -m 256m            → hard memory cap
 *   --cpus="1.0"       → CPU throttle
 *   --pids-limit 50    → prevents fork bombs
 *   --read-only        → container filesystem is read-only (except /tmp)
 *   -v ...:/workspace:ro → job directory mounted read-only
 *   --rm               → container auto-removed after execution
 *
 *   NOTE: /tmp is mounted with `exec` explicitly. Docker's --tmpfs flag
 *   defaults to noexec even when you don't write it — compiled languages
 *   (cpp, java) need to execute their build output from /tmp, so exec must
 *   be requested explicitly or every compiled-language run fails with
 *   "Permission denied".
 */
const executeInDockerSandbox = (language, jobDir, sourceFileName) => {
    return new Promise((resolve, reject) => {
        const config = LANGUAGE_CONFIG[language];
        if (!config) {
            return reject({ msg: `Unsupported language: ${language}` });
        }

        const relativeSession = path.basename(jobDir);
        const absoluteJobDir = path.join(hostCodesDir, relativeSession);

        const dockerExecutionCommand = [
            'docker run --rm',
            '--network none',
            '-m 256m',
            '--cpus="1.0"',
            '--pids-limit 50',
            '--read-only',
            '--tmpfs /tmp:rw,exec,nosuid,size=64m',
            `-v "${absoluteJobDir}":/workspace:ro`,
            config.dockerImage,
            `sh -c "${config.runCommand.replace(/"/g, '\\"')}"`,
        ].join(' ');

        const startTime = performance.now();

        exec(
            dockerExecutionCommand,
            { timeout: 10000, killSignal: 'SIGKILL' },
            (error, stdout, stderr) => {
                const endTime = performance.now();
                const executionTime = Math.round(endTime - startTime);
                const memory = BASELINE_MEMORY_MB[language] ?? 15;

                if (error) {
                    if (error.killed) {
                        reject({
                            msg: 'Time Limit Exceeded (TLE): execution exceeded the 10s safety quota.',
                            executionTime,
                            memory,
                            verdict: 'Time Limit Exceeded',
                        });
                    } else {
                        reject({
                            msg: stderr?.trim() || error.message,
                            executionTime,
                            memory,
                            verdict: 'Runtime Error',
                        });
                    }
                } else {
                    resolve({ stdout, executionTime, memory });
                }
            }
        );
    });
};


const runCode = async (req, res) => {
    const { language, code, input = '' } = req.body;

    // These two checks are true client-input problems (never sent to Docker
    // at all). Execution-time failures (TLE, compile/runtime error) also
    // return 400 below, to match what the frontend currently expects — see
    // the comment in the catch block.
    if (!LANGUAGE_CONFIG[language]) {
        return res.status(400).json({
            success: false,
            error: `Unsupported language: "${language}". Supported: cpp, python, javascript, java`,
        });
    }

    if (!code || code.trim() === '') {
        return res.status(400).json({ success: false, error: 'No code provided.' });
    }

    const sessionToken = uuid();
    const jobDir = path.join(dirCodes, sessionToken);

    try {
        fs.mkdirSync(jobDir, { recursive: true });

        const { sourceFileName } = LANGUAGE_CONFIG[language];

        fs.writeFileSync(path.join(jobDir, sourceFileName), code);
        fs.writeFileSync(path.join(jobDir, 'input.txt'), input + '\n');

        const { stdout, executionTime, memory } = await executeInDockerSandbox(
            language,
            jobDir,
            sourceFileName
        );

        return res.status(200).json({
            success: true,
            output: stdout,
            executionTime,
            memory,
        });

    } catch (err) {
        const errorMessage =
            err.msg || (typeof err === 'string' ? err : err.message || 'Unknown error during execution.');

        // Kept at 400 to match what Coder.jsx already expects (it branches
        // on response.ok / HTTP status, not a body field, for both the
        // "Run" button and per-testcase evaluation). `verdict` is additive —
        // safe for the frontend to start reading later without a breaking
        // change now.
        return res.status(400).json({
            success: false,
            error: errorMessage,
            verdict: err.verdict || 'Runtime Error',
            executionTime: err.executionTime ?? 0,
            memory: err.memory ?? 0,
        });

    } finally {
        deleteFolderRecursive(jobDir);
    }
};


module.exports = { runCode };
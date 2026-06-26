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
                        });
                    } else {
                        reject({
                            msg: stderr?.trim() || error.message,
                            executionTime,
                            memory,
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

        return res.status(400).json({
            success: false,
            error: errorMessage,
            executionTime: err.executionTime ?? 0,
            memory: err.memory ?? 0,
        });

    } finally {
        deleteFolderRecursive(jobDir);
    }
};


module.exports = { runCode };
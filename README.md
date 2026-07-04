# OJtemp — Online Judge Platform

A full-stack Online Judge where users can browse coding problems, submit solutions in multiple languages, get them compiled and run in sandboxed Docker containers, and compete in ICPC-style contests with a live leaderboard.

Live app: [o-jtemp.vercel.app](https://o-jtemp.vercel.app)

---

## Tech Stack

**Frontend**
- React 19 (Vite 8)
- React Router DOM 7
- Monaco Editor (`@monaco-editor/react`) — in-browser code editor
- Axios
- Lucide React (icons)

**Backend**
- Node.js + Express 5
- MongoDB + Mongoose
- JWT (`jsonwebtoken`) — access/refresh token auth via HTTP-only cookies
- bcryptjs — password hashing
- Nodemailer — verification emails (Gmail SMTP)
- Docker (Docker CLI inside the backend container, talking to the host daemon) — sandboxed code execution
- `@google/genai` — AI-assisted code review
- `uuid`, `cors`, `cookie-parser`, `dotenv`

**Infrastructure / Deployment**
- **Backend**: AWS EC2 (Docker-in-Docker setup — the Node backend runs inside a container and spins up per-submission judge containers via the Docker CLI), managed with **PM2** for process persistence/auto-restart
- **Reverse proxy**: **Nginx** on the EC2 instance, proxying to the Node app
- **Domain**: **DuckDNS** for a free dynamic DNS hostname pointing at the EC2 instance, with Nginx handling the reverse proxy on top of it
- **Frontend**: **Vercel** (static Vite build, SPA rewrites configured in `vercel.json`)
- **Database**: MongoDB (Atlas or self-hosted, connected via `MONGO_URI`)

---

## Project Structure

```
OJtemp/
├── backend/
│   ├── Controllers/       # auth, admin, ai, compiler, contest, db (problems/testcases/submissions), profile
│   ├── Middlewares/       # authMiddleware (JWT cookie check), adminMiddleware (role check)
│   ├── Models/            # Users, Profile, Problems, TestCases, Solutions, Contest, ContestAttempt
│   ├── Routes/            # one router per controller, mounted under /api/*
│   ├── config/db.js       # Mongoose connection
│   ├── dockerfile         # backend image (installs Docker CLI to talk to host daemon)
│   └── server.js          # app entrypoint, route mounting, global error handler
└── frontend/
    ├── src/
    │   ├── components/    # AuthContext, shared UI
    │   └── pages/         # Authentication, Dashboard, Coder, Contests, Profile
    ├── vercel.json         # SPA rewrite rules
    └── vite.config.js
```

---

## Setup

### Prerequisites
- Node.js 20+
- MongoDB instance (local or Atlas)
- Docker installed and running (the backend shells out to the Docker CLI to sandbox-execute submitted code, so this is required even for local development)
- A Gmail account with an App Password (for outbound verification emails)
- A Google Gemini API key (for the AI review feature)

### 1. Clone the repo

```bash
git clone https://github.com/RajVaibhav85/OJtemp.git
cd OJtemp
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=your_mongodb_connection_string

# Auth
JWT_SECRET=your_jwt_access_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret

# CORS / cookies — must match the frontend's origin exactly
CLIENT_URL=http://localhost:5173

# Email (Nodemailer via Gmail)
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password

# AI code review
GEMINI_API_KEY=your_gemini_api_key

# Docker sandbox — absolute path on the HOST machine that maps to the
# container's working directory, needed because judge containers are
# started via the host Docker daemon (Docker-in-Docker style mount)
HOST_CODES_DIR=/absolute/path/to/backend/codes
```

Run the backend:

```bash
npm start
# Listening on http://localhost:5000
```

On startup, the server pre-pulls the Docker images used as judge sandboxes for each supported language (`gcc/alpine`, `python:3.11-alpine`, `node:20-alpine`, `eclipse-temurin:17-alpine`), so the first submission in each language isn't slowed down by an image pull.

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/`:

```env
VITE_SERVER_URL=http://localhost:5000
```

Run the frontend:

```bash
npm run dev
# Vite dev server on http://localhost:5173
```

---

## Deployment Notes

- **EC2 (backend)**: The backend runs as a Docker container, but since it needs to launch *other* sibling Docker containers to sandbox-execute user code, the host's Docker socket/CLI is exposed to it (Docker-in-Docker pattern) — this is why `HOST_CODES_DIR` must be an absolute path on the *host*, not inside the backend's own container filesystem.
- **PM2**: Used on the EC2 instance to keep the Node process (or the container entrypoint) alive across crashes and reboots, with log management.
- **Nginx**: Configured as a reverse proxy in front of the Node app on EC2, forwarding HTTP(S) traffic on port 80/443 to the app's internal port (5000), and terminating SSL if configured.
- **DuckDNS**: Provides a free subdomain (e.g. `yourapp.duckdns.org`) that resolves to the EC2 instance's IP, since EC2 public IPs change on instance restart unless an Elastic IP is attached. Nginx is configured to serve on that DuckDNS hostname.
- **Vercel (frontend)**: Deploys the Vite build directly from the repo; `vercel.json` rewrites all paths to `index.html` so React Router's client-side routing works on refresh/deep links.
- **CORS**: `CLIENT_URL` on the backend must exactly match the deployed frontend origin (protocol + domain, no trailing slash) since cookies are sent with `credentials: true`.

---

## API Endpoints

All routes are prefixed with `/api`. Protected routes require a valid `accessToken` HTTP-only cookie (set on login); admin routes additionally require the authenticated user's role to be `admin`.

### Health Check
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | — | Basic health check |

### Auth — `/api/auth`
| Method | Endpoint | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/register` | — | `{ username, email, password, dob, role? }` | Creates an unverified account, sends a verification email |
| POST | `/login` | — | `{ email, password }` | Logs in, sets `accessToken` / `refreshToken` cookies |
| POST | `/logout` | — | — | Clears auth cookies |
| POST | `/refresh` | — (uses `refreshToken` cookie) | — | Issues a new `accessToken` |
| GET | `/me` | ✅ | — | Returns the current authenticated user |
| GET | `/verify/:token` | — | — | Verifies email via the token sent at registration |
| POST | `/resend-verification` | — | `{ email }` | Resends the verification email |
| PUT | `/change-password` | ✅ | `{ currentPassword, newPassword }` | Changes the logged-in user's password |
| DELETE | `/delete-account` | ✅ | `{ password }` | Deletes the current account |

### Compiler — `/api/compiler`
| Method | Endpoint | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/run` | — | `{ language, code, input? }` | Runs code in an isolated Docker sandbox (`cpp`, `python`, `javascript`, `java`) and returns output/errors |

### AI — `/api/ai`
| Method | Endpoint | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/ai-review` | — | `{ code, language, description, input }` | Returns an AI-generated review of the submitted code (Gemini) |

### Problems, Test Cases & Submissions — `/api/db`
| Method | Endpoint | Auth | Body / Params | Description |
|---|---|---|---|---|
| PUT | `/insert-problem` | — | `{ name, statement, code, difficulty, description, sampleInput, sampleOutput, constraints, tags, createdBy }` | Creates a new problem |
| GET | `/get-problems` | — | query: `difficulty?, tags?, search?` | Lists problems, filterable |
| GET | `/get-problem/:code` | — | — | Fetches a single problem by its slug/code |
| PUT | `/update-problem/:code` | — | partial problem fields | Updates a problem |
| DELETE | `/delete-problem/:code` | — | — | Deletes a problem |
| POST | `/insert-testcases/:code` | — | `{ testCases }` | Adds test cases to a problem |
| GET | `/get-testcases/:code` | — | — | Gets all test cases for a problem |
| PUT | `/update-testcase/:id` | — | partial test case fields | Updates a single test case |
| DELETE | `/delete-testcase/:id` | — | — | Deletes a single test case |
| POST | `/submit-solution/:code` | — | `{ problemId, userId, code, language, contestId? }` | Submits a solution for judging |
| PUT | `/update-solution-verdict/:id` | — | `{ verdict, executionTime, memory, output, testsPassed, testsTotal }` | Updates a submission's verdict after judging |
| GET | `/latest-submission/:userId/:problemId` | — | — | Gets a user's latest submission for a problem |
| GET | `/user-submissions/:userId` | — | — | Gets all of a user's submissions |
| GET | `/problem-submissions/:userId/:problemId` | — | — | Gets a user's submission history for a specific problem |

### Contests — `/api/contests`
| Method | Endpoint | Auth | Body / Params | Description |
|---|---|---|---|---|
| GET | `/` | — | — | Lists all contests |
| GET | `/:id` | — | — | Gets a single contest's details |
| GET | `/:id/leaderboard` | — | — | Gets the contest leaderboard |
| GET | `/:id/evaluation/:userId` | — | — | Gets a specific user's evaluation/results for a contest |
| POST | `/:id/join` | ✅ | `{ userId }` | Joins/starts a contest attempt |
| POST | `/:id/finish` | ✅ | `{ userId }` | Finishes/submits the current contest attempt |
| POST | `/` | ✅ Admin | `{ title, description, startTime, endTime, selectionMode, problemIds, randomCount, difficulty, tags }` | Creates a contest (handpicked or randomly-selected problems) |
| PUT | `/:id` | ✅ Admin | partial contest fields | Updates a contest |
| DELETE | `/:id` | ✅ Admin | — | Deletes a contest and its attempts |

### Profile — `/api/profile`
| Method | Endpoint | Auth | Body | Description |
|---|---|---|---|---|
| GET | `/get-profile` | ✅ | — | Gets the current user's profile and stats |
| PUT | `/update-profile` | ✅ | `{ bio, github, linkedin, website, languages, frameworks }` | Updates the current user's profile |

### Admin — `/api/admin`
| Method | Endpoint | Auth | Body / Params | Description |
|---|---|---|---|---|
| GET | `/users` | ✅ Admin | — | Lists all users with role/activity info |
| GET | `/activity` | ✅ Admin | — | Recent platform activity feed |
| PUT | `/users/:id/role` | ✅ Admin | `{ role }` | Promotes/revokes a user's admin role |

---

## Supported Judge Languages

| Language | Runtime image |
|---|---|
| C++ | `frolvlad/alpine-gxx:latest` |
| Python | `python:3.11-alpine` |
| JavaScript | `node:20-alpine` |
| Java | `eclipse-temurin:17-alpine` |

---

## Notes

- Auth uses short-lived access tokens + a longer-lived refresh token, both delivered as HTTP-only cookies — the frontend never touches the raw tokens directly.
- Contest scoring follows ICPC-style rules: solve time plus a fixed penalty per wrong attempt before an eventual accept.
- Every submission is stored as its own document (not upserted per user/problem/language), so full submission history is preserved per user per problem.

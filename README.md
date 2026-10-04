# LivePoll 🗳️

A real-time audience polling tool. Create a poll, share the link, watch votes arrive live — no page refresh needed.

**Live demo:** https://votingsystem-sage.vercel.app/signup

---

## Tech stack

| Layer    | Technology          | What it actually does                                                                  |
|----------|---------------------|----------------------------------------------------------------------------------------|
| Frontend | React 18 + Vite     | SPA with React Router, Tailwind CSS, SSE subscription for live updates                 |
| Backend  | Go 1.21 + Gin       | REST API, JWT auth, input validation, SSE fan-out, graceful shutdown                   |
| Database | MongoDB 7           | Durable storage for users, polls, votes; unique indexes prevent duplicate registrations |
| Realtime | Redis 7             | Hash counters (`HINCRBY`) for atomic vote counting; Pub/Sub to push results to SSE listeners |

---

## Project structure

```
/
├── backend/                    Go service
│   ├── cmd/main.go             Entry point — wires everything together
│   └── internal/
│       ├── auth/               JWT generation and parsing
│       ├── config/             Environment variable loading
│       ├── handlers/           HTTP handlers (auth, poll, SSE stream)
│       ├── middleware/         JWT auth middleware
│       ├── models/             Domain types (User, Poll, PollResult, …)
│       ├── realtime/           Redis wrapper — vote counters + pub/sub
│       ├── repository/         MongoDB data access (users, polls, votes)
│       └── services/           Business logic (auth, poll creation, voting)
│
├── frontend/                   React app
│   └── src/
│       ├── api/                Axios client + typed endpoint wrappers
│       ├── components/         Navbar, ResultBar, LiveBadge, ProtectedRoute
│       ├── context/            AuthContext (JWT + user stored in localStorage)
│       ├── hooks/              useLiveResults (SSE), useFingerprint
│       ├── pages/              HomePage, LoginPage, SignupPage,
│       │                       CreatePollPage, VotePage, DashboardPage
│       └── types/              Shared TypeScript interfaces
│
├── docker-compose.yml          Full stack in one command
├── .env.example                Config template
└── README.md
```

---

## How to run

### Option A — Docker Compose (recommended)

```bash
# 1. Copy the env template and fill in your JWT secret
cp .env.example .env

# 2. Start everything (MongoDB, Redis, backend, frontend/Nginx)
docker compose up --build

# 3. Open http://localhost
```

The frontend is served by Nginx on port 80. It proxies `/api/*` to the Go backend on port 8080, which means the SSE stream also goes through Nginx with `proxy_buffering off`.

### Option B — Local development (no Docker)

**Prerequisites:** Go 1.21+, Node.js 20+, MongoDB running on 27017, Redis running on 6379.

```bash
# Backend
cd backend
cp .env.example .env        # edit JWT_SECRET at minimum
go run ./cmd/main.go

# Frontend (separate terminal)
cd frontend
npm install
npm run dev                  # Vite dev server on :5173, proxies /api → :8080
```

Open http://localhost:5173.

---

## API reference (brief)

| Method | Path                      | Auth? | Description                          |
|--------|---------------------------|-------|--------------------------------------|
| POST   | /api/auth/signup          | ✗     | Register — returns JWT               |
| POST   | /api/auth/login           | ✗     | Login — returns JWT                  |
| POST   | /api/polls                | ✓     | Create poll                          |
| GET    | /api/polls/my             | ✓     | My polls (with live vote counts)     |
| GET    | /api/polls/:id            | ✗     | Get poll + live counts               |
| POST   | /api/polls/:id/vote       | ✗     | Cast vote                            |
| GET    | /api/polls/:id/results    | ✗     | Current results snapshot             |
| GET    | /api/polls/:id/stream     | ✗     | **SSE stream** — live result updates |
| GET    | /api/polls/:id/voted      | ✗     | Check if already voted               |
| PATCH  | /api/polls/:id/active     | ✓     | Open / close poll (owner only)       |
| DELETE | /api/polls/:id            | ✓     | Delete poll (owner only)             |

---

## Key design decisions

### Why SSE over WebSockets?
SSE is one-directional (server → client) which is exactly what live results need. It uses plain HTTP/1.1, traverses proxies and CDNs without special configuration, and browsers auto-reconnect. WebSockets would add bidirectional complexity with no benefit here.

### Redis as source-of-truth for vote counts
Every vote does two things atomically:
1. `HINCRBY poll:votes:<pollID> <optionID> 1` in Redis — the live counter
2. `$inc` on the matching subdocument in MongoDB — the durable backup

When a result is requested (REST or SSE), counts are read from Redis hashes. MongoDB is the recovery layer if Redis is cold-started: on first request, the service seeds Redis from Mongo counts. This means Redis is doing real work on every vote and every read — not just sitting alongside Mongo.

### Vote deduplication
Anonymous voters are identified by a browser fingerprint (random 128-bit UUID stored in `localStorage`) sent as `X-Voter-Fingerprint`. A compound unique index on `(poll_id, voter_key, option_id)` in the `votes` collection makes double-voting impossible at the database level, independent of application logic.

### Backend validation
Every payload is validated by Go's `binding:` struct tags (Gin uses `go-playground/validator` under the hood). Invalid inputs never reach the database. Specific checks:
- Signup: username 3–30 chars, valid email, password ≥ 8 chars
- Create poll: title 3–200 chars, 2–10 options, each option 1–100 chars, no duplicates, future end time
- Vote: 1–10 option IDs, must exist in the poll, single/multiple enforced

### JWT auth
72-hour HS256 tokens. The `RequireAuth` middleware rejects requests with missing, malformed, or expired tokens before they reach any handler. Poll creation and management require a valid token; viewing and voting do not (to allow audience members to participate without accounts).

### Separation of concerns
- `repository` layer: only MongoDB queries, no business logic
- `services` layer: orchestrates repositories + Redis, enforces rules
- `handlers` layer: HTTP concerns only — parse, call service, respond
- `realtime` package: all Redis operations in one place

---

## Deployment notes

For production, set these environment variables:

```
JWT_SECRET=<64-char random string>
ALLOW_ORIGIN=https://yourdomain.com
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net
REDIS_ADDR=your-redis-host:6379
REDIS_PASSWORD=your-redis-password
```

The frontend build bakes in `VITE_API_URL` at build time. For same-origin deployments (Nginx proxy), leave it empty. For split deployments (frontend on Vercel, backend on Fly.io), set `VITE_API_URL=https://api.yourdomain.com`.

# StudySync — AI Study Planner

A full-stack MERN app that generates personalized AI study schedules and tracks academic progress for a small group of students.

> **Build status:** under active, phase-by-phase construction. See [Build Progress](#build-progress) below.

[![CI](https://github.com/nakwafurkhan/StudySync/actions/workflows/ci.yml/badge.svg)](https://github.com/nakwafurkhan/StudySync/actions/workflows/ci.yml)

## Features

- **Auth** — register/login with bcrypt + JWT in an httpOnly cookie, protected routes.
- **Subjects** — track courses with deadlines and priority (color-coded high/medium/low).
- **AI study schedules** — Groq generates a validated day-by-day plan from your subjects + daily budget, with retry + deterministic fallback.
- **Session logging & analytics** — log study time; see hours/week, plan adherence, a **study streak**, and a **daily focus-goal ring**.
- **Academic calendar** — a month view of exams, assignment deadlines, and your AI study blocks, all color-coded.
- **Syllabus import** — drop in a PDF (or paste text / public URL); the AI extracts exams, deadlines, and weights, and you bulk-add them to the calendar.
- **"Recall" UI** — a dark, flashcard-deck-inspired theme with Framer Motion polish.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite 5, Tailwind CSS, Framer Motion, React Router v6, Axios, Recharts |
| Backend | Node.js, Express 4, Mongoose 8, MongoDB Atlas, JWT + bcrypt, Groq API, pdf-parse, multer |
| Hardening | express-rate-limit, gzip compression, helmet |
| Testing | Jest + Supertest (backend), Jest + React Testing Library (frontend), 75% coverage target |
| Deploy | Backend → Render, Frontend → Vercel, DB → MongoDB Atlas |
| CI/CD | GitHub Actions (lint, test, build on PR; deploy on merge to main) |

## Repository Structure

```
studysync/
├── backend/                  # Express + Mongoose API
│   ├── src/
│   │   ├── models/           # Mongoose schemas (User)
│   │   ├── routes/           # health, auth
│   │   ├── controllers/      # auth.controller
│   │   ├── middleware/       # auth guard, rate limiters, error handler
│   │   ├── services/         # OpenAI integration (Phase 4)
│   │   ├── utils/            # token helpers
│   │   ├── config/           # db connection
│   │   └── app.js            # Express app (no listen — testable)
│   └── tests/                # Jest + Supertest (in-memory Mongo)
├── frontend/                 # React + Vite SPA
│   ├── src/
│   │   ├── components/       # ProtectedRoute, Navbar
│   │   ├── pages/            # Login, Register, Dashboard
│   │   ├── context/          # AuthContext
│   │   ├── services/         # axios api client
│   │   └── App.jsx
│   └── tests/                # Jest + React Testing Library
├── .github/workflows/        # CI/CD (added in Phase 8)
└── README.md
```

## Backend — Local Development

```bash
cd backend
cp .env.example .env        # then fill in values
npm install
npm run dev                 # http://localhost:5000
```

Health check: `GET http://localhost:5000/api/health` → `{ "status": "ok", "db": "connected", ... }`

### Backend scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start with nodemon (auto-reload) |
| `npm start` | Start the server |
| `npm test` | Run the Jest suite |
| `npm run test:coverage` | Run tests with a coverage report |
| `npm run lint` | Lint with ESLint |

## Frontend — Local Development

```bash
cd frontend
cp .env.example .env        # set VITE_API_URL
npm install
npm run dev                 # http://localhost:5173
```

### Frontend scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build (`dist/`) |
| `npm run preview` | Preview the production build |
| `npm test` | Run the Jest + RTL suite |
| `npm run test:coverage` | Run tests with a coverage report |
| `npm run lint` | Lint with ESLint |

## Authentication Model

- Passwords are hashed with **bcrypt**; only the hash is stored (and never returned in API responses).
- On register/login the API issues a **JWT in an httpOnly cookie** (not localStorage), so it isn't readable by JavaScript.
- The cookie is `SameSite=Lax` in development and `SameSite=None; Secure` in production — required for the cross-site Vercel ⇄ Render setup. CORS runs with `credentials: true`, and Axios uses `withCredentials: true`.
- The React `AuthContext` resolves the session by calling `GET /api/auth/me` on load; `ProtectedRoute` guards private pages.
- Auth endpoints are rate-limited (10 requests / 15 min) on top of the loose global limiter.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | — | Health probe |
| POST | `/api/auth/register` | — | Create account, set cookie |
| POST | `/api/auth/login` | — | Log in, set cookie |
| GET | `/api/auth/me` | ✅ | Current user |
| POST | `/api/auth/logout` | ✅ | Clear cookie |
| GET | `/api/subjects` | ✅ | List the user's subjects |
| POST | `/api/subjects` | ✅ | Create a subject |
| PUT | `/api/subjects/:id` | ✅ | Update an owned subject |
| DELETE | `/api/subjects/:id` | ✅ | Delete an owned subject |
| POST | `/api/schedule/generate` | ✅ | Generate + save an AI study plan |
| GET | `/api/schedule/current` | ✅ | Most recent study plan |
| POST | `/api/sessions` | ✅ | Log a study session (owned subject) |
| GET | `/api/sessions` | ✅ | List sessions (optional `?subjectId`) |
| GET | `/api/analytics/summary` | ✅ | Progress analytics (hours/week, adherence, deadlines, streak, today's minutes) |
| GET | `/api/calendar` | ✅ | Calendar events in a range (`?from&to`) + study-plan overlay |
| POST | `/api/calendar` | ✅ | Create a calendar event |
| DELETE | `/api/calendar/:id` | ✅ | Delete an owned event |
| POST | `/api/syllabus/parse` | ✅ | Extract events from a PDF / text / public URL (preview) |
| POST | `/api/syllabus/import` | ✅ | Bulk-create calendar events from reviewed items |

### AI schedule generation

`POST /api/schedule/generate` takes `{ dailyHours, startDate? }`, pulls the user's subjects, and asks **Groq** (OpenAI-compatible, default model `llama-3.3-70b-versatile`) for a strict JSON day-by-day plan (`response_format: json_object`). The response is **validated and sanitized** — hallucinated subjects are dropped, non-positive hours removed, and each day clamped to the daily budget. On malformed output it **retries once**, then falls back to a deterministic even-split schedule so the endpoint never hard-fails (the saved plan records `source: "groq" | "fallback"`). The Groq key is read server-side only.

### Academic calendar & syllabus import

The calendar (`GET /api/calendar`) returns saved events (exam / assignment / deadline) within a date range and **overlays the latest study plan's blocks** as read-only `study` events, so study time and exams live in one view. The syllabus importer turns a **PDF** (parsed with `pdf-parse`), **pasted text**, or a **public URL** into structured items via Groq (`POST /api/syllabus/parse`, preview only), which you review and selectively `import` as calendar events (weights captured, dateless items skipped). LMS pages behind a login can't be fetched — export the PDF or paste the text.

## Environment Variables

Secrets are **never** committed. Copy each `.env.example` → `.env`.

**Backend** (`backend/.env`)

| Variable | Phase | Description |
|----------|-------|-------------|
| `PORT` | 1 | API port (default 5000) |
| `NODE_ENV` | 1 | `development` / `production` / `test` |
| `CLIENT_URL` | 1 | Frontend origin, for CORS |
| `MONGO_URI` | 1 | MongoDB Atlas connection string |
| `JWT_SECRET` | 2 | Secret for signing JWTs (use a long random string) |
| `JWT_EXPIRES_IN` | 2 | Token lifetime (e.g. `7d`) |
| `GROQ_API_KEY` | 4 | Groq API key (server-side only) |
| `GROQ_MODEL` | 4 | Model name (default `llama-3.3-70b-versatile`) |

**Frontend** (`frontend/.env`)

| Variable | Phase | Description |
|----------|-------|-------------|
| `VITE_API_URL` | 2 | Base URL of the backend API (e.g. `http://localhost:5000/api`) |

## Testing

- **Backend:** 85 tests — auth, subjects, schedule, sessions, analytics, calendar, and syllabus routes (integration on an in-memory MongoDB, incl. ownership isolation), plus the AI schedule + syllabus validators/fallback/retry and the analytics builder (unit). Coverage ~90%+.
- **Frontend:** 46 tests — auth flow, subjects, schedule, sessions, dashboard analytics, the calendar board, and the syllabus importer (services with api mocked; components with services/Recharts/framer-motion mocked). Coverage ~90%+ lines.
- Coverage thresholds are enforced in each `jest.config`.

## Build Progress

- [x] **Phase 1** — Repo scaffold, Express server, MongoDB connection, health check
- [x] **Phase 2** — Authentication (JWT, bcrypt, httpOnly cookie, route guards, rate limiting) + frontend scaffold
- [x] **Phase 3** — Subject CRUD (backend + frontend, ownership-scoped, indexed)
- [x] **Phase 4** — AI schedule generation via Groq (validate + sanitize + retry/fallback)
- [x] **Phase 5** — Schedule view + session logging (sessions API, generate UI, logger)
- [x] **Phase 6** — Analytics + dashboard charts (hours/week, adherence, deadline countdowns)
- [x] **Phase 7** — Framer Motion polish (page transitions, list entrance, progress-bar fills)
- [x] **Phase 8** — GitHub Actions CI/CD + Render blueprint + Vercel config
- [~] **Phase 9** — Deploy (Atlas + Render + Vercel) — in progress
- [ ] **Phase 10** — Final hardening pass

**Beyond the original plan:** "Recall" dark theme re-skin · study streak + daily focus-goal ring · priority color-coding · academic calendar (month view + study-plan overlay) · AI syllabus import (PDF / text / URL → exams, deadlines, weights).

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on every push/PR to `main`:

- **Backend job:** `npm ci` → lint → `test:coverage` (75% gate enforced)
- **Frontend job:** `npm ci` → lint → `test:coverage` → `vite build`
- **Deploy job** (only on push to `main`, after both pass): triggers the Render deploy hook if `RENDER_DEPLOY_HOOK_URL` is set. Vercel auto-deploys the frontend from GitHub.

## Deployment

Three pieces: **MongoDB Atlas** (database) · **Render** (backend API) · **Vercel** (frontend).

### 1. MongoDB Atlas
1. Create a free **M0** cluster at cloud.mongodb.com.
2. Add a database user (username + password).
3. Network Access → allow `0.0.0.0/0` (Render's free-tier egress IPs are dynamic).
4. Copy the connection string → this is `MONGO_URI`, e.g. `mongodb+srv://user:pass@cluster.mongodb.net/studysync?retryWrites=true&w=majority`.

### 2. Backend → Render (Blueprint)
1. Render → **New → Blueprint**, pick this repo. It reads `render.yaml` and provisions `studysync-api` (root dir `backend`, health check `/api/health`).
2. Provide the `sync: false` env vars when prompted: `MONGO_URI`, `GROQ_API_KEY`, `CLIENT_URL` (your Vercel URL — fill after step 3 and redeploy). `JWT_SECRET` is auto-generated.
3. Note the API URL, e.g. `https://studysync-api.onrender.com`.
4. *(Optional auto-deploy)* Settings → **Deploy Hook** → copy the URL → add it as the GitHub Actions secret `RENDER_DEPLOY_HOOK_URL` (repo Settings → Secrets → Actions).

### 3. Frontend → Vercel
1. Vercel → **Add New → Project**, import this repo.
2. Set **Root Directory = `frontend`**. Vite is auto-detected; `vercel.json` supplies the security headers, asset caching, and SPA rewrite.
3. Add env var `VITE_API_URL = https://studysync-api.onrender.com/api`.
4. Deploy (auto-deploys on every push to `main`).
5. Back in Render, set `CLIENT_URL` to the Vercel URL (for CORS + cookies) and redeploy.

> **Cross-site cookies:** frontend (Vercel) and backend (Render) live on different domains, so the auth cookie uses `SameSite=None; Secure` in production — both are HTTPS, so it works.

### Secrets / env summary
| Where | Variables |
|-------|-----------|
| Render | `MONGO_URI`, `GROQ_API_KEY`, `CLIENT_URL` (+ auto `JWT_SECRET`) |
| Vercel | `VITE_API_URL` |
| GitHub Actions (optional) | `RENDER_DEPLOY_HOOK_URL` |

## License

MIT

# StudySync — AI Study Planner

A full-stack MERN app that generates personalized AI study schedules and tracks academic progress for a small group of students.

> **Build status:** under active, phase-by-phase construction. See [Build Progress](#build-progress) below.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite 5, Tailwind CSS, Framer Motion, React Router v6, Axios |
| Backend | Node.js, Express 4, Mongoose 8, MongoDB Atlas, JWT + bcrypt, Groq API |
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

_(Sessions and analytics endpoints arrive in Phases 5–6.)_

### AI schedule generation

`POST /api/schedule/generate` takes `{ dailyHours, startDate? }`, pulls the user's subjects, and asks **Groq** (OpenAI-compatible, default model `llama-3.3-70b-versatile`) for a strict JSON day-by-day plan (`response_format: json_object`). The response is **validated and sanitized** — hallucinated subjects are dropped, non-positive hours removed, and each day clamped to the daily budget. On malformed output it **retries once**, then falls back to a deterministic even-split schedule so the endpoint never hard-fails (the saved plan records `source: "groq" | "fallback"`). The Groq key is read server-side only.

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

- **Backend:** 49 tests — auth middleware, auth + subjects + schedule routes (integration on an in-memory MongoDB), the AI schedule validator/fallback/retry logic (Groq mocked), health, db, error handler. Coverage ~94%.
- **Frontend:** 18 tests — Login, Register, ProtectedRoute, App/Navbar, subjects service, and SubjectManager (add/list/delete). Coverage ~97% lines.
- Coverage thresholds are enforced in each `jest.config`.

## Build Progress

- [x] **Phase 1** — Repo scaffold, Express server, MongoDB connection, health check
- [x] **Phase 2** — Authentication (JWT, bcrypt, httpOnly cookie, route guards, rate limiting) + frontend scaffold
- [x] **Phase 3** — Subject CRUD (backend + frontend, ownership-scoped, indexed)
- [x] **Phase 4** — OpenAI schedule generation (validate + sanitize + retry/fallback)
- [ ] **Phase 5** — Schedule view + session logging
- [ ] **Phase 6** — Analytics + dashboard charts
- [ ] **Phase 7** — Framer Motion polish
- [ ] **Phase 8** — GitHub Actions CI/CD
- [ ] **Phase 9** — Deploy (Atlas + Render + Vercel)
- [ ] **Phase 10** — Final hardening pass

## License

MIT

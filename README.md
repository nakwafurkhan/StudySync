<div align="center">

# 🂡 StudySync

### AI Study Planner & Academic Calendar

**A full-stack MERN app that turns your subjects, deadlines, and syllabi into an
AI-generated study plan, a unified academic calendar, and progress analytics —
wrapped in a dark, flashcard-deck-inspired UI, fully tested, and shipped with CI/CD.**

[![CI](https://github.com/nakwafurkhan/StudySync/actions/workflows/ci.yml/badge.svg)](https://github.com/nakwafurkhan/StudySync/actions/workflows/ci.yml)
[![Stack](https://img.shields.io/badge/Stack-MERN-6366F1?style=flat-square)](https://www.mongodb.com/mern-stack)
[![AI](https://img.shields.io/badge/AI-Llama_3.3_70B_(Groq)-8B5CF6?style=flat-square)](https://groq.com)
[![Tests](https://img.shields.io/badge/Tests-133_passing-10B981?style=flat-square)](#-testing--cicd)
[![License](https://img.shields.io/badge/License-MIT-F59E0B?style=flat-square)](./LICENSE)
[![Author](https://img.shields.io/badge/Author-@nakwafurkhan-1f2937?style=flat-square&logo=github)](https://github.com/nakwafurkhan)

[**▶ Live Demo**](https://study-sync-olive.vercel.app) ·
[**🐛 Report Bug**](https://github.com/nakwafurkhan/StudySync/issues)

</div>

---

## 🚀 How to use it

### Option A — Live demo (30 seconds)

> 🔗 **Open the app**: **[study-sync-olive.vercel.app](https://study-sync-olive.vercel.app)**
>
> 🧪 **Demo account** (tap "Try the demo" on the login screen, or type it):
>   - **Email**: `demo@studysync.app`
>   - **Password**: `demo1234`
>
> The demo account is seeded with subjects, two weeks of study sessions, an AI
> study plan, and a calendar of exams and deadlines — so the dashboard,
> calendar, and analytics are populated immediately.

> ⏱ **First load**: the backend is on Render's free tier and sleeps after 15
> minutes of inactivity, so the first request (login) can take ~30–50s while
> the server wakes up. Subsequent calls are fast.

### Option B — Run it locally (5 minutes)

You'll need **Node 18+** (see `.nvmrc`), **npm**, and a free **MongoDB Atlas** cluster.

```bash
git clone https://github.com/nakwafurkhan/StudySync.git
cd StudySync

# Backend (terminal 1)
cd backend
cp .env.example .env        # set MONGO_URI, JWT_SECRET, GROQ_API_KEY
npm install
npm run seed                # optional: load the demo account + sample data
npm run dev                 # → http://localhost:5000

# Frontend (terminal 2)
cd frontend
echo "VITE_API_URL=http://localhost:5000/api" > .env
npm install
npm run dev                 # → http://localhost:5173
```

---

## ✨ Features

### Core
- 🔒 **Secure auth** — register/login, bcrypt-hashed passwords, **JWT in an httpOnly cookie** (not localStorage), route guards on API + SPA, auth rate limiting
- 📚 **Subjects** — full CRUD with deadlines and **priority color-coding** (high/medium/low)
- ⏱️ **Session logging & progress** — log study time; track plan adherence per subject
- 📊 **Analytics dashboard** — hours per week (Recharts), adherence bars, deadlines at risk, a **study streak**, and a **daily focus-goal ring**, computed server-side with **MongoDB aggregation pipelines** (`$group` · `$dateTrunc` · `$lookup` · `$facet`)

### AI (Groq · Llama 3.3 70B)
- 🤖 **AI study schedules** — generates a day-by-day plan from your subjects + daily budget; the JSON is **validated, sanitized, retried, and falls back** to a deterministic plan so it never hard-fails
- 💬 **AI study assistant** — a chat grounded in your subjects, sessions, plan, and calendar
- 🔌 **Provider-agnostic** — built on an OpenAI-compatible client; swap providers via env vars

### Calendar & Import
- 🗓️ **Academic calendar** — month view of exams, assignment deadlines, and your AI study blocks, color-coded in one place
- 📥 **Syllabus importer** — drop in a **PDF** (or paste text / public URL); the AI extracts exams, deadlines, and weights, and you review + bulk-add them to the calendar

### Polish
- 🎨 **"Recall" theme** — dark, flashcard-deck aesthetic (Bricolage Grotesque + Public Sans + JetBrains Mono)
- 🎬 **Framer Motion** — page transitions, staggered lists, animated rings/bars
- ✅ **133 automated tests** + **GitHub Actions CI/CD**

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| **Frontend** | React 18, Vite 5, Tailwind CSS 3, React Router 6, Axios, Recharts, Framer Motion |
| **Backend** | Node.js, Express 4, Mongoose 8, MongoDB Atlas, JWT, bcryptjs, helmet, compression, express-rate-limit, pdf-parse, multer |
| **AI** | Groq SDK · Llama 3.3 70B · JSON mode with validation + retry + fallback |
| **Testing** | Jest + Supertest (backend, in-memory Mongo) · Jest + React Testing Library (frontend) |
| **CI/CD** | GitHub Actions — lint, test w/ coverage, build on every PR; Render deploy hook on merge |
| **Hosting** | Vercel (frontend) · Render (backend) · MongoDB Atlas (database) |

---

## 🏗️ Architecture

```
                ┌──────────────────────────┐
                │        Browser           │
                └────────────┬─────────────┘
                             │ HTTPS + httpOnly cookie
                ┌────────────▼─────────────┐
                │   Vercel (React + Vite)  │
                └────────────┬─────────────┘
                             │ /api/* (Axios, withCredentials)
                ┌────────────▼─────────────┐
                │      Render (Node)       │
                │  Express + middleware    │
                │  ┌────────────────────┐  │      ┌─────────────────┐
                │  │ protect (JWT)      │  │      │  Groq (Llama 3.3)│
                │  │ controllers        │──┼─────▶│  schedule +      │
                │  │ services (AI)      │  │      │  syllabus extract│
                │  └─────────┬──────────┘  │      └─────────────────┘
                └────────────┼─────────────┘
                             │ Mongoose
                ┌────────────▼─────────────┐
                │       MongoDB Atlas      │
                │  User · Subject · Plan   │
                │  Session · CalendarEvent │
                └──────────────────────────┘
```

The AI services send the model only a compact, validated context (your subject
names, deadlines, daily budget, or syllabus text) and sanitize every response.

---

## 📁 Project Structure

```
studysync/
├── backend/                  # Express + Mongoose API (→ Render)
│   ├── src/
│   │   ├── models/           # User, Subject, StudyPlan, StudySession, CalendarEvent
│   │   ├── routes/           # health, auth, subjects, schedule, sessions, analytics, calendar, syllabus
│   │   ├── controllers/      # one per resource
│   │   ├── middleware/       # auth guard, rate limiters, error handler
│   │   ├── services/         # groqClient, schedule, syllabus, analytics builders
│   │   ├── utils/            # token helpers
│   │   ├── config/db.js      # Mongoose connection
│   │   └── app.js            # Express app (no listen() — testable)
│   ├── tests/                # Jest + Supertest (in-memory Mongo)
│   └── seed.js               # demo account + sample data (npm run seed)
├── frontend/                 # React + Vite SPA (→ Vercel)
│   └── src/
│       ├── components/        # Navbar, ProtectedRoute, CalendarBoard, SyllabusImport, …
│       ├── pages/             # Login, Register, Dashboard, Subjects, Schedule, Sessions, Calendar, Import
│       ├── context/           # AuthContext
│       ├── services/          # Axios client + per-resource modules
│       └── App.jsx
├── .github/workflows/ci.yml  # CI/CD
├── render.yaml               # Render Blueprint
├── LICENSE · CHANGELOG.md · CONTRIBUTING.md · .nvmrc
└── README.md
```

---

## 🔐 Environment Variables

Secrets are **never** committed. Copy each `.env.example` → `.env`.

**Backend** (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `PORT` | API port (default 5000) |
| `NODE_ENV` | `development` / `production` / `test` |
| `CLIENT_URL` | Frontend origin, for CORS (exact, no trailing slash) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Long random string (`openssl rand -hex 32`) |
| `JWT_EXPIRES_IN` | Token lifetime, default `7d` |
| `GROQ_API_KEY` | Groq key (server-side only) |
| `GROQ_MODEL` | Model name, default `llama-3.3-70b-versatile` |

**Frontend** (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL — **must end in `/api`** (e.g. `https://your-api.onrender.com/api`) |

---

## 🌐 API Reference

All routes except `register` / `login` / `health` require the auth cookie.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Liveness probe |
| `POST` | `/api/auth/register` · `/login` | Auth; sets httpOnly cookie |
| `GET` / `POST` | `/api/auth/me` · `/logout` | Current user / clear cookie |
| `GET POST PUT DELETE` | `/api/subjects[/:id]` | Subject CRUD (ownership-scoped) |
| `POST` | `/api/schedule/generate` | Generate + save an AI study plan |
| `GET` | `/api/schedule/current` | Most recent plan |
| `POST` / `GET` | `/api/sessions` | Log / list study sessions |
| `GET` | `/api/analytics/summary` | Hours/week, adherence, deadlines, streak, today's minutes |
| `GET POST DELETE` | `/api/calendar[/:id]` | Calendar events + study-plan overlay |
| `POST` | `/api/syllabus/parse` · `/import` | Extract syllabus → preview → bulk-add to calendar |
| `GET` | `/api/export/sessions.csv` · `/calendar.csv` · `/report.pdf` | Download CSV / branded PDF exports |
| `POST` | `/api/assistant/chat` | Chat with the AI study assistant (grounded in your data) |

---

## 🧪 Testing & CI/CD

> Unlike many portfolio projects, StudySync ships with a real test suite **and** CI.

- **Backend — 87 tests** (Jest + Supertest): auth, subjects, schedule, sessions,
  analytics, calendar, and syllabus routes run as integration tests against an
  **in-memory MongoDB**; the AI schedule/syllabus validators and analytics
  builder are unit-tested with the model mocked. ~90% coverage.
- **Frontend — 46 tests** (Jest + React Testing Library): auth flow, every
  feature's service + component, with Axios/Recharts/Framer Motion mocked.
- **GitHub Actions** runs lint → test (coverage-gated) → build on every push/PR,
  and fires a Render deploy hook on merge to `main`. Vercel auto-deploys the frontend.

```bash
cd backend  && npm run test:coverage
cd frontend && npm run test:coverage
```

---

## 🚢 Deployment

**MongoDB Atlas** (DB) → **Render** (backend) → **Vercel** (frontend).

1. **Atlas** — free M0 cluster; Network Access `0.0.0.0/0`; copy the connection string → `MONGO_URI`.
2. **Render** — New → Blueprint (reads `render.yaml`) or Web Service with root dir `backend`, build `npm ci`, start `npm start`, health check `/api/health`. Set `MONGO_URI`, `GROQ_API_KEY`, `CLIENT_URL`; `JWT_SECRET` auto-generates. Run `npm run seed` once to load the demo account.
3. **Vercel** — import repo, **root dir `frontend`**, set `VITE_API_URL = https://<render-url>/api`, deploy. Then set `CLIENT_URL` on Render to the exact Vercel origin and redeploy.

> **Cross-site cookies**: the auth cookie uses `SameSite=None; Secure` in
> production (Vercel ⇄ Render), so both must be HTTPS — which they are.

---

## 👤 Author

<div align="center">

### Nakwa Furkhan
**Full-stack developer · MERN**

[![GitHub](https://img.shields.io/badge/GitHub-@nakwafurkhan-1f2937?style=for-the-badge&logo=github)](https://github.com/nakwafurkhan)

StudySync is a full-stack portfolio project — designed, engineered, tested, and
deployed end-to-end: JWT auth, AI integration with graceful fallbacks, a
month-grid calendar, PDF syllabus extraction, an analytics dashboard, a real
test suite, and CI/CD.

If you found it useful, please ⭐ the repo.

</div>

## 📄 License

[MIT](./LICENSE) © 2026 Nakwa Furkhan

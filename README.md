# StudySync — AI Study Planner

A full-stack MERN app that generates personalized AI study schedules and tracks academic progress for a small group of students.

> **Build status:** under active, phase-by-phase construction. See [Build Progress](#build-progress) below.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite 5, Tailwind CSS, Framer Motion, React Router v6, Axios |
| Backend | Node.js, Express 4, Mongoose 8, MongoDB Atlas, JWT + bcrypt, OpenAI API |
| Hardening | express-rate-limit, gzip compression, helmet |
| Testing | Jest + Supertest (backend), Jest + React Testing Library (frontend), 75% coverage target |
| Deploy | Backend → Render, Frontend → Vercel, DB → MongoDB Atlas |
| CI/CD | GitHub Actions (lint, test, build on PR; deploy on merge to main) |

## Repository Structure

```
studysync/
├── backend/          # Express + Mongoose API
│   ├── src/
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # Express routers
│   │   ├── controllers/   # Request handlers
│   │   ├── middleware/    # auth, error handling, rate limiting
│   │   ├── services/      # OpenAI integration
│   │   ├── config/        # db connection, env
│   │   └── app.js         # Express app (no listen — testable)
│   └── tests/             # Jest + Supertest
├── frontend/         # React + Vite SPA  (added in Phase 2)
├── .github/workflows/    # CI/CD          (added in Phase 8)
└── README.md
```

## Backend — Local Development

```bash
cd backend
cp .env.example .env        # then fill in values
npm install
npm run dev                 # starts on http://localhost:5000
```

Health check: `GET http://localhost:5000/api/health` →

```json
{ "status": "ok", "service": "studysync-backend", "db": "connected", "uptime": 1.23 }
```

### Backend scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start with nodemon (auto-reload) |
| `npm start` | Start the server |
| `npm test` | Run the Jest suite |
| `npm run test:coverage` | Run tests with a coverage report |
| `npm run lint` | Lint with ESLint |

## Environment Variables

Secrets are **never** committed. Copy `backend/.env.example` → `backend/.env`.

| Variable | Phase | Description |
|----------|-------|-------------|
| `PORT` | 1 | API port (default 5000) |
| `NODE_ENV` | 1 | `development` / `production` / `test` |
| `CLIENT_URL` | 1 | Frontend origin, for CORS |
| `MONGO_URI` | 1 | MongoDB Atlas connection string |
| `JWT_SECRET` | 2 | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | 2 | Token lifetime (e.g. `7d`) |
| `OPENAI_API_KEY` | 4 | OpenAI key (server-side only) |
| `OPENAI_MODEL` | 4 | Model name (e.g. `gpt-4o-mini`) |

## Build Progress

- [x] **Phase 1** — Repo scaffold, Express server, MongoDB connection, health check
- [ ] **Phase 2** — Authentication (JWT, bcrypt, route guards, rate limiting)
- [ ] **Phase 3** — Subject CRUD
- [ ] **Phase 4** — OpenAI schedule generation
- [ ] **Phase 5** — Schedule view + session logging
- [ ] **Phase 6** — Analytics + dashboard charts
- [ ] **Phase 7** — Framer Motion polish
- [ ] **Phase 8** — GitHub Actions CI/CD
- [ ] **Phase 9** — Deploy (Atlas + Render + Vercel)
- [ ] **Phase 10** — Final hardening pass

## License

MIT

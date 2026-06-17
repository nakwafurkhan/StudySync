# Contributing to StudySync

Thanks for your interest in StudySync! This is a monorepo with a `backend/`
(Express + Mongoose) and a `frontend/` (React + Vite).

## Getting set up

```bash
# Backend
cd backend
cp .env.example .env        # fill in MONGO_URI, JWT_SECRET, GROQ_API_KEY
npm install
npm run seed                # optional: load the demo account + sample data
npm run dev                 # http://localhost:5000

# Frontend (separate terminal)
cd frontend
echo "VITE_API_URL=http://localhost:5000/api" > .env
npm install
npm run dev                 # http://localhost:5173
```

Use the Node version in `.nvmrc` (`nvm use`).

## Workflow

1. Create a branch off `main`: `git checkout -b feat/your-feature`
2. Make your change. Keep the code style consistent (ESLint enforces it).
3. **Run the checks locally before pushing** — CI runs the same:
   ```bash
   # backend
   cd backend && npm run lint && npm run test:coverage
   # frontend
   cd frontend && npm run lint && npm run test:coverage && npm run build
   ```
4. Add or update tests for any behavior you change. Coverage gates are enforced.
5. Open a PR against `main` with a clear description. GitHub Actions must be green.

## Conventions

- **Commits:** short, imperative summaries (e.g. `fix(auth): clear cookie on logout`).
- **Backend:** CommonJS; keep `app.js` free of `listen()` so it stays testable; new routes get an integration test (Supertest + in-memory Mongo).
- **Frontend:** function components + hooks; service modules wrap Axios and are mocked in component tests; never import the real `api.js` in a test.
- **Secrets:** never commit `.env` or API keys.

## Reporting bugs

Open an issue with steps to reproduce, expected vs. actual behavior, and your environment.

# Changelog

All notable changes to StudySync are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- **Academic calendar** — month view of exams, assignment deadlines, and AI
  study blocks; events API with study-plan overlay.
- **Syllabus importer** — extract exams, deadlines, and weights from a PDF,
  pasted text, or a public URL (Groq), then bulk-add to the calendar.
- **Study streak**, **daily focus-goal ring**, and **priority color-coding**.
- **"Recall" theme** — dark, flashcard-deck-inspired redesign across the app.
- Seed script (`npm run seed`) with a ready-to-use demo account.
- Repo hygiene: `LICENSE`, `CONTRIBUTING.md`, `CHANGELOG.md`, `.nvmrc`.

## [0.8.0] — CI/CD & deployment config

### Added
- GitHub Actions CI: lint, test with coverage, and build on every push/PR; a
  Render deploy-hook job on merge to `main`.
- `render.yaml` (Render Blueprint) and `frontend/vercel.json` (security headers,
  asset caching, SPA rewrite).

## [0.7.0] — Framer Motion polish
- Page transitions, staggered list entrances, and animated progress bars.

## [0.6.0] — Analytics & dashboard
- `/api/analytics/summary` (hours/week, per-subject adherence, deadlines at
  risk) and a charts dashboard (Recharts).

## [0.5.0] — Schedule view & session logging
- `StudySession` model + sessions API; schedule view with a generate control
  and a session logger.

## [0.4.0] — AI schedule generation
- Groq-powered day-by-day schedule generation with JSON validation, a retry,
  and a deterministic fallback. (Originally OpenAI; switched to Groq.)

## [0.3.0] — Subject CRUD
- Ownership-scoped subjects with deadlines, priority, and indexes.

## [0.2.0] — Authentication
- Register/login with bcrypt + JWT in an httpOnly cookie; protected routes on
  the API and the SPA; auth rate limiting; React frontend scaffold.

## [0.1.0] — Project scaffold
- Monorepo, Express server, MongoDB connection, health check, Jest + Supertest.

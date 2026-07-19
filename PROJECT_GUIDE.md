# 🎙️ AI English Speaking Tutor — Working Guide

Everything you need to run, develop, and deploy the project.

---

## 1. What it is

A production-style SaaS where users **speak English through the mic** and an AI
teacher ("Aria") replies in ~1–2s with **corrections, pronunciation tips and
speaking scores**. Full stack: React frontend + FastAPI backend + AI services.

---

## 2. Tech stack

| Layer | Tech |
|---|---|
| **Frontend** | React 18 · Vite 5 · TypeScript · Tailwind CSS · shadcn-style UI · React Router · React Query · Axios · React Hook Form · Zod · Framer Motion · Recharts |
| **Backend** | FastAPI · SQLAlchemy 2 (async) · Pydantic v2 · JWT auth · WebSocket · Alembic |
| **Database** | SQLite (local dev) · PostgreSQL (production) · Redis (optional) |
| **AI** | Google Gemini (with offline fallback) · Whisper STT (browser fallback) · Piper/Kokoro TTS (browser fallback) |
| **Deploy** | Docker · Docker Compose · NGINX · GitHub Actions |

---

## 3. Requirements

- **Node.js 20+** (you have v24 ✓)
- **Python 3.11+** (you have 3.13 ✓)
- *(optional)* **Docker** — for one-command full-stack run
- *(optional)* **Google Gemini API key** — for real AI replies (works without it via a built-in offline tutor)

---

## 4. Currently running (this session)

| Service | URL | Notes |
|---|---|---|
| **App (production build)** | **http://localhost:4173** | ⭐ smooth, use this |
| App (dev build) | http://localhost:5173 | hot-reload, slower by design |
| Backend API | http://localhost:8000 | |
| **API docs (Swagger)** | http://localhost:8000/docs | try every endpoint here |

**Login credentials (seeded):**
- 👤 Learner: `learner@ai-tutor.app` / `Learner@123`
- 🛠️ Admin: `admin@ai-tutor.app` / `Admin@12345`

---

## 5. Run it yourself (from scratch)

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate            # Windows (PowerShell: .venv\Scripts\Activate.ps1)
pip install -r requirements.txt
copy .env.example .env             # then edit if needed
python -m app.scripts.seed         # creates admin + learner + achievements
uvicorn app.main:app --reload --port 8000
```

### Frontend (new terminal)
```bash
cd frontend
npm install
npm run dev                        # http://localhost:5173
# or the fast production build:
npm run build && npm run preview   # http://localhost:4173
```

### Or everything with Docker (needs Docker Desktop)
```bash
copy .env.example .env             # fill GEMINI_API_KEY + secrets
docker compose up --build
```

---

## 6. Enable REAL AI replies (optional)

By default it uses a built-in **offline tutor** (rule-based) so it works with no
keys. For full teacher-quality responses:

1. Get a free key: https://aistudio.google.com/apikey
2. Put it in `backend/.env`:
   ```
   GEMINI_API_KEY=your-key-here
   ```
3. Restart the backend.

---

## 7. Project structure

```
Spoken-comm/
├── backend/                  FastAPI app
│   ├── app/
│   │   ├── core/             config, security, db, redis, logging, deps
│   │   ├── models/           SQLAlchemy tables (user, conversation, progress…)
│   │   ├── schemas/          Pydantic request/response contracts
│   │   ├── api/v1/endpoints/ auth, users, conversations, voice, progress, admin, meta
│   │   ├── services/         business logic + ai/ (gemini, stt, tts, tutor)
│   │   ├── ws/               WebSocket voice chat
│   │   └── scripts/seed.py   demo data seeder
│   ├── alembic/              DB migrations
│   └── tests/                pytest suite (9 tests)
├── frontend/                 React SPA
│   └── src/
│       ├── components/       ui/ (buttons, cards, slider…), layout/ (sidebar, topbar), theme/
│       ├── features/         auth, chat, voice, progress, admin
│       ├── pages/            dashboard, voice, history, progress, achievements, profile, settings, admin, auth/*
│       ├── lib/ hooks/ types/ router/
├── nginx/                    production reverse proxy
├── docker-compose.yml        local full stack
├── docker-compose.prod.yml   production
└── .github/workflows/ci.yml  CI/CD
```

---

## 8. Handy commands

**Frontend** (`cd frontend`)
| Command | Does |
|---|---|
| `npm run dev` | dev server (hot-reload) |
| `npm run build` | production build |
| `npm run preview` | serve production build (fast) |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |

**Backend** (`cd backend`, venv active)
| Command | Does |
|---|---|
| `uvicorn app.main:app --reload` | run API |
| `pytest -q` | run tests |
| `ruff check app` | lint |
| `python -m app.scripts.seed` | seed demo data |
| `alembic upgrade head` | apply DB migrations |
| `alembic revision --autogenerate -m "msg"` | new migration |

---

## 9. Key features & where to find them

| Feature | Page | Code |
|---|---|---|
| Voice chat + avatar + live feedback | `/app/voice` | `pages/voice.tsx`, `features/voice/` |
| Dashboard (stats, charts) | `/app` | `pages/dashboard.tsx` |
| Chat history | `/app/history` | `pages/history.tsx` |
| Progress & analytics | `/app/progress` | `pages/progress.tsx` |
| Achievements | `/app/achievements` | `pages/achievements.tsx` |
| Profile / Settings (pick teacher, theme) | `/app/profile`, `/app/settings` | |
| Admin dashboard | `/app/admin` (admin only) | `pages/admin.tsx` |
| Auth (always light) | `/login`, `/register`, … | `pages/auth/` |

---

## 10. Environment variables

**`backend/.env`** (main ones)
```
SECRET_KEY=...                 # JWT signing (change in prod)
DATABASE_URL=sqlite+aiosqlite:///./dev.db   # or postgres in prod
REDIS_URL=                     # empty = in-memory fallback
GEMINI_API_KEY=                # empty = offline tutor
BACKEND_CORS_ORIGINS=http://localhost:5173
FIRST_ADMIN_EMAIL / FIRST_ADMIN_PASSWORD    # used by seed
```

**`frontend/.env`** (optional; dev proxies to backend automatically)
```
VITE_API_URL=                  # empty = same-origin / dev proxy
VITE_WS_URL=
```

---

## 11. Deploy to production

```bash
# On a server with Docker:
cp .env.example .env           # set real POSTGRES_*, SECRET_KEY, GEMINI_API_KEY, VITE_API_URL
docker compose -f docker-compose.prod.yml up -d --build
# NGINX serves the app on :80 / :443 (add TLS certs to nginx/certs/)
```
CI runs automatically on push (backend tests + frontend build + docker build) via
`.github/workflows/ci.yml`.

---

## 12. Troubleshooting

| Problem | Fix |
|---|---|
| App feels slow | Use **:4173** (production build). Dev (:5173) is intentionally slower. |
| Port already in use | Stop the old server, or change the port flag. |
| Voice mic not working | Use **Chrome or Edge** (Web Speech API). |
| AI replies feel generic | Add `GEMINI_API_KEY` to `backend/.env` and restart backend. |
| DB schema changed | delete `backend/dev.db` → restart backend → `python -m app.scripts.seed`. |
| Verification/reset email | prints to the backend console in dev (no SMTP needed). |

---

**Quick start right now:** open **http://localhost:4173**, log in as
`learner@ai-tutor.app` / `Learner@123`, go to **Voice Chat**, press the mic. 🎤

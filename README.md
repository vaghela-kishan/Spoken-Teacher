# 🎙️ AI English Speaking Tutor

A production-ready SaaS web application that behaves like a real human English teacher. Users speak naturally through their microphone and receive fast, human-like AI responses with grammar corrections, pronunciation tips, and real-time speaking scores.

> **Stack:** React + Vite + TypeScript + Tailwind + shadcn/ui (frontend) · FastAPI + SQLAlchemy + PostgreSQL + Redis (backend) · Groq (Llama 3.3 70B) with a Gemini fallback · Whisper (STT) · Piper (TTS) · Docker + NGINX + GitHub Actions (deploy).

---

## ✨ Features

- 🎤 **Natural voice conversation** — press the mic, speak, and get a spoken reply in ~1–2 s.
- 🧑‍🏫 **Real English teacher behaviour** — corrections, native rephrasing, grammar & pronunciation tips.
- 📊 **Live scoring** — confidence, pronunciation, fluency, grammar, and overall speaking scores.
- 🗣️ **Talking avatar** — lip-sync, blinking, idle/speaking/listening states.
- 🌗 **Beautiful dashboard** — glassmorphism, dark/light mode, animated cards, fully responsive.
- 🔐 **Complete auth** — register, login, email verification, forgot/reset password, JWT + refresh, RBAC.
- 📈 **Learning progress** — chat & voice history, achievements, daily/monthly statistics.
- 🛠️ **Admin panel** — total/online/active users, conversation & grammar analytics, exportable reports.
- 🔴 **Live user counter** — total, online now, active today, new this week.

---

## 🏗️ Architecture

```
                         ┌──────────────────────────┐
                         │        NGINX (edge)       │
                         │  TLS · gzip · reverse-px  │
                         └────────────┬──────────────┘
              /api, /ws               │            /
        ┌──────────────────┐          │      ┌──────────────────┐
        │  FastAPI backend │◀─────────┴─────▶│  React frontend  │
        │  REST + WebSocket│                 │  Vite SPA (static)│
        └───────┬──────────┘                 └──────────────────┘
     ┌──────────┼───────────┬──────────────┐
     ▼          ▼           ▼              ▼
┌─────────┐ ┌───────┐ ┌───────────┐ ┌──────────────┐
│Postgres │ │ Redis │ │  Gemini   │ │ Whisper /    │
│ (data)  │ │(cache/│ │  (LLM)    │ │ Piper (voice)│
│         │ │ pubsub)│ │           │ │              │
└─────────┘ └───────┘ └───────────┘ └──────────────┘
```

**Clean, feature-based, layered architecture:**

- **API layer** (`api/v1/endpoints`) — thin HTTP/WS controllers.
- **Service layer** (`services/`) — business logic, AI orchestration, no framework leakage.
- **Data layer** (`models/`, `repositories` via SQLAlchemy sessions) — persistence.
- **Schema layer** (`schemas/`) — Pydantic request/response contracts (validation).
- Frontend mirrors this with **feature folders** (`features/auth`, `features/voice`, …), a shared `components/ui`, `hooks`, `lib`, and a typed API client.

---

## 📁 Repository layout

```
.
├── backend/            # FastAPI application
│   ├── app/
│   │   ├── core/       # config, security, db, redis, logging, deps
│   │   ├── models/     # SQLAlchemy ORM models
│   │   ├── schemas/    # Pydantic schemas
│   │   ├── api/v1/     # REST endpoints + router
│   │   ├── services/   # business logic + ai/ (gemini, stt, tts, tutor)
│   │   ├── ws/         # websocket manager + voice endpoint
│   │   └── utils/
│   ├── alembic/        # migrations
│   └── tests/
├── frontend/           # React + Vite SPA
│   └── src/
│       ├── components/ui/   # shadcn-style primitives
│       ├── features/        # auth, dashboard, voice, admin, ...
│       ├── hooks/ lib/ store/ types/ styles/
├── nginx/              # reverse proxy config
├── .github/workflows/  # CI/CD
└── docker-compose.yml  # local full-stack orchestration
```

---

## 🚀 Quick start (Docker — recommended)

```bash
cp .env.example .env          # add GROQ_API_KEY + a strong SECRET_KEY
docker compose up --build
```

- Frontend → http://localhost:5173
- Backend API docs → http://localhost:8000/docs
- Postgres → localhost:5432 · Redis → localhost:6379

## 🧑‍💻 Local development (without Docker)

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # SQLite by default → runs with zero setup
python -m app.scripts.seed       # optional: seed demo accounts + sample data
uvicorn app.main:app --reload --port 8000
```

> Tables are **created automatically** on first startup, so no migration step is
> needed for the default SQLite database. For PostgreSQL, run `alembic upgrade head`.

**Frontend**
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Log in with the seeded demo account: **`learner@ai-tutor.app` / `Learner@123`**
(admin: **`admin@ai-tutor.app` / `Admin@12345`**).

### ⚠️ Windows note — enable Long Paths

`piper-tts` pulls in `onnxruntime`, which has very deeply-nested internal files. On
Windows, `pip install` can fail with `OSError: No such file or directory ... enable-long-paths`
if the project sits in a deep folder. Either **keep the project path short**
(e.g. `C:\ai-tutor`) **or** enable long-path support once (admin PowerShell):

```powershell
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
  -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

> Even if `piper-tts` can't install, the app still runs — it automatically falls
> back to the browser's built-in voice for text-to-speech.

---

## 🔑 Environment variables

See [`.env.example`](.env.example) (root, for Docker), [`backend/.env.example`](backend/.env.example), and [`frontend/.env.example`](frontend/.env.example). No key is strictly required — an offline heuristic tutor keeps the app working — but set **`GROQ_API_KEY`** ([free key](https://console.groq.com/keys)) for fast, high-quality replies. STT/TTS gracefully degrade to browser Web Speech APIs when local models aren't installed.

---

## 🧪 Testing & quality

```bash
cd backend && pytest            # backend tests
cd frontend && npm run lint     # eslint + typecheck
```

- Type-safe end-to-end (TypeScript + Pydantic + Zod).
- SOLID, DRY, reusable components, structured logging, centralized error handling.

---

## 📦 Deployment

Production compose + multi-stage Docker images + NGINX + GitHub Actions pipeline are included. See [`docker-compose.prod.yml`](docker-compose.prod.yml) and [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

---

## 📄 License

MIT — see [LICENSE](LICENSE).

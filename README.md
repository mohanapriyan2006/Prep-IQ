# [PrepIQ](https://prepiq-dev.netlify.app/)

> Your AI-Powered Placement Intelligence System

PrepIQ is a full-stack competitive programming & DSA preparation platform that combines the power of a **LeetCode-style coding environment**, **AI-generated personalized roadmaps**, **skill assessments**, and **external platform analytics** — all in one intelligent ecosystem.

Whether you're grinding for FAANG, tracking your LeetCode progress, or need an AI coach to tell you exactly what to practice next — PrepIQ has your back.

---

## What Makes PrepIQ Different?

```
Assessment + Practice + External Stats + Tutorials + AI Coach
                = Unified Intelligence System
```

Most platforms give you problems. PrepIQ gives you **a system** — one that learns *about you*, adapts to your weaknesses, and keeps your preparation on track with data, not guesswork.

---

## Features at a Glance

### 1. Interactive Coding Arena
A fully-featured problem-solving workspace with:
- **Monaco Editor** (VS Code-powered) for C++, Java, Python, and JavaScript
- **Docker-sandboxed execution** with CPU/memory limits and timeout handling
- **Visible & hidden test cases** for realistic evaluation
- **Submission history** with runtime analysis

### 2. DSA Assessment Engine
Timed, adaptive skill tests that evaluate your real ability:
- 9-problem structured assessments (Easy → Medium → Hard)
- Auto-submit on timeout, locked navigation
- Captures accuracy, time-per-problem, attempt counts, and completion rates
- Feeds directly into your personalized roadmap

### 3. AI-Powered Roadmap Generator
Not a static checklist — a **living plan**:
- Generated from assessment results + onboarding survey
- Uses Gemini / Groq (Llama) LLMs for intelligent topic sequencing
- Adapts based on your submission patterns and detected weaknesses
- Day-by-day breakdown with linked tutorials and problems

### 4. External Platform Sync
Stop jumping between tabs. PrepIQ pulls your stats from:
- **LeetCode** (via GraphQL) — total solved, difficulty distribution, contest rating
- **GeeksforGeeks** (via profile scraping) — problems solved, coding score, rank

Unified dashboard shows your combined progress across all platforms.

### 5. Smart Analytics Dashboard
Visualize your growth with:
- **Radar charts** for topic-wise strength analysis
- **Progress trends** over time
- **Company readiness scores** — know if you're ready for Amazon, Google, or startups
- **Skill gap detection** — AI identifies what you're missing for your target company

### 6. Tutorial & Editorial System
Every problem links to:
- Curated tutorials with concept explanations
- Multi-language code examples
- Complexity analysis
- Editorials with brute-force → optimized walkthroughs

### 7. Mock Tests & Contests
- Full-length mock tests with timer and scoring
- Live contest tracker (synced from Clist API)
- Weekly AI analysis that re-evaluates your standing

### 8. AI Code Review & Weakness Detection
After every submission, the AI analyzes:
- Code quality and optimization opportunities
- Topic-wise weakness patterns
- Personalized recommendations ("Practice 2 more Graph problems")

---

## Tech Stack

### Backend
| Layer | Technology |
|-------|-----------|
| Framework | FastAPI (Python) |
| Database | PostgreSQL + SQLAlchemy 2.0 |
| Auth | JWT (python-jose) + bcrypt |
| Code Execution | Docker-sandboxed (C++, Java, Python, JS) |
| Scheduler | APScheduler (contest sync, weekly AI refresh) |
| AI Integration | Gemini API + Groq (Llama 3.1) |
| External APIs | LeetCode GraphQL, GFG scraping, Clist API |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build Tool | Vite |
| Styling | TailwindCSS 4 |
| Charts | Recharts |
| Editor | Monaco Editor (@monaco-editor/react) |
| Animations | Framer Motion |
| Icons | Lucide React |
| Routing | React Router v7 |

---

## System Architecture

```
User registers → Takes Survey + Assessment
         ↓
    AI generates roadmap
         ↓
    Solves problems in Coding Arena
         ↓
    Stats collected (internal + LC + GFG)
         ↓
    AI runs continuous analysis
         ↓
    Roadmap adapts → User improves systematically
```

---

## Project Structure

```
Prep-IQ/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app with scheduler
│   │   ├── config.py            # Pydantic settings
│   │   ├── docker_runner.py     # Sandboxed execution
│   │   ├── routers/             # API endpoints
│   │   │   ├── auth.py
│   │   │   ├── problems.py
│   │   │   ├── execution.py
│   │   │   ├── assessment.py
│   │   │   ├── roadmap.py
│   │   │   ├── analytics.py
│   │   │   ├── tutorials.py
│   │   │   ├── stats_router.py
│   │   │   └── ai_router.py
│   │   ├── services/            # Business logic
│   │   │   ├── code_executor.py
│   │   │   ├── roadmap_engine.py
│   │   │   ├── assessment_engine.py
│   │   │   ├── leetcode_service.py
│   │   │   ├── gfg_service.py
│   │   │   ├── analysis_engine.py
│   │   │   └── code_review_service.py
│   │   └── models/              # SQLAlchemy models
│   ├── requirements.txt
│   └── Dockerfile
│
└── frontend/
    ├── src/
    │   ├── App.tsx              # Route definitions
    │   ├── pages/
    │   │   ├── Dashboard.tsx
    │   │   ├── Problems.tsx
    │   │   ├── ProblemWorkspace.tsx
    │   │   ├── AssessmentPage.tsx
    │   │   ├── AssessmentArena.tsx
    │   │   ├── Roadmap.tsx
    │   │   ├── Analytics.tsx
    │   │   ├── Profile.tsx
    │   │   ├── Tutorials.tsx
    │   │   └── MockTestPage.tsx
    │   ├── components/          # Reusable UI components
    │   ├── services/api.ts      # API client
    │   └── context/useAuth.ts   # Auth context
    ├── package.json
    └── vite.config.ts
```

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL 15+
- Docker (for code execution)

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt

# Set up your .env file
cp .env.example .env
# Edit .env with your database URL, JWT secret, and AI API keys

# Run the server
uvicorn app.main:app --reload
```

The backend will auto-create tables and run startup patches on first launch.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` to start prepping.

### Docker Executor Build

```bash
cd backend
docker build -f executor.Dockerfile -t prepiq-executor:latest .
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET_KEY` | Secret for token signing |
| `GEMINI_API_KEY` | Google Gemini API key (roadmap AI) |
| `GROQ_API_KEY` | Groq API key (fallback AI) |
| `CLIST_API_USERNAME` / `CLIST_API_KEY` | Contest sync credentials |

See `backend/.env.example` for the full list.

---

## API Overview

| Route | Purpose |
|-------|---------|
| `POST /auth/register` | User registration |
| `GET /problems` | Browse problem set |
| `POST /execution` | Run code in sandbox |
| `POST /submissions` | Submit solution |
| `GET /assessment` | Start/take assessments |
| `GET /roadmap` | View personalized roadmap |
| `GET /analytics/summary` | Dashboard stats |
| `GET /platform-connectors/leetcode/{username}` | Sync LeetCode stats |
| `GET /platform-connectors/gfg/{username}` | Sync GFG stats |
| `POST /ai/analyze` | Run AI analysis |

---

## The PrepIQ Loop

This is how the platform thinks:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Assessment │───▶│  AI Roadmap │───▶│   Practice  │
│   + Survey  │    │  Generation │    │  Problems   │
└─────────────┘    └─────────────┘    └──────┬──────┘
       ▲                                      │
       │                                      ▼
       │                               ┌─────────────┐
       │                               │   Metrics   │
       │                               │   Stored    │
       │                               └──────┬──────┘
       │                                      │
       │                                      ▼
       │                               ┌─────────────┐
       │                               │  External   │
       │                               │ Stats Sync  │
       │                               └──────┬──────┘
       │                                      │
       │                                      ▼
       │                               ┌─────────────┐
       └───────────────────────────────│  AI Analysis│
                                       │  & Refresh  │
                                       └─────────────┘
```

---

## Why We Built This

Most coding platforms are **repositories of problems**. PrepIQ is a **preparation operating system** — it doesn't just give you questions to solve, it:

- **Assesses** where you actually stand
- **Plans** exactly what you need to do
- **Tracks** your real progress (even outside the platform)
- **Analyzes** your patterns with AI
- **Adapts** as you grow

It's like having a personal DSA coach, a progress tracker, and a coding platform — all talking to each other.

---

## License

MIT

---

<p align="center">
  <strong>Prep Smarter. Place Better.</strong>
</p>

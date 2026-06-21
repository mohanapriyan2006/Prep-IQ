# PrepIQ Backend

## Run locally

1. Create `.env` from `.env.example`.
2. Build execution image:

```bash
docker build -f executor.Dockerfile -t prepiq-executor:latest .
```

The execution image now includes C++, Java, Python, and JavaScript runtimes.

3. Install dependencies and run API:

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

4. Start Postgres (optional via compose):

```bash
docker compose up db -d
```

## AI Roadmap Generation

Roadmap generation now uses provider fallback in this order:

1. Gemini
2. Groq
3. Rule-based deterministic planner

Configure these in `.env`:

```bash
ROADMAP_AI_TIMEOUT_SECONDS=12
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash
GROQ_API_KEY=
GROQ_MODEL=llama-3.1-8b-instant
```

If no API keys are provided or providers fail, the app automatically uses rule-based generation.

## Core endpoints

- `POST /auth/register`
- `POST /auth/login`
- `POST /execute` (JWT required)
- `GET /problems`
- `POST /problems`
- `POST /submissions` (JWT required)
- `GET /submissions` (JWT required)
- `GET /submissions/analytics/summary` (JWT required)
- `POST /problems/{id}/bookmark` (JWT required)
- `GET /platform-connectors/accounts` (JWT required)
- `POST /platform-connectors/accounts` (JWT required)
- `GET /platform-connectors/stats` (JWT required)
- `POST /platform-connectors/sync` (JWT required)
- `GET /contests`
- `POST /contests/sync`

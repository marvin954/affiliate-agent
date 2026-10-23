# Affiliate Agency — Local App

Runs entirely on your machine. Uses your local Hermes LLM (Ollama, LM Studio, or any OpenAI-compatible server).

## Setup

1. Copy and configure environment:
   ```bash
   cp .env.example .env
   # Edit .env — set HERMES_BASE_URL and HERMES_MODEL
   ```

2. Run:
   ```bash
   chmod +x start.sh
   ./start.sh
   ```

3. Open http://localhost:8000

## Requirements
- Python 3.9+
- Node.js 18+
- Local Hermes running (Ollama: `ollama run hermes3`)

## Hermes endpoints
- **Ollama**: `http://localhost:11434/v1` — model: `hermes3`
- **LM Studio**: `http://localhost:1234/v1` — model: whatever you loaded

## Dev mode (hot reload)

Run backend and frontend separately:

```bash
# Terminal 1 — backend
cd backend && pip install -r requirements.txt && uvicorn main:app --reload --port 8000

# Terminal 2 — frontend (proxies /api to port 8000)
cd frontend && npm install && npm run dev
# Open http://localhost:5173
```

## Features
- **Research tab** — Hermes suggests real affiliate programs from its knowledge base
- **Pipeline tab** — Kanban with 4 stages: Researching / Applied / Active / Paused
- **Analytics tab** — Estimated monthly earnings from active programs
- **Outreach emails** — AI-generated pitch emails per program, editable + copyable
- All pipeline state persisted to localStorage

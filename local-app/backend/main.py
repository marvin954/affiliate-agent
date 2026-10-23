import os
import json
import subprocess
import shutil
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

# --- Hermes configuration ---
# Set HERMES_CMD in .env to the exact CLI invocation, e.g.:
#   HERMES_CMD=/home/mammba/.hermes/hermes
#   HERMES_CMD=hermes
#   HERMES_CMD=/home/mammba/.hermes
# If unset, we auto-detect: check for a binary in HERMES_PATH, then fall back to HTTP.
HERMES_CMD = os.getenv("HERMES_CMD", "")
HERMES_PATH = os.getenv("HERMES_PATH", "/home/mammba/.hermes")

# HTTP fallback (Ollama / LM Studio) — used only if no CLI found
HERMES_BASE_URL = os.getenv("HERMES_BASE_URL", "http://localhost:11434/v1")
HERMES_MODEL = os.getenv("HERMES_MODEL", "hermes3")


def _resolve_cli():
    """Return the CLI binary path, or None if not found."""
    if HERMES_CMD:
        return HERMES_CMD
    # Check if HERMES_PATH itself is executable
    if os.path.isfile(HERMES_PATH) and os.access(HERMES_PATH, os.X_OK):
        return HERMES_PATH
    # Check for a binary named 'hermes' inside HERMES_PATH directory
    candidate = os.path.join(HERMES_PATH, "hermes")
    if os.path.isfile(candidate) and os.access(candidate, os.X_OK):
        return candidate
    # Check PATH
    if shutil.which("hermes"):
        return "hermes"
    return None


def call_hermes(prompt: str) -> str:
    """Call Hermes CLI or HTTP and return the response text."""
    cli = _resolve_cli()
    if cli:
        # Try common arg styles: positional, --prompt, -p, stdin
        # First try passing prompt as a positional argument
        try:
            result = subprocess.run(
                [cli, prompt],
                capture_output=True, text=True, timeout=120
            )
            if result.returncode == 0 and result.stdout.strip():
                return result.stdout.strip()
        except Exception:
            pass
        # Fallback: pass via stdin
        try:
            result = subprocess.run(
                [cli],
                input=prompt, capture_output=True, text=True, timeout=120
            )
            if result.returncode == 0 and result.stdout.strip():
                return result.stdout.strip()
            if result.stderr.strip():
                raise RuntimeError(f"Hermes CLI error: {result.stderr.strip()[:300]}")
        except subprocess.TimeoutExpired:
            raise RuntimeError("Hermes CLI timed out after 120s")
    else:
        # HTTP fallback
        try:
            from openai import OpenAI
            client = OpenAI(base_url=HERMES_BASE_URL, api_key="local")
            response = client.chat.completions.create(
                model=HERMES_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=3000,
                temperature=0.3,
            )
            return response.choices[0].message.content or ""
        except ImportError:
            raise RuntimeError("openai package not installed and no Hermes CLI found")
    return ""


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ResearchRequest(BaseModel):
    niche: str = "all"
    commType: str = "both"
    sortBy: str = "commission"
    keyword: str = ""


class OutreachRequest(BaseModel):
    program: dict


@app.post("/api/research")
async def research(req: ResearchRequest):
    niche_label = "all niches" if req.niche == "all" else req.niche
    type_label = (
        "high-ticket affiliate programs ($500+ per conversion)"
        if req.commType == "high"
        else "standard commission affiliate programs"
        if req.commType == "standard"
        else "both standard and high-ticket affiliate programs"
    )
    sort_label = (
        "highest commission/payout"
        if req.sortBy == "commission"
        else "longest cookie duration"
        if req.sortBy == "cookie"
        else "highest EPC"
    )

    prompt = f"""You are an expert affiliate marketing researcher. Based on your training knowledge, return real affiliate programs that match these criteria:

- Niche: {niche_label}
- Type: {type_label}
- Sort by: {sort_label}
{f'- Keyword filter: "{req.keyword}"' if req.keyword else ''}

Return ONLY a raw JSON array (no markdown, no backticks, no explanation) of 8-12 real affiliate programs.

Each object must have exactly these keys:
{{
  "name": "Exact program name",
  "company": "Company behind it",
  "network": "ShareASale / Impact / CJ / ClickBank / Direct / etc",
  "type": "standard" or "high",
  "niche": "Short niche label",
  "commission": "Exact commission rate e.g. '40% recurring' or '$500 flat'",
  "cookie": "Cookie window e.g. '90 days' or 'Session'",
  "avgPayout": "Average payout per conversion e.g. '$120' or '$1,200'",
  "epc": "Estimated earnings per 100 clicks e.g. '$4.20'",
  "description": "2 sentences: what the program is and why it pays well",
  "joinUrl": "Real URL to apply/join the affiliate program",
  "adsUrl": "https://www.facebook.com/ads/library/?q=BRAND_NAME",
  "networkUrl": "Real URL to network listing page or null",
  "tags": ["recurring", "saas", "high-ticket"]
}}

Rules:
- type = "high" if a single conversion can earn $500+, else "standard"
- Only include real, well-known programs
- Return ONLY the JSON array starting with [ and ending with ]"""

    def generate():
        cli = _resolve_cli()
        source = f"Hermes CLI ({cli})" if cli else f"Hermes HTTP ({HERMES_BASE_URL})"
        yield f"data: {json.dumps({'type': 'status', 'message': f'🤖 Querying {source}...'})}\n\n"
        try:
            text = call_hermes(prompt)
            start = text.find("[")
            end = text.rfind("]")
            if start == -1 or end <= start:
                yield f"data: {json.dumps({'type': 'error', 'message': 'No JSON array in response. Check Hermes is running.'})}\n\n"
                return
            programs = json.loads(text[start:end + 1])
            yield f"data: {json.dumps({'type': 'status', 'message': f'✅ Got {len(programs)} programs from Hermes'})}\n\n"
            yield f"data: {json.dumps({'type': 'results', 'programs': programs, 'searchCount': 0})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream", headers={"Cache-Control": "no-cache"})


@app.post("/api/outreach")
async def outreach(req: OutreachRequest):
    p = req.program
    prompt = f"""Write a professional affiliate program application email for this program:

Program: {p.get('name')}
Company: {p.get('company')}
Commission: {p.get('commission')}
Network: {p.get('network')}
Niche: {p.get('niche')}

Requirements:
- To: affiliate manager
- From: an experienced high-ticket affiliate marketer
- Mention the specific program name and commission structure
- Ask about approval status and whether a higher commission tier is available for high performers
- 150-200 words, friendly and professional
- Start with "Subject: Affiliate Application — {p.get('name')}"

Return ONLY the email text, nothing else."""

    try:
        email = call_hermes(prompt)
        return {"email": email}
    except Exception as e:
        return {"error": str(e)}


# Serve built React frontend
frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.isdir(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/")
    async def serve_root():
        return FileResponse(os.path.join(frontend_dist, "index.html"))

    @app.get("/{path:path}")
    async def serve_spa(path: str):
        file_path = os.path.join(frontend_dist, path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))

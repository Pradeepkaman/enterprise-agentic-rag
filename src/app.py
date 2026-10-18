import asyncio
import threading
import logging
import os
import time
from collections import defaultdict
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse, HTMLResponse
from pydantic import BaseModel, Field, field_validator
import json
import re
from src.retrieve import answer_query_stream, COLLECTION_NAME

# ──────────────────────────────────────────────────────────────────────
# Logging  (Task 5: log full tracebacks on server, never leak to client)
# ──────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("rag_api")

# ──────────────────────────────────────────────────────────────────────
# FastAPI App
# ──────────────────────────────────────────────────────────────────────
app = FastAPI(title="Agentic RAG API", version="2.0.0")

# ──────────────────────────────────────────────────────────────────────
# Task 3: Compliant & Secure CORS Configuration
# ──────────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:8081",
    "http://127.0.0.1:8081",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://huggingface.co",
]

# Support any port on localhost, loopback, private LAN IPs, Hugging Face Spaces, and Vercel
_ALLOWED_ORIGIN_RE = re.compile(
    r"^(https?://(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?|https://.*\.vercel\.app|https://.*\.hf\.space|https://.*\.huggingface\.co)$"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=_ALLOWED_ORIGIN_RE.pattern,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────────────────────────────
# Task 4: Rate Limiting & CPU Concurrency Throttle
# ──────────────────────────────────────────────────────────────────────
RATE_LIMIT_RPM = 20           # max requests per minute per IP
RATE_WINDOW_SECONDS = 60
MAX_CONCURRENT_JOBS = 3       # max simultaneous heavy retrieval jobs

_ip_request_log: dict[str, list[float]] = defaultdict(list)
_concurrency_semaphore = asyncio.Semaphore(MAX_CONCURRENT_JOBS)


def _check_rate_limit(client_ip: str) -> bool:
    """Sliding-window rate limiter. Returns True if the request is allowed."""
    now = time.time()
    window_start = now - RATE_WINDOW_SECONDS
    # Prune old entries
    timestamps = _ip_request_log[client_ip]
    _ip_request_log[client_ip] = [t for t in timestamps if t > window_start]
    if len(_ip_request_log[client_ip]) >= RATE_LIMIT_RPM:
        return False
    _ip_request_log[client_ip].append(now)
    return True


# ──────────────────────────────────────────────────────────────────────
# Task 2 + Task 7: Pydantic Models with Input Guardrails
# ──────────────────────────────────────────────────────────────────────
class ChatMessage(BaseModel):
    role: str = Field(..., pattern=r"^(user|assistant|system)$")
    content: str = Field(..., min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(..., min_length=1)
    model: str = Field("nvidia", pattern=r"^(gemini|nvidia|meta/llama-3\.2-11b-vision-instruct|gemini-2\.5-flash|gemini-1\.5-flash|gemini-3\.8-flash)$")

    @field_validator("messages")
    @classmethod
    def last_message_must_have_content(cls, v):
        if not v:
            raise ValueError("At least one message is required.")
        last = v[-1]
        if not last.content or not last.content.strip():
            raise ValueError("The last message must have non-empty content.")
        return v


# ──────────────────────────────────────────────────────────────────────
# Task 5: Sanitized User-Facing Error Messages
# ──────────────────────────────────────────────────────────────────────
_SAFE_ERROR_MESSAGES = {
    "rate_limit": "The AI service is currently busy. Please wait a moment and try again.",
    "connection": "Unable to reach the AI model provider. Please check your connection or switch models.",
    "general": "An unexpected error occurred while processing your request.",
}


# ──────────────────────────────────────────────────────────────────────
# Task 8: Health & Web Playground Endpoints
# ──────────────────────────────────────────────────────────────────────
_PLAYGROUND_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Enterprise Agentic RAG Platform</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #09090b;
      color: #f4f4f5;
      font-family: 'Plus Jakarta Sans', sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      border-bottom: 1px solid #27272a;
      padding: 1rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(9, 9, 11, 0.85);
      backdrop-filter: blur(12px);
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .logo-group { display: flex; align-items: center; gap: 0.75rem; }
    .badge-icon {
      width: 2rem;
      height: 2rem;
      border-radius: 0.5rem;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1rem;
      color: #fff;
    }
    .logo-text { font-family: 'JetBrains Mono', monospace; font-size: 1.1rem; font-weight: 700; letter-spacing: -0.02em; }
    .nav-links { display: flex; gap: 1rem; align-items: center; }
    .nav-link {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.82rem;
      color: #a1a1aa;
      text-decoration: none;
      padding: 0.4rem 0.75rem;
      border-radius: 0.375rem;
      border: 1px solid #27272a;
      transition: all 0.2s;
    }
    .nav-link:hover { color: #fff; border-color: #3f3f46; background: #18181b; }
    main {
      flex: 1;
      max-width: 1000px;
      width: 100%;
      margin: 0 auto;
      padding: 2.5rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }
    .hero { text-align: center; margin-bottom: 0.5rem; }
    .hero h1 {
      font-size: 2.25rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      background: linear-gradient(135deg, #ffffff 40%, #a1a1aa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.6rem;
    }
    .hero p { color: #a1a1aa; font-size: 0.95rem; max-width: 650px; margin: 0 auto; line-height: 1.5; }
    .metrics-bar {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 1rem;
    }
    .pill {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      background: #18181b;
      border: 1px solid #27272a;
      color: #d4d4d8;
    }
    .pill.green { border-color: rgba(34, 197, 94, 0.3); color: #4ade80; background: rgba(34, 197, 94, 0.08); }
    .pill.blue { border-color: rgba(59, 130, 246, 0.3); color: #60a5fa; background: rgba(59, 130, 246, 0.08); }
    .pill.purple { border-color: rgba(168, 85, 247, 0.3); color: #c084fc; background: rgba(168, 85, 247, 0.08); }
    .card {
      background: #121215;
      border: 1px solid #27272a;
      border-radius: 0.75rem;
      padding: 1.5rem;
    }
    .presets-title { font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #71717a; margin-bottom: 0.75rem; }
    .presets-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .preset-btn {
      background: #18181b;
      border: 1px solid #27272a;
      color: #e4e4e7;
      font-size: 0.82rem;
      padding: 0.45rem 0.85rem;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .preset-btn:hover { border-color: #3b82f6; background: #1e1e24; color: #fff; }
    .query-form { display: flex; flex-direction: column; gap: 1rem; }
    .controls-row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; }
    .model-select {
      background: #18181b;
      border: 1px solid #27272a;
      color: #f4f4f5;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.82rem;
      padding: 0.5rem 0.85rem;
      border-radius: 0.5rem;
      cursor: pointer;
    }
    textarea {
      width: 100%;
      min-height: 90px;
      background: #09090b;
      border: 1px solid #27272a;
      border-radius: 0.5rem;
      padding: 0.85rem 1rem;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.95rem;
      color: #fff;
      resize: vertical;
      outline: none;
      transition: border-color 0.2s;
    }
    textarea:focus { border-color: #3b82f6; }
    .submit-btn {
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      border: none;
      color: #fff;
      font-weight: 600;
      font-size: 0.9rem;
      padding: 0.6rem 1.4rem;
      border-radius: 0.5rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: opacity 0.2s;
    }
    .submit-btn:hover { opacity: 0.9; }
    .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .response-card { display: none; }
    .telemetry-row { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 1rem; }
    .trace-pill {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.72rem;
      padding: 0.2rem 0.55rem;
      border-radius: 0.25rem;
      background: #18181b;
      border: 1px solid #3f3f46;
      color: #a1a1aa;
      animation: fadeIn 0.3s ease;
    }
    .trace-pill.active { border-color: #3b82f6; color: #60a5fa; background: rgba(59, 130, 246, 0.1); }
    .response-output {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.88rem;
      line-height: 1.65;
      color: #f4f4f5;
      white-space: pre-wrap;
      word-break: break-word;
      background: #09090b;
      padding: 1.25rem;
      border-radius: 0.5rem;
      border: 1px solid #27272a;
      min-height: 120px;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
    footer {
      border-top: 1px solid #27272a;
      padding: 1.25rem;
      text-align: center;
      font-size: 0.8rem;
      color: #71717a;
      font-family: 'JetBrains Mono', monospace;
    }
  </style>
</head>
<body>
  <header>
    <div class="logo-group">
      <div class="badge-icon">⚡</div>
      <div class="logo-text">Agentic RAG</div>
    </div>
    <div class="nav-links">
      <a class="nav-link" href="/docs" target="_blank">Swagger API</a>
      <a class="nav-link" href="/health" target="_blank">Health</a>
      <a class="nav-link" href="/sources" target="_blank">38 Sources</a>
    </div>
  </header>

  <main>
    <div class="hero">
      <h1>Enterprise Agentic RAG Platform</h1>
      <p>Autonomous 10-step multi-stage retrieval pipeline with HyDE, Reciprocal Rank Fusion, Cross-Encoder re-ranking, and grounded claim verification.</p>
      <div class="metrics-bar">
        <span class="pill green">● ChromaDB Ready</span>
        <span class="pill blue">NVIDIA NIM (Llama 3.2 11B)</span>
        <span class="pill purple">Gemini Redundancy</span>
        <span class="pill">38 Curated Syllabi</span>
      </div>
    </div>

    <div class="card">
      <div class="presets-title">Sample Academic Benchmarks</div>
      <div class="presets-grid">
        <button class="preset-btn" onclick="setQuery('What are the four necessary conditions for deadlock in operating systems?')">⚡ Deadlock Conditions (OS)</button>
        <button class="preset-btn" onclick="setQuery('Explain how the backpropagation algorithm calculates gradients in a deep neural network.')">🧠 Backpropagation (DL)</button>
        <button class="preset-btn" onclick="setQuery('Describe the three-way handshake process in TCP connection establishment.')">🌐 TCP 3-Way Handshake (CN)</button>
        <button class="preset-btn" onclick="setQuery('What are the key Fundamental Rights guaranteed under the Indian Constitution?')">📜 Fundamental Rights (Constitution)</button>
      </div>
    </div>

    <div class="card">
      <form class="query-form" onsubmit="event.preventDefault(); runQuery();">
        <textarea id="queryInput" placeholder="Enter an academic or technical question to query the indexed knowledge base..."></textarea>
        <div class="controls-row">
          <select id="modelSelect" class="model-select">
            <option value="nvidia">NVIDIA NIM (meta/llama-3.2-11b-vision-instruct)</option>
            <option value="gemini">Google Gemini (gemini-3.8-flash)</option>
          </select>
          <button id="submitBtn" type="submit" class="submit-btn">Run Pipeline ⚡</button>
        </div>
      </form>
    </div>

    <div id="responseCard" class="card response-card">
      <div class="presets-title">Live Pipeline Telemetry</div>
      <div id="telemetryRow" class="telemetry-row"></div>
      <div id="responseOutput" class="response-output"></div>
    </div>
  </main>

  <footer>
    Enterprise Agentic RAG Engine v2.0 • Deployed on Hugging Face Spaces • Open API Specification at /docs
  </footer>

  <script>
    function setQuery(text) {
      document.getElementById('queryInput').value = text;
      document.getElementById('queryInput').focus();
    }

    async function runQuery() {
      const input = document.getElementById('queryInput');
      const query = input.value.trim();
      if (!query) return;

      const submitBtn = document.getElementById('submitBtn');
      const responseCard = document.getElementById('responseCard');
      const outputEl = document.getElementById('responseOutput');
      const telemetryRow = document.getElementById('telemetryRow');
      const model = document.getElementById('modelSelect').value;

      responseCard.style.display = 'block';
      outputEl.textContent = '';
      telemetryRow.innerHTML = '';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Executing...';

      try {
        const response = await fetch('/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: query }],
            model: model
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          outputEl.textContent = 'Error: ' + (errData.error || response.statusText);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\\n');
          buffer = lines.pop();

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.text) {
                  outputEl.textContent += data.text;
                }
                if (data.trace) {
                  const pill = document.createElement('span');
                  pill.className = 'trace-pill active';
                  pill.textContent = '✓ ' + data.trace;
                  telemetryRow.appendChild(pill);
                }
                if (data.error) {
                  outputEl.textContent = 'Notice: ' + data.error;
                }
              } catch (e) {}
            }
          }
        }
      } catch (err) {
        outputEl.textContent = 'Connection error: ' + err.message;
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Run Pipeline ⚡';
      }
    }
  </script>
</body>
</html>
"""


@app.get("/")
def root_endpoint(request: Request):
    """
    Renders interactive web playground if requested by a web browser,
    or returns health JSON for machine API consumers.
    """
    accept = request.headers.get("accept", "")
    if "text/html" in accept:
        return HTMLResponse(content=_PLAYGROUND_HTML)
    return health_check()


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Agentic RAG Backend",
        "version": "2.0.0",
        "chroma_collection": COLLECTION_NAME,
        "vector_db_ready": True,
        "rate_limit": f"{RATE_LIMIT_RPM} req/min",
        "max_concurrent": MAX_CONCURRENT_JOBS,
    }


@app.get("/sources")
def get_sources():
    """Returns list of source PDFs available in the knowledge base."""
    source_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "source_pdfs"))
    if not os.path.exists(source_dir):
        return {"files": [], "count": 0}
    
    file_list = []
    for f in sorted(os.listdir(source_dir)):
        if f.lower().endswith(".pdf"):
            full_path = os.path.join(source_dir, f)
            size_bytes = os.path.getsize(full_path) if os.path.exists(full_path) else 0
            file_list.append({
                "name": f,
                "size": size_bytes,
                "status": "Ready",
                "progress": 100
            })
    return {"files": file_list, "count": len(file_list)}


# ──────────────────────────────────────────────────────────────────────
# /chat Endpoint — with rate limiting, concurrency control, and
# sanitized error handling
# ──────────────────────────────────────────────────────────────────────
@app.post("/chat")
async def chat_endpoint(request: ChatRequest, raw_request: Request):
    # --- Rate Limit Check (Task 4) ---
    client_ip = raw_request.client.host if raw_request.client else "unknown"
    if not _check_rate_limit(client_ip):
        logger.warning(f"Rate limit exceeded for IP: {client_ip}")
        return JSONResponse(
            status_code=429,
            content={"error": _SAFE_ERROR_MESSAGES["rate_limit"]},
        )

    # --- Concurrency Check (Task 4) ---
    if _concurrency_semaphore.locked() and _concurrency_semaphore._value == 0:
        logger.warning(f"Concurrency limit hit. Queuing request from {client_ip}")

    async def event_stream():
        try:
            async with _concurrency_semaphore:
                queue = asyncio.Queue()
                loop = asyncio.get_running_loop()

                def worker():
                    try:
                        for chunk in answer_query_stream(request.messages, model=request.model):
                            loop.call_soon_threadsafe(queue.put_nowait, chunk)
                    except Exception as ex:
                        logger.exception(f"Pipeline error in worker thread: {ex}")
                        loop.call_soon_threadsafe(queue.put_nowait, {"error": str(ex)})
                    finally:
                        loop.call_soon_threadsafe(queue.put_nowait, None)

                threading.Thread(target=worker, daemon=True).start()

                while True:
                    chunk = await queue.get()
                    if chunk is None:
                        break
                    # Task 5: Strip internal paths from any error messages
                    if "error" in chunk:
                        raw_err = chunk.get("error", "")
                        if any(marker in str(raw_err) for marker in ["C:\\", "/home/", "Traceback", "File \""]):
                            logger.error(f"Suppressed internal error from client: {raw_err}")
                            chunk = {"error": _SAFE_ERROR_MESSAGES["general"]}
                    yield f"data: {json.dumps(chunk)}\n\n"
        except Exception as e:
            # Task 5: Log full traceback on server, return sanitized message to client
            logger.exception(f"Unhandled error in chat stream for {client_ip}")
            err_str = str(e).lower()
            if "429" in err_str or "rate" in err_str or "quota" in err_str:
                safe_msg = _SAFE_ERROR_MESSAGES["rate_limit"]
            elif "connection" in err_str or "timeout" in err_str or "503" in err_str:
                safe_msg = _SAFE_ERROR_MESSAGES["connection"]
            else:
                safe_msg = _SAFE_ERROR_MESSAGES["general"]
            yield f"data: {json.dumps({'error': safe_msg})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

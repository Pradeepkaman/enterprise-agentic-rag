import asyncio
import threading
import logging
import os
import time
from collections import defaultdict
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
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
]

# Support any port on localhost, loopback, or private LAN IPs
_ALLOWED_ORIGIN_RE = re.compile(
    r"^https?://(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$"
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
# Task 8: Health & Readiness Endpoints
# ──────────────────────────────────────────────────────────────────────
@app.get("/")
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
    uvicorn.run(app, host="127.0.0.1", port=8000)

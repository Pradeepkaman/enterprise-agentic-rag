FROM python:3.10-slim

# Set low-memory environment variables for 512MB environments like Render Free
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    MALLOC_ARENA_MAX=2 \
    OMP_NUM_THREADS=1 \
    TOKENIZERS_PARALLELISM=false \
    ENABLE_RERANKER=false \
    HF_HOME=/app/model_cache \
    PORT=8000

WORKDIR /app

# Install system dependencies (build-essential, curl)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Non-root user setup
RUN useradd -m -u 1000 user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Copy dependency specifications first to leverage Docker layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source code, PDFs, and question bank
COPY src/ ./src/
COPY question_bank.json .
COPY source_pdfs/ ./source_pdfs/

# Unpack pre-indexed vector database in 2 seconds (eliminating 22-minute build!)
COPY chroma_db.tar.gz .
RUN tar -xzf chroma_db.tar.gz && rm chroma_db.tar.gz

# Create model cache directory and assign ownership
RUN mkdir -p /app/model_cache /home/user && \
    chown -R user:user /app /home/user

# Switch to non-root user
USER user

# Support Render ($PORT) and other cloud hosts
EXPOSE 8000 7860 10000

# Launch FastAPI via uvicorn listening on 0.0.0.0:${PORT}
CMD ["sh", "-c", "uvicorn src.app:app --host 0.0.0.0 --port ${PORT:-8000}"]

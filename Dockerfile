FROM python:3.10-slim

# Set low-memory environment variables for 512MB environments like Render Free
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    MALLOC_ARENA_MAX=2 \
    OMP_NUM_THREADS=1 \
    TOKENIZERS_PARALLELISM=false \
    ENABLE_RERANKER=false \
    HF_HOME=/app/model_cache

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
    pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt

# Pre-download the ONNX embedding model for instant startup and zero-delay retrieval
RUN python -c "from huggingface_hub import hf_hub_download; from transformers import AutoTokenizer; hf_hub_download('BAAI/bge-small-en-v1.5', 'onnx/model.onnx'); AutoTokenizer.from_pretrained('BAAI/bge-small-en-v1.5')"

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

# Support Render ($PORT default 10000) and other cloud hosts
EXPOSE 10000 8000 7860

# Launch FastAPI via python module (reads $PORT natively with fallback to 10000)
CMD ["python", "-m", "src.app"]

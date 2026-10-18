FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=7860

WORKDIR /app

# Install system dependencies (build-essential, curl)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Hugging Face Spaces requires running as a non-root user (UID 1000)
RUN useradd -m -u 1000 user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Copy dependency specifications first to leverage Docker layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source code, PDFs, vector DB, and metadata
COPY src/ ./src/
COPY question_bank.json .

# Copy source PDFs and ChromaDB vector store if present
COPY source_pdfs/ ./source_pdfs/
COPY chroma_db/ ./chroma_db/

# Ensure all files in /app are owned by user 1000
RUN chown -R user:user /app

# Switch to non-root user
USER user

# Hugging Face Spaces standard listening port
EXPOSE 7860

# Launch FastAPI via uvicorn listening on 0.0.0.0:7860
CMD ["sh", "-c", "uvicorn src.app:app --host 0.0.0.0 --port ${PORT:-7860}"]

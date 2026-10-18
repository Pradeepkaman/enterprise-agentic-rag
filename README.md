---
title: Enterprise Agentic RAG Platform
emoji: ⚡
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# Enterprise Agentic RAG Platform

[![Hugging Face Spaces](https://img.shields.io/badge/%F0%9F%A4%97%20Hugging%20Face-Spaces-blue)](https://huggingface.co/spaces)
[![FastAPI](https://img.shields.io/badge/FastAPI-2.0.0-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![NVIDIA NIM](https://img.shields.io/badge/NVIDIA-NIM%20Llama%203.2-76B900?logo=nvidia&logoColor=white)](https://build.nvidia.com)
[![Google Gemini](https://img.shields.io/badge/Google-Gemini%20Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev)

An enterprise-grade, visual **Retrieval-Augmented Generation (RAG)** platform engineered for academic and enterprise research with deep research transparency, grounded claim-level verification, and sub-second retrieval speeds.

Featuring a high-performance **FastAPI** backend with multi-model self-healing failover (defaulting to ultra-fast **NVIDIA NIM** with **Google Gemini** redundancy) and a modern **React 19 / TanStack Start** frontend styled with clean **JetBrains Mono** typography and live 10-step telemetry tracking.

---

## 🌟 Key Features

- **10-Step Real-Time Pipeline Telemetry**: Live visualization of every execution stage (`Query Analysis` → `HyDE` → `Embedding` → `Retrieval` → `Rank Fusion` → `Re-ranking` → `Context Assembly` → `Synthesis` → `Grounding Check` → `Final Answer`).
- **NVIDIA NIM Default & Self-Healing Failover**: Defaults to high-speed NVIDIA NIM (`meta/llama-3.2-11b-vision-instruct`) with automatic circuit-breaker failover to Google Gemini (`gemini-2.5-flash`).
- **Interactive Agent Observatory**: Real-time right-side inspector panel to examine vector distances, semantic expansions, token allocations, and factual claims step-by-step.
- **Smart Intent Routing**: Fast regex and model classification distinguishes small talk (`chitchat`) from academic research (`knowledge`), saving compute and skipping vector lookups for greetings.
- **Hypothetical Document Embeddings (HyDE)**: Synthesizes hypothetical answers before vector retrieval to bridge vocabulary gaps between questions and textbook passages.
- **Reciprocal Rank Fusion (RRF) & Re-Ranking**: Combines vector search results across raw and expanded queries, deduplicating with RRF and scoring through a Cross-Encoder (`cross-encoder/ms-marco-MiniLM-L-2-v2`).
- **Automated Claim Grounding Verification**: Breaks synthesized drafts into atomic factual statements and cross-verifies each claim against retrieved sources, displaying a verified `GROUNDED` badge.
- **38 Academic Syllabi Indexed**: 100% coverage across 10 major technical subjects (AI, ML, DL, OS, CN, SE, ADA, Java, OOPs with Java, Indian Constitution).
- **Enterprise Security Hardening**: Sliding-window IP rate limiting (20 RPM), CPU concurrency semaphore (max 3 concurrent jobs), origin-regex CORS, and prompt injection XML delimiters.
- **Clean Developer Aesthetics**: Styled with crisp `JetBrains Mono` typography, user initials profile badges, dark/light modes, and custom targeting cursor interactions.

---

## 📁 Repository Structure

```text
RAG/
├── src/                          # FastAPI Backend Engine
│   ├── app.py                    # API entrypoint, rate limiter, CORS, SSE endpoints
│   ├── retrieve.py               # 10-step agentic RAG pipeline & LLM failover logic
│   └── ingest.py                 # Multi-PDF page-by-page parser & ChromaDB vector indexer
│
├── frontend/                     # React 19 + TanStack Start Frontend Workspace
│   ├── src/
│   │   ├── components/           # UI components, pipeline visualizer, inspector
│   │   ├── routes/               # File-based routing (Login '/' & Dashboard '/dashboard')
│   │   └── styles.css            # Tailwind CSS v4 design system tokens (JetBrains Mono)
│   ├── public/                   # Static assets & logos
│   ├── package.json              # Frontend dependencies and scripts
│   └── vite.config.ts            # Vite configuration
│
├── documentation/                # Enterprise Documentation & Specifications
│   ├── audits/                   # Complete 3-Phase Benchmark Audit Reports
│   ├── diagrams/                 # UML, Flowcharts, and Architecture SVG/PNGs
│   ├── 38_PDF_QUESTION_BANK.md   # Complete 38-document question dataset
│   ├── MASTER_ENTERPRISE_AUDIT_SCORECARD.md # Benchmark summary scorecard
│   ├── PRD.md                    # Product Requirements Document
│   └── VERCEL_DEPLOYMENT_GUIDE.md# Step-by-step production deployment guide
│
├── chroma_db/                    # Local persistent ChromaDB vector store
├── source_pdfs/                  # Raw syllabus PDF documents
├── benchmark_rag.py              # Master enterprise CLI evaluation & benchmark suite
├── question_bank.json            # Structured benchmark test cases (38 documents)
├── test_suite.py                 # Backend integration test suite
├── requirements.txt              # Python production dependencies
├── package.json                  # Root monorepo scripts
├── .gitignore                    # Production gitignore rules
└── README.md                     # Project documentation
```

---

## 🏗️ 10-Step Agentic Architecture

```text
                              [ User Query ]
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │ 1. User Query & Intent Router                           │
       │    Classifies intent: "chitchat" vs. "knowledge"        │
       └────────────────────────────┬────────────────────────────┘
                                    │
               ┌────────────────────┴────────────────────┐
               │ (Knowledge)                             │ (Chitchat)
               ▼                                         │
┌──────────────────────────────┐                         │
│ 2. Query Expansion (HyDE)    │                         │
│    Generates hypothetical doc│                         │
└──────────────┬───────────────┘                         │
               ▼                                         │
┌──────────────────────────────┐                         │
│ 3. Dense Query Embedding     │                         │
│    BAAI/bge-small-en-v1.5    │                         │
└──────────────┬───────────────┘                         │
               ▼                                         │
┌──────────────────────────────┐                         │
│ 4. Vector DB Retrieval       │                         │
│    ChromaDB cosine search    │                         │
└──────────────┬───────────────┘                         │
               ▼                                         │
┌──────────────────────────────┐                         │
│ 5. Fusion & Deduplication    │                         │
│    Reciprocal Rank Fusion    │                         │
└──────────────┬───────────────┘                         │
               ▼                                         │
┌──────────────────────────────┐                         │
│ 6. Cross-Encoder Re-Ranking  │                         │
│    ms-marco-MiniLM-L-2-v2    │                         │
└──────────────┬───────────────┘                         │
               ▼                                         │
┌──────────────────────────────┐                         │
│ 7. Context Assembly          │                         │
│    Token budget & citations  │                         │
└──────────────┬───────────────┘                         │
               ▼                                         │
┌──────────────────────────────┐                         │
│ 8. LLM Synthesis             │                         │
│    NVIDIA NIM / Gemini stream│                         │
└──────────────┬───────────────┘                         │
               ▼                                         │
┌──────────────────────────────┐                         │
│ 9. Grounding Claim Check     │                         │
│    Claim-level verification  │                         │
└──────────────┬───────────────┘                         │
               │                                         │
               ▼                                         ▼
┌────────────────────────────────────────────────────────────────┐
│ 10. Final Answer & Telemetry Finalization                      │
│     Grounded answer + source citations + real-time metrics     │
└────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Backend
- **Framework:** FastAPI with Uvicorn (ASGI)
- **Vector Database:** ChromaDB (persistent local cosine index)
- **Dense Embedding Model:** `BAAI/bge-small-en-v1.5` (384 dimensions)
- **Re-Ranking Cross-Encoder:** `cross-encoder/ms-marco-MiniLM-L-2-v2`
- **PDF Extraction:** PyMuPDF (`fitz`) + Tesseract OCR support
- **Default LLM:** NVIDIA NIM (`meta/llama-3.2-11b-vision-instruct`)
- **Failover LLM:** Google Gemini (`gemini-2.5-flash`) via OpenAI-compatible interface

### Frontend
- **Framework:** TanStack Start (SSR) + React 19
- **Bundler:** Vite 8
- **Styling:** Vanilla CSS design tokens + Tailwind CSS v4 + Motion
- **Icons:** Lucide React
- **Typography:** `JetBrains Mono` (Google Fonts)

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+** & **npm**

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
# NVIDIA NIM API Key (Default High-Speed Model)
NVIDIA_API_KEY="your-nvidia-api-key"

# Google Gemini API Key (Failover Model)
GEMINI_API_KEY="your-gemini-api-key"
```

### 3. Backend Setup
```bash
# Create and activate virtual environment
python -m venv venv
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Linux / macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 4. Frontend Setup
```bash
cd frontend
npm install
cd ..
```

### 5. Running the Application
Start the backend server:
```bash
python -m uvicorn src.app:app --host 127.0.0.1 --port 8000 --reload
```

In a separate terminal, start the frontend dev server:
```bash
npm run dev
```

- **Frontend Application:** [http://localhost:8080](http://localhost:8080)
- **Backend API:** [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 📊 Running the Enterprise Benchmark Suite

The repository includes a comprehensive automated evaluation suite evaluating 38 technical subjects:

```bash
python benchmark_rag.py --model nvidia
```

This runs precision, recall, and grounding verification tests across all course domains and outputs detailed latency percentiles (P50/P90/P99) and grounding accuracy scores.

---

## 📦 Pushing to GitHub & Deploying to Vercel

### Step 1: Initialize Git and Push to GitHub

1. Ensure Git is initialized and check tracked files:
```bash
git status
```
2. Stage and commit all clean project files:
```bash
git add .
git commit -m "feat: Enterprise Agentic RAG Platform v2.0 - Clean production release"
```
3. Link your GitHub remote repository and push:
```bash
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

---

### Step 2: Deploying the Frontend to Vercel

1. Log into your [Vercel Dashboard](https://vercel.com).
2. Click **Add New Project** and import your GitHub repository.
3. In the project setup configuration:
   - **Root Directory:** Edit and select `frontend`.
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist` (or `.output/public` for SSR)
4. Under **Environment Variables**, add:
   ```env
   VITE_API_URL=https://your-backend-api-url.com
   ```
5. Click **Deploy**. Vercel will build and assign a global production URL (e.g., `https://your-rag-app.vercel.app`).

---

### Step 3: Hosting the Python FastAPI Backend

Since Vercel is optimized for frontend and edge runtimes, the Python backend can be hosted on:
- **Render.com / Railway.app / Fly.io** (Recommended for FastAPI + ChromaDB):
  - **Build Command:** `pip install -r requirements.txt`
  - **Start Command:** `uvicorn src.app:app --host 0.0.0.0 --port $PORT`
  - Set `NVIDIA_API_KEY` and `GEMINI_API_KEY` in the service environment variables.
  - Paste the resulting backend URL into your Vercel frontend `VITE_API_URL` setting.

For full architectural details, consult [`documentation/VERCEL_DEPLOYMENT_GUIDE.md`](documentation/VERCEL_DEPLOYMENT_GUIDE.md).

---

## 📜 Documentation Index

All technical specifications, audit logs, and architecture blueprints are located in [`documentation/`](documentation/):

- [`documentation/PRD.md`](documentation/PRD.md) — Product Requirements & Architectural Specification.
- [`documentation/MASTER_ENTERPRISE_AUDIT_SCORECARD.md`](documentation/MASTER_ENTERPRISE_AUDIT_SCORECARD.md) — 38-Document Verification Scorecard.
- [`documentation/VERCEL_DEPLOYMENT_GUIDE.md`](documentation/VERCEL_DEPLOYMENT_GUIDE.md) — Complete Step-by-Step Vercel Deployment Guide.
- [`documentation/38_PDF_QUESTION_BANK.md`](documentation/38_PDF_QUESTION_BANK.md) — Complete Evaluation Question Bank.
- [`documentation/audits/`](documentation/audits/) — Detailed Phase 1, Phase 2, Phase 3, and Post-OCR Audit Reports.
- [`documentation/diagrams/`](documentation/diagrams/) — System Flowcharts, Sequence Diagrams, and Architecture Graphics.

---

## 📄 License

MIT License. Designed and developed for advanced agentic research.

# Product Requirements Document (PRD) — V2.0 Production Specification

**Project:** Enterprise-Grade Agentic RAG Platform  
**Target Milestone:** Production Visual Workspace  
**Status:** Implemented & Verified 🟢  

---

## 1. Vision & Executive Goal
To build an enterprise-grade Retrieval-Augmented Generation (RAG) platform that operates with the intelligence, speed, and deep research transparency of leading industry systems (such as ChatGPT Enterprise and Perplexity).

The platform serves as an advanced educational and enterprise knowledge assistant, capable of synthesizing answers from complex multi-subject documents with verified claim-level source citations and live step-by-step telemetry.

---

## 2. Target Users & Core Needs
- **Primary Users:** Researchers, engineering students, and enterprise knowledge workers.
- **Core Need:** Accurate, hallucination-free answers with verifiable source attribution, combined with educational visibility into how advanced AI pipelines retrieve, re-rank, and ground context under the hood.

---

## 3. Data Ingestion & Knowledge Structure
- **Source Material:** Multi-subject academic and technical PDF documents (`source_pdfs/`).
- **Hierarchy & Metadata:**
  - Subject Name
  - Module / Category
  - Chapter / Topic
  - Source File Name & Page Number
- **Vector Storage:** Local persistent ChromaDB with cosine distance metric.
- **Dense Embeddings:** `BAAI/bge-small-en-v1.5` (384-dimensional dense vectors).

---

## 4. Core Features & Capabilities

### 4.1. Real-Time 10-Step Agentic Pipeline
The system executes a strictly sequential, transparent 10-step pipeline:
1. **User Query Analysis & Intent Routing**: Differentiates between casual conversational queries (`chitchat`) and document-backed research (`knowledge`).
2. **Query Expansion (HyDE)**: Synthesizes a hypothetical answer paragraph to bridge query-document semantic gaps.
3. **Dense Query Embedding**: Embeds both raw and expanded queries into 384-dimensional vectors.
4. **Multi-Query Vector Retrieval**: Scans ChromaDB for candidate chunks meeting minimum cosine similarity thresholds.
5. **Reciprocal Rank Fusion (RRF)**: Merges and deduplicates hits across raw and expanded query retrievals.
6. **Cross-Encoder Re-Ranking**: Computes deep cross-attention relevance scores (`cross-encoder/ms-marco-MiniLM-L-2-v2`) and filters low-confidence noise.
7. **Context Assembly with Dynamic Token Budgeting**: Selects top passages within token constraints and builds citation maps.
8. **Streaming LLM Synthesis**: Streams answer tokens via SSE from Google Gemini (`gemini-3.8-flash`) with automatic failover to NVIDIA NIM (`meta/llama-3.2-11b-vision-instruct`).
9. **Claim Grounding Verification**: Extracts factual claims from the draft and verifies each against retrieved source context, calculating a grounding confidence percentage.
10. **Final Answer Assembly**: Assembles citations, grounding badge, and complete execution telemetry.

### 4.2. Dual-Model Self-Healing Architecture
- Automatic circuit-breaking on HTTP 429/503 errors.
- Timed 300-second circuit breaker prevents repeated failures against exhausted primary quotas.
- Zero-interruption failover to NVIDIA NIM.

### 4.3. Interactive Visual Telemetry UI
- Right-side collapsible pipeline panel displaying real-time status (`queued` → `running` → `done` / `skipped`) and millisecond execution timers.
- Interactive detail drawer allowing deep inspection of raw data at each pipeline step.
- Retro-modern typewriter aesthetic with unified `Courier Prime` monospace typography.

### 4.4. Enterprise Security Hardening
- Sliding-window IP rate limiting (20 RPM).
- Semaphore-protected concurrency (maximum 3 simultaneous retrieval operations).
- Strict origin-regex CORS configuration.
- Prompt injection isolation with strict `<user_input>` XML delimiters.
- Refusal short-circuiting for zero-latency handling of out-of-domain queries.

---

## 5. Technical Stack Summary

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Python 3.10+, FastAPI, Uvicorn, Pydantic v2 |
| **Embeddings & Re-ranking** | SentenceTransformers (`bge-small-en-v1.5`), CrossEncoder (`ms-marco-MiniLM-L-2-v2`) |
| **Vector DB** | ChromaDB (local persistence) |
| **LLM Inference** | Google Gemini (`gemini-3.8-flash`), NVIDIA NIM (`meta/llama-3.2-11b-vision-instruct`) |
| **Frontend** | React 19, TanStack Start, Vite 8, Tailwind CSS v4 |
| **Typography** | `Courier Prime` / Monospace |
| **Streaming** | Server-Sent Events (SSE) |

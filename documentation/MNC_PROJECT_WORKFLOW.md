# MNC Project Lifecycle & Engineering Workflow

In modern Multinational Corporations (MNCs), software development follows a strict, predictable, and scalable lifecycle based on Agile/Scrum methodologies. This document records the phased execution of our Enterprise Agentic RAG Platform from initial discovery through production hardening and sign-off.

---

## Phase 1: Product Discovery & Requirements (PRD)
**Status:** Completed 🟢  
- **Objective:** Defined core goals, user persona, and data hierarchy.
- **Deliverables:** [PRD.md](file:///c:/Users/ASUS/OneDrive/Desktop/RAG/PRD.md).
- **Outcome:** Shifted from naive RAG to an enterprise Agentic RAG architecture with full educational telemetry.

---

## Phase 2: System Design & Architecture
**Status:** Completed 🟢  
- **Objective:** Architectural selection of multi-model inference, vector storage, and re-ranking.
- **Deliverables:** High-Level Design (HLD), vector schema in ChromaDB, dual-model failover design.
- **Outcome:** Selected `BAAI/bge-small-en-v1.5` embeddings, `ms-marco-MiniLM-L-2-v2` cross-encoder, and Google Gemini / NVIDIA NIM self-healing failover.

---

## Phase 3: Project Setup & DevOps Foundations
**Status:** Completed 🟢  
- **Objective:** Established reproducibility, dependency management, and repository structure.
- **Deliverables:** Virtual environment (`venv`), `requirements.txt`, `.gitignore`, environment configuration (`.env`).
- **Outcome:** Isolated environment preventing dependency collisions and securing API keys.

---

## Phase 4: Agile Development (Backend Sprints)
**Status:** Completed 🟢  
- **Objective:** Built robust ingestion, multi-query routing, HyDE expansion, and streaming retrieval.
- **Deliverables:** `src/ingest.py`, `src/retrieve.py`.
- **Outcome:** Full 10-step asynchronous generator streaming SSE frames with millisecond-precision stage metrics.

---

## Phase 5: Web UI & Full Stack Integration
**Status:** Completed 🟢  
- **Objective:** Modern, responsive chat UI with live telemetry panel and interactive stage inspection.
- **Deliverables:** React 19 + TanStack Start frontend in `frontend/`, `src/app.py` FastAPI server.
- **Outcome:** Visual 10-step timeline, citation badges, slide-over details inspector, and typewriter dark-mode theme.

---

## Phase 6: Testing, QA & Security Hardening
**Status:** Completed 🟢  
- **Objective:** End-to-end vulnerability assessment and automated defect mitigation.
- **Deliverables:**
  - Automated circuit-breaker preventing cascade quota exhaustion.
  - Rate limiting (20 RPM) & concurrency semaphore (max 3 concurrent jobs).
  - Pydantic input guardrails protecting against empty/malformed messages.
  - Strict CORS origin regex preventing cross-origin exploits.
  - Prompt injection XML delimiters.
  - 1 ms short-circuiting for out-of-domain refusal grounding checks.
- **Outcome:** Robust, self-healing pipeline verified across stress conditions and API limits.

---

## Phase 7: Deployment Stability & Production Sign-Off
**Status:** Completed 🟢  
- **Objective:** Fixed Windows NTFS junction watcher conflicts and unified visual typography.
- **Deliverables:**
  - Automated `patch-tanstack.js` postinstall script fixing Windows junction path bounces.
  - Scoped Uvicorn dev watcher (`--reload-dir src`) eliminating recursive reload loops.
  - 100% unified typography to `Courier Prime` monospace across the entire user interface.
  - Synchronized `Final Answer` stage visualization so all 10 steps visit and complete cleanly.
- **Outcome:** Platform verified live, stable, and performing as a production-grade RAG workspace.

---

## Phase 8: Comprehensive Testing, QA & User Acceptance (UAT)
**Status:** Completed 🟢  
- **Objective:** Rigorous end-to-end regression testing across the API layer, RAG retrieval accuracy, guardrails, and new interactive UI features.
- **Deliverables:**
  - Automated regression test suite ([`test_suite.py`](file:///c:/Users/ASUS/OneDrive/Desktop/RAG/test_suite.py)):
    1. **Knowledge Catalog API (`GET /sources`):** Verified 38 course syllabus PDFs indexed with size, metadata, and status badges.
    2. **Input Guardrails & Schema Validation:** Verified Pydantic rejection (HTTP 422) on empty/malformed payloads and out-of-spec model parameters.
    3. **Intent Classification & Chitchat Route:** Verified sub-second fast path for conversational greetings without invoking unnecessary vector search.
    4. **Full 10-Step RAG Retrieval & Grounding:** Tested with complex technical query (Operating Systems Deadlock) — verified HyDE expansion, ChromaDB retrieval, CrossEncoder re-ranking, token streaming, and factual claim grounding.
  - End-to-End UI & Functional Feature Verification:
    1. **Interface Theme:** Verified clean white default theme (light mode) with instant dark/light switching.
    2. **Search Bar Detailing:** Verified dynamic counter displaying `38 SOURCES ACTIVE` and removal of attachment/adjustment clutter.
    3. **Knowledge Base Dialog:** Verified modal opens and displays all 38 PDFs from `source_pdfs/` with `Ready` tags.
    4. **Chat Management:** Verified three-dots dropdown options (`Pin this chat` and `Delete`) with the pin icon (`📌`) positioned to the left of the three dots.
    5. **Collapsible Inspector:** Verified `>` collapse toggle expands chat/pipeline to 100% width, with `<` and card-click reopen options.
    6. **Pipeline Telemetry Sync:** Verified all 10 stages progress and finalize to `done` without getting stuck on `generating`.
- **Outcome:** 100% test pass rate across backend regression and frontend interactions; system is rock-solid and enterprise-certified.


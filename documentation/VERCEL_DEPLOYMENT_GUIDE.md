# Enterprise RAG: Vercel & Production Deployment Guide

This guide details the complete process for deploying the **Agentic RAG Frontend** to **Vercel** and connecting it with your FastAPI backend.

---

## 1. Architecture Overview

```
[ Client Browser ]
        │
        ▼ (HTTPS)
[ Vercel Edge / CDN ]  <───  TanStack Start + React + Tailwind Frontend (frontend/)
        │
        ▼ (REST / SSE Streaming to /chat & /health)
[ FastAPI Backend ]    <───  Python 3.10+ / ChromaDB Vector Store / NVIDIA NIM LLM
```

---

## 2. Frontend Deployment to Vercel

### Step 1: Git Repository Setup
Ensure your project repository is committed and pushed to GitHub or GitLab:
```bash
git add .
git commit -m "Complete 38-PDF RAG benchmark and documentation"
git push origin main
```

### Step 2: Import Project into Vercel
1. Log into your [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** > **Project**.
3. Select your GitHub repository.
4. Set the **Root Directory** to:
   ```text
   frontend
   ```
5. Choose **Vite** or **Other** as the Framework Preset.

### Step 3: Configure Build & Output Settings
In the Vercel Project Settings:
* **Build Command:** `vite build`
* **Output Directory:** `.output/public`
* **Install Command:** `npm install`

### Step 4: Environment Variables on Vercel
Add the following Environment Variables in the Vercel Project Dashboard:

| Variable Name | Value | Purpose |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://your-rag-backend.onrender.com` (or Railway/Fly.io URL) | URL pointing to the FastAPI backend |
| `NITRO_PRESET` | `vercel` | Optimizes Nitro for Vercel Serverless & Edge deployment |

Click **Deploy**!

---

## 3. Backend Deployment (Hosting the FastAPI Python Server)

The backend requires Python and persistent storage for ChromaDB. The recommended free/low-cost platforms are:

### Option A: Render.com (Recommended)
1. In Render, select **New Web Service**.
2. Connect your repository.
3. Configure settings:
   * **Root Directory:** `.`
   * **Runtime:** `Python 3`
   * **Build Command:** `pip install -r requirements.txt`
   * **Start Command:** `uvicorn src.app:app --host 0.0.0.0 --port $PORT`
4. Environment Variables on Render:
   * `NVIDIA_API_KEY`: Your NVIDIA NIM API key
   * `GEMINI_API_KEY`: Your Gemini API key
   * `CHROMA_DB_PATH`: `./chroma_db`

### Option B: Railway.app
1. Create a **New Project** from GitHub.
2. Railway automatically detects `requirements.txt`.
3. Set the Start Command to `uvicorn src.app:app --host 0.0.0.0 --port $PORT`.

---

## 4. Verifying Post-Deployment Connectivity

Once both the backend and Vercel frontend are deployed:

1. Test Backend Health:
   ```bash
   curl https://your-backend-url.onrender.com/health
   ```
   Expected response:
   ```json
   {
     "status": "healthy",
     "service": "Agentic RAG Backend",
     "version": "2.0.0",
     "vector_db_ready": true
   }
   ```

2. Open the Vercel frontend URL in your browser:
   * Check browser console network tab to ensure `/chat` requests stream SSE tokens smoothly.
   * Verify source document citations display with the correct PDF tags.

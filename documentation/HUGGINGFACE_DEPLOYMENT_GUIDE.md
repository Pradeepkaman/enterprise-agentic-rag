# Enterprise Agentic RAG: Hugging Face Spaces Deployment Guide

Deploying your Agentic RAG Platform on **Hugging Face Spaces** gives you instant exposure to the global AI and machine learning developer community, free cloud compute with **16 GB RAM & 2 vCPUs**, and an interactive public URL to showcase on your portfolio and resume.

---

## 🚀 Why Hugging Face Spaces?

1. **Free 16 GB RAM Infrastructure**: Traditional free tiers (like Render or Vercel functions) have strict 512 MB memory limits that easily crash (OOM) when running vector embeddings and cross-encoder re-rankers. Hugging Face Spaces provides **16 GB of memory** for free.
2. **Community Visibility & Credibility**: Your project gets indexed on Hugging Face's global Hub, featured on your profile, and can be starred/liked by AI researchers and hiring managers worldwide.
3. **Built-in Playground**: Visitors can test academic queries directly inside your Hugging Face Space iframe with live 10-step telemetry and streaming responses.
4. **Interactive Swagger Documentation**: The `/docs` endpoint allows other developers to integrate your RAG engine as an API.

---

## 📋 Step-by-Step Deployment Instructions

### Step 1: Create a Hugging Face Account
If you don't already have one, create a free account at [huggingface.co/join](https://huggingface.co/join).

---

### Step 2: Create a New Space
1. Open [huggingface.co/new-space](https://huggingface.co/new-space).
2. Configure your Space:
   - **Space name**: `enterprise-agentic-rag` (or your preferred name)
   - **License**: `Apache 2.0` or `MIT`
   - **Select the Space SDK**: Choose **Docker** > **Blank**
   - **Space hardware**: Select **CPU Basic • 2 vCPU • 16 GB • Free**
   - **Visibility**: **Public**
3. Click **Create Space**.

---

### Step 3: Add API Keys (Variables & Secrets)
Your Space needs API keys for LLM synthesis and failover:
1. In your new Space, click on the **Settings** tab.
2. Scroll to the **Variables and secrets** section.
3. Under **Secrets**, click **New secret**:
   - **Key**: `NVIDIA_API_KEY` | **Value**: *(Your NVIDIA NIM API key)*
   - Click **Save**.
4. Click **New secret** again:
   - **Key**: `GEMINI_API_KEY` | **Value**: *(Your Google Gemini API key)*
   - Click **Save**.

> [!NOTE]
> Secrets are strictly confidential and encrypted by Hugging Face. They are never exposed in your public code or container logs.

---

### Step 4: Push Your Code to Hugging Face Spaces

You have two convenient ways to push your project:

#### Option A: Direct Web Upload (Easiest - Handles Vector DB automatically)
1. On your Hugging Face Space page, click the **Files** tab.
2. Click **Add file** > **Upload files**.
3. Drag and drop the following files/folders from your project:
   - `Dockerfile`
   - `README.md`
   - `requirements.txt`
   - `question_bank.json`
   - `src/` folder
   - `chroma_db/` folder *(Hugging Face automatically manages large SQLite database files)*
   - `source_pdfs/` folder
4. Scroll down and click **Commit changes to main**.

#### Option B: Git Command Line (Recommended for Developers)
1. In your local project directory, add your Hugging Face Space as a git remote:
   ```powershell
   git remote add space https://huggingface.co/spaces/YOUR_HF_USERNAME/enterprise-agentic-rag
   ```
2. Push your project to the Space:
   ```powershell
   git push space main
   ```
*(If prompted for credentials, use your Hugging Face username and a Personal Access Token with Write permissions created from [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)).*

---

### Step 5: Watch the Build & Launch

1. Go to the **App** tab of your Space.
2. You will see the container building live:
   - `pip install -r requirements.txt`
   - Downloading embedding models
   - Starting Uvicorn server on port `7860`
3. When the status changes to **Running**, your application is live!

---

## 🌟 How to Showcase Your Space for Maximum Recognition

1. **Add the Hugging Face Badge to your GitHub README**:
   ```markdown
   [![Hugging Face Spaces](https://img.shields.io/badge/%F0%9F%A4%97%20Hugging%20Face-Spaces-blue)](https://huggingface.co/spaces/YOUR_HF_USERNAME/enterprise-agentic-rag)
   ```
2. **Post on LinkedIn**:
   - Record a 30-second screen capture running a query like *"What are the 4 conditions for deadlock in OS?"*
   - Highlight:
     - 10-step real-time telemetry (HyDE + RRF + Cross-Encoder + Grounded verification).
     - Deployed on Hugging Face Spaces with 16GB RAM container.
     - Multi-model self-healing failover between NVIDIA NIM and Google Gemini.
   - Tag `@Hugging Face` and `@NVIDIA AI`.
3. **Share on X / Twitter & Reddit (r/LocalLLaMA & r/MachineLearning)**:
   - Share your live Hugging Face Space URL. The Hugging Face community loves interactive demos and frequently upvotes novel RAG architectures!

export type Passage = {
  id: string;
  doc: string;
  page: number;
  text: string;
  cos?: number;
  score?: number;
  used?: boolean;
};

export type StepDetail = {
  id: string;
  type: string;
  summary: string;
  inputs?: any;
  process?: any;
  outputs?: any;
  failurePath?: string;
};

export const pipelineDetails: Record<string, StepDetail> = {
  "indexing": {
    id: "indexing",
    type: "indexing",
    summary: "Load -> Parse & clean -> Chunk -> Attach metadata -> Embed -> Store.",
    inputs: { docs: 3 },
    process: { chunkSettings: "256 tok · 64 overlap", model: "all-MiniLM-L6-v2", dimensions: 384, store: "ChromaDB (research_docs)" },
    outputs: {
      chunks: 64,
      table: [
        { name: "Complete JAVA.pdf", pages: 345, chunks: 842 },
        { name: "Indian Constitution Notes.pdf", pages: 120, chunks: 315 },
        { name: "Syllabus_2024.pdf", pages: 9, chunks: 14 },
      ]
    },
    failurePath: "Runs once at upload time, not per query."
  },
  "query": {
    id: "query",
    type: "query",
    summary: "Received and normalized user query.",
    inputs: { text: "ok i think you know this JAVA", chars: 29, tokens: 6, lang: "en", timestamp: new Date().toISOString(), session: "ses_8a92f" },
    process: { chatHistoryUsed: "yes" },
    outputs: { normalized: "ok i think you know this java" },
  },
  "hyde": {
    id: "hyde",
    type: "hyde",
    summary: "Generated hypothetical answers to improve retrieval.",
    inputs: { model: "meta/llama-3.2-11b-vision-instruct", temp: 0.7, maxTokens: 150 },
    process: {
      prompt: `Please write a short, hypothetical answer to the following question. Focus on keywords and concepts that would likely appear in a factual document on the topic.\n\nQuestion: {query}\nAnswer:`
    },
    outputs: {
      tokensIn: 42,
      tokensOut: 64,
      h1: "Java is a high-level, class-based, object-oriented language...",
      h2: "It is designed to have as few implementation dependencies as possible..."
    },
    failurePath: "If HyDE fails or times out, continue with the original query only.\nHypothetical answers, used only for retrieval. Never shown to the user as facts."
  },
  "embed": {
    id: "embed",
    type: "embed",
    summary: "Converted texts into dense vector representations.",
    process: { model: "all-MiniLM-L6-v2", dims: 384, maxSeqLen: 256, norm: "on" },
    inputs: [
      { id: "q", tokens: 6, truncated: false, vec: [0.021, -0.114, 0.087, 0.041, -0.012, 0.104] },
      { id: "h1", tokens: 15, truncated: false, vec: [0.012, -0.094, 0.187, -0.021, 0.033, 0.154] },
      { id: "h2", tokens: 14, truncated: false, vec: [-0.005, -0.122, 0.045, 0.071, -0.042, 0.088] }
    ]
  },
  "vector": {
    id: "vector",
    type: "vector",
    summary: "Searched vector database for nearest neighbors.",
    process: { store: "ChromaDB", metric: "cosine", scanned: 64, topK: 20, minSim: 0.7 },
    outputs: {
      counts: { q: 20, h1: 20, h2: 20 },
      hits: [
        { q: "q", id: "chunk_412", doc: "Complete JAVA.pdf", page: 45, score: 0.9512, text: "Java is a programming language designed for professional programmers..." },
        { q: "h1", id: "chunk_89", doc: "Complete JAVA.pdf", page: 12, score: 0.8834, text: "It is grounded in the needs and experiences of real, working programmers." },
        { q: "h2", id: "chunk_204", doc: "Indian Constitution Notes.pdf", page: 7, score: 0.8127, text: "Fundamental rights are enshrined in Part III of the Constitution." }
      ]
    },
    failurePath: "Note: Cosine similarity (0.7 here) and re-ranker scores use different scales."
  },
  "fusion": {
    id: "fusion",
    type: "fusion",
    summary: "Merged retrieved lists to boost common candidates.",
    process: { method: "Reciprocal Rank Fusion", k: 60, formula: "score(d) = Σ 1 / (k + rank)" },
    inputs: { candidates: 60 },
    outputs: {
      unique: 41,
      removed: 19,
      fused: [
        { id: "chunk_412", score: 0.048, lists: ["q", "h1"], text: "Java is a programming language designed for professional programmers..." },
        { id: "chunk_89", score: 0.045, lists: ["q", "h2"], text: "It is grounded in the needs and experiences of real, working programmers." },
        { id: "chunk_204", score: 0.031, lists: ["h1"], text: "Fundamental rights are enshrined in Part III of the Constitution." }
      ]
    }
  },
  "rerank": {
    id: "rerank",
    type: "rerank",
    summary: "Re-scored candidates using a cross-encoder.",
    process: { model: "cross-encoder/ms-marco-MiniLM-L-6-v2", threshold: 0.7 },
    inputs: { count: 41 },
    outputs: {
      topK: 5,
      passages: [
        { id: "1", doc: "Complete JAVA.pdf", page: 45, cos: 0.9512, text: "Java is a programming language designed for professional programmers...", used: true },
        { id: "2", doc: "Complete JAVA.pdf", page: 12, cos: 0.8834, text: "It is grounded in the needs and experiences of real, working programmers.", used: true },
        { id: "3", doc: "Indian Constitution Notes.pdf", page: 7, cos: 0.8127, text: "Fundamental rights are enshrined in Part III of the Constitution.", used: true },
        { id: "4", doc: "Complete JAVA.pdf", page: 119, cos: 0.6421, text: "Garbage collection automatically frees memory for objects no longer in use.", used: false },
        { id: "5", doc: "Indian Constitution Notes.pdf", page: 31, cos: 0.5873, text: "Directive Principles of State Policy act as guidelines for the government.", used: false },
      ]
    },
    failurePath: "If 0 passages pass: skip LLM and output 'No documents found'"
  },
  "context": {
    id: "context",
    type: "context",
    summary: "Assembled final context window.",
    process: { ordering: "highest score first", budget: 3000 },
    inputs: { selected: 3, dropped: 2 },
    outputs: {
      tokens: 2184,
      citations: [
        { id: "1", label: "Complete JAVA.pdf p.45" },
        { id: "2", label: "Complete JAVA.pdf p.12" },
        { id: "3", label: "Indian Constitution Notes.pdf p.7" }
      ],
      contextBlock: `[1] Complete JAVA.pdf, p.45\nJava is a programming language designed for professional programmers...\n\n[2] Complete JAVA.pdf, p.12\nIt is grounded in the needs and experiences of real, working programmers.\n\n[3] Indian Constitution Notes.pdf, p.7\nFundamental rights are enshrined in Part III of the Constitution.`
    }
  },
  "synth": {
    id: "synth",
    type: "synth",
    summary: "Generated answer from context.",
    inputs: { model: "meta/llama-3.2-11b-vision-instruct", temp: 0.2, tokensIn: 2184 },
    process: {
      systemPrompt: "Answer only from context. Cite every claim using [id]. Say 'not found' if context lacks answer.",
      streaming: "yes"
    },
    outputs: {
      tokensOut: 412,
      draft: "Trust compounds when retrieval is visible. [1][2][3]"
    }
  },
  "grounding": {
    id: "grounding",
    type: "grounding",
    summary: "Verified claims against context.",
    inputs: { claims: 3 },
    outputs: {
      confidence: 96,
      formula: "avg(claim_scores)",
      table: [
        { claim: "Java is designed for professional programmers", citation: "[1]", score: 0.97, verdict: "supported" },
        { claim: "It is grounded in real working needs", citation: "[2]", score: 0.95, verdict: "supported" },
      ]
    },
    failurePath: "If any claim is unsupported: regenerate once, then flag the claims"
  },
  "answer": {
    id: "answer",
    type: "answer",
    summary: "Streamed final response to user.",
    outputs: {
      text: "Java is a programming language designed for professional programmers [1][2]"
    }
  }
};

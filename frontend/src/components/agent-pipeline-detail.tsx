import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Copy, X, Check, ArrowRight, ArrowLeft, ChevronRight } from "lucide-react";
import { STAGES } from "./agent-pipeline";
import type { PipelineTrace } from "./rag-workspace";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground transition-colors" title="Copy payload">
      {copied ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
    </button>
  );
}

function KVTable({ data, title }: { data: Record<string, any>; title?: string }) {
  return (
    <div className="rounded border border-border bg-background/50 p-2 font-mono text-[10px]">
      {Object.entries(data).map(([k, v]) => {
        // Serialize value properly
        let displayVal: string;
        if (v === null || v === undefined) displayVal = "—";
        else if (typeof v === "object") {
          if (Array.isArray(v)) displayVal = v.length <= 3 ? JSON.stringify(v) : `[${v.length} items]`;
          else displayVal = JSON.stringify(v);
        }
        else displayVal = String(v);
        
        // Truncate long values
        if (displayVal.length > 80) displayVal = displayVal.slice(0, 77) + "…";
        
        return (
          <div key={k} className="flex justify-between py-0.5 border-b border-border/30 last:border-0">
            <span className="text-muted-foreground">{k}</span>
            <span className="text-foreground max-w-[200px] truncate" title={displayVal}>{displayVal}</span>
          </div>
        );
      })}
    </div>
  );
}

function StepContent({ stepId, trace }: { stepId: string; trace: PipelineTrace | null }) {
  const sectionClass = "mt-4 space-y-2 border-t border-border/50 pt-4";
  const titleClass = "text-xs font-semibold text-muted-foreground uppercase font-mono tracking-wider";
  
  const stepTrace = trace?.steps[stepId];
  const data = stepTrace?.data;
  
  if (!stepTrace) {
    return <p className="text-sm text-muted-foreground italic">No trace data yet. This step hasn't executed.</p>;
  }
  
  if (stepTrace.status === "skipped") {
    return (
      <div className="text-sm">
        <p className="text-muted-foreground italic">This step was skipped.</p>
        {trace?.isChitchat && <p className="mt-2 text-xs text-muted-foreground">The query was classified as small talk, so retrieval was not needed.</p>}
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">Step completed in {stepTrace.ms}ms but no detailed data was recorded.</p>;
  }

  // Step-specific rendering
  switch (stepId) {
    case "query":
      return (
        <div className="text-sm">
          <p className="text-muted-foreground">Received and normalized user query.</p>
          <div className={sectionClass}>
            <h3 className={titleClass}>Input</h3>
            <KVTable data={{ text: data.text, chars: data.chars, lang: data.lang }} />
          </div>
        </div>
      );
      
    case "intent":
      return (
        <div className="text-sm">
          <p className="text-muted-foreground">Classified query intent.</p>
          <div className={sectionClass}>
            <h3 className={titleClass}>Result</h3>
            <KVTable data={{ intent: data.intent, model: data.model }} />
          </div>
        </div>
      );
    
    case "hyde":
      return (
        <div className="text-sm">
          <p className="text-muted-foreground">Generated hypothetical answer to improve retrieval (HyDE).</p>
          <div className={sectionClass}>
            <h3 className={titleClass}>Config</h3>
            <KVTable data={{ model: data.model }} />
          </div>
          <div className={sectionClass}>
            <div className="flex items-center justify-between">
              <h3 className={titleClass}>Expanded Query</h3>
              <CopyButton text={data.expandedQuery || ""} />
            </div>
            <div className="max-h-40 overflow-y-auto rounded border border-border bg-background/50 p-2 font-mono text-[10px] text-muted-foreground whitespace-pre-wrap">
              {data.expandedQuery || "—"}
            </div>
          </div>
        </div>
      );
    
    case "embed":
      return (
        <div className="text-sm">
          <p className="text-muted-foreground">Converted texts into dense vector representations.</p>
          <div className={sectionClass}>
            <h3 className={titleClass}>Config</h3>
            <KVTable data={{ model: data.model, dims: data.dims, texts: data.texts?.join(", ") || "query, expanded" }} />
          </div>
        </div>
      );
    
    case "vector": {
      const hits = data.hits || [];
      return (
        <div className="text-sm">
          <p className="text-muted-foreground">Searched vector database for nearest neighbors.</p>
          <div className={sectionClass}>
            <h3 className={titleClass}>Config</h3>
            <KVTable data={{ store: data.store, metric: data.metric, scanned: data.scanned, cosineMinSim: data.cosineMinSim, passed: data.passed, filtered: data.filtered }} />
          </div>
          {hits.length > 0 && (
            <div className={sectionClass}>
              <h3 className={titleClass}>Top Hits</h3>
              <div className="space-y-2">
                {hits.map((hit: any, i: number) => (
                  <div key={i} className="rounded border border-border/50 bg-background/30 p-2 text-[10px]">
                    <div className="flex justify-between mb-1">
                      <span className={`font-mono ${!hit.passed ? "text-muted-foreground line-through" : ""}`}>{hit.doc}</span>
                      <span className={`font-mono ${hit.passed ? "text-cyan" : "text-muted-foreground"}`}>{hit.score?.toFixed(4)}</span>
                    </div>
                    {hit.text && <p className="text-muted-foreground line-clamp-2">"{hit.text}"</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    
    case "fusion":
      return (
        <div className="text-sm">
          <p className="text-muted-foreground">Deduplicated retrieved candidates.</p>
          <div className={sectionClass}>
            <h3 className={titleClass}>Results</h3>
            <KVTable data={{ input: data.input, unique: data.unique, removed: data.removed }} />
          </div>
        </div>
      );
    
    case "rerank": {
      const passages = data.passages || [];
      return (
        <div className="text-sm">
          <p className="text-muted-foreground">Re-scored candidates using a cross-encoder.</p>
          <div className={sectionClass}>
            <h3 className={titleClass}>Config</h3>
            <KVTable data={{ 
              model: data.model, 
              rerankMinProb: data.rerankMinProb, 
              summary: `scored ${data.input} → ${data.passed} passed (${data.excluded} excluded)` 
            }} />
          </div>
          {passages.length > 0 && (
            <div className={sectionClass}>
              <h3 className={titleClass}>Passages</h3>
              <div className="space-y-2">
                {passages.map((p: any, i: number) => (
                  <div key={i} className="rounded border border-border/50 bg-background/30 p-2 text-[10px]">
                    <div className="flex justify-between mb-1">
                      <span className={`font-mono ${!p.used ? "text-muted-foreground line-through" : ""}`}>{p.doc}</span>
                      <span className={`font-mono ${p.used ? "text-cyan" : "text-muted-foreground"}`}>{p.score?.toFixed(4)}</span>
                    </div>
                    {p.text && <p className="text-muted-foreground line-clamp-2">"{p.text}"</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {data.passed === 0 && (
            <div className="mt-4 rounded border border-coral/30 bg-coral/5 p-3 text-xs text-coral">
              <p className="font-semibold mb-1">Failure Path</p>
              <p className="opacity-90">0 passages passed — LLM skipped, returning "No documents found".</p>
            </div>
          )}
        </div>
      );
    }
    
    case "context": {
      const citations = data.citations || [];
      return (
        <div className="text-sm">
          <p className="text-muted-foreground">Assembled final context window.</p>
          <div className={sectionClass}>
            <h3 className={titleClass}>Stats</h3>
            <KVTable data={{ selected: data.selected, dropped: data.dropped }} />
          </div>
          {citations.length > 0 && (
            <div className={sectionClass}>
              <h3 className={titleClass}>Citations</h3>
              <div className="space-y-1">
                {citations.map((c: any) => (
                  <div key={c.id} className="flex gap-2 font-mono text-[10px]">
                    <span className="text-coral">[{c.id}]</span>
                    <span className="truncate">{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {data.contextPreview && (
            <div className={sectionClass}>
              <div className="flex items-center justify-between">
                <h3 className={titleClass}>Context Preview</h3>
                <CopyButton text={data.contextPreview} />
              </div>
              <div className="mt-1 max-h-40 overflow-y-auto rounded border border-border bg-background/50 p-2 font-mono text-[9px] text-muted-foreground whitespace-pre-wrap">
                {data.contextPreview}
              </div>
            </div>
          )}
        </div>
      );
    }
    
    case "synth":
      return (
        <div className="text-sm">
          <p className="text-muted-foreground">Generated answer from context via streaming LLM.</p>
          <div className={sectionClass}>
            <h3 className={titleClass}>Config</h3>
            <KVTable data={{ model: data.model }} />
          </div>
          {data.draft && (
            <div className={sectionClass}>
              <h3 className={titleClass}>Draft (first 100 chars)</h3>
              <div className="rounded border border-border bg-background/50 p-2 font-mono text-[10px] text-muted-foreground">
                "{data.draft}…"
              </div>
            </div>
          )}
        </div>
      );
    
    case "grounding": {
      const details = data.details || [];
      return (
        <div className="text-sm">
          <p className="text-muted-foreground">Verified answer claims against retrieved context.</p>
          <div className={sectionClass}>
            <h3 className={titleClass}>Results</h3>
            <KVTable data={{ summary: `${data.supported}/${data.claims} claims supported`, confidence: `${data.confidence}%`, overall: data.overall ? "✓ supported" : "⚠ issues", verifiedBy: data.verified ? "model" : "regex fallback" }} />
          </div>
          {details.length > 0 && (
            <div className={sectionClass}>
              <h3 className={titleClass}>Claim Details</h3>
              <div className="space-y-2">
                {details.map((claim: any, i: number) => (
                  <div key={i} className="rounded border border-border/50 bg-background/30 p-2 text-[10px]">
                    <p className="mb-1">"{claim.text}"</p>
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-coral">{claim.source ? `[${claim.source}]` : "—"}</span>
                      <span className={`font-mono ${claim.supported ? "text-success" : "text-coral"}`}>
                        {claim.confidence?.toFixed(2)} - {claim.supported ? "supported" : "unsupported"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!data.overall && (
            <div className="mt-4 rounded border border-coral/30 bg-coral/5 p-3 text-xs text-coral">
              <p className="font-semibold mb-1">Warning</p>
              <p className="opacity-90">Some claims are not fully supported by the context.</p>
            </div>
          )}
        </div>
      );
    }
    
    case "answer":
      return (
        <div className="text-sm">
          <p className="text-muted-foreground">Streamed final response to user.</p>
          <div className={sectionClass}>
            <h3 className={titleClass}>Output</h3>
            <KVTable data={{ 
              text: data.text ? `"${data.text}…"` : "—", 
              citations: data.citations || 0,
              grounded: data.grounded ? "yes" : "no",
              isChitchat: data.isChitchat ? "yes" : "no",
              ...(data.noResults ? { noResults: "true" } : {}),
            }} />
          </div>
        </div>
      );
    
    default:
      return <KVTable data={data} />;
  }
}

export function AgentPipelineDetail({ 
  selectedStep, 
  onSelectStep,
  onClose,
  trace,
}: { 
  selectedStep: string | null; 
  onSelectStep: (id: string | null) => void;
  onClose?: () => void;
  trace: PipelineTrace | null;
}) {
  if (!selectedStep) {
    return (
      <aside className="fixed inset-x-0 bottom-0 z-40 flex h-[50vh] flex-col border-t border-border bg-panel shadow-2xl transition-all duration-300 lg:relative lg:inset-auto lg:h-auto lg:w-[390px] lg:border-l lg:border-t-0 lg:shadow-none hidden lg:flex">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
          <p className="text-xs font-mono uppercase text-muted-foreground">Inspector</p>
          <button
            onClick={onClose || (() => onSelectStep(null))}
            className="flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title="Close inspector"
            aria-label="Close inspector"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <div className="space-y-3">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary">
              <Check className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">Select a step to inspect</p>
            <p className="text-xs text-muted-foreground">Click any card in the pipeline to see what ran in the backend.</p>
          </div>
        </div>
      </aside>
    );
  }

  const stage = STAGES.find(s => s.id === selectedStep) || { title: "Offline Indexing", status: "completed" };
  const stepTrace = trace?.steps[selectedStep];
  const ms = stepTrace?.ms || 0;
  const totalMs = trace?.totalMs || 0;
  const sharePct = ms > 0 && totalMs > 0 ? Math.max(2, Math.round((ms / totalMs) * 100)) : 0;
  
  const currentIndex = selectedStep === "indexing" ? -1 : STAGES.findIndex(s => s.id === selectedStep);
  
  const handlePrev = () => {
    if (currentIndex === 0) onSelectStep("indexing");
    else if (currentIndex > 0) {
      const prev = STAGES[currentIndex - 1];
      if (prev) onSelectStep(prev.id);
    }
  };
  
  const handleNext = () => {
    if (selectedStep === "indexing") {
      const first = STAGES[0];
      if (first) onSelectStep(first.id);
    } else if (currentIndex >= 0 && currentIndex < STAGES.length - 1) {
      const next = STAGES[currentIndex + 1];
      if (next) onSelectStep(next.id);
    }
  };

  const stepStatus = stepTrace?.status === "skipped"
    ? "skipped"
    : stepTrace?.status === "running"
    ? "running"
    : (stepTrace?.status === "done" || (stepTrace?.ms !== undefined && stepTrace?.status !== "running"))
    ? "done"
    : "queued";

  return (
    <aside className="fixed inset-x-0 bottom-0 z-40 flex h-[65vh] flex-col border-t border-border bg-panel shadow-2xl lg:relative lg:inset-auto lg:h-auto lg:w-[390px] lg:border-l lg:border-t-0 lg:shadow-none">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">{stage.title}</h2>
          </div>
          <div className="mt-0.5 flex items-center gap-2 font-mono text-[9px] uppercase text-muted-foreground">
            {currentIndex >= 0 ? `Step ${currentIndex + 1}` : "Offline"}
            <span>·</span>
            {stepStatus}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {ms > 0 && stepStatus === "done" && (
            <div className="flex flex-col items-end gap-1">
              <span className="font-mono text-[10px]">{ms} ms</span>
              <div className="h-1 w-16 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-cyan" style={{ width: `${sharePct}%` }} />
              </div>
            </div>
          )}
          <button
            onClick={onClose || (() => onSelectStep(null))}
            className="ml-1 flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title="Close inspector"
            aria-label="Close inspector"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      
      <div className="min-h-0 flex-1 overflow-y-auto p-5 scrollbar-hide relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedStep}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
          >
            {selectedStep === "indexing" ? (
              <div className="text-sm">
                <p className="text-muted-foreground">Load → Parse & clean → Chunk → Attach metadata → Embed → Store.</p>
                <div className="mt-4 space-y-2 border-t border-border/50 pt-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase font-mono tracking-wider">Config</h3>
                  <KVTable data={{ chunking: "hierarchical: 2048 / 512 / 128", model: "BAAI/bge-small-en-v1.5", store: "ChromaDB (agentic_rag)" }} />
                </div>
                <div className="mt-4 rounded border border-coral/30 bg-coral/5 p-3 text-xs text-coral">
                  <p className="font-semibold mb-1">Note</p>
                  <p className="opacity-90">Runs once at upload/ingest time, not per query.</p>
                </div>
              </div>
            ) : (
              <StepContent stepId={selectedStep} trace={trace} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      
      <div className="flex h-12 shrink-0 items-center justify-between border-t border-border px-4">
        <button 
          onClick={handlePrev} 
          disabled={selectedStep === "indexing"}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground"
        >
          <ArrowLeft className="size-3.5" /> Previous step
        </button>
        <button 
          onClick={handleNext} 
          disabled={currentIndex === STAGES.length - 1}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground"
        >
          Next step <ArrowRight className="size-3.5" />
        </button>
      </div>
    </aside>
  );
}

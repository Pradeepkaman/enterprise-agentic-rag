import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUpDown, Braces, Check, CornerDownLeft, Database, FileSearch, Loader2, Scissors, Sparkles, Terminal, TriangleAlert, Layers, Combine, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PipelineTrace, TraceStep } from "./rag-workspace";

type Stage = {
  id: string;
  title: string;
  vendor?: string;
  status: string; // live status label
  icon: React.ComponentType<{ className?: string }>;
  accent: "cyan" | "coral" | "gold";
};

// Top → bottom = execution order, always.
export const STAGES: Stage[] = [
  { id: "query", title: "User Query", status: "receiving…", icon: Terminal, accent: "cyan" },
  { id: "hyde", title: "Query Expansion (HyDE)", vendor: "LLM", status: "expanding…", icon: Braces, accent: "coral" },
  { id: "embed", title: "Query Embedding", vendor: "q + expanded", status: "embedding…", icon: Sparkles, accent: "cyan" },
  { id: "vector", title: "Retrieval", vendor: "vector search", status: "retrieving…", icon: Database, accent: "gold" },
  { id: "fusion", title: "Fusion & Dedupe", vendor: "RRF", status: "merging…", icon: Combine, accent: "gold" },
  { id: "rerank", title: "Re-ranking", vendor: "cross-encoder", status: "ranking…", icon: ArrowUpDown, accent: "coral" },
  { id: "context", title: "Context Assembly", vendor: "token budget, citation IDs", status: "assembling…", icon: Layers, accent: "cyan" },
  { id: "synth", title: "LLM Synthesis", vendor: "RAG Research", status: "generating…", icon: FileSearch, accent: "cyan" },
  { id: "grounding", title: "Grounding Check", status: "verifying…", icon: Check, accent: "gold" },
  { id: "answer", title: "Final Answer", status: "streaming…", icon: CornerDownLeft, accent: "gold" },
];

const ACCENT = { cyan: "var(--cyan)", coral: "var(--coral)", gold: "var(--chart-4)" } as const;

function StageBody({ stage, trace }: { stage: Stage; trace: PipelineTrace | null }) {
  const row = "rounded border border-border/70 bg-background/60 px-2 py-1.5 font-mono text-[10px] leading-relaxed";
  const stepTrace = trace?.steps[stage.id];
  const data = stepTrace?.data;
  
  // If step is skipped, show that
  if (stepTrace?.status === "skipped") {
    return <p className="font-mono text-[10px] text-muted-foreground italic">skipped</p>;
  }
  
  // If no trace at all or queued, show waiting state
  if (!trace || !stepTrace || stepTrace.status === "queued") {
    switch (stage.id) {
      case "query":
        return <p className={row}><span className="text-cyan">q:</span> waiting…</p>;
      default:
        return <p className="font-mono text-[10px] text-muted-foreground">queued</p>;
    }
  }

  // If running and full data not yet present, show live status hint
  if (stepTrace.status === "running" && (!data || stage.id === "synth")) {
    switch (stage.id) {
      case "query":
        return <p className={row}><span className="text-cyan">q:</span> {data?.text || "receiving…"}</p>;
      case "hyde":
        return <p className="font-mono text-[10px] text-muted-foreground">expanding query with HyDE…</p>;
      case "embed":
        return <p className="font-mono text-[10px] text-muted-foreground">generating 384-d embeddings…</p>;
      case "vector":
        return <p className="font-mono text-[10px] text-muted-foreground">searching vector index…</p>;
      case "fusion":
        return <p className="font-mono text-[10px] text-muted-foreground">merging and deduplicating…</p>;
      case "rerank":
        return <p className="font-mono text-[10px] text-muted-foreground">cross-encoder scoring…</p>;
      case "context":
        return <p className="font-mono text-[10px] text-muted-foreground">assembling prompt context…</p>;
      case "synth":
        return <p className="font-mono text-[10px] text-muted-foreground">{data?.model || "LLM"} · streaming response…</p>;
      case "grounding":
        return <p className="font-mono text-[10px] text-muted-foreground">verifying citations & claims…</p>;
      case "answer":
        return <p className={row}><span className="text-coral">out:</span> streaming…</p>;
      default:
        return <p className="font-mono text-[10px] text-muted-foreground">{stage.status}</p>;
    }
  }

  switch (stage.id) {
    case "query":
      return <p className={row}><span className="text-cyan">q:</span> {data?.text || "…"}</p>;
    case "hyde":
      return (
        <div className="space-y-1">
          <p className={`${row} truncate text-muted-foreground`}>
            {data?.expandedQuery ? data.expandedQuery.slice(0, 80) + (data.expandedQuery.length > 80 ? "…" : "") : "expanding…"}
          </p>
          {data?.model && <p className="font-mono text-[9px] text-muted-foreground">model: {data.model}</p>}
        </div>
      );
    case "embed":
      return (
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 truncate font-mono text-[10px] text-muted-foreground">
            {data?.dims ? `${data.dims}-d vectors` : "384-d"} · {data?.model || "bge-small-en-v1.5"}
          </p>
          <span className="shrink-0 font-mono text-[10px] text-cyan">{data?.texts?.length || 2} texts</span>
        </div>
      );
    case "vector": {
      const hits = data?.hits || [];
      return (
        <div className="space-y-1">
          <p className="font-mono text-[10px] text-muted-foreground">
            cosine · {data?.scanned || "?"} scanned → <span className="text-foreground">{data?.passed || "?"} passed</span> · min sim {data?.cosineMinSim || "0.3"}
            {data?.filtered > 0 && <span className="text-coral"> · {data.filtered} filtered</span>}
          </p>
          {hits.slice(0, 3).map((hit: any, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <span className={`w-28 shrink-0 truncate font-mono text-[10px] ${!hit.passed ? "text-muted-foreground line-through" : ""}`}>
                {hit.doc?.split(".")[0] || "doc"}
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-background/70">
                <div className="h-full rounded-full" style={{ width: `${Math.min(hit.score * 100, 100)}%`, background: hit.passed ? "var(--cyan)" : "var(--muted-foreground)" }} />
              </div>
              <span className={`w-11 shrink-0 text-right font-mono text-[10px] ${hit.passed ? "text-cyan" : "text-muted-foreground"}`}>{hit.score?.toFixed(4)}</span>
            </div>
          ))}
        </div>
      );
    }
    case "fusion":
      return <p className="font-mono text-[10px] text-muted-foreground">{data?.input || "?"} → {data?.unique || "?"} unique · {data?.removed || 0} dupes removed</p>;
    case "rerank": {
      const passages = data?.passages || [];
      return (
        <div className="space-y-1.5">
          <p className="font-mono text-[10px] text-muted-foreground">scored {data?.input || "?"} → {data?.passed || "?"} passed</p>
          {passages.map((doc: any, i: number) => (
            <div key={i} className="group relative">
              <div className="flex items-center gap-2">
                <span className={`w-28 shrink-0 truncate font-mono text-[10px] ${!doc.used ? "text-muted-foreground line-through decoration-muted-foreground/50" : ""}`}>{doc.doc?.split(".")[0] || "doc"}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-background/70">
                  <div className="h-full rounded-full transition-[width] duration-500"
                    style={{ width: `${Math.min(doc.score * 100, 100)}%`, background: doc.used ? "var(--cyan)" : "var(--muted-foreground)" }} />
                </div>
                <span className={`w-11 shrink-0 text-right font-mono text-[10px] ${doc.used ? "text-cyan" : "text-muted-foreground"}`}>{doc.score?.toFixed(4)}</span>
              </div>
              <div className="pointer-events-none absolute left-0 right-0 top-full z-20 mt-1 hidden rounded-md border border-border bg-popover p-2 text-[11px] leading-snug text-popover-foreground shadow-lg group-hover:block">
                <p className="mb-1 font-mono text-[9px] uppercase text-muted-foreground">{doc.doc}</p>"{doc.text}"
              </div>
            </div>
          ))}
          {(data?.excluded || 0) > 0 && (
            <p className="flex items-center gap-1 pt-0.5 font-mono text-[10px] text-coral"><TriangleAlert className="size-3" /> {data.excluded} below score {data?.rerankMinScore || 0.3} — excluded</p>
          )}
          {data?.passed === 0 && (
            <p className="font-mono text-[10px] text-coral/80 pt-1">→ 0 passages: skipping LLM, output "No documents found"</p>
          )}
        </div>
      );
    }
    case "context": {
      const citations = data?.citations || [];
      return (
        <div className="space-y-1">
          <p className="font-mono text-[10px] text-muted-foreground">Ordered {data?.selected || "?"} passages · {data?.dropped || 0} dropped</p>
          <div className="flex gap-1">
            {citations.map((c: any) => <span key={c.id} className="rounded bg-accent px-1 font-mono text-[10px] text-accent-foreground">[{c.id}]</span>)}
          </div>
        </div>
      );
    }
    case "synth":
      return <p className="font-mono text-[10px] text-muted-foreground">
        {data?.model || "LLM"} · streaming · {data?.draft ? `"${data.draft.slice(0, 60)}…"` : "generating…"}
      </p>;
    case "grounding": {
      const confidence = data?.confidence || 0;
      const supported = data?.supported || 0;
      const total = data?.claims || 0;
      return (
        <div className="space-y-2">
          <p className="font-mono text-[10px] text-success">claims checked: {supported}/{total} supported</p>
          <div>
            <div className="flex justify-between text-[10px] mb-1"><span className="text-muted-foreground">Grounding confidence</span><span className="font-mono text-success">{confidence}%</span></div>
            <div className="h-1 w-full bg-muted rounded-full overflow-hidden"><div className="h-full bg-success rounded-full" style={{ width: `${confidence}%` }} /></div>
          </div>
          {!data?.overall && <p className="font-mono text-[10px] text-coral/80 pt-1">→ some claims unsupported</p>}
        </div>
      );
    }
    default: {
      const answerText = data?.text || "";
      return <p className={row}><span className="text-coral">out:</span> {answerText ? answerText.slice(0, 80) + (answerText.length > 80 ? "…" : "") : "…"}</p>;
    }
  }
}

type NodeState = "idle" | "live" | "done" | "skipped";

function Node({ stage, state, selected, onClick }: { stage: Stage; state: NodeState; selected: boolean; onClick: () => void }) {
  const color = ACCENT[stage.accent];
  const Icon = stage.icon;
  const lit = state !== "idle" && state !== "skipped";
  return (
    <div 
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      data-live={state === "live"} 
      className="relative rounded-lg border bg-card transition-[border-color,box-shadow,opacity] duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan"
      style={{
        borderColor: selected ? color : state === "live" ? color : "var(--border)",
        boxShadow: selected || state === "live" ? `0 0 0 1px ${color}, 0 0 22px color-mix(in oklab, ${color} 30%, transparent)` : "none",
        opacity: state === "idle" || state === "skipped" ? 0.55 : 1,
      }}>
      {/* n8n-style ports */}
      <span className="absolute -top-[5px] left-1/2 size-2.5 -translate-x-1/2 rounded-full border-2 border-card" style={{ background: lit ? color : "var(--border)" }} />
      <span className="absolute -bottom-[5px] left-1/2 size-2.5 -translate-x-1/2 rounded-full border-2 border-card" style={{ background: state === "done" ? color : "var(--border)" }} />
      <div className="flex items-center gap-2 border-b border-border/70 px-3 py-2">
        <span className="flex size-6 items-center justify-center rounded-md" style={{ background: `color-mix(in oklab, ${color} 20%, transparent)`, color }}>
          <Icon className="size-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold">{stage.title}</p>
          {stage.vendor && <p className="truncate font-mono text-[9px] uppercase text-muted-foreground">{stage.vendor}</p>}
        </div>
        <span className="flex shrink-0 items-center gap-1 font-mono text-[10px]">
          {state === "live" && <><Loader2 className="size-3 animate-spin" style={{ color }} /><span style={{ color }}>{stage.status}</span></>}
          {state === "done" && <><Check className="size-3 text-success" /></>}
          {state === "skipped" && <span className="text-muted-foreground italic">skipped</span>}
          {state === "idle" && <span className="text-muted-foreground">queued</span>}
        </span>
      </div>
      <div className="px-3 py-2"><StageBody stage={stage} trace={null} /></div>
    </div>
  );
}

function Edge({ state }: { state: NodeState }) {
  const isLive = state === "live";
  const isDone = state === "done";

  return (
    <div
      className={cn(
        "relative mx-auto h-8 w-px transition-colors duration-300",
        isLive
          ? "bg-cyan shadow-[0_0_8px_rgba(6,182,212,0.8)]"
          : isDone
            ? "bg-cyan/60"
            : "bg-border/60"
      )}
    >
      {isLive && (
        <>
          <motion.span
            className="absolute left-1/2 size-2 -translate-x-1/2 rounded-full bg-cyan shadow-[0_0_10px_var(--cyan)]"
            animate={{ top: ["-4px", "100%"] }}
            transition={{ duration: 0.45, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.span
            className="absolute left-1/2 size-1 -translate-x-1/2 rounded-full bg-white"
            animate={{ top: ["-4px", "100%"] }}
            transition={{ duration: 0.45, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
          />
        </>
      )}
      {isDone && (
        <span className="absolute left-1/2 top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan/70" />
      )}
    </div>
  );
}

// Live node that reads from trace
function LiveNode({ stage, trace, selected, onClick }: { stage: Stage; trace: PipelineTrace | null; selected: boolean; onClick: () => void }) {
  const color = ACCENT[stage.accent];
  const Icon = stage.icon;
  const stepTrace = trace?.steps[stage.id];
  
  let state: NodeState = "idle";
  if (stepTrace) {
    if (stepTrace.status === "skipped") state = "skipped";
    else if (stepTrace.status === "running") state = "live";
    else if (stepTrace.status === "done" || (stepTrace.ms !== undefined && stepTrace.status !== "running")) state = "done";
  }
  
  const lit = state === "done" || state === "live";
  const ms = stepTrace?.ms;

  return (
    <div 
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      data-live={state === "live"} 
      className="relative rounded-lg border bg-card transition-[border-color,box-shadow,opacity] duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan"
      style={{
        borderColor: selected ? color : state === "live" ? color : "var(--border)",
        boxShadow: selected || state === "live" ? `0 0 0 1px ${color}, 0 0 22px color-mix(in oklab, ${color} 30%, transparent)` : "none",
        opacity: state === "idle" || state === "skipped" ? 0.55 : 1,
      }}>
      <span className="absolute -top-[5px] left-1/2 size-2.5 -translate-x-1/2 rounded-full border-2 border-card" style={{ background: lit ? color : "var(--border)" }} />
      <span className="absolute -bottom-[5px] left-1/2 size-2.5 -translate-x-1/2 rounded-full border-2 border-card" style={{ background: state === "done" ? color : "var(--border)" }} />
      <div className="flex items-center gap-2 border-b border-border/70 px-3 py-2">
        <span className="flex size-6 items-center justify-center rounded-md" style={{ background: `color-mix(in oklab, ${color} 20%, transparent)`, color }}>
          <Icon className="size-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold">{stage.title}</p>
          {stage.vendor && <p className="truncate font-mono text-[9px] uppercase text-muted-foreground">{stage.vendor}</p>}
        </div>
        <span className="flex shrink-0 items-center gap-1 font-mono text-[10px]">
          {state === "live" && <><Loader2 className="size-3 animate-spin" style={{ color }} /><span style={{ color }}>{stage.status}</span></>}
          {state === "done" && <><Check className="size-3 text-success" /><span className="text-muted-foreground">{ms} ms</span></>}
          {state === "skipped" && <span className="text-muted-foreground italic">skipped</span>}
          {state === "idle" && <span className="text-muted-foreground">queued</span>}
        </span>
      </div>
      <div className="px-3 py-2"><StageBody stage={stage} trace={trace} /></div>
    </div>
  );
}

type GraphMilestone = {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
};

const GRAPH_NODES: GraphMilestone[] = [
  { id: "query", name: "Query", x: 26, y: 32, color: "var(--cyan)" },
  { id: "embed", name: "Embed", x: 96, y: 32, color: "var(--cyan)" },
  { id: "vector", name: "Vector", x: 166, y: 32, color: "var(--chart-4)" },
  { id: "rerank", name: "Rerank", x: 236, y: 32, color: "var(--coral)" },
  { id: "synth", name: "LLM", x: 306, y: 32, color: "var(--cyan)" },
];

export function VectorPulseGraph({
  active,
  trace,
  selectedStep,
  onSelectStep,
}: {
  active: boolean;
  trace: PipelineTrace | null;
  selectedStep: string | null;
  onSelectStep: (id: string | null) => void;
}) {
  const getNodeState = (id: string): NodeState => {
    const step = trace?.steps[id];
    if (!step) return "idle";
    if (step.status === "skipped") return "skipped";
    if (step.status === "running") return "live";
    if (step.status === "done" || (step.ms !== undefined && step.status !== "running")) return "done";
    return "idle";
  };

  return (
    <div className="mb-5 rounded-xl border border-border/80 bg-card/85 p-3 shadow-md backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span
              className={cn(
                "absolute inline-flex h-full w-full rounded-full opacity-75",
                active ? "animate-ping bg-cyan" : "bg-emerald-400"
              )}
            />
            <span
              className={cn(
                "relative inline-flex h-2 w-2 rounded-full",
                active ? "bg-cyan" : "bg-emerald-500"
              )}
            />
          </span>
          <span className="font-mono text-[10px] font-semibold tracking-wider uppercase text-foreground">
            Vector Flow Topology
          </span>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
          {active ? "Live Pulse" : trace ? "Complete" : "Standby"}
        </span>
      </div>

      <div className="relative overflow-hidden rounded-lg border border-border/50 bg-background/50 p-1">
        <svg
          viewBox="0 0 332 64"
          className="w-full h-auto select-none"
          style={{ overflow: "visible" }}
        >
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Connection wires between consecutive milestones */}
          {GRAPH_NODES.slice(0, -1).map((node, i) => {
            const next = GRAPH_NODES[i + 1];
            if (!next) return null;
            const currState = getNodeState(node.id);
            const nextState = getNodeState(next.id);
            const isLiveWire = currState === "done" && nextState === "live";
            const isDoneWire = currState === "done" && (nextState === "done" || nextState === "skipped");

            return (
              <g key={`wire-${node.id}-${next.id}`}>
                <line
                  x1={node.x}
                  y1={node.y}
                  x2={next.x}
                  y2={next.y}
                  className={cn(
                    "transition-all duration-300",
                    isLiveWire
                      ? "vector-wire-live stroke-[2px]"
                      : isDoneWire
                        ? "vector-wire-done stroke-[1.5px]"
                        : "vector-wire-idle stroke-[1px]"
                  )}
                />

                {isLiveWire && (
                  <circle r="3" fill="var(--cyan)" filter="url(#glow)">
                    <animateMotion
                      path={`M ${node.x} ${node.y} L ${next.x} ${next.y}`}
                      dur="0.6s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
              </g>
            );
          })}

          {/* Interactive Milestone Nodes */}
          {GRAPH_NODES.map((node) => {
            const state = getNodeState(node.id);
            const isSelected = selectedStep === node.id;
            const ms = trace?.steps[node.id]?.ms;

            return (
              <g
                key={node.id}
                className="cursor-pointer group"
                onClick={() => onSelectStep(node.id)}
              >
                {state === "live" && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="14"
                    fill="none"
                    stroke={node.color}
                    strokeWidth="1.5"
                    className="animate-ping origin-center opacity-60"
                  />
                )}

                {isSelected && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="13"
                    fill="none"
                    stroke={node.color}
                    strokeWidth="1.5"
                    filter="url(#glow)"
                  />
                )}

                <circle
                  cx={node.x}
                  cy={node.y}
                  r="10"
                  fill={
                    state === "done"
                      ? "var(--card)"
                      : state === "live"
                        ? "var(--card)"
                        : "var(--background)"
                  }
                  stroke={
                    state === "live"
                      ? node.color
                      : state === "done"
                        ? node.color
                        : "var(--border)"
                  }
                  strokeWidth={state === "live" || state === "done" ? 2 : 1}
                  className="transition-colors duration-200"
                />

                <circle
                  cx={node.x}
                  cy={node.y}
                  r="3.5"
                  fill={
                    state === "live"
                      ? node.color
                      : state === "done"
                        ? node.color
                        : "var(--border)"
                  }
                  className="transition-colors duration-200"
                />

                <text
                  x={node.x}
                  y={node.y + 22}
                  textAnchor="middle"
                  className={cn(
                    "font-mono text-[9px] select-none transition-colors",
                    isSelected
                      ? "fill-foreground font-bold"
                      : state === "live"
                        ? "fill-cyan font-bold"
                        : state === "done"
                          ? "fill-foreground font-medium"
                          : "fill-muted-foreground"
                  )}
                >
                  {node.name}
                </text>

                {state === "done" && ms !== undefined && (
                  <text
                    x={node.x}
                    y={node.y - 14}
                    textAnchor="middle"
                    className="font-mono text-[8px] fill-muted-foreground select-none"
                  >
                    {ms}ms
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export function AgentPipeline({ 
  active,
  selectedStep,
  onSelectStep,
  trace,
  liveElapsedMs,
}: { 
  active: boolean;
  selectedStep: string | null;
  onSelectStep: (id: string | null) => void;
  trace: PipelineTrace | null;
  liveElapsedMs?: number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [indexingOpen, setIndexingOpen] = useState(false);

  // Auto-scroll only when user is near bottom; never fight manual scroll
  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
      const activeNode = el.querySelector('[data-live="true"]');
      if (activeNode && isNearBottom) {
        activeNode.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [trace]);

  const displayTotal = active 
    ? (liveElapsedMs || 0) 
    : (trace?.totalMs || (trace ? Object.values(trace.steps).reduce((acc, s) => acc + (s.status === "done" ? (s.ms || 0) : 0), 0) : 0));

  return (
    <div ref={scrollRef} className="scrollbar-hide relative h-full overflow-y-auto">
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:16px_16px]" />
      <div className="relative p-4 pb-8">
        
        {/* Live Vector Flow Graph Topology */}
        <VectorPulseGraph
          active={active}
          trace={trace}
          selectedStep={selectedStep}
          onSelectStep={onSelectStep}
        />

        {/* Offline Indexing Panel */}
        <div 
          role="button"
          tabIndex={0}
          onClick={() => onSelectStep("indexing")}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectStep("indexing"); } }}
          className="mb-6 rounded-lg border bg-card shadow-sm cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan"
          style={{
            borderColor: selectedStep === "indexing" ? "var(--cyan)" : "var(--border)",
            boxShadow: selectedStep === "indexing" ? "0 0 0 1px var(--cyan), 0 0 22px color-mix(in oklab, var(--cyan) 30%, transparent)" : "none"
          }}
        >
          <div className="flex w-full items-center justify-between p-3 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <div className="flex items-center gap-2">
              <Database className="size-3.5" />
              <span>Offline Indexing (Completed)</span>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setIndexingOpen(!indexingOpen); }}
              className="p-1 hover:bg-secondary rounded"
              aria-label="Toggle details"
            >
              <ChevronDown className={`size-3.5 transition-transform duration-300 ${indexingOpen ? "rotate-180" : ""}`} />
            </button>
          </div>
          
          <AnimatePresence>
            {indexingOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-border/70"
              >
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-2 font-mono text-[10px]">
                    <Scissors className="size-3 text-gold" />
                    <span>Chunking (hierarchical: 2048 / 512 / 128)</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 24 }).map((_, i) => (
                        <span key={i} className="h-3 flex-1 rounded-[2px]" style={{ background: i % 8 < 3 ? "var(--cyan)" : "var(--border)" }} />
                      ))}
                    </div>
                    <p className="font-mono text-[10px] text-muted-foreground">38 docs indexed · BAAI/bge-small-en-v1.5</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pipeline Steps — strictly sequential and driven by real events */}
        {STAGES.map((stage, i) => {
          const currStep = trace?.steps[stage.id];
          const nextStage = STAGES[i + 1];
          const nextStep = nextStage ? trace?.steps[nextStage.id] : null;

          let edgeState: NodeState = "idle";
          if (currStep?.status === "skipped") {
            edgeState = "skipped";
          } else if (currStep?.status === "done" || (currStep?.ms !== undefined && currStep?.status !== "running")) {
            if (nextStep?.status === "running") {
              edgeState = "live";
            } else if (nextStep?.status === "done" || (nextStep?.ms !== undefined && nextStep?.status !== "running")) {
              edgeState = "done";
            } else {
              edgeState = "done";
            }
          } else if (currStep?.status === "running") {
            edgeState = "idle";
          }

          return (
            <div key={stage.id}>
              <LiveNode 
                stage={stage} 
                trace={trace} 
                selected={selectedStep === stage.id} 
                onClick={() => onSelectStep(stage.id)} 
              />
              {i < STAGES.length - 1 && <Edge state={edgeState} />}
            </div>
          );
        })}
        <p className="mt-3 text-center font-mono text-[10px] text-muted-foreground">
          {(active || trace) ? `total ${displayTotal.toLocaleString()} ms` : "idle · send a query to start"}
        </p>
      </div>
    </div>
  );
}

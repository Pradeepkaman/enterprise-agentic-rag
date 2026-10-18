import { useEffect, useRef, useState } from "react";
import {
  Check,
  FileStack,
  GitFork,
  GitMerge,
  ListOrdered,
  Search,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Step = { title: string; sub: string; icon: LucideIcon; ms: number };

export const PIPELINE_STEPS: Step[] = [
  { title: "Query Understanding", sub: "Intent · rewrite", icon: Search, ms: 120 },
  { title: "Hybrid Retrieval", sub: "BM25 + dense in parallel", icon: GitFork, ms: 96 },
  { title: "Fusion & Dedupe", sub: "RRF", icon: GitMerge, ms: 84 },
  { title: "Re-ranking", sub: "Cross-encoder", icon: ListOrdered, ms: 212 },
  { title: "Context Assembly", sub: "Token budget, citation IDs", icon: FileStack, ms: 46 },
  { title: "LLM Generation", sub: "Grounded answer", icon: Sparkles, ms: 940 },
  { title: "Grounding Check", sub: "Claim verification", icon: ShieldCheck, ms: 158 },
  { title: "Final Answer", sub: "Cited response", icon: Check, ms: 12 },
];

const TOTAL = PIPELINE_STEPS.length;
const TOTAL_MS = PIPELINE_STEPS.reduce((sum, step) => sum + step.ms, 0);

/** Animated preview of the retrieval and answer stages. */
export function PipelineShowcase({
  fast = false,
  compact = false,
  onComplete,
}: {
  fast?: boolean;
  compact?: boolean;
  onComplete?: () => void;
}) {
  const [active, setActive] = useState(-1);
  const [elapsed, setElapsed] = useState(0);
  const [reduced, setReduced] = useState(false);
  const completedRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    if (mq.matches) {
      setActive(TOTAL);
      setElapsed(TOTAL_MS);
    }
  }, []);

  useEffect(() => {
    if (reduced) return;
    if (active >= TOTAL) {
      if (fast) {
        if (!completedRef.current) {
          completedRef.current = true;
          onComplete?.();
        }
        return;
      }
      const timer = setTimeout(() => {
        setActive(-1);
        setElapsed(0);
      }, 2200);
      return () => clearTimeout(timer);
    }
    const delay = fast ? 160 : active < 0 ? 700 : 900;
    const timer = setTimeout(() => setActive((current) => current + 1), delay);
    return () => clearTimeout(timer);
  }, [active, fast, reduced, onComplete]);

  useEffect(() => {
    if (reduced || active < 0 || active >= TOTAL) return;
    const timer = setInterval(() => setElapsed((value) => value + (fast ? 48 : 17)), 40);
    return () => clearInterval(timer);
  }, [active, fast, reduced]);

  const running = active >= 0 && active < TOTAL;
  const steps = compact
    ? PIPELINE_STEPS.filter((_, index) => [0, 2, 4, 6, 7].includes(index))
    : PIPELINE_STEPS;

  return (
    <div className="w-full max-w-md">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="micro-label">Live preview</p>
          <h2 className="mt-1 text-base font-bold text-foreground">RAG pipeline</h2>
        </div>
        <div
          className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[11px] text-muted-foreground shadow-soft"
          aria-hidden="true"
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              running ? "pulse-dot bg-primary" : active >= TOTAL ? "bg-success" : "bg-muted-foreground/40",
            )}
          />
          <span className="uppercase tracking-[0.15em]">
            {running ? "Running" : active >= TOTAL ? "Complete" : "Idle"}
          </span>
          <span className="tabular-nums text-foreground">{active >= TOTAL ? TOTAL_MS : elapsed} ms</span>
        </div>
      </div>

      <ol className="relative" aria-label="RAG pipeline stages">
        {steps.map((step, visibleIndex) => {
          const index = PIPELINE_STEPS.indexOf(step);
          const done = index < active;
          const isRunning = index === active;
          const Icon = step.icon;
          const isLast = visibleIndex === steps.length - 1;

          return (
            <li
              key={step.title}
              className="enter-up relative"
              style={{ animationDelay: `${150 + visibleIndex * 70}ms` }}
            >
              <div
                className={cn(
                  "rounded-xl border bg-card px-3.5 py-2.5 shadow-soft transition-[opacity,border-color] duration-300",
                  isRunning ? "border-foreground/40" : "border-border",
                  !done && !isRunning && "opacity-70",
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border transition-colors duration-300",
                      done || isRunning ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-foreground">{step.title}</p>
                    <p className="micro-label truncate !text-[9px]">{step.sub}</p>
                  </div>
                  <div className="shrink-0 text-[11px] tabular-nums">
                    {done ? (
                      <span className="text-foreground"><span className="text-success">✓</span> {step.ms} ms</span>
                    ) : isRunning ? (
                      <span className="flex items-center gap-1.5 text-foreground">
                        <span className="pulse-dot h-2 w-2 rounded-full bg-primary" /> running
                      </span>
                    ) : (
                      <span className="italic text-muted-foreground">queued</span>
                    )}
                  </div>
                </div>

                {step.title === "Grounding Check" && (
                  <div className="mt-2 ml-[3.25rem] space-y-1 rounded-lg border border-amber-500/60 px-2.5 py-2 text-[10px] leading-relaxed text-amber-600 dark:text-amber-400">
                    <p>✓ supported → final answer</p>
                    <p>× unsupported → retry once with more context, else “I don’t know”</p>
                  </div>
                )}
              </div>

              {!isLast && (
                <div className="relative ml-[1.85rem] h-4 w-px bg-border" aria-hidden="true">
                  <span
                    className={cn(
                      "absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border transition-transform duration-300",
                      done ? "scale-125 bg-primary" : "bg-card",
                    )}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

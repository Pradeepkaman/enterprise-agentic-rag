/**
 * Flat, monochrome ambient background: drifting retrieval "tokens",
 * a slow scan line, and pulsing grid nodes. Transform/opacity only.
 */
const TOKENS = [
  "doc_0142 · 0.92", "chunk#88", "bm25 → 14.2", "cite[3]", "embed 768d",
  "rrf k=60", "top_k=8", "doc_0917 · 0.87", "tokens 2,048", "✓ grounded",
  "query → rewrite", "cos 0.81", "chunk#212", "cite[1]", "rerank ↑3",
];

const NODES = [
  [8, 18], [22, 72], [38, 30], [14, 88], [46, 58], [62, 12], [72, 66], [88, 34], [92, 84], [56, 92],
];

export function BackgroundFX() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* scan line */}
      <div className="fx-scan absolute inset-x-0 top-0 h-px bg-foreground/10" />

      {/* pulsing grid nodes with expanding rings */}
      {NODES.map(([x, y], i) => (
        <span
          key={i}
          className="absolute"
          style={{ left: `${x}%`, top: `${y}%` }}
        >
          <span
            className="fx-node block h-1.5 w-1.5 rounded-full bg-foreground/30"
            style={{ animationDelay: `${i * 0.7}s` }}
          />
          <span
            className="fx-ring absolute left-1/2 top-1/2 -ml-4 -mt-4 block h-8 w-8 rounded-full border border-foreground/20"
            style={{ animationDelay: `${i * 0.7}s` }}
          />
        </span>
      ))}

      {/* drifting tokens */}
      {TOKENS.map((t, i) => (
        <span
          key={t}
          className="fx-token absolute whitespace-nowrap rounded-md border border-border bg-card/70 px-2 py-0.5 text-[10px] text-muted-foreground"
          style={{
            left: `${(i * 37) % 94 + 2}%`,
            animationDelay: `${-i * 2.3}s`,
            animationDuration: `${26 + (i % 5) * 4}s`,
          }}
        >
          {t}
        </span>
      ))}
    </div>
  );
}

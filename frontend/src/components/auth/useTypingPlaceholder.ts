import { useEffect, useState } from "react";

/** Types out each example, pauses, deletes, and cycles. Static under reduced motion. */
export function useTypingPlaceholder(examples: string[], enabled = true) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setText(examples[0] ?? "");
      return;
    }
    let idx = 0;
    let pos = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const word = examples[idx] ?? "";
      if (!deleting) {
        pos++;
        setText(word.slice(0, pos));
        if (pos === word.length) {
          deleting = true;
          timer = setTimeout(tick, 1600);
          return;
        }
        timer = setTimeout(tick, 70);
      } else {
        pos--;
        setText(word.slice(0, pos));
        if (pos === 0) {
          deleting = false;
          idx = (idx + 1) % examples.length;
          timer = setTimeout(tick, 400);
          return;
        }
        timer = setTimeout(tick, 30);
      }
    };
    timer = setTimeout(tick, 600);
    return () => clearTimeout(timer);
  }, [examples, enabled]);

  return text;
}

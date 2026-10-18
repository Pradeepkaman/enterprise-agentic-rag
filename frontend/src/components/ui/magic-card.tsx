import type { PointerEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";

type MagicCardProps = {
  children: ReactNode;
  className?: string;
};

export function MagicCard({ children, className }: MagicCardProps) {
  const trackPointer = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--magic-x", `${event.clientX - bounds.left}px`);
    event.currentTarget.style.setProperty("--magic-y", `${event.clientY - bounds.top}px`);
  };

  return (
    <div
      className={cn("magic-card", className)}
      onPointerMove={trackPointer}
      onPointerLeave={(event) => {
        event.currentTarget.style.setProperty("--magic-x", "-240px");
        event.currentTarget.style.setProperty("--magic-y", "-240px");
      }}
    >
      <div className="magic-card__content">{children}</div>
    </div>
  );
}

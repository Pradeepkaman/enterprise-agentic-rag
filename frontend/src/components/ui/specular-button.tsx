import type { ButtonHTMLAttributes, PointerEvent } from "react";
import { cn } from "@/lib/utils";

type SpecularButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function SpecularButton({
  children,
  className,
  type = "button",
  onPointerMove,
  onPointerLeave,
  ...props
}: SpecularButtonProps) {
  const moveHighlight = (event: PointerEvent<HTMLButtonElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--specular-x", `${event.clientX - bounds.left}px`);
    event.currentTarget.style.setProperty("--specular-y", `${event.clientY - bounds.top}px`);
    onPointerMove?.(event);
  };

  const resetHighlight = (event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.style.setProperty("--specular-x", "50%");
    event.currentTarget.style.setProperty("--specular-y", "50%");
    onPointerLeave?.(event);
  };

  return (
    <button
      {...props}
      type={type}
      className={cn("specular-button", className)}
      onPointerMove={moveHighlight}
      onPointerLeave={resetHighlight}
    >
      <span className="specular-button__glare" aria-hidden="true" />
      <span className="specular-button__label">{children}</span>
    </button>
  );
}

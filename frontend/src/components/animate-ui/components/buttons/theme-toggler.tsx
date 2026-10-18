import type { ComponentProps } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import {
  ThemeToggler,
  type Direction,
  type ThemeSelection,
} from "@/components/animate-ui/primitives/effects/theme-toggler";
import { cn } from "@/lib/utils";

export type ThemeTogglerButtonProps = ComponentProps<"button"> & {
  variant?: "default" | "accent" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg";
  modes?: Array<ThemeSelection>;
  direction?: Direction;
  defaultTheme?: ThemeSelection;
  onImmediateChange?: (theme: ThemeSelection) => void;
};

export function ThemeTogglerButton({
  variant = "default",
  size = "default",
  modes = ["light", "dark"],
  direction = "alternate",
  defaultTheme,
  onImmediateChange,
  className,
  onClick,
  ...props
}: ThemeTogglerButtonProps) {
  return (
    <ThemeToggler
      direction={direction}
      defaultTheme={defaultTheme}
      onImmediateChange={onImmediateChange}
    >
      {({ effective, resolved, toggleTheme }) => {
        const nextTheme = (() => {
          const current = modes.includes(effective) ? effective : resolved;
          const idx = modes.indexOf(current);
          const nextIdx = (idx + 1) % modes.length;
          return modes[nextIdx] ?? modes[0] ?? "light";
        })();

        const isDark = resolved === "dark";

        return (
          <button
            type="button"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={isDark}
            onClick={(e) => {
              onClick?.(e);
              toggleTheme(nextTheme);
            }}
            className={cn(
              "group relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              variant === "default" && "bg-primary text-primary-foreground shadow hover:bg-primary/90",
              variant === "accent" && "bg-accent text-accent-foreground hover:bg-accent/80",
              variant === "destructive" && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
              variant === "outline" && "border border-border bg-card text-foreground shadow-soft hover:bg-accent",
              variant === "secondary" && "bg-secondary text-secondary-foreground hover:bg-secondary/80",
              variant === "ghost" && "bg-transparent text-foreground hover:bg-accent",
              variant === "link" && "text-primary underline-offset-4 hover:underline",
              size === "default" && "h-9 w-9",
              size === "sm" && "h-8 w-8",
              size === "lg" && "h-10 w-10",
              className
            )}
            {...props}
          >
            <span className="relative flex h-4 w-4 items-center justify-center">
              {effective === "system" ? (
                <Monitor className="h-4 w-4 transition-transform duration-300" />
              ) : isDark ? (
                <Moon className="h-4 w-4 transition-transform duration-300" />
              ) : (
                <Sun className="h-4 w-4 transition-transform duration-300" />
              )}
            </span>
          </button>
        );
      }}
    </ThemeToggler>
  );
}

import * as React from "react";
import { flushSync } from "react-dom";

type ThemeSelection = "light" | "dark" | "system";
type Resolved = "light" | "dark";
type Direction = "btt" | "ttb" | "ltr" | "rtl" | "alternate";

type ChildrenRender =
  | React.ReactNode
  | ((state: {
      resolved: Resolved;
      effective: ThemeSelection;
      toggleTheme: (theme: ThemeSelection) => void;
    }) => React.ReactNode);

function getSystemEffective(): Resolved {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getClipKeyframes(direction: Direction): [string, string] {
  switch (direction) {
    case "ltr":
      return ["inset(0 100% 0 0)", "inset(0 0 0 0)"];
    case "rtl":
      return ["inset(0 0 0 100%)", "inset(0 0 0 0)"];
    case "ttb":
      return ["inset(0 0 100% 0)", "inset(0 0 0 0)"];
    case "btt":
    default:
      return ["inset(100% 0 0 0)", "inset(0 0 0 0)"];
  }
}

type ThemeTogglerProps = {
  theme?: ThemeSelection | undefined;
  defaultTheme?: ThemeSelection | undefined;
  resolvedTheme?: Resolved | undefined;
  setTheme?: ((theme: ThemeSelection) => void) | undefined;
  direction?: Direction | undefined;
  onImmediateChange?: ((theme: ThemeSelection) => void) | undefined;
  children?: ChildrenRender | undefined;
};

export function ThemeToggler({
  theme: controlledTheme,
  defaultTheme,
  resolvedTheme: controlledResolvedTheme,
  setTheme: controlledSetTheme,
  onImmediateChange,
  direction = "alternate",
  children,
  ...props
}: ThemeTogglerProps) {
  // Built-in theme state if not controlled externally
  const [internalTheme, setInternalTheme] = React.useState<ThemeSelection>(defaultTheme ?? "light");
  const [internalResolvedTheme, setInternalResolvedTheme] = React.useState<Resolved>(
    defaultTheme === "dark" ? "dark" : "light"
  );
  const [toggleCount, setToggleCount] = React.useState(0);

  React.useEffect(() => {
    if (controlledTheme !== undefined) return;
    try {
      const stored = localStorage.getItem("theme") as ThemeSelection | null;
      const initial: ThemeSelection = defaultTheme ?? (
        stored === "light" || stored === "dark" || stored === "system"
          ? stored
          : "light"
      );
      setInternalTheme(initial);
      const res: Resolved = initial === "system" ? getSystemEffective() : initial;
      setInternalResolvedTheme(res);
      document.documentElement.classList.toggle("dark", res === "dark");
    } catch {}
  }, [controlledTheme, defaultTheme]);

  const activeTheme = controlledTheme ?? internalTheme;
  const activeResolvedTheme = controlledResolvedTheme ?? internalResolvedTheme;

  const actualSetTheme = React.useCallback(
    (nextTheme: ThemeSelection) => {
      if (controlledSetTheme) {
        controlledSetTheme(nextTheme);
      } else {
        setInternalTheme(nextTheme);
        const nextResolved: Resolved = nextTheme === "system" ? getSystemEffective() : nextTheme;
        setInternalResolvedTheme(nextResolved);
        try {
          localStorage.setItem("theme", nextTheme);
        } catch {}
        document.documentElement.classList.toggle("dark", nextResolved === "dark");
      }
    },
    [controlledSetTheme]
  );

  const [preview, setPreview] = React.useState<null | {
    effective: ThemeSelection;
    resolved: Resolved;
  }>(null);

  const [current, setCurrent] = React.useState<{
    effective: ThemeSelection;
    resolved: Resolved;
  }>({
    effective: activeTheme,
    resolved: activeResolvedTheme,
  });

  React.useEffect(() => {
    setCurrent({
      effective: activeTheme,
      resolved: activeResolvedTheme,
    });
  }, [activeTheme, activeResolvedTheme]);

  React.useEffect(() => {
    if (
      preview &&
      activeTheme === preview.effective &&
      activeResolvedTheme === preview.resolved
    ) {
      setPreview(null);
    }
  }, [activeTheme, activeResolvedTheme, preview]);

  const toggleTheme = React.useCallback(
    async (nextTheme: ThemeSelection) => {
      const resolved = nextTheme === "system" ? getSystemEffective() : nextTheme;

      setCurrent({ effective: nextTheme, resolved });
      onImmediateChange?.(nextTheme);

      if (nextTheme === "system" && resolved === activeResolvedTheme) {
        actualSetTheme(nextTheme);
        return;
      }

      // Determine animation direction:
      // 1st time: bottom to top (btt)
      // 2nd time: top to bottom (ttb)
      // 3rd time: bottom to top (btt)
      let effectiveDirection: Direction = direction ?? "alternate";
      if (direction === "alternate" || direction === "btt" || !direction) {
        if (resolved === "dark") {
          effectiveDirection = "btt";
        } else if (resolved === "light") {
          effectiveDirection = "ttb";
        } else {
          effectiveDirection = toggleCount % 2 === 0 ? "btt" : "ttb";
        }
      }

      const [fromClip, toClip] = getClipKeyframes(effectiveDirection);
      setToggleCount((c) => c + 1);

      if (!document.startViewTransition) {
        flushSync(() => {
          setPreview({ effective: nextTheme, resolved });
          document.documentElement.classList.toggle("dark", resolved === "dark");
        });
        actualSetTheme(nextTheme);
        return;
      }

      await document.startViewTransition(() => {
        flushSync(() => {
          setPreview({ effective: nextTheme, resolved });
          document.documentElement.classList.toggle("dark", resolved === "dark");
        });
      }).ready;

      document.documentElement
        .animate(
          { clipPath: [fromClip, toClip] },
          {
            duration: 600,
            easing: "ease-in-out",
            pseudoElement: "::view-transition-new(root)",
          }
        )
        .finished.finally(() => {
          actualSetTheme(nextTheme);
        });
    },
    [onImmediateChange, activeResolvedTheme, direction, toggleCount, actualSetTheme]
  );

  return (
    <React.Fragment {...props}>
      {typeof children === "function"
        ? children({
            effective: current.effective,
            resolved: current.resolved,
            toggleTheme,
          })
        : children}
      <style>{`::view-transition-old(root), ::view-transition-new(root){animation:none;mix-blend-mode:normal;}`}</style>
    </React.Fragment>
  );
}

export type { ThemeTogglerProps, ThemeSelection, Resolved, Direction };

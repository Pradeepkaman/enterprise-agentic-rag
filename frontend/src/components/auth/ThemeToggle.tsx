import { ThemeTogglerButton } from "@/components/animate-ui/components/buttons/theme-toggler";

export function ThemeToggle({
  defaultTheme = "light",
}: {
  defaultTheme?: "light" | "dark" | "system" | undefined;
} = {}) {
  return (
    <ThemeTogglerButton
      variant="outline"
      size="default"
      direction="alternate"
      defaultTheme={defaultTheme}
      modes={["light", "dark"]}
      data-cursor-label="THEME"
      className="cursor-target"
    />
  );
}

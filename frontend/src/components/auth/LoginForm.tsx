import { useId, useState, type FormEvent } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { MagicCard } from "@/components/ui/magic-card";
import { SpecularButton } from "@/components/ui/specular-button";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type Credentials = { name: string; email: string };

const GOOGLE_SHEET_WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbxpeYeg1pHZUUba6yEk2UekBi3FYTHEWo5JuOQp9M4fD2-GE2QB6Z7i7vsLDzPpupxfYA/exec";

/**
 * Frontend login handler.
 * Preserves credentials in localStorage and logs to Google Sheets.
 */
export async function handleLogin(creds: Credentials): Promise<void> {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem("rag_auth_user", JSON.stringify({ name: creds.name, email: creds.email }));
    }
  } catch {
    // ignore storage quota issues
  }

  // Log directly to your Google Sheet webhook
  try {
    fetch(GOOGLE_SHEET_WEBHOOK_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ name: creds.name, email: creds.email }),
    }).catch(() => { });
  } catch {
    // ensure network errors do not block login
  }

  await new Promise((r) => setTimeout(r, 400));
}

type Errors = { name?: string; email?: string; form?: string };

export function LoginForm({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [shakeKey, setShakeKey] = useState(0);
  const ids = { name: useId(), email: useId() };

  const fail = (e: Errors) => {
    setErrors(e);
    setShakeKey((k) => k + 1);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const next: Errors = {};
    if (!name.trim()) next.name = "Enter your name.";
    if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid email address.";
    if (next.name || next.email) return fail(next);
    setErrors({});
    setLoading(true);
    try {
      await handleLogin({ name: name.trim(), email: email.trim() });
      onAuthenticated();
    } catch (err) {
      setLoading(false);
      fail({ form: err instanceof Error ? err.message : "Sign in failed." });
    }
  };

  const trackInputPointer = (e: React.PointerEvent<HTMLInputElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--input-x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--input-y", `${e.clientY - rect.top}px`);
  };

  const leaveInputPointer = (e: React.PointerEvent<HTMLInputElement>) => {
    e.currentTarget.style.setProperty("--input-x", "-250px");
    e.currentTarget.style.setProperty("--input-y", "-250px");
  };

  const inputCls = (bad?: string) =>
    cn(
      "h-10 w-full rounded-lg border bg-card px-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60",
      bad ? "border-destructive" : "spotlight-input border-input",
    );

  return (
    <MagicCard
      key={shakeKey}
      className={cn(
        "enter-up w-full max-w-sm rounded-xl p-7 shadow-soft",
        shakeKey > 0 && "shake",
      )}
    >
      <Logo />
      <p className="micro-label mt-8">Workspace access</p>
      <h1 className="mt-2 text-2xl font-bold text-foreground">Sign in</h1>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        Continue to your retrieval workspace and recent runs.
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <label htmlFor={ids.name} className="micro-label block">Name</label>
          <input
            id={ids.name}
            type="text"
            autoComplete="name"
            value={name}
            disabled={loading}
            onPointerMove={trackInputPointer}
            onPointerLeave={leaveInputPointer}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? `${ids.name}-e` : undefined}
            className={inputCls(errors.name)}
          />
          {errors.name && <p id={`${ids.name}-e`} className="text-[11px] text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor={ids.email} className="micro-label block">Email</label>
          <input
            id={ids.email}
            type="email"
            autoComplete="email"
            value={email}
            disabled={loading}
            onPointerMove={trackInputPointer}
            onPointerLeave={leaveInputPointer}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? `${ids.email}-e` : undefined}
            className={inputCls(errors.email)}
          />
          {errors.email && <p id={`${ids.email}-e`} className="text-[11px] text-destructive">{errors.email}</p>}
        </div>

        <div aria-live="polite" className="min-h-0">
          {errors.form && (
            <p className="rounded-lg border border-destructive/40 px-3 py-2 text-[11px] text-destructive">{errors.form}</p>
          )}
        </div>

        <SpecularButton
          type="submit"
          disabled={loading}
          data-cursor-label="SIGN IN"
          className="cursor-target h-10 w-full rounded-lg text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-80"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          {loading ? "Running pipeline…" : "Sign in"}
        </SpecularButton>
      </form>
    </MagicCard>
  );
}

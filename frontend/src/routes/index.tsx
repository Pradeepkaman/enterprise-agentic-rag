import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LoginForm } from "@/components/auth/LoginForm";
import { PipelineShowcase } from "@/components/auth/PipelineShowcase";
import { BackgroundFX } from "@/components/auth/BackgroundFX";
import { ThemeToggle } from "@/components/auth/ThemeToggle";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in · Retrieval-Augmented Generation" },
      { name: "description", content: "Sign in to your Retrieval-Augmented Generation research workspace." },
      { property: "og:title", content: "Sign in · Retrieval-Augmented Generation" },
      { property: "og:description", content: "Sign in to your Retrieval-Augmented Generation research workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [warping, setWarping] = useState(false);

  const goDashboard = useCallback(() => {
    setWarping(true);
    setTimeout(() => {
      navigate({ to: "/dashboard" });
    }, 650);
  }, [navigate]);

  // Ensure sign-in page defaults to white (light) theme
  if (typeof window !== "undefined") {
    document.documentElement.classList.remove("dark");
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.classList.remove("dark");
      try {
        localStorage.setItem("theme", "light");
      } catch {}
    }
  }, []);

  const onAuthenticated = () => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return goDashboard();
    }
    setSubmitted(true);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background Grid with Warp Acceleration */}
      <motion.div
        animate={
          warping
            ? { scale: 1.6, opacity: 0.15, filter: "blur(3px)" }
            : { scale: 1, opacity: 0.7, filter: "blur(0px)" }
        }
        transition={{ duration: 0.65, ease: "easeIn" }}
        className="dot-grid dot-grid-drift pointer-events-none absolute inset-0"
        aria-hidden="true"
      />
      <BackgroundFX />
      
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle defaultTheme="light" />
      </div>

      {/* Main Content with Forward Push & Focal Blur on Warp */}
      <motion.main
        animate={
          warping
            ? { scale: 1.08, opacity: 0, filter: "blur(14px)" }
            : { scale: 1, opacity: 1, filter: "blur(0px)" }
        }
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative grid min-h-screen min-[900px]:grid-cols-2"
      >
        <section className="flex items-center justify-center px-5 py-16">
          <LoginForm onAuthenticated={onAuthenticated} />
        </section>
        <section
          className="flex items-center justify-center border-border px-5 pb-16 min-[900px]:border-l min-[900px]:py-16"
          aria-hidden="true"
        >
          <div className="hidden w-full justify-center min-[900px]:flex">
            <PipelineShowcase fast={submitted} onComplete={goDashboard} />
          </div>
          <div className="flex w-full justify-center min-[900px]:hidden">
            <PipelineShowcase compact fast={submitted} onComplete={goDashboard} />
          </div>
        </section>
      </motion.main>

      {/* Cinematic Hyperspace Warp Aperture & HUD Transition */}
      <AnimatePresence>
        {warping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
          >
            {/* Luminous Central Focal Core */}
            <motion.div
              initial={{ scale: 0.1, opacity: 0 }}
              animate={{ scale: [0.1, 1.4, 4.5], opacity: [0, 0.85, 0] }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="absolute h-96 w-96 rounded-full bg-[radial-gradient(circle,oklch(0.85_0.15_240/0.6)_0%,oklch(0.7_0.22_300/0.3)_45%,transparent_70%)] blur-2xl dark:bg-[radial-gradient(circle,oklch(0.9_0.2_240/0.8)_0%,oklch(0.65_0.3_290/0.5)_45%,transparent_75%)]"
            />

            {/* Expanding Concentric Shockwave Rings */}
            <motion.div
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: [0.2, 3], opacity: [0.9, 0] }}
              transition={{ duration: 0.65, ease: "easeOut" }}
              className="absolute h-80 w-80 rounded-full border border-primary/50 shadow-[0_0_50px_rgba(255,255,255,0.4)]"
            />
            <motion.div
              initial={{ scale: 0.1, opacity: 0 }}
              animate={{ scale: [0.1, 2.4], opacity: [0.75, 0] }}
              transition={{ duration: 0.65, delay: 0.08, ease: "easeOut" }}
              className="absolute h-64 w-64 rounded-full border border-primary/30"
            />

            {/* Futuristic HUD Status Banner */}
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: [0, 1, 1, 0], y: [15, 0, 0, -8], scale: [0.95, 1, 1, 1.04] }}
              transition={{ duration: 0.65, times: [0, 0.25, 0.75, 1] }}
              className="relative z-10 flex flex-col items-center gap-3 rounded-2xl border border-border/80 bg-background/85 px-6 py-4 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <span className="font-mono text-xs font-semibold tracking-widest uppercase text-foreground">
                  Entering Research Workspace
                </span>
              </div>
              <div className="h-1 w-48 overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.55, ease: "easeInOut" }}
                  className="h-full bg-primary"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

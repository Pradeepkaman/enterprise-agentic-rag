import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { RAGWorkspace } from "@/components/rag-workspace";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Workspace · Retrieval-Augmented Generation" },
      { name: "description", content: "Explore documents with a transparent, citation-first AI research workspace." },
      { property: "og:title", content: "Workspace · Retrieval-Augmented Generation" },
      { property: "og:description", content: "Explore documents with a transparent, citation-first AI research workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.985, filter: "blur(8px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="h-dvh w-full overflow-hidden"
    >
      <RAGWorkspace />
    </motion.div>
  );
}

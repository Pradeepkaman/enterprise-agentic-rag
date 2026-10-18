export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src="/logo.png"
        alt="RAG Logo"
        className="h-8 w-8 object-contain rounded-[5px]"
      />
      <span className="text-sm font-bold text-foreground">Retrieval-Augmented Generation</span>
    </div>
  );
}

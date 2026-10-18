import { useEffect, useRef, useState, createElement, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useNavigate } from "@tanstack/react-router";
import {
  Archive, Camera, ChevronDown, ChevronLeft, ChevronRight,
  CircleGauge, Copy, FileText, FolderOpen, GitBranch, LogOut, Menu, Moon, MoreHorizontal, MoreVertical,
  PanelRight, Pin, Plus, Search, Settings, Sun, Trash2, UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import { AgentPipeline, STAGES } from "./agent-pipeline";
import { AgentPipelineDetail } from "./agent-pipeline-detail";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeTogglerButton } from "@/components/animate-ui/components/buttons/theme-toggler";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageAction, MessageActions, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputButton, PromptInputFooter, PromptInputSubmit, PromptInputTextarea, PromptInputTools, type PromptInputMessage } from "@/components/ai-elements/prompt-input";

type Status = "ready" | "submitted" | "streaming";
type Source = { id: number; name: string; page: string; score: number; snippet: string };

// Pipeline trace types
export type TraceStep = {
  step: string;
  ms: number;
  status?: string; // "skipped" | "done" | etc
  data?: any;
  totalMs?: number;
};
export type PipelineTrace = {
  steps: Record<string, TraceStep>;
  totalMs: number;
  isChitchat: boolean;
};

type ChatTurn = { role: "user" | "assistant"; content: string; sources?: Source[]; trace?: PipelineTrace };
type ChatSession = { id: number; title: string; turns: ChatTurn[]; pinned?: boolean };

function BrandMark({ className = "size-8" }: { className?: string }) {
  return <img src="/logo.png" alt="RAG Logo" className={`${className} object-contain rounded-[5px]`} />;
}

function MarqueeTitle() {
  return createElement(
    "marquee",
    {
      behavior: "scroll",
      direction: "left",
      scrollamount: "4",
      className: "block font-semibold pt-1 text-sm whitespace-nowrap text-foreground cursor-default",
    },
    "Retrieval-Augmented Generation"
  );
}

function IconButton({ label, children, onClick, className = "" }: { label: string; children: React.ReactNode; onClick?: () => void; className?: string }) {
  return <Tooltip><TooltipTrigger asChild><Button aria-label={label} onClick={onClick} variant="ghost" size="icon" className={className}>{children}</Button></TooltipTrigger><TooltipContent>{label}</TooltipContent></Tooltip>;
}

function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  closeMobile,
  chats,
  activeChatId,
  onNewChat,
  onSelectChat,
  onTogglePinChat,
  onDeleteChat,
}: {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  closeMobile: () => void;
  chats: ChatSession[];
  activeChatId: number | null;
  onNewChat: () => void;
  onSelectChat: (id: number) => void;
  onTogglePinChat: (id: number) => void;
  onDeleteChat: (id: number) => void;
}) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userData, setUserData] = useState<{ name: string; email: string }>({
    name: "Pradeep",
    email: "Workspace owner",
  });
  const [userAvatar, setUserAvatar] = useState<string>("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("rag_auth_user");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.name || parsed.email) {
          setUserData({
            name: parsed.name || "Pradeep",
            email: parsed.email || "Workspace owner",
          });
        }
      }
      const savedAvatar = localStorage.getItem("rag_user_avatar");
      if (savedAvatar) {
        setUserAvatar(savedAvatar);
      }
    } catch {}
  }, []);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size should be less than 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setUserAvatar(result);
      try {
        localStorage.setItem("rag_user_avatar", result);
        toast.success("Profile picture updated!");
      } catch {}
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setUserAvatar("");
    try {
      localStorage.removeItem("rag_user_avatar");
      toast.success("Profile picture reset");
    } catch {}
  };

  const getInitials = (name: string) => {
    const trimmed = (name || "").trim();
    if (!trimmed) return "PK";
    const parts = trimmed.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || "";
    const second = parts[1]?.[0] || "";
    if (first && second) {
      return (first + second).toUpperCase();
    }
    return trimmed.slice(0, 2).toUpperCase() || "PK";
  };

  const userInitials = getInitials(userData.name);

  const sortedChats = [...chats].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });

  return (
    <aside className={`${mobileOpen ? "translate-x-0" : "-translate-x-full"} ${collapsed ? "lg:w-[76px]" : "lg:w-[244px]"} fixed inset-y-0 left-0 z-40 flex w-[244px] flex-col border-r border-border bg-panel transition-all duration-300 lg:relative lg:translate-x-0`}>
      <div className="flex h-16 items-center gap-3 px-4">
        <BrandMark />
        {!collapsed && <MarqueeTitle />}
        <IconButton label="Close sidebar" onClick={mobileOpen ? closeMobile : onToggle} className="ml-auto"><ChevronLeft className={`${collapsed ? "lg:rotate-180" : ""}`} /></IconButton>
      </div>
      <div className="px-3 mt-4"><Button className="cursor-target w-full justify-start transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" data-cursor-label="NEW CHAT" onClick={onNewChat}><Plus />{!collapsed && "New chat"}</Button></div>
      <nav className="mt-7 min-h-0 flex-1 overflow-y-auto px-3">
        {!collapsed && <p className="mb-2 px-2 font-mono text-[10px] uppercase text-muted-foreground">Recents</p>}
        <div className="space-y-1">
          {sortedChats.map((chat) => (
            <div key={chat.id} className="group relative flex w-full items-center">
              <button
                onClick={() => onSelectChat(chat.id)}
                className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors ${
                  chat.id === activeChatId
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
                }`}
              >
                <div className="relative shrink-0">
                  <GitBranch className="size-4" />
                  {chat.pinned && collapsed && (
                    <span className="absolute -top-1 -right-1 size-2 rounded-full bg-coral" />
                  )}
                </div>
                {!collapsed && (
                  <span className="truncate flex-1 pr-14">{chat.title}</span>
                )}
              </button>
              {!collapsed && (
                <div className="absolute right-1 flex items-center gap-0.5">
                  {chat.pinned && (
                    <span className="flex size-6 items-center justify-center text-coral shrink-0" title="Pinned chat">
                      <Pin className="size-3.5 fill-coral rotate-45" />
                    </span>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="flex size-7 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100 data-[state=open]:opacity-100"
                        aria-label="Chat options"
                      >
                        <MoreVertical className="size-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36 font-sans">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePinChat(chat.id);
                        }}
                        className="cursor-pointer gap-2 text-xs"
                      >
                        <Pin className={`size-3.5 ${chat.pinned ? "fill-current" : ""}`} />
                        <span>{chat.pinned ? "Unpin chat" : "Pin this chat"}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChat(chat.id);
                        }}
                        className="cursor-pointer gap-2 text-xs text-destructive focus:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>
      <div className="border-t border-border p-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarUpload}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex w-full items-center gap-3 rounded-md p-2 hover:bg-background transition-colors text-left group"
              title={`${userData.name} (${userData.email})`}
            >
              <div className="size-8 shrink-0 rounded-[6px] border border-border bg-foreground text-background font-mono text-xs font-semibold flex items-center justify-center select-none shadow-sm">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userData.name}
                    className="size-full object-cover rounded-[5px]"
                  />
                ) : (
                  <span>{userInitials}</span>
                )}
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" title={userData.name}>{userData.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground" title={userData.email}>{userData.email}</p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-60 mb-1">
            <div className="flex items-center gap-2.5 p-2 border-b border-border">
              <div className="size-9 shrink-0 rounded-[6px] border border-border bg-foreground text-background font-mono text-xs font-semibold flex items-center justify-center select-none shadow-sm">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userData.name}
                    className="size-full object-cover rounded-[5px]"
                  />
                ) : (
                  <span>{userInitials}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-xs text-foreground truncate" title={userData.name}>{userData.name}</p>
                <p className="text-[11px] text-muted-foreground truncate" title={userData.email}>{userData.email}</p>
              </div>
            </div>
            <DropdownMenuItem
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer gap-2 text-xs mt-1"
            >
              <Camera className="size-3.5" />
              <span>Change profile picture</span>
            </DropdownMenuItem>
            {userAvatar && (
              <DropdownMenuItem
                onClick={handleRemoveAvatar}
                className="cursor-pointer gap-2 text-xs text-muted-foreground"
              >
                <Trash2 className="size-3.5" />
                <span>Remove photo</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => {
                try {
                  localStorage.removeItem("rag_auth_user");
                } catch {}
                navigate({ to: "/" });
              }}
              className="cursor-pointer gap-2 text-xs text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <LogOut className="size-3.5" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}

function Citation({
  source,
  selected,
  onClick,
}: {
  source: Source;
  selected: boolean;
  onClick: () => void;
}) {
  const scorePercent = Math.min(100, Math.max(0, Math.round(source.score * 100)));
  const isHighMatch = source.score >= 0.7;

  return (
    <HoverCard openDelay={120} closeDelay={150}>
      <HoverCardTrigger asChild>
        <motion.button
          layout
          onClick={onClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          data-cursor-label="CITATION"
          className={cn(
            "cursor-target group relative inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all shadow-sm cursor-pointer",
            selected
              ? "border-cyan bg-cyan/15 text-foreground shadow-[0_0_14px_rgba(6,182,212,0.3)] ring-1 ring-cyan"
              : "border-border bg-card/85 text-muted-foreground hover:border-cyan/70 hover:bg-card hover:text-foreground hover:shadow-soft"
          )}
        >
          <span className="flex h-4 min-w-4 items-center justify-center rounded bg-coral/15 font-mono text-[10px] font-bold text-coral">
            [{source.id}]
          </span>
          <FileText className="size-3 text-muted-foreground group-hover:text-cyan transition-colors" />
          <span className="truncate max-w-[150px] font-medium">{source.name}</span>
          {source.page && <span className="text-[10px] text-muted-foreground">p. {source.page}</span>}
          <span
            className={cn(
              "ml-0.5 inline-block size-1.5 rounded-full transition-all",
              isHighMatch
                ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
                : "bg-cyan shadow-[0_0_6px_rgba(6,182,212,0.8)]"
            )}
          />
        </motion.button>
      </HoverCardTrigger>

      <HoverCardContent
        side="top"
        align="start"
        sideOffset={8}
        className="z-50 w-[22rem] rounded-xl border border-border/80 bg-card/95 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
      >
        <div className="space-y-3">
          {/* Header with Source Badge & Cosine Match */}
          <div className="flex items-start justify-between gap-2 border-b border-border/70 pb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-coral/20 font-mono text-[11px] font-bold text-coral">
                {source.id}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-foreground" title={source.name}>
                  {source.name}
                </p>
                <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  {source.page ? `Page ${source.page} · ` : ""}Retrieved Passage
                </p>
              </div>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider",
                isHighMatch
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  : "bg-cyan/15 text-cyan border border-cyan/30"
              )}
            >
              {scorePercent}% match
            </span>
          </div>

          {/* Cosine Confidence Score Bar */}
          <div className="space-y-1">
            <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
              <span>Cosine Relevance</span>
              <span className="font-semibold text-foreground">{source.score.toFixed(3)}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isHighMatch
                    ? "bg-gradient-to-r from-cyan to-emerald-400"
                    : "bg-gradient-to-r from-amber-500 to-cyan"
                )}
                style={{ width: `${scorePercent}%` }}
              />
            </div>
          </div>

          {/* Quoted Passage Snippet */}
          <div className="rounded-lg border border-border/70 bg-muted/30 p-2.5">
            <p className="text-[11px] leading-relaxed text-foreground/90 italic line-clamp-4">
              "{source.snippet}"
            </p>
          </div>

          {/* Micro Footer Hint */}
          <div className="flex items-center justify-between font-mono text-[9px] text-muted-foreground pt-0.5">
            <span className="text-muted-foreground">Click pill to pin below</span>
            <span className="text-cyan font-medium flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-cyan inline-block" /> Grounded Source
            </span>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

function AgentPanel({ active, open, onClose, trace }: { active: boolean; open: boolean; onClose: () => void; trace: PipelineTrace | null }) {
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(true);
  const [liveElapsed, setLiveElapsed] = useState<number>(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (active) {
      startRef.current = Date.now();
      setLiveElapsed(0);
      const timer = setInterval(() => {
        if (startRef.current) {
          setLiveElapsed(Date.now() - startRef.current);
        }
      }, 50);
      return () => clearInterval(timer);
    } else {
      startRef.current = null;
      return undefined;
    }
  }, [active]);

  const displayMs = active 
    ? liveElapsed 
    : (trace?.totalMs || (trace ? Object.values(trace.steps).reduce((acc, s) => acc + (s.status === "done" ? (s.ms || 0) : 0), 0) : 0));
  
  // Reset selected step when trace changes (new query)
  useEffect(() => {
    setSelectedStep(null);
  }, [trace]);
  
  return (
    <div className={`fixed inset-y-0 right-0 z-30 flex transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"} xl:relative xl:translate-x-0`}>
      <aside className="flex w-[min(92vw,430px)] flex-col border-l border-border bg-panel xl:w-[390px]">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
          <div>
            <div className="flex items-center gap-2">
              <span className={`size-2 rounded-full ${active ? "animate-pulse bg-coral" : "bg-success"}`} />
              <h2 className="text-sm font-semibold">RAG pipeline</h2>
            </div>
            <p className="mt-0.5 font-mono text-[9px] uppercase text-muted-foreground">{active ? "executing · live" : trace ? "last run · complete" : "idle"}</p>
          </div>
          <div className="flex items-center gap-1">
            {(active || trace) && (
              <Badge variant="outline" className="gap-1 font-mono text-[9px]">
                <CircleGauge className="size-3" /> {displayMs.toLocaleString()} ms
              </Badge>
            )}
            {!detailOpen && (
              <IconButton label="Open inspector" onClick={() => setDetailOpen(true)} className="hidden lg:flex">
                <ChevronLeft className="size-4" />
              </IconButton>
            )}
            <IconButton label="Close pipeline" onClick={onClose} className="xl:hidden">
              <ChevronRight />
            </IconButton>
          </div>
        </div>
        <div className="min-h-0 flex-1">
          <AgentPipeline
            active={active}
            selectedStep={selectedStep}
            onSelectStep={(step) => {
              setSelectedStep(step);
              if (step) setDetailOpen(true);
            }}
            trace={trace}
            liveElapsedMs={displayMs}
          />
        </div>
      </aside>
      {detailOpen && (
        <AgentPipelineDetail
          selectedStep={selectedStep}
          onSelectStep={setSelectedStep}
          onClose={() => setDetailOpen(false)}
          trace={trace}
        />
      )}
    </div>
  );
}


function SettingsDialog() {
  return <Dialog><DialogTrigger asChild><IconButton label="Retrieval settings"><Settings /></IconButton></DialogTrigger><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Retrieval settings</DialogTitle><DialogDescription>Tune how RAG searches and grounds responses.</DialogDescription></DialogHeader><div className="space-y-6 py-2">{[["Retrieved passages", "8"], ["Chunk size", "768 tokens"], ["Temperature", "0.2"]].map(([label, value]) => <div key={label} className="flex items-center justify-between border-b border-border pb-3"><span className="text-sm">{label}</span><Badge variant="secondary" className="font-mono font-normal">{value}</Badge></div>)}<div className="flex items-center justify-between"><div><p className="text-sm">Reranking</p><p className="text-xs text-muted-foreground">Improve source precision</p></div><Switch defaultChecked /></div></div></DialogContent></Dialog>;
}

const DEFAULT_SOURCE_FILES = [
  "ADA M-1.pdf", "ADA M-2.pdf", "ADA M-3.pdf", "ADA M-4.pdf", "ADA M-5.pdf",
  "AI module 1.pdf", "AI module 2.pdf", "AI module 3.pdf", "AI module 4.pdf", "AI module 5.pdf",
  "CN-module-1.pdf", "CN-module-2.pdf", "CN-module-3.pdf", "CN-module-4.pdf", "CN-module-5.pdf",
  "Complete JAVA.pdf",
  "DL module 1.pdf", "DL module 2.pdf", "DL module 3.pdf", "DL module 4.pdf", "DL module 5.pdf",
  "Indian Constitution Notes - All Modules.pdf",
  "ML module 1.pdf", "ML module 2.pdf", "ML module 3.pdf", "ML module 4.pdf", "ML module 5.pdf",
  "OS All Modules Notes.pdf",
  "SE Module 1.pdf", "SE Module 2.pdf", "SE Module 3.pdf", "SE Module 4.pdf", "SE Module 5.pdf",
  "oops's with java Module 1.pdf", "oops's with java Module 2.pdf", "oops's with java Module 3.pdf", "oops's with java Module 4.pdf", "oops's with java Module 5.pdf"
];

function KnowledgeDialog({ sourceFiles }: { sourceFiles: string[] }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="cursor-target" data-cursor-label="KNOWLEDGE">
          <FolderOpen /> Knowledge
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Knowledge base</DialogTitle>
          <DialogDescription>
            {sourceFiles.length} source documents indexed and ready for retrieval.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 min-h-0 flex-1 overflow-y-auto pr-1 space-y-2">
          {sourceFiles.map((fileItem, idx) => {
            const fileName = typeof fileItem === "string" ? fileItem : ((fileItem as any)?.name || `Document ${idx + 1}`);
            return (
              <div
                key={`${fileName}-${idx}`}
                className="flex items-center gap-3 rounded-md border border-border/50 bg-card/60 p-2.5 hover:bg-card transition-colors"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-coral">
                  <FileText className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate font-medium" title={fileName}>{fileName}</span>
                    <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold shrink-0 ml-2">Ready</span>
                  </div>
                  <Progress value={100} className="mt-1.5 h-1" />
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const API_BASE_URL = ((import.meta as any).env?.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

export function RAGWorkspace() {
  const [dark, setDark] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [status, setStatus] = useState<Status>("ready");
  const [selectedSource, setSelectedSource] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("nvidia");
  const [sourceFiles, setSourceFiles] = useState<string[]>(DEFAULT_SOURCE_FILES);
  
  // Multi-conversation state
  const [allChats, setAllChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  
  // Current streaming state
  const [streamingAnswer, setStreamingAnswer] = useState("");
  const [streamingSources, setStreamingSources] = useState<Source[]>([]);
  const [shimmerTurnIndex, setShimmerTurnIndex] = useState<number | null>(null);
  
  // Live pipeline trace (for current streaming run)
  const [liveTrace, setLiveTrace] = useState<PipelineTrace | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch real list of source PDFs from backend
  useEffect(() => {
    fetch(`${API_BASE_URL}/sources`)
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.files) && data.files.length > 0) {
          const names: string[] = data.files.map((f: any) => typeof f === "string" ? f : (f.name || String(f)));
          setSourceFiles(names);
        }
      })
      .catch(() => {});
  }, []);

  // Get the currently active chat
  const activeChat = allChats.find(c => c.id === activeChatId);
  
  // Get the last assistant answer for copy button
  const lastAnswer = activeChat?.turns.filter(t => t.role === "assistant").pop()?.content || streamingAnswer;

  // Determine which trace to show: live trace during streaming, or last assistant turn's saved trace
  const lastAssistantTurn = activeChat?.turns.filter(t => t.role === "assistant").pop();
  const displayTrace = liveTrace || lastAssistantTurn?.trace || null;

  const [loaderText, setLoaderText] = useState("Thinking…");

  const handleNewChat = () => {
    setActiveChatId(null);
    setStreamingAnswer("");
    setStreamingSources([]);
    setSelectedSource(null);
    setStatus("ready");
    setLiveTrace(null);
    setLoaderText("Thinking…");
    textareaRef.current?.focus();
  };

  const handleSelectChat = (chatId: number) => {
    setActiveChatId(chatId);
    setStreamingAnswer("");
    setStreamingSources([]);
    setSelectedSource(null);
    setStatus("ready");
    setLiveTrace(null);
    setLoaderText("Thinking…");
  };

  const handleTogglePinChat = (chatId: number) => {
    setAllChats(prev => prev.map(c => c.id === chatId ? { ...c, pinned: !c.pinned } : c));
  };

  const handleDeleteChat = (chatId: number) => {
    setAllChats(prev => prev.filter(c => c.id !== chatId));
    if (activeChatId === chatId) {
      handleNewChat();
    }
    toast.success("Chat deleted");
  };

  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);
  useEffect(() => { textareaRef.current?.focus(); }, []);

  const handleSubmit = async (message: PromptInputMessage, event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!message.text.trim()) return;
    
    const userQuery = message.text.trim();
    
    // If no active chat, create a new one
    let chatId = activeChatId;
    if (!chatId) {
      chatId = Date.now();
      const newChat: ChatSession = { id: chatId, title: userQuery.slice(0, 40), turns: [] };
      setAllChats(prev => [newChat, ...prev]);
      setActiveChatId(chatId);
    }
    
    // Add user turn to the chat
    setAllChats(prev => prev.map(c => c.id === chatId ? { ...c, turns: [...c.turns, { role: "user" as const, content: userQuery }] } : c));
    
    // Build messages array for backend (full conversation history)
    const currentChat = allChats.find(c => c.id === chatId);
    const apiMessages = (currentChat?.turns || []).map(t => ({ role: t.role, content: t.content }));
    apiMessages.push({ role: "user", content: userQuery });

    setSelectedSource(null);
    setStatus("submitted");
    setStreamingAnswer("");
    setStreamingSources([]);
    setLiveTrace({ steps: {}, totalMs: 0, isChitchat: false });
    setLoaderText("Thinking…");

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, model: selectedModel })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      setStatus("streaming");
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let fullAnswer = "";
      let finalSources: Source[] = [];
      let buffer = "";
      let currentTrace: PipelineTrace = { steps: {}, totalMs: 0, isChitchat: false };

      while (!done && reader) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || "";
          
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.trace) {
                  // Process trace event
                  const traceEvent: TraceStep = data.trace;
                  const prevStep = currentTrace.steps[traceEvent.step] || {};
                  currentTrace.steps[traceEvent.step] = {
                    ...prevStep,
                    ...traceEvent,
                    status: traceEvent.status || (traceEvent.ms !== undefined ? "done" : "running")
                  };
                  if (traceEvent.totalMs) {
                    currentTrace.totalMs = traceEvent.totalMs;
                  }
                  // Detect chitchat
                  if (traceEvent.step === "intent" && traceEvent.data?.intent === "chitchat") {
                    currentTrace.isChitchat = true;
                  }
                  // Update live trace immutably
                  setLiveTrace({ ...currentTrace, steps: { ...currentTrace.steps } });
                } else if (data.loaderStage) {
                  const stageMap: Record<string, string> = {
                    "classifying": "Thinking…",
                    "thinking": "Thinking…",
                    "expanding": "Thinking…",
                    "embedding": "Searching your knowledge…",
                    "searching": "Searching your knowledge…",
                    "ranking": "Ranking passages…",
                    "generating": "Writing answer…",
                    "verifying": "Verifying…",
                    "finalizing": "Finalizing answer…"
                  };
                  if (data.loaderStage && stageMap[data.loaderStage]) setLoaderText(stageMap[data.loaderStage] as string);
                } else if (data.sources) {
                  const formattedSources = data.sources.map((src: any, index: number) => ({
                    id: index + 1, name: src.filename, page: "", score: src.score, snippet: src.snippet
                  }));
                  finalSources = formattedSources;
                  setStreamingSources(formattedSources);
                } else if (data.text) {
                  fullAnswer += data.text;
                  setStreamingAnswer(fullAnswer);
                  // Ensure synthesis is immediately running when first token arrives (for knowledge queries only, never for chitchat)
                  if (!currentTrace.isChitchat && currentTrace.steps["synth"]?.status !== "skipped" && currentTrace.steps["synth"]?.status !== "done") {
                    currentTrace.steps["synth"] = {
                      ...(currentTrace.steps["synth"] || {}),
                      step: "synth",
                      ms: currentTrace.steps["synth"]?.ms || 0,
                      status: "running"
                    };
                    setLiveTrace({ ...currentTrace, steps: { ...currentTrace.steps } });
                  }
                } else if (data.error) {
                  fullAnswer = "Sorry, something went wrong. Please try again or switch the model.";
                  setStreamingAnswer(fullAnswer);
                  toast.error(data.error);
                }
              } catch (e) {
                // ignore malformed JSON chunks
              }
            }
          }
        }
      }

      // Ensure no step is left hanging in "running" once the stream has completed
      Object.keys(currentTrace.steps).forEach(k => {
        if (currentTrace.steps[k]?.status === "running") {
          currentTrace.steps[k].status = "done";
        }
      });

      // Save the completed assistant turn into the chat (with trace!)
      const finalChatId = chatId;
      const savedTrace = { ...currentTrace };
      const currentChat = allChats.find(c => c.id === finalChatId);
      const newAssistantIndex = (currentChat?.turns || []).length;

      setAllChats(prev => prev.map(c => c.id === finalChatId ? { ...c, turns: [...c.turns, { role: "assistant" as const, content: fullAnswer, sources: finalSources, trace: savedTrace }] } : c));
      setStreamingAnswer("");
      setStreamingSources([]);

      // Trigger one-time horizon shimmer on newly finished answer
      setShimmerTurnIndex(newAssistantIndex);
      setTimeout(() => setShimmerTurnIndex(null), 1400);

    } catch (error: any) {
      const errMsg = `Error connecting to the backend: ${error.message}`;
      setStreamingAnswer(errMsg);
      // Save the error as assistant turn
      const finalChatId = chatId;
      setAllChats(prev => prev.map(c => c.id === finalChatId ? { ...c, turns: [...c.turns, { role: "assistant" as const, content: errMsg }] } : c));
      setStreamingAnswer("");
      toast.error("Failed to fetch response");
    } finally {
      setStatus("ready");
      textareaRef.current?.focus();
    }
  };

  // Determine what to render in the conversation area
  const turnsToShow = activeChat?.turns || [];
  const isEmptyState = !activeChatId && allChats.length === 0;
  // Sources to show: either from the last completed assistant turn or from streaming
  let displaySources = streamingSources.length > 0 ? streamingSources : (lastAssistantTurn?.sources || []);
  
  // Prioritize sources cited in text; if none cited explicitly, show retrieved sources
  const currentText = streamingAnswer || lastAssistantTurn?.content || "";
  const citedSources = displaySources.filter(src => {
    const regex = new RegExp(`\\[\\s*(source\\s*)?${src.id}\\s*\\]|\\(\\s*(source\\s*)?${src.id}\\s*\\)`, "i");
    return regex.test(currentText);
  });
  displaySources = citedSources.length > 0 ? citedSources : displaySources;

  // Determine if this answer is grounded (has real citations, not chitchat)
  const groundingData = displayTrace?.steps["grounding"]?.data;
  const isGrounded = displaySources.length > 0 && !(displayTrace?.isChitchat) && groundingData?.overall === true;
  const showNotVerified = displaySources.length > 0 && !(displayTrace?.isChitchat) && groundingData && groundingData?.overall !== true;

  return <TooltipProvider delayDuration={200}><div className="flex h-dvh w-full overflow-hidden bg-background text-foreground">
    {mobileOpen && <button aria-label="Close menu" className="fixed inset-0 z-30 bg-foreground/20 lg:hidden" onClick={() => setMobileOpen(false)} />}
    <Sidebar
      collapsed={collapsed}
      onToggle={() => setCollapsed(v => !v)}
      mobileOpen={mobileOpen}
      closeMobile={() => setMobileOpen(false)}
      chats={allChats}
      activeChatId={activeChatId}
      onNewChat={handleNewChat}
      onSelectChat={handleSelectChat}
      onTogglePinChat={handleTogglePinChat}
      onDeleteChat={handleDeleteChat}
    />
    <main className="flex min-w-0 flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-3 sm:px-5">
        <IconButton label="Open conversations" onClick={() => setMobileOpen(true)} className="lg:hidden"><Menu /></IconButton>
        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger className="w-auto min-w-[240px] max-w-[340px] border border-border/50 bg-secondary/30 px-3 py-1.5 text-xs font-mono shadow-none focus:ring-1">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nvidia">
              meta/llama-3.2-11b-vision-instruct (NVIDIA)
            </SelectItem>
            <SelectItem value="gemini">
              gemini-2.5-flash (Google)
            </SelectItem>
          </SelectContent>
        </Select>
        {isGrounded && <Badge variant="outline" className="hidden gap-1.5 font-mono text-[9px] sm:flex border-success/40 text-success"><span className="size-1.5 rounded-full bg-success" /> GROUNDED</Badge>}
        {showNotVerified && <Badge variant="outline" className="hidden gap-1.5 font-mono text-[9px] sm:flex border-coral/40 text-coral"><span className="size-1.5 rounded-full bg-coral" /> NOT VERIFIED</Badge>}
        <div className="ml-auto flex items-center gap-1"><KnowledgeDialog sourceFiles={sourceFiles} /><ThemeTogglerButton variant="ghost" size="default" direction="alternate" className="cursor-target" data-cursor-label="THEME" /><IconButton label="View agent observatory" onClick={() => setPanelOpen(true)} className="xl:hidden"><PanelRight /></IconButton></div>
      </header>
      <div className="flex min-h-0 flex-1">
        <section className="flex min-w-0 flex-1 flex-col">
          <Conversation className="min-h-0"><ConversationContent className="mx-auto w-full max-w-3xl gap-6 px-4 py-8 sm:px-8">
            {/* Empty state when no chat is active */}
            {!activeChatId && <div className="mb-2"><p className="font-mono text-[10px] uppercase text-coral">New conversation</p><h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Ask anything from your knowledge base</h1><p className="mt-2 text-sm text-muted-foreground">Select a model and start asking questions</p></div>}
            
            {/* Active chat title */}
            {activeChatId && activeChat && <div className="mb-2"><p className="font-mono text-[10px] uppercase text-coral">Research thread</p><h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{activeChat.title}</h1></div>}
            
            {/* Render all completed turns */}
            {turnsToShow.map((turn, i) => (
              <Message key={i} from={turn.role === "user" ? "user" : "assistant"}>
                {turn.role === "user" ? (
                  <MessageContent className="bg-chat-user text-chat-user-foreground">{turn.content}</MessageContent>
                ) : (
                  <>
                    {turn.sources && turn.sources.length > 0 && !(turn.trace?.isChitchat) && (
                      <div className="mb-1.5 flex items-center gap-1.5">
                        {turn.trace?.steps["grounding"]?.data?.overall === true && <Badge variant="outline" className="border-success/40 font-mono text-[9px] text-success">grounded</Badge>}
                        {turn.trace?.steps["grounding"]?.data && turn.trace?.steps["grounding"]?.data?.overall !== true && <Badge variant="outline" className="border-coral/40 font-mono text-[9px] text-coral">not verified</Badge>}
                      </div>
                    )}
                    <MessageContent
                      className={cn(
                        "w-full text-[15px] leading-7 transition-all duration-300",
                        shimmerTurnIndex === i && "horizon-shimmer-sweep"
                      )}
                    >
                      <MessageResponse isAnimating={false}>{turn.content}</MessageResponse>
                    </MessageContent>
                  </>
                )}
              </Message>
            ))}
            
            {/* Streaming state: show searching animation or streaming text */}
            {status !== "ready" && (
              <Message from="assistant">
                <MessageContent className="w-full text-[15px] leading-7">
                  {status === "submitted" && !streamingAnswer ? (
                    <div className="flex items-center gap-3 py-4">
                      <div className="relative flex size-9 items-center justify-center">
                        <div className="absolute inset-0 animate-ping rounded-full border border-cyan/40" />
                        <span className="size-2 rounded-full bg-cyan shadow-[0_0_10px_var(--cyan)] animate-pulse" />
                      </div>
                      <span className="font-mono text-sm text-foreground/80">{loaderText}</span>
                    </div>
                  ) : streamingAnswer ? (
                    <div className="ai-stream-active">
                      <MessageResponse isAnimating={status === "streaming"}>{streamingAnswer}</MessageResponse>
                      {loaderText === "Verifying…" && (
                        <div className="mt-2.5 flex items-center gap-2 font-mono text-[11px] text-cyan animate-pulse">
                          <span className="size-1.5 rounded-full bg-cyan animate-ping" />
                          <span>Verifying citations & grounding…</span>
                        </div>
                      )}
                      {loaderText === "Finalizing answer…" && (
                        <div className="mt-2.5 flex items-center gap-2 font-mono text-[11px] text-cyan animate-pulse">
                          <span className="size-1.5 rounded-full bg-cyan animate-ping" />
                          <span>Finalizing answer…</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 py-4">
                      <div className="relative flex size-9 items-center justify-center">
                        <div className="absolute inset-0 animate-ping rounded-full border border-cyan/40" />
                        <span className="size-2 rounded-full bg-cyan shadow-[0_0_10px_var(--cyan)] animate-pulse" />
                      </div>
                      <span className="font-mono text-sm text-foreground/80">{loaderText}</span>
                    </div>
                  )}
                </MessageContent>
              </Message>
            )}

            {/* Show citations and actions for the last completed answer when ready */}
            {status === "ready" && displaySources.length > 0 && activeChatId && <>
              <div className="mt-3 flex flex-wrap gap-2">{displaySources.map(source => <Citation key={source.id} source={source} selected={selectedSource === source.id} onClick={() => setSelectedSource(selectedSource === source.id ? null : source.id)} />)}</div>
              <AnimatePresence>
                {selectedSource && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -4 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -4 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2.5 rounded-xl border border-cyan/40 bg-card/90 p-4 shadow-lg backdrop-blur-md">
                      <div className="flex items-center justify-between border-b border-border/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="flex size-5 items-center justify-center rounded bg-coral/20 font-mono text-xs font-bold text-coral">
                            {displaySources.find(s => s.id === selectedSource)?.id}
                          </span>
                          <span className="text-xs font-semibold text-foreground">
                            {displaySources.find(s => s.id === selectedSource)?.name}
                          </span>
                          {displaySources.find(s => s.id === selectedSource)?.page && (
                            <span className="text-[11px] text-muted-foreground">
                              p. {displaySources.find(s => s.id === selectedSource)?.page}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-cyan/15 px-2 py-0.5 font-mono text-[10px] text-cyan border border-cyan/30">
                            {((displaySources.find(s => s.id === selectedSource)?.score || 0) * 100).toFixed(0)}% match
                          </span>
                          <button
                            onClick={() => setSelectedSource(null)}
                            className="text-muted-foreground hover:text-foreground text-xs p-1"
                            aria-label="Close excerpt"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <p className="mt-2.5 text-xs leading-relaxed text-foreground/90 italic">
                        "{displaySources.find(s => s.id === selectedSource)?.snippet}"
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <details className="mt-3 border-t border-border pt-3"><summary className="cursor-pointer list-none text-xs font-medium text-muted-foreground"><span className="inline-flex items-center gap-2"><Archive className="size-3.5" /> View retrieved context <ChevronDown className="size-3" /></span></summary><div className="mt-3 grid gap-2 sm:grid-cols-3">{displaySources.map(s => <div key={s.id} className="border-l border-border pl-3 text-xs text-muted-foreground"><span className="font-mono text-cyan">Score: {s.score}</span><p className="mt-1 line-clamp-3">{s.snippet}</p></div>)}</div></details>
              <MessageActions className="mt-3"><MessageAction tooltip="Copy answer" onClick={() => { navigator.clipboard.writeText(lastAnswer); toast.success("Answer copied"); }}><Copy /></MessageAction><MessageAction tooltip="View retrieval trace" onClick={() => setPanelOpen(true)}><GitBranch /></MessageAction></MessageActions>
            </>}
          </ConversationContent></Conversation>
          <div className="bg-background px-3 py-3 sm:px-6">
            <div className="mx-auto max-w-3xl">
              <div
                className="spotlight-card relative rounded-xl transition-all"
                onPointerMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  e.currentTarget.style.setProperty("--spotlight-x", `${e.clientX - rect.left}px`);
                  e.currentTarget.style.setProperty("--spotlight-y", `${e.clientY - rect.top}px`);
                }}
                onPointerLeave={(e) => {
                  e.currentTarget.style.setProperty("--spotlight-x", "-350px");
                  e.currentTarget.style.setProperty("--spotlight-y", "-350px");
                }}
              >
                <PromptInput
                  onSubmit={handleSubmit}
                  accept="application/pdf,text/plain"
                  multiple
                  onError={(e) => toast.error(e.message)}
                  className="relative z-10 border-0 bg-transparent shadow-[0_8px_30px_color-mix(in_oklab,var(--foreground)_7%,transparent)] [&_[data-slot=input-group]]:border-transparent [&_[data-slot=input-group]]:bg-transparent [&_[data-slot=input-group]]:shadow-none"
                >
                  <PromptInputTextarea ref={textareaRef} placeholder="Ask across your knowledge…" className="min-h-10 bg-transparent" />
                  <PromptInputFooter>
                    <PromptInputTools>
                      <span className="pl-1 font-mono text-[9px] uppercase text-muted-foreground">{sourceFiles.length} sources active</span>
                    </PromptInputTools>
                    <PromptInputSubmit status={status} onStop={() => { setStatus("ready"); toast("Generation stopped"); }} className="cursor-target" data-cursor-label="SUBMIT" />
                  </PromptInputFooter>
                </PromptInput>
              </div>
            </div>
          </div>
        </section>
        <AgentPanel active={status !== "ready"} open={panelOpen} onClose={() => setPanelOpen(false)} trace={displayTrace} />
      </div>
    </main>
  </div></TooltipProvider>;
}
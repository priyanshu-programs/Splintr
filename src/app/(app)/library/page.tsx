"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Clock,
  Copy,
  Check,
  FileText,
  Linkedin,
  Twitter,
  Instagram,
  Youtube,
  BookOpen,
  Grid3X3,
  List,
  Loader2,
  Library as LibraryIcon,
  Send,
  ChevronDown,
  ChevronRight,
  Trash2,
  ExternalLink,
  AlertCircle,
  Maximize2,
  X,
} from "lucide-react";
import {
  getLibraryItems,
  publishContent,
  getConnectedPlatforms,
  deleteContentByBatch,
  deleteContentById,
  updateContentStatus,
  type LibraryContentItem,
  type ConnectedPlatform,
} from "@/lib/content-store";
import { useToast } from "@/components/ui/toaster";

/* ── Custom Confirm Modal ── */

function ConfirmDeleteModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md bg-background dark:bg-[#121214] border border-foreground/5 dark:border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-500/10 text-red-500">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-[var(--sp-fg)]">
              {title}
            </h3>
            <p className="text-xs text-[var(--sp-fg-light)]">
              Action cannot be undone
            </p>
          </div>
        </div>
        <p className="text-sm text-[var(--sp-fg-light)] mb-8">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-[var(--sp-fg)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── tiny SVG icons for platforms without lucide icons ── */

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className || "w-5 h-5"}
      fill="currentColor"
    >
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.75a8.18 8.18 0 004.76 1.52V6.84a4.84 4.84 0 01-1-.15z" />
    </svg>
  );
}

function ThreadsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className || "w-5 h-5"}
      fill="currentColor"
    >
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.814.812c-1.04-3.706-3.572-5.587-7.524-5.59-2.591.007-4.576.87-5.896 2.564-1.19 1.525-1.818 3.783-1.843 6.66.024 2.874.654 5.13 1.843 6.66 1.32 1.693 3.305 2.554 5.9 2.56 2.17-.012 3.856-.527 5.01-1.53 1.285-1.116 1.94-2.707 1.94-4.724 0-1.564-.474-2.8-1.413-3.676-.718-.672-1.68-1.088-2.828-1.224a9.56 9.56 0 00.066 2.09c.287.396.457.863.457 1.37 0 .952-.444 1.79-1.136 2.33-.642.5-1.476.78-2.46.78-.75 0-1.37-.18-1.847-.536-.496-.37-.766-.907-.766-1.56 0-.726.356-1.32.97-1.71.556-.356 1.32-.534 2.258-.584l.012-.002c.468-.026.927.007 1.38.064.102-.57.148-1.186.128-1.844-.047-1.426-.577-2.52-1.578-3.25-.82-.597-1.866-.916-3.108-.94l-.07-.001c-1.64.032-2.93.607-3.845 1.716L3.95 9.385C5.283 7.82 7.153 7 9.576 6.968h.09c1.7.032 3.166.517 4.357 1.384 1.396 1.018 2.168 2.56 2.237 4.443.022.735-.04 1.43-.177 2.082 1.162.347 2.096.97 2.77 1.86.893 1.177 1.347 2.724 1.347 4.6 0 2.627-.913 4.767-2.715 6.363C15.84 23.364 13.58 24 12.186 24z" />
    </svg>
  );
}

function MetaIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className || "w-5 h-5"}
      fill="currentColor"
    >
      <path d="M6.915 4.03c-1.968 0-3.202 1.14-4.157 2.81C1.532 8.803.715 11.49.715 13.71c0 2.04.918 3.54 2.93 3.54 1.563 0 2.863-1.06 4.168-3.04.876-1.33 1.66-2.95 2.31-4.53l.69-1.69c.63-1.53 1.38-3.19 2.38-4.39C14.493 2.1 16.023 1.3 17.753 1.3c2.16 0 3.79 1.07 4.85 2.83.93 1.54 1.4 3.5 1.4 5.73 0 2.4-.56 4.55-1.68 6.26-1.19 1.81-2.95 2.88-5.18 2.88-1.19 0-2.24-.37-3.07-1.05-.78-.63-1.36-1.52-1.72-2.57l-.49 1.2c-.42 1.02-.96 1.98-1.63 2.72-.92 1.02-2.07 1.7-3.49 1.7-2.01 0-3.57-.84-4.6-2.31C1.1 17.1.5 15.22.5 13.04c0-2.72.83-5.72 2.17-8.08C4.22 2.2 6.32.5 8.92.5c1.54 0 2.8.56 3.72 1.46.84.82 1.44 1.91 1.8 3.14l-.96 2.36c-.31-1.2-.81-2.18-1.5-2.86-.72-.71-1.62-1.07-2.7-1.07-.52 0-1.01.1-1.43.31l.06.14zm.12 1.66c-.34.5-.68 1.12-1.01 1.85l-.4.92c-.96 2.24-1.75 4.2-2.73 5.87-1.1 1.87-2.12 2.68-3.27 2.68-.86 0-1.46-.53-1.46-1.73 0-1.78.68-4.13 1.6-5.88.78-1.48 1.68-2.37 2.7-2.37.45 0 .83.16 1.13.45.27.26.47.6.6 1.01l.55-1.37c.2-.48.42-.92.66-1.3.57-.92 1.24-1.46 2.03-1.46.33 0 .6.1.78.29.14.15.22.35.22.6 0 .36-.17.79-.4 1.26l-.07.17z" />
    </svg>
  );
}

const platformIcon: Record<string, React.ReactNode> = {
  linkedin: <Linkedin className="w-3.5 h-3.5" />,
  x: <Twitter className="w-3.5 h-3.5" />,
  instagram: <Instagram className="w-3.5 h-3.5" />,
  blog: <BookOpen className="w-3.5 h-3.5" />,
  youtube: <Youtube className="w-3.5 h-3.5" />,
  tiktok: <TikTokIcon className="w-3.5 h-3.5" />,
  threads: <ThreadsIcon className="w-3.5 h-3.5" />,
  meta: <MetaIcon className="w-3.5 h-3.5" />,
};

const platformLabel: Record<string, string> = {
  linkedin: "LinkedIn",
  x: "X (Twitter)",
  instagram: "Instagram",
  blog: "Blog",
  youtube: "YouTube",
  tiktok: "TikTok",
  threads: "Threads",
  meta: "Meta",
};

const statusStyles: Record<string, { bg: string; text: string }> = {
  ready: { bg: "bg-sp-green/10", text: "text-[var(--sp-green)]" },
  published: {
    bg: "bg-blue-50 dark:bg-blue-950/20",
    text: "text-blue-600 dark:text-blue-400",
  },
  processing: {
    bg: "bg-yellow-50 dark:bg-yellow-950/20",
    text: "text-yellow-600 dark:text-yellow-400",
  },
  draft: {
    bg: "bg-amber-50 dark:bg-amber-950/20",
    text: "text-amber-600 dark:text-amber-400",
  },
  archived: {
    bg: "bg-neutral-100 dark:bg-neutral-800/30",
    text: "text-neutral-400 dark:text-neutral-500",
  },
};

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/* ── Custom Reader Modal ── */

function ContentReaderModal({
  isOpen,
  content,
  title,
  platform,
  onClose,
}: {
  isOpen: boolean;
  content: string;
  title: string;
  platform: string;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-background dark:bg-[#121214] border border-foreground/5 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-foreground/5 dark:border-white/5 bg-background dark:bg-[#121214] z-10 shrink-0">
          <div>
            <h3 className="font-semibold text-lg text-[var(--sp-fg)] leading-tight">
              {title}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[var(--sp-fg-light)]">
                {platformIcon[platform] || <FileText className="w-3.5 h-3.5" />}
              </span>
              <span className="text-xs font-medium text-[var(--sp-fg-light)] capitalize">
                {platformLabel[platform] || platform}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--sp-fg-light)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/5 dark:prose-pre:bg-white/5 prose-pre:text-[var(--sp-fg)] prose-a:text-blue-500 hover:prose-a:text-blue-600 font-sans text-[var(--sp-fg)]/90 whitespace-pre-wrap">
            {content}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContentLibraryPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [items, setItems] = useState<LibraryContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [expandedGenId, setExpandedGenId] = useState<string | null>(null);
  const [copiedGenId, setCopiedGenId] = useState<string | null>(null);
  const [connectedPlatforms, setConnectedPlatforms] = useState<
    ConnectedPlatform[]
  >([]);
  const [publishingGenId, setPublishingGenId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusDropdownId, setStatusDropdownId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [publishResult, setPublishResult] = useState<{
    genId: string;
    url: string;
    platform: string;
  } | null>(null);
  const [publishError, setPublishError] = useState<{
    genId: string;
    message: string;
  } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const [readerState, setReaderState] = useState<{
    isOpen: boolean;
    content: string;
    title: string;
    platform: string;
  }>({ isOpen: false, content: "", title: "", platform: "" });

  const { toast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        const [libraryItems, platforms] = await Promise.all([
          getLibraryItems(),
          getConnectedPlatforms(),
        ]);
        setItems(libraryItems);
        setConnectedPlatforms(platforms);
      } catch (error) {
        console.error("Failed to load library:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Close status dropdown on outside click
  useEffect(() => {
    if (!statusDropdownId) return;
    const handleClick = () => setStatusDropdownId(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [statusDropdownId]);

  // Auto-dismiss publish feedback after 8 seconds
  useEffect(() => {
    if (!publishResult && !publishError) return;
    const timer = setTimeout(() => {
      setPublishResult(null);
      setPublishError(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [publishResult, publishError]);

  function toggleTopic(topicId: string) {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
        // Also collapse any expanded generation from this topic
        const topic = items.find((i) => i.id === topicId);
        if (topic && topic.generations.some((g) => g.id === expandedGenId)) {
          setExpandedGenId(null);
        }
      } else {
        next.add(topicId);
      }
      return next;
    });
  }

  function handleCopy(content: string, genId: string) {
    navigator.clipboard.writeText(content);
    setCopiedGenId(genId);
    toast({ message: "Content copied to clipboard", type: "success" });
    setTimeout(() => setCopiedGenId(null), 2000);
  }

  async function handlePublish(genId: string, platform: string) {
    const connection = connectedPlatforms.find(
      (cp) => cp.platform === platform && cp.connected,
    );
    if (!connection) {
      toast({
        message: `Connect ${platform} first via the Connect page to publish directly.`,
        type: "error",
      });
      return;
    }

    // Find the generation's content from loaded items
    let content = "";
    for (const topic of items) {
      const gen = topic.generations.find((g) => g.id === genId);
      if (gen) {
        content = gen.content;
        break;
      }
    }

    setPublishingGenId(genId);
    setPublishResult(null);
    setPublishError(null);

    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generationId: genId, platform, content }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to publish");
      }

      // Update local status (needed for mock/localStorage mode)
      await publishContent(genId);

      const updated = await getLibraryItems();
      setItems(updated);

      setPublishResult({
        genId,
        url: data.publishedUrl || "",
        platform,
      });
      toast({ message: "Content published successfully!", type: "success" });
    } catch (error) {
      console.error("Publish error:", error);
      setPublishError({
        genId,
        message:
          error instanceof Error
            ? error.message
            : "Failed to publish. Please try again.",
      });
      toast({ message: "Failed to publish content.", type: "error" });
    } finally {
      setPublishingGenId(null);
    }
  }

  function handleDeleteBatch(topicId: string, topicTitle: string) {
    setConfirmAction({
      isOpen: true,
      title: "Delete Content Batch",
      message: `Are you sure you want to delete all scripts for "${topicTitle}"?`,
      onConfirm: async () => {
        setDeletingId(topicId);
        try {
          await deleteContentByBatch(topicId);
          const updated = await getLibraryItems();
          setItems(updated);
          toast({
            message: "Content batch deleted successfully",
            type: "success",
          });
        } catch (error) {
          console.error("Delete batch error:", error);
          toast({ message: "Failed to delete content batch", type: "error" });
        } finally {
          setDeletingId(null);
        }
      },
    });
  }

  function handleDeleteGeneration(genId: string, topicId: string) {
    setConfirmAction({
      isOpen: true,
      title: "Delete Script",
      message: "Are you sure you want to delete this script?",
      onConfirm: async () => {
        setDeletingId(genId);
        try {
          await deleteContentById(genId);
          const updated = await getLibraryItems();
          setItems(updated);
          toast({ message: "Script deleted successfully", type: "success" });
        } catch (error) {
          console.error("Delete generation error:", error);
          toast({ message: "Failed to delete script", type: "error" });
        } finally {
          setDeletingId(null);
        }
      },
    });
  }

  async function handleStatusChange(genId: string, newStatus: string) {
    setUpdatingStatusId(genId);
    setStatusDropdownId(null);
    try {
      await updateContentStatus(genId, newStatus);
      const updated = await getLibraryItems();
      setItems(updated);
      toast({ message: `Status updated to ${newStatus}`, type: "success" });
    } catch (error) {
      console.error("Status update error:", error);
      toast({ message: "Failed to update status", type: "error" });
    } finally {
      setUpdatingStatusId(null);
    }
  }

  // Filter: a topic matches if its title matches the search, or any of its generations' content matches.
  // Status filter: a topic matches if any of its generations match the status (or "all").
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      searchQuery === "" ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.generations.some((g) =>
        g.content.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    const matchesFilter =
      filterStatus === "all" ||
      item.generations.some((g) => g.status === filterStatus);
    return matchesSearch && matchesFilter;
  });

  const totalGenerations = filteredItems.reduce(
    (acc, item) => acc + item.generations.length,
    0,
  );

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 w-40 bg-sp-fg/5 rounded-lg animate-pulse mb-2" />
            <div className="h-4 w-64 bg-sp-fg/5 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-5"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-sp-fg/5 animate-pulse" />
                <div className="flex-1">
                  <div className="h-5 w-3/4 bg-sp-fg/5 rounded animate-pulse mb-2" />
                  <div className="h-4 w-1/2 bg-sp-fg/5 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto relative">
      <ConfirmDeleteModal
        isOpen={confirmAction.isOpen}
        title={confirmAction.title}
        message={confirmAction.message}
        onConfirm={confirmAction.onConfirm}
        onCancel={() =>
          setConfirmAction((prev) => ({ ...prev, isOpen: false }))
        }
      />

      <ContentReaderModal
        isOpen={readerState.isOpen}
        content={readerState.content}
        title={readerState.title}
        platform={readerState.platform}
        onClose={() => setReaderState((prev) => ({ ...prev, isOpen: false }))}
      />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-sans text-2xl font-bold tracking-tight text-[var(--sp-fg)]">
            Content Library
          </h1>
          <p className="font-mono text-sm text-[var(--sp-fg-light)] mt-1">
            {filteredItems.length}{" "}
            {filteredItems.length === 1 ? "topic" : "topics"} ·{" "}
            {totalGenerations} {totalGenerations === 1 ? "script" : "scripts"}
          </p>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--sp-fg-light)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics or content..."
            className="w-full h-10 pl-10 pr-4 bg-background dark:bg-[#121214] border border-foreground/5 dark:border-white/5 rounded-lg text-sm focus:outline-none focus:border-[var(--sp-fg)] dark:focus:border-white focus:ring-1 focus:ring-[var(--sp-fg)] dark:focus:ring-white transition-all"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-10 px-3 bg-background dark:bg-[#121214] border border-foreground/5 dark:border-white/5 rounded-lg text-sm focus:outline-none focus:border-[var(--sp-fg)] dark:focus:border-white"
        >
          <option value="all">All Status</option>
          <option value="ready">Ready</option>
          <option value="published">Published</option>
          <option value="processing">Processing</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>

        <div className="flex bg-background dark:bg-[#121214] border border-foreground/5 dark:border-white/5 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode("list")}
            className={`w-10 h-10 flex items-center justify-center ${viewMode === "list" ? "bg-[var(--sp-fg)] text-background" : "text-[var(--sp-fg-light)]"}`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`w-10 h-10 flex items-center justify-center ${viewMode === "grid" ? "bg-[var(--sp-fg)] text-background" : "text-[var(--sp-fg-light)]"}`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Empty state */}
      {filteredItems.length === 0 && (
        <div className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-16 text-center">
          <LibraryIcon className="w-10 h-10 text-[var(--sp-fg-light)]/30 mx-auto mb-4" />
          <h3 className="text-sm font-semibold text-[var(--sp-fg)] mb-1">
            {searchQuery || filterStatus !== "all"
              ? "No matching content"
              : "Your library is empty"}
          </h3>
          <p className="text-xs text-[var(--sp-fg-light)]">
            {searchQuery || filterStatus !== "all"
              ? "Try adjusting your search or filter."
              : "Approve generated content from the Create page to see it here."}
          </p>
        </div>
      )}

      {/* ─── LIST VIEW ─── */}
      {filteredItems.length > 0 && viewMode === "list" && (
        <div className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 divide-y divide-black/5 dark:divide-white/5">
          {filteredItems.map((topic) => {
            const isTopicExpanded = expandedTopics.has(topic.id);
            return (
              <div key={topic.id}>
                {/* Topic row */}
                <div
                  className="p-5 flex items-center gap-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => toggleTopic(topic.id)}
                >
                  {/* Chevron */}
                  <div className="w-5 h-5 flex items-center justify-center text-[var(--sp-fg-light)]">
                    {isTopicExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>

                  {/* Topic icon */}
                  <div className="w-10 h-10 rounded-lg bg-[var(--sp-bg)] flex items-center justify-center text-[var(--sp-fg-light)]">
                    <FileText className="w-4 h-4" />
                  </div>

                  {/* Title & meta */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold truncate">
                      {topic.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {topic.platforms.map((p) => (
                        <span
                          key={p}
                          className="inline-flex items-center gap-1 text-xs text-[var(--sp-fg-light)] bg-[var(--sp-bg)] px-2 py-0.5 rounded-full"
                        >
                          {platformIcon[p] || null}
                          <span className="capitalize">
                            {platformLabel[p] || p}
                          </span>
                        </span>
                      ))}
                      <span className="text-xs text-[var(--sp-fg-light)]">
                        · {topic.outputCount}{" "}
                        {topic.outputCount === 1 ? "script" : "scripts"}
                      </span>
                    </div>
                  </div>

                  {/* Right side */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-[var(--sp-fg-light)] flex items-center gap-1">
                      <Clock className="w-3 h-3" />{" "}
                      {formatDate(topic.createdAt)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBatch(topic.id, topic.title);
                      }}
                      disabled={deletingId === topic.id}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--sp-fg-light)] hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                      title="Delete batch"
                    >
                      {deletingId === topic.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded: nested generation rows */}
                {isTopicExpanded && (
                  <div className="border-t border-foreground/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
                    {topic.generations.map((gen) => {
                      const style =
                        statusStyles[gen.status] || statusStyles.draft;
                      const isGenExpanded = expandedGenId === gen.id;
                      const isPublishing = publishingGenId === gen.id;
                      const isPublished = gen.status === "published";

                      return (
                        <div
                          key={gen.id}
                          className="border-t border-foreground/5 dark:border-white/5 first:border-t-0"
                        >
                          <div
                            className="pl-14 pr-5 py-3.5 flex items-center gap-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                            onClick={() =>
                              setExpandedGenId(isGenExpanded ? null : gen.id)
                            }
                          >
                            {/* Platform icon */}
                            <div className="w-8 h-8 rounded-lg bg-[var(--sp-bg)] flex items-center justify-center text-[var(--sp-fg-light)]">
                              {platformIcon[gen.platform] || (
                                <FileText className="w-3.5 h-3.5" />
                              )}
                            </div>

                            {/* Platform name & type */}
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium capitalize">
                                {platformLabel[gen.platform] || gen.platform}
                              </span>
                              <span className="text-xs text-[var(--sp-fg-light)] ml-2">
                                {gen.outputType}
                              </span>
                            </div>

                            {/* Status & actions */}
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setStatusDropdownId(
                                      statusDropdownId === gen.id
                                        ? null
                                        : gen.id,
                                    );
                                  }}
                                  disabled={updatingStatusId === gen.id}
                                  className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full cursor-pointer hover:ring-1 hover:ring-current/20 transition-all ${style.bg} ${style.text}`}
                                >
                                  {updatingStatusId === gen.id
                                    ? "..."
                                    : gen.status}
                                </button>
                                {statusDropdownId === gen.id && (
                                  <div className="absolute right-0 top-full mt-1 z-20 bg-background dark:bg-[#1a1a1e] border border-foreground/10 dark:border-white/10 rounded-lg shadow-lg py-1 min-w-[120px]">
                                    {[
                                      "ready",
                                      "draft",
                                      "published",
                                      "archived",
                                    ].map((s) => {
                                      const sStyle =
                                        statusStyles[s] || statusStyles.draft;
                                      return (
                                        <button
                                          key={s}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleStatusChange(gen.id, s);
                                          }}
                                          className={`w-full text-left px-3 py-1.5 text-xs font-mono font-bold flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${gen.status === s ? "opacity-50 cursor-default" : ""}`}
                                          disabled={gen.status === s}
                                        >
                                          <span
                                            className={`w-1.5 h-1.5 rounded-full ${sStyle.text} bg-current`}
                                          />
                                          {s}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteGeneration(gen.id, topic.id);
                                }}
                                disabled={deletingId === gen.id}
                                className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--sp-fg-light)] hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                                title="Delete script"
                              >
                                {deletingId === gen.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3 h-3" />
                                )}
                              </button>
                              {isGenExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5 text-[var(--sp-fg-light)]" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-[var(--sp-fg-light)]" />
                              )}
                            </div>
                          </div>

                          {/* Expanded content preview */}
                          {isGenExpanded && (
                            <div className="pl-14 pr-5 pb-4 border-t border-foreground/5 dark:border-white/5">
                              <div className="pt-3">
                                <div className="text-sm border border-black/[0.03] dark:border-white/[0.03] bg-black/[0.02] dark:bg-white/[0.02] p-4 rounded-xl whitespace-pre-wrap font-sans leading-relaxed text-[var(--sp-fg)]/90 max-h-72 overflow-y-auto mb-3">
                                  {gen.content}
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setReaderState({
                                        isOpen: true,
                                        content: gen.content,
                                        title: topic.title,
                                        platform: gen.platform,
                                      });
                                    }}
                                    className="h-7 px-3 rounded flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-[var(--sp-fg-light)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                                  >
                                    <Maximize2 className="w-3 h-3" />
                                    Read
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopy(gen.content, gen.id);
                                    }}
                                    className="h-7 px-3 rounded flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-[var(--sp-fg-light)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                                  >
                                    {copiedGenId === gen.id ? (
                                      <Check className="w-3 h-3 text-[var(--sp-green)]" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                    {copiedGenId === gen.id ? "Copied" : "Copy"}
                                  </button>
                                  {!isPublished && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePublish(gen.id, gen.platform);
                                      }}
                                      disabled={isPublishing}
                                      className="h-7 px-3 rounded flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-[var(--sp-fg-light)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                                    >
                                      {isPublishing ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <Send className="w-3 h-3" />
                                      )}
                                      Publish
                                    </button>
                                  )}
                                  {isPublished && gen.publishedUrl && (
                                    <a
                                      href={gen.publishedUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="h-7 px-3 rounded flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      View post
                                    </a>
                                  )}
                                </div>
                                {publishResult?.genId === gen.id &&
                                  publishResult.url && (
                                    <div className="mt-2 flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                                      <Check className="w-3 h-3" />
                                      <span>Published!</span>
                                      <a
                                        href={publishResult.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline hover:no-underline"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        View post
                                      </a>
                                    </div>
                                  )}
                                {publishError?.genId === gen.id && (
                                  <div className="mt-2 text-xs text-red-500">
                                    {publishError.message}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── GRID VIEW ─── */}
      {filteredItems.length > 0 && viewMode === "grid" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          {filteredItems.map((topic) => {
            const isTopicExpanded = expandedTopics.has(topic.id);
            return (
              <div
                key={topic.id}
                className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-5 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => toggleTopic(topic.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--sp-bg)] flex items-center justify-center text-[var(--sp-fg-light)]">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {topic.platforms.map((p) => (
                      <span
                        key={p}
                        className="w-6 h-6 rounded-md bg-[var(--sp-bg)] flex items-center justify-center text-[var(--sp-fg-light)]"
                      >
                        {platformIcon[p] || null}
                      </span>
                    ))}
                  </div>
                </div>

                <h3 className="text-sm font-semibold mb-2 line-clamp-2">
                  {topic.title}
                </h3>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[var(--sp-fg-light)]">
                    {topic.outputCount}{" "}
                    {topic.outputCount === 1 ? "script" : "scripts"}
                  </span>
                  <span className="text-xs text-[var(--sp-fg-light)]">
                    {formatDate(topic.createdAt)}
                  </span>
                </div>

                <div className="flex items-center gap-1 mt-1 text-[var(--sp-fg-light)]">
                  <span className="text-xs">
                    {isTopicExpanded ? "Hide" : "Show"} scripts
                  </span>
                  {isTopicExpanded ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </div>

                {/* Expanded: show per-platform scripts */}
                {isTopicExpanded && (
                  <div
                    className="mt-3 pt-3 border-t border-foreground/5 dark:border-white/5 space-y-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {topic.generations.map((gen) => {
                      const style =
                        statusStyles[gen.status] || statusStyles.draft;
                      const isGenExpanded = expandedGenId === gen.id;
                      const isPublishing = publishingGenId === gen.id;
                      const isPublished = gen.status === "published";

                      return (
                        <div
                          key={gen.id}
                          className="rounded-lg border border-foreground/5 dark:border-white/5 overflow-hidden"
                        >
                          <div
                            className="px-3 py-2 flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                            onClick={() =>
                              setExpandedGenId(isGenExpanded ? null : gen.id)
                            }
                          >
                            <span className="text-[var(--sp-fg-light)]">
                              {platformIcon[gen.platform] || (
                                <FileText className="w-3 h-3" />
                              )}
                            </span>
                            <span className="text-xs font-medium capitalize flex-1">
                              {platformLabel[gen.platform] || gen.platform}
                            </span>
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setStatusDropdownId(
                                    statusDropdownId === gen.id ? null : gen.id,
                                  );
                                }}
                                disabled={updatingStatusId === gen.id}
                                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full cursor-pointer hover:ring-1 hover:ring-current/20 transition-all ${style.bg} ${style.text}`}
                              >
                                {updatingStatusId === gen.id
                                  ? "..."
                                  : gen.status}
                              </button>
                              {statusDropdownId === gen.id && (
                                <div className="absolute right-0 top-full mt-1 z-20 bg-background dark:bg-[#1a1a1e] border border-foreground/10 dark:border-white/10 rounded-lg shadow-lg py-1 min-w-[110px]">
                                  {[
                                    "ready",
                                    "draft",
                                    "published",
                                    "archived",
                                  ].map((s) => {
                                    const sStyle =
                                      statusStyles[s] || statusStyles.draft;
                                    return (
                                      <button
                                        key={s}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleStatusChange(gen.id, s);
                                        }}
                                        className={`w-full text-left px-3 py-1.5 text-[10px] font-mono font-bold flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${gen.status === s ? "opacity-50 cursor-default" : ""}`}
                                        disabled={gen.status === s}
                                      >
                                        <span
                                          className={`w-1.5 h-1.5 rounded-full ${sStyle.text} bg-current`}
                                        />
                                        {s}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteGeneration(gen.id, topic.id);
                              }}
                              disabled={deletingId === gen.id}
                              className="w-5 h-5 rounded-md flex items-center justify-center text-[var(--sp-fg-light)] hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                              title="Delete script"
                            >
                              {deletingId === gen.id ? (
                                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-2.5 h-2.5" />
                              )}
                            </button>
                          </div>

                          {isGenExpanded && (
                            <div className="px-3 pb-2 border-t border-foreground/5 dark:border-white/5">
                              <div className="text-sm border border-black/[0.03] dark:border-white/[0.03] bg-black/[0.02] dark:bg-white/[0.02] p-3 rounded-lg whitespace-pre-wrap font-sans leading-relaxed text-[var(--sp-fg)]/90 max-h-56 overflow-y-auto mt-2 mb-2">
                                {gen.content}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setReaderState({
                                      isOpen: true,
                                      content: gen.content,
                                      title: topic.title,
                                      platform: gen.platform,
                                    });
                                  }}
                                  className="h-6 px-2 rounded flex items-center justify-center gap-1 text-xs text-[var(--sp-fg-light)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                                  title="Expand to read"
                                >
                                  <Maximize2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopy(gen.content, gen.id);
                                  }}
                                  className="h-6 px-2 rounded flex items-center justify-center gap-1 text-xs text-[var(--sp-fg-light)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                                  title="Copy"
                                >
                                  {copiedGenId === gen.id ? (
                                    <Check className="w-3 h-3 text-[var(--sp-green)]" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                                {!isPublished && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePublish(gen.id, gen.platform);
                                    }}
                                    disabled={isPublishing}
                                    className="h-6 px-2 rounded flex items-center justify-center gap-1 text-xs text-[var(--sp-fg-light)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                                  >
                                    {isPublishing ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Send className="w-3 h-3" />
                                    )}
                                  </button>
                                )}
                                {isPublished && gen.publishedUrl && (
                                  <a
                                    href={gen.publishedUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="h-6 px-2 rounded flex items-center justify-center gap-1 text-xs text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                              {publishResult?.genId === gen.id &&
                                publishResult.url && (
                                  <div className="mt-1 flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                                    <Check className="w-3 h-3" />
                                    <span>Published!</span>
                                    <a
                                      href={publishResult.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="underline hover:no-underline"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      View post
                                    </a>
                                  </div>
                                )}
                              {publishError?.genId === gen.id && (
                                <div className="mt-1 text-xs text-red-500">
                                  {publishError.message}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

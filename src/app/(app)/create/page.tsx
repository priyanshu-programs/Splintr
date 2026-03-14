"use client";

import { useState, useEffect } from "react";
import {
  Upload,
  Link2,
  FileText,
  Video,
  ArrowRight,
  Loader2,
  Check,
  Copy,
  RefreshCw,
  Linkedin,
  Twitter,
  Instagram,
  Youtube,
  BookOpen,
  Play,
  AlertCircle,
  Send,
  ExternalLink,
} from "lucide-react";

/* ── tiny SVG icons for platforms without lucide icons ── */

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className || "w-5 h-5"} fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.75a8.18 8.18 0 004.76 1.52V6.84a4.84 4.84 0 01-1-.15z" />
    </svg>
  );
}

function ThreadsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className || "w-5 h-5"} fill="currentColor">
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.814.812c-1.04-3.706-3.572-5.587-7.524-5.59-2.591.007-4.576.87-5.896 2.564-1.19 1.525-1.818 3.783-1.843 6.66.024 2.874.654 5.13 1.843 6.66 1.32 1.693 3.305 2.554 5.9 2.56 2.17-.012 3.856-.527 5.01-1.53 1.285-1.116 1.94-2.707 1.94-4.724 0-1.564-.474-2.8-1.413-3.676-.718-.672-1.68-1.088-2.828-1.224a9.56 9.56 0 00.066 2.09c.287.396.457.863.457 1.37 0 .952-.444 1.79-1.136 2.33-.642.5-1.476.78-2.46.78-.75 0-1.37-.18-1.847-.536-.496-.37-.766-.907-.766-1.56 0-.726.356-1.32.97-1.71.556-.356 1.32-.534 2.258-.584l.012-.002c.468-.026.927.007 1.38.064.102-.57.148-1.186.128-1.844-.047-1.426-.577-2.52-1.578-3.25-.82-.597-1.866-.916-3.108-.94l-.07-.001c-1.64.032-2.93.607-3.845 1.716L3.95 9.385C5.283 7.82 7.153 7 9.576 6.968h.09c1.7.032 3.166.517 4.357 1.384 1.396 1.018 2.168 2.56 2.237 4.443.022.735-.04 1.43-.177 2.082 1.162.347 2.096.97 2.77 1.86.893 1.177 1.347 2.724 1.347 4.6 0 2.627-.913 4.767-2.715 6.363C15.84 23.364 13.58 24 12.186 24z" />
    </svg>
  );
}

function MetaIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className || "w-5 h-5"} fill="currentColor">
      <path d="M6.915 4.03c-1.968 0-3.202 1.14-4.157 2.81C1.532 8.803.715 11.49.715 13.71c0 2.04.918 3.54 2.93 3.54 1.563 0 2.863-1.06 4.168-3.04.876-1.33 1.66-2.95 2.31-4.53l.69-1.69c.63-1.53 1.38-3.19 2.38-4.39C14.493 2.1 16.023 1.3 17.753 1.3c2.16 0 3.79 1.07 4.85 2.83.93 1.54 1.4 3.5 1.4 5.73 0 2.4-.56 4.55-1.68 6.26-1.19 1.81-2.95 2.88-5.18 2.88-1.19 0-2.24-.37-3.07-1.05-.78-.63-1.36-1.52-1.72-2.57l-.49 1.2c-.42 1.02-.96 1.98-1.63 2.72-.92 1.02-2.07 1.7-3.49 1.7-2.01 0-3.57-.84-4.6-2.31C1.1 17.1.5 15.22.5 13.04c0-2.72.83-5.72 2.17-8.08C4.22 2.2 6.32.5 8.92.5c1.54 0 2.8.56 3.72 1.46.84.82 1.44 1.91 1.8 3.14l-.96 2.36c-.31-1.2-.81-2.18-1.5-2.86-.72-.71-1.62-1.07-2.7-1.07-.52 0-1.01.1-1.43.31l.06.14zm.12 1.66c-.34.5-.68 1.12-1.01 1.85l-.4.92c-.96 2.24-1.75 4.2-2.73 5.87-1.1 1.87-2.12 2.68-3.27 2.68-.86 0-1.46-.53-1.46-1.73 0-1.78.68-4.13 1.6-5.88.78-1.48 1.68-2.37 2.7-2.37.45 0 .83.16 1.13.45.27.26.47.6.6 1.01l.55-1.37c.2-.48.42-.92.66-1.3.57-.92 1.24-1.46 2.03-1.46.33 0 .6.1.78.29.14.15.22.35.22.6 0 .36-.17.79-.4 1.26l-.07.17z" />
    </svg>
  );
}
import { approveContent, publishContent, getConnectedPlatforms, type ConnectedPlatform } from "@/lib/content-store";
import Link from "next/link";

type InputMethod = "text" | "url" | "file";
type GenerationStatus = "idle" | "extracting" | "processing" | "done" | "error";

interface GeneratedOutput {
  platform: string;
  type: string;
  content: string;
  id?: string;
}

const targetPlatforms = [
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, types: ["Post", "Article"] },
  { id: "x", name: "X / Twitter", icon: Twitter, types: ["Post", "Thread"] },
  { id: "instagram", name: "Instagram", icon: Instagram, types: ["Caption", "Carousel"] },
  { id: "youtube", name: "YouTube", icon: Youtube, types: ["Script", "Post"] },
  { id: "tiktok", name: "TikTok", icon: TikTokIcon, types: ["Script", "Caption"] },
  { id: "threads", name: "Threads", icon: ThreadsIcon, types: ["Post", "Thread"] },
  { id: "meta", name: "Meta", icon: MetaIcon, types: ["Post", "Article"] },
  { id: "blog", name: "Blog", icon: BookOpen, types: ["Article"] },
];

const outputTypeMap: Record<string, string> = {
  linkedin: "Post",
  x: "Thread",
  instagram: "Caption",
  youtube: "Script",
  tiktok: "Script",
  threads: "Post",
  meta: "Post",
  blog: "Article",
};

// Derive a concise topic label from generated content (e.g., a LinkedIn post or caption)
function deriveTopicFromContent(generatedOutputs: GeneratedOutput[]): string {
  // Pick the first output that has content
  const output = generatedOutputs.find((o) => o.content.trim().length > 0);
  if (!output) return "";

  const text = output.content;

  // Clean: strip emojis, hashtags, markdown, special chars, leading numbers/bullets
  let cleaned = text
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FEFF}\u{1F900}-\u{1F9FF}]/gu, "") // emojis
    .replace(/#\w+/g, "")           // hashtags
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1") // bold/italic
    .replace(/^#{1,6}\s+/gm, "")    // markdown headings
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links
    .replace(/^[\d.\-•\s]+/gm, "")  // leading bullets/numbers
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "";

  // Grab the first sentence or clause
  const sentenceMatch = cleaned.match(/^(.+?)[.!?:,\n]/);
  let topic = sentenceMatch ? sentenceMatch[1].trim() : cleaned;

  // Take first 5 words max
  const words = topic.split(/\s+/);
  if (words.length > 5) {
    topic = words.slice(0, 5).join(" ");
  }

  // Clean up any trailing incomplete words or punctuation
  topic = topic.replace(/[^\w\s]$/g, "").trim();

  return topic || "";
}

// Check if a file is audio/video (needs transcription) vs document
function isAudioVideo(fileName: string): boolean {
  const audioVideoExts = [".mp3", ".wav", ".m4a", ".ogg", ".flac", ".mp4", ".mov", ".webm", ".mpeg"];
  return audioVideoExts.some((ext) => fileName.toLowerCase().endsWith(ext));
}

export default function CreateContentPage() {
  const [inputMethod, setInputMethod] = useState<InputMethod>("text");
  const [textContent, setTextContent] = useState("");
  const [urlContent, setUrlContent] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["linkedin", "x", "instagram"]);
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [outputs, setOutputs] = useState<GeneratedOutput[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [regeneratingPlatform, setRegeneratingPlatform] = useState<string | null>(null);
  const [currentBatchId, setCurrentBatchId] = useState<string>("");
  const [currentTopicTitle, setCurrentTopicTitle] = useState<string>("");

  // Approve / Publish state
  const [approvedPlatforms, setApprovedPlatforms] = useState<Set<string>>(new Set());
  const [approvingPlatform, setApprovingPlatform] = useState<string | null>(null);
  const [publishingPlatform, setPublishingPlatform] = useState<string | null>(null);
  const [publishedPlatforms, setPublishedPlatforms] = useState<Set<string>>(new Set());
  const [connectedPlatforms, setConnectedPlatforms] = useState<ConnectedPlatform[]>([]);
  const [cardMessages, setCardMessages] = useState<Record<string, { text: string; type: "success" | "error" }>>({});

  // Load connected platforms on mount
  useEffect(() => {
    getConnectedPlatforms().then(setConnectedPlatforms).catch(console.error);
  }, []);

  function togglePlatform(id: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  async function extractSourceContent(): Promise<{ content: string; title?: string; sourceType: string } | null> {
    if (inputMethod === "text") {
      return { content: textContent, sourceType: "text" };
    }

    if (inputMethod === "url") {
      setStatusMessage("Extracting content from URL...");
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlContent }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to extract content from URL");
      }
      return { content: data.content, title: data.title, sourceType: "url" };
    }

    if (inputMethod === "file" && uploadedFile) {
      const formData = new FormData();
      formData.append("file", uploadedFile);

      if (isAudioVideo(uploadedFile.name)) {
        // Audio/video → transcribe first
        setStatusMessage("Transcribing audio/video...");
        const res = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to transcribe file");
        }
        return {
          content: data.transcript,
          title: uploadedFile.name.replace(/\.[^.]+$/, ""),
          sourceType: uploadedFile.name.match(/\.(mp4|mov|webm)$/i) ? "video" : "audio",
        };
      } else {
        // Document → extract text
        setStatusMessage("Extracting text from document...");
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to extract text from file");
        }
        return {
          content: data.content,
          title: uploadedFile.name.replace(/\.[^.]+$/, ""),
          sourceType: "document",
        };
      }
    }

    return null;
  }

  async function handleGenerate() {
    setStatus("extracting");
    setErrorMessage("");
    setOutputs([]);
    setApprovedPlatforms(new Set());
    setPublishedPlatforms(new Set());

    // Generate a unique batch ID for this generation session
    const batchId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setCurrentBatchId(batchId);

    try {
      // Step 1: Extract source content
      const source = await extractSourceContent();
      if (!source) {
        throw new Error("No content to generate from");
      }

      // Step 2: Generate for all platforms
      setStatus("processing");
      setStatusMessage(`Generating content for ${selectedPlatforms.length} platform${selectedPlatforms.length > 1 ? "s" : ""}...`);

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceContent: source.content,
          sourceType: source.sourceType,
          sourceTitle: source.title,
          platforms: selectedPlatforms,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate content");
      }

      // Map results to output format
      const generatedOutputs: GeneratedOutput[] = Object.entries(data.results).map(
        ([platform, content]) => ({
          platform,
          type: outputTypeMap[platform] || "Post",
          content: content as string,
          id: data.generations?.find((g: { platform: string }) => g.platform === platform)?.id,
        })
      );

      // Store topic title: derive from generated content (reliable), or use AI-extracted
      const derivedTopic = deriveTopicFromContent(generatedOutputs);
      const aiTopic = data.topicTitle || "";
      // Use AI topic only if it's short, clean, and doesn't look like truncated source
      const useAiTopic = aiTopic && aiTopic.length < 60 && !source.content.startsWith(aiTopic.replace(/…$/, ""));
      const finalTopic = useAiTopic ? aiTopic : derivedTopic;
      if (finalTopic) {
        setCurrentTopicTitle(finalTopic);
      }

      setOutputs(generatedOutputs);
      setStatus("done");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      setErrorMessage(message);
      setStatus("error");
    }
  }

  async function handleRegenerate(platform: string) {
    setRegeneratingPlatform(platform);

    try {
      // Get current source content
      const source = inputMethod === "text"
        ? textContent
        : inputMethod === "url"
          ? urlContent
          : "";

      // If we have no cached source, just re-use what's in the existing output context
      // For simplicity, we re-call generate with just one platform
      const sourceContent = source || outputs.map((o) => o.content).join("\n\n");

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceContent,
          platforms: [platform],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to regenerate");
      }

      // Update the specific output
      setOutputs((prev) =>
        prev.map((o) =>
          o.platform === platform
            ? { ...o, content: data.results[platform] || o.content }
            : o
        )
      );

      // Reset approved/published state for this platform since content changed
      setApprovedPlatforms((prev) => {
        const next = new Set(prev);
        next.delete(platform);
        return next;
      });
      setPublishedPlatforms((prev) => {
        const next = new Set(prev);
        next.delete(platform);
        return next;
      });
    } catch (error) {
      console.error("Regen error:", error);
    } finally {
      setRegeneratingPlatform(null);
    }
  }

  function handleCopy(content: string, id: string) {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleApprove(output: GeneratedOutput) {
    setApprovingPlatform(output.platform);

    try {
      const sourceContent =
        inputMethod === "text" ? textContent : inputMethod === "url" ? urlContent : "";
      const title = currentTopicTitle || `Content - ${new Date().toLocaleDateString()}`;

      await approveContent({
        batchId: currentBatchId,
        title,
        sourceType: inputMethod === "file" ? "document" : inputMethod,
        sourceContent,
        platform: output.platform,
        outputType: output.type.toLowerCase(),
        generatedContent: output.content,
      });

      setApprovedPlatforms((prev) => new Set(prev).add(output.platform));
    } catch (error) {
      console.error("Approve error:", error);
    } finally {
      setApprovingPlatform(null);
    }
  }

  function setCardMessage(platform: string, text: string, type: "success" | "error", duration = 5000) {
    setCardMessages((prev) => ({ ...prev, [platform]: { text, type } }));
    setTimeout(() => {
      setCardMessages((prev) => {
        const next = { ...prev };
        delete next[platform];
        return next;
      });
    }, duration);
  }

  async function handlePublish(output: GeneratedOutput) {
    // Check if platform is connected
    const platformName = targetPlatforms.find((p) => p.id === output.platform)?.name || output.platform;
    const connection = connectedPlatforms.find(
      (cp) => cp.platform === output.platform && cp.connected
    );

    if (!connection) {
      setCardMessage(
        output.platform,
        `${platformName} is not connected. Go to Connect page to link your account.`,
        "error",
        8000
      );
      return;
    }

    setPublishingPlatform(output.platform);

    try {
      // First approve if not already
      if (!approvedPlatforms.has(output.platform)) {
        await handleApprove(output);
      }

      // Then mark as published
      const itemId = output.id || output.platform;
      await publishContent(itemId);

      setPublishedPlatforms((prev) => new Set(prev).add(output.platform));
      setCardMessage(output.platform, `Published to ${platformName}!`, "success", 3000);
    } catch (error) {
      console.error("Publish error:", error);
      setCardMessage(output.platform, "Failed to publish. Please try again.", "error");
    } finally {
      setPublishingPlatform(null);
    }
  }

  const isInputReady =
    (inputMethod === "text" && textContent.trim().length > 0) ||
    (inputMethod === "url" && urlContent.trim().length > 0) ||
    (inputMethod === "file" && uploadedFile !== null);

  const isProcessing = status === "extracting" || status === "processing";

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-sans text-2xl font-bold tracking-tight text-[var(--sp-fg)]">Create Content</h1>
        <p className="font-mono text-sm text-[var(--sp-fg-light)] mt-1">Feed source content and generate platform-optimized outputs</p>
      </div>

      {status !== "done" ? (
        <div className="space-y-6">
          {/* Input method tabs */}
          <div className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 overflow-hidden">
            <div className="flex border-b border-foreground/5 dark:border-white/5">
              {[
                { id: "text" as const, label: "Paste Text", icon: FileText },
                { id: "url" as const, label: "Import URL", icon: Link2 },
                { id: "file" as const, label: "Upload File", icon: Upload },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setInputMethod(tab.id)}
                  disabled={isProcessing}
                  className={`flex-1 h-12 flex items-center justify-center gap-2 font-mono text-xs font-extrabold tracking-[0.15em] uppercase transition-all ${
                    inputMethod === tab.id
                      ? "bg-[var(--sp-fg)] text-background"
                      : "text-[var(--sp-fg-light)] hover:text-[var(--sp-fg)] hover:bg-[var(--sp-bg)]"
                  } disabled:opacity-50`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {inputMethod === "text" && (
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Paste your blog post, article, transcript, or any source content here..."
                  rows={10}
                  disabled={isProcessing}
                  className="w-full px-4 py-3 bg-[var(--sp-bg)] border border-sp-fg/10 rounded-lg text-sm focus:outline-none focus:border-[var(--sp-fg)] focus:ring-1 focus:ring-[var(--sp-fg)] transition-all resize-none font-mono disabled:opacity-50"
                />
              )}

              {inputMethod === "url" && (
                <div className="space-y-3">
                  <input
                    type="url"
                    value={urlContent}
                    onChange={(e) => setUrlContent(e.target.value)}
                    placeholder="https://yourblog.com/article or YouTube/podcast URL"
                    disabled={isProcessing}
                    className="w-full h-12 px-4 bg-[var(--sp-bg)] border border-sp-fg/10 rounded-lg text-sm focus:outline-none focus:border-[var(--sp-fg)] focus:ring-1 focus:ring-[var(--sp-fg)] transition-all font-mono disabled:opacity-50"
                  />
                  <p className="text-xs text-[var(--sp-fg-light)]">
                    Supports blog URLs, article links, and web pages. Content will be automatically extracted.
                  </p>
                </div>
              )}

              {inputMethod === "file" && (
                <div className="relative border-2 border-dashed border-sp-fg/15 rounded-xl p-12 text-center hover:border-sp-fg/30 transition-colors">
                  {uploadedFile ? (
                    <>
                      <Check className="w-8 h-8 text-[var(--sp-green)] mx-auto mb-3" />
                      <p className="text-sm font-medium mb-1">{uploadedFile.name}</p>
                      <p className="text-xs text-[var(--sp-fg-light)]">
                        {(uploadedFile.size / 1024).toFixed(1)} KB — Click to replace
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-[var(--sp-fg-light)] mx-auto mb-3" />
                      <p className="text-sm font-medium mb-1">Drop files here or click to browse</p>
                      <p className="text-xs text-[var(--sp-fg-light)]">
                        Documents: .txt, .md, .docx, .pdf | Audio/Video: .mp3, .wav, .mp4, .mov, .webm
                      </p>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".txt,.md,.docx,.pdf,.mp3,.wav,.m4a,.ogg,.flac,.mp4,.mov,.webm"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setUploadedFile(file);
                    }}
                    disabled={isProcessing}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Platform selection */}
          <div className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-6">
            <h3 className="font-semibold mb-1 text-[var(--sp-fg)]">Target Platforms</h3>
            <p className="text-xs text-[var(--sp-fg-light)] mb-4">Select which platforms to generate content for</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {targetPlatforms.map((p) => {
                const selected = selectedPlatforms.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePlatform(p.id)}
                    disabled={isProcessing}
                    className={`p-4 rounded-xl border text-left transition-all flex items-center gap-3 ${
                      selected
                        ? "border-[var(--sp-fg)] bg-sp-fg/5"
                        : "border-sp-fg/10 hover:border-sp-fg/30"
                    } disabled:opacity-50`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selected ? "bg-[var(--sp-fg)] text-background" : "bg-[var(--sp-bg)] text-[var(--sp-fg-light)]"}`}>
                      <p.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{p.name}</div>
                      <div className="text-xs text-[var(--sp-fg-light)]">{p.types.join(", ")}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error message */}
          {status === "error" && errorMessage && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Generation Failed</p>
                <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={isProcessing || !isInputReady || selectedPlatforms.length === 0}
            className="w-full h-14 bg-[var(--sp-fg)] text-background rounded-xl font-mono text-sm font-extrabold tracking-[0.15em] uppercase flex items-center justify-center gap-2 hover:bg-foreground transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {statusMessage || "Processing..."}
              </>
            ) : (
              <>
                Generate Content <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      ) : (
        /* Results view */
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-full bg-sp-green/10 flex items-center justify-center">
                <Check className="w-3 h-3 text-[var(--sp-green)]" />
              </div>
              <span className="text-sm font-bold text-[var(--sp-green)]">Generation Complete</span>
            </div>
            <p className="text-xs text-[var(--sp-fg-light)]">{outputs.length} outputs generated — approve to save to your library</p>
          </div>



          <div className="grid md:grid-cols-2 gap-4">
            {outputs.map((output, i) => {
              const platform = targetPlatforms.find((p) => p.id === output.platform);
              const Icon = platform?.icon || FileText;
              const isRegenerating = regeneratingPlatform === output.platform;
              const isApproved = approvedPlatforms.has(output.platform);
              const isApproving = approvingPlatform === output.platform;
              const isPublished = publishedPlatforms.has(output.platform);
              const isPublishing = publishingPlatform === output.platform;
              return (
                <div key={i} className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-foreground/5 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[var(--sp-bg)] flex items-center justify-center text-[var(--sp-fg-light)]">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold">{platform?.name}</span>
                        <span className="text-xs text-[var(--sp-fg-light)] ml-2">{output.type}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleCopy(output.content, `${i}`)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--sp-fg-light)] hover:bg-[var(--sp-bg)] transition-colors"
                        title="Copy to clipboard"
                      >
                        {copiedId === `${i}` ? <Check className="w-3.5 h-3.5 text-[var(--sp-green)]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    {isRegenerating ? (
                      <div className="flex items-center justify-center h-32 text-[var(--sp-fg-light)]">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        <span className="text-sm font-mono">Regenerating...</span>
                      </div>
                    ) : (
                      <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed text-[var(--sp-fg-mid)] max-h-48 overflow-y-auto">
                        {output.content}
                      </pre>
                    )}
                  </div>
                  {/* Per-card inline message */}
                  {cardMessages[output.platform] && (
                    <div className={`mx-4 mb-3 flex items-center gap-2 p-3 rounded-lg text-xs font-medium ${
                      cardMessages[output.platform].type === "success"
                        ? "bg-sp-green/5 border border-sp-green/20 text-[var(--sp-green)]"
                        : "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400"
                    }`}>
                      {cardMessages[output.platform].type === "success" ? (
                        <Check className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span className="flex-1">{cardMessages[output.platform].text}</span>
                      {cardMessages[output.platform].type === "error" && (
                        <Link href="/setup" className="font-mono font-extrabold tracking-[0.15em] uppercase underline underline-offset-2 hover:opacity-80 shrink-0">
                          Connect
                        </Link>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2 p-4 pt-0">
                    {/* Approve button */}
                    <button
                      onClick={() => handleApprove(output)}
                      disabled={isApproved || isApproving}
                      className={`flex-1 h-9 rounded-lg font-mono text-xs font-extrabold tracking-[0.15em] uppercase flex items-center justify-center gap-1 transition-colors ${
                        isApproved
                          ? "bg-sp-green/10 text-[var(--sp-green)] border border-sp-green/20 cursor-default"
                          : "bg-[var(--sp-fg)] text-background hover:bg-foreground"
                      } disabled:opacity-70`}
                    >
                      {isApproving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      {isApproved ? "Approved" : isApproving ? "Saving..." : "Approve"}
                    </button>

                    {/* Publish button */}
                    <button
                      onClick={() => handlePublish(output)}
                      disabled={isPublished || isPublishing}
                      className={`h-9 px-3 rounded-lg font-mono text-xs font-extrabold tracking-[0.15em] uppercase flex items-center justify-center gap-1 transition-colors ${
                        isPublished
                          ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30 cursor-default"
                          : "border border-sp-fg/10 text-[var(--sp-fg-light)] hover:bg-[var(--sp-bg)] hover:text-[var(--sp-fg)]"
                      } disabled:opacity-70`}
                      title={isPublished ? "Published" : "Publish to platform"}
                    >
                      {isPublishing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isPublished ? (
                        <ExternalLink className="w-3.5 h-3.5" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      {isPublished ? "Published" : "Publish"}
                    </button>

                    {/* Regenerate button */}
                    <button
                      onClick={() => handleRegenerate(output.platform)}
                      disabled={isRegenerating}
                      className="h-9 px-3 border border-sp-fg/10 rounded-lg font-mono text-xs font-extrabold tracking-[0.15em] uppercase text-[var(--sp-fg-light)] flex items-center justify-center gap-1 hover:bg-[var(--sp-bg)] transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin" : ""}`} /> New
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

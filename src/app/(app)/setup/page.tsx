"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import gsap from "gsap";
import { useSearchParams } from "next/navigation";
import {
  Linkedin,
  Twitter,
  Instagram,
  Youtube,
  BookOpen,
  Check,
  ExternalLink,
  Link2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  getConnections,
  connectPlatform,
  disconnectPlatform,
  consumeOAuthResult,
  type PlatformConnection,
} from "@/lib/connections-store";

/* ── platform registry ── */

type PlatformMeta = {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
};

const PLATFORM_META: PlatformMeta[] = [
  { id: "linkedin", name: "LinkedIn", icon: Linkedin },
  { id: "x", name: "X / Twitter", icon: Twitter },
  { id: "instagram", name: "Instagram", icon: Instagram },
  { id: "youtube", name: "YouTube", icon: Youtube },
  { id: "tiktok", name: "TikTok", icon: () => <TikTokIcon /> },
  { id: "threads", name: "Threads", icon: () => <ThreadsIcon /> },
  { id: "bluesky", name: "Bluesky", icon: () => <BlueskyIcon /> },
  { id: "blog", name: "Blog (WordPress)", icon: BookOpen },
];

/* ── tiny SVG icons for platforms without lucide icons ── */

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.75a8.18 8.18 0 004.76 1.52V6.84a4.84 4.84 0 01-1-.15z" />
    </svg>
  );
}

function ThreadsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.814.812c-1.04-3.706-3.572-5.587-7.524-5.59-2.591.007-4.576.87-5.896 2.564-1.19 1.525-1.818 3.783-1.843 6.66.024 2.874.654 5.13 1.843 6.66 1.32 1.693 3.305 2.554 5.9 2.56 2.17-.012 3.856-.527 5.01-1.53 1.285-1.116 1.94-2.707 1.94-4.724 0-1.564-.474-2.8-1.413-3.676-.718-.672-1.68-1.088-2.828-1.224a9.56 9.56 0 00.066 2.09c.287.396.457.863.457 1.37 0 .952-.444 1.79-1.136 2.33-.642.5-1.476.78-2.46.78-.75 0-1.37-.18-1.847-.536-.496-.37-.766-.907-.766-1.56 0-.726.356-1.32.97-1.71.556-.356 1.32-.534 2.258-.584l.012-.002c.468-.026.927.007 1.38.064.102-.57.148-1.186.128-1.844-.047-1.426-.577-2.52-1.578-3.25-.82-.597-1.866-.916-3.108-.94l-.07-.001c-1.64.032-2.93.607-3.845 1.716L3.95 9.385C5.283 7.82 7.153 7 9.576 6.968h.09c1.7.032 3.166.517 4.357 1.384 1.396 1.018 2.168 2.56 2.237 4.443.022.735-.04 1.43-.177 2.082 1.162.347 2.096.97 2.77 1.86.893 1.177 1.347 2.724 1.347 4.6 0 2.627-.913 4.767-2.715 6.363C15.84 23.364 13.58 24 12.186 24z" />
    </svg>
  );
}

function BlueskyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.785 2.627 3.6 3.476 6.158 3.228-4.41.68-5.784 2.852-3.249 5.024C6.886 21.27 11.35 21.418 12 15.9c.65 5.518 5.114 5.37 8.467 2.599 2.535-2.172 1.161-4.344-3.25-5.024 2.559.248 5.374-.601 6.159-3.228.246-.828.624-5.79.624-6.479 0-.688-.139-1.86-.902-2.203-.66-.3-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z" />
    </svg>
  );
}

/* ── connect info modal ── */

function ConnectInfoModal({
  platformName,
  platformId,
  message,
  onClose,
}: {
  platformName: string;
  platformId: string;
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-background dark:bg-[#121214] border border-foreground/5 dark:border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--sp-fg)] text-background">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-[var(--sp-fg)]">Connect {platformName}</h3>
            <p className="text-xs text-[var(--sp-fg-light)]">OAuth integration</p>
          </div>
        </div>

        <div className="bg-[var(--sp-bg)] dark:bg-white/5 rounded-xl p-5 mb-6 border border-foreground/5 dark:border-white/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[var(--sp-fg)] mb-1">API Credentials Required</p>
              <p className="text-xs text-[var(--sp-fg-light)] leading-relaxed">
                {message}
              </p>
              <p className="text-xs text-[var(--sp-fg-light)] leading-relaxed mt-2">
                Add <code className="bg-foreground/5 dark:bg-white/10 px-1 py-0.5 rounded text-[10px]">
                  {platformId.toUpperCase()}_CLIENT_ID
                </code> and <code className="bg-foreground/5 dark:bg-white/10 px-1 py-0.5 rounded text-[10px]">
                  {platformId.toUpperCase()}_CLIENT_SECRET
                </code> to your <code className="bg-foreground/5 dark:bg-white/10 px-1 py-0.5 rounded text-[10px]">.env.local</code> file.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="h-10 px-5 border border-foreground/10 dark:border-white/10 rounded-lg text-sm font-medium text-[var(--sp-fg-light)] hover:bg-[var(--sp-bg)] dark:hover:bg-white/5 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── toast ── */

function Toast({
  message,
  type,
  onDismiss,
}: {
  message: string;
  type: "success" | "error";
  onDismiss: () => void;
}) {
  const toastRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      gsap.from(toastRef.current, {
        y: 25,
        opacity: 0,
        scale: 0.9,
        duration: 0.4,
        ease: "power3.out",
      });
    });

    const timer = setTimeout(() => {
      gsap.to(toastRef.current, {
        y: 15,
        opacity: 0,
        scale: 0.9,
        duration: 0.3,
        ease: "power2.in",
        onComplete: onDismiss,
      });
    }, 3500);

    return () => {
      clearTimeout(timer);
      ctx.revert();
    };
  }, [onDismiss]);

  return (
    <div
      ref={toastRef}
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl border backdrop-blur-xl text-sm font-medium ${
        type === "success"
          ? "bg-[#111111]/90 border-white/10 text-white"
          : "bg-[#111111]/90 border-red-500/20 text-red-400"
      }`}
    >
      <div className={`flex items-center justify-center w-6 h-6 rounded-full shrink-0 ${
        type === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-500"
      }`}>
        {type === "success" ? (
          <Check className="w-3.5 h-3.5" strokeWidth={3} />
        ) : (
          <AlertCircle className="w-3.5 h-3.5" strokeWidth={3} />
        )}
      </div>
      <p className="tracking-tight">{message}</p>
      <div className="w-px h-4 bg-white/15 mx-1" />
      <button
        onClick={() => {
          gsap.to(toastRef.current, {
            y: 15,
            opacity: 0,
            scale: 0.9,
            duration: 0.3,
            ease: "power2.in",
            onComplete: onDismiss,
          });
        }}
        className="opacity-50 hover:opacity-100 transition-opacity shrink-0"
      >
        <span className="sr-only">Close</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

/* ── skeleton ── */

function PlatformSkeleton() {
  return (
    <div className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-5 flex items-center gap-4 animate-pulse">
      <div className="w-11 h-11 rounded-xl bg-foreground/5 dark:bg-white/5 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-24 rounded bg-foreground/5 dark:bg-white/5" />
        <div className="h-3 w-16 rounded bg-foreground/5 dark:bg-white/5" />
      </div>
      <div className="h-8 w-20 rounded-lg bg-foreground/5 dark:bg-white/5" />
    </div>
  );
}

/* ── page ── */

export default function SetupPage() {
  const searchParams = useSearchParams();

  const [connections, setConnections] = useState<PlatformConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [modalInfo, setModalInfo] = useState<{ platformName: string; platformId: string; message: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Load connections on mount
  const loadConnections = useCallback(async () => {
    try {
      const data = await getConnections();
      setConnections(data);
    } catch (err) {
      console.error("Failed to load connections:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  // Handle URL params (from OAuth callback)
  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");

    if (connected) {
      // Consume OAuth result cookie (mock mode: persists token data to localStorage)
      consumeOAuthResult();
      loadConnections();
      setToast({ message: `Successfully connected ${connected}!`, type: "success" });
      // Clean URL
      window.history.replaceState({}, "", "/setup");
    }
    if (error) {
      const msg = error === "missing_params"
        ? "OAuth callback missing required parameters."
        : `Connection failed: ${decodeURIComponent(error)}`;
      setToast({ message: msg, type: "error" });
      window.history.replaceState({}, "", "/setup");
    }
  }, [searchParams]);

  const connectedCount = connections.filter((c) => c.isActive).length;

  // Handle connect button click
  async function handleConnect(platformId: string) {
    setActionLoading(platformId);
    try {
      const res = await fetch(`/api/connect/${platformId}`);
      const data = await res.json();

      if (!res.ok || !data.configured) {
        // OAuth not configured — show info modal
        const meta = PLATFORM_META.find((p) => p.id === platformId);
        setModalInfo({
          platformName: meta?.name || platformId,
          platformId,
          message: data.message || data.error || `OAuth for ${platformId} is not configured yet.`,
        });

        // In mock mode, still connect the platform locally for demo purposes
        await connectPlatform(platformId, `@${platformId}_user`);
        await loadConnections();
        return;
      }

      // If configured, redirect to OAuth URL
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Connect failed:", err);
      setToast({ message: "Failed to initiate connection. Please try again.", type: "error" });
    } finally {
      setActionLoading(null);
    }
  }

  // Handle disconnect button click
  async function handleDisconnect(platformId: string) {
    setActionLoading(platformId);
    try {
      await disconnectPlatform(platformId);
      await loadConnections();
      const meta = PLATFORM_META.find((p) => p.id === platformId);
      setToast({ message: `${meta?.name || platformId} disconnected.`, type: "error" });
    } catch (err) {
      console.error("Disconnect failed:", err);
      setToast({ message: "Failed to disconnect. Please try again.", type: "error" });
    } finally {
      setActionLoading(null);
    }
  }

  // Merge connection data with platform meta
  function getConnectionForPlatform(platformId: string): PlatformConnection | undefined {
    return connections.find((c) => c.platform === platformId);
  }

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}

      {modalInfo && (
        <ConnectInfoModal
          platformName={modalInfo.platformName}
          platformId={modalInfo.platformId}
          message={modalInfo.message}
          onClose={() => setModalInfo(null)}
        />
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-sans text-2xl font-bold tracking-tight text-[var(--sp-fg)]">Connect</h1>
          <p className="font-mono text-sm text-[var(--sp-fg-light)] mt-1">
            Connect your platforms to syndicate content directly
          </p>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-6 mb-6">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-[var(--sp-fg-light)]" />
            <span className="font-mono text-xs text-[var(--sp-fg-light)]">
              <span className="font-bold text-[var(--sp-fg)]">{loading ? "-" : connectedCount}</span> / {PLATFORM_META.length} connected
            </span>
          </div>
        </div>

        {/* Platforms grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <PlatformSkeleton key={i} />)
            : PLATFORM_META.map((meta) => {
              const conn = getConnectionForPlatform(meta.id);
              const isConnected = conn?.isActive ?? false;
              const isLoading = actionLoading === meta.id;
              const Icon = meta.icon;

              return (
                <div
                  key={meta.id}
                  className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-5 flex items-center gap-4 transition-all hover:border-foreground/10 dark:hover:border-white/10"
                >
                  {/* Icon */}
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-foreground/10 dark:border-white/10 ${isConnected
                        ? "bg-[var(--sp-fg)] text-background"
                        : "bg-[var(--sp-bg)] dark:bg-white/5 text-[var(--sp-fg-light)]"
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[var(--sp-fg)]">{meta.name}</div>
                    {isConnected && conn?.platformUsername && (
                      <div className="text-xs text-[var(--sp-fg-light)]">{conn.platformUsername}</div>
                    )}
                  </div>

                  {/* Action */}
                  {isConnected ? (
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-[var(--sp-green)] flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Connected
                      </span>
                      <button
                        onClick={() => handleDisconnect(meta.id)}
                        disabled={isLoading}
                        className="h-8 px-3 border border-red-200 dark:border-red-900/40 text-red-500 rounded-lg text-xs font-medium hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-50"
                      >
                        {isLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          "Disconnect"
                        )}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleConnect(meta.id)}
                      disabled={isLoading}
                      className="h-8 px-4 rounded-lg text-xs font-medium text-background bg-[var(--sp-fg)] transition-colors hover:opacity-90 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-background" />
                      ) : (
                        "Connect"
                      )}
                    </button>
                  )}
                </div>
              );
            })}
        </div>

        {/* Help section */}
        <div className="mt-8 bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-6">
          <div className="flex items-start gap-3">
            <ExternalLink className="w-5 h-5 text-[var(--sp-fg-light)] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-[var(--sp-fg)] mb-1">Need help connecting?</h3>
              <p className="text-xs text-[var(--sp-fg-light)] leading-relaxed">
                Each platform requires OAuth authorization. Once connected, Splintr can publish
                content directly to your accounts. Check the documentation for step-by-step guides.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

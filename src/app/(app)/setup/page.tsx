"use client";

import { useState } from "react";
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
} from "lucide-react";

/* ── platform registry ── */

type Platform = {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  connected: boolean;
  username: string | null;
};

const initialPlatforms: Platform[] = [
  { id: "linkedin",  name: "LinkedIn",          icon: Linkedin,  connected: true,  username: "@johndoe" },
  { id: "x",         name: "X / Twitter",       icon: Twitter,   connected: true,  username: "@johndoe_x" },
  { id: "instagram", name: "Instagram",         icon: Instagram, connected: false, username: null },
  { id: "youtube",   name: "YouTube",           icon: Youtube,   connected: false, username: null },
  { id: "tiktok",    name: "TikTok",            icon: () => <TikTokIcon />, connected: false, username: null },
  { id: "threads",   name: "Threads",           icon: () => <ThreadsIcon />, connected: false, username: null },
  { id: "meta",      name: "Meta",              icon: () => <MetaIcon />, connected: false, username: null },
  { id: "blog",      name: "Blog (WordPress)",  icon: BookOpen,  connected: false, username: null },
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

function MetaIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M6.915 4.03c-1.968 0-3.202 1.14-4.157 2.81C1.532 8.803.715 11.49.715 13.71c0 2.04.918 3.54 2.93 3.54 1.563 0 2.863-1.06 4.168-3.04.876-1.33 1.66-2.95 2.31-4.53l.69-1.69c.63-1.53 1.38-3.19 2.38-4.39C14.493 2.1 16.023 1.3 17.753 1.3c2.16 0 3.79 1.07 4.85 2.83.93 1.54 1.4 3.5 1.4 5.73 0 2.4-.56 4.55-1.68 6.26-1.19 1.81-2.95 2.88-5.18 2.88-1.19 0-2.24-.37-3.07-1.05-.78-.63-1.36-1.52-1.72-2.57l-.49 1.2c-.42 1.02-.96 1.98-1.63 2.72-.92 1.02-2.07 1.7-3.49 1.7-2.01 0-3.57-.84-4.6-2.31C1.1 17.1.5 15.22.5 13.04c0-2.72.83-5.72 2.17-8.08C4.22 2.2 6.32.5 8.92.5c1.54 0 2.8.56 3.72 1.46.84.82 1.44 1.91 1.8 3.14l-.96 2.36c-.31-1.2-.81-2.18-1.5-2.86-.72-.71-1.62-1.07-2.7-1.07-.52 0-1.01.1-1.43.31l.06.14zm.12 1.66c-.34.5-.68 1.12-1.01 1.85l-.4.92c-.96 2.24-1.75 4.2-2.73 5.87-1.1 1.87-2.12 2.68-3.27 2.68-.86 0-1.46-.53-1.46-1.73 0-1.78.68-4.13 1.6-5.88.78-1.48 1.68-2.37 2.7-2.37.45 0 .83.16 1.13.45.27.26.47.6.6 1.01l.55-1.37c.2-.48.42-.92.66-1.3.57-.92 1.24-1.46 2.03-1.46.33 0 .6.1.78.29.14.15.22.35.22.6 0 .36-.17.79-.4 1.26l-.07.17z" />
    </svg>
  );
}

/* ── connect modal ── */

function ConnectModal({ platform, onClose }: { platform: Platform; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-background dark:bg-[#121214] border border-foreground/5 dark:border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--sp-fg)] text-background"
          >
            <platform.icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-[var(--sp-fg)]">Connect {platform.name}</h3>
            <p className="text-xs text-[var(--sp-fg-light)]">OAuth integration</p>
          </div>
        </div>

        <div className="bg-[var(--sp-bg)] dark:bg-white/5 rounded-xl p-5 mb-6 border border-foreground/5 dark:border-white/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[var(--sp-fg)] mb-1">Coming Soon</p>
              <p className="text-xs text-[var(--sp-fg-light)] leading-relaxed">
                Direct OAuth connection to {platform.name} is under development. Once enabled, you&apos;ll be able to
                authorize Splintr to publish content directly to your {platform.name} account.
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

/* ── page ── */

export default function SetupPage() {
  const [platforms, setPlatforms] = useState(initialPlatforms);
  const [connectingPlatform, setConnectingPlatform] = useState<Platform | null>(null);

  const connectedCount = platforms.filter((p) => p.connected).length;

  function handleDisconnect(id: string) {
    setPlatforms((prev) =>
      prev.map((p) => (p.id === id ? { ...p, connected: false, username: null } : p))
    );
  }

  return (
    <>
      {connectingPlatform && (
        <ConnectModal
          platform={connectingPlatform}
          onClose={() => setConnectingPlatform(null)}
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
              <span className="font-bold text-[var(--sp-fg)]">{connectedCount}</span> / {platforms.length} connected
            </span>
          </div>
        </div>

        {/* Platforms grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {platforms.map((platform) => (
            <div
              key={platform.id}
              className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-5 flex items-center gap-4 transition-all hover:border-foreground/10 dark:hover:border-white/10"
            >
              {/* Icon */}
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-foreground/10 dark:border-white/10 ${
                  platform.connected 
                    ? "bg-[var(--sp-fg)] text-background" 
                    : "bg-[var(--sp-bg)] dark:bg-white/5 text-[var(--sp-fg-light)]"
                }`}
              >
                <platform.icon className="w-5 h-5" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-[var(--sp-fg)]">{platform.name}</div>
                {platform.connected && platform.username && (
                  <div className="text-xs text-[var(--sp-fg-light)]">{platform.username}</div>
                )}
              </div>

              {/* Action */}
              {platform.connected ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-[var(--sp-green)] flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Connected
                  </span>
                  <button
                    onClick={() => handleDisconnect(platform.id)}
                    className="h-8 px-3 border border-red-200 dark:border-red-900/40 text-red-500 rounded-lg text-xs font-medium hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConnectingPlatform(platform)}
                  className="h-8 px-4 rounded-lg text-xs font-medium text-background bg-[var(--sp-fg)] transition-colors hover:opacity-90"
                >
                  Connect
                </button>
              )}
            </div>
          ))}
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

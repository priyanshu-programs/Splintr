"use client";

import { useState } from "react";
import {
  Key,
  Copy,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Webhook,
  Check,
  AlertCircle,
  Activity,
  Clock,
  RotateCcw,
} from "lucide-react";

/* ── mock data ── */

type ApiKey = {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string | null;
  status: "active" | "revoked";
};

type WebhookEndpoint = {
  id: string;
  url: string;
  events: string[];
  status: "active" | "inactive";
  lastTriggered: string | null;
};

const initialApiKeys: ApiKey[] = [
  {
    id: "1",
    name: "Production Key",
    key: "sk_live_splintr_8f2a4b6c9d1e3f5a7b8c9d0e1f2a3b4c",
    createdAt: "Feb 15, 2026",
    lastUsed: "2 hours ago",
    status: "active",
  },
  {
    id: "2",
    name: "Staging Key",
    key: "sk_test_splintr_1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d",
    createdAt: "Jan 22, 2026",
    lastUsed: "3 days ago",
    status: "active",
  },
  {
    id: "3",
    name: "Old Integration",
    key: "sk_live_splintr_0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c",
    createdAt: "Dec 10, 2025",
    lastUsed: null,
    status: "revoked",
  },
];

const initialWebhooks: WebhookEndpoint[] = [
  {
    id: "1",
    url: "https://api.myapp.com/webhooks/splintr",
    events: ["generation.completed", "content.published"],
    status: "active",
    lastTriggered: "1 hour ago",
  },
  {
    id: "2",
    url: "https://hooks.slack.com/services/T0ABC/B0DEF",
    events: ["content.scheduled"],
    status: "active",
    lastTriggered: "5 days ago",
  },
];

const availableEvents = [
  { id: "generation.completed", label: "Generation Completed", desc: "Fires when AI content generation finishes" },
  { id: "content.published", label: "Content Published", desc: "Fires when content is published to a platform" },
  { id: "content.scheduled", label: "Content Scheduled", desc: "Fires when content is scheduled for future publishing" },
];

/* ── page ── */

export default function ApiAccessPage() {
  const [apiKeys, setApiKeys] = useState(initialApiKeys);
  const [webhooks] = useState(initialWebhooks);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");

  function toggleKeyVisibility(id: string) {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function maskKey(key: string) {
    return key.slice(0, 12) + "•".repeat(20) + key.slice(-4);
  }

  function handleCopy(id: string, key: string) {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleRevoke(id: string) {
    setApiKeys((prev) =>
      prev.map((k) => (k.id === id ? { ...k, status: "revoked" as const } : k))
    );
  }

  function handleCreateKey() {
    if (!newKeyName.trim()) return;
    const newKey: ApiKey = {
      id: String(Date.now()),
      name: newKeyName.trim(),
      key: `sk_live_splintr_${Array.from({ length: 32 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("")}`,
      createdAt: "Just now",
      lastUsed: null,
      status: "active",
    };
    setApiKeys((prev) => [newKey, ...prev]);
    setNewKeyName("");
    setShowNewKeyModal(false);
  }

  const activeKeysCount = apiKeys.filter((k) => k.status === "active").length;
  const activeWebhooksCount = webhooks.filter((w) => w.status === "active").length;

  return (
    <>
      {/* New key modal */}
      {showNewKeyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNewKeyModal(false)} />
          <div className="relative w-full max-w-md bg-background dark:bg-[#121214] border border-foreground/5 dark:border-white/10 rounded-2xl p-8 shadow-2xl">
            <h3 className="font-semibold text-lg text-[var(--sp-fg)] mb-1">Generate New API Key</h3>
            <p className="text-xs text-[var(--sp-fg-light)] mb-6">
              Give your key a descriptive name so you can identify it later.
            </p>
            <label className="block font-mono text-xs font-bold tracking-wider text-[var(--sp-fg-light)] mb-2 uppercase">
              Key Name
            </label>
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="e.g. Production API Key"
              className="w-full h-11 px-4 bg-[var(--sp-bg)] dark:bg-white/5 border border-foreground/10 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:border-[var(--sp-fg)] dark:focus:border-white/30 focus:ring-1 focus:ring-[var(--sp-fg)] dark:focus:ring-white/20 transition-all text-[var(--sp-fg)]"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleCreateKey()}
            />

            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4 mt-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                  Your API key will only be shown once. Make sure to copy it immediately after creation.
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowNewKeyModal(false)}
                className="h-10 px-5 border border-foreground/10 dark:border-white/10 rounded-lg text-sm font-medium text-[var(--sp-fg-light)] hover:bg-[var(--sp-bg)] dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateKey}
                disabled={!newKeyName.trim()}
                className="h-10 px-5 bg-[var(--sp-fg)] text-background rounded-lg text-sm font-medium hover:bg-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Generate Key
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-sans text-2xl font-bold tracking-tight text-[var(--sp-fg)]">API Access</h1>
          <p className="font-mono text-sm text-[var(--sp-fg-light)] mt-1">
            Manage API keys and webhook endpoints for programmatic access
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Key className="w-4 h-4 text-[var(--sp-fg-light)]" />
              <span className="font-mono text-xs text-[var(--sp-fg-light)]">Active Keys</span>
            </div>
            <div className="text-2xl font-bold text-[var(--sp-fg)]">{activeKeysCount}</div>
          </div>
          <div className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Webhook className="w-4 h-4 text-[var(--sp-fg-light)]" />
              <span className="font-mono text-xs text-[var(--sp-fg-light)]">Webhooks</span>
            </div>
            <div className="text-2xl font-bold text-[var(--sp-fg)]">{activeWebhooksCount}</div>
          </div>
          <div className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-[var(--sp-fg-light)]" />
              <span className="font-mono text-xs text-[var(--sp-fg-light)]">API Calls (Month)</span>
            </div>
            <div className="text-2xl font-bold text-[var(--sp-fg)]">1,247</div>
          </div>
        </div>

        {/* API Keys */}
        <div className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 mb-6">
          <div className="p-6 border-b border-foreground/5 dark:border-white/5 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[var(--sp-fg)]">API Keys</h3>
              <p className="text-xs text-[var(--sp-fg-light)]">
                Use API keys to authenticate requests to the Splintr API
              </p>
            </div>
            <button
              onClick={() => setShowNewKeyModal(true)}
              className="h-9 px-4 bg-[var(--sp-fg)] text-background rounded-lg font-mono text-xs font-extrabold tracking-[0.1em] uppercase flex items-center gap-2 hover:bg-foreground transition-colors"
            >
              <Plus className="w-4 h-4" /> New Key
            </button>
          </div>

          <div className="divide-y divide-foreground/5 dark:divide-white/5">
            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="p-5 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  apiKey.status === "active"
                    ? "bg-[var(--sp-bg)] dark:bg-white/5 text-[var(--sp-fg)]"
                    : "bg-red-50 dark:bg-red-950/20 text-red-400"
                }`}>
                  <Key className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-[var(--sp-fg)]">{apiKey.name}</span>
                    {apiKey.status === "revoked" && (
                      <span className="font-mono text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-950/20 px-1.5 py-0.5 rounded">
                        REVOKED
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-xs text-[var(--sp-fg-light)]">
                    {visibleKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1 text-[10px] text-[var(--sp-fg-light)]">
                      <Clock className="w-3 h-3" /> Created {apiKey.createdAt}
                    </span>
                    {apiKey.lastUsed && (
                      <span className="flex items-center gap-1 text-[10px] text-[var(--sp-fg-light)]">
                        <RotateCcw className="w-3 h-3" /> Last used {apiKey.lastUsed}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleKeyVisibility(apiKey.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--sp-fg-light)] hover:bg-[var(--sp-bg)] dark:hover:bg-white/5 transition-colors"
                    title={visibleKeys.has(apiKey.id) ? "Hide key" : "Show key"}
                  >
                    {visibleKeys.has(apiKey.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleCopy(apiKey.id, apiKey.key)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--sp-fg-light)] hover:bg-[var(--sp-bg)] dark:hover:bg-white/5 transition-colors"
                    title="Copy key"
                  >
                    {copiedId === apiKey.id ? (
                      <Check className="w-4 h-4 text-[var(--sp-green)]" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  {apiKey.status === "active" && (
                    <button
                      onClick={() => handleRevoke(apiKey.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                      title="Revoke key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Webhooks */}
        <div className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 mb-6">
          <div className="p-6 border-b border-foreground/5 dark:border-white/5 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[var(--sp-fg)]">Webhook Endpoints</h3>
              <p className="text-xs text-[var(--sp-fg-light)]">
                Receive real-time notifications when events occur in your workspace
              </p>
            </div>
            <button className="h-9 px-4 border border-foreground/10 dark:border-white/10 rounded-lg font-mono text-xs font-extrabold tracking-[0.1em] uppercase flex items-center gap-2 text-[var(--sp-fg-light)] hover:text-[var(--sp-fg)] hover:bg-[var(--sp-bg)] dark:hover:bg-white/5 transition-colors">
              <Plus className="w-4 h-4" /> Add Webhook
            </button>
          </div>

          <div className="divide-y divide-foreground/5 dark:divide-white/5">
            {webhooks.map((wh) => (
              <div key={wh.id} className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[var(--sp-green)] shrink-0" />
                  <span className="font-mono text-sm text-[var(--sp-fg)] break-all">{wh.url}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap ml-5">
                  {wh.events.map((ev) => (
                    <span
                      key={ev}
                      className="font-mono text-[10px] font-bold bg-[var(--sp-bg)] dark:bg-white/5 text-[var(--sp-fg-light)] px-2 py-1 rounded-md"
                    >
                      {ev}
                    </span>
                  ))}
                  {wh.lastTriggered && (
                    <span className="text-[10px] text-[var(--sp-fg-light)] ml-2">
                      Last triggered {wh.lastTriggered}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Available events */}
        <div className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-6">
          <h3 className="font-semibold text-[var(--sp-fg)] mb-1">Available Events</h3>
          <p className="text-xs text-[var(--sp-fg-light)] mb-5">Events you can subscribe to via webhooks</p>
          <div className="space-y-3">
            {availableEvents.map((ev) => (
              <div key={ev.id} className="flex items-center gap-3 p-3 bg-[var(--sp-bg)] dark:bg-white/5 rounded-lg">
                <div className="font-mono text-xs font-bold text-[var(--sp-fg)] min-w-[180px]">{ev.id}</div>
                <div className="text-xs text-[var(--sp-fg-light)]">{ev.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

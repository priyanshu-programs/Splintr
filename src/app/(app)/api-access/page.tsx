"use client";

import { useState, useEffect, useCallback } from "react";
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
  Zap,
  X,
  Loader2,
} from "lucide-react";
import {
  getApiKeys,
  generateApiKey,
  revokeApiKey,
  getWebhooks,
  createWebhook,
  deleteWebhook,
  testWebhook,
  getApiUsageStats,
  type ApiKey,
  type Webhook as WebhookType,
} from "@/lib/api-keys-store";

/* ── Available webhook events ── */

const AVAILABLE_EVENTS = [
  { id: "generation.completed", label: "Generation Completed", desc: "Fires when AI content generation finishes" },
  { id: "content.published", label: "Content Published", desc: "Fires when content is published to a platform" },
  { id: "content.scheduled", label: "Content Scheduled", desc: "Fires when content is scheduled for future publishing" },
  { id: "profile.updated", label: "Profile Updated", desc: "Fires when a voice profile is created or modified" },
  { id: "usage.limit_reached", label: "Usage Limit Reached", desc: "Fires when monthly usage limit is hit" },
];

/* ── Skeleton components ── */

function StatSkeleton() {
  return (
    <div className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-4 h-4 rounded bg-foreground/5 dark:bg-white/10 animate-pulse" />
        <div className="w-20 h-3 rounded bg-foreground/5 dark:bg-white/10 animate-pulse" />
      </div>
      <div className="w-10 h-7 rounded bg-foreground/5 dark:bg-white/10 animate-pulse" />
    </div>
  );
}

function KeySkeleton() {
  return (
    <div className="p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-foreground/5 dark:bg-white/10 animate-pulse shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="w-32 h-4 rounded bg-foreground/5 dark:bg-white/10 animate-pulse" />
        <div className="w-64 h-3 rounded bg-foreground/5 dark:bg-white/10 animate-pulse" />
        <div className="w-40 h-2.5 rounded bg-foreground/5 dark:bg-white/10 animate-pulse" />
      </div>
    </div>
  );
}

/* ── Helper ── */

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function maskKey(key: string): string {
  return key.slice(0, 12) + "\u2022".repeat(20) + key.slice(-4);
}

/* ── Page ── */

export default function ApiAccessPage() {
  // Data
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookType[]>([]);
  const [stats, setStats] = useState<{ totalKeys: number; activeWebhooks: number; monthlyRequests: number } | null>(null);
  const [loading, setLoading] = useState(true);

  // Key UI state
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [creatingKey, setCreatingKey] = useState(false);
  const [justCreatedKey, setJustCreatedKey] = useState<ApiKey | null>(null);
  const [revokeConfirmId, setRevokeConfirmId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Webhook UI state
  const [showWebhookForm, setShowWebhookForm] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState<Set<string>>(new Set());
  const [creatingWebhook, setCreatingWebhook] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; statusCode: number } | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    try {
      const [keys, wh, st] = await Promise.all([getApiKeys(), getWebhooks(), getApiUsageStats()]);
      setApiKeys(keys);
      setWebhooks(wh);
      setStats(st);
    } catch (err) {
      console.error("Failed to load API access data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Key actions
  function toggleKeyVisibility(id: string) {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleCopy(id: string, key: string) {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleCreateKey() {
    if (!newKeyName.trim() || creatingKey) return;
    setCreatingKey(true);
    try {
      const key = await generateApiKey(newKeyName.trim());
      setJustCreatedKey(key);
      setApiKeys((prev) => [key, ...prev]);
      setNewKeyName("");
      setShowNewKeyForm(false);
      // Refresh stats
      const st = await getApiUsageStats();
      setStats(st);
    } catch (err) {
      console.error("Failed to generate key:", err);
    } finally {
      setCreatingKey(false);
    }
  }

  async function handleRevoke(id: string) {
    setRevokingId(id);
    try {
      await revokeApiKey(id);
      setApiKeys((prev) => prev.map((k) => (k.id === id ? { ...k, isActive: false } : k)));
      setRevokeConfirmId(null);
      const st = await getApiUsageStats();
      setStats(st);
    } catch (err) {
      console.error("Failed to revoke key:", err);
    } finally {
      setRevokingId(null);
    }
  }

  // Webhook actions
  async function handleCreateWebhook() {
    if (!webhookUrl.trim() || webhookEvents.size === 0 || creatingWebhook) return;
    setCreatingWebhook(true);
    try {
      const wh = await createWebhook(webhookUrl.trim(), Array.from(webhookEvents));
      setWebhooks((prev) => [wh, ...prev]);
      setWebhookUrl("");
      setWebhookEvents(new Set());
      setShowWebhookForm(false);
      const st = await getApiUsageStats();
      setStats(st);
    } catch (err) {
      console.error("Failed to create webhook:", err);
    } finally {
      setCreatingWebhook(false);
    }
  }

  async function handleDeleteWebhook(id: string) {
    setDeletingId(id);
    try {
      await deleteWebhook(id);
      setWebhooks((prev) => prev.filter((w) => w.id !== id));
      setDeleteConfirmId(null);
      const st = await getApiUsageStats();
      setStats(st);
    } catch (err) {
      console.error("Failed to delete webhook:", err);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleTestWebhook(id: string) {
    setTestingId(id);
    setTestResult(null);
    try {
      const result = await testWebhook(id);
      setTestResult({ id, ...result });
      // Refresh to update lastTriggered
      const wh = await getWebhooks();
      setWebhooks(wh);
    } catch (err) {
      console.error("Failed to test webhook:", err);
    } finally {
      setTestingId(null);
    }
  }

  function toggleWebhookEvent(eventId: string) {
    setWebhookEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  }

  return (
    <>
      {/* Just-created key banner */}
      {justCreatedKey && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setJustCreatedKey(null)} />
          <div className="relative w-full max-w-lg bg-background dark:bg-[#121214] border border-foreground/5 dark:border-white/10 rounded-2xl p-8 shadow-2xl">
            <h3 className="font-semibold text-lg text-[var(--sp-fg)] mb-1">API Key Created</h3>
            <p className="text-xs text-[var(--sp-fg-light)] mb-4">
              Copy your key now. It will not be shown again in full.
            </p>

            <div className="bg-[var(--sp-bg)] dark:bg-white/5 border border-foreground/10 dark:border-white/10 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-[var(--sp-fg)]">{justCreatedKey.name}</span>
              </div>
              <div className="font-mono text-xs text-[var(--sp-fg)] break-all select-all">
                {justCreatedKey.key}
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                  This key won&apos;t be shown again. Make sure to copy it and store it securely.
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  handleCopy(justCreatedKey.id, justCreatedKey.key);
                }}
                className="h-10 px-5 border border-foreground/10 dark:border-white/10 rounded-lg text-sm font-medium text-[var(--sp-fg)] hover:bg-[var(--sp-bg)] dark:hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                {copiedId === justCreatedKey.id ? (
                  <><Check className="w-4 h-4 text-[var(--sp-green)]" /> Copied</>
                ) : (
                  <><Copy className="w-4 h-4" /> Copy Key</>
                )}
              </button>
              <button
                onClick={() => setJustCreatedKey(null)}
                className="h-10 px-5 bg-[var(--sp-fg)] text-background rounded-lg text-sm font-medium hover:bg-foreground transition-colors"
              >
                Done
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
          {loading ? (
            <>
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
            </>
          ) : (
            <>
              <div className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Key className="w-4 h-4 text-[var(--sp-fg-light)]" />
                  <span className="font-mono text-xs text-[var(--sp-fg-light)]">Active Keys</span>
                </div>
                <div className="text-2xl font-bold text-[var(--sp-fg)]">{stats?.totalKeys ?? 0}</div>
              </div>
              <div className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Webhook className="w-4 h-4 text-[var(--sp-fg-light)]" />
                  <span className="font-mono text-xs text-[var(--sp-fg-light)]">Webhooks</span>
                </div>
                <div className="text-2xl font-bold text-[var(--sp-fg)]">{stats?.activeWebhooks ?? 0}</div>
              </div>
              <div className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-[var(--sp-fg-light)]" />
                  <span className="font-mono text-xs text-[var(--sp-fg-light)]">API Calls (Month)</span>
                </div>
                <div className="text-2xl font-bold text-[var(--sp-fg)]">
                  {stats?.monthlyRequests?.toLocaleString() ?? 0}
                </div>
              </div>
            </>
          )}
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
              onClick={() => {
                setShowNewKeyForm(true);
                setJustCreatedKey(null);
              }}
              className="h-9 px-4 bg-[var(--sp-fg)] text-background rounded-lg font-mono text-xs font-extrabold tracking-[0.1em] uppercase flex items-center gap-2 hover:bg-foreground transition-colors"
            >
              <Plus className="w-4 h-4" /> New Key
            </button>
          </div>

          {/* Inline new key form */}
          {showNewKeyForm && (
            <div className="p-5 border-b border-foreground/5 dark:border-white/5 bg-[var(--sp-bg)] dark:bg-white/[0.02]">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block font-mono text-xs font-bold tracking-wider text-[var(--sp-fg-light)] mb-2 uppercase">
                    Key Name
                  </label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g. Production API Key"
                    className="w-full h-10 px-4 bg-background dark:bg-[#121214] border border-foreground/10 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:border-[var(--sp-fg)] dark:focus:border-white/30 focus:ring-1 focus:ring-[var(--sp-fg)] dark:focus:ring-white/20 transition-all text-[var(--sp-fg)]"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleCreateKey()}
                  />
                </div>
                <button
                  onClick={handleCreateKey}
                  disabled={!newKeyName.trim() || creatingKey}
                  className="h-10 px-5 bg-[var(--sp-fg)] text-background rounded-lg text-sm font-medium hover:bg-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {creatingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                  Generate
                </button>
                <button
                  onClick={() => {
                    setShowNewKeyForm(false);
                    setNewKeyName("");
                  }}
                  className="h-10 px-3 border border-foreground/10 dark:border-white/10 rounded-lg text-sm text-[var(--sp-fg-light)] hover:bg-background dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
              </div>
              <div className="flex items-start gap-2 mt-3">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                  Your API key will only be shown once after creation. Store it securely.
                </p>
              </div>
            </div>
          )}

          {/* Key list */}
          <div className="divide-y divide-foreground/5 dark:divide-white/5">
            {loading ? (
              <>
                <KeySkeleton />
                <KeySkeleton />
              </>
            ) : apiKeys.length === 0 ? (
              <div className="p-10 text-center">
                <Key className="w-8 h-8 text-[var(--sp-fg-light)] mx-auto mb-3 opacity-40" />
                <p className="text-sm text-[var(--sp-fg-light)]">No API keys yet</p>
                <p className="text-xs text-[var(--sp-fg-light)] mt-1">Generate a key to get started</p>
              </div>
            ) : (
              apiKeys.map((apiKey) => (
                <div key={apiKey.id} className="p-5 flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      apiKey.isActive
                        ? "bg-[var(--sp-bg)] dark:bg-white/5 text-[var(--sp-fg)]"
                        : "bg-red-50 dark:bg-red-950/20 text-red-400"
                    }`}
                  >
                    <Key className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-[var(--sp-fg)]">{apiKey.name}</span>
                      {!apiKey.isActive && (
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
                        <Clock className="w-3 h-3" /> Created {formatDate(apiKey.createdAt)}
                      </span>
                      {apiKey.lastUsed && (
                        <span className="flex items-center gap-1 text-[10px] text-[var(--sp-fg-light)]">
                          <RotateCcw className="w-3 h-3" /> Last used {timeAgo(apiKey.lastUsed)}
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
                    {apiKey.isActive && (
                      <>
                        {revokeConfirmId === apiKey.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleRevoke(apiKey.id)}
                              disabled={revokingId === apiKey.id}
                              className="h-7 px-2 bg-red-500 text-white rounded text-[10px] font-bold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                              {revokingId === apiKey.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                              Revoke
                            </button>
                            <button
                              onClick={() => setRevokeConfirmId(null)}
                              className="w-7 h-7 flex items-center justify-center rounded text-[var(--sp-fg-light)] hover:bg-[var(--sp-bg)] dark:hover:bg-white/5"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setRevokeConfirmId(apiKey.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                            title="Revoke key"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
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
            <button
              onClick={() => setShowWebhookForm(true)}
              className="h-9 px-4 border border-foreground/10 dark:border-white/10 rounded-lg font-mono text-xs font-extrabold tracking-[0.1em] uppercase flex items-center gap-2 text-[var(--sp-fg-light)] hover:text-[var(--sp-fg)] hover:bg-[var(--sp-bg)] dark:hover:bg-white/5 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Webhook
            </button>
          </div>

          {/* Inline webhook form */}
          {showWebhookForm && (
            <div className="p-5 border-b border-foreground/5 dark:border-white/5 bg-[var(--sp-bg)] dark:bg-white/[0.02]">
              <div className="mb-4">
                <label className="block font-mono text-xs font-bold tracking-wider text-[var(--sp-fg-light)] mb-2 uppercase">
                  Endpoint URL
                </label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://api.yourapp.com/webhooks/splintr"
                  className="w-full h-10 px-4 bg-background dark:bg-[#121214] border border-foreground/10 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:border-[var(--sp-fg)] dark:focus:border-white/30 focus:ring-1 focus:ring-[var(--sp-fg)] dark:focus:ring-white/20 transition-all text-[var(--sp-fg)] font-mono"
                  autoFocus
                />
              </div>
              <div className="mb-4">
                <label className="block font-mono text-xs font-bold tracking-wider text-[var(--sp-fg-light)] mb-2 uppercase">
                  Events
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {AVAILABLE_EVENTS.map((ev) => (
                    <label
                      key={ev.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        webhookEvents.has(ev.id)
                          ? "border-[var(--sp-fg)] bg-background dark:bg-[#121214]"
                          : "border-foreground/10 dark:border-white/10 hover:bg-background dark:hover:bg-[#121214]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={webhookEvents.has(ev.id)}
                        onChange={() => toggleWebhookEvent(ev.id)}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                          webhookEvents.has(ev.id)
                            ? "border-[var(--sp-fg)] bg-[var(--sp-fg)]"
                            : "border-foreground/20 dark:border-white/20"
                        }`}
                      >
                        {webhookEvents.has(ev.id) && <Check className="w-3 h-3 text-background" />}
                      </div>
                      <div>
                        <div className="font-mono text-xs font-bold text-[var(--sp-fg)]">{ev.id}</div>
                        <div className="text-[10px] text-[var(--sp-fg-light)]">{ev.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowWebhookForm(false);
                    setWebhookUrl("");
                    setWebhookEvents(new Set());
                  }}
                  className="h-9 px-4 border border-foreground/10 dark:border-white/10 rounded-lg text-sm text-[var(--sp-fg-light)] hover:bg-background dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateWebhook}
                  disabled={!webhookUrl.trim() || webhookEvents.size === 0 || creatingWebhook}
                  className="h-9 px-4 bg-[var(--sp-fg)] text-background rounded-lg text-sm font-medium hover:bg-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {creatingWebhook ? <Loader2 className="w-4 h-4 animate-spin" /> : <Webhook className="w-4 h-4" />}
                  Create Webhook
                </button>
              </div>
            </div>
          )}

          {/* Webhook list */}
          <div className="divide-y divide-foreground/5 dark:divide-white/5">
            {loading ? (
              <>
                <KeySkeleton />
                <KeySkeleton />
              </>
            ) : webhooks.length === 0 ? (
              <div className="p-10 text-center">
                <Webhook className="w-8 h-8 text-[var(--sp-fg-light)] mx-auto mb-3 opacity-40" />
                <p className="text-sm text-[var(--sp-fg-light)]">No webhooks configured</p>
                <p className="text-xs text-[var(--sp-fg-light)] mt-1">Add a webhook to receive real-time notifications</p>
              </div>
            ) : (
              webhooks.map((wh) => (
                <div key={wh.id} className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        wh.isActive ? "bg-[var(--sp-green)]" : "bg-foreground/20 dark:bg-white/20"
                      }`}
                    />
                    <span className="font-mono text-sm text-[var(--sp-fg)] break-all flex-1">{wh.url}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleTestWebhook(wh.id)}
                        disabled={testingId === wh.id}
                        className="h-7 px-2.5 border border-foreground/10 dark:border-white/10 rounded text-[10px] font-bold text-[var(--sp-fg-light)] hover:text-[var(--sp-fg)] hover:bg-[var(--sp-bg)] dark:hover:bg-white/5 transition-colors flex items-center gap-1 disabled:opacity-50"
                        title="Send test ping"
                      >
                        {testingId === wh.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Zap className="w-3 h-3" />
                        )}
                        Test
                      </button>
                      {deleteConfirmId === wh.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteWebhook(wh.id)}
                            disabled={deletingId === wh.id}
                            className="h-7 px-2 bg-red-500 text-white rounded text-[10px] font-bold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            {deletingId === wh.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                            Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="w-7 h-7 flex items-center justify-center rounded text-[var(--sp-fg-light)] hover:bg-[var(--sp-bg)] dark:hover:bg-white/5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(wh.id)}
                          className="w-7 h-7 flex items-center justify-center rounded text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                          title="Delete webhook"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
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
                        Last triggered {timeAgo(wh.lastTriggered)}
                      </span>
                    )}
                    {/* Success rate bar */}
                    <div className="flex items-center gap-1.5 ml-auto">
                      <span className="text-[10px] text-[var(--sp-fg-light)]">{wh.successRate}%</span>
                      <div className="w-16 h-1.5 rounded-full bg-foreground/5 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--sp-green)] transition-all"
                          style={{ width: `${wh.successRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  {/* Test result toast */}
                  {testResult && testResult.id === wh.id && (
                    <div
                      className={`mt-3 ml-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
                        testResult.success
                          ? "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300"
                          : "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300"
                      }`}
                    >
                      {testResult.success ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5" />
                      )}
                      {testResult.success
                        ? `Test ping successful (${testResult.statusCode})`
                        : `Test failed (${testResult.statusCode})`}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Available events reference */}
        <div className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-6">
          <h3 className="font-semibold text-[var(--sp-fg)] mb-1">Available Events</h3>
          <p className="text-xs text-[var(--sp-fg-light)] mb-5">Events you can subscribe to via webhooks</p>
          <div className="space-y-3">
            {AVAILABLE_EVENTS.map((ev) => (
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

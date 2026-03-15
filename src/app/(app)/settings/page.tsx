"use client";

import { useState, useEffect, useCallback } from "react";
import {
  User,
  CreditCard,
  Globe,
  Bell,
  Linkedin,
  Twitter,
  Instagram,
  Youtube,
  BookOpen,
  ExternalLink,
  Check,
} from "lucide-react";
import {
  getUserProfile,
  updateUserProfile,
  getWorkspaceSettings,
  updateWorkspaceSettings,
  getBillingInfo,
  getConnections,
  disconnectPlatform,
  getNotificationPrefs,
  updateNotificationPrefs,
  type UserProfile,
  type WorkspaceSettings,
  type BillingInfo,
  type ConnectionItem,
  type NotificationPrefs,
} from "@/lib/settings-store";

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

/* ── Platform icon map ── */

const platformIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  linkedin: Linkedin,
  x: Twitter,
  instagram: Instagram,
  youtube: Youtube,
  tiktok: TikTokIcon,
  threads: ThreadsIcon,
  meta: MetaIcon,
  blog: BookOpen,
};

const platformNames: Record<string, string> = {
  linkedin: "LinkedIn",
  x: "X / Twitter",
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
  threads: "Threads",
  meta: "Meta",
  blog: "Blog (WordPress)",
};

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "connections", label: "Connections", icon: Globe },
  { id: "notifications", label: "Notifications", icon: Bell },
];

/* ── Skeleton component ── */

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-[var(--sp-fg)]/10 rounded ${className || ""}`} />;
}

/* ── Usage meter ── */

function UsageMeter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  return (
    <div className="p-3 bg-[var(--sp-bg)] rounded-lg">
      <div className="text-xs font-mono text-[var(--sp-fg-light)] mb-1">{label}</div>
      <div className="text-sm font-bold mb-2">{used} / {limit}</div>
      <div className="w-full h-1.5 bg-[var(--sp-fg)]/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--sp-fg)] rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");

  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceSettings | null>(null);
  const [fullName, setFullName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Billing state
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [billingLoading, setBillingLoading] = useState(true);

  // Connections state
  const [connections, setConnections] = useState<ConnectionItem[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  // Notifications state
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs | null>(null);
  const [notifLoading, setNotifLoading] = useState(true);

  // Load profile + workspace
  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const [p, w] = await Promise.all([getUserProfile(), getWorkspaceSettings()]);
      setProfile(p);
      setWorkspace(w);
      setFullName(p.fullName || "");
      setWorkspaceName(w.name);
      setTimezone(w.timezone);
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Load billing
  const loadBilling = useCallback(async () => {
    setBillingLoading(true);
    try {
      const b = await getBillingInfo();
      setBilling(b);
    } catch (err) {
      console.error("Failed to load billing:", err);
    } finally {
      setBillingLoading(false);
    }
  }, []);

  // Load connections
  const loadConnections = useCallback(async () => {
    setConnectionsLoading(true);
    try {
      const c = await getConnections();
      setConnections(c);
    } catch (err) {
      console.error("Failed to load connections:", err);
    } finally {
      setConnectionsLoading(false);
    }
  }, []);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const n = await getNotificationPrefs();
      setNotifPrefs(n);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setNotifLoading(false);
    }
  }, []);

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === "profile") loadProfile();
    if (activeTab === "billing") loadBilling();
    if (activeTab === "connections") loadConnections();
    if (activeTab === "notifications") loadNotifications();
  }, [activeTab, loadProfile, loadBilling, loadConnections, loadNotifications]);

  // Save profile + workspace
  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileMessage(null);
    try {
      await Promise.all([
        updateUserProfile({ full_name: fullName }),
        updateWorkspaceSettings({ name: workspaceName, timezone }),
      ]);
      setProfileMessage({ type: "success", text: "Settings saved successfully." });
      setTimeout(() => setProfileMessage(null), 3000);
    } catch (err) {
      setProfileMessage({ type: "error", text: "Failed to save settings. Please try again." });
    } finally {
      setProfileSaving(false);
    }
  };

  // Disconnect platform
  const handleDisconnect = async (connectionId: string) => {
    setDisconnecting(connectionId);
    try {
      await disconnectPlatform(connectionId);
      await loadConnections();
    } catch (err) {
      console.error("Failed to disconnect:", err);
    } finally {
      setDisconnecting(null);
    }
  };

  // Toggle notification pref
  const handleToggleNotif = async (key: keyof NotificationPrefs) => {
    if (!notifPrefs) return;
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    await updateNotificationPrefs(updated);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-sans text-2xl font-bold tracking-tight text-[var(--sp-fg)]">Settings</h1>
        <p className="font-mono text-sm text-[var(--sp-fg-light)] mt-1">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-1 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 h-10 rounded-lg flex items-center justify-center gap-2 font-mono text-xs font-extrabold tracking-[0.15em] uppercase transition-all ${
              activeTab === tab.id
                ? "bg-[var(--sp-fg)] text-background"
                : "text-[var(--sp-fg-light)] hover:text-[var(--sp-fg)]"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          <div className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-6">
            <h3 className="font-semibold mb-6 text-[var(--sp-fg)]">Personal Information</h3>

            {profileLoading ? (
              <div className="space-y-4">
                <div className="flex items-center gap-6 mb-8">
                  <Skeleton className="w-20 h-20 rounded-full" />
                  <Skeleton className="w-28 h-9 rounded-lg" />
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  <Skeleton className="h-11 rounded-lg" />
                  <Skeleton className="h-11 rounded-lg" />
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-20 h-20 rounded-full bg-[var(--sp-bg)] flex items-center justify-center text-2xl font-bold text-[var(--sp-fg-light)]">
                    {fullName ? fullName.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div>
                    <button className="h-9 px-4 bg-[var(--sp-fg)] text-background rounded-lg text-sm font-medium hover:bg-foreground transition-colors">
                      Upload Photo
                    </button>
                    <p className="text-xs text-[var(--sp-fg-light)] mt-2">JPG, PNG. Max 2MB.</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block font-mono text-xs font-bold tracking-wider text-[var(--sp-fg-light)] mb-2 uppercase">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full h-11 px-4 bg-[var(--sp-bg)] border border-sp-fg/10 rounded-lg text-sm focus:outline-none focus:border-[var(--sp-fg)] focus:ring-1 focus:ring-[var(--sp-fg)] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs font-bold tracking-wider text-[var(--sp-fg-light)] mb-2 uppercase">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile?.email || ""}
                      disabled
                      className="w-full h-11 px-4 bg-[var(--sp-bg)] border border-sp-fg/10 rounded-lg text-sm opacity-60 cursor-not-allowed"
                    />
                  </div>
                </div>
              </>
            )}

            {profileMessage && (
              <div
                className={`mt-4 px-4 py-2 rounded-lg text-sm ${
                  profileMessage.type === "success"
                    ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                    : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                }`}
              >
                {profileMessage.text}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveProfile}
                disabled={profileSaving || profileLoading}
                className="h-10 px-5 bg-[var(--sp-fg)] text-background rounded-lg text-sm font-medium hover:bg-foreground transition-colors disabled:opacity-50"
              >
                {profileSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          <div className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-6">
            <h3 className="font-semibold mb-1">Workspace</h3>
            <p className="text-xs text-[var(--sp-fg-light)] mb-5">Manage your workspace settings</p>

            {profileLoading ? (
              <div className="grid md:grid-cols-2 gap-5">
                <Skeleton className="h-11 rounded-lg" />
                <Skeleton className="h-11 rounded-lg" />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block font-mono text-xs font-bold tracking-wider text-[var(--sp-fg-light)] mb-2 uppercase">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    className="w-full h-11 px-4 bg-[var(--sp-bg)] border border-sp-fg/10 rounded-lg text-sm focus:outline-none focus:border-[var(--sp-fg)] focus:ring-1 focus:ring-[var(--sp-fg)] transition-all"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs font-bold tracking-wider text-[var(--sp-fg-light)] mb-2 uppercase">
                    Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full h-11 px-4 bg-[var(--sp-bg)] border border-sp-fg/10 rounded-lg text-sm focus:outline-none focus:border-[var(--sp-fg)]"
                  >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="UTC">GMT / UTC</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Berlin">Central European (CET)</option>
                    <option value="Asia/Tokyo">Japan (JST)</option>
                    <option value="Asia/Kolkata">India (IST)</option>
                    <option value="Australia/Sydney">Sydney (AEST)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="bg-background dark:bg-[#121214] rounded-xl border border-red-100 dark:border-red-900/30 p-6">
            <h3 className="font-semibold text-red-600 mb-1">Danger Zone</h3>
            <p className="text-xs text-[var(--sp-fg-light)] mb-4">Permanent actions that cannot be undone</p>
            <button
              onClick={() => alert("Coming soon")}
              className="h-10 px-5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      )}

      {/* Billing tab */}
      {activeTab === "billing" && (
        <div className="space-y-6">
          <div className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-6">
            {billingLoading ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <Skeleton className="w-40 h-6 rounded" />
                  <Skeleton className="w-16 h-7 rounded-full" />
                </div>
                <Skeleton className="w-24 h-10 rounded" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Skeleton className="h-20 rounded-lg" />
                  <Skeleton className="h-20 rounded-lg" />
                  <Skeleton className="h-20 rounded-lg" />
                </div>
              </div>
            ) : billing ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-semibold">Current Plan</h3>
                    <p className="text-xs text-[var(--sp-fg-light)]">
                      Status: <span className="capitalize">{billing.status}</span>
                    </p>
                  </div>
                  <span className="font-mono text-xs font-bold bg-[var(--sp-fg)] text-background px-3 py-1.5 rounded-full uppercase">
                    {billing.tier}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <UsageMeter label="Generations" used={billing.generationsUsed} limit={billing.generationLimit} />
                  <UsageMeter label="Platforms" used={billing.platformCount} limit={billing.platformLimit} />
                  <UsageMeter label="Voice Profiles" used={billing.profileCount} limit={billing.profileLimit} />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => alert("Stripe integration coming soon")}
                    className="h-10 px-5 bg-[var(--sp-fg)] text-background rounded-lg text-sm font-medium hover:bg-foreground transition-colors"
                  >
                    Upgrade Plan
                  </button>
                  <button
                    onClick={() => alert("Stripe integration coming soon")}
                    className="h-10 px-5 border border-sp-fg/10 rounded-lg text-sm font-medium text-[var(--sp-fg-light)] hover:bg-[var(--sp-bg)] transition-colors flex items-center gap-2"
                  >
                    Manage Subscription <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : null}
          </div>

          <div className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-6">
            <h3 className="font-semibold mb-4">Invoices</h3>
            <div className="divide-y divide-black/5">
              {[
                { date: "Mar 1, 2026", amount: "$49.00", status: "Paid" },
                { date: "Feb 1, 2026", amount: "$49.00", status: "Paid" },
                { date: "Jan 1, 2026", amount: "$49.00", status: "Paid" },
              ].map((invoice) => (
                <div key={invoice.date} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm">{invoice.date}</span>
                    <span className="text-sm font-bold">{invoice.amount}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-[var(--sp-green)] bg-sp-green/10 px-2 py-0.5 rounded-full">
                      {invoice.status}
                    </span>
                    <button className="text-xs font-mono font-bold text-[var(--sp-fg-light)] hover:text-[var(--sp-fg)]">
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Connections tab */}
      {activeTab === "connections" && (
        <div className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5">
          <div className="p-6 border-b border-foreground/5 dark:border-white/5">
            <h3 className="font-semibold">Connected Platforms</h3>
            <p className="text-xs text-[var(--sp-fg-light)]">Manage your platform integrations for direct publishing</p>
          </div>

          {connectionsLoading ? (
            <div className="divide-y divide-black/5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-5 flex items-center gap-4">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="w-24 h-4 rounded" />
                    <Skeleton className="w-16 h-3 rounded" />
                  </div>
                  <Skeleton className="w-20 h-8 rounded-lg" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-black/5">
              {connections.map((c) => {
                const IconComp = platformIcons[c.platform] || Globe;
                const name = platformNames[c.platform] || c.platform;
                return (
                  <div key={c.id} className="p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[var(--sp-bg)] flex items-center justify-center text-[var(--sp-fg-light)]">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{name}</div>
                      {c.connected && c.username && (
                        <div className="text-xs text-[var(--sp-fg-light)]">{c.username}</div>
                      )}
                    </div>
                    {c.connected ? (
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-[var(--sp-green)] flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Connected
                        </span>
                        <button
                          onClick={() => handleDisconnect(c.id)}
                          disabled={disconnecting === c.id}
                          className="h-8 px-3 border border-red-100 text-red-500 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          {disconnecting === c.id ? "..." : "Disconnect"}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => alert("OAuth integration coming soon")}
                        className="h-8 px-4 bg-[var(--sp-fg)] text-background rounded-lg text-xs font-medium hover:bg-foreground transition-colors"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Notifications tab */}
      {activeTab === "notifications" && (
        <div className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-6">
          <h3 className="font-semibold mb-6">Notification Preferences</h3>

          {notifLoading || !notifPrefs ? (
            <div className="space-y-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div className="space-y-2">
                    <Skeleton className="w-32 h-4 rounded" />
                    <Skeleton className="w-48 h-3 rounded" />
                  </div>
                  <Skeleton className="w-11 h-6 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              {([
                { key: "generationAlerts" as const, label: "Generation complete", desc: "When AI finishes generating content" },
                { key: "publishReminders" as const, label: "Publishing reminders", desc: "Reminders for scheduled posts" },
                { key: "weeklyDigest" as const, label: "Weekly analytics digest", desc: "Performance summary every Monday" },
                { key: "usageAlerts" as const, label: "Usage alerts", desc: "When approaching plan limits" },
                { key: "productUpdates" as const, label: "Product updates", desc: "New features and improvements" },
              ]).map((notif) => (
                <div key={notif.key} className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-sm font-medium">{notif.label}</div>
                    <div className="text-xs text-[var(--sp-fg-light)]">{notif.desc}</div>
                  </div>
                  <button
                    onClick={() => handleToggleNotif(notif.key)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      notifPrefs[notif.key] ? "bg-[var(--sp-green)]" : "bg-[var(--sp-fg)]/15"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-background rounded-full shadow-sm absolute top-0.5 transition-all ${
                        notifPrefs[notif.key] ? "right-0.5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

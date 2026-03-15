/**
 * settings-store.ts
 *
 * Dual-mode storage layer for settings data.
 * - Mock mode (NEXT_PUBLIC_MOCK_AUTH=true): uses localStorage + mock constants
 * - Real mode: uses Supabase
 */

import { MOCK_AUTH_ENABLED, MOCK_PROFILE, MOCK_WORKSPACE } from "@/lib/auth/mock-auth";
import { createClient } from "@/lib/supabase/client";

/* ── Types ── */

export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  subscriptionTier: string;
  subscriptionStatus: string;
}

export interface WorkspaceSettings {
  id: string;
  name: string;
  timezone: string;
  logoUrl: string | null;
}

export interface BillingInfo {
  tier: string;
  status: string;
  generationsUsed: number;
  generationLimit: number;
  platformCount: number;
  platformLimit: number;
  profileCount: number;
  profileLimit: number;
}

export interface ConnectionItem {
  id: string;
  platform: string;
  username: string | null;
  connected: boolean;
}

export interface NotificationPrefs {
  generationAlerts: boolean;
  publishReminders: boolean;
  weeklyDigest: boolean;
  usageAlerts: boolean;
  productUpdates: boolean;
}

/* ── localStorage keys ── */

const PROFILE_KEY = "splintr_user_profile";
const WORKSPACE_KEY = "splintr_workspace_settings";
const CONNECTIONS_KEY = "splintr_connections";
const NOTIFICATION_KEY = "splintr_notification_prefs";

/* ── Default notification prefs ── */

const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  generationAlerts: true,
  publishReminders: true,
  weeklyDigest: false,
  usageAlerts: true,
  productUpdates: false,
};

/* ── Mock connected platforms ── */

const MOCK_CONNECTIONS: ConnectionItem[] = [
  { id: "linkedin", platform: "linkedin", username: "@johndoe", connected: true },
  { id: "x", platform: "x", username: "@johndoe_x", connected: true },
  { id: "instagram", platform: "instagram", username: null, connected: false },
  { id: "youtube", platform: "youtube", username: null, connected: false },
  { id: "tiktok", platform: "tiktok", username: null, connected: false },
  { id: "threads", platform: "threads", username: null, connected: false },
  { id: "meta", platform: "meta", username: null, connected: false },
  { id: "blog", platform: "blog", username: null, connected: false },
];

/* ── localStorage helpers ── */

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

/* ── Internal helper ── */

async function getWorkspaceId(supabase: ReturnType<typeof createClient>): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: workspaces } = await supabase
    .from("workspaces")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  if (!workspaces || workspaces.length === 0) {
    throw new Error("No workspace found");
  }

  return (workspaces[0] as any).id;
}

/* ── Profile ── */

export async function getUserProfile(): Promise<UserProfile> {
  if (MOCK_AUTH_ENABLED) {
    const stored = readLocal<Partial<UserProfile>>(PROFILE_KEY, {});
    return {
      id: MOCK_PROFILE.id,
      email: MOCK_PROFILE.email,
      fullName: stored.fullName ?? MOCK_PROFILE.full_name,
      avatarUrl: stored.avatarUrl ?? MOCK_PROFILE.avatar_url,
      subscriptionTier: MOCK_PROFILE.subscription_tier,
      subscriptionStatus: MOCK_PROFILE.subscription_status,
    };
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile, error } = await supabase
    .from("users")
    .select("id, email, full_name, avatar_url, subscription_tier, subscription_status")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    throw new Error(error?.message || "Failed to fetch profile");
  }

  return {
    id: (profile as any).id,
    email: (profile as any).email,
    fullName: (profile as any).full_name,
    avatarUrl: (profile as any).avatar_url,
    subscriptionTier: (profile as any).subscription_tier,
    subscriptionStatus: (profile as any).subscription_status,
  };
}

export async function updateUserProfile(data: { full_name?: string; avatar_url?: string }): Promise<void> {
  if (MOCK_AUTH_ENABLED) {
    const current = readLocal<Partial<UserProfile>>(PROFILE_KEY, {});
    if (data.full_name !== undefined) current.fullName = data.full_name;
    if (data.avatar_url !== undefined) current.avatarUrl = data.avatar_url;
    writeLocal(PROFILE_KEY, current);
    return;
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await (supabase.from("users") as any)
    .update(data)
    .eq("id", user.id);

  if (error) {
    throw new Error(error.message || "Failed to update profile");
  }
}

/* ── Workspace ── */

export async function getWorkspaceSettings(): Promise<WorkspaceSettings> {
  if (MOCK_AUTH_ENABLED) {
    const stored = readLocal<Partial<WorkspaceSettings>>(WORKSPACE_KEY, {});
    return {
      id: MOCK_WORKSPACE.id,
      name: stored.name ?? MOCK_WORKSPACE.name,
      timezone: stored.timezone ?? MOCK_WORKSPACE.timezone,
      logoUrl: stored.logoUrl ?? MOCK_WORKSPACE.logo_url,
    };
  }

  const supabase = createClient();
  const wsId = await getWorkspaceId(supabase);

  const { data, error } = await supabase
    .from("workspaces")
    .select("id, name, timezone, logo_url")
    .eq("id", wsId)
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to fetch workspace");
  }

  return {
    id: (data as any).id,
    name: (data as any).name,
    timezone: (data as any).timezone,
    logoUrl: (data as any).logo_url,
  };
}

export async function updateWorkspaceSettings(data: { name?: string; timezone?: string }): Promise<void> {
  if (MOCK_AUTH_ENABLED) {
    const current = readLocal<Partial<WorkspaceSettings>>(WORKSPACE_KEY, {});
    if (data.name !== undefined) current.name = data.name;
    if (data.timezone !== undefined) current.timezone = data.timezone;
    writeLocal(WORKSPACE_KEY, current);
    return;
  }

  const supabase = createClient();
  const wsId = await getWorkspaceId(supabase);

  const { error } = await (supabase.from("workspaces") as any)
    .update(data)
    .eq("id", wsId);

  if (error) {
    throw new Error(error.message || "Failed to update workspace");
  }
}

/* ── Billing ── */

export async function getBillingInfo(): Promise<BillingInfo> {
  if (MOCK_AUTH_ENABLED) {
    return {
      tier: "pro",
      status: "active",
      generationsUsed: 23,
      generationLimit: 50,
      platformCount: 2,
      platformLimit: 6,
      profileCount: 1,
      profileLimit: 5,
    };
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get user subscription info
  const { data: profile } = await supabase
    .from("users")
    .select("subscription_tier, subscription_status")
    .eq("id", user.id)
    .single();

  const tier = (profile as any)?.subscription_tier || "free";
  const status = (profile as any)?.subscription_status || "active";

  const wsId = await getWorkspaceId(supabase);

  // Count generations this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: generationsUsed } = await supabase
    .from("usage_logs")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", wsId)
    .eq("action", "generation")
    .gte("created_at", startOfMonth.toISOString());

  // Count platform connections
  const { count: platformCount } = await supabase
    .from("platform_connections")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", wsId)
    .eq("is_active", true);

  // Count voice profiles
  const { count: profileCount } = await supabase
    .from("voice_profiles")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", wsId);

  // Get limits from subscription_plans
  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("generation_limit, platform_limit, voice_profile_limit")
    .eq("tier", tier)
    .eq("interval", "month")
    .single();

  return {
    tier,
    status,
    generationsUsed: generationsUsed || 0,
    generationLimit: (plan as any)?.generation_limit || 50,
    platformCount: platformCount || 0,
    platformLimit: (plan as any)?.platform_limit || 6,
    profileCount: profileCount || 0,
    profileLimit: (plan as any)?.voice_profile_limit || 5,
  };
}

/* ── Connections ── */

export async function getConnections(): Promise<ConnectionItem[]> {
  if (MOCK_AUTH_ENABLED) {
    const stored = readLocal<ConnectionItem[] | null>(CONNECTIONS_KEY, null);
    return stored ?? MOCK_CONNECTIONS;
  }

  const supabase = createClient();
  const wsId = await getWorkspaceId(supabase);

  const { data, error } = await supabase
    .from("platform_connections")
    .select("id, platform, platform_username, is_active")
    .eq("workspace_id", wsId);

  if (error || !data) {
    return [];
  }

  return data.map((pc: any) => ({
    id: pc.id,
    platform: pc.platform,
    username: pc.platform_username,
    connected: pc.is_active,
  }));
}

export async function disconnectPlatform(connectionId: string): Promise<void> {
  if (MOCK_AUTH_ENABLED) {
    const stored = readLocal<ConnectionItem[] | null>(CONNECTIONS_KEY, null);
    const connections = stored ?? [...MOCK_CONNECTIONS];
    const idx = connections.findIndex((c) => c.id === connectionId);
    if (idx !== -1) {
      connections[idx].connected = false;
      connections[idx].username = null;
    }
    writeLocal(CONNECTIONS_KEY, connections);
    return;
  }

  const supabase = createClient();

  const { error } = await (supabase.from("platform_connections") as any)
    .update({ is_active: false })
    .eq("id", connectionId);

  if (error) {
    throw new Error(error.message || "Failed to disconnect platform");
  }
}

/* ── Notifications (localStorage both modes) ── */

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  return readLocal<NotificationPrefs>(NOTIFICATION_KEY, DEFAULT_NOTIFICATION_PREFS);
}

export async function updateNotificationPrefs(prefs: NotificationPrefs): Promise<void> {
  writeLocal(NOTIFICATION_KEY, prefs);
}

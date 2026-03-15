/**
 * connections-store.ts
 *
 * Dual-mode storage layer for platform connections.
 * - Mock mode (NEXT_PUBLIC_MOCK_AUTH=true): uses localStorage
 * - Real mode: uses Supabase `platform_connections` table
 */

import { MOCK_AUTH_ENABLED } from "@/lib/auth/mock-auth";
import { createClient } from "@/lib/supabase/client";

/* ── Types ── */

export interface PlatformConnection {
  id: string;
  platform: string;
  platformUsername: string | null;
  isActive: boolean;
  connectedAt: string | null;
}

/* ── localStorage helpers ── */

const STORAGE_KEY = "splintr_connections";

const DEFAULT_CONNECTIONS: PlatformConnection[] = [
  { id: "linkedin", platform: "linkedin", platformUsername: "@johndoe", isActive: true, connectedAt: new Date().toISOString() },
  { id: "x", platform: "x", platformUsername: "@johndoe_x", isActive: true, connectedAt: new Date().toISOString() },
  { id: "instagram", platform: "instagram", platformUsername: null, isActive: false, connectedAt: null },
  { id: "youtube", platform: "youtube", platformUsername: null, isActive: false, connectedAt: null },
  { id: "tiktok", platform: "tiktok", platformUsername: null, isActive: false, connectedAt: null },
  { id: "threads", platform: "threads", platformUsername: null, isActive: false, connectedAt: null },
  { id: "bluesky", platform: "bluesky", platformUsername: null, isActive: false, connectedAt: null },
  { id: "blog", platform: "blog", platformUsername: null, isActive: false, connectedAt: null },
];

function readLocalConnections(): PlatformConnection[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed defaults on first access
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CONNECTIONS));
      return DEFAULT_CONNECTIONS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_CONNECTIONS;
  }
}

function writeLocalConnections(connections: PlatformConnection[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(connections));
}

/* ── Supabase helper ── */

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

/* ── Public API ── */

/**
 * Get all connections for the current workspace.
 */
export async function getConnections(): Promise<PlatformConnection[]> {
  if (MOCK_AUTH_ENABLED) {
    return readLocalConnections();
  }

  const supabase = createClient();
  const wsId = await getWorkspaceId(supabase);

  const { data, error } = await supabase
    .from("platform_connections")
    .select("id, platform, platform_username, is_active, created_at")
    .eq("workspace_id", wsId);

  if (error || !data) {
    console.error("Failed to fetch connections:", error);
    return [];
  }

  return data.map((pc: any) => ({
    id: pc.id,
    platform: pc.platform,
    platformUsername: pc.platform_username,
    isActive: pc.is_active,
    connectedAt: pc.created_at,
  }));
}

/**
 * Connect a platform (creates/updates record, sets is_active=true).
 */
export async function connectPlatform(platform: string, username?: string): Promise<void> {
  if (MOCK_AUTH_ENABLED) {
    const connections = readLocalConnections();
    const idx = connections.findIndex((c) => c.platform === platform);
    if (idx !== -1) {
      connections[idx].isActive = true;
      connections[idx].platformUsername = username || connections[idx].platformUsername;
      connections[idx].connectedAt = new Date().toISOString();
    } else {
      connections.push({
        id: platform,
        platform,
        platformUsername: username || null,
        isActive: true,
        connectedAt: new Date().toISOString(),
      });
    }
    writeLocalConnections(connections);
    return;
  }

  const supabase = createClient();
  const wsId = await getWorkspaceId(supabase);

  // Upsert: update if exists, insert if not
  const { data: existing } = await supabase
    .from("platform_connections")
    .select("id")
    .eq("workspace_id", wsId)
    .eq("platform", platform)
    .limit(1);

  if (existing && existing.length > 0) {
    const { error } = await (supabase
      .from("platform_connections") as any)
      .update({
        is_active: true,
        platform_username: username || null,
      })
      .eq("id", (existing[0] as any).id);

    if (error) throw new Error(error.message || "Failed to update connection");
  } else {
    const { error } = await supabase
      .from("platform_connections")
      .insert({
        workspace_id: wsId,
        platform,
        platform_username: username || null,
        is_active: true,
      } as any);

    if (error) throw new Error(error.message || "Failed to create connection");
  }
}

/**
 * Disconnect a platform (sets is_active=false).
 */
export async function disconnectPlatform(platform: string): Promise<void> {
  if (MOCK_AUTH_ENABLED) {
    const connections = readLocalConnections();
    const idx = connections.findIndex((c) => c.platform === platform);
    if (idx !== -1) {
      connections[idx].isActive = false;
      connections[idx].platformUsername = null;
    }
    writeLocalConnections(connections);
    return;
  }

  const supabase = createClient();
  const wsId = await getWorkspaceId(supabase);

  const { error } = await (supabase
    .from("platform_connections") as any)
    .update({ is_active: false, platform_username: null })
    .eq("workspace_id", wsId)
    .eq("platform", platform);

  if (error) throw new Error(error.message || "Failed to disconnect platform");
}

/**
 * Check if a specific platform is connected.
 */
export async function isPlatformConnected(platform: string): Promise<boolean> {
  const connections = await getConnections();
  const conn = connections.find((c) => c.platform === platform);
  return conn?.isActive ?? false;
}

/**
 * Consume the oauth_result cookie (mock mode only).
 * Called on the setup page after an OAuth redirect to persist the connection.
 * Returns the platform name if a result was consumed, null otherwise.
 */
export function consumeOAuthResult(): string | null {
  if (typeof window === "undefined") return null;

  const match = document.cookie.match(/(?:^|;\s*)oauth_result=([^;]*)/);
  if (!match) return null;

  try {
    const result = JSON.parse(decodeURIComponent(match[1]));
    const { platform, username, accessToken, platformUserId } = result;

    // Persist token data for potential client-side use
    if (accessToken) {
      try {
        const tokensRaw = localStorage.getItem("splintr_platform_tokens");
        const tokens = tokensRaw ? JSON.parse(tokensRaw) : {};
        tokens[platform] = { accessToken, platformUserId };
        localStorage.setItem("splintr_platform_tokens", JSON.stringify(tokens));
      } catch {
        // Non-critical — token is also in httpOnly cookie for server-side use
      }
    }

    const connections = readLocalConnections();
    const idx = connections.findIndex((c) => c.platform === platform);
    if (idx !== -1) {
      connections[idx].isActive = true;
      connections[idx].platformUsername = username || connections[idx].platformUsername;
      connections[idx].connectedAt = new Date().toISOString();
    } else {
      connections.push({
        id: platform,
        platform,
        platformUsername: username || null,
        isActive: true,
        connectedAt: new Date().toISOString(),
      });
    }
    writeLocalConnections(connections);

    // Clear the cookie
    document.cookie = "oauth_result=; path=/; max-age=0";

    return platform;
  } catch {
    return null;
  }
}

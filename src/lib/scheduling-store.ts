/**
 * scheduling-store.ts
 *
 * Dual-mode scheduling layer for the Scheduling page.
 * - Mock mode: reads/writes from content-store's localStorage (splintr_approved_items)
 * - Real mode: uses Supabase generations table
 *
 * A "scheduled" post is one with scheduledFor set.
 * Display status is derived from both DB status and scheduledFor presence.
 */

import { MOCK_AUTH_ENABLED } from "@/lib/auth/mock-auth";
import { createClient } from "@/lib/supabase/client";

/* ── Types ── */

export type ScheduledPostStatus = "scheduled" | "ready" | "published" | "draft" | "archived";

export interface ScheduledPost {
  id: string;
  title: string;
  platform: string;
  /** Display status — derived from DB status + scheduledFor presence */
  status: ScheduledPostStatus;
  scheduledFor: string | null;
  publishedAt: string | null;
  content: string;
  createdAt: string;
}

/* ── Mock-mode helpers (shared localStorage with content-store) ── */

const CONTENT_STORAGE_KEY = "splintr_approved_items";

interface MockItem {
  id: string;
  title: string;
  platform: string;
  status: string;
  content: string;
  createdAt: string;
  scheduledFor?: string | null;
  [key: string]: unknown;
}

function readMockItems(): MockItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CONTENT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeMockItems(items: MockItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(items));
}

function mockItemToPost(item: MockItem): ScheduledPost {
  return {
    id: item.id,
    title: item.title,
    platform: item.platform,
    status: deriveStatus(item.status, item.scheduledFor || null),
    scheduledFor: item.scheduledFor || null,
    publishedAt: item.status === "published" ? item.createdAt : null,
    content: item.content,
    createdAt: item.createdAt,
  };
}

/* ── Supabase helpers ── */

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

/**
 * Derive display status from DB row.
 * A generation with status=ready and scheduledFor set → "scheduled".
 */
function deriveStatus(dbStatus: string, scheduledFor: string | null): ScheduledPostStatus {
  if (scheduledFor && (dbStatus === "ready" || dbStatus === "scheduled")) {
    return "scheduled";
  }
  if (dbStatus === "published") return "published";
  if (dbStatus === "draft") return "draft";
  if (dbStatus === "archived") return "archived";
  return "ready";
}

/** Map a Supabase row to ScheduledPost */
function mapRow(row: any): ScheduledPost {
  return {
    id: row.id,
    title: row.content_items?.title || "Untitled",
    platform: row.platform,
    status: deriveStatus(row.status, row.scheduled_for),
    scheduledFor: row.scheduled_for,
    publishedAt: row.published_at,
    content: row.generated_content || "",
    createdAt: row.created_at,
  };
}

/* ── Public API ── */

/**
 * Get all posts in a date range.
 */
export async function getScheduledPosts(startDate: string, endDate: string): Promise<ScheduledPost[]> {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  if (MOCK_AUTH_ENABLED) {
    return readMockItems()
      .map(mockItemToPost)
      .filter((p) => {
        if (p.scheduledFor) {
          const t = new Date(p.scheduledFor).getTime();
          if (t >= start && t <= end) return true;
        }
        if (p.publishedAt) {
          const t = new Date(p.publishedAt).getTime();
          if (t >= start && t <= end) return true;
        }
        if (p.status === "draft" || p.status === "ready") {
          const t = new Date(p.createdAt).getTime();
          if (t >= start && t <= end) return true;
        }
        return false;
      });
  }

  const supabase = createClient();
  const wsId = await getWorkspaceId(supabase);

  const { data, error } = await supabase
    .from("generations")
    .select(`
      id, platform, status, scheduled_for, published_at, generated_content, created_at,
      content_items (title)
    `)
    .eq("workspace_id", wsId)
    .order("scheduled_for", { ascending: true, nullsFirst: false });

  if (error || !data) {
    console.error("Failed to fetch scheduled posts:", error);
    return [];
  }

  return (data as any[])
    .map(mapRow)
    .filter((p) => {
      if (p.scheduledFor) {
        const t = new Date(p.scheduledFor).getTime();
        if (t >= start && t <= end) return true;
      }
      if (p.publishedAt) {
        const t = new Date(p.publishedAt).getTime();
        if (t >= start && t <= end) return true;
      }
      if (p.status === "draft") {
        const t = new Date(p.createdAt).getTime();
        if (t >= start && t <= end) return true;
      }
      return false;
    });
}

/**
 * Schedule a post for a specific date/time.
 */
export async function schedulePost(generationId: string, scheduledFor: string): Promise<void> {
  if (new Date(scheduledFor).getTime() < Date.now()) {
    throw new Error("Cannot schedule a post in the past");
  }

  if (MOCK_AUTH_ENABLED) {
    const items = readMockItems();
    const idx = items.findIndex((i) => i.id === generationId);
    if (idx !== -1) {
      items[idx].scheduledFor = scheduledFor;
      items[idx].status = "ready";
      writeMockItems(items);
    }
    return;
  }

  const supabase = createClient();
  const { error } = await (supabase
    .from("generations") as any)
    .update({ scheduled_for: scheduledFor, status: "ready" })
    .eq("id", generationId);

  if (error) {
    throw new Error(error.message || "Failed to schedule post");
  }
}

/**
 * Unschedule a post — clear scheduledFor, set status to draft.
 */
export async function unschedulePost(generationId: string): Promise<void> {
  if (MOCK_AUTH_ENABLED) {
    const items = readMockItems();
    const idx = items.findIndex((i) => i.id === generationId);
    if (idx !== -1) {
      items[idx].scheduledFor = null;
      items[idx].status = "draft";
      writeMockItems(items);
    }
    return;
  }

  const supabase = createClient();
  const { error } = await (supabase
    .from("generations") as any)
    .update({ scheduled_for: null, status: "draft" })
    .eq("id", generationId);

  if (error) {
    throw new Error(error.message || "Failed to unschedule post");
  }
}

/**
 * Get upcoming posts for the next 7 days, sorted by scheduledFor.
 */
export async function getUpcomingPosts(): Promise<ScheduledPost[]> {
  const now = new Date();
  const weekLater = new Date();
  weekLater.setDate(now.getDate() + 7);

  if (MOCK_AUTH_ENABLED) {
    return readMockItems()
      .map(mockItemToPost)
      .filter((p) => {
        if (!p.scheduledFor) return false;
        const t = new Date(p.scheduledFor).getTime();
        return t >= now.getTime() && t <= weekLater.getTime();
      })
      .sort((a, b) => new Date(a.scheduledFor!).getTime() - new Date(b.scheduledFor!).getTime());
  }

  const supabase = createClient();
  const wsId = await getWorkspaceId(supabase);

  const { data, error } = await supabase
    .from("generations")
    .select(`
      id, platform, status, scheduled_for, published_at, generated_content, created_at,
      content_items (title)
    `)
    .eq("workspace_id", wsId)
    .not("scheduled_for", "is", null)
    .gte("scheduled_for", now.toISOString())
    .lte("scheduled_for", weekLater.toISOString())
    .order("scheduled_for", { ascending: true });

  if (error || !data) {
    console.error("Failed to fetch upcoming posts:", error);
    return [];
  }

  return (data as any[]).map(mapRow);
}

/**
 * Get posts that can be scheduled — ready or draft, with no scheduledFor set.
 */
export async function getUnscheduledPosts(): Promise<ScheduledPost[]> {
  if (MOCK_AUTH_ENABLED) {
    return readMockItems()
      .filter((i) => (i.status === "ready" || i.status === "draft") && !i.scheduledFor)
      .map(mockItemToPost);
  }

  const supabase = createClient();
  const wsId = await getWorkspaceId(supabase);

  const { data, error } = await supabase
    .from("generations")
    .select(`
      id, platform, status, scheduled_for, published_at, generated_content, created_at,
      content_items (title)
    `)
    .eq("workspace_id", wsId)
    .in("status", ["ready", "draft"])
    .is("scheduled_for", null)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("Failed to fetch unscheduled posts:", error);
    return [];
  }

  return (data as any[]).map(mapRow);
}

/**
 * Get stats for a given month.
 */
export async function getMonthStats(
  year: number,
  month: number
): Promise<{ scheduled: number; published: number; drafts: number; ready: number }> {
  const startDate = new Date(year, month, 1).getTime();
  const endDate = new Date(year, month + 1, 0, 23, 59, 59).getTime();

  if (MOCK_AUTH_ENABLED) {
    let scheduled = 0, published = 0, drafts = 0, ready = 0;

    for (const item of readMockItems()) {
      const post = mockItemToPost(item);
      const refDate = post.scheduledFor || post.publishedAt || post.createdAt;
      const t = new Date(refDate).getTime();
      if (t < startDate || t > endDate) continue;

      if (post.status === "scheduled") scheduled++;
      else if (post.status === "published") published++;
      else if (post.status === "draft") drafts++;
      else if (post.status === "ready") ready++;
    }

    return { scheduled, published, drafts, ready };
  }

  const supabase = createClient();
  const wsId = await getWorkspaceId(supabase);

  const { data, error } = await supabase
    .from("generations")
    .select("status, scheduled_for, published_at, created_at")
    .eq("workspace_id", wsId);

  if (error || !data) {
    console.error("Failed to fetch month stats:", error);
    return { scheduled: 0, published: 0, drafts: 0, ready: 0 };
  }

  let scheduled = 0, published = 0, drafts = 0, ready = 0;

  for (const row of data as any[]) {
    const refDate = row.scheduled_for || row.published_at || row.created_at;
    const t = new Date(refDate).getTime();
    if (t < startDate || t > endDate) continue;

    const displayStatus = deriveStatus(row.status, row.scheduled_for);
    if (displayStatus === "scheduled") scheduled++;
    else if (displayStatus === "published") published++;
    else if (displayStatus === "draft") drafts++;
    else if (displayStatus === "ready") ready++;
  }

  return { scheduled, published, drafts, ready };
}

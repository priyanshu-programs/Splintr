/**
 * scheduling-store.ts
 *
 * Dual-mode scheduling layer for the Scheduling page.
 * - Mock mode (NEXT_PUBLIC_MOCK_AUTH=true): uses localStorage
 * - Real mode: uses Supabase
 */

import { MOCK_AUTH_ENABLED } from "@/lib/auth/mock-auth";
import { createClient } from "@/lib/supabase/client";

/* ── Types ── */

export interface ScheduledPost {
  id: string;
  title: string;
  platform: string;
  status: "scheduled" | "published" | "draft";
  scheduledFor: string | null;
  publishedAt: string | null;
  content: string;
  createdAt: string;
}

/* ── localStorage helpers ── */

const STORAGE_KEY = "splintr_scheduled_posts";

function readLocalPosts(): ScheduledPost[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalPosts(posts: ScheduledPost[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

/** Seed sample data into localStorage when empty. */
function seedIfEmpty(): ScheduledPost[] {
  const existing = readLocalPosts();
  if (existing.length > 0) return existing;

  const now = new Date();

  function offsetDate(days: number, hours: number = 0, minutes: number = 0): Date {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(hours, minutes, 0, 0);
    return d;
  }

  const seed: ScheduledPost[] = [
    {
      id: "sched-1",
      title: "AI Marketing Strategy",
      platform: "linkedin",
      status: "scheduled",
      scheduledFor: offsetDate(1, 10, 0).toISOString(),
      publishedAt: null,
      content: "How AI is transforming marketing strategy for modern businesses...",
      createdAt: now.toISOString(),
    },
    {
      id: "sched-2",
      title: "Quick Product Update",
      platform: "x",
      status: "scheduled",
      scheduledFor: offsetDate(2, 14, 0).toISOString(),
      publishedAt: null,
      content: "Excited to share our latest product updates...",
      createdAt: now.toISOString(),
    },
    {
      id: "sched-3",
      title: "Behind the Scenes",
      platform: "instagram",
      status: "draft",
      scheduledFor: null,
      publishedAt: null,
      content: "A peek behind the curtain at our creative process...",
      createdAt: offsetDate(-2).toISOString(),
    },
    {
      id: "sched-4",
      title: "Content Repurposing Guide",
      platform: "blog",
      status: "published",
      scheduledFor: offsetDate(-1, 9, 0).toISOString(),
      publishedAt: offsetDate(-1, 9, 0).toISOString(),
      content: "The ultimate guide to repurposing your content across platforms...",
      createdAt: offsetDate(-3).toISOString(),
    },
    {
      id: "sched-5",
      title: "Weekly Thread",
      platform: "x",
      status: "published",
      scheduledFor: offsetDate(-2, 11, 0).toISOString(),
      publishedAt: offsetDate(-2, 11, 0).toISOString(),
      content: "Thread: 10 things I learned about content creation this week...",
      createdAt: offsetDate(-4).toISOString(),
    },
    {
      id: "sched-6",
      title: "Team Productivity Tips",
      platform: "linkedin",
      status: "draft",
      scheduledFor: null,
      publishedAt: null,
      content: "5 productivity tips our team swears by for remote work...",
      createdAt: offsetDate(-5).toISOString(),
    },
  ];

  writeLocalPosts(seed);
  return seed;
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
 * Get all posts in a date range.
 */
export async function getScheduledPosts(startDate: string, endDate: string): Promise<ScheduledPost[]> {
  if (MOCK_AUTH_ENABLED) {
    const posts = seedIfEmpty();
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    return posts.filter((p) => {
      const sFor = p.scheduledFor ? new Date(p.scheduledFor).getTime() : null;
      const pAt = p.publishedAt ? new Date(p.publishedAt).getTime() : null;
      const created = new Date(p.createdAt).getTime();

      // Include if scheduledFor or publishedAt falls in range
      if (sFor && sFor >= start && sFor <= end) return true;
      if (pAt && pAt >= start && pAt <= end) return true;
      // Include drafts based on createdAt
      if (p.status === "draft" && created >= start && created <= end) return true;
      return false;
    });
  }

  // Real Supabase mode
  const supabase = createClient();
  const wsId = await getWorkspaceId(supabase);

  const { data, error } = await supabase
    .from("generations")
    .select(`
      id, platform, status, scheduled_for, published_at, generated_content, created_at,
      content_items (title)
    `)
    .eq("workspace_id", wsId)
    .or(
      `scheduled_for.gte.${startDate},scheduled_for.lte.${endDate},` +
      `published_at.gte.${startDate},published_at.lte.${endDate},` +
      `status.in.(scheduled,published,draft)`
    )
    .order("scheduled_for", { ascending: true });

  if (error || !data) {
    console.error("Failed to fetch scheduled posts:", error);
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    title: row.content_items?.title || "Untitled",
    platform: row.platform,
    status: row.status,
    scheduledFor: row.scheduled_for,
    publishedAt: row.published_at,
    content: row.generated_content || "",
    createdAt: row.created_at,
  }));
}

/**
 * Schedule a post for a specific date/time.
 */
export async function schedulePost(generationId: string, scheduledFor: string): Promise<void> {
  if (MOCK_AUTH_ENABLED) {
    const posts = readLocalPosts();
    const idx = posts.findIndex((p) => p.id === generationId);
    if (idx !== -1) {
      posts[idx].scheduledFor = scheduledFor;
      posts[idx].status = "scheduled";
      writeLocalPosts(posts);
    }
    return;
  }

  const supabase = createClient();
  const { error } = await (supabase
    .from("generations") as any)
    .update({ scheduled_for: scheduledFor, status: "scheduled" })
    .eq("id", generationId);

  if (error) {
    throw new Error(error.message || "Failed to schedule post");
  }
}

/**
 * Unschedule a post — clear scheduled_for, set status to draft.
 */
export async function unschedulePost(generationId: string): Promise<void> {
  if (MOCK_AUTH_ENABLED) {
    const posts = readLocalPosts();
    const idx = posts.findIndex((p) => p.id === generationId);
    if (idx !== -1) {
      posts[idx].scheduledFor = null;
      posts[idx].status = "draft";
      writeLocalPosts(posts);
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

  const startDate = now.toISOString();
  const endDate = weekLater.toISOString();

  if (MOCK_AUTH_ENABLED) {
    const posts = seedIfEmpty();
    return posts
      .filter((p) => {
        if (p.status !== "scheduled" || !p.scheduledFor) return false;
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
    .eq("status", "scheduled")
    .gte("scheduled_for", startDate)
    .lte("scheduled_for", endDate)
    .order("scheduled_for", { ascending: true });

  if (error || !data) {
    console.error("Failed to fetch upcoming posts:", error);
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    title: row.content_items?.title || "Untitled",
    platform: row.platform,
    status: row.status,
    scheduledFor: row.scheduled_for,
    publishedAt: row.published_at,
    content: row.generated_content || "",
    createdAt: row.created_at,
  }));
}

/**
 * Get stats for a given month.
 */
export async function getMonthStats(
  year: number,
  month: number
): Promise<{ scheduled: number; published: number; drafts: number }> {
  const startDate = new Date(year, month, 1).toISOString();
  const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

  if (MOCK_AUTH_ENABLED) {
    const posts = seedIfEmpty();
    let scheduled = 0;
    let published = 0;
    let drafts = 0;

    for (const p of posts) {
      const refDate = p.scheduledFor || p.publishedAt || p.createdAt;
      const t = new Date(refDate).getTime();
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();

      if (t >= start && t <= end) {
        if (p.status === "scheduled") scheduled++;
        else if (p.status === "published") published++;
        else if (p.status === "draft") drafts++;
      }
    }

    return { scheduled, published, drafts };
  }

  const supabase = createClient();
  const wsId = await getWorkspaceId(supabase);

  const { data, error } = await supabase
    .from("generations")
    .select("status, scheduled_for, published_at, created_at")
    .eq("workspace_id", wsId)
    .in("status", ["scheduled", "published", "draft"])
    .or(
      `scheduled_for.gte.${startDate},scheduled_for.lte.${endDate},` +
      `published_at.gte.${startDate},published_at.lte.${endDate},` +
      `created_at.gte.${startDate},created_at.lte.${endDate}`
    );

  if (error || !data) {
    console.error("Failed to fetch month stats:", error);
    return { scheduled: 0, published: 0, drafts: 0 };
  }

  let scheduled = 0;
  let published = 0;
  let drafts = 0;

  for (const row of data as any[]) {
    if (row.status === "scheduled") scheduled++;
    else if (row.status === "published") published++;
    else if (row.status === "draft") drafts++;
  }

  return { scheduled, published, drafts };
}

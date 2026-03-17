/**
 * analytics-store.ts
 *
 * Dual-mode analytics data layer.
 * - Mock mode (NEXT_PUBLIC_MOCK_AUTH=true): derives stats from localStorage
 * - Real mode: queries Supabase generations, content_items, usage_logs
 */

import { MOCK_AUTH_ENABLED } from "@/lib/auth/mock-auth";
import { createClient } from "@/lib/supabase/client";
import { getAggregatedMetrics, getTopByEngagement } from "@/lib/metrics-store";

/* ── Types ── */

export interface OverviewStats {
  totalGenerations: number;
  publishedPosts: number;
  scheduledPosts: number;
  avgEngagement: string;
  changes: {
    generations: string;
    published: string;
    scheduled: string;
    engagement: string;
  };
}

export interface PlatformStat {
  platform: string;
  posts: number;
  published: number;
  impressions: string;
  engagement: string;
  barWidth: string;
}

export interface TopItem {
  title: string;
  engagement: string;
  impressions: string;
}

export interface WeeklyActivityPoint {
  day: string;
  generations: number;
  published: number;
  scheduled: number;
}

/* ── localStorage helpers ── */

const STORAGE_KEY = "splintr_approved_items";

interface StoredItem {
  id: string;
  platform: string;
  status: string;
  createdAt: string;
  title: string;
  wordCount: number;
}

function readLocalItems(): StoredItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getDaysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function periodToDays(period: string): number {
  if (period === "30d") return 30;
  if (period === "90d") return 90;
  return 7;
}

/** Format a date label appropriate for the period */
function formatDateLabel(dateStr: string, period: string): string {
  const d = new Date(dateStr + "T12:00:00");
  if (period === "7d") {
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
  }
  // 30d/90d: show "Mar 1", "Feb 15" etc.
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

/** Format large numbers: 1200 → "1.2K", 1500000 → "1.5M" */
function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/* ── Public API ── */

export async function getAnalyticsOverview(period: string = "7d"): Promise<OverviewStats> {
  const days = periodToDays(period);

  // Fetch real engagement metrics
  const aggregated = await getAggregatedMetrics(period);
  const hasMetrics = aggregated.totalImpressions > 0;

  if (MOCK_AUTH_ENABLED) {
    const items = readLocalItems();
    const cutoff = getDaysAgo(days);
    const filtered = items.filter((i) => new Date(i.createdAt) >= cutoff);
    const published = filtered.filter((i) => i.status === "published").length;
    const scheduled = filtered.filter((i) => i.status === "scheduled").length;

    // Compare with previous period for change indicators
    const prevCutoff = getDaysAgo(days * 2);
    const prevFiltered = items.filter((i) => {
      const d = new Date(i.createdAt);
      return d >= prevCutoff && d < cutoff;
    });
    const prevPublished = prevFiltered.filter((i) => i.status === "published").length;
    const prevScheduled = prevFiltered.filter((i) => i.status === "scheduled").length;

    const genChange = filtered.length - prevFiltered.length;
    const pubChange = published - prevPublished;
    const schChange = scheduled - prevScheduled;

    // Use real engagement rate if we have metrics, else fall back to publish rate
    const engRate = hasMetrics
      ? `${aggregated.avgEngagementRate}%`
      : filtered.length > 0
        ? `${(published / filtered.length * 100).toFixed(1)}%`
        : "—";

    return {
      totalGenerations: filtered.length,
      publishedPosts: published,
      scheduledPosts: scheduled,
      avgEngagement: engRate,
      changes: {
        generations: genChange >= 0 ? `+${genChange}` : `${genChange}`,
        published: pubChange >= 0 ? `+${pubChange}` : `${pubChange}`,
        scheduled: schChange >= 0 ? `+${schChange}` : `${schChange}`,
        engagement: hasMetrics ? `${aggregated.totalImpressions} imp` : "—",
      },
    };
  }

  const supabase = createClient();
  const wsId = await getWorkspaceId(supabase);
  const cutoff = getDaysAgo(days).toISOString();

  const { data: generations } = await supabase
    .from("generations")
    .select("id, status, scheduled_for, published_at, created_at")
    .eq("workspace_id", wsId)
    .gte("created_at", cutoff);

  const items = (generations as any[]) || [];
  const published = items.filter((g) => g.status === "published").length;
  const scheduled = items.filter((g) => g.status === "scheduled").length;

  const engRate = hasMetrics
    ? `${aggregated.avgEngagementRate}%`
    : items.length > 0
      ? `${(published / items.length * 100).toFixed(1)}%`
      : "—";

  return {
    totalGenerations: items.length,
    publishedPosts: published,
    scheduledPosts: scheduled,
    avgEngagement: engRate,
    changes: {
      generations: items.length > 0 ? `+${items.length}` : "0",
      published: published > 0 ? `+${published}` : "0",
      scheduled: scheduled > 0 ? `+${scheduled}` : "0",
      engagement: hasMetrics ? `${aggregated.totalImpressions} imp` : "—",
    },
  };
}

export async function getPlatformBreakdown(period: string = "7d"): Promise<PlatformStat[]> {
  const days = periodToDays(period);

  if (MOCK_AUTH_ENABLED) {
    const items = readLocalItems();
    const cutoff = getDaysAgo(days);
    const filtered = items.filter((i) => new Date(i.createdAt) >= cutoff);
    const byPlatform = new Map<string, { posts: number; published: number }>();

    for (const item of filtered) {
      const p = item.platform || "unknown";
      const existing = byPlatform.get(p) || { posts: 0, published: 0 };
      existing.posts++;
      if (item.status === "published") existing.published++;
      byPlatform.set(p, existing);
    }

    const maxPosts = Math.max(...Array.from(byPlatform.values()).map((v) => v.posts), 1);
    return Array.from(byPlatform.entries()).map(([platform, stats]) => ({
      platform,
      posts: stats.posts,
      published: stats.published,
      impressions: "—",
      engagement: "—",
      barWidth: `${Math.round((stats.posts / maxPosts) * 100)}%`,
    }));
  }

  const supabase = createClient();
  const wsId = await getWorkspaceId(supabase);
  const cutoff = getDaysAgo(days).toISOString();

  const { data: generations } = await supabase
    .from("generations")
    .select("platform, status, created_at")
    .eq("workspace_id", wsId)
    .gte("created_at", cutoff);

  const items = (generations as any[]) || [];
  const byPlatform = new Map<string, { posts: number; published: number }>();

  for (const g of items) {
    const existing = byPlatform.get(g.platform) || { posts: 0, published: 0 };
    existing.posts++;
    if (g.status === "published") existing.published++;
    byPlatform.set(g.platform, existing);
  }

  const maxPosts = Math.max(...Array.from(byPlatform.values()).map((v) => v.posts), 1);
  return Array.from(byPlatform.entries()).map(([platform, stats]) => ({
    platform,
    posts: stats.posts,
    published: stats.published,
    impressions: "—",
    engagement: "—",
    barWidth: `${Math.round((stats.posts / maxPosts) * 100)}%`,
  }));
}

export async function getTopPerforming(period: string = "7d"): Promise<TopItem[]> {
  const days = periodToDays(period);

  // Try to get real engagement-based top performers first
  const topByEngagement = await getTopByEngagement(period, 4);
  if (topByEngagement.length > 0) {
    return topByEngagement.map((p) => ({
      title: p.title,
      engagement: `${p.engagementRate}%`,
      impressions: formatNumber(p.impressions),
    }));
  }

  // Fall back to generation-count ranking if no metrics exist
  if (MOCK_AUTH_ENABLED) {
    const items = readLocalItems();
    const cutoff = getDaysAgo(days);
    const filtered = items.filter((i) => new Date(i.createdAt) >= cutoff);
    const byTitle = new Map<string, number>();
    for (const item of filtered) {
      byTitle.set(item.title, (byTitle.get(item.title) || 0) + 1);
    }
    return Array.from(byTitle.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([title, count]) => ({
        title,
        engagement: "—",
        impressions: `${count} gen${count > 1 ? "s" : ""}`,
      }));
  }

  const supabase = createClient();
  const wsId = await getWorkspaceId(supabase);
  const cutoff = getDaysAgo(days).toISOString();

  const { data: contentItems } = await supabase
    .from("content_items")
    .select("id, title, generations(id, created_at)")
    .eq("workspace_id", wsId)
    .order("created_at", { ascending: false })
    .limit(20);

  const items = (contentItems as any[]) || [];
  return items
    .map((ci) => ({
      title: ci.title || "Untitled",
      count: (ci.generations || []).filter((g: any) => !g.created_at || g.created_at >= cutoff).length,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)
    .map((item) => ({
      title: item.title,
      engagement: "—",
      impressions: `${item.count} gen${item.count > 1 ? "s" : ""}`,
    }));
}

export async function getWeeklyActivity(period: string = "7d"): Promise<WeeklyActivityPoint[]> {
  const days = periodToDays(period);

  // For 7d show 7 daily points, 30d show ~10 points (every 3 days), 90d show ~12 points (weekly)
  const bucketSize = period === "7d" ? 1 : period === "30d" ? 3 : 7;

  if (MOCK_AUTH_ENABLED) {
    const items = readLocalItems();
    const cutoff = getDaysAgo(days);
    const filtered = items.filter((i) => new Date(i.createdAt) >= cutoff);

    // Group by date
    const byDate = new Map<string, { generations: number; published: number; scheduled: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      byDate.set(key, { generations: 0, published: 0, scheduled: 0 });
    }

    for (const item of filtered) {
      const key = item.createdAt.split("T")[0];
      const entry = byDate.get(key);
      if (entry) {
        entry.generations++;
        if (item.status === "published") entry.published++;
        if (item.status === "scheduled") entry.scheduled++;
      }
    }

    // Sort chronologically then bucket into display points
    const sorted = Array.from(byDate.entries()).sort(([a], [b]) => a.localeCompare(b));
    return bucketDates(sorted, bucketSize, period);
  }

  const supabase = createClient();
  const wsId = await getWorkspaceId(supabase);
  const cutoffISO = getDaysAgo(days).toISOString();

  const { data: generations } = await supabase
    .from("generations")
    .select("status, created_at")
    .eq("workspace_id", wsId)
    .gte("created_at", cutoffISO);

  const items = (generations as any[]) || [];
  const byDate = new Map<string, { generations: number; published: number; scheduled: number }>();

  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    byDate.set(key, { generations: 0, published: 0, scheduled: 0 });
  }

  for (const g of items) {
    const key = g.created_at?.split("T")[0];
    const entry = byDate.get(key);
    if (entry) {
      entry.generations++;
      if (g.status === "published") entry.published++;
      if (g.status === "scheduled") entry.scheduled++;
    }
  }

  const sorted = Array.from(byDate.entries()).sort(([a], [b]) => a.localeCompare(b));
  return bucketDates(sorted, bucketSize, period);
}

/** Aggregate daily entries into display buckets */
function bucketDates(
  sorted: [string, { generations: number; published: number; scheduled: number }][],
  bucketSize: number,
  period: string,
): WeeklyActivityPoint[] {
  const result: WeeklyActivityPoint[] = [];
  for (let i = 0; i < sorted.length; i += bucketSize) {
    const chunk = sorted.slice(i, i + bucketSize);
    const totals = { generations: 0, published: 0, scheduled: 0 };
    for (const [, stats] of chunk) {
      totals.generations += stats.generations;
      totals.published += stats.published;
      totals.scheduled += stats.scheduled;
    }
    // Use the last date in the bucket for the label
    const labelDate = chunk[chunk.length - 1][0];
    result.push({ day: formatDateLabel(labelDate, period), ...totals });
  }
  return result;
}

/* ── Internal helpers ── */

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

/**
 * metrics-store.ts
 *
 * Dual-mode storage layer for post engagement metrics.
 * - Mock mode: uses localStorage
 * - Real mode: stores in generations.metadata.metrics via Supabase
 *
 * Tracks: impressions, likes, comments, shares, clicks per published post.
 */

import { MOCK_AUTH_ENABLED } from "@/lib/auth/mock-auth";
import { createClient } from "@/lib/supabase/client";

/* ── Types ── */

export interface PostMetrics {
  generationId: string;
  platform: string;
  title: string;
  publishedUrl: string | null;
  publishedAt: string | null;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  engagementRate: number; // (likes + comments + shares + clicks) / impressions * 100
  lastFetchedAt: string;
}

export interface AggregatedMetrics {
  totalImpressions: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalClicks: number;
  avgEngagementRate: number;
}

/* ── localStorage helpers ── */

const METRICS_KEY = "splintr_post_metrics";

function readLocalMetrics(): PostMetrics[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(METRICS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalMetrics(metrics: PostMetrics[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(METRICS_KEY, JSON.stringify(metrics));
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
 * Save metrics for a published post.
 */
export async function savePostMetrics(metrics: PostMetrics): Promise<void> {
  if (MOCK_AUTH_ENABLED) {
    const all = readLocalMetrics();
    const idx = all.findIndex((m) => m.generationId === metrics.generationId);
    if (idx !== -1) {
      all[idx] = metrics;
    } else {
      all.push(metrics);
    }
    writeLocalMetrics(all);
    return;
  }

  const supabase = createClient();
  // Store metrics in generations.metadata.metrics
  const { error } = await (supabase
    .from("generations") as any)
    .update({
      metadata: {
        metrics: {
          impressions: metrics.impressions,
          likes: metrics.likes,
          comments: metrics.comments,
          shares: metrics.shares,
          clicks: metrics.clicks,
          engagementRate: metrics.engagementRate,
          lastFetchedAt: metrics.lastFetchedAt,
        },
      },
    })
    .eq("id", metrics.generationId);

  if (error) {
    console.error("Failed to save post metrics:", error);
  }
}

/**
 * Get metrics for all published posts in a given period.
 */
export async function getPostMetrics(period: string = "7d"): Promise<PostMetrics[]> {
  const days = period === "90d" ? 90 : period === "30d" ? 30 : 7;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);

  if (MOCK_AUTH_ENABLED) {
    const all = readLocalMetrics();
    return all.filter((m) => {
      if (!m.publishedAt) return false;
      return new Date(m.publishedAt) >= cutoff;
    });
  }

  const supabase = createClient();
  const wsId = await getWorkspaceId(supabase);

  const { data: generations } = await supabase
    .from("generations")
    .select("id, platform, status, published_at, published_url, metadata, content_item_id")
    .eq("workspace_id", wsId)
    .eq("status", "published")
    .gte("published_at", cutoff.toISOString());

  if (!generations) return [];

  // Also fetch content item titles
  const contentItemIds = [...new Set((generations as any[]).map((g) => g.content_item_id).filter(Boolean))];
  const titleMap = new Map<string, string>();

  if (contentItemIds.length > 0) {
    const { data: items } = await supabase
      .from("content_items")
      .select("id, title")
      .in("id", contentItemIds);

    if (items) {
      for (const item of items as any[]) {
        titleMap.set(item.id, item.title || "Untitled");
      }
    }
  }

  return (generations as any[]).map((g) => {
    const metrics = g.metadata?.metrics || {};
    return {
      generationId: g.id,
      platform: g.platform,
      title: titleMap.get(g.content_item_id) || "Untitled",
      publishedUrl: g.published_url,
      publishedAt: g.published_at,
      impressions: metrics.impressions || 0,
      likes: metrics.likes || 0,
      comments: metrics.comments || 0,
      shares: metrics.shares || 0,
      clicks: metrics.clicks || 0,
      engagementRate: metrics.engagementRate || 0,
      lastFetchedAt: metrics.lastFetchedAt || "",
    };
  });
}

/**
 * Get aggregated metrics across all published posts in a period.
 */
export async function getAggregatedMetrics(period: string = "7d"): Promise<AggregatedMetrics> {
  const posts = await getPostMetrics(period);

  if (posts.length === 0) {
    return {
      totalImpressions: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalClicks: 0,
      avgEngagementRate: 0,
    };
  }

  const totals = posts.reduce(
    (acc, p) => ({
      impressions: acc.impressions + p.impressions,
      likes: acc.likes + p.likes,
      comments: acc.comments + p.comments,
      shares: acc.shares + p.shares,
      clicks: acc.clicks + p.clicks,
    }),
    { impressions: 0, likes: 0, comments: 0, shares: 0, clicks: 0 }
  );

  const avgEngagement =
    totals.impressions > 0
      ? ((totals.likes + totals.comments + totals.shares + totals.clicks) / totals.impressions) * 100
      : 0;

  return {
    totalImpressions: totals.impressions,
    totalLikes: totals.likes,
    totalComments: totals.comments,
    totalShares: totals.shares,
    totalClicks: totals.clicks,
    avgEngagementRate: Math.round(avgEngagement * 10) / 10,
  };
}

/**
 * Get top performing posts by engagement rate.
 */
export async function getTopByEngagement(period: string = "7d", limit: number = 4): Promise<PostMetrics[]> {
  const posts = await getPostMetrics(period);
  return posts
    .filter((p) => p.impressions > 0)
    .sort((a, b) => b.engagementRate - a.engagementRate)
    .slice(0, limit);
}

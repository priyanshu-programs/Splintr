"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  Share2,
  RefreshCw,
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  Linkedin,
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  Twitter,
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  Instagram,
  BookOpen,
  Youtube,
  Calendar,
} from "lucide-react";
import GenerationChart from "@/components/ui/GenerationChart";
import type { ChartDataPoint } from "@/components/ui/GenerationChart";
import {
  getAnalyticsOverview,
  getPlatformBreakdown,
  getTopPerforming,
  getWeeklyActivity,
  type OverviewStats,
  type PlatformStat,
  type TopItem,
} from "@/lib/analytics-store";

const platformIcons: Record<string, typeof BookOpen> = {
  linkedin: Linkedin,
  x: Twitter,
  instagram: Instagram,
  blog: BookOpen,
  youtube: Youtube,
  "video-short": Youtube,
  "video-long": Youtube,
};

const platformLabels: Record<string, string> = {
  linkedin: "LinkedIn",
  x: "X / Twitter",
  instagram: "Instagram",
  blog: "Blog",
  youtube: "YouTube",
  "video-short": "Short Video",
  "video-long": "Long Video",
};

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-foreground/5 rounded ${className}`} />;
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("7d");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [platforms, setPlatforms] = useState<PlatformStat[]>([]);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      getAnalyticsOverview(period),
      getPlatformBreakdown(period),
      getTopPerforming(period),
      getWeeklyActivity(period),
    ]).then(([ov, pl, top, chart]) => {
      setOverview(ov);
      setPlatforms(pl);
      setTopItems(top);
      setChartData(chart);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const handleRefreshMetrics = async () => {
    setRefreshing(true);
    try {
      await fetch("/api/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period }),
      });
      loadData();
    } catch {
      // Silently fail — data will show stale metrics
    } finally {
      setRefreshing(false);
    }
  };

  const overviewCards = overview
    ? [
      { label: "Total Generations", value: String(overview.totalGenerations), change: overview.changes.generations, up: !overview.changes.generations.startsWith("-"), icon: Eye },
      { label: "Published Posts", value: String(overview.publishedPosts), change: overview.changes.published, up: !overview.changes.published.startsWith("-"), icon: Heart },
      { label: "Scheduled", value: String(overview.scheduledPosts), change: overview.changes.scheduled, up: !overview.changes.scheduled.startsWith("-"), icon: Calendar },
      { label: "Engagement Rate", value: overview.avgEngagement, change: overview.changes.engagement, up: true, icon: Share2 },
    ]
    : [];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-sans text-2xl font-bold tracking-tight text-[var(--sp-fg)]">Analytics</h1>
          <p className="font-mono text-sm text-[var(--sp-fg-light)] mt-1">Track your content performance across platforms</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefreshMetrics}
            disabled={refreshing}
            className="h-9 px-3 text-xs font-mono font-bold text-[#6A6D75] hover:text-[var(--sp-fg)] border border-foreground/5 dark:border-white/5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing…" : "Refresh Metrics"}
          </button>
          <div className="flex bg-background dark:bg-[#121214] border border-foreground/5 dark:border-white/5 rounded-lg overflow-hidden">
          {(["7d", "30d", "90d"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`h-9 px-4 text-xs font-mono font-bold transition-colors ${period === p ? "bg-[var(--sp-fg)] text-background" : "text-[#6A6D75] hover:text-[var(--sp-fg)]"
                }`}
            >
              {p}
            </button>
          ))}
          </div>
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-background dark:bg-[#121214] rounded-xl p-5 border border-foreground/5 dark:border-white/5">
              <Skeleton className="h-3 w-24 mb-4" />
              <Skeleton className="h-7 w-16" />
            </div>
          ))
          : overviewCards.map((stat) => (
            <div key={stat.label} className="bg-background dark:bg-[#121214] rounded-xl p-5 border border-foreground/5 dark:border-white/5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold text-[#6A6D75] uppercase tracking-wider">{stat.label}</span>
                <stat.icon className="w-4 h-4 text-[#6A6D75]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight">{stat.value}</span>
                {stat.change !== "0" && stat.change !== "—" && (
                  <span className={`text-xs font-mono font-bold flex items-center gap-0.5 ${stat.up ? "text-[#27C93F]" : "text-red-500"}`}>
                    {stat.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {stat.change}
                  </span>
                )}
              </div>
            </div>
          ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6 mb-8">
        {/* Activity chart */}
        <div className="lg:col-span-3 bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-6 h-[400px]">
          {loading ? (
            <div className="h-full flex flex-col">
              <Skeleton className="h-5 w-48 mb-6" />
              <Skeleton className="flex-1" />
            </div>
          ) : (
            <GenerationChart data={chartData} />
          )}
        </div>

        {/* Top content */}
        <div className="lg:col-span-2 bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-6">
          <h3 className="font-semibold mb-1">Top Performing</h3>
          <p className="text-xs text-[#6A6D75] mb-4">By engagement rate</p>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-5" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : topItems.length === 0 ? (
            <p className="text-sm text-[#6A6D75] py-8 text-center">No content yet. Generate some content to see stats here.</p>
          ) : (
            <div className="space-y-4">
              {topItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-[#6A6D75] w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-[#6A6D75]">{item.impressions}</p>
                  </div>
                  {item.engagement !== "—" && (
                    <span className="text-xs font-mono font-bold text-[#27C93F]">{item.engagement}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Platform breakdown */}
      <div className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5">
        <div className="p-6 border-b border-foreground/5 dark:border-white/5">
          <h3 className="font-semibold">Platform Breakdown</h3>
        </div>
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-6">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="flex-1 h-2 rounded-full" />
              </div>
            ))}
          </div>
        ) : platforms.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#6A6D75]">
            No platform data yet. Generate content to see breakdown.
          </div>
        ) : (
          <div className="divide-y divide-black/5">
            {platforms.map((p) => {
              const Icon = platformIcons[p.platform] || BookOpen;
              return (
                <div key={p.platform} className="p-5 flex items-center gap-6">
                  <div className="w-10 h-10 rounded-lg bg-[var(--sp-bg)] flex items-center justify-center text-[#6A6D75] shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="w-28 shrink-0">
                    <div className="text-sm font-semibold">{platformLabels[p.platform] || p.platform}</div>
                    <div className="text-xs text-[#6A6D75]">{p.posts} posts</div>
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-[var(--sp-bg)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--sp-fg)] rounded-full" style={{ width: p.barWidth }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6 text-center shrink-0">
                    <div>
                      <div className="text-sm font-bold">{p.posts}</div>
                      <div className="text-xs text-[#6A6D75]">Generated</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold">{p.published}</div>
                      <div className="text-xs text-[#6A6D75]">Published</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

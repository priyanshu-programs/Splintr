"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import Skeleton from "@/components/ui/Skeleton";
import GenerationChart from "@/components/ui/GenerationChart";
import type { Generation, PlatformType } from "@/lib/supabase/types";
import {
  PenSquare,
  ArrowUpRight,
  Clock,
  Zap,
  TrendingUp,
  BarChart3,
  Calendar,
  FileText,
  Linkedin,
  Twitter,
  Instagram,
} from "lucide-react";

const platformIcon: Record<string, React.ReactNode> = {
  linkedin: <Linkedin className="w-3.5 h-3.5" />,
  x: <Twitter className="w-3.5 h-3.5" />,
  instagram: <Instagram className="w-3.5 h-3.5" />,
  blog: <FileText className="w-3.5 h-3.5" />,
};



interface UpcomingItem {
  id: string;
  platform: PlatformType;
  scheduled_for: string;
  content_title: string | null;
}

interface Stats {
  generationsThisMonth: number;
  publishedCount: number;
  scheduledCount: number;
}

export default function DashboardPage() {
  const { workspace } = useAuth();
  const [upcomingItems, setUpcomingItems] = useState<UpcomingItem[]>([]);
  const [stats, setStats] = useState<Stats>({ generationsThisMonth: 0, publishedCount: 0, scheduledCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspace) return;

    const supabase = createClient();
    const wsId = workspace.id;

    async function fetchData() {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [upcomingRes, monthCountRes, publishedRes, scheduledRes] = await Promise.all([
        // Upcoming scheduled
        supabase
          .from("generations")
          .select("id, platform, scheduled_for, content_items(title)")
          .eq("workspace_id", wsId)
          .not("scheduled_for", "is", null)
          .gte("scheduled_for", new Date().toISOString())
          .order("scheduled_for", { ascending: true })
          .limit(4),
        // Count: generations this month
        supabase
          .from("generations")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", wsId)
          .gte("created_at", startOfMonth.toISOString()),
        // Count: published
        supabase
          .from("generations")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", wsId)
          .eq("status", "published"),
        // Count: scheduled
        supabase
          .from("generations")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", wsId)
          .eq("status", "scheduled"),
      ]);

      setUpcomingItems(
        (upcomingRes.data || []).map((g: any) => ({
          id: g.id,
          platform: g.platform,
          scheduled_for: g.scheduled_for,
          content_title: g.content_items?.title || null,
        }))
      );

      setStats({
        generationsThisMonth: monthCountRes.count ?? 0,
        publishedCount: publishedRes.count ?? 0,
        scheduledCount: scheduledRes.count ?? 0,
      });

      setLoading(false);
    }

    fetchData();
  }, [workspace]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Skeleton className="h-8 w-40 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-background dark:bg-[#121214] rounded-xl p-5 border border-foreground/5 dark:border-white/5">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="mb-4">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
          <div className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="mb-4">
                <Skeleton className="h-5 w-2/3 mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statItems = [
    { label: "Generations This Month", value: String(stats.generationsThisMonth), icon: Zap, color: "text-[var(--sp-green)]" },
    { label: "Published Posts", value: String(stats.publishedCount), icon: ArrowUpRight, color: "text-blue-500" },
    { label: "Scheduled", value: String(stats.scheduledCount), icon: Calendar, color: "text-orange-500" },
    { label: "Avg. Engagement", value: "N/A", icon: TrendingUp, color: "text-purple-500" },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-sans text-2xl font-bold tracking-tight text-[var(--sp-fg)]">Dashboard</h1>
        <p className="font-mono text-sm text-[var(--sp-fg-light)] mt-1">Overview of your content pipeline</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statItems.map((stat) => (
          <div key={stat.label} className="bg-background dark:bg-[#121214] rounded-xl p-5 border border-foreground/5 dark:border-white/5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-extrabold text-[var(--sp-fg-light)] uppercase tracking-[0.15em]">{stat.label}</span>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight">{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Content Activity */}
        <div className="lg:col-span-2 bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-6 h-[400px]">
          <GenerationChart />
        </div>

        {/* Upcoming schedule */}
        <div className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5">
          <div className="flex items-center justify-between p-5 border-b border-foreground/5 dark:border-white/5">
            <h2 className="font-semibold text-[var(--sp-fg)]">Upcoming</h2>
            <Link href="/library" className="text-xs font-mono font-extrabold tracking-[0.15em] uppercase text-[var(--sp-fg-light)] hover:text-[var(--sp-fg)] transition-colors">
              Calendar
            </Link>
          </div>
          {upcomingItems.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="w-7 h-7 text-[var(--sp-fg-light)]/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-[var(--sp-fg-light)]">Nothing scheduled yet</p>
              <p className="text-xs text-[var(--sp-fg-light)]/60 mt-1">Schedule content to see it here.</p>
            </div>
          ) : (
            <div className="divide-y divide-black/5">
              {upcomingItems.map((post) => (
                <div key={post.id} className="p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--sp-bg)] flex items-center justify-center text-[var(--sp-fg-light)] shrink-0 mt-0.5">
                    {platformIcon[post.platform] || <FileText className="w-3.5 h-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{post.content_title || "Untitled"}</p>
                    <p className="text-xs text-[var(--sp-fg-light)] mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(post.scheduled_for).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="p-4 border-t border-foreground/5 dark:border-white/5">
            <Link
              href="/create"
              className="w-full h-9 border border-dashed border-sp-fg/20 rounded-lg text-xs font-mono font-extrabold tracking-[0.15em] uppercase text-[var(--sp-fg-light)] flex items-center justify-center gap-1 hover:border-sp-fg/40 hover:text-[var(--sp-fg)] transition-colors"
            >
              + Schedule more content
            </Link>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Paste text or URL", icon: FileText, href: "/create" },
          { label: "Upload audio/video", icon: PenSquare, href: "/create" },
          { label: "View analytics", icon: BarChart3, href: "/analytics" },
          { label: "Manage voice profiles", icon: Zap, href: "/voice" },
        ].map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="bg-background dark:bg-[#121214] rounded-xl p-5 border border-foreground/5 dark:border-white/5 hover:border-sp-fg/20 dark:hover:border-white/20 hover:shadow-sm transition-all group"
          >
            <action.icon className="w-5 h-5 text-[var(--sp-fg-light)] group-hover:text-[var(--sp-fg)] dark:group-hover:text-white transition-colors mb-3" />
            <span className="text-sm font-medium">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

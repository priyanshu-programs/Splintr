"use client";

import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Zap,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Linkedin,
  Twitter,
  Instagram,
  BookOpen,
} from "lucide-react";
import GenerationChart from "@/components/ui/GenerationChart";

const overviewStats = [
  { label: "Total Impressions", value: "124.8K", change: "+18.3%", up: true, icon: Eye },
  { label: "Engagement Rate", value: "4.2%", change: "+0.8%", up: true, icon: Heart },
  { label: "Link Clicks", value: "2,340", change: "+22%", up: true, icon: TrendingUp },
  { label: "Shares", value: "891", change: "-3.1%", up: false, icon: Share2 },
];

const platformStats = [
  {
    platform: "LinkedIn",
    icon: Linkedin,
    followers: "12.4K",
    impressions: "68.2K",
    engagement: "5.8%",
    posts: 34,
    topPost: "How AI is Transforming Content Marketing",
    barWidth: "85%",
  },
  {
    platform: "X / Twitter",
    icon: Twitter,
    followers: "8.1K",
    impressions: "32.1K",
    engagement: "3.2%",
    posts: 48,
    topPost: "Thread on productivity frameworks",
    barWidth: "55%",
  },
  {
    platform: "Instagram",
    icon: Instagram,
    followers: "5.6K",
    impressions: "18.9K",
    engagement: "6.1%",
    posts: 22,
    topPost: "Content repurposing carousel",
    barWidth: "40%",
  },
  {
    platform: "Blog",
    icon: BookOpen,
    followers: "3.2K",
    impressions: "5.6K",
    engagement: "2.1%",
    posts: 8,
    topPost: "The Smart Creator's Guide",
    barWidth: "15%",
  },
];


export default function AnalyticsPage() {
  const [period, setPeriod] = useState("7d");

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-sans text-2xl font-bold tracking-tight text-[var(--sp-fg)]">Analytics</h1>
          <p className="font-mono text-sm text-[var(--sp-fg-light)] mt-1">Track your content performance across platforms</p>
        </div>
        <div className="flex bg-background dark:bg-[#121214] border border-foreground/5 dark:border-white/5 rounded-lg overflow-hidden">
          {["7d", "30d", "90d"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`h-9 px-4 text-xs font-mono font-bold transition-colors ${
                period === p ? "bg-[var(--sp-fg)] text-background" : "text-[#6A6D75] hover:text-[var(--sp-fg)]"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {overviewStats.map((stat) => (
          <div key={stat.label} className="bg-background dark:bg-[#121214] rounded-xl p-5 border border-foreground/5 dark:border-white/5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-[#6A6D75] uppercase tracking-wider">{stat.label}</span>
              <stat.icon className="w-4 h-4 text-[#6A6D75]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight">{stat.value}</span>
              <span className={`text-xs font-mono font-bold flex items-center gap-0.5 ${stat.up ? "text-[#27C93F]" : "text-red-500"}`}>
                {stat.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6 mb-8">
        {/* Activity chart */}
        <div className="lg:col-span-3 bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-6 h-[400px]">
          <GenerationChart />
        </div>

        {/* Top content */}
        <div className="lg:col-span-2 bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-6">
          <h3 className="font-semibold mb-1">Top Performing</h3>
          <p className="text-xs text-[#6A6D75] mb-4">By engagement rate</p>
          <div className="space-y-4">
            {[
              { title: "AI Content Marketing", engagement: "8.2%", impressions: "12.4K" },
              { title: "Personal Brand Tips", engagement: "6.8%", impressions: "8.9K" },
              { title: "Product Launch v2", engagement: "5.4%", impressions: "15.2K" },
              { title: "Remote Work Future", engagement: "4.1%", impressions: "6.3K" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-[#6A6D75] w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs text-[#6A6D75]">{item.impressions} impressions</p>
                </div>
                <span className="text-xs font-mono font-bold text-[#27C93F]">{item.engagement}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Platform breakdown */}
      <div className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5">
        <div className="p-6 border-b border-foreground/5 dark:border-white/5">
          <h3 className="font-semibold">Platform Breakdown</h3>
        </div>
        <div className="divide-y divide-black/5">
          {platformStats.map((p) => (
            <div key={p.platform} className="p-5 flex items-center gap-6">
              <div className="w-10 h-10 rounded-lg bg-[var(--sp-bg)] flex items-center justify-center text-[#6A6D75] shrink-0">
                <p.icon className="w-5 h-5" />
              </div>
              <div className="w-28 shrink-0">
                <div className="text-sm font-semibold">{p.platform}</div>
                <div className="text-xs text-[#6A6D75]">{p.followers} followers</div>
              </div>
              <div className="flex-1">
                <div className="h-2 bg-[var(--sp-bg)] rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--sp-fg)] rounded-full" style={{ width: p.barWidth }} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6 text-center shrink-0">
                <div>
                  <div className="text-sm font-bold">{p.impressions}</div>
                  <div className="text-xs text-[#6A6D75]">Impressions</div>
                </div>
                <div>
                  <div className="text-sm font-bold">{p.engagement}</div>
                  <div className="text-xs text-[#6A6D75]">Engagement</div>
                </div>
                <div>
                  <div className="text-sm font-bold">{p.posts}</div>
                  <div className="text-xs text-[#6A6D75]">Posts</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

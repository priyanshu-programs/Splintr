"use client";

import { useState, useMemo } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Linkedin,
  Twitter,
  Instagram,
  BookOpen,
  Plus,
  MoreHorizontal,
  X,
} from "lucide-react";

/* ── helpers ── */

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type ScheduledPost = {
  id: string;
  title: string;
  platform: string;
  icon: React.ComponentType<{ className?: string }>;
  date: string;       // ISO date string YYYY-MM-DD
  time: string;       // HH:MM
  status: "scheduled" | "published" | "draft";
};

const samplePosts: ScheduledPost[] = [
  {
    id: "1",
    title: "How AI is Transforming Content Marketing",
    platform: "LinkedIn",
    icon: Linkedin,
    date: new Date().toISOString().slice(0, 10),
    time: "09:00",
    status: "scheduled",
  },
  {
    id: "2",
    title: "Thread on productivity frameworks",
    platform: "X / Twitter",
    icon: Twitter,
    date: new Date().toISOString().slice(0, 10),
    time: "12:30",
    status: "scheduled",
  },
  {
    id: "3",
    title: "Content repurposing carousel",
    platform: "Instagram",
    icon: Instagram,
    date: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); })(),
    time: "14:00",
    status: "scheduled",
  },
  {
    id: "4",
    title: "The Smart Creator's Guide",
    platform: "Blog",
    icon: BookOpen,
    date: (() => { const d = new Date(); d.setDate(d.getDate() + 3); return d.toISOString().slice(0, 10); })(),
    time: "10:00",
    status: "draft",
  },
  {
    id: "5",
    title: "Remote Work Future — Insights",
    platform: "LinkedIn",
    icon: Linkedin,
    date: (() => { const d = new Date(); d.setDate(d.getDate() - 2); return d.toISOString().slice(0, 10); })(),
    time: "08:00",
    status: "published",
  },
  {
    id: "6",
    title: "5 tips for personal branding",
    platform: "X / Twitter",
    icon: Twitter,
    date: (() => { const d = new Date(); d.setDate(d.getDate() + 5); return d.toISOString().slice(0, 10); })(),
    time: "16:00",
    status: "scheduled",
  },
];

/* ── calendar grid builder ── */

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();

  const cells: { day: number; inMonth: boolean; dateStr: string }[] = [];

  // Previous month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevDays - i;
    const pm = month === 0 ? 11 : month - 1;
    const py = month === 0 ? year - 1 : year;
    cells.push({ day: d, inMonth: false, dateStr: `${py}-${String(pm + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}` });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, inMonth: true, dateStr: `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}` });
  }

  // Next month leading days
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const nm = month === 11 ? 0 : month + 1;
    const ny = month === 11 ? year + 1 : year;
    cells.push({ day: d, inMonth: false, dateStr: `${ny}-${String(nm + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}` });
  }

  return cells;
}

/* ── status badge ── */

function StatusBadge({ status }: { status: ScheduledPost["status"] }) {
  const styles: Record<string, string> = {
    scheduled: "bg-[var(--sp-fg)]/10 text-[var(--sp-fg)] border border-transparent",
    published: "bg-[var(--sp-bg)] text-[var(--sp-fg-light)] border border-[var(--sp-fg)]/20",
    draft: "bg-transparent text-[var(--sp-fg-light)] border border-dashed border-[var(--sp-fg)]/30",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${styles[status]}`}>
      {status}
    </span>
  );
}

/* ── page ── */

export default function SchedulingPage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string>(today.toISOString().slice(0, 10));
  const [view, setView] = useState<"calendar" | "list">("calendar");

  const todayStr = today.toISOString().slice(0, 10);
  const calendarDays = useMemo(() => getCalendarDays(currentYear, currentMonth), [currentYear, currentMonth]);

  // Group posts by date for calendar dots
  const postsByDate = useMemo(() => {
    const map: Record<string, ScheduledPost[]> = {};
    samplePosts.forEach((p) => {
      if (!map[p.date]) map[p.date] = [];
      map[p.date].push(p);
    });
    return map;
  }, []);

  const selectedPosts = postsByDate[selectedDate] || [];

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  // Upcoming posts (next 7 days)
  const upcomingPosts = useMemo(() => {
    const now = new Date();
    const weekLater = new Date();
    weekLater.setDate(now.getDate() + 7);
    return samplePosts
      .filter((p) => {
        const d = new Date(p.date);
        return d >= now && d <= weekLater && p.status === "scheduled";
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-sans text-2xl font-bold tracking-tight text-[var(--sp-fg)]">Scheduling</h1>
          <p className="font-mono text-sm text-[var(--sp-fg-light)] mt-1">
            Plan and schedule your content across platforms
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-background dark:bg-[#121214] border border-foreground/5 dark:border-white/5 rounded-lg overflow-hidden">
            {(["calendar", "list"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`h-9 px-4 text-xs font-mono font-bold capitalize transition-colors ${
                  view === v ? "bg-[var(--sp-fg)] text-background" : "text-[#6A6D75] hover:text-[var(--sp-fg)]"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <button className="h-9 px-4 bg-[var(--sp-fg)] text-background rounded-lg font-mono text-xs font-extrabold tracking-[0.15em] uppercase flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Schedule</span>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-6">
          {/* Calendar header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[var(--sp-fg)]">
              {MONTHS[currentMonth]} {currentYear}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--sp-bg)] dark:hover:bg-white/5 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-[var(--sp-fg-light)]" />
              </button>
              <button
                onClick={() => { setCurrentMonth(today.getMonth()); setCurrentYear(today.getFullYear()); }}
                className="h-8 px-3 rounded-lg text-xs font-mono font-bold text-[var(--sp-fg-light)] hover:bg-[var(--sp-bg)] dark:hover:bg-white/5 transition-colors"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--sp-bg)] dark:hover:bg-white/5 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-[var(--sp-fg-light)]" />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[10px] font-mono font-bold text-[#6A6D75] uppercase tracking-wider py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((cell, i) => {
              const isToday = cell.dateStr === todayStr;
              const isSelected = cell.dateStr === selectedDate;
              const cellPosts = postsByDate[cell.dateStr] || [];
              const hasScheduled = cellPosts.some((p) => p.status === "scheduled");
              const hasPublished = cellPosts.some((p) => p.status === "published");
              const hasDraft = cellPosts.some((p) => p.status === "draft");

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(cell.dateStr)}
                  className={`
                    relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all
                    ${!cell.inMonth ? "text-[#6A6D75]/40" : "text-[var(--sp-fg)]"}
                    ${isToday && !isSelected ? "ring-1 ring-[var(--sp-green)] font-bold" : ""}
                    ${isSelected ? "bg-[var(--sp-fg)] text-background font-bold" : "hover:bg-[var(--sp-bg)] dark:hover:bg-white/5"}
                  `}
                >
                  <span className="text-xs">{cell.day}</span>
                  {cellPosts.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {hasScheduled && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-background" : "bg-[var(--sp-fg)]"}`} />}
                      {hasPublished && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-background/60" : "bg-[var(--sp-fg)]/40"}`} />}
                      {hasDraft && <div className={`w-1.5 h-1.5 rounded-full border ${isSelected ? "border-background/60" : "border-[var(--sp-fg)]/40"}`} />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar — selected date posts + upcoming */}
        <div className="space-y-6">
          {/* Selected date */}
          <div className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-5">
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays className="w-4 h-4 text-[var(--sp-fg-light)]" />
              <h3 className="text-sm font-semibold text-[var(--sp-fg)]">
                {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </h3>
            </div>

            {selectedPosts.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs text-[var(--sp-fg-light)] font-mono">No posts scheduled</p>
                <button className="mt-3 h-8 px-4 border border-foreground/10 dark:border-white/10 rounded-lg text-xs font-medium text-[var(--sp-fg-light)] hover:bg-[var(--sp-bg)] dark:hover:bg-white/5 transition-colors inline-flex items-center gap-1.5">
                  <Plus className="w-3 h-3" /> Add post
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedPosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-3 rounded-lg border border-foreground/5 dark:border-white/5 hover:border-foreground/10 dark:hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-md flex items-center justify-center bg-[var(--sp-bg)] text-[var(--sp-fg)] border border-foreground/10 shrink-0"
                        >
                          <post.icon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[var(--sp-fg)] leading-tight">{post.title}</p>
                          <p className="text-[10px] text-[var(--sp-fg-light)]">{post.platform}</p>
                        </div>
                      </div>
                      <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--sp-bg)] dark:hover:bg-white/5">
                        <MoreHorizontal className="w-3.5 h-3.5 text-[var(--sp-fg-light)]" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[10px] text-[var(--sp-fg-light)] font-mono">
                        <Clock className="w-3 h-3" />
                        {post.time}
                      </div>
                      <StatusBadge status={post.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming */}
          <div className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-5">
            <h3 className="text-sm font-semibold text-[var(--sp-fg)] mb-4">Upcoming (7 days)</h3>
            {upcomingPosts.length === 0 ? (
              <p className="text-xs text-[var(--sp-fg-light)] font-mono py-4 text-center">No upcoming posts</p>
            ) : (
              <div className="space-y-3">
                {upcomingPosts.map((post) => (
                  <div key={post.id} className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center bg-[var(--sp-bg)] text-[var(--sp-fg)] border border-foreground/10 shrink-0"
                    >
                      <post.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[var(--sp-fg)] truncate">{post.title}</p>
                      <p className="text-[10px] text-[var(--sp-fg-light)] font-mono">
                        {new Date(post.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {post.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-5">
            <h3 className="text-sm font-semibold text-[var(--sp-fg)] mb-4">This Month</h3>
            <div className="space-y-3">
              {[
                { label: "Scheduled", count: samplePosts.filter((p) => p.status === "scheduled").length, colorClass: "bg-[var(--sp-fg)]" },
                { label: "Published", count: samplePosts.filter((p) => p.status === "published").length, colorClass: "bg-[var(--sp-fg)]/40" },
                { label: "Drafts", count: samplePosts.filter((p) => p.status === "draft").length, colorClass: "border border-[var(--sp-fg)]/40" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${stat.colorClass}`} />
                    <span className="text-xs text-[var(--sp-fg-light)]">{stat.label}</span>
                  </div>
                  <span className="text-sm font-bold text-[var(--sp-fg)]">{stat.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* List view */}
      {view === "list" && (
        <div className="mt-6 bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5">
          <div className="p-5 border-b border-foreground/5 dark:border-white/5">
            <h3 className="font-semibold text-[var(--sp-fg)]">All Scheduled Content</h3>
          </div>
          <div className="divide-y divide-foreground/5 dark:divide-white/5">
            {samplePosts
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map((post) => (
                <div key={post.id} className="p-4 flex items-center gap-4 hover:bg-[var(--sp-bg)] dark:hover:bg-white/[0.02] transition-colors">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--sp-bg)] text-[var(--sp-fg)] border border-foreground/10 shrink-0"
                  >
                    <post.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--sp-fg)] truncate">{post.title}</p>
                    <p className="text-xs text-[var(--sp-fg-light)]">{post.platform}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-mono font-medium text-[var(--sp-fg)]">
                      {new Date(post.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                    <p className="text-[10px] text-[var(--sp-fg-light)] font-mono">{post.time}</p>
                  </div>
                  <StatusBadge status={post.status} />
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--sp-bg)] dark:hover:bg-white/5">
                    <MoreHorizontal className="w-4 h-4 text-[var(--sp-fg-light)]" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

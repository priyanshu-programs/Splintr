"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
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
  Loader2,
  Search,
  X,
} from "lucide-react";
import {
  getScheduledPosts,
  getUpcomingPosts,
  getMonthStats,
  getUnscheduledPosts,
  schedulePost,
  type ScheduledPost,
  type ScheduledPostStatus,
} from "@/lib/scheduling-store";
import { useToast } from "@/components/ui/toaster";

/* ── helpers ── */

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const PLATFORM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  linkedin: Linkedin,
  x: Twitter,
  instagram: Instagram,
  blog: BookOpen,
};

const PLATFORM_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  x: "X / Twitter",
  instagram: "Instagram",
  blog: "Blog",
};

function getPlatformIcon(platform: string) {
  return PLATFORM_ICONS[platform] || BookOpen;
}

function getDateStr(iso: string): string {
  return iso.slice(0, 10);
}

function getTimeStr(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

/** Get the reference date string for a post (for calendar placement). */
function getPostDateStr(post: ScheduledPost): string | null {
  if (post.scheduledFor) return getDateStr(post.scheduledFor);
  if (post.publishedAt) return getDateStr(post.publishedAt);
  if (post.status === "draft") return getDateStr(post.createdAt);
  return null;
}

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

/* ── status badge (colors match library/page.tsx statusStyles) ── */

const STATUS_STYLES: Record<ScheduledPostStatus, string> = {
  scheduled: "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-transparent",
  ready: "bg-sp-green/10 text-[var(--sp-green)] border border-transparent",
  published: "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-transparent",
  draft: "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-dashed border-amber-500/30",
  archived: "bg-neutral-100 dark:bg-neutral-800/30 text-neutral-400 dark:text-neutral-500 border border-transparent",
};

function StatusBadge({ status }: { status: ScheduledPostStatus }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${STATUS_STYLES[status] || STATUS_STYLES.draft}`}>
      {status}
    </span>
  );
}

/* ── Schedule Modal ── */

function ScheduleModal({
  isOpen,
  initialDate,
  onClose,
  onScheduled,
}: {
  isOpen: boolean;
  initialDate: string;
  onClose: () => void;
  onScheduled: () => void;
}) {
  const [availablePosts, setAvailablePosts] = useState<ScheduledPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [schedDate, setSchedDate] = useState(initialDate);
  const [schedTime, setSchedTime] = useState("10:00");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedPostId(null);
      setSearchQuery("");
      setSchedDate(initialDate);
      setSchedTime("10:00");
      setLoadingPosts(true);
      getUnscheduledPosts()
        .then(setAvailablePosts)
        .catch(() => setAvailablePosts([]))
        .finally(() => setLoadingPosts(false));
    }
  }, [isOpen, initialDate]);

  const filteredPosts = useMemo(() => {
    if (!searchQuery) return availablePosts;
    const q = searchQuery.toLowerCase();
    return availablePosts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.platform.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q)
    );
  }, [availablePosts, searchQuery]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const isPastDate = schedDate < todayStr;

  async function handleSubmit() {
    if (!selectedPostId || !schedDate || !schedTime) return;

    const scheduledFor = new Date(`${schedDate}T${schedTime}:00`).toISOString();

    if (new Date(scheduledFor).getTime() < Date.now()) {
      toast({ message: "Cannot schedule in the past", type: "error" });
      return;
    }

    setSubmitting(true);
    try {
      await schedulePost(selectedPostId, scheduledFor);
      toast({ message: "Post scheduled successfully!", type: "success" });
      onScheduled();
      onClose();
    } catch (err) {
      toast({
        message: err instanceof Error ? err.message : "Failed to schedule post",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-background dark:bg-[#121214] border border-foreground/5 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-foreground/5 dark:border-white/5">
          <div>
            <h2 className="text-lg font-semibold text-[var(--sp-fg)]">Schedule a Post</h2>
            <p className="text-xs text-[var(--sp-fg-light)] mt-0.5">Pick content from your library and set a date</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4 text-[var(--sp-fg-light)]" />
          </button>
        </div>

        {/* Content picker */}
        <div className="p-6 pb-3 flex-1 overflow-hidden flex flex-col">
          <label className="text-xs font-mono font-bold text-[var(--sp-fg-light)] uppercase tracking-wider mb-2">
            Select content
          </label>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--sp-fg-light)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search library..."
              className="w-full h-9 pl-9 pr-3 bg-[var(--sp-bg)] dark:bg-white/5 border border-foreground/5 dark:border-white/5 rounded-lg text-sm focus:outline-none focus:border-[var(--sp-fg)] dark:focus:border-white focus:ring-1 focus:ring-[var(--sp-fg)] dark:focus:ring-white transition-all"
            />
          </div>

          <div className="flex-1 overflow-y-auto border border-foreground/5 dark:border-white/5 rounded-lg divide-y divide-foreground/5 dark:divide-white/5 min-h-[120px] max-h-[200px]">
            {loadingPosts ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--sp-fg-light)]" />
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs text-[var(--sp-fg-light)] font-mono">
                  {availablePosts.length === 0
                    ? "No unscheduled content in library"
                    : "No results match your search"}
                </p>
              </div>
            ) : (
              filteredPosts.map((post) => {
                const Icon = getPlatformIcon(post.platform);
                const isSelected = selectedPostId === post.id;
                return (
                  <button
                    key={post.id}
                    onClick={() => setSelectedPostId(post.id)}
                    className={`w-full text-left p-3 flex items-center gap-3 transition-colors ${
                      isSelected
                        ? "bg-indigo-50 dark:bg-indigo-950/20 border-l-2 border-l-indigo-500"
                        : "hover:bg-black/5 dark:hover:bg-white/5 border-l-2 border-l-transparent"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-md flex items-center justify-center bg-[var(--sp-bg)] dark:bg-white/5 text-[var(--sp-fg)] border border-foreground/10 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--sp-fg)] truncate">{post.title}</p>
                      <p className="text-[10px] text-[var(--sp-fg-light)]">
                        {PLATFORM_LABELS[post.platform] || post.platform}
                      </p>
                    </div>
                    <StatusBadge status={post.status} />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Date & Time pickers */}
        <div className="px-6 pb-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono font-bold text-[var(--sp-fg-light)] uppercase tracking-wider mb-1.5 block">
                Date
              </label>
              <input
                type="date"
                value={schedDate}
                min={todayStr}
                onChange={(e) => setSchedDate(e.target.value)}
                className={`w-full h-10 px-3 bg-[var(--sp-bg)] dark:bg-white/5 border rounded-lg text-sm font-mono focus:outline-none focus:ring-1 transition-all ${
                  isPastDate
                    ? "border-red-300 dark:border-red-800 text-red-500 focus:ring-red-500"
                    : "border-foreground/5 dark:border-white/5 focus:border-[var(--sp-fg)] dark:focus:border-white focus:ring-[var(--sp-fg)] dark:focus:ring-white"
                }`}
              />
              {isPastDate && (
                <p className="text-[10px] text-red-500 mt-1 font-mono">Cannot schedule in the past</p>
              )}
            </div>
            <div>
              <label className="text-xs font-mono font-bold text-[var(--sp-fg-light)] uppercase tracking-wider mb-1.5 block">
                Time
              </label>
              <input
                type="time"
                value={schedTime}
                onChange={(e) => setSchedTime(e.target.value)}
                className="w-full h-10 px-3 bg-[var(--sp-bg)] dark:bg-white/5 border border-foreground/5 dark:border-white/5 rounded-lg text-sm font-mono focus:outline-none focus:border-[var(--sp-fg)] dark:focus:border-white focus:ring-1 focus:ring-[var(--sp-fg)] dark:focus:ring-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 pt-4 border-t border-foreground/5 dark:border-white/5">
          <button
            onClick={onClose}
            className="h-9 px-5 rounded-lg text-sm font-medium text-[var(--sp-fg)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedPostId || isPastDate || submitting}
            className="h-9 px-5 bg-[var(--sp-fg)] text-background rounded-lg font-mono text-xs font-extrabold tracking-[0.15em] uppercase flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CalendarDays className="w-4 h-4" />
            )}
            Schedule
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── skeleton loaders ── */

function CalendarSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-1">
      {Array.from({ length: 35 }).map((_, i) => (
        <div key={i} className="aspect-square rounded-lg bg-foreground/5 dark:bg-white/5 animate-pulse" />
      ))}
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-3 rounded-lg border border-foreground/5 dark:border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-md bg-foreground/5 dark:bg-white/5 animate-pulse" />
            <div className="flex-1 space-y-1">
              <div className="h-3 w-3/4 rounded bg-foreground/5 dark:bg-white/5 animate-pulse" />
              <div className="h-2 w-1/2 rounded bg-foreground/5 dark:bg-white/5 animate-pulse" />
            </div>
          </div>
          <div className="h-2 w-1/3 rounded bg-foreground/5 dark:bg-white/5 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

/* ── page ── */

export default function SchedulingPage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string>(today.toISOString().slice(0, 10));
  const [view, setView] = useState<"calendar" | "list">("calendar");

  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [upcoming, setUpcoming] = useState<ScheduledPost[]>([]);
  const [stats, setStats] = useState<{ scheduled: number; published: number; drafts: number; ready: number }>({
    scheduled: 0, published: 0, drafts: 0, ready: 0,
  });
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState(today.toISOString().slice(0, 10));

  const todayStr = today.toISOString().slice(0, 10);
  const calendarDays = useMemo(() => getCalendarDays(currentYear, currentMonth), [currentYear, currentMonth]);

  // Fetch data for the current month view
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = new Date(currentYear, currentMonth, 1).toISOString();
      const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59).toISOString();

      const [postsData, upcomingData, statsData] = await Promise.all([
        getScheduledPosts(startDate, endDate),
        getUpcomingPosts(),
        getMonthStats(currentYear, currentMonth),
      ]);

      setPosts(postsData);
      setUpcoming(upcomingData);
      setStats(statsData);
    } catch (err) {
      console.error("Failed to fetch scheduling data:", err);
    } finally {
      setLoading(false);
    }
  }, [currentYear, currentMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Group posts by date for calendar dots
  const postsByDate = useMemo(() => {
    const map: Record<string, ScheduledPost[]> = {};
    posts.forEach((p) => {
      const dateStr = getPostDateStr(p);
      if (!dateStr) return;
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(p);
    });
    return map;
  }, [posts]);

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

  function openModal(date?: string) {
    setModalDate(date || todayStr);
    setModalOpen(true);
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Schedule Modal */}
      <ScheduleModal
        isOpen={modalOpen}
        initialDate={modalDate}
        onClose={() => setModalOpen(false)}
        onScheduled={fetchData}
      />

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
          <button
            onClick={() => openModal()}
            className="h-9 px-4 bg-[var(--sp-fg)] text-background rounded-lg font-mono text-xs font-extrabold tracking-[0.15em] uppercase flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Schedule</span>
          </button>
        </div>
      </div>

      {view === "calendar" && (
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
          {loading ? (
            <CalendarSkeleton />
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((cell, i) => {
                const isToday = cell.dateStr === todayStr;
                const isSelected = cell.dateStr === selectedDate;
                const cellPosts = postsByDate[cell.dateStr] || [];
                const hasScheduled = cellPosts.some((p) => p.status === "scheduled");
                const hasReady = cellPosts.some((p) => p.status === "ready");
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
                        {hasScheduled && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-indigo-300" : "bg-indigo-500"}`} />}
                        {hasReady && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-green-300" : "bg-[var(--sp-green)]"}`} />}
                        {hasPublished && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-blue-300" : "bg-blue-500"}`} />}
                        {hasDraft && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-amber-300" : "bg-amber-500"}`} />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar — selected date posts + upcoming + stats */}
        <div className="space-y-6">
          {/* Selected date */}
          <div className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[var(--sp-fg-light)]" />
                <h3 className="text-sm font-semibold text-[var(--sp-fg)]">
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                </h3>
              </div>
              {selectedDate >= todayStr && (
                <button
                  onClick={() => openModal(selectedDate)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--sp-fg-light)] hover:bg-[var(--sp-bg)] dark:hover:bg-white/5 transition-colors"
                  title="Add post to this day"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {loading ? (
              <SidebarSkeleton />
            ) : selectedPosts.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs text-[var(--sp-fg-light)] font-mono">No posts scheduled</p>
                {selectedDate >= todayStr && (
                  <button
                    onClick={() => openModal(selectedDate)}
                    className="mt-3 h-8 px-4 border border-foreground/10 dark:border-white/10 rounded-lg text-xs font-medium text-[var(--sp-fg-light)] hover:bg-[var(--sp-bg)] dark:hover:bg-white/5 transition-colors inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3 h-3" /> Add post
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {selectedPosts.map((post) => {
                  const Icon = getPlatformIcon(post.platform);
                  const timeDisplay = post.scheduledFor
                    ? getTimeStr(post.scheduledFor)
                    : post.publishedAt
                    ? getTimeStr(post.publishedAt)
                    : "No time set";

                  return (
                    <div
                      key={post.id}
                      className="p-3 rounded-lg border border-foreground/5 dark:border-white/5 hover:border-foreground/10 dark:hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-md flex items-center justify-center bg-[var(--sp-bg)] text-[var(--sp-fg)] border border-foreground/10 shrink-0">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[var(--sp-fg)] leading-tight">{post.title}</p>
                            <p className="text-[10px] text-[var(--sp-fg-light)]">{PLATFORM_LABELS[post.platform] || post.platform}</p>
                          </div>
                        </div>
                        <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--sp-bg)] dark:hover:bg-white/5">
                          <MoreHorizontal className="w-3.5 h-3.5 text-[var(--sp-fg-light)]" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[10px] text-[var(--sp-fg-light)] font-mono">
                          <Clock className="w-3 h-3" />
                          {timeDisplay}
                        </div>
                        <StatusBadge status={post.status} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming */}
          <div className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-5">
            <h3 className="text-sm font-semibold text-[var(--sp-fg)] mb-4">Upcoming (7 days)</h3>
            {loading ? (
              <SidebarSkeleton />
            ) : upcoming.length === 0 ? (
              <p className="text-xs text-[var(--sp-fg-light)] font-mono py-4 text-center">No upcoming posts</p>
            ) : (
              <div className="space-y-3">
                {upcoming.map((post) => {
                  const Icon = getPlatformIcon(post.platform);
                  return (
                    <div key={post.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md flex items-center justify-center bg-[var(--sp-bg)] text-[var(--sp-fg)] border border-foreground/10 shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[var(--sp-fg)] truncate">{post.title}</p>
                        <p className="text-[10px] text-[var(--sp-fg-light)] font-mono">
                          {post.scheduledFor
                            ? `${new Date(post.scheduledFor).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${getTimeStr(post.scheduledFor)}`
                            : "Not scheduled"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-5">
            <h3 className="text-sm font-semibold text-[var(--sp-fg)] mb-4">This Month</h3>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-3 w-20 rounded bg-foreground/5 dark:bg-white/5 animate-pulse" />
                    <div className="h-4 w-6 rounded bg-foreground/5 dark:bg-white/5 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { label: "Scheduled", count: stats.scheduled, colorClass: "bg-indigo-500" },
                  { label: "Ready", count: stats.ready, colorClass: "bg-[var(--sp-green)]" },
                  { label: "Published", count: stats.published, colorClass: "bg-blue-500" },
                  { label: "Drafts", count: stats.drafts, colorClass: "bg-amber-500" },
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
            )}
          </div>
        </div>
      </div>
      )}

      {/* List view */}
      {view === "list" && (
        <div className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5">
          <div className="p-5 border-b border-foreground/5 dark:border-white/5">
            <h3 className="font-semibold text-[var(--sp-fg)]">All Scheduled Content</h3>
          </div>
          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--sp-fg-light)]" />
            </div>
          ) : posts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-xs text-[var(--sp-fg-light)] font-mono">No content found for this month</p>
            </div>
          ) : (
            <div className="divide-y divide-foreground/5 dark:divide-white/5">
              {[...posts]
                .sort((a, b) => {
                  const aDate = a.scheduledFor || a.publishedAt || a.createdAt;
                  const bDate = b.scheduledFor || b.publishedAt || b.createdAt;
                  return new Date(aDate).getTime() - new Date(bDate).getTime();
                })
                .map((post) => {
                  const Icon = getPlatformIcon(post.platform);
                  const dateRef = post.scheduledFor || post.publishedAt || post.createdAt;
                  return (
                    <div key={post.id} className="p-4 flex items-center gap-4 hover:bg-[var(--sp-bg)] dark:hover:bg-white/[0.02] transition-colors">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--sp-bg)] text-[var(--sp-fg)] border border-foreground/10 shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--sp-fg)] truncate">{post.title}</p>
                        <p className="text-xs text-[var(--sp-fg-light)]">{PLATFORM_LABELS[post.platform] || post.platform}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-mono font-medium text-[var(--sp-fg)]">
                          {new Date(dateRef).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                        <p className="text-[10px] text-[var(--sp-fg-light)] font-mono">
                          {getTimeStr(dateRef)}
                        </p>
                      </div>
                      <StatusBadge status={post.status} />
                      <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--sp-bg)] dark:hover:bg-white/5">
                        <MoreHorizontal className="w-4 h-4 text-[var(--sp-fg-light)]" />
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AuthProvider, { useAuth } from "@/lib/auth/AuthProvider";
import Skeleton from "@/components/ui/Skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  LayoutDashboard,
  PenSquare,
  Library,
  BarChart3,
  Mic2,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  Zap,
  CalendarDays,
  Link2,
  KeyRound,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };
type NavSection = { label?: string; items: NavItem[] };

const navSections: NavSection[] = [
  {
    label: "WORKFLOW",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/create", label: "Create", icon: PenSquare },
      { href: "/scheduling", label: "Scheduling", icon: CalendarDays },
    ],
  },
  {
    label: "CONTENT",
    items: [
      { href: "/library", label: "Library", icon: Library },
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "CONFIGURATION",
    items: [
      { href: "/voice", label: "Voice Profiles", icon: Mic2 },
      { href: "/setup", label: "Connect", icon: Link2 },
      { href: "/api-access", label: "API Access", icon: KeyRound },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, workspace, isLoading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Client-side auth guard
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--sp-bg)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[var(--sp-fg)] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-[var(--sp-fg-light)] font-mono">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  // Redirect to onboarding if not completed
  if (profile && !profile.onboarding_completed) {
    router.push("/onboarding");
    return null;
  }

  const userInitial =
    profile?.full_name?.[0]?.toUpperCase() ||
    user.email?.[0]?.toUpperCase() ||
    "?";
  const userName = profile?.full_name || "User";
  const userEmail = user.email || "";
  const tierLabel = (profile?.subscription_tier || "free").toUpperCase();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="flex h-screen bg-[var(--sp-bg)] dark:bg-[#050505]">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-foreground/30 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative z-50 h-full bg-[var(--sp-fg)] dark:bg-[#0A0A0C] dark:border-r dark:border-white/5 text-background dark:text-[var(--sp-fg)] flex flex-col
          transition-all duration-300 ease-in-out
          ${collapsed ? "lg:w-[72px]" : "lg:w-[260px]"}
          ${mobileOpen ? "w-[260px] translate-x-0" : "w-[260px] -translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-background/10">
          <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 border border-background/20 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-white fill-none" strokeWidth={1.5}>
                <path d="M4 12 L20 12 M12 4 L12 20" />
                <circle cx="12" cy="12" r="4" fill="white" />
              </svg>
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-mono text-sm font-extrabold tracking-[0.25em]">SPLINTR</span>
                {workspace?.name && (
                  <span className="text-[0.6rem] font-mono text-background/40 dark:text-white/40 truncate tracking-wide">
                    {workspace.name}
                  </span>
                )}
              </div>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-7 h-7 items-center justify-center rounded hover:bg-background/10 transition-colors"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden w-7 h-7 flex items-center justify-center rounded hover:bg-background/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className={sIdx > 0 ? "mt-4" : ""}>
              {section.label && collapsed && (
                <div className="mx-auto mb-2 mt-2 w-5 border-t border-background/15 dark:border-white/15" />
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`
                        flex items-center gap-3 h-10 px-3 rounded-lg font-mono text-xs font-semibold tracking-[0.15em] uppercase transition-all
                        ${isActive
                          ? "bg-background/10 dark:bg-white/10 text-background dark:text-white"
                          : "text-background/50 dark:text-white/50 hover:text-background dark:hover:text-white hover:bg-background/5 dark:hover:bg-white/5"
                        }
                        ${collapsed ? "justify-center" : ""}
                      `}
                      title={collapsed ? item.label : undefined}
                    >
                      <item.icon className="w-[18px] h-[18px] shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Usage / upgrade */}
        {!collapsed && (
          <div className="mx-3 mb-3 p-3 rounded-lg bg-background/5 dark:bg-white/5 border border-background/10 dark:border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-[var(--sp-green)]" />
              <span className="font-mono text-xs font-extrabold tracking-[0.15em] text-background/60 dark:text-white/60">{tierLabel} PLAN</span>
            </div>
          </div>
        )}

        {/* User section */}
        <div className="border-t border-background/10 dark:border-white/10 p-3">
          <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
            <div className="w-8 h-8 rounded-full bg-background/10 dark:bg-white/10 flex items-center justify-center shrink-0 text-background dark:text-white">
              <span className="text-xs font-bold">{userInitial}</span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-background dark:text-white">{userName}</p>
                <p className="text-xs text-background/40 dark:text-white/40 truncate">{userEmail}</p>
              </div>
            )}
            {!collapsed && (
              <button onClick={handleLogout} className="w-7 h-7 flex items-center justify-center rounded hover:bg-background/10 dark:hover:bg-white/10 transition-colors">
                <LogOut className="w-4 h-4 text-background/40 dark:text-white/40" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-background dark:bg-[#0A0A0C] border-b border-foreground/5 dark:border-white/5 flex items-center px-6 shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded hover:bg-foreground/5 dark:hover:bg-white/5 mr-3"
          >
            <Menu className="w-5 h-5 dark:text-white" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/create"
              className="h-9 px-4 bg-[var(--sp-fg)] text-background rounded-lg font-mono text-xs font-extrabold tracking-[0.15em] uppercase flex items-center gap-2 hover:bg-foreground transition-colors"
            >
              <PenSquare className="w-4 h-4" />
              <span className="hidden sm:inline">New SYNDICATION</span>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}

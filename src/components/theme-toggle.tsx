"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Placeholder to prevent layout shift
    return <div className="h-8 w-14 rounded-full border border-transparent" />
  }

  const currentTheme = theme === 'system' ? resolvedTheme : theme;

  return (
    <button
      onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
      className="relative inline-flex h-8 w-14 items-center rounded-full border border-[var(--sp-fg)] bg-[var(--sp-bg)] transition-colors focus-visible:outline-none overflow-hidden hover:scale-105 active:scale-95 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] duration-300 pointer-events-auto shadow-sm"
      aria-label="Toggle theme"
    >
      <div 
        className={`absolute left-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--sp-fg)] transition-transform duration-500 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] ${currentTheme === 'dark' ? 'translate-x-[22px]' : 'translate-x-0'}`}
      >
        {currentTheme === "dark" ? (
          <Moon className="h-3 w-3 text-[var(--sp-bg)]" strokeWidth={2.5} />
        ) : (
          <Sun className="h-3 w-3 text-[var(--sp-bg)]" strokeWidth={2.5} />
        )}
      </div>
    </button>
  )
}

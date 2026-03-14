import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Navbar() {
  return (
    <nav className="absolute top-0 left-0 right-0 z-[200] flex items-center justify-between px-10 py-8 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-12">
        <Link href="/" className="w-11 h-11 flex items-center justify-center border-[1.5px] border-[var(--sp-fg)] bg-[var(--sp-bg)] relative">
          <div className="absolute inset-1 border border-foreground/10" />
          <svg viewBox="0 0 24 24" className="w-[22px] h-[22px] fill-none stroke-[var(--sp-fg)]" strokeWidth={1.5}>
            <path d="M4 12 L20 12 M12 4 L12 20" />
            <circle cx="12" cy="12" r="4" fill="var(--sp-fg)" />
          </svg>
        </Link>
      </div>

      <div className="pointer-events-auto absolute left-1/2 -translate-x-1/2 hidden lg:flex justify-between w-[clamp(340px,38vw,520px)] gap-6">
        <div className="flex items-center gap-12">
          <Link href="#features" className="font-mono text-xs font-semibold tracking-[0.15em] uppercase text-[var(--sp-fg-mid)] hover:text-[var(--sp-fg)] transition-colors">
            // Features
          </Link>
        </div>
        <div className="flex items-center gap-12">
          <Link href="#pricing" className="font-mono text-xs font-semibold tracking-[0.15em] uppercase text-[var(--sp-fg-mid)] hover:text-[var(--sp-fg)] transition-colors">
            // Pricing
          </Link>
        </div>
        <div className="flex items-center gap-12">
          <Link href="#faq" className="font-mono text-xs font-semibold tracking-[0.15em] uppercase text-[var(--sp-fg-mid)] hover:text-[var(--sp-fg)] transition-colors">
            // FAQ
          </Link>
        </div>
      </div>

      <div className="pointer-events-auto flex items-center gap-6 lg:gap-12">
        <ThemeToggle />
        <span className="font-mono text-xs font-semibold tracking-[0.15em] uppercase text-[var(--sp-fg-mid)] hover:text-[var(--sp-fg)] transition-colors cursor-pointer hidden sm:inline">
          v EN
        </span>
        <Link
          href="/signup"
          className="border-none bg-[var(--sp-fg)] text-background px-7 py-3 font-mono text-[0.65rem] font-extrabold tracking-[0.2em] uppercase shadow-md hover:bg-foreground hover:-translate-y-0.5 transition-all"
        >
          Get Started
        </Link>
      </div>
    </nav>
  );
}

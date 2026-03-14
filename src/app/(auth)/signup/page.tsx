"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SignUpPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [confirmEmail, setConfirmEmail] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    // If email confirmation is required, Supabase returns a user but no session
    if (data.user && !data.session) {
      setConfirmEmail(true);
      setIsLoading(false);
      return;
    }

    router.refresh();
    router.push("/onboarding");
  }

  async function handleOAuth(provider: "google" | "github") {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/callback` },
    });
  }

  return (
    <div className="flex min-h-screen relative">
      <div className="absolute top-6 right-6 sm:top-8 sm:right-8 z-50">
        <ThemeToggle />
      </div>
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--sp-fg)] text-background flex-col justify-between p-12">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 border border-background/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-white fill-none" strokeWidth={1.5}>
                <path d="M4 12 L20 12 M12 4 L12 20" />
                <circle cx="12" cy="12" r="4" fill="white" />
              </svg>
            </div>
            <span className="font-mono text-sm font-extrabold tracking-[0.25em]">SPLINTR</span>
          </Link>
        </div>
        <div>
          <h2 className="text-4xl font-bold leading-tight tracking-tight mb-6">
            Start syndicating<br />
            <span className="font-light text-background/60">in under 60 seconds.</span>
          </h2>
          <div className="space-y-4">
            {[
              "7-day free trial on Pro plan",
              "No credit card required",
              "Cancel anytime",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-sp-green/20 flex items-center justify-center">
                  <Check className="w-3 h-3 text-[var(--sp-green)]" />
                </div>
                <span className="font-mono text-sm text-background/60">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="font-mono text-xs text-background/30">
          &copy; 2026 Splintr Corporation
        </div>
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[var(--sp-bg)]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 border border-[var(--sp-fg)] flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-[var(--sp-fg)] fill-none" strokeWidth={1.5}>
                  <path d="M4 12 L20 12 M12 4 L12 20" />
                  <circle cx="12" cy="12" r="4" fill="var(--sp-fg)" />
                </svg>
              </div>
              <span className="font-mono text-sm font-extrabold tracking-[0.25em]">SPLINTR</span>
            </Link>
          </div>

          <div className="mb-8">
            <p className="font-mono text-xs font-extrabold tracking-[0.25em] text-[var(--sp-fg-light)] uppercase mb-3">
              // Get started free
            </p>
            <h1 className="font-sans text-3xl font-bold tracking-tight text-[var(--sp-fg)]">Create your account</h1>
          </div>

          {/* OAuth buttons */}
          <div className="flex gap-3 mb-6">
            <button onClick={() => handleOAuth("google")} className="flex-1 h-12 border border-sp-fg/10 bg-background rounded-lg flex items-center justify-center gap-2 font-mono font-extrabold text-sm tracking-[0.15em] uppercase hover:bg-[var(--sp-fg)] hover:text-background transition-all">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            <button onClick={() => handleOAuth("github")} className="flex-1 h-12 border border-sp-fg/10 bg-background rounded-lg flex items-center justify-center gap-2 font-mono font-extrabold text-sm tracking-[0.15em] uppercase hover:bg-[var(--sp-fg)] hover:text-background transition-all">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-sp-fg/10" />
            <span className="font-mono text-xs text-[var(--sp-fg-light)]">or sign up with email</span>
            <div className="flex-1 h-px bg-sp-fg/10" />
          </div>

          {confirmEmail && (
            <div className="mb-6 p-6 rounded-lg bg-green-50 border border-green-200 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-bold text-green-900 mb-1">Check your email</h3>
              <p className="text-sm text-green-700">
                We sent a confirmation link to <strong>{email}</strong>.<br />
                Click it to activate your account, then come back and sign in.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          {!confirmEmail && <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-mono text-xs font-extrabold tracking-[0.15em] text-[var(--sp-fg-light)] mb-2 uppercase">
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--sp-fg-light)]" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  className="w-full h-12 pl-10 pr-4 bg-background border border-sp-fg/10 rounded-lg text-sm focus:outline-none focus:border-[var(--sp-fg)] focus:ring-1 focus:ring-[var(--sp-fg)] transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-xs font-extrabold tracking-[0.15em] text-[var(--sp-fg-light)] mb-2 uppercase">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--sp-fg-light)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-12 pl-10 pr-4 bg-background border border-sp-fg/10 rounded-lg text-sm focus:outline-none focus:border-[var(--sp-fg)] focus:ring-1 focus:ring-[var(--sp-fg)] transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-xs font-extrabold tracking-[0.15em] text-[var(--sp-fg-light)] mb-2 uppercase">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--sp-fg-light)]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full h-12 pl-10 pr-12 bg-background border border-sp-fg/10 rounded-lg text-sm focus:outline-none focus:border-[var(--sp-fg)] focus:ring-1 focus:ring-[var(--sp-fg)] transition-all"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--sp-fg-light)] hover:text-[var(--sp-fg)] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-[var(--sp-fg)] text-background rounded-lg font-mono font-extrabold text-sm tracking-[0.15em] uppercase flex items-center justify-center gap-2 hover:bg-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-background/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create account <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>}

          {!confirmEmail && (
            <p className="mt-4 text-center text-xs text-[#6A6D75]">
              By signing up, you agree to our{" "}
              <Link href="#" className="underline">Terms of Service</Link> and{" "}
              <Link href="#" className="underline">Privacy Policy</Link>.
            </p>
          )}

          <p className="mt-4 text-center text-sm text-[#6A6D75]">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-[var(--sp-fg)] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

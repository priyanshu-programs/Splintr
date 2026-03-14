import Link from "next/link";
import BlueprintCanvas from "./BlueprintCanvas";
import WebGLCanvas from "./WebGLCanvas";
import HudOverlay from "./HudOverlay";

export default function HeroSection() {
  return (
    <div className="hero-split">
      {/* Left Pane */}
      <div className="hero-pane flex flex-col px-5 pb-6 sm:px-8 sm:pb-8 lg:px-12 lg:pb-12 lg:pl-20 min-h-screen max-lg:min-h-screen">
        <BlueprintCanvas />

        <div className="flex-1 flex flex-col justify-center max-w-[580px] pt-28 sm:pt-32 pb-12">
          <div className="font-mono text-[0.65rem] font-extrabold tracking-[0.35em] text-[var(--sp-fg-light)] mb-9 uppercase">
            // GENERATE ONCE, PUBLISH EVERYWHERE
          </div>
          <h1 className="font-sans text-[clamp(2rem,4.5vw,5.5rem)] font-bold leading-[1.05] tracking-tight text-[var(--sp-fg)] mb-6">
            One piece of content.
            <br />
            <span className="font-extralight text-[var(--sp-fg-light)] inline-block mt-2">
              Every platform. Instantly.
            </span>
          </h1>
          <p className="font-mono text-[0.8rem] leading-[1.9] text-[var(--sp-fg-light)] max-w-[480px] mb-14">
            Feed Splintr a blog post, podcast, or video — get ready-to-publish content for LinkedIn, Instagram, X, your blog, and video scripts in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-6">
            <Link
              href="/login"
              className="h-[54px] px-10 flex items-center justify-center bg-background/40 backdrop-blur-sm text-[var(--sp-fg)] font-sans text-sm font-semibold tracking-wide brackets brackets-dark hover:bg-background/70 transition-all no-underline"
            >
              Sign in
            </Link>
            <Link
              href="#features"
              className="h-[54px] px-10 flex items-center justify-center bg-[var(--sp-fg)] text-background font-sans text-sm font-semibold tracking-wide shadow-md hover:bg-foreground hover:shadow-lg hover:-translate-y-0.5 transition-all no-underline"
            >
              Learn more
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full mt-auto">
          {[
            { num: "8+", label: "PLATFORMS" },
            { num: "0.3s", label: "AVG GENERATION" },
            { num: "99.9%", label: "UPTIME" },
            { num: "10K+", label: "ACTIVE CREATORS" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-5 flex flex-col justify-center bg-background/40 backdrop-blur-sm brackets brackets-dark"
            >
              <div className="font-sans text-3xl font-bold tracking-tight text-[var(--sp-fg)] mb-1 whitespace-nowrap">
                {stat.num}
              </div>
              <div className="font-mono text-[0.55rem] font-extrabold tracking-[0.15em] text-[var(--sp-fg-light)] whitespace-nowrap overflow-hidden text-ellipsis">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Center Line */}
      <div className="hero-center-line hidden lg:block" />

      {/* Right Pane */}
      <div className="hero-pane hero-pane--right overflow-hidden bg-transparent hidden lg:block relative">
        <WebGLCanvas />
        <HudOverlay />
      </div>
    </div>
  );
}

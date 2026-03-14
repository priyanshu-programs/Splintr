"use client";

export default function FeatureVoice() {
  return (
    <section className="relative z-10 bg-background px-10 py-28">
      <div className="flex flex-col lg:flex-row items-center gap-20 max-w-[1200px] mx-auto">
        <div className="flex-1">
          <div className="font-mono text-[0.7rem] font-extrabold text-[var(--sp-fg-light)] mb-16 uppercase tracking-[0.25em]">
            02 / Semantic Identity
          </div>
          <h2 className="font-sans text-[clamp(2.4rem,3.5vw,3.8rem)] font-bold tracking-tight leading-tight mb-6">
            Your voice.<br />Amplified.
          </h2>
          <p className="font-mono text-base leading-relaxed text-[var(--sp-fg-light)] mb-6 max-w-[460px]">
            Generic AI content is dead. Splintr&apos;s Voice Model ingests your previous successful writing to map your unique tonal footprint.
          </p>
          <p className="font-mono text-base leading-relaxed text-[var(--sp-fg-light)] mb-10 max-w-[460px]">
            Adjust the dials for specific contexts — turn up authority for LinkedIn, or dial up wit for X — while maintaining your core identity.
          </p>
          <button className="h-[54px] px-10 bg-[var(--sp-fg)] text-background font-sans text-sm font-semibold tracking-wide shadow-md hover:bg-foreground hover:shadow-lg hover:-translate-y-0.5 transition-all">
            Train Your Model
          </button>
        </div>
        <div className="flex-1 bg-background rounded-2xl p-12 flex flex-col gap-7 shadow-[0_20px_40px_rgba(0,0,0,0.05)] border border-foreground/[0.03]">
          <div className="font-mono text-[0.65rem] font-extrabold tracking-[0.35em] text-[var(--sp-fg-light)] uppercase">
            VOICE PROFILE: DEFAULT
          </div>
          <SliderRow left="Analytical" right="Emotional" value={70} />
          <SliderRow left="Formal" right="Casual" value={40} />
          <SliderRow left="Concise" right="Descriptive" value={30} />
          <div className="p-5 bg-[var(--sp-bg)] rounded-lg font-mono text-xs text-[var(--sp-fg-light)] border-l-[3px] border-[var(--sp-green)] mt-2">
            [SYS_LOG]: Style matched to 48 ingested samples. Confidence: 94.2%
          </div>
        </div>
      </div>
    </section>
  );
}

function SliderRow({ left, right, value }: { left: string; right: string; value: number }) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="flex justify-between font-mono text-[0.7rem] text-[var(--sp-fg-light)] font-semibold">
        <em>{left}</em>
        <em>{right}</em>
      </span>
      <input type="range" min="0" max="100" defaultValue={value} />
    </div>
  );
}

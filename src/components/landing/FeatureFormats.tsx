export default function FeatureFormats() {
  const platforms = [
    { name: "LinkedIn Posts", icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg> },
    { name: "X/Twitter Threads", icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" /></svg> },
    { name: "Insta Carousels", icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg> },
    { name: "Blog Articles", icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg> },
    { name: "Short-form Scripts", icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg> },
    { name: "Long-form Scripts", icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" /></svg> },
    { name: "Audiograms", icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg> },
    { name: "Newsletters", icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M4 11a9 9 0 0 1 9 9" /><path d="M4 4a16 16 0 0 1 16 16" /><circle cx="5" cy="19" r="1" /></svg> },
  ];

  return (
    <section className="relative z-10 bg-[#ECEEF1] dark:bg-white/[0.02] px-10 py-28">
      <div className="font-mono text-[0.7rem] font-extrabold text-[var(--sp-fg-light)] text-center mb-16 uppercase tracking-[0.25em]">
        03 / Output Architecture
      </div>
      <h2 className="font-sans text-[clamp(2.4rem,3.5vw,3.8rem)] font-bold tracking-tight leading-tight text-center mb-6">
        Every format, handled.
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-[1000px] mx-auto mt-16">
        {platforms.map((p) => (
          <div
            key={p.name}
            className="group py-8 px-4 bg-background rounded-xl text-center font-sans font-semibold text-sm flex flex-col items-center gap-3 shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-foreground/[0.03] dark:border-white/10 hover:bg-[var(--sp-fg)] hover:text-background hover:-translate-y-1 transition-all duration-300 cursor-pointer"
          >
            <span className="group-hover:[&_svg]:stroke-white dark:group-hover:[&_svg]:stroke-black transition-colors">{p.icon}</span>
            {p.name}
          </div>
        ))}
      </div>
    </section>
  );
}

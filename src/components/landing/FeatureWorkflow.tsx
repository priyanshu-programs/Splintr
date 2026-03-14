"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function FeatureWorkflow() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Card 1 state
  const [shufflerCards, setShufflerCards] = useState([
    { id: 1, label: "Context Extraction", color: "bg-[#2A2A35]" },
    { id: 2, label: "Tone Matching", color: "bg-[#4A4D55]" },
    { id: 3, label: "Semantic Structuring", color: "bg-[#6A6D75]" }
  ]);

  useEffect(() => {
    // Shuffler Logic
    const shufflerInterval = setInterval(() => {
      setShufflerCards(prev => {
        const newArr = [...prev];
        const last = newArr.pop();
        if (last) newArr.unshift(last);
        return newArr;
      });
    }, 3000);

    return () => clearInterval(shufflerInterval);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      
      // Card 2 Typewriter Logic
      const twType = gsap.timeline({ repeat: -1, repeatDelay: 2 });
      const textToType = "Optimizing parameters...";
      const textEl = document.querySelector('.tw-text');
      if (textEl) {
        twType.to({}, {
          duration: 1.5,
          onUpdate: function() {
            const progress = this.progress();
            const charsToShow = Math.ceil(progress * textToType.length);
            textEl.innerHTML = textToType.substring(0, charsToShow);
          },
          ease: "none"
        });
        twType.to({}, { duration: 1 }); // hold
        twType.to({}, {
          duration: 0.5,
          onUpdate: function() {
            const progress = 1 - this.progress();
            const charsToShow = Math.ceil(progress * textToType.length);
            textEl.innerHTML = textToType.substring(0, charsToShow);
          },
          ease: "none"
        });
      }

      // Card 3 Cursor Scheduler
      const cursorTl = gsap.timeline({ repeat: -1, repeatDelay: 1 });
      const cursor = document.querySelector('.sim-cursor');
      const wedCell = document.querySelector('.day-wed');
      const saveBtn = document.querySelector('.save-btn');
      
      if (cursor && wedCell && saveBtn) {
        // enter
        cursorTl.fromTo(cursor, { x: 120, y: 120, opacity: 0 }, { x: 60, y: 30, opacity: 1, duration: 0.8, ease: "power2.inOut" });
        // click cell
        cursorTl.to(cursor, { scale: 0.8, duration: 0.1 });
        cursorTl.to(wedCell, { backgroundColor: '#27C93F', color: '#fff', duration: 0.1 }, "<");
        cursorTl.to(cursor, { scale: 1, duration: 0.1 });
        // move to save
        cursorTl.to(cursor, { x: 45, y: 80, duration: 0.6, ease: "power2.inOut", delay: 0.2 });
        // click save
        cursorTl.to(cursor, { scale: 0.8, duration: 0.1 });
        cursorTl.to(saveBtn, { scale: 0.95, backgroundColor: '#20A835', duration: 0.1 }, "<");
        cursorTl.to(cursor, { scale: 1, duration: 0.1 });
        cursorTl.to(saveBtn, { scale: 1, backgroundColor: '#27C93F', duration: 0.1 }, "<");
        // exit
        cursorTl.to(cursor, { x: -20, y: 120, opacity: 0, duration: 0.6, ease: "power2.inOut", delay: 0.3 });
        // reset cell
        cursorTl.set(wedCell, { backgroundColor: 'transparent', color: 'inherit' });
      }

    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="features" className="relative z-10 bg-[#ECEEF1] dark:bg-white/[0.02] px-10 py-28 overflow-hidden">
      <div className="font-mono text-[0.7rem] font-extrabold text-[var(--sp-fg-light)] text-center mb-16 uppercase tracking-[0.25em]">
        01 / The Core Engine
      </div>
      <h2 className="font-sans text-[clamp(2.4rem,3.5vw,3.8rem)] font-bold tracking-tight leading-tight text-center mb-6">
        Interactive Functional Artifacts
      </h2>
      <div 
        ref={containerRef}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-[1200px] mx-auto mt-16"
      >
        {/* Card 1: Diagnostic Shuffler */}
        <div className="bg-background p-10 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-foreground/[0.04] dark:border-white/10 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_20px_40px_rgba(255,255,255,0.03)] transition-all duration-350 flex flex-col h-full">
          <div className="h-[140px] w-full bg-[var(--sp-bg)] rounded-xl mb-8 relative flex items-center justify-center pt-8 overflow-hidden border border-foreground/[0.05] dark:border-white/5">
            {shufflerCards.map((card, i) => {
              const zIndex = 3 - i;
              const yOffset = i * -15;
              const scale = 1 - (i * 0.05);
              const opacity = 1 - (i * 0.2);
              return (
                <div 
                  key={card.id}
                  className={`absolute w-3/4 py-3 px-4 rounded-lg shadow-lg flex items-center justify-between transition-all text-white text-xs font-mono font-bold ${card.color}`}
                  style={{
                    transform: `translateY(${yOffset}px) scale(${scale})`,
                    zIndex,
                    opacity,
                    transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
                    transitionDuration: "600ms"
                  }}
                >
                  {card.label}
                  <div className="w-2 h-2 rounded-full bg-white/50" />
                </div>
              );
            })}
          </div>
          <h3 className="font-sans text-lg font-semibold mb-3">Diagnostic Pipeline</h3>
          <p className="font-mono text-sm leading-relaxed text-[var(--sp-fg-light)] mt-auto">
            Extracting components from your source material. We process format, tone, and logic sequentially.
          </p>
        </div>

        {/* Card 2: Telemetry Typewriter */}
        <div className="bg-background p-10 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-foreground/[0.04] dark:border-white/10 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_20px_40px_rgba(255,255,255,0.03)] transition-all duration-350 flex flex-col h-full">
          <div className="h-[140px] w-full bg-[#0A0A0C] rounded-xl mb-8 p-4 border border-foreground/[0.05] dark:border-white/10 flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <div className="text-[0.55rem] font-mono tracking-widest text-white/40 uppercase">System Status</div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#27C93F] animate-pulse" />
                <span className="text-[0.55rem] font-mono tracking-widest text-[#27C93F]">LIVE FEED</span>
              </div>
            </div>
            <div className="font-mono text-xs text-[#E8E4DD] flex flex-wrap mt-auto">
              <span className="text-[#27C93F] mr-2">sys&gt;</span>
              <span className="tw-text"></span>
              <span className="w-1.5 h-3 bg-[#E8E4DD] animate-pulse ml-1" />
            </div>
          </div>
          <h3 className="font-sans text-lg font-semibold mb-3">Telemetry Output</h3>
          <p className="font-mono text-sm leading-relaxed text-[var(--sp-fg-light)] mt-auto">
            Real-time feed monitoring semantic rewrites and applying platform-specific constraints.
          </p>
        </div>

        {/* Card 3: Cursor Protocol Scheduler */}
        <div className="bg-background p-10 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-foreground/[0.04] dark:border-white/10 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_20px_40px_rgba(255,255,255,0.03)] transition-all duration-350 flex flex-col h-full relative">
          <div className="h-[140px] w-full bg-[var(--sp-bg)] rounded-xl mb-8 flex flex-col items-center justify-center relative overflow-hidden border border-foreground/[0.05] dark:border-white/5">
            <div className="flex gap-2 mb-4">
              {['S','M','T','W','T','F','S'].map((day, i) => (
                <div 
                  key={i} 
                  className={`w-6 h-6 rounded flex items-center justify-center font-mono text-[0.6rem] font-bold border border-foreground/10 dark:border-white/10 transition-colors ${i === 3 ? 'day-wed' : 'text-[var(--sp-fg-light)]'}`}
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="save-btn px-4 py-1.5 bg-[#27C93F] text-white font-mono font-bold text-[0.6rem] rounded tracking-wider shadow-sm">
              QUEUE POST
            </div>
            {/* SVG Cursor */}
            <svg 
              className="sim-cursor absolute pointer-events-none w-5 h-5 z-10" 
              viewBox="0 0 24 24" 
              fill="white" 
              stroke="black" 
              strokeWidth="1.5"
              style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}
            >
              <path d="M4 4l5.4 15.6c.2.7 1.2.7 1.5 0L13.5 14l6.4-1.8c.7-.2.7-1.2 0-1.5L4 4z" />
            </svg>
          </div>
          <h3 className="font-sans text-lg font-semibold mb-3">Protocol Scheduler</h3>
          <p className="font-mono text-sm leading-relaxed text-[var(--sp-fg-light)] mt-auto">
            Visual calendar management. Drag, drop, and auto-queue your content across the entire ecosystem.
          </p>
        </div>
      </div>
    </section>
  );
}

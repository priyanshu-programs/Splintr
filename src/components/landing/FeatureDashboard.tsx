"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function FeatureDashboard() {
  const terminalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Create the typing animation timeline
      const lines = gsap.utils.toArray<HTMLElement>('.type-line');
      
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: terminalRef.current,
          start: "top 80%",
          toggleActions: "play pause resume reset"
        }
      });

      // Initially hide all lines and remove their text
      lines.forEach((line: HTMLElement) => {
        const text = line.getAttribute('data-text') || '';
        line.innerHTML = '';
        line.style.opacity = '1';
        
        // Typing effect for this line
        tl.to({}, {
          duration: text.length * 0.03, // speed of typing
          onUpdate: function() {
            const progress = this.progress();
            const charsToShow = Math.ceil(progress * text.length);
            line.innerHTML = text.substring(0, charsToShow);
          },
          ease: "none"
        });
        
        // Add a tiny pause after each line
        tl.to({}, { duration: 0.2 });
      });

    }, terminalRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="relative z-10 bg-[var(--sp-fg)] text-white dark:bg-[#0A0A0C] dark:text-[#F5F6F8] px-10 py-28 transition-colors duration-300">
      <div className="flex flex-col lg:flex-row items-center gap-20 max-w-[1200px] mx-auto">
        <div 
          ref={terminalRef}
          className="flex-1 bg-[#0A0A0C] rounded-2xl p-12 border border-white/10 flex flex-col gap-7 shadow-[0_20px_50px_rgba(0,0,0,0.3)] w-full overflow-hidden"
        >
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <div className="flex gap-2.5">
              <div className="w-[11px] h-[11px] rounded-full bg-[#FF5F56]" />
              <div className="w-[11px] h-[11px] rounded-full bg-[#FFBD2E]" />
              <div className="w-[11px] h-[11px] rounded-full bg-[#27C93F]" />
            </div>
            
            <div className="font-mono text-[0.65rem] font-extrabold tracking-[0.35em] text-[#A1A5B2] uppercase flex items-center gap-2">
              <span className="inline-block w-[6px] h-[6px] rounded-full bg-[var(--sp-green)] animate-[pulse-dot_1.5s_infinite]" />
              LIVE FEED
            </div>
          </div>
          
          <div className="font-mono text-sm leading-[2.2] text-[#E8E4DD] min-h-[160px]">
            <div className="flex">
              <span className="text-[#27C93F] mr-2">&gt;</span>
              <span className="type-line" data-text="deploy queue --platform all"></span>
              <span className="w-[8px] h-[15px] bg-[var(--sp-green)] animate-pulse ml-1 mt-1 inline-block" />
            </div>
            <div className="flex mt-1">
              <span className="text-[#8C90A0] mr-2">[08:04:12]</span>
              <span className="text-[#8C90A0] mr-2">[ OK ]</span>
              <span className="type-line" data-text="LinkedIn post queued → Tue 09:00"></span>
            </div>
            <div className="flex mt-1">
              <span className="text-[#8C90A0] mr-2">[08:04:13]</span>
              <span className="text-[#8C90A0] mr-2">[ OK ]</span>
              <span className="type-line" data-text="X thread scheduled → Tue 12:30"></span>
            </div>
            <div className="flex mt-1">
              <span className="text-[#8C90A0] mr-2">[08:04:14]</span>
              <span className="text-[#8C90A0] mr-2">[ OK ]</span>
              <span className="type-line" data-text="Carousel queued → Wed 17:00"></span>
            </div>
            <div className="flex mt-2 opacity-60">
              <span className="text-[#27C93F] mr-2">&gt;</span>
              <span className="type-line" data-text="await auto-publish..."></span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 lg:pl-8">
          <div className="font-mono text-[0.7rem] font-extrabold text-[#A1A5B2] dark:text-[#8C90A0] mb-16 uppercase tracking-[0.25em]">
            04 / Command Center
          </div>
          <h2 className="font-sans text-[clamp(2.4rem,3.5vw,3.8rem)] font-bold tracking-tight leading-tight mb-6">
            See everything.<br />Schedule anything.
          </h2>
          <p className="font-mono text-base leading-relaxed text-white/60 dark:text-[#A1A5B2] mb-6 max-w-[460px]">
            Manage your entire content ecosystem from a single interface. View analytics across all platforms simultaneously.
          </p>
          <p className="font-mono text-base leading-relaxed text-white/60 dark:text-[#A1A5B2] max-w-[460px]">
            Drag-and-drop posts onto your content calendar, or let our smart-scheduling algorithm auto-queue for optimal engagement.
          </p>
        </div>
      </div>
    </section>
  );
}

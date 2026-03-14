import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative z-10 bg-[#0A0A0C] text-[#F5F6F8] px-10 pt-20 pb-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-16 max-w-[1200px] mx-auto">
        <div>
          <div className="w-11 h-11 flex items-center justify-center border-[1.5px] border-white/15 bg-transparent mb-6 relative">
            <div className="absolute inset-1 border border-white/10" />
            <svg viewBox="0 0 24 24" className="w-[22px] h-[22px] fill-none stroke-white" strokeWidth={1.5}>
              <path d="M4 12 L20 12 M12 4 L12 20" />
              <circle cx="12" cy="12" r="4" fill="white" />
            </svg>
          </div>
          <p className="font-mono text-[0.78rem] leading-relaxed text-[#666] max-w-[250px]">
            Content syndication infrastructure. Write once, publish everywhere.
          </p>
        </div>
        <div>
          <h4 className="font-mono text-xs tracking-[0.15em] text-[#555] mb-6">PRODUCT</h4>
          <Link href="#features" className="block text-[#AAA] no-underline mb-4 text-sm hover:text-white transition-colors">Features</Link>
          <Link href="#pricing" className="block text-[#AAA] no-underline mb-4 text-sm hover:text-white transition-colors">Pricing</Link>
          <Link href="#" className="block text-[#AAA] no-underline mb-4 text-sm hover:text-white transition-colors">Integrations</Link>
          <Link href="#" className="block text-[#AAA] no-underline mb-4 text-sm hover:text-white transition-colors">Changelog</Link>
        </div>
        <div>
          <h4 className="font-mono text-xs tracking-[0.15em] text-[#555] mb-6">RESOURCES</h4>
          <Link href="#" className="block text-[#AAA] no-underline mb-4 text-sm hover:text-white transition-colors">Blog</Link>
          <Link href="#" className="block text-[#AAA] no-underline mb-4 text-sm hover:text-white transition-colors">Documentation</Link>
          <Link href="#" className="block text-[#AAA] no-underline mb-4 text-sm hover:text-white transition-colors">API Reference</Link>
          <Link href="#" className="block text-[#AAA] no-underline mb-4 text-sm hover:text-white transition-colors">Community</Link>
        </div>
        <div>
          <h4 className="font-mono text-xs tracking-[0.15em] text-[#555] mb-6">COMPANY</h4>
          <Link href="#" className="block text-[#AAA] no-underline mb-4 text-sm hover:text-white transition-colors">About</Link>
          <Link href="#" className="block text-[#AAA] no-underline mb-4 text-sm hover:text-white transition-colors">Contact</Link>
          <Link href="#" className="block text-[#AAA] no-underline mb-4 text-sm hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="#" className="block text-[#AAA] no-underline mb-4 text-sm hover:text-white transition-colors">Terms of Service</Link>
        </div>
      </div>
      <div className="max-w-[1200px] mx-auto mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 font-mono text-[0.7rem] text-[#555]">
        <div>&copy; 2026 Splintr Corporation. All rights reserved.</div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-[7px] h-[7px] rounded-full bg-[#27C93F] shadow-[0_0_8px_#27C93F] animate-[pulse-dot_2s_infinite]" />
          SYSTEMS OPERATIONAL
        </div>
      </div>
    </footer>
  );
}

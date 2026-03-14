import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import SocialProofBar from "@/components/landing/SocialProofBar";
import FeatureWorkflow from "@/components/landing/FeatureWorkflow";
import FeatureVoice from "@/components/landing/FeatureVoice";
import FeatureFormats from "@/components/landing/FeatureFormats";
import FeatureDashboard from "@/components/landing/FeatureDashboard";
import PricingSection from "@/components/landing/PricingSection";
import FaqSection from "@/components/landing/FaqSection";
import Footer from "@/components/landing/Footer";
import CustomCursor from "@/components/landing/CustomCursor";
import SmoothScroll from "@/components/landing/SmoothScroll";

export default function LandingPage() {
  return (
    <div className="landing-page bg-[var(--sp-bg)] text-[var(--sp-fg)] overflow-x-hidden w-full min-h-screen font-sans antialiased">
      {/* SVG Noise Filter */}
      <svg style={{ display: "none" }}>
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={3} stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 0.05 0" />
        </filter>
      </svg>
      <div className="noise-overlay" style={{ filter: "url(#noiseFilter)" }} />

      {/* Background Grid */}
      <div className="global-grid" />

      {/* Navigation */}
      <Navbar />

      {/* Hero */}
      <HeroSection />

      {/* Social Proof */}
      <SocialProofBar />

      {/* Feature Sections */}
      <FeatureWorkflow />
      <FeatureVoice />
      <FeatureFormats />
      <FeatureDashboard />

      {/* Pricing */}
      <PricingSection />

      {/* FAQ */}
      <FaqSection />

      {/* Footer */}
      <Footer />

      {/* Client-side enhancements */}
      <CustomCursor />
      <SmoothScroll />
    </div>
  );
}

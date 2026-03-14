"use client";

import { useState } from "react";
import {
  Plus,
  Mic2,
  MoreHorizontal,
  Check,
  Star,
  Pencil,
  Trash2,
  Copy,
} from "lucide-react";

interface VoiceProfile {
  id: string;
  name: string;
  tone: string;
  isDefault: boolean;
  samplesCount: number;
  confidence: number;
  lastUsed: string;
  sliders: { label: string; from: string; to: string; value: number }[];
}

const profiles: VoiceProfile[] = [
  {
    id: "1",
    name: "Professional",
    tone: "Authoritative",
    isDefault: true,
    samplesCount: 48,
    confidence: 94.2,
    lastUsed: "2 hours ago",
    sliders: [
      { label: "Analytical/Emotional", from: "Analytical", to: "Emotional", value: 30 },
      { label: "Formal/Casual", from: "Formal", to: "Casual", value: 25 },
      { label: "Concise/Descriptive", from: "Concise", to: "Descriptive", value: 40 },
    ],
  },
  {
    id: "2",
    name: "Casual & Witty",
    tone: "Conversational",
    isDefault: false,
    samplesCount: 22,
    confidence: 87.5,
    lastUsed: "3 days ago",
    sliders: [
      { label: "Analytical/Emotional", from: "Analytical", to: "Emotional", value: 70 },
      { label: "Formal/Casual", from: "Formal", to: "Casual", value: 80 },
      { label: "Concise/Descriptive", from: "Concise", to: "Descriptive", value: 55 },
    ],
  },
  {
    id: "3",
    name: "Educational",
    tone: "Informative",
    isDefault: false,
    samplesCount: 15,
    confidence: 82.1,
    lastUsed: "1 week ago",
    sliders: [
      { label: "Analytical/Emotional", from: "Analytical", to: "Emotional", value: 20 },
      { label: "Formal/Casual", from: "Formal", to: "Casual", value: 45 },
      { label: "Concise/Descriptive", from: "Concise", to: "Descriptive", value: 70 },
    ],
  },
];

export default function VoiceProfilesPage() {
  const [selectedProfile, setSelectedProfile] = useState<string>("1");
  const [showCreate, setShowCreate] = useState(false);

  const activeProfile = profiles.find((p) => p.id === selectedProfile);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-sans text-2xl font-bold tracking-tight text-[var(--sp-fg)]">Voice Profiles</h1>
          <p className="font-mono text-sm text-[var(--sp-fg-light)] mt-1">Train the AI to match your writing style</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="h-10 px-5 bg-[var(--sp-fg)] text-background rounded-lg font-mono text-xs font-extrabold tracking-[0.15em] uppercase flex items-center gap-2 hover:bg-foreground transition-colors"
        >
          <Plus className="w-4 h-4" /> New Profile
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile list */}
        <div className="space-y-3">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => setSelectedProfile(profile.id)}
              className={`w-full p-4 rounded-xl border text-left transition-all ${
                selectedProfile === profile.id
                  ? "border-[var(--sp-fg)] bg-background dark:bg-[#121214] shadow-sm"
                  : "border-foreground/5 dark:border-white/5 bg-background dark:bg-[#121214] hover:border-sp-fg/20 dark:hover:border-white/20"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Mic2 className="w-4 h-4 text-[var(--sp-fg-light)]" />
                  <span className="font-semibold text-sm">{profile.name}</span>
                </div>
                {profile.isDefault && (
                  <span className="text-[10px] font-mono font-extrabold bg-sp-green/10 text-[var(--sp-green)] px-2 py-0.5 rounded-full">
                    DEFAULT
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-[var(--sp-fg-light)]">
                <span>{profile.tone}</span>
                <span>·</span>
                <span>{profile.samplesCount} samples</span>
                <span>·</span>
                <span>{profile.confidence}% match</span>
              </div>
            </button>
          ))}

          <button
            onClick={() => setShowCreate(true)}
            className="w-full p-4 rounded-xl border border-dashed border-sp-fg/15 text-center text-sm font-medium text-[var(--sp-fg-light)] hover:border-sp-fg/30 hover:text-[var(--sp-fg)] transition-colors"
          >
            + Create new profile
          </button>
        </div>

        {/* Profile detail */}
        {activeProfile && (
          <div className="lg:col-span-2 space-y-6">
            {/* Header card */}
            <div className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">{activeProfile.name}</h2>
                  <p className="text-sm text-[var(--sp-fg-light)]">Last used {activeProfile.lastUsed}</p>
                </div>
                <div className="flex gap-2">
                  <button className="w-9 h-9 rounded-lg border border-foreground/5 flex items-center justify-center text-[var(--sp-fg-light)] hover:bg-[var(--sp-bg)] transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button className="w-9 h-9 rounded-lg border border-foreground/5 flex items-center justify-center text-[var(--sp-fg-light)] hover:bg-[var(--sp-bg)] transition-colors">
                    <Copy className="w-4 h-4" />
                  </button>
                  {!activeProfile.isDefault && (
                    <button className="w-9 h-9 rounded-lg border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-5">
                {activeProfile.sliders.map((slider) => (
                  <div key={slider.label}>
                    <div className="flex justify-between text-xs font-mono text-[var(--sp-fg-light)] mb-2">
                      <span>{slider.from}</span>
                      <span>{slider.to}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      defaultValue={slider.value}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>

              {/* Confidence */}
              <div className="mt-6 p-4 bg-[var(--sp-bg)] rounded-lg border-l-3 border-l-[var(--sp-green)]" style={{ borderLeftWidth: 3, borderLeftColor: "#27C93F" }}>
                <div className="font-mono text-xs text-[var(--sp-fg-light)]">
                  [SYS_LOG]: Style matched to {activeProfile.samplesCount} ingested samples. Confidence: {activeProfile.confidence}%
                </div>
              </div>
            </div>

            {/* Writing samples */}
            <div className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[var(--sp-fg)]">Writing Samples</h3>
                <button className="text-xs font-mono font-extrabold tracking-[0.15em] uppercase text-[var(--sp-fg-light)] hover:text-[var(--sp-fg)] transition-colors">
                  + Add Sample
                </button>
              </div>
              <p className="text-xs text-[var(--sp-fg-light)] mb-4">
                The more samples you provide, the better the AI matches your voice.
              </p>
              <div className="space-y-3">
                {[
                  "The future of content isn't about volume — it's about velocity of value. Every platform has its own language...",
                  "I've spent the last decade building content strategies for B2B brands. Here's the one thing that actually moved the needle...",
                  "Thread: 7 lessons from scaling a content team from 1 to 15 people (while maintaining quality)...",
                ].map((sample, i) => (
                  <div key={i} className="p-3 bg-[var(--sp-bg)] rounded-lg text-sm text-[var(--sp-fg-mid)] line-clamp-2">
                    {sample}
                  </div>
                ))}
              </div>
            </div>

            {/* Platform overrides */}
            <div className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-6">
              <h3 className="font-semibold mb-1 text-[var(--sp-fg)]">Platform Overrides</h3>
              <p className="text-xs text-[var(--sp-fg-light)] mb-4">Customize voice settings per platform</p>
              <div className="grid grid-cols-2 gap-3">
                {["LinkedIn", "X / Twitter", "Instagram", "Blog"].map((platform) => (
                  <div key={platform} className="p-4 rounded-xl border border-sp-fg/10 hover:border-sp-fg/20 transition-colors cursor-pointer">
                    <div className="text-sm font-medium mb-1">{platform}</div>
                    <div className="text-xs text-[var(--sp-fg-light)]">Using default settings</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { PlatformType } from "@/lib/supabase/types";
import { MOCK_AUTH_ENABLED } from "@/lib/auth/mock-auth";
import { ThemeToggle } from "@/components/theme-toggle";

const steps = [
  {
    id: 1,
    label: "Welcome",
    title: "Initialize Workspace",
    description:
      "Welcome to Splintr. Name your workspace and pick a timezone to get started.",
    actionLabel: "Continue",
  },
  {
    id: 2,
    label: "Connect Channels",
    title: "Establish Uplinks",
    description:
      "Select the platforms you want to syndicate content to. (Mock Mode: toggling these will update the local JSON state).",
    actionLabel: "Confirm Uplinks",
  },
  {
    id: 3,
    label: "Voice Profile",
    title: "Calibrate Tone",
    description:
      "Configure the generative matrix to perfectly mirror your brand's unique voice signature across all outputs.",
    actionLabel: "Compile Preset",
  },
  {
    id: 4,
    label: "Voice Preview",
    title: "Voice Output Preview",
    description:
      "See how your configured voice sounds. Powered by OpenRouter Free.",
    actionLabel: "Continue",
  },
  {
    id: 5,
    label: "Dry Run",
    title: "Dry Run Simulation",
    description:
      "Feed the engine a raw thought. We'll simulate a syndication run right now.",
    actionLabel: "Execute Run",
  },
  {
    id: 6,
    label: "Complete",
    title: "You're All Set",
    description:
      "Review your setup and launch the workspace.",
    actionLabel: "Launch Workspace",
  },
] as const;

const platforms = [
  { id: "linkedin", name: "LinkedIn" },
  { id: "x", name: "X / Twitter" },
  { id: "instagram", name: "Instagram" },
  { id: "youtube", name: "YouTube Shorts" },
  { id: "blog", name: "WordPress Blog" },
];

const timezoneOptions = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "GMT / UTC" },
  { value: "Europe/Berlin", label: "Central European Time" },
  { value: "Asia/Tokyo", label: "Japan Standard Time" },
  { value: "Asia/Kolkata", label: "India Standard Time" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [workspaceName, setWorkspaceName] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [formalityIndex, setFormalityIndex] = useState(70);
  const [humorCoefficient, setHumorCoefficient] = useState(22);
  const [customPrompt, setCustomPrompt] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dryRunInput, setDryRunInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Derive tone label from sliders
  const voiceToneLabel = `Formality ${formalityIndex}%, Humor ${humorCoefficient}%`;

  // Voice preview state
  const [previewOutput, setPreviewOutput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [previewError, setPreviewError] = useState("");

  const currentStepMeta = steps[currentStep - 1];
  const workspaceLabel = workspaceName.trim() || "Untitled Workspace";
  const timezoneLabel =
    timezoneOptions.find((option) => option.value === timezone)?.label || timezone;
  const selectedPlatformNames = platforms
    .filter((platform) => selectedPlatforms.includes(platform.id))
    .map((platform) => platform.name);

  function goToStep(step: number) {
    setError("");
    setCurrentStep(step);
  }

  function handleNext() {
    setError("");
    const nextStep = Math.min(currentStep + 1, steps.length);
    setCurrentStep(nextStep);

    // Auto-generate preview when entering the Voice Preview step
    if (nextStep === 4 && !previewOutput) {
      generatePreview();
    }
  }

  function handleBack() {
    setError("");
    setCurrentStep((step) => Math.max(step - 1, 1));
  }

  function togglePlatform(id: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((platform) => platform !== id) : [...prev, id]
    );
  }

  async function generatePreview() {
    setGenerating(true);
    setPreviewError("");
    setPreviewOutput("");

    try {
      const response = await fetch("/api/voice-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tone: `Formality: ${formalityIndex}% (casual to corporate), Humor: ${humorCoefficient}% (dry to witty)`,
          formalityIndex,
          humorCoefficient,
          customPrompt: customPrompt || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Preview generation failed");
      }

      setPreviewOutput(data.preview);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : "Failed to generate preview. Check your API key and try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleFinish() {
    setSaving(true);
    setError("");

    if (MOCK_AUTH_ENABLED) {
      router.push("/dashboard");
      return;
    }

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: workspaces } = (await (supabase as any)
        .from("workspaces")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)) as { data: { id: string }[] | null };

      let workspaceId: string;

      if (workspaces && workspaces.length > 0) {
        workspaceId = workspaces[0].id;
        await (supabase as any)
          .from("workspaces")
          .update({ name: workspaceName || "My Workspace", timezone })
          .eq("id", workspaceId);
      } else {
        const { data: newWorkspace } = (await (supabase as any)
          .from("workspaces")
          .insert({
            user_id: user.id,
            name: workspaceName || "My Workspace",
            timezone,
          })
          .select("id")
          .single()) as { data: { id: string } | null };

        workspaceId = newWorkspace?.id ?? "";

        if (!workspaceId) {
          throw new Error("Failed to create workspace");
        }
      }

      if (selectedPlatforms.length > 0) {
        const platformRows = selectedPlatforms.map((platform) => ({
          workspace_id: workspaceId,
          platform: platform as PlatformType,
          is_active: true,
          metadata: {},
        }));

        await (supabase as any).from("platform_connections").insert(platformRows);
      }

      {
        await (supabase as any).from("voice_profiles").insert({
          workspace_id: workspaceId,
          name: "Default",
          is_default: true,
          system_prompt: customPrompt || null,
          tone: voiceToneLabel,
          writing_samples: [],
          platform_overrides: { formalityIndex, humorCoefficient },
        });
      }

      await (supabase as any)
        .from("users")
        .update({ onboarding_completed: true })
        .eq("id", user.id);

      router.push("/dashboard");
    } catch (caughtError) {
      console.error(caughtError);
      setError("Initialization failed. Please try again.");
      setSaving(false);
    }
  }

  function renderStepContent() {
    if (currentStep === 1) {
      return (
        <div className="max-w-lg space-y-6">
          <div>
            <label className="block text-xs font-medium text-foreground/60 mb-2">
              Workspace Name
            </label>
            <input
              type="text"
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              placeholder="My Workspace"
              className="w-full border-0 border-b border-foreground/15 bg-transparent pb-2 text-base font-medium text-foreground outline-none transition-colors placeholder:text-foreground/45 focus:border-foreground"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground/60 mb-2">
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              className="w-full appearance-none border-0 border-b border-foreground/15 bg-transparent pb-2 text-base font-medium text-foreground outline-none transition-colors focus:border-foreground dark:[&>option]:bg-background"
            >
              {timezoneOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      );
    }

    if (currentStep === 2) {
      return (
        <div className="grid gap-3 md:grid-cols-2 max-w-xl">
          {platforms.map((platform) => {
            const isSelected = selectedPlatforms.includes(platform.id);

            return (
              <button
                key={platform.id}
                type="button"
                onClick={() => togglePlatform(platform.id)}
                className={cn(
                  "flex items-center justify-between border px-4 py-2.5 text-left transition-all",
                  isSelected
                    ? "border-foreground/30 bg-background"
                    : "border-foreground/10 bg-transparent hover:border-foreground/25"
                )}
              >
                <span className="text-sm font-medium text-foreground">
                  {platform.name}
                </span>
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors",
                    isSelected
                      ? "border-black bg-foreground"
                      : "border-foreground/20 bg-transparent"
                  )}
                >
                  {isSelected && <Check className="h-2.5 w-2.5 text-background" strokeWidth={3} />}
                </span>
              </button>
            );
          })}
        </div>
      );
    }

    if (currentStep === 3) {
      return (
        <div className="max-w-xl space-y-8">
          {/* Formality Index Slider */}
          <div>
            <div className="flex items-baseline justify-between mb-4">
              <label className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-foreground/50">
                Formality Index ({formalityIndex}%)
              </label>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={formalityIndex}
              onChange={(e) => setFormalityIndex(Number(e.target.value))}
              className="w-full h-1.5 appearance-none bg-foreground/10 rounded-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-foreground [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
            />
            <div className="flex justify-between mt-2">
              <span className="text-[0.6rem] font-medium uppercase tracking-wider text-foreground/30">Casual</span>
              <span className="text-[0.6rem] font-medium uppercase tracking-wider text-foreground/30">Corporate</span>
            </div>
          </div>

          {/* Humor Coefficient Slider */}
          <div>
            <div className="flex items-baseline justify-between mb-4">
              <label className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-foreground/50">
                Humor Coefficient ({humorCoefficient}%)
              </label>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={humorCoefficient}
              onChange={(e) => setHumorCoefficient(Number(e.target.value))}
              className="w-full h-1.5 appearance-none bg-foreground/10 rounded-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-foreground [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
            />
            <div className="flex justify-between mt-2">
              <span className="text-[0.6rem] font-medium uppercase tracking-wider text-foreground/30">Dry</span>
              <span className="text-[0.6rem] font-medium uppercase tracking-wider text-foreground/30">Witty</span>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="border-t border-foreground/8 pt-6">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-foreground/50 transition-colors hover:text-foreground/80"
            >
              Advanced Settings [{showAdvanced ? "−" : "+"}]
            </button>

            {showAdvanced && (
              <div className="mt-4 animate-in fade-in slide-in-from-top-1 duration-200 space-y-4">
                <textarea
                  value={customPrompt}
                  onChange={(event) => setCustomPrompt(event.target.value)}
                  placeholder="Override the default voice with a custom system prompt. e.g., You are a tech founder who writes like Paul Graham — short sentences, contrarian takes, first-principles reasoning."
                  rows={4}
                  className="w-full resize-none border border-foreground/10 bg-foreground/[0.02] p-4 text-sm leading-6 text-foreground outline-none transition-colors placeholder:text-foreground/45 focus:border-foreground font-mono"
                />
                {customPrompt && (
                  <p className="text-[0.6rem] text-foreground/40">
                    Profile successfully saved to local state.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (currentStep === 4) {
      return (
        <div className="max-w-2xl space-y-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 border border-foreground/10 bg-foreground/[0.02] px-2.5 py-1 text-[0.65rem] font-medium text-foreground/50">
              Model: OpenRouter Free
            </span>
            <span className="inline-flex items-center border border-foreground/10 bg-foreground/[0.02] px-2.5 py-1 text-[0.65rem] font-medium text-foreground/50">
              Formality {formalityIndex}% / Humor {humorCoefficient}%
            </span>
            {customPrompt && (
              <span className="inline-flex items-center border border-foreground/10 bg-foreground/[0.02] px-2.5 py-1 text-[0.65rem] font-medium text-foreground/50">
                Custom prompt active
              </span>
            )}
          </div>

          <div className="relative min-h-[200px] border border-foreground/10 bg-foreground/[0.015] p-5">
            {generating ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-foreground/40" />
                <p className="text-xs text-foreground/40">Generating voice preview...</p>
              </div>
            ) : previewError ? (
              <div className="space-y-3">
                <p className="text-sm text-red-600">{previewError}</p>
                <button
                  type="button"
                  onClick={generatePreview}
                  className="inline-flex items-center gap-2 border border-foreground/12 px-3 py-1.5 text-xs font-medium text-foreground/70 transition-colors hover:border-foreground/25 hover:text-foreground"
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry
                </button>
              </div>
            ) : previewOutput ? (
              <div className="space-y-4">
                <p className="text-[0.65rem] font-medium uppercase tracking-wide text-foreground/35">
                  Sample Output
                </p>
                <div className="text-sm leading-7 text-foreground/80 whitespace-pre-wrap">
                  {previewOutput}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <p className="text-xs text-foreground/40">No preview yet.</p>
                <button
                  type="button"
                  onClick={generatePreview}
                  className="inline-flex items-center gap-2 bg-foreground px-4 py-2 text-xs font-semibold text-background transition-opacity hover:opacity-90"
                >
                  Generate Preview
                </button>
              </div>
            )}
          </div>

          {previewOutput && (
            <button
              type="button"
              onClick={generatePreview}
              disabled={generating}
              className="inline-flex items-center gap-2 border border-foreground/12 px-3 py-1.5 text-xs font-medium text-foreground/60 transition-colors hover:border-foreground/25 hover:text-foreground disabled:opacity-50"
            >
              <RefreshCw className={cn("h-3 w-3", generating && "animate-spin")} />
              Regenerate
            </button>
          )}
        </div>
      );
    }

    if (currentStep === 5) {
      return (
        <div className="max-w-2xl">
          <textarea
            value={dryRunInput}
            onChange={(event) => setDryRunInput(event.target.value)}
            placeholder="E.g., I just realized that most AI wrappers are just database CRUD apps with a prompt layer. We need better primitives."
            rows={5}
            className="w-full resize-none border border-foreground/15 bg-transparent p-4 text-sm leading-6 text-foreground outline-none transition-colors placeholder:text-foreground/45 focus:border-foreground"
          />
        </div>
      );
    }

    return (
      <div className="max-w-2xl">
        {error && (
          <div className="mb-8 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4 border border-foreground/10 bg-foreground/[0.02] p-5">
          <div>
            <p className="text-[0.65rem] font-medium uppercase tracking-wide text-foreground/40 mb-1">
              Workspace
            </p>
            <p className="text-base font-semibold text-foreground">{workspaceLabel}</p>
          </div>
          <div className="border-t border-foreground/8 pt-4">
            <p className="text-[0.65rem] font-medium uppercase tracking-wide text-foreground/40 mb-1">
              Timezone
            </p>
            <p className="text-sm text-foreground/75">{timezoneLabel}</p>
          </div>
          <div className="border-t border-foreground/8 pt-4">
            <p className="text-[0.65rem] font-medium uppercase tracking-wide text-foreground/40 mb-1">
              Platforms
            </p>
            <p className="text-sm text-foreground/75">
              {selectedPlatformNames.length > 0
                ? selectedPlatformNames.join(", ")
                : "None selected"}
            </p>
          </div>
          <div className="border-t border-foreground/8 pt-4">
            <p className="text-[0.65rem] font-medium uppercase tracking-wide text-foreground/40 mb-1">
              Voice
            </p>
            <p className="text-sm text-foreground/75">
              Formality {formalityIndex}% / Humor {humorCoefficient}%
              {customPrompt ? " — custom prompt active" : ""}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6F8] dark:bg-[var(--sp-bg)] p-2 sm:p-3 lg:p-4 relative">
      <div className="noise-overlay" />
      <div className="mx-auto grid min-h-[calc(100vh-1rem)] max-w-[1380px] overflow-hidden border border-foreground/10 bg-background shadow-sm md:grid-cols-[220px_minmax(0,1fr)] lg:min-h-[calc(100vh-2rem)] relative">
        <div className="absolute top-6 right-6 sm:top-8 sm:right-8 z-50 pointer-events-auto">
          <ThemeToggle />
        </div>
        {/* Sidebar */}
        <aside className="flex flex-col border-b border-foreground/10 bg-[#FAFAFA] dark:bg-muted/10 px-4 py-6 sm:px-5 md:border-b-0 md:border-r md:px-6 md:py-8">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-5 w-5 items-center justify-center border border-foreground/70">
              <div className="h-2 w-2 bg-foreground" />
            </div>
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-foreground">
                Splintr
              </p>
              <p className="mt-0.5 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-foreground/40">
                Setup
              </p>
            </div>
          </div>

          <nav className="mt-8 md:mt-10">
            <ol className="space-y-0">
              {steps.map((step) => {
                const isCurrent = step.id === currentStep;
                const isComplete = step.id < currentStep;

                return (
                  <li key={step.id}>
                    <button
                      type="button"
                      onClick={() => goToStep(step.id)}
                      aria-current={isCurrent ? "step" : undefined}
                      className="group flex w-full items-center gap-3 py-2.5 text-left"
                    >
                      {isComplete ? (
                        <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#27C93F]">
                          <Check className="h-3 w-3 text-background" strokeWidth={3} />
                        </span>
                      ) : isCurrent ? (
                        <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-foreground" />
                      ) : (
                        <span className="h-[18px] w-[18px] shrink-0 rounded-full border-2 border-foreground/15" />
                      )}
                      <span
                        className={cn(
                          "text-sm font-medium transition-colors",
                          isCurrent
                            ? "text-foreground"
                            : isComplete
                              ? "text-foreground/60"
                              : "text-foreground/30 group-hover:text-foreground/50"
                        )}
                      >
                        {step.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
        </aside>

        {/* Main content */}
        <section className="flex min-h-[520px] flex-col bg-background">
          <div className="flex flex-1 flex-col px-6 py-6 sm:px-8 sm:py-8 md:px-10 md:py-10">
            <div
              key={currentStep}
              className="animate-in fade-in slide-in-from-bottom-2 flex flex-1 flex-col duration-300"
            >
              <div className="mb-6">
                <h1 className="font-sans text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {currentStepMeta.title}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-5 text-foreground/55">
                  {currentStepMeta.description}
                </p>
              </div>

              <div className="flex-1">{renderStepContent()}</div>

              <div className="mt-8 flex items-center justify-between">
                <div>
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={handleBack}
                      className="inline-flex h-9 items-center gap-2 border border-foreground/12 px-4 text-xs font-medium text-foreground/70 transition-colors hover:border-foreground/25 hover:text-foreground"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </button>
                  )}
                </div>

                {currentStep < steps.length ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex h-9 items-center justify-center gap-2 bg-foreground px-5 text-xs font-semibold text-background transition-opacity hover:opacity-90"
                  >
                    {currentStepMeta.actionLabel}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinish}
                    disabled={saving}
                    className="inline-flex h-9 items-center justify-center gap-2 bg-foreground px-5 text-xs font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Launching...
                      </>
                    ) : (
                      <>
                        {currentStepMeta.actionLabel}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Mic2,
  Pencil,
  Trash2,
  Copy,
  Star,
  X,
  Check,
  Loader2,
} from "lucide-react";
import {
  getVoiceProfiles,
  createVoiceProfile,
  updateVoiceProfile,
  deleteVoiceProfile,
  setDefaultProfile,
  addWritingSample,
  removeWritingSample,
  type VoiceProfileData,
} from "@/lib/voice-store";

export default function VoiceProfilesPage() {
  const [profiles, setProfiles] = useState<VoiceProfileData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createTone, setCreateTone] = useState("");
  const [createSliders, setCreateSliders] = useState([
    { label: "Analytical/Emotional", from: "Analytical", to: "Emotional", value: 50 },
    { label: "Formal/Casual", from: "Formal", to: "Casual", value: 50 },
    { label: "Concise/Descriptive", from: "Concise", to: "Descriptive", value: 50 },
  ]);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editTone, setEditTone] = useState("");
  const [editSliders, setEditSliders] = useState<VoiceProfileData["sliders"]>([]);

  // Delete confirm state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Writing sample state
  const [showSampleInput, setShowSampleInput] = useState(false);
  const [newSampleText, setNewSampleText] = useState("");

  // Platform override state
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [platformTone, setPlatformTone] = useState("");
  const [platformSliders, setPlatformSliders] = useState([
    { label: "Analytical/Emotional", from: "Analytical", to: "Emotional", value: 50 },
    { label: "Formal/Casual", from: "Formal", to: "Casual", value: 50 },
    { label: "Concise/Descriptive", from: "Concise", to: "Descriptive", value: 50 },
  ]);

  const activeProfile = profiles.find((p) => p.id === selectedId) || null;

  const refresh = useCallback(async () => {
    try {
      const data = await getVoiceProfiles();
      setProfiles(data);
      // Select first profile if none selected or selected was deleted
      if (data.length > 0 && (!selectedId || !data.find((p) => p.id === selectedId))) {
        setSelectedId(data[0].id);
      }
      if (data.length === 0) {
        setSelectedId(null);
      }
    } catch (err) {
      console.error("Failed to load voice profiles:", err);
    }
  }, [selectedId]);

  useEffect(() => {
    setLoading(true);
    refresh().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Handlers ── */

  async function handleCreate() {
    if (!createName.trim()) return;
    setSaving(true);
    try {
      const created = await createVoiceProfile({
        name: createName.trim(),
        tone: createTone.trim(),
        sliders: createSliders,
      });
      setShowCreate(false);
      setCreateName("");
      setCreateTone("");
      setCreateSliders([
        { label: "Analytical/Emotional", from: "Analytical", to: "Emotional", value: 50 },
        { label: "Formal/Casual", from: "Formal", to: "Casual", value: 50 },
        { label: "Concise/Descriptive", from: "Concise", to: "Descriptive", value: 50 },
      ]);
      await refresh();
      setSelectedId(created.id);
    } catch (err) {
      console.error("Failed to create profile:", err);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(profile: VoiceProfileData) {
    setEditingId(profile.id);
    setEditName(profile.name);
    setEditTone(profile.tone);
    setEditSliders(profile.sliders.map((s) => ({ ...s })));
  }

  async function handleSaveEdit() {
    if (!editingId || !editName.trim()) return;
    setSaving(true);
    try {
      await updateVoiceProfile(editingId, {
        name: editName.trim(),
        tone: editTone.trim(),
        sliders: editSliders,
      });
      setEditingId(null);
      await refresh();
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setSaving(true);
    try {
      await deleteVoiceProfile(id);
      setConfirmDeleteId(null);
      if (selectedId === id) setSelectedId(null);
      await refresh();
    } catch (err) {
      console.error("Failed to delete profile:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDuplicate(profile: VoiceProfileData) {
    setSaving(true);
    try {
      const created = await createVoiceProfile({
        name: `${profile.name} (Copy)`,
        tone: profile.tone,
        sliders: profile.sliders.map((s) => ({ ...s })),
        writingSamples: [...profile.writingSamples],
        systemPrompt: profile.systemPrompt,
        platformOverrides: { ...profile.platformOverrides },
      });
      await refresh();
      setSelectedId(created.id);
    } catch (err) {
      console.error("Failed to duplicate profile:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleSetDefault(id: string) {
    setSaving(true);
    try {
      await setDefaultProfile(id);
      await refresh();
    } catch (err) {
      console.error("Failed to set default:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddSample() {
    if (!activeProfile || !newSampleText.trim()) return;
    setSaving(true);
    try {
      await addWritingSample(activeProfile.id, newSampleText.trim());
      setNewSampleText("");
      setShowSampleInput(false);
      await refresh();
    } catch (err) {
      console.error("Failed to add sample:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveSample(index: number) {
    if (!activeProfile) return;
    setSaving(true);
    try {
      await removeWritingSample(activeProfile.id, index);
      await refresh();
    } catch (err) {
      console.error("Failed to remove sample:", err);
    } finally {
      setSaving(false);
    }
  }

  // Platform key mapping for display names
  const platformKeyMap: Record<string, string> = {
    "LinkedIn": "linkedin",
    "X / Twitter": "x",
    "Instagram": "instagram",
    "YouTube": "youtube",
    "TikTok": "tiktok",
    "Threads": "threads",
    "Meta": "meta",
    "Blog": "blog",
  };

  function openPlatformOverride(displayName: string) {
    if (!activeProfile) return;
    const key = platformKeyMap[displayName];
    const override = (activeProfile.platformOverrides?.[key] || {}) as {
      tone?: string;
      sliders?: VoiceProfileData["sliders"];
    };
    setPlatformTone(override.tone || "");
    setPlatformSliders(
      override.sliders?.map((s) => ({ ...s })) ||
      activeProfile.sliders.map((s) => ({ ...s }))
    );
    setEditingPlatform(displayName);
  }

  async function handleSavePlatformOverride() {
    if (!activeProfile || !editingPlatform) return;
    const key = platformKeyMap[editingPlatform];
    setSaving(true);
    try {
      const existingOverrides = { ...(activeProfile.platformOverrides || {}) };
      // If tone is empty and sliders match base profile, remove the override
      const slidersMatch = platformSliders.every((s, i) =>
        activeProfile.sliders[i] && s.value === activeProfile.sliders[i].value
      );
      if (!platformTone.trim() && slidersMatch) {
        delete existingOverrides[key];
      } else {
        existingOverrides[key] = {
          tone: platformTone.trim(),
          sliders: platformSliders,
        };
      }
      await updateVoiceProfile(activeProfile.id, {
        platformOverrides: existingOverrides,
      });
      setEditingPlatform(null);
      await refresh();
    } catch (err) {
      console.error("Failed to save platform override:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPlatformOverride() {
    if (!activeProfile || !editingPlatform) return;
    const key = platformKeyMap[editingPlatform];
    setSaving(true);
    try {
      const existingOverrides = { ...(activeProfile.platformOverrides || {}) };
      delete existingOverrides[key];
      await updateVoiceProfile(activeProfile.id, {
        platformOverrides: existingOverrides,
      });
      setEditingPlatform(null);
      await refresh();
    } catch (err) {
      console.error("Failed to reset platform override:", err);
    } finally {
      setSaving(false);
    }
  }

  function hasPlatformOverride(displayName: string): boolean {
    if (!activeProfile) return false;
    const key = platformKeyMap[displayName];
    return !!activeProfile.platformOverrides?.[key];
  }

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-7 w-48 bg-foreground/5 rounded animate-pulse" />
            <div className="h-4 w-72 bg-foreground/5 rounded animate-pulse mt-2" />
          </div>
          <div className="h-10 w-36 bg-foreground/5 rounded-lg animate-pulse" />
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-foreground/5 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-foreground/5 rounded-xl animate-pulse" />
            <div className="h-48 bg-foreground/5 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  /* ── Main render ── */
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-sans text-2xl font-bold tracking-tight text-[var(--sp-fg)]">Voice Profiles</h1>
          <p className="font-mono text-sm text-[var(--sp-fg-light)] mt-1">Train the AI to match your writing style</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setEditingId(null); }}
          className="h-10 px-5 bg-[var(--sp-fg)] text-background rounded-lg font-mono text-xs font-extrabold tracking-[0.15em] uppercase flex items-center gap-2 hover:bg-foreground transition-colors"
        >
          <Plus className="w-4 h-4" /> New Profile
        </button>
      </div>

      {/* Empty state */}
      {profiles.length === 0 && !showCreate && (
        <div className="text-center py-20">
          <Mic2 className="w-12 h-12 mx-auto text-[var(--sp-fg-light)] mb-4" />
          <h2 className="text-lg font-semibold text-[var(--sp-fg)] mb-2">No voice profiles yet</h2>
          <p className="text-sm text-[var(--sp-fg-light)] mb-6">Create your first voice profile to get started.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="h-10 px-5 bg-[var(--sp-fg)] text-background rounded-lg font-mono text-xs font-extrabold tracking-[0.15em] uppercase inline-flex items-center gap-2 hover:bg-foreground transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Profile
          </button>
        </div>
      )}

      {(profiles.length > 0 || showCreate) && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile list sidebar */}
          <div className="space-y-3">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => { setSelectedId(profile.id); setEditingId(null); }}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  selectedId === profile.id
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
                  <span>{profile.tone || "No tone set"}</span>
                  <span>·</span>
                  <span>{profile.writingSamples.length} samples</span>
                </div>
              </button>
            ))}

            <button
              onClick={() => { setShowCreate(true); setEditingId(null); }}
              className="w-full p-4 rounded-xl border border-dashed border-sp-fg/15 text-center text-sm font-medium text-[var(--sp-fg-light)] hover:border-sp-fg/30 hover:text-[var(--sp-fg)] transition-colors"
            >
              + Create new profile
            </button>
          </div>

          {/* Detail area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create form */}
            {showCreate && (
              <div className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[var(--sp-fg)]">New Voice Profile</h2>
                  <button
                    onClick={() => setShowCreate(false)}
                    className="w-9 h-9 rounded-lg border border-foreground/5 flex items-center justify-center text-[var(--sp-fg-light)] hover:bg-[var(--sp-bg)] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-mono text-[var(--sp-fg-light)] mb-2">Profile Name</label>
                    <input
                      type="text"
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      placeholder="e.g. Professional, Casual..."
                      className="w-full h-10 px-3 rounded-lg border border-foreground/10 bg-[var(--sp-bg)] text-sm text-[var(--sp-fg)] placeholder:text-[var(--sp-fg-light)] focus:outline-none focus:border-[var(--sp-fg)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-[var(--sp-fg-light)] mb-2">Tone</label>
                    <input
                      type="text"
                      value={createTone}
                      onChange={(e) => setCreateTone(e.target.value)}
                      placeholder="e.g. Authoritative, Friendly, Witty..."
                      className="w-full h-10 px-3 rounded-lg border border-foreground/10 bg-[var(--sp-bg)] text-sm text-[var(--sp-fg)] placeholder:text-[var(--sp-fg-light)] focus:outline-none focus:border-[var(--sp-fg)]"
                    />
                  </div>
                </div>

                <div className="space-y-5 mb-6">
                  {createSliders.map((slider, i) => (
                    <div key={slider.label}>
                      <div className="flex justify-between text-xs font-mono text-[var(--sp-fg-light)] mb-2">
                        <span>{slider.from}</span>
                        <span>{slider.to}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={slider.value}
                        onChange={(e) => {
                          const updated = [...createSliders];
                          updated[i] = { ...updated[i], value: parseInt(e.target.value) };
                          setCreateSliders(updated);
                        }}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowCreate(false)}
                    className="h-9 px-4 rounded-lg border border-foreground/10 text-sm text-[var(--sp-fg-light)] hover:bg-[var(--sp-bg)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!createName.trim() || saving}
                    className="h-9 px-4 bg-[var(--sp-fg)] text-background rounded-lg text-sm font-semibold hover:bg-foreground transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                    Save Profile
                  </button>
                </div>
              </div>
            )}

            {/* Active profile detail */}
            {activeProfile && !showCreate && (
              <>
                {/* Header card */}
                <div className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      {editingId === activeProfile.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Profile name"
                            className="text-xl font-bold bg-transparent border-b-2 border-[var(--sp-fg)] focus:outline-none text-[var(--sp-fg)]"
                          />
                          <input
                            type="text"
                            value={editTone}
                            onChange={(e) => setEditTone(e.target.value)}
                            placeholder="Tone (e.g. Authoritative, Friendly...)"
                            className="text-sm bg-transparent border-b border-[var(--sp-fg)]/50 focus:outline-none text-[var(--sp-fg-light)] w-full"
                          />
                        </div>
                      ) : (
                        <h2 className="text-xl font-bold text-[var(--sp-fg)]">{activeProfile.name}</h2>
                      )}
                      <p className="text-sm text-[var(--sp-fg-light)] mt-1">
                        {activeProfile.tone || "No tone set"} · {activeProfile.writingSamples.length} samples
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {editingId === activeProfile.id ? (
                        <>
                          <button
                            onClick={() => setEditingId(null)}
                            className="h-9 px-3 rounded-lg border border-foreground/10 text-sm text-[var(--sp-fg-light)] hover:bg-[var(--sp-bg)] transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            disabled={saving}
                            className="h-9 px-3 bg-[var(--sp-fg)] text-background rounded-lg text-sm font-semibold hover:bg-foreground transition-colors disabled:opacity-50 flex items-center gap-2"
                          >
                            {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                            <Check className="w-4 h-4" /> Save
                          </button>
                        </>
                      ) : (
                        <>
                          {!activeProfile.isDefault && (
                            <button
                              onClick={() => handleSetDefault(activeProfile.id)}
                              disabled={saving}
                              title="Set as Default"
                              className="w-9 h-9 rounded-lg border border-foreground/5 flex items-center justify-center text-[var(--sp-fg-light)] hover:bg-[var(--sp-bg)] hover:text-amber-500 transition-colors"
                            >
                              <Star className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => startEdit(activeProfile)}
                            title="Edit"
                            className="w-9 h-9 rounded-lg border border-foreground/5 flex items-center justify-center text-[var(--sp-fg-light)] hover:bg-[var(--sp-bg)] transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(activeProfile)}
                            disabled={saving}
                            title="Duplicate"
                            className="w-9 h-9 rounded-lg border border-foreground/5 flex items-center justify-center text-[var(--sp-fg-light)] hover:bg-[var(--sp-bg)] transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          {!activeProfile.isDefault && (
                            <button
                              onClick={() => setConfirmDeleteId(activeProfile.id)}
                              disabled={saving}
                              title="Delete"
                              className="w-9 h-9 rounded-lg border border-red-100 dark:border-red-900/30 flex items-center justify-center text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Delete confirmation */}
                  {confirmDeleteId === activeProfile.id && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                        Delete &quot;{activeProfile.name}&quot;? This cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="h-8 px-3 rounded-lg border border-red-200 dark:border-red-700 text-sm text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDelete(activeProfile.id)}
                          disabled={saving}
                          className="h-8 px-3 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                          Delete
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Sliders */}
                  <div className="space-y-5">
                    {(editingId === activeProfile.id ? editSliders : activeProfile.sliders).map((slider, i) => (
                      <div key={slider.label}>
                        <div className="flex justify-between text-xs font-mono text-[var(--sp-fg-light)] mb-2">
                          <span>{slider.from}</span>
                          <span>{slider.to}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={slider.value}
                          disabled={editingId !== activeProfile.id}
                          onChange={(e) => {
                            if (editingId === activeProfile.id) {
                              const updated = [...editSliders];
                              updated[i] = { ...updated[i], value: parseInt(e.target.value) };
                              setEditSliders(updated);
                            }
                          }}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Info bar */}
                  <div className="mt-6 p-4 bg-[var(--sp-bg)] rounded-lg" style={{ borderLeftWidth: 3, borderLeftColor: "#27C93F" }}>
                    <div className="font-mono text-xs text-[var(--sp-fg-light)]">
                      [SYS_LOG]: Voice profile &quot;{activeProfile.name}&quot;{activeProfile.isDefault ? " (DEFAULT)" : ""} · {activeProfile.writingSamples.length} writing samples loaded
                    </div>
                  </div>
                </div>

                {/* Writing samples */}
                <div className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-[var(--sp-fg)]">Writing Samples</h3>
                    <button
                      onClick={() => { setShowSampleInput(true); setNewSampleText(""); }}
                      className="text-xs font-mono font-extrabold tracking-[0.15em] uppercase text-[var(--sp-fg-light)] hover:text-[var(--sp-fg)] transition-colors"
                    >
                      + Add Sample
                    </button>
                  </div>
                  <p className="text-xs text-[var(--sp-fg-light)] mb-4">
                    The more samples you provide, the better the AI matches your voice.
                  </p>

                  {/* Add sample input */}
                  {showSampleInput && (
                    <div className="mb-4 space-y-3">
                      <textarea
                        value={newSampleText}
                        onChange={(e) => setNewSampleText(e.target.value)}
                        placeholder="Paste a writing sample here..."
                        rows={4}
                        className="w-full p-3 rounded-lg border border-foreground/10 bg-[var(--sp-bg)] text-sm text-[var(--sp-fg)] placeholder:text-[var(--sp-fg-light)] focus:outline-none focus:border-[var(--sp-fg)] resize-none"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setShowSampleInput(false)}
                          className="h-8 px-3 rounded-lg border border-foreground/10 text-sm text-[var(--sp-fg-light)] hover:bg-[var(--sp-bg)] transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddSample}
                          disabled={!newSampleText.trim() || saving}
                          className="h-8 px-3 bg-[var(--sp-fg)] text-background rounded-lg text-sm font-semibold hover:bg-foreground transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                          Save Sample
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Sample list */}
                  <div className="space-y-3">
                    {activeProfile.writingSamples.length === 0 && !showSampleInput && (
                      <div className="p-4 text-center text-sm text-[var(--sp-fg-light)] bg-[var(--sp-bg)] rounded-lg">
                        No writing samples yet. Add some to improve voice matching.
                      </div>
                    )}
                    {activeProfile.writingSamples.map((sample, i) => (
                      <div key={i} className="group p-3 bg-[var(--sp-bg)] rounded-lg text-sm text-[var(--sp-fg-mid)] flex items-start gap-2">
                        <span className="flex-1 line-clamp-2">{sample}</span>
                        <button
                          onClick={() => handleRemoveSample(i)}
                          disabled={saving}
                          className="shrink-0 w-6 h-6 rounded flex items-center justify-center text-[var(--sp-fg-light)] hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Platform overrides */}
                <div className="bg-background dark:bg-[#121214] rounded-xl border border-foreground/5 dark:border-white/5 p-6">
                  <h3 className="font-semibold mb-1 text-[var(--sp-fg)]">Platform Overrides</h3>
                  <p className="text-xs text-[var(--sp-fg-light)] mb-4">Customize voice settings per platform</p>

                  {/* Platform edit panel */}
                  {editingPlatform && (
                    <div className="mb-4 p-4 rounded-xl border border-[var(--sp-fg)]/20 bg-[var(--sp-bg)]">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold text-[var(--sp-fg)]">{editingPlatform} Override</h4>
                        <button
                          onClick={() => setEditingPlatform(null)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--sp-fg-light)] hover:bg-foreground/5 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="mb-4">
                        <label className="block text-xs font-mono text-[var(--sp-fg-light)] mb-2">
                          Tone Override <span className="opacity-50">(leave empty to use profile default)</span>
                        </label>
                        <input
                          type="text"
                          value={platformTone}
                          onChange={(e) => setPlatformTone(e.target.value)}
                          placeholder={activeProfile.tone || "e.g. Conversational, Bold..."}
                          className="w-full h-9 px-3 rounded-lg border border-foreground/10 bg-background dark:bg-[#121214] text-sm text-[var(--sp-fg)] placeholder:text-[var(--sp-fg-light)] focus:outline-none focus:border-[var(--sp-fg)]"
                        />
                      </div>

                      <div className="space-y-4 mb-4">
                        {platformSliders.map((slider, i) => (
                          <div key={slider.label}>
                            <div className="flex justify-between text-xs font-mono text-[var(--sp-fg-light)] mb-1.5">
                              <span>{slider.from}</span>
                              <span>{slider.to}</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={slider.value}
                              onChange={(e) => {
                                const updated = [...platformSliders];
                                updated[i] = { ...updated[i], value: parseInt(e.target.value) };
                                setPlatformSliders(updated);
                              }}
                              className="w-full"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 justify-end">
                        {hasPlatformOverride(editingPlatform) && (
                          <button
                            onClick={handleResetPlatformOverride}
                            disabled={saving}
                            className="h-8 px-3 rounded-lg border border-red-200 dark:border-red-800 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            Reset to Default
                          </button>
                        )}
                        <button
                          onClick={() => setEditingPlatform(null)}
                          className="h-8 px-3 rounded-lg border border-foreground/10 text-sm text-[var(--sp-fg-light)] hover:bg-foreground/5 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSavePlatformOverride}
                          disabled={saving}
                          className="h-8 px-3 bg-[var(--sp-fg)] text-background rounded-lg text-sm font-semibold hover:bg-foreground transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                          Save Override
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {["LinkedIn", "X / Twitter", "Instagram", "YouTube", "TikTok", "Threads", "Meta", "Blog"].map((platform) => {
                      const hasOverride = hasPlatformOverride(platform);
                      const key = platformKeyMap[platform];
                      const override = hasOverride
                        ? (activeProfile.platformOverrides[key] as { tone?: string })
                        : null;
                      return (
                        <button
                          key={platform}
                          onClick={() => openPlatformOverride(platform)}
                          className={`p-4 rounded-xl border text-left transition-colors ${
                            editingPlatform === platform
                              ? "border-[var(--sp-fg)] bg-[var(--sp-bg)]"
                              : hasOverride
                                ? "border-[var(--sp-green)]/30 bg-[var(--sp-green)]/5 hover:border-[var(--sp-green)]/50"
                                : "border-sp-fg/10 hover:border-sp-fg/20"
                          }`}
                        >
                          <div className="text-sm font-medium mb-1">{platform}</div>
                          <div className="text-xs text-[var(--sp-fg-light)]">
                            {hasOverride
                              ? `Custom${override?.tone ? ` · ${override.tone}` : ""}`
                              : "Using default settings"}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* No profile selected and not creating */}
            {!activeProfile && !showCreate && profiles.length > 0 && (
              <div className="text-center py-16 text-[var(--sp-fg-light)]">
                <Mic2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Select a profile to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

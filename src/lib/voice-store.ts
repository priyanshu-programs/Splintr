/**
 * voice-store.ts
 *
 * Dual-mode storage layer for voice profiles.
 * - Mock mode (NEXT_PUBLIC_MOCK_AUTH=true): uses localStorage
 * - Real mode: uses Supabase
 */

import { MOCK_AUTH_ENABLED } from "@/lib/auth/mock-auth";
import { createClient } from "@/lib/supabase/client";

/* ── Types ── */

export interface VoiceProfileData {
  id: string;
  name: string;
  tone: string;
  isDefault: boolean;
  systemPrompt: string | null;
  writingSamples: string[];
  platformOverrides: Record<string, unknown>;
  sliders: { label: string; from: string; to: string; value: number }[];
  createdAt: string;
  updatedAt: string;
}

/* ── localStorage helpers ── */

const STORAGE_KEY = "splintr_voice_profiles";

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function readLocalProfiles(): VoiceProfileData[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const profiles = JSON.parse(raw) as VoiceProfileData[];
      // Migrate: backfill missing tones on legacy profiles
      let migrated = false;
      const defaultTones: Record<string, string> = {
        "Professional": "Authoritative",
        "Casual & Witty": "Conversational",
        "Educational": "Informative",
      };
      for (const p of profiles) {
        if (!p.tone && defaultTones[p.name]) {
          p.tone = defaultTones[p.name];
          migrated = true;
        }
        if (!p.platformOverrides) {
          p.platformOverrides = {};
          migrated = true;
        }
      }
      if (migrated) writeLocalProfiles(profiles);
      return profiles;
    }
  } catch {
    // fall through to seed
  }
  // Seed default profiles on first access
  const seeded = seedDefaultProfiles();
  writeLocalProfiles(seeded);
  return seeded;
}

function writeLocalProfiles(profiles: VoiceProfileData[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

function seedDefaultProfiles(): VoiceProfileData[] {
  const now = new Date().toISOString();
  const defaultSliders = (values: [number, number, number]) => [
    { label: "Analytical/Emotional", from: "Analytical", to: "Emotional", value: values[0] },
    { label: "Formal/Casual", from: "Formal", to: "Casual", value: values[1] },
    { label: "Concise/Descriptive", from: "Concise", to: "Descriptive", value: values[2] },
  ];

  return [
    {
      id: generateId(),
      name: "Professional",
      tone: "Authoritative",
      isDefault: true,
      systemPrompt: null,
      writingSamples: [
        "The future of content isn't about volume — it's about velocity of value. Every platform has its own language...",
        "I've spent the last decade building content strategies for B2B brands. Here's the one thing that actually moved the needle...",
        "Thread: 7 lessons from scaling a content team from 1 to 15 people (while maintaining quality)...",
      ],
      platformOverrides: {},
      sliders: defaultSliders([30, 25, 40]),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      name: "Casual & Witty",
      tone: "Conversational",
      isDefault: false,
      systemPrompt: null,
      writingSamples: [],
      platformOverrides: {},
      sliders: defaultSliders([70, 80, 55]),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      name: "Educational",
      tone: "Informative",
      isDefault: false,
      systemPrompt: null,
      writingSamples: [],
      platformOverrides: {},
      sliders: defaultSliders([20, 45, 70]),
      createdAt: now,
      updatedAt: now,
    },
  ];
}

/* ── Supabase helpers ── */

function mapDbToProfile(row: Record<string, unknown>): VoiceProfileData {
  const overrides = (row.platform_overrides as Record<string, unknown>) || {};
  const sliders = (overrides.sliders as VoiceProfileData["sliders"]) || [
    { label: "Analytical/Emotional", from: "Analytical", to: "Emotional", value: 50 },
    { label: "Formal/Casual", from: "Formal", to: "Casual", value: 50 },
    { label: "Concise/Descriptive", from: "Concise", to: "Descriptive", value: 50 },
  ];

  return {
    id: row.id as string,
    name: row.name as string,
    tone: (row.tone as string) || "",
    isDefault: (row.is_default as boolean) || false,
    systemPrompt: (row.system_prompt as string) || null,
    writingSamples: (row.writing_samples as string[]) || [],
    platformOverrides: overrides,
    sliders,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

async function getWorkspaceId(supabase: ReturnType<typeof createClient>): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: workspaces } = await supabase
    .from("workspaces")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  if (!workspaces || workspaces.length === 0) {
    throw new Error("No workspace found");
  }

  return (workspaces[0] as any).id;
}

/* ── Public API ── */

/**
 * Get all voice profiles for the current workspace.
 */
export async function getVoiceProfiles(): Promise<VoiceProfileData[]> {
  if (MOCK_AUTH_ENABLED) {
    return readLocalProfiles();
  }

  const supabase = createClient();
  const wsId = await getWorkspaceId(supabase);

  const { data, error } = await supabase
    .from("voice_profiles")
    .select("*")
    .eq("workspace_id", wsId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    console.error("Failed to fetch voice profiles:", error);
    return [];
  }

  return data.map((row: any) => mapDbToProfile(row));
}

/**
 * Get a single voice profile by ID.
 */
export async function getVoiceProfile(id: string): Promise<VoiceProfileData | null> {
  if (MOCK_AUTH_ENABLED) {
    const profiles = readLocalProfiles();
    return profiles.find((p) => p.id === id) || null;
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from("voice_profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return mapDbToProfile(data as any);
}

/**
 * Create a new voice profile.
 */
export async function createVoiceProfile(
  data: Partial<VoiceProfileData> & { name: string }
): Promise<VoiceProfileData> {
  const now = new Date().toISOString();

  if (MOCK_AUTH_ENABLED) {
    const profiles = readLocalProfiles();
    const newProfile: VoiceProfileData = {
      id: generateId(),
      name: data.name,
      tone: data.tone || "",
      isDefault: data.isDefault || false,
      systemPrompt: data.systemPrompt || null,
      writingSamples: data.writingSamples || [],
      platformOverrides: data.platformOverrides || {},
      sliders: data.sliders || [
        { label: "Analytical/Emotional", from: "Analytical", to: "Emotional", value: 50 },
        { label: "Formal/Casual", from: "Formal", to: "Casual", value: 50 },
        { label: "Concise/Descriptive", from: "Concise", to: "Descriptive", value: 50 },
      ],
      createdAt: now,
      updatedAt: now,
    };

    // If setting as default, unset previous
    if (newProfile.isDefault) {
      profiles.forEach((p) => (p.isDefault = false));
    }

    profiles.push(newProfile);
    writeLocalProfiles(profiles);
    return newProfile;
  }

  const supabase = createClient();
  const wsId = await getWorkspaceId(supabase);

  const sliders = data.sliders || [
    { label: "Analytical/Emotional", from: "Analytical", to: "Emotional", value: 50 },
    { label: "Formal/Casual", from: "Formal", to: "Casual", value: 50 },
    { label: "Concise/Descriptive", from: "Concise", to: "Descriptive", value: 50 },
  ];

  // If setting as default, unset previous
  if (data.isDefault) {
    await (supabase.from("voice_profiles") as any)
      .update({ is_default: false })
      .eq("workspace_id", wsId)
      .eq("is_default", true);
  }

  const { data: row, error } = await supabase
    .from("voice_profiles")
    .insert({
      workspace_id: wsId,
      name: data.name,
      tone: data.tone || "",
      is_default: data.isDefault || false,
      system_prompt: data.systemPrompt || null,
      writing_samples: data.writingSamples || [],
      platform_overrides: { ...data.platformOverrides, sliders },
    } as any)
    .select("*")
    .single();

  if (error || !row) {
    throw new Error(error?.message || "Failed to create voice profile");
  }

  return mapDbToProfile(row as any);
}

/**
 * Update an existing voice profile.
 */
export async function updateVoiceProfile(
  id: string,
  data: Partial<VoiceProfileData>
): Promise<VoiceProfileData | null> {
  const now = new Date().toISOString();

  if (MOCK_AUTH_ENABLED) {
    const profiles = readLocalProfiles();
    const idx = profiles.findIndex((p) => p.id === id);
    if (idx === -1) return null;

    const updated = { ...profiles[idx], ...data, updatedAt: now };
    profiles[idx] = updated;
    writeLocalProfiles(profiles);
    return updated;
  }

  const supabase = createClient();

  const updateData: Record<string, unknown> = { updated_at: now };
  if (data.name !== undefined) updateData.name = data.name;
  if (data.tone !== undefined) updateData.tone = data.tone;
  if (data.isDefault !== undefined) updateData.is_default = data.isDefault;
  if (data.systemPrompt !== undefined) updateData.system_prompt = data.systemPrompt;
  if (data.writingSamples !== undefined) updateData.writing_samples = data.writingSamples;
  if (data.sliders !== undefined || data.platformOverrides !== undefined) {
    // Merge sliders into platform_overrides
    const existing = await getVoiceProfile(id);
    const overrides = { ...(existing?.platformOverrides || {}), ...(data.platformOverrides || {}) };
    if (data.sliders) overrides.sliders = data.sliders;
    updateData.platform_overrides = overrides;
  }

  const { data: row, error } = await (supabase
    .from("voice_profiles") as any)
    .update(updateData)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !row) {
    throw new Error(error?.message || "Failed to update voice profile");
  }

  return mapDbToProfile(row as any);
}

/**
 * Delete a voice profile. Cannot delete the default profile.
 */
export async function deleteVoiceProfile(id: string): Promise<void> {
  if (MOCK_AUTH_ENABLED) {
    const profiles = readLocalProfiles();
    const profile = profiles.find((p) => p.id === id);
    if (!profile) return;
    if (profile.isDefault) throw new Error("Cannot delete the default profile");

    const filtered = profiles.filter((p) => p.id !== id);
    writeLocalProfiles(filtered);
    return;
  }

  const supabase = createClient();

  // Check if default
  const { data: profile } = await supabase
    .from("voice_profiles")
    .select("is_default")
    .eq("id", id)
    .single();

  if ((profile as any)?.is_default) {
    throw new Error("Cannot delete the default profile");
  }

  const { error } = await (supabase.from("voice_profiles") as any).delete().eq("id", id);
  if (error) throw new Error(error.message || "Failed to delete voice profile");
}

/**
 * Set a profile as the default, unsetting the previous default.
 */
export async function setDefaultProfile(id: string): Promise<void> {
  if (MOCK_AUTH_ENABLED) {
    const profiles = readLocalProfiles();
    profiles.forEach((p) => (p.isDefault = p.id === id));
    writeLocalProfiles(profiles);
    return;
  }

  const supabase = createClient();
  const wsId = await getWorkspaceId(supabase);

  // Unset current default
  await (supabase.from("voice_profiles") as any)
    .update({ is_default: false })
    .eq("workspace_id", wsId)
    .eq("is_default", true);

  // Set new default
  const { error } = await (supabase.from("voice_profiles") as any)
    .update({ is_default: true })
    .eq("id", id);

  if (error) throw new Error(error.message || "Failed to set default profile");
}

/**
 * Add a writing sample to a profile.
 */
export async function addWritingSample(profileId: string, sample: string): Promise<void> {
  if (MOCK_AUTH_ENABLED) {
    const profiles = readLocalProfiles();
    const profile = profiles.find((p) => p.id === profileId);
    if (!profile) return;
    profile.writingSamples.push(sample);
    profile.updatedAt = new Date().toISOString();
    writeLocalProfiles(profiles);
    return;
  }

  const supabase = createClient();

  const { data: profile } = await supabase
    .from("voice_profiles")
    .select("writing_samples")
    .eq("id", profileId)
    .single();

  if (!profile) throw new Error("Profile not found");

  const samples = [...((profile as any).writing_samples || []), sample];

  const { error } = await (supabase.from("voice_profiles") as any)
    .update({ writing_samples: samples, updated_at: new Date().toISOString() })
    .eq("id", profileId);

  if (error) throw new Error(error.message || "Failed to add writing sample");
}

/**
 * Remove a writing sample by index.
 */
export async function removeWritingSample(profileId: string, index: number): Promise<void> {
  if (MOCK_AUTH_ENABLED) {
    const profiles = readLocalProfiles();
    const profile = profiles.find((p) => p.id === profileId);
    if (!profile) return;
    if (index < 0 || index >= profile.writingSamples.length) return;
    profile.writingSamples.splice(index, 1);
    profile.updatedAt = new Date().toISOString();
    writeLocalProfiles(profiles);
    return;
  }

  const supabase = createClient();

  const { data: profile } = await supabase
    .from("voice_profiles")
    .select("writing_samples")
    .eq("id", profileId)
    .single();

  if (!profile) throw new Error("Profile not found");

  const samples = [...((profile as any).writing_samples || [])];
  if (index < 0 || index >= samples.length) return;
  samples.splice(index, 1);

  const { error } = await (supabase.from("voice_profiles") as any)
    .update({ writing_samples: samples, updated_at: new Date().toISOString() })
    .eq("id", profileId);

  if (error) throw new Error(error.message || "Failed to remove writing sample");
}

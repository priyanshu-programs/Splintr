/**
 * content-store.ts
 *
 * Dual-mode storage layer for approved content.
 * - Mock mode (NEXT_PUBLIC_MOCK_AUTH=true): uses localStorage
 * - Real mode: uses Supabase
 */

import { MOCK_AUTH_ENABLED } from "@/lib/auth/mock-auth";
import { createClient } from "@/lib/supabase/client";

/* ── Types ── */

export interface ApprovedItem {
  id: string;
  batchId: string;
  title: string;
  sourceType: string;
  sourceContent: string;
  platform: string;
  outputType: string;
  content: string;
  status: "ready" | "published";
  createdAt: string;
  wordCount: number;
}

export interface LibraryContentItem {
  id: string;
  title: string;
  sourceType: string;
  status: string;
  outputCount: number;
  platforms: string[];
  createdAt: string;
  wordCount: number;
  generations: {
    id: string;
    platform: string;
    outputType: string;
    content: string;
    status: string;
  }[];
}

/** A flat item representing a single generation (used for per-generation library view). */
export interface FlatGenerationItem {
  id: string;
  title: string;
  sourceType: string;
  platform: string;
  outputType: string;
  content: string;
  status: string;
  createdAt: string;
  wordCount: number;
}

export interface ConnectedPlatform {
  id: string;
  platform: string;
  username: string | null;
  connected: boolean;
}

/* ── localStorage helpers ── */

const STORAGE_KEY = "splintr_approved_items";

function readLocalItems(): ApprovedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalItems(items: ApprovedItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/* ── Mock-mode connected platforms (mirrors setup/page.tsx defaults) ── */

const MOCK_CONNECTED_PLATFORMS: ConnectedPlatform[] = [
  { id: "linkedin", platform: "linkedin", username: "@johndoe", connected: true },
  { id: "x", platform: "x", username: "@johndoe_x", connected: true },
  { id: "instagram", platform: "instagram", username: null, connected: false },
  { id: "youtube", platform: "youtube", username: null, connected: false },
  { id: "tiktok", platform: "tiktok", username: null, connected: false },
  { id: "threads", platform: "threads", username: null, connected: false },
  { id: "meta", platform: "meta", username: null, connected: false },
  { id: "blog", platform: "blog", username: null, connected: false },
];

/* ── Public API ── */

/**
 * Approve a generated content output.
 * Stores it so it appears in the Library.
 */
export async function approveContent(params: {
  batchId: string;
  title: string;
  sourceType: string;
  sourceContent: string;
  platform: string;
  outputType: string;
  generatedContent: string;
}): Promise<{ id: string }> {
  const wordCount = params.sourceContent.split(/\s+/).filter(Boolean).length;

  if (MOCK_AUTH_ENABLED) {
    const item: ApprovedItem = {
      id: generateId(),
      batchId: params.batchId,
      title: params.title || params.sourceContent.slice(0, 60).replace(/\n/g, " ").trim() + (params.sourceContent.length > 60 ? "…" : "") || `Content - ${new Date().toLocaleDateString()}`,
      sourceType: params.sourceType,
      sourceContent: params.sourceContent,
      platform: params.platform,
      outputType: params.outputType,
      content: params.generatedContent,
      status: "ready",
      createdAt: new Date().toISOString(),
      wordCount,
    };
    const items = readLocalItems();
    items.unshift(item);
    writeLocalItems(items);
    return { id: item.id };
  }

  // Real Supabase mode
  const supabase = createClient();

  // 1. Create content_item (source)
  const { data: contentItem, error: ciError } = await supabase
    .from("content_items")
    .insert({
      workspace_id: (await getWorkspaceId(supabase)),
      title: params.title || params.sourceContent.slice(0, 60).replace(/\n/g, " ").trim() + (params.sourceContent.length > 60 ? "…" : "") || `Content - ${new Date().toLocaleDateString()}`,
      source_type: params.sourceType,
      source_content: params.sourceContent,
      word_count: wordCount,
      status: "ready",
    } as any)
    .select("id")
    .single();

  if (ciError || !contentItem) {
    throw new Error(ciError?.message || "Failed to create content item");
  }

  // 2. Create generation
  const { data: generation, error: genError } = await supabase
    .from("generations")
    .insert({
      content_item_id: (contentItem as any).id,
      workspace_id: (await getWorkspaceId(supabase)),
      platform: params.platform,
      output_type: params.outputType,
      generated_content: params.generatedContent,
      status: "ready",
      ai_tokens_used: 0,
    } as any)
    .select("id")
    .single();

  if (genError || !generation) {
    throw new Error(genError?.message || "Failed to create generation");
  }

  return { id: (generation as any).id };
}

/**
 * Get all library items, grouped by source content.
 */
export async function getLibraryItems(): Promise<LibraryContentItem[]> {
  if (MOCK_AUTH_ENABLED) {
    const items = readLocalItems();

    // Group by batchId to create content items with multiple generations
    const grouped = new Map<string, LibraryContentItem>();

    for (const item of items) {
      const key = item.batchId || item.title; // fallback for legacy items without batchId
      if (grouped.has(key)) {
        const existing = grouped.get(key)!;
        existing.outputCount++;
        if (!existing.platforms.includes(item.platform)) {
          existing.platforms.push(item.platform);
        }
        existing.generations.push({
          id: item.id,
          platform: item.platform,
          outputType: item.outputType,
          content: item.content,
          status: item.status,
        });
      } else {
        grouped.set(key, {
          id: key,
          title: item.title,
          sourceType: item.sourceType,
          status: item.status,
          outputCount: 1,
          platforms: [item.platform],
          createdAt: item.createdAt,
          wordCount: item.wordCount,
          generations: [
            {
              id: item.id,
              platform: item.platform,
              outputType: item.outputType,
              content: item.content,
              status: item.status,
            },
          ],
        });
      }
    }

    return Array.from(grouped.values());
  }

  // Real Supabase mode
  const supabase = createClient();
  const wsId = await getWorkspaceId(supabase);

  const { data: contentItems, error } = await supabase
    .from("content_items")
    .select(`
      id, title, source_type, status, word_count, created_at,
      generations (id, platform, output_type, generated_content, status)
    `)
    .eq("workspace_id", wsId)
    .order("created_at", { ascending: false });

  if (error || !contentItems) {
    console.error("Failed to fetch library items:", error);
    return [];
  }

  return contentItems
    .filter((ci: any) => ci.generations && ci.generations.length > 0)
    .map((ci: any) => ({
      id: ci.id,
      title: ci.title || "Untitled",
      sourceType: ci.source_type,
      status: ci.status,
      outputCount: ci.generations.length,
      platforms: [...new Set(ci.generations.map((g: any) => g.platform))] as string[],
      createdAt: ci.created_at,
      wordCount: ci.word_count || 0,
      generations: ci.generations.map((g: any) => ({
        id: g.id,
        platform: g.platform,
        outputType: g.output_type,
        content: g.generated_content || "",
        status: g.status,
      })),
    }));
}

/**
 * Get all library items as a flat list — one entry per generation.
 * Sorted newest-first by creation date.
 */
export async function getFlatGenerationItems(): Promise<FlatGenerationItem[]> {
  if (MOCK_AUTH_ENABLED) {
    // In mock mode every approved item IS a generation
    return readLocalItems().map((item) => ({
      id: item.id,
      title: item.title,
      sourceType: item.sourceType,
      platform: item.platform,
      outputType: item.outputType,
      content: item.content,
      status: item.status,
      createdAt: item.createdAt,
      wordCount: item.wordCount,
    }));
  }

  // Real Supabase mode – join generations with their parent content_item
  const supabase = createClient();
  const wsId = await getWorkspaceId(supabase);

  const { data: contentItems, error } = await supabase
    .from("content_items")
    .select(`
      id, title, source_type, word_count, created_at,
      generations (id, platform, output_type, generated_content, status, created_at)
    `)
    .eq("workspace_id", wsId)
    .order("created_at", { ascending: false });

  if (error || !contentItems) {
    console.error("Failed to fetch flat generation items:", error);
    return [];
  }

  const flat: FlatGenerationItem[] = [];
  for (const ci of contentItems as any[]) {
    if (!ci.generations) continue;
    for (const g of ci.generations) {
      flat.push({
        id: g.id,
        title: ci.title || "Untitled",
        sourceType: ci.source_type,
        platform: g.platform,
        outputType: g.output_type,
        content: g.generated_content || "",
        status: g.status,
        createdAt: g.created_at || ci.created_at,
        wordCount: ci.word_count || 0,
      });
    }
  }

  // Sort newest first
  flat.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return flat;
}

/**
 * Mark a generation as published.
 */
export async function publishContent(id: string): Promise<void> {
  if (MOCK_AUTH_ENABLED) {
    const items = readLocalItems();
    const idx = items.findIndex((i) => i.id === id);
    if (idx !== -1) {
      items[idx].status = "published";
      writeLocalItems(items);
    }
    return;
  }

  // Real Supabase mode
  const supabase = createClient();
  const { error } = await (supabase
    .from("generations") as any)
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(error.message || "Failed to publish content");
  }
}

/**
 * Update a generation's status (ready, published, draft, archived).
 */
export async function updateContentStatus(id: string, status: string): Promise<void> {
  if (MOCK_AUTH_ENABLED) {
    const items = readLocalItems();
    const idx = items.findIndex((i) => i.id === id);
    if (idx !== -1) {
      items[idx].status = status as ApprovedItem["status"];
      writeLocalItems(items);
    }
    return;
  }

  // Real Supabase mode
  const supabase = createClient();
  const updateData: Record<string, unknown> = { status };
  if (status === "published") {
    updateData.published_at = new Date().toISOString();
  }
  const { error } = await (supabase
    .from("generations") as any)
    .update(updateData)
    .eq("id", id);

  if (error) {
    throw new Error(error.message || "Failed to update content status");
  }
}

/**
 * Delete a single generation by ID.
 */
export async function deleteContentById(id: string): Promise<void> {
  if (MOCK_AUTH_ENABLED) {
    const items = readLocalItems().filter((i) => i.id !== id);
    writeLocalItems(items);
    return;
  }

  const supabase = createClient();
  const { error } = await (supabase.from("generations") as any).delete().eq("id", id);
  if (error) throw new Error(error.message || "Failed to delete generation");
}

/**
 * Delete all generations in a batch (by batchId for mock, by content_item_id for Supabase).
 */
export async function deleteContentByBatch(batchId: string): Promise<void> {
  if (MOCK_AUTH_ENABLED) {
    const items = readLocalItems().filter((i) => (i.batchId || i.title) !== batchId);
    writeLocalItems(items);
    return;
  }

  // In Supabase mode, batchId maps to content_item_id
  const supabase = createClient();
  // Delete generations first, then the content item
  await (supabase.from("generations") as any).delete().eq("content_item_id", batchId);
  const { error } = await (supabase.from("content_items") as any).delete().eq("id", batchId);
  if (error) throw new Error(error.message || "Failed to delete batch");
}

/**
 * Get connected platforms for the current workspace.
 */
export async function getConnectedPlatforms(): Promise<ConnectedPlatform[]> {
  if (MOCK_AUTH_ENABLED) {
    return MOCK_CONNECTED_PLATFORMS;
  }

  // Real Supabase mode
  const supabase = createClient();
  const wsId = await getWorkspaceId(supabase);

  const { data, error } = await supabase
    .from("platform_connections")
    .select("id, platform, platform_username, is_active")
    .eq("workspace_id", wsId);

  if (error || !data) {
    return [];
  }

  return data.map((pc: any) => ({
    id: pc.id,
    platform: pc.platform,
    username: pc.platform_username,
    connected: pc.is_active,
  }));
}

/* ── Internal helpers ── */

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

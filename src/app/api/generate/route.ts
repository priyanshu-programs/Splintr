import { NextRequest, NextResponse } from "next/server";
import { generateBatch, getDefaultOutputType, extractTopic, type Platform } from "@/lib/ai/openrouter";
import { createClient } from "@/lib/supabase/server";
import { MOCK_AUTH_ENABLED } from "@/lib/auth/mock-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceContent, sourceType, sourceTitle, platforms, voiceProfile } = body as {
      sourceContent: string;
      sourceType?: "text" | "url" | "audio" | "video" | "document";
      sourceTitle?: string;
      platforms: Platform[];
      voiceProfile?: {
        id?: string;
        systemPrompt: string;
        tone: string;
        writingSamples: string[];
        platformOverrides?: Record<string, { tone?: string; sliders?: { label: string; from: string; to: string; value: number }[] }>;
      };
    };

    if (!sourceContent || !platforms?.length) {
      return NextResponse.json(
        { error: "sourceContent and platforms are required" },
        { status: 400 }
      );
    }

    // --- Generate content + extract topic via OpenRouter (in parallel) ---
    const [results, topicTitle] = await Promise.all([
      generateBatch(sourceContent, platforms, voiceProfile),
      extractTopic(sourceContent),
    ]);

    // --- Mock mode: skip all DB persistence (no auth session for Supabase) ---
    if (MOCK_AUTH_ENABLED) {
      return NextResponse.json({
        results,
        topicTitle,
        contentItemId: null,
        batchId: null,
        generations: Object.entries(results).map(([platform, content]) => ({
          id: `mock-${platform}-${Date.now()}`,
          platform,
          output_type: getDefaultOutputType(platform as Platform),
          generated_content: content,
          status: "ready",
        })),
        persisted: false,
      });
    }

    // --- Real auth & workspace ---
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find or auto-create workspace
    let workspaceId: string;
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (workspace) {
      workspaceId = (workspace as any).id;
    } else {
      // Auto-create a default workspace
      const { data: newWorkspace, error: wsError } = await supabase
        .from("workspaces")
        .insert({ user_id: user.id, name: "My Workspace" } as any)
        .select("id")
        .single();

      if (wsError || !newWorkspace) {
        console.error("Failed to create workspace:", wsError);
        // Still return results even if workspace creation fails
        return NextResponse.json({ results, persisted: false });
      }
      workspaceId = (newWorkspace as any).id;
    }

    // --- Persist to Supabase ---

    // 1. Create content_item (source content)
    const wordCount = sourceContent.split(/\s+/).length;
    // Prefer extracted title (e.g. YouTube oEmbed), then AI topic, then truncated source
    let title = sourceTitle || topicTitle || "";
    if (!title) {
      title = sourceContent.slice(0, 60).replace(/\n/g, " ").trim() + (sourceContent.length > 60 ? "..." : "");
    }
    // Ensure title isn't too long
    if (title.length > 80) {
      title = title.slice(0, 77) + "...";
    }

    const { data: contentItem, error: contentError } = await supabase
      .from("content_items")
      .insert({
        workspace_id: workspaceId,
        title,
        source_type: sourceType || "text",
        source_content: sourceContent,
        word_count: wordCount,
        status: "ready",
        metadata: {},
      } as any)
      .select("id")
      .single();

    if (contentError || !contentItem) {
      console.error("Failed to save content_item:", contentError);
      // Still return results even if DB save fails
      return NextResponse.json({ results, persisted: false });
    }

    // 2. Create generation_batch
    const { data: batch } = await supabase
      .from("generation_batches")
      .insert({
        content_item_id: (contentItem as any).id,
        workspace_id: workspaceId,
        voice_profile_id: voiceProfile?.id || null,
        platforms: platforms,
        status: "complete",
        total_generations: platforms.length,
        completed_generations: Object.keys(results).length,
      } as any)
      .select("id")
      .single();

    // 3. Create generation records for each platform
    const generationInserts = Object.entries(results).map(([platform, content]) => ({
      content_item_id: (contentItem as any).id,
      workspace_id: workspaceId,
      batch_id: (batch as any)?.id || null,
      voice_profile_id: voiceProfile?.id || null,
      platform: platform as Platform,
      output_type: getDefaultOutputType(platform as Platform),
      generated_content: content,
      generated_media_urls: [],
      status: "ready" as const,
      ai_model: "openrouter/free",
      ai_tokens_used: 0,
      edit_history: [],
      metadata: {},
    }));

    const { data: generations, error: genError } = await supabase
      .from("generations")
      .insert(generationInserts as any)
      .select("id, platform, output_type, generated_content, status");

    if (genError) {
      console.error("Failed to save generations:", genError);
    }

    // 4. Log usage
    await supabase.from("usage_logs").insert({
      workspace_id: workspaceId,
      action: "generation",
      tokens_used: 0,
      credits_used: platforms.length,
      metadata: {
        content_item_id: (contentItem as any).id,
        batch_id: (batch as any)?.id,
        platforms,
      },
    } as any);

    return NextResponse.json({
      results,
      topicTitle,
      contentItemId: (contentItem as any).id,
      batchId: (batch as any)?.id,
      generations: generations || [],
      persisted: true,
    });
  } catch (error) {
    console.error("Generation error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Failed to generate content: ${message}` },
      { status: 500 }
    );
  }
}

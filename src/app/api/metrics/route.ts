import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { MOCK_AUTH_ENABLED } from "@/lib/auth/mock-auth";
import { createClient } from "@/lib/supabase/server";
import { fetchPlatformMetrics } from "@/lib/platform-metrics";

/**
 * POST /api/metrics
 *
 * Refreshes engagement metrics for published posts by fetching from platform APIs.
 * Can refresh a single post (generationId) or all published posts in a period.
 *
 * Body: { generationId?: string, period?: "7d" | "30d" | "90d" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { generationId, period = "7d" } = body as {
      generationId?: string;
      period?: string;
    };

    if (MOCK_AUTH_ENABLED) {
      // In mock mode, generate simulated metrics for published posts
      return NextResponse.json({
        refreshed: 0,
        message: "Mock mode — metrics are simulated in the analytics store",
      });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: workspaces } = await supabase
      .from("workspaces")
      .select("id")
      .eq("user_id", user.id)
      .limit(1);

    if (!workspaces || workspaces.length === 0) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 });
    }

    const workspaceId = (workspaces[0] as any).id;

    // Build query for published posts
    let query = supabase
      .from("generations")
      .select("id, platform, published_url, published_at, metadata")
      .eq("workspace_id", workspaceId)
      .eq("status", "published");

    if (generationId) {
      query = query.eq("id", generationId);
    } else {
      const days = period === "90d" ? 90 : period === "30d" ? 30 : 7;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      query = query.gte("published_at", cutoff.toISOString());
    }

    const { data: generations } = await query;
    if (!generations || generations.length === 0) {
      return NextResponse.json({ refreshed: 0, message: "No published posts to refresh" });
    }

    const cookieStore = await cookies();
    let refreshed = 0;

    for (const gen of generations as any[]) {
      if (!gen.published_url) continue;

      // Get the platform token
      const tokenCookie = cookieStore.get(`${gen.platform}_token`);
      if (!tokenCookie) continue;

      let tokenData: { accessToken: string; platformUserId: string };
      try {
        tokenData = JSON.parse(tokenCookie.value);
      } catch {
        continue;
      }

      const platformMediaId = gen.metadata?.platformPostId;
      const metrics = await fetchPlatformMetrics(
        gen.platform,
        tokenData.accessToken,
        gen.published_url,
        platformMediaId
      );

      if (metrics) {
        const totalEngagement = metrics.likes + metrics.comments + metrics.shares + metrics.clicks;
        const engagementRate = metrics.impressions > 0
          ? Math.round((totalEngagement / metrics.impressions) * 1000) / 10
          : 0;

        await (supabase.from("generations") as any)
          .update({
            metadata: {
              ...gen.metadata,
              metrics: {
                ...metrics,
                engagementRate,
                lastFetchedAt: new Date().toISOString(),
              },
            },
          })
          .eq("id", gen.id);

        refreshed++;
      }
    }

    return NextResponse.json({
      refreshed,
      total: generations.length,
      message: `Refreshed metrics for ${refreshed}/${generations.length} posts`,
    });
  } catch (error) {
    console.error("Metrics refresh error:", error);
    return NextResponse.json(
      { error: "Failed to refresh metrics" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import https from "https";
import { MOCK_AUTH_ENABLED } from "@/lib/auth/mock-auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Make an HTTPS request using Node's https module.
 * Avoids Node.js native fetch (undici) IPv6/timeout issues on Windows.
 */
function httpsRequest(
  url: string,
  options: {
    method: string;
    headers: Record<string, string>;
    body?: string;
    timeoutMs?: number;
  }
): Promise<{ status: number; data: string; headers: Record<string, string> }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request(
      {
        hostname: parsed.hostname,
        port: 443,
        path: parsed.pathname + parsed.search,
        method: options.method,
        headers: {
          ...options.headers,
          ...(options.body ? { "Content-Length": Buffer.byteLength(options.body).toString() } : {}),
        },
        family: 4, // Force IPv4
        timeout: options.timeoutMs || 15000,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk: Buffer) => { data += chunk.toString(); });
        res.on("end", () => {
          const responseHeaders: Record<string, string> = {};
          for (const [k, v] of Object.entries(res.headers)) {
            if (typeof v === "string") responseHeaders[k] = v;
          }
          resolve({ status: res.statusCode ?? 0, data, headers: responseHeaders });
        });
      }
    );
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Request timed out")); });
    if (options.body) req.write(options.body);
    req.end();
  });
}

/* ── Mock-mode URL generators per platform ── */

const MOCK_PLATFORM_URLS: Record<string, (id: string) => string> = {
  linkedin: (id) => `https://linkedin.com/posts/mock-${id}`,
  x: (id) => `https://x.com/mock/status/${id}`,
  twitter: (id) => `https://x.com/mock/status/${id}`,
  instagram: (id) => `https://instagram.com/p/mock-${id}`,
  youtube: (id) => `https://youtube.com/watch?v=mock-${id}`,
  tiktok: (id) => `https://tiktok.com/@mock/video/${id}`,
  medium: (id) => `https://medium.com/@mock/mock-${id}`,
  wordpress: (id) => `https://mock.wordpress.com/mock-${id}`,
  blog: (id) => `https://mock.wordpress.com/mock-${id}`,
  threads: (id) => `https://threads.net/@mock/post/mock-${id}`,
  bluesky: (id) => `https://bsky.app/profile/mock/post/${id}`,
};

/**
 * Generate a mock published URL for a given platform.
 * Falls back to a generic URL if the platform is unknown.
 */
function getMockPublishedUrl(platform: string, generationId: string): string {
  const generator = MOCK_PLATFORM_URLS[platform.toLowerCase()];
  return generator
    ? generator(generationId)
    : `https://${platform}.com/mock/${generationId}`;
}

/**
 * Post content to LinkedIn using the Posts API.
 * Uses httpsRequest() for reliable IPv4 connections on Windows.
 * Returns the published post URL on success, or throws on failure.
 */
async function publishToLinkedIn(
  accessToken: string,
  personId: string,
  content: string
): Promise<string> {
  const linkedInVersion = process.env.LINKEDIN_API_VERSION || "202601";

  let result;
  try {
    result = await httpsRequest("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "LinkedIn-Version": linkedInVersion,
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author: `urn:li:person:${personId}`,
        commentary: content,
        visibility: "PUBLIC",
        distribution: {
          feedDistribution: "MAIN_FEED",
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false,
      }),
      timeoutMs: 15000,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("LinkedIn request network error:", msg);
    throw new Error(`LinkedIn network error: ${msg}`);
  }

  if (result.status < 200 || result.status >= 300) {
    console.error("LinkedIn publish failed:", result.status, result.data);

    if (result.status === 426) {
      console.error(
        `LinkedIn API version "${linkedInVersion}" is not active. ` +
        `Update LINKEDIN_API_VERSION env var to a current version (YYYYMM format). ` +
        `See: https://learn.microsoft.com/en-us/linkedin/marketing/versioning`
      );
      throw new Error(
        `LinkedIn API version "${linkedInVersion}" is no longer active. ` +
        `Please update the LINKEDIN_API_VERSION environment variable to a current version.`
      );
    }

    throw new Error(`LinkedIn API error (${result.status}): ${result.data}`);
  }

  // LinkedIn returns the post URN in the x-restli-id header
  const postUrn = result.headers["x-restli-id"];
  if (postUrn) {
    const shareId = postUrn.replace("urn:li:share:", "");
    return `https://www.linkedin.com/feed/update/urn:li:share:${shareId}/`;
  }

  // Fallback: return a generic LinkedIn URL
  return "https://www.linkedin.com/feed/";
}

/**
 * Read the platform token from the httpOnly cookie set during OAuth callback.
 */
async function getPlatformToken(
  platform: string
): Promise<{ accessToken: string; platformUserId: string } | null> {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get(`${platform}_token`);
    if (!tokenCookie) return null;

    const data = JSON.parse(tokenCookie.value);
    if (!data.accessToken || !data.platformUserId) return null;
    return { accessToken: data.accessToken, platformUserId: data.platformUserId };
  } catch (err) {
    console.error("Failed to read platform token cookie:", err);
    return null;
  }
}

/**
 * Publish content to a platform API.
 * Currently implements LinkedIn; other platforms return mock URLs.
 */
async function publishToPlatformApi(
  platform: string,
  content: string,
  generationId: string
): Promise<string> {
  if (platform.toLowerCase() === "linkedin") {
    const token = await getPlatformToken("linkedin");
    if (token) {
      return publishToLinkedIn(token.accessToken, token.platformUserId, content);
    }
    console.warn("No LinkedIn token found — falling back to mock URL");
  }

  // TODO: Implement other platforms (x/twitter, instagram, youtube, etc.)
  return getMockPublishedUrl(platform, generationId);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { generationId, platform, scheduledFor, content } = body as {
      generationId: string;
      platform: string;
      scheduledFor?: string;
      content?: string;
    };

    if (!generationId || !platform) {
      return NextResponse.json(
        { error: "generationId and platform are required" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    /* ── Mock mode ── */
    if (MOCK_AUTH_ENABLED) {
      if (scheduledFor) {
        return NextResponse.json({
          status: "scheduled",
          publishedUrl: null,
          platform,
          generationId,
          scheduledFor,
          publishedAt: null,
        });
      }

      // Try real platform posting if we have a token, otherwise use mock URL
      let publishedUrl: string;
      try {
        publishedUrl = await publishToPlatformApi(platform, content || "", generationId);
      } catch (err) {
        console.error(`Failed to publish to ${platform}:`, err);
        return NextResponse.json(
          { error: err instanceof Error ? err.message : "Failed to publish to platform" },
          { status: 502 }
        );
      }

      return NextResponse.json({
        status: "published",
        publishedUrl,
        platform,
        generationId,
        publishedAt: now,
      });
    }

    /* ── Real Supabase mode ── */
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get workspace
    const { data: workspaces } = await supabase
      .from("workspaces")
      .select("id")
      .eq("user_id", user.id)
      .limit(1);

    if (!workspaces || workspaces.length === 0) {
      return NextResponse.json(
        { error: "No workspace found" },
        { status: 404 }
      );
    }

    const workspaceId = (workspaces[0] as any).id;

    // 3. Verify platform connection exists and is active
    const { data: connections } = await supabase
      .from("platform_connections")
      .select("id, is_active")
      .eq("workspace_id", workspaceId)
      .eq("platform", platform.toLowerCase())
      .limit(1);

    if (!connections || connections.length === 0 || !(connections[0] as any).is_active) {
      return NextResponse.json(
        { error: `Platform "${platform}" is not connected. Connect it in Setup first.` },
        { status: 400 }
      );
    }

    // 4. Fetch the generation to get content
    const { data: generation, error: genError } = await supabase
      .from("generations")
      .select("id, generated_content, platform, status")
      .eq("id", generationId)
      .eq("workspace_id", workspaceId)
      .single();

    if (genError || !generation) {
      return NextResponse.json(
        { error: "Generation not found" },
        { status: 404 }
      );
    }

    // 5. Handle scheduling vs immediate publish
    if (scheduledFor) {
      // Set status to scheduled with scheduled_for timestamp
      const { error: updateError } = await (supabase
        .from("generations") as any)
        .update({
          status: "scheduled",
          scheduled_for: scheduledFor,
        })
        .eq("id", generationId);

      if (updateError) {
        console.error("Failed to schedule generation:", updateError);
        return NextResponse.json(
          { error: "Failed to schedule content" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        status: "scheduled",
        publishedUrl: null,
        platform,
        generationId,
        scheduledFor,
        publishedAt: null,
      });
    }

    // 6. Publish immediately via platform API
    let publishedUrl: string;
    try {
      publishedUrl = await publishToPlatformApi(
        platform,
        (generation as any).generated_content || "",
        generationId
      );
    } catch (err) {
      console.error(`Failed to publish to ${platform}:`, err);
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to publish to platform" },
        { status: 502 }
      );
    }

    // 7. Update generation: set status to published, store published_url and published_at
    const { error: updateError } = await (supabase
      .from("generations") as any)
      .update({
        status: "published",
        published_at: now,
        published_url: publishedUrl,
      })
      .eq("id", generationId);

    if (updateError) {
      console.error("Failed to update generation after publish:", updateError);
      return NextResponse.json(
        { error: "Content was published but failed to update record" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "published",
      publishedUrl,
      platform,
      generationId,
      publishedAt: now,
    });
  } catch (error) {
    console.error("Publishing error:", error);
    return NextResponse.json(
      { error: "Failed to publish content" },
      { status: 500 }
    );
  }
}

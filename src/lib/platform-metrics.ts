/**
 * platform-metrics.ts
 *
 * Fetches engagement metrics from platform APIs for published posts.
 * Each platform has its own metrics endpoint and response format.
 */

import https from "https";

/* ── Shared HTTPS helper ── */

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
        family: 4,
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

/* ── Types ── */

export interface PlatformMetricsResult {
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
}

/* ── LinkedIn Metrics ── */

/**
 * Fetch metrics for a LinkedIn post.
 * Uses the Posts Statistics API.
 * publishedUrl format: https://www.linkedin.com/feed/update/urn:li:share:{shareId}/
 */
export async function fetchLinkedInMetrics(
  accessToken: string,
  publishedUrl: string
): Promise<PlatformMetricsResult | null> {
  // Extract share URN from the published URL
  const match = publishedUrl.match(/urn:li:share:(\w+)/);
  if (!match) return null;

  const shareUrn = `urn:li:share:${match[1]}`;
  const linkedInVersion = process.env.LINKEDIN_API_VERSION || "202601";

  try {
    // Use the Social Action Counts endpoint
    const encodedUrn = encodeURIComponent(shareUrn);
    const result = await httpsRequest(
      `https://api.linkedin.com/rest/socialActions/${encodedUrn}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "LinkedIn-Version": linkedInVersion,
          "X-Restli-Protocol-Version": "2.0.0",
        },
      }
    );

    if (result.status !== 200) {
      console.error("LinkedIn metrics fetch failed:", result.status, result.data);
      return null;
    }

    const data = JSON.parse(result.data);
    return {
      impressions: 0, // Not available via socialActions — needs Organization analytics
      likes: data.likesSummary?.totalLikes || 0,
      comments: data.commentsSummary?.totalFirstLevelComments || 0,
      shares: data.sharesSummary?.totalShareCount || 0,
      clicks: 0,
    };
  } catch (err) {
    console.error("LinkedIn metrics error:", err);
    return null;
  }
}

/* ── X/Twitter Metrics ── */

/**
 * Fetch metrics for a tweet.
 * Uses the v2 tweet lookup with metrics fields.
 * publishedUrl format: https://x.com/{user}/status/{tweetId}
 */
export async function fetchXMetrics(
  accessToken: string,
  publishedUrl: string
): Promise<PlatformMetricsResult | null> {
  // Extract tweet ID from URL
  const match = publishedUrl.match(/status\/(\d+)/);
  if (!match) return null;

  const tweetId = match[1];

  try {
    const result = await httpsRequest(
      `https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=public_metrics`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (result.status !== 200) {
      console.error("X metrics fetch failed:", result.status, result.data);
      return null;
    }

    const data = JSON.parse(result.data);
    const metrics = data.data?.public_metrics || {};
    return {
      impressions: metrics.impression_count || 0,
      likes: metrics.like_count || 0,
      comments: metrics.reply_count || 0,
      shares: metrics.retweet_count + (metrics.quote_count || 0),
      clicks: metrics.url_link_clicks || 0,
    };
  } catch (err) {
    console.error("X metrics error:", err);
    return null;
  }
}

/* ── Instagram Metrics ── */

/**
 * Fetch metrics for an Instagram media post.
 * Uses the Instagram Graph API insights endpoint.
 * publishedUrl format: https://instagram.com/p/{shortcode}
 */
export async function fetchInstagramMetrics(
  accessToken: string,
  mediaId: string
): Promise<PlatformMetricsResult | null> {
  try {
    const result = await httpsRequest(
      `https://graph.instagram.com/${mediaId}/insights?metric=impressions,reach,likes,comments,shares,saved&access_token=${accessToken}`,
      {
        method: "GET",
        headers: {},
      }
    );

    if (result.status !== 200) {
      console.error("Instagram metrics fetch failed:", result.status, result.data);
      return null;
    }

    const data = JSON.parse(result.data);
    const metricsMap: Record<string, number> = {};
    for (const entry of data.data || []) {
      metricsMap[entry.name] = entry.values?.[0]?.value || 0;
    }

    return {
      impressions: metricsMap.impressions || metricsMap.reach || 0,
      likes: metricsMap.likes || 0,
      comments: metricsMap.comments || 0,
      shares: metricsMap.shares || 0,
      clicks: 0,
    };
  } catch (err) {
    console.error("Instagram metrics error:", err);
    return null;
  }
}

/* ── YouTube Metrics ── */

/**
 * Fetch metrics for a YouTube video.
 * Uses the YouTube Data API v3 statistics.
 * publishedUrl format: https://youtube.com/watch?v={videoId}
 */
export async function fetchYouTubeMetrics(
  accessToken: string,
  publishedUrl: string
): Promise<PlatformMetricsResult | null> {
  // Extract video ID from URL
  const match = publishedUrl.match(/[?&]v=([^&]+)/) || publishedUrl.match(/youtu\.be\/([^?]+)/);
  if (!match) return null;

  const videoId = match[1];

  try {
    const result = await httpsRequest(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&access_token=${accessToken}`,
      {
        method: "GET",
        headers: {},
      }
    );

    if (result.status !== 200) {
      console.error("YouTube metrics fetch failed:", result.status, result.data);
      return null;
    }

    const data = JSON.parse(result.data);
    const stats = data.items?.[0]?.statistics || {};
    return {
      impressions: parseInt(stats.viewCount || "0", 10),
      likes: parseInt(stats.likeCount || "0", 10),
      comments: parseInt(stats.commentCount || "0", 10),
      shares: 0, // YouTube doesn't expose share count via API
      clicks: 0,
    };
  } catch (err) {
    console.error("YouTube metrics error:", err);
    return null;
  }
}

/* ── Dispatcher ── */

/**
 * Fetch metrics for any platform by dispatching to the correct fetcher.
 */
export async function fetchPlatformMetrics(
  platform: string,
  accessToken: string,
  publishedUrl: string,
  platformMediaId?: string
): Promise<PlatformMetricsResult | null> {
  switch (platform.toLowerCase()) {
    case "linkedin":
      return fetchLinkedInMetrics(accessToken, publishedUrl);
    case "x":
    case "twitter":
      return fetchXMetrics(accessToken, publishedUrl);
    case "instagram":
      if (platformMediaId) {
        return fetchInstagramMetrics(accessToken, platformMediaId);
      }
      return null;
    case "youtube":
      return fetchYouTubeMetrics(accessToken, publishedUrl);
    default:
      return null;
  }
}

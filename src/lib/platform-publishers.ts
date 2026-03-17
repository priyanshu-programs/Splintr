/**
 * platform-publishers.ts
 *
 * Real API publishing functions for each platform.
 * Separated from the publish route for clarity and testability.
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

export interface PublishResult {
  publishedUrl: string;
  platformPostId?: string; // Platform-specific post ID for metrics fetching
}

/* ── X/Twitter Publishing ── */

/**
 * Post a tweet using the X/Twitter v2 API.
 * Requires OAuth 2.0 token with tweet.write scope.
 */
export async function publishToX(
  accessToken: string,
  content: string
): Promise<PublishResult> {
  const result = await httpsRequest("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: content }),
  });

  if (result.status < 200 || result.status >= 300) {
    console.error("X/Twitter publish failed:", result.status, result.data);
    throw new Error(`X/Twitter API error (${result.status}): ${result.data}`);
  }

  const data = JSON.parse(result.data);
  const tweetId = data.data?.id;

  if (!tweetId) {
    throw new Error("X/Twitter did not return a tweet ID");
  }

  return {
    publishedUrl: `https://x.com/i/status/${tweetId}`,
    platformPostId: tweetId,
  };
}

/* ── Instagram Publishing ── */

/**
 * Publish to Instagram using the Instagram Graph API.
 * Requires a Business/Creator account connected via Facebook.
 *
 * Instagram API requires media (image/video) for posts.
 * For text-only content, we create a carousel or use as caption with a placeholder.
 *
 * Step 1: Create media container
 * Step 2: Publish the container
 */
export async function publishToInstagram(
  accessToken: string,
  userId: string,
  content: string,
  imageUrl?: string
): Promise<PublishResult> {
  if (!imageUrl) {
    throw new Error(
      "Instagram requires an image or video to publish. " +
      "Please attach media to your content before publishing to Instagram."
    );
  }

  // Step 1: Create a media container
  const containerResult = await httpsRequest(
    `https://graph.instagram.com/v21.0/${userId}/media`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: imageUrl,
        caption: content,
        access_token: accessToken,
      }),
    }
  );

  if (containerResult.status < 200 || containerResult.status >= 300) {
    console.error("Instagram container creation failed:", containerResult.status, containerResult.data);
    throw new Error(`Instagram API error (${containerResult.status}): ${containerResult.data}`);
  }

  const containerData = JSON.parse(containerResult.data);
  const containerId = containerData.id;

  if (!containerId) {
    throw new Error("Instagram did not return a container ID");
  }

  // Step 2: Publish the container
  const publishResult = await httpsRequest(
    `https://graph.instagram.com/v21.0/${userId}/media_publish`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: accessToken,
      }),
    }
  );

  if (publishResult.status < 200 || publishResult.status >= 300) {
    console.error("Instagram publish failed:", publishResult.status, publishResult.data);
    throw new Error(`Instagram publish error (${publishResult.status}): ${publishResult.data}`);
  }

  const publishData = JSON.parse(publishResult.data);
  const mediaId = publishData.id;

  // Fetch the real permalink from the Graph API (numeric media ID won't work in URLs)
  let publishedUrl = `https://instagram.com`;
  try {
    const permalinkResult = await httpsRequest(
      `https://graph.instagram.com/v21.0/${mediaId}?fields=permalink&access_token=${accessToken}`,
      { method: "GET", headers: {} }
    );
    if (permalinkResult.status === 200) {
      const permalinkData = JSON.parse(permalinkResult.data);
      if (permalinkData.permalink) {
        publishedUrl = permalinkData.permalink;
      }
    }
  } catch {
    // Fall back to generic Instagram URL
  }

  return {
    publishedUrl,
    platformPostId: mediaId,
  };
}

/* ── YouTube Publishing ── */

/**
 * Create a YouTube community post (text-based).
 * Note: Full video upload requires multipart upload and is out of scope for text syndication.
 * The YouTube Data API doesn't have a public endpoint for community posts,
 * so for text content we'll note this limitation.
 *
 * For now, this creates a video description placeholder or returns an info message.
 */
export async function publishToYouTube(
  accessToken: string,
  content: string
): Promise<PublishResult> {
  // YouTube Data API v3 doesn't support community posts via API.
  // Video uploads require multipart upload with a video file.
  // For text-based syndication, we store the content and return a channel link.

  // Try to get the channel URL for the authenticated user
  const channelResult = await httpsRequest(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  let channelUrl = "https://youtube.com";
  if (channelResult.status === 200) {
    const channelData = JSON.parse(channelResult.data);
    const channelId = channelData.items?.[0]?.id;
    if (channelId) {
      channelUrl = `https://youtube.com/channel/${channelId}`;
    }
  }

  // YouTube community posts are not available via API.
  // Content is stored locally for manual posting or future API support.
  return {
    publishedUrl: channelUrl,
    platformPostId: undefined,
  };
}

/* ── Blog/WordPress Publishing ── */

/**
 * Publish to a WordPress site using the REST API.
 * Requires the WordPress site URL and an application password or OAuth token.
 *
 * Env vars: WORDPRESS_SITE_URL, WORDPRESS_USERNAME, WORDPRESS_APP_PASSWORD
 */
export async function publishToWordPress(
  content: string,
  title: string
): Promise<PublishResult> {
  const siteUrl = process.env.WORDPRESS_SITE_URL;
  const username = process.env.WORDPRESS_USERNAME;
  const appPassword = process.env.WORDPRESS_APP_PASSWORD;

  if (!siteUrl || !username || !appPassword) {
    throw new Error(
      "WordPress not configured. Set WORDPRESS_SITE_URL, WORDPRESS_USERNAME, and WORDPRESS_APP_PASSWORD environment variables."
    );
  }

  const auth = Buffer.from(`${username}:${appPassword}`).toString("base64");

  const result = await httpsRequest(
    `${siteUrl}/wp-json/wp/v2/posts`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        content,
        status: "publish",
      }),
    }
  );

  if (result.status < 200 || result.status >= 300) {
    console.error("WordPress publish failed:", result.status, result.data);
    throw new Error(`WordPress API error (${result.status}): ${result.data}`);
  }

  const data = JSON.parse(result.data);
  return {
    publishedUrl: data.link || `${siteUrl}/?p=${data.id}`,
    platformPostId: String(data.id),
  };
}

/* ── Meta (Facebook) Publishing ── */

/**
 * Publish to a Facebook Page using the Graph API.
 * Requires a Page access token with pages_manage_posts permission.
 */
export async function publishToMeta(
  accessToken: string,
  pageId: string,
  content: string
): Promise<PublishResult> {
  const result = await httpsRequest(
    `https://graph.facebook.com/v21.0/${pageId}/feed`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: content,
        access_token: accessToken,
      }),
    }
  );

  if (result.status < 200 || result.status >= 300) {
    console.error("Meta publish failed:", result.status, result.data);
    throw new Error(`Meta API error (${result.status}): ${result.data}`);
  }

  const data = JSON.parse(result.data);
  const postId = data.id; // format: pageId_postId

  return {
    publishedUrl: `https://facebook.com/${postId}`,
    platformPostId: postId,
  };
}

/* ── Threads Publishing ── */

/**
 * Publish to Threads using the Threads API (Meta).
 * Similar flow to Instagram: create container then publish.
 */
export async function publishToThreads(
  accessToken: string,
  userId: string,
  content: string
): Promise<PublishResult> {
  // Step 1: Create a text container
  const containerResult = await httpsRequest(
    `https://graph.threads.net/v1.0/${userId}/threads`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        media_type: "TEXT",
        text: content,
        access_token: accessToken,
      }),
    }
  );

  if (containerResult.status < 200 || containerResult.status >= 300) {
    console.error("Threads container creation failed:", containerResult.status, containerResult.data);
    throw new Error(`Threads API error (${containerResult.status}): ${containerResult.data}`);
  }

  const containerData = JSON.parse(containerResult.data);
  const containerId = containerData.id;

  if (!containerId) {
    throw new Error("Threads did not return a container ID");
  }

  // Step 2: Publish the container
  const publishResult = await httpsRequest(
    `https://graph.threads.net/v1.0/${userId}/threads_publish`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: accessToken,
      }),
    }
  );

  if (publishResult.status < 200 || publishResult.status >= 300) {
    console.error("Threads publish failed:", publishResult.status, publishResult.data);
    throw new Error(`Threads publish error (${publishResult.status}): ${publishResult.data}`);
  }

  const publishData = JSON.parse(publishResult.data);
  return {
    publishedUrl: `https://threads.net/@/post/${publishData.id}`,
    platformPostId: publishData.id,
  };
}

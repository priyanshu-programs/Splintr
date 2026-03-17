/**
 * oauth-config.ts
 *
 * Centralized OAuth configuration for all supported platforms.
 * Adding a new platform = adding one entry to OAUTH_CONFIGS.
 */

import crypto from "crypto";

/* ── Types ── */

export interface OAuthPlatformConfig {
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: string[];
  clientIdEnv: string;
  clientSecretEnv: string;
  /** "code" for Authorization Code flow (all platforms) */
  responseType: string;
  /** Function to extract display username from userinfo response */
  extractUsername: (profile: Record<string, unknown>) => string | null;
}

/* ── Platform Configs ── */

const OAUTH_CONFIGS: Record<string, OAuthPlatformConfig> = {
  linkedin: {
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    userInfoUrl: "https://api.linkedin.com/v2/userinfo",
    scopes: ["openid", "profile", "email", "w_member_social"],
    clientIdEnv: "LINKEDIN_CLIENT_ID",
    clientSecretEnv: "LINKEDIN_CLIENT_SECRET",
    responseType: "code",
    extractUsername: (profile) => {
      const name = profile.name as string | undefined;
      const email = profile.email as string | undefined;
      return name || email || null;
    },
  },
  x: {
    authUrl: "https://twitter.com/i/oauth2/authorize",
    tokenUrl: "https://api.twitter.com/2/oauth2/token",
    userInfoUrl: "https://api.twitter.com/2/users/me",
    scopes: ["tweet.read", "tweet.write", "users.read", "offline.access"],
    clientIdEnv: "X_CLIENT_ID",
    clientSecretEnv: "X_CLIENT_SECRET",
    responseType: "code",
    extractUsername: (profile) => {
      const data = profile.data as Record<string, unknown> | undefined;
      return data?.username as string | null;
    },
  },
  instagram: {
    // Instagram Graph API requires Facebook Login OAuth flow.
    // The Facebook App must have "Instagram Graph API" product added.
    authUrl: "https://www.facebook.com/v21.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v21.0/oauth/access_token",
    // After token exchange, callback resolves IG Business Account from FB Pages
    userInfoUrl: "https://graph.facebook.com/v21.0/me",
    scopes: [
      "pages_show_list",
      "pages_read_engagement",
    ],
    clientIdEnv: "INSTAGRAM_APP_ID",
    clientSecretEnv: "INSTAGRAM_APP_SECRET",
    responseType: "code",
    extractUsername: (profile) => {
      // Instagram username is resolved in the callback via Pages → IG Business Account
      const igUsername = profile.ig_username as string | undefined;
      const name = profile.name as string | undefined;
      return igUsername || name || null;
    },
  },
  youtube: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
    scopes: [
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/youtube.upload",
    ],
    clientIdEnv: "YOUTUBE_CLIENT_ID",
    clientSecretEnv: "YOUTUBE_CLIENT_SECRET",
    responseType: "code",
    extractUsername: (profile) => {
      const items = profile.items as Array<Record<string, unknown>> | undefined;
      const snippet = items?.[0]?.snippet as Record<string, unknown> | undefined;
      return snippet?.title as string | null;
    },
  },
  tiktok: {
    authUrl: "https://www.tiktok.com/v2/auth/authorize/",
    tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
    userInfoUrl: "https://open.tiktokapis.com/v2/user/info/",
    scopes: ["user.info.basic", "video.publish"],
    clientIdEnv: "TIKTOK_CLIENT_ID",
    clientSecretEnv: "TIKTOK_CLIENT_SECRET",
    responseType: "code",
    extractUsername: (profile) => {
      const data = profile.data as Record<string, unknown> | undefined;
      const user = data?.user as Record<string, unknown> | undefined;
      return user?.display_name as string | null;
    },
  },
  threads: {
    authUrl: "https://threads.net/oauth/authorize",
    tokenUrl: "https://graph.threads.net/oauth/access_token",
    userInfoUrl: "https://graph.threads.net/v1.0/me",
    scopes: ["threads_basic", "threads_content_publish"],
    clientIdEnv: "THREADS_CLIENT_ID",
    clientSecretEnv: "THREADS_CLIENT_SECRET",
    responseType: "code",
    extractUsername: (profile) => profile.username as string | null,
  },
  meta: {
    authUrl: "https://www.facebook.com/v21.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v21.0/oauth/access_token",
    userInfoUrl: "https://graph.facebook.com/v21.0/me",
    scopes: ["pages_manage_posts", "pages_read_engagement", "public_profile"],
    clientIdEnv: "META_CLIENT_ID",
    clientSecretEnv: "META_CLIENT_SECRET",
    responseType: "code",
    extractUsername: (profile) => profile.name as string | null,
  },
};

/* ── Public helpers ── */

export function getOAuthConfig(platform: string): OAuthPlatformConfig | null {
  return OAUTH_CONFIGS[platform] ?? null;
}

/**
 * Returns true if the platform's client ID + secret are set in env vars.
 */
export function isOAuthConfigured(platform: string): boolean {
  const config = OAUTH_CONFIGS[platform];
  if (!config) return false;
  return !!(process.env[config.clientIdEnv] && process.env[config.clientSecretEnv]);
}

/**
 * Builds the full OAuth authorization URL with all required params.
 * Returns null if the platform isn't configured.
 */
export function buildAuthUrl(platform: string, redirectUri: string): {
  url: string;
  state: string;
} | null {
  const config = OAUTH_CONFIGS[platform];
  if (!config) return null;

  const clientId = process.env[config.clientIdEnv];
  if (!clientId) return null;

  // State = platform:csrfToken (validated on callback)
  const csrfToken = crypto.randomBytes(16).toString("hex");
  const state = `${platform}:${csrfToken}`;

  const params = new URLSearchParams({
    response_type: config.responseType,
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: config.scopes.join(" "),
    state,
  });

  // X/Twitter requires PKCE — add code_challenge for future use
  // For now, basic OAuth2 Authorization Code flow

  return {
    url: `${config.authUrl}?${params.toString()}`,
    state,
  };
}

/**
 * Returns list of supported OAuth platforms.
 */
export function getSupportedPlatforms(): string[] {
  return Object.keys(OAUTH_CONFIGS);
}

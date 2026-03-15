import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOAuthConfig, isOAuthConfigured, buildAuthUrl } from "@/lib/oauth-config";

/**
 * OAuth initiation — builds the authorization URL and redirects.
 * If env vars aren't configured, returns a helpful JSON message instead.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;

  const config = getOAuthConfig(platform);
  if (!config) {
    return NextResponse.json(
      {
        error: `OAuth not available for ${platform}`,
        needsManualSetup: true,
        configured: false,
      },
      { status: 400 }
    );
  }

  // Check if credentials are configured
  if (!isOAuthConfigured(platform)) {
    return NextResponse.json({
      url: config.authUrl,
      platform,
      message: `OAuth for ${platform} requires API credentials. Set ${config.clientIdEnv} and ${config.clientSecretEnv} in .env.local`,
      configured: false,
    });
  }

  // Build the redirect URI
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/connect/callback`;

  const result = buildAuthUrl(platform, redirectUri);
  if (!result) {
    return NextResponse.json(
      { error: "Failed to build OAuth URL", configured: false },
      { status: 500 }
    );
  }

  // Store state in httpOnly cookie for CSRF validation on callback
  const cookieStore = await cookies();
  cookieStore.set("oauth_state", result.state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return NextResponse.json({
    url: result.url,
    platform,
    configured: true,
  });
}

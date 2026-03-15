import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import https from "https";
import { getOAuthConfig } from "@/lib/oauth-config";
import { MOCK_AUTH_ENABLED } from "@/lib/auth/mock-auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Make an HTTPS POST request using Node's https module.
 * Avoids Node.js native fetch (undici) IPv6/timeout issues on Windows.
 */
function httpsPost(
  url: string,
  body: string,
  headers: Record<string, string>,
  timeoutMs = 15000
): Promise<{ status: number; data: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request(
      {
        hostname: parsed.hostname,
        port: 443,
        path: parsed.pathname + parsed.search,
        method: "POST",
        headers: {
          ...headers,
          "Content-Length": Buffer.byteLength(body).toString(),
        },
        family: 4, // Force IPv4
        timeout: timeoutMs,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk: Buffer) => { data += chunk.toString(); });
        res.on("end", () => resolve({ status: res.statusCode ?? 0, data }));
      }
    );
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Request timed out")); });
    req.write(body);
    req.end();
  });
}

/**
 * Make an HTTPS GET request using Node's https module.
 */
function httpsGet(
  url: string,
  headers: Record<string, string>,
  timeoutMs = 15000
): Promise<{ status: number; data: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request(
      {
        hostname: parsed.hostname,
        port: 443,
        path: parsed.pathname + parsed.search,
        method: "GET",
        headers,
        family: 4,
        timeout: timeoutMs,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk: Buffer) => { data += chunk.toString(); });
        res.on("end", () => resolve({ status: res.statusCode ?? 0, data }));
      }
    );
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Request timed out")); });
    req.end();
  });
}

/**
 * OAuth callback — exchanges authorization code for tokens,
 * fetches user profile, and stores the connection.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error) {
    const errorDescription = searchParams.get("error_description");
    console.error(`OAuth error: ${error}`, errorDescription);
    const msg = errorDescription || error;
    return NextResponse.redirect(
      new URL(`/setup?error=${encodeURIComponent(msg)}`, appUrl)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/setup?error=missing_params", appUrl)
    );
  }

  // Parse state: "platform:csrfToken"
  const [platform, csrfToken] = state.split(":");
  if (!platform || !csrfToken) {
    return NextResponse.redirect(
      new URL("/setup?error=invalid_state", appUrl)
    );
  }

  // Validate CSRF state against cookie
  const cookieStore = await cookies();
  const storedState = cookieStore.get("oauth_state")?.value;
  if (storedState !== state) {
    return NextResponse.redirect(
      new URL("/setup?error=state_mismatch", appUrl)
    );
  }
  // Note: oauth_state cookie is cleared on the response object in the try block below

  const config = getOAuthConfig(platform);
  if (!config) {
    return NextResponse.redirect(
      new URL(`/setup?error=unknown_platform`, appUrl)
    );
  }

  const clientId = process.env[config.clientIdEnv];
  const clientSecret = process.env[config.clientSecretEnv];
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL(`/setup?error=missing_credentials`, appUrl)
    );
  }

  const redirectUri = `${appUrl}/api/connect/callback`;

  try {
    // ── Step 1: Exchange code for tokens ──
    const tokenBody: Record<string, string> = {
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    };

    const tokenRes = await httpsPost(
      config.tokenUrl,
      new URLSearchParams(tokenBody).toString(),
      {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      }
    );

    if (tokenRes.status < 200 || tokenRes.status >= 300) {
      console.error(`Token exchange failed for ${platform}:`, tokenRes.status, tokenRes.data);
      return NextResponse.redirect(
        new URL(`/setup?error=${encodeURIComponent(`token_exchange_failed: ${tokenRes.status}`)}`, appUrl)
      );
    }

    const tokenData = JSON.parse(tokenRes.data);
    const accessToken: string = tokenData.access_token;
    if (!accessToken) {
      console.error(`No access_token in response for ${platform}:`, tokenData);
      return NextResponse.redirect(
        new URL(`/setup?error=${encodeURIComponent("no_access_token_returned")}`, appUrl)
      );
    }
    const refreshToken: string | null = tokenData.refresh_token ?? null;
    const expiresIn: number | null = tokenData.expires_in ?? null;
    const tokenExpiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null;

    // ── Step 2: Fetch user profile ──
    let username: string | null = null;
    let platformUserId: string | null = null;

    try {
      const profileRes = await httpsGet(
        config.userInfoUrl,
        {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        }
      );

      if (profileRes.status >= 200 && profileRes.status < 300) {
        const profile = JSON.parse(profileRes.data);
        username = config.extractUsername(profile);
        platformUserId = (profile.sub ?? profile.id ?? null) as string | null;
      } else {
        console.warn(`Profile fetch failed for ${platform}:`, profileRes.status, profileRes.data);
      }
    } catch (profileErr) {
      console.warn(`Profile fetch error for ${platform}:`, profileErr);
      // Non-fatal — continue without username
    }

    // ── Step 3: Store connection ──
    // Build redirect response first, then set cookies on it
    const successUrl = new URL(`/setup?connected=${platform}`, appUrl);
    const response = NextResponse.redirect(successUrl);

    // Set token cookie on the response object (avoids cookies() mutation issues)
    response.cookies.set(`${platform}_token`, JSON.stringify({
      accessToken,
      refreshToken,
      platformUserId,
      tokenExpiresAt,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: expiresIn || 60 * 60 * 24 * 30,
      path: "/",
    });

    // Clear the oauth_state cookie
    response.cookies.set("oauth_state", "", {
      httpOnly: true,
      maxAge: 0,
      path: "/",
    });

    if (MOCK_AUTH_ENABLED) {
      // In mock mode, also store in a client-readable cookie so the setup page
      // can call connectPlatform() on redirect
      response.cookies.set("oauth_result", JSON.stringify({
        platform,
        username,
        accessToken,
        refreshToken,
        tokenExpiresAt,
        platformUserId,
      }), {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60,
        path: "/",
      });
    } else {
      // Real mode: store tokens in Supabase
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          return NextResponse.redirect(
            new URL("/setup?error=not_authenticated", appUrl)
          );
        }

        const { data: workspaces } = await supabase
          .from("workspaces")
          .select("id")
          .eq("user_id", user.id)
          .limit(1);

        const workspaceId = (workspaces?.[0] as unknown as Record<string, unknown>)?.id as string;
        if (!workspaceId) {
          return NextResponse.redirect(
            new URL("/setup?error=no_workspace", appUrl)
          );
        }

        const { data: existing } = await supabase
          .from("platform_connections")
          .select("id")
          .eq("workspace_id", workspaceId)
          .eq("platform", platform)
          .limit(1);

        const connectionData = {
          platform_user_id: platformUserId,
          platform_username: username,
          access_token: accessToken,
          refresh_token: refreshToken,
          token_expires_at: tokenExpiresAt,
          is_active: true,
        };

        if (existing && existing.length > 0) {
          await (supabase.from("platform_connections") as any)
            .update(connectionData)
            .eq("id", (existing[0] as any).id);
        } else {
          await supabase
            .from("platform_connections")
            .insert({
              workspace_id: workspaceId,
              platform,
              ...connectionData,
            } as any);
        }
      } catch (dbErr) {
        console.error(`Supabase storage error for ${platform}:`, dbErr);
        return NextResponse.redirect(
          new URL(`/setup?error=${encodeURIComponent("db_storage_failed")}`, appUrl)
        );
      }
    }

    return response;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`OAuth callback error for ${platform}:`, msg, err);
    return NextResponse.redirect(
      new URL(`/setup?error=${encodeURIComponent(`callback_error: ${msg}`)}`, appUrl)
    );
  }
}

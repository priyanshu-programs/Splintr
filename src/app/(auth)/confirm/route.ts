import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

// Handles email confirmation links from Supabase
// Default Supabase email template links to: /confirm?token_hash=...&type=email
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as
    | "email"
    | "signup"
    | "recovery"
    | "email_change"
    | null;

  if (tokenHash && type) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignored — middleware handles session refresh
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Check onboarding status
        const { data: profile } = await supabase
          .from("users")
          .select("onboarding_completed")
          .eq("id", user.id)
          .single();

        const needsOnboarding = !profile?.onboarding_completed;

        return NextResponse.redirect(
          `${origin}${needsOnboarding ? "/onboarding" : "/dashboard"}`
        );
      }
    }
  }

  // Fallback — something went wrong
  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
}

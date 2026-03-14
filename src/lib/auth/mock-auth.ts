import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { User, Workspace } from "@/lib/supabase/types";

export const MOCK_AUTH_ENABLED =
  process.env.NEXT_PUBLIC_MOCK_AUTH === "true";

const MOCK_USER_ID = "00000000-0000-0000-0000-000000000001";
const MOCK_WORKSPACE_ID = "00000000-0000-0000-0000-000000000002";

export const MOCK_SUPABASE_USER: SupabaseUser = {
  id: MOCK_USER_ID,
  email: "dev@splintr.local",
  app_metadata: { provider: "mock" },
  user_metadata: { full_name: "Dev User" },
  aud: "authenticated",
  created_at: new Date().toISOString(),
} as SupabaseUser;

export const MOCK_PROFILE: User = {
  id: MOCK_USER_ID,
  email: "dev@splintr.local",
  full_name: "Dev User",
  avatar_url: null,
  onboarding_completed: false,
  stripe_customer_id: null,
  subscription_tier: "pro",
  subscription_status: "active",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const MOCK_WORKSPACE: Workspace = {
  id: MOCK_WORKSPACE_ID,
  user_id: MOCK_USER_ID,
  name: "Dev Workspace",
  logo_url: null,
  timezone: "America/New_York",
  created_at: new Date().toISOString(),
};

if (MOCK_AUTH_ENABLED) {
  console.warn(
    "⚠️  MOCK AUTH IS ENABLED — do NOT deploy with NEXT_PUBLIC_MOCK_AUTH=true"
  );
}

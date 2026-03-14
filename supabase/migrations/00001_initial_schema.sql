-- Splintr Initial Database Schema
-- Run this in Supabase SQL Editor or via supabase db push

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE subscription_tier AS ENUM ('free', 'starter', 'pro', 'business');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'trialing');
CREATE TYPE platform_type AS ENUM ('linkedin', 'instagram', 'x', 'blog', 'youtube', 'tiktok', 'threads', 'bluesky');
CREATE TYPE source_type AS ENUM ('text', 'url', 'audio', 'video', 'document');
CREATE TYPE content_status AS ENUM ('draft', 'processing', 'ready', 'archived');
CREATE TYPE output_type AS ENUM ('post', 'thread', 'article', 'caption', 'script_short', 'script_long', 'carousel', 'video');
CREATE TYPE generation_status AS ENUM ('generating', 'ready', 'edited', 'scheduled', 'published', 'failed');
CREATE TYPE batch_status AS ENUM ('processing', 'complete', 'partial_failure');
CREATE TYPE usage_action AS ENUM ('generation', 'transcription', 'video_generation');
CREATE TYPE plan_interval AS ENUM ('month', 'year');

-- ============================================================
-- TABLES
-- ============================================================

-- users: extends Supabase auth.users
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  onboarding_completed boolean DEFAULT false,
  stripe_customer_id text,
  subscription_tier subscription_tier DEFAULT 'free',
  subscription_status subscription_status DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- workspaces
CREATE TABLE workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  logo_url text,
  timezone text DEFAULT 'America/New_York',
  created_at timestamptz DEFAULT now()
);

-- platform_connections
CREATE TABLE platform_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  platform platform_type NOT NULL,
  platform_user_id text,
  platform_username text,
  access_token text,       -- encrypt via Supabase Vault in production
  refresh_token text,      -- encrypt via Supabase Vault in production
  token_expires_at timestamptz,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE (workspace_id, platform)
);

-- voice_profiles
CREATE TABLE voice_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_default boolean DEFAULT false,
  system_prompt text,
  tone text,
  writing_samples text[] DEFAULT '{}',
  platform_overrides jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- content_items: source content fed into the system
CREATE TABLE content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title text,
  source_type source_type NOT NULL,
  source_content text,
  source_file_url text,
  transcript text,
  word_count integer,
  status content_status DEFAULT 'draft',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- generation_batches: groups generations from a single syndication run
CREATE TABLE generation_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id uuid NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  voice_profile_id uuid REFERENCES voice_profiles(id) ON DELETE SET NULL,
  platforms text[] DEFAULT '{}',
  status batch_status DEFAULT 'processing',
  total_generations integer DEFAULT 0,
  completed_generations integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- generations: AI-generated platform-specific outputs
CREATE TABLE generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id uuid NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  batch_id uuid REFERENCES generation_batches(id) ON DELETE SET NULL,
  voice_profile_id uuid REFERENCES voice_profiles(id) ON DELETE SET NULL,
  platform platform_type NOT NULL,
  output_type output_type NOT NULL,
  generated_content text,
  generated_media_urls text[] DEFAULT '{}',
  status generation_status DEFAULT 'generating',
  scheduled_for timestamptz,
  published_at timestamptz,
  published_url text,
  edit_history jsonb DEFAULT '[]',
  ai_model text,
  ai_tokens_used integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- templates
CREATE TABLE templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,  -- null = system template
  name text NOT NULL,
  description text,
  platform platform_type NOT NULL,
  output_type output_type NOT NULL,
  prompt_template text NOT NULL,
  is_system boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- usage_logs
CREATE TABLE usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  action usage_action NOT NULL,
  tokens_used integer DEFAULT 0,
  credits_used integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- subscription_plans: Stripe plan mirror for fast access
CREATE TABLE subscription_plans (
  id text PRIMARY KEY,  -- Stripe Price ID
  name text NOT NULL,
  tier subscription_tier NOT NULL,
  interval plan_interval NOT NULL,
  price_cents integer NOT NULL,
  generation_limit integer NOT NULL,  -- -1 = unlimited
  platform_limit integer NOT NULL,
  voice_profile_limit integer NOT NULL,
  features jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_workspaces_user_id ON workspaces(user_id);
CREATE INDEX idx_platform_connections_workspace_id ON platform_connections(workspace_id);
CREATE INDEX idx_voice_profiles_workspace_id ON voice_profiles(workspace_id);
CREATE INDEX idx_content_items_workspace_id ON content_items(workspace_id);
CREATE INDEX idx_content_items_status ON content_items(status);
CREATE INDEX idx_generations_workspace_id ON generations(workspace_id);
CREATE INDEX idx_generations_content_item_id ON generations(content_item_id);
CREATE INDEX idx_generations_batch_id ON generations(batch_id);
CREATE INDEX idx_generations_status ON generations(status);
CREATE INDEX idx_generations_scheduled_for ON generations(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX idx_generation_batches_workspace_id ON generation_batches(workspace_id);
CREATE INDEX idx_usage_logs_workspace_id ON usage_logs(workspace_id);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at);
CREATE INDEX idx_templates_workspace_id ON templates(workspace_id);
CREATE INDEX idx_templates_platform ON templates(platform);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER voice_profiles_updated_at
  BEFORE UPDATE ON voice_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER content_items_updated_at
  BEFORE UPDATE ON content_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER generations_updated_at
  BEFORE UPDATE ON generations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER generation_batches_updated_at
  BEFORE UPDATE ON generation_batches FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- users: can only read/update own row
CREATE POLICY "Users can read own data"
  ON users FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE USING (auth.uid() = id);

-- workspaces: owner access only
CREATE POLICY "Workspace owner full access"
  ON workspaces FOR ALL USING (auth.uid() = user_id);

-- platform_connections: via workspace ownership
CREATE POLICY "Platform connections via workspace"
  ON platform_connections FOR ALL
  USING (workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid()));

-- voice_profiles: via workspace ownership
CREATE POLICY "Voice profiles via workspace"
  ON voice_profiles FOR ALL
  USING (workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid()));

-- content_items: via workspace ownership
CREATE POLICY "Content items via workspace"
  ON content_items FOR ALL
  USING (workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid()));

-- generations: via workspace ownership
CREATE POLICY "Generations via workspace"
  ON generations FOR ALL
  USING (workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid()));

-- generation_batches: via workspace ownership
CREATE POLICY "Generation batches via workspace"
  ON generation_batches FOR ALL
  USING (workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid()));

-- templates: system templates readable by all, user templates via workspace
CREATE POLICY "System templates readable by all"
  ON templates FOR SELECT
  USING (is_system = true);

CREATE POLICY "User templates via workspace"
  ON templates FOR ALL
  USING (
    workspace_id IS NOT NULL
    AND workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );

-- usage_logs: via workspace ownership
CREATE POLICY "Usage logs via workspace"
  ON usage_logs FOR ALL
  USING (workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid()));

-- subscription_plans: readable by all authenticated users
CREATE POLICY "Plans readable by authenticated users"
  ON subscription_plans FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================
-- AUTO-CREATE USER ROW ON SIGNUP (trigger on auth.users)
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- SEED: Subscription Plans
-- ============================================================

INSERT INTO subscription_plans (id, name, tier, interval, price_cents, generation_limit, platform_limit, voice_profile_limit, features) VALUES
  ('price_starter_monthly', 'Starter Monthly', 'starter', 'month', 1900, 50, 3, 1, '{"content_library_limit": 100, "output_types": ["post", "caption"], "scheduling": "basic", "analytics": "basic", "team_members": 1, "transcription_hours": 2}'),
  ('price_starter_yearly', 'Starter Annual', 'starter', 'year', 19000, 50, 3, 1, '{"content_library_limit": 100, "output_types": ["post", "caption"], "scheduling": "basic", "analytics": "basic", "team_members": 1, "transcription_hours": 2}'),
  ('price_pro_monthly', 'Pro Monthly', 'pro', 'month', 4900, 300, 8, 5, '{"content_library_limit": 1000, "output_types": ["post", "caption", "thread", "article", "script_short", "script_long"], "scheduling": "smart", "analytics": "full", "team_members": 3, "transcription_hours": 10}'),
  ('price_pro_yearly', 'Pro Annual', 'pro', 'year', 49000, 300, 8, 5, '{"content_library_limit": 1000, "output_types": ["post", "caption", "thread", "article", "script_short", "script_long"], "scheduling": "smart", "analytics": "full", "team_members": 3, "transcription_hours": 10}'),
  ('price_business_monthly', 'Business Monthly', 'business', 'month', 9900, -1, -1, -1, '{"content_library_limit": -1, "output_types": ["post", "caption", "thread", "article", "script_short", "script_long", "carousel", "video"], "scheduling": "bulk", "analytics": "export", "team_members": 10, "transcription_hours": 50}'),
  ('price_business_yearly', 'Business Annual', 'business', 'year', 99000, -1, -1, -1, '{"content_library_limit": -1, "output_types": ["post", "caption", "thread", "article", "script_short", "script_long", "carousel", "video"], "scheduling": "bulk", "analytics": "export", "team_members": 10, "transcription_hours": 50}');

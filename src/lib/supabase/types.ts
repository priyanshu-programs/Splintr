// Database types matching the Supabase schema
// These are used until we generate types via `supabase gen types typescript`

export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'business';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing';
export type PlatformType = 'linkedin' | 'instagram' | 'x' | 'blog' | 'youtube' | 'tiktok' | 'threads' | 'meta';
export type SourceType = 'text' | 'url' | 'audio' | 'video' | 'document';
export type ContentStatus = 'draft' | 'processing' | 'ready' | 'archived';
export type OutputType = 'post' | 'thread' | 'article' | 'caption' | 'script_short' | 'script_long' | 'carousel' | 'video';
export type GenerationStatus = 'generating' | 'ready' | 'edited' | 'scheduled' | 'published' | 'failed';
export type BatchStatus = 'processing' | 'complete' | 'partial_failure';
export type UsageAction = 'generation' | 'transcription' | 'video_generation';
export type PlanInterval = 'month' | 'year';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
  stripe_customer_id: string | null;
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  user_id: string;
  name: string;
  logo_url: string | null;
  timezone: string;
  created_at: string;
}

export interface PlatformConnection {
  id: string;
  workspace_id: string;
  platform: PlatformType;
  platform_user_id: string | null;
  platform_username: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface VoiceProfile {
  id: string;
  workspace_id: string;
  name: string;
  is_default: boolean;
  system_prompt: string | null;
  tone: string | null;
  writing_samples: string[];
  platform_overrides: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ContentItem {
  id: string;
  workspace_id: string;
  title: string | null;
  source_type: SourceType;
  source_content: string | null;
  source_file_url: string | null;
  transcript: string | null;
  word_count: number | null;
  status: ContentStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Generation {
  id: string;
  content_item_id: string;
  workspace_id: string;
  batch_id: string | null;
  voice_profile_id: string | null;
  platform: PlatformType;
  output_type: OutputType;
  generated_content: string | null;
  generated_media_urls: string[];
  status: GenerationStatus;
  scheduled_for: string | null;
  published_at: string | null;
  published_url: string | null;
  edit_history: Record<string, unknown>[];
  ai_model: string | null;
  ai_tokens_used: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface GenerationBatch {
  id: string;
  content_item_id: string;
  workspace_id: string;
  voice_profile_id: string | null;
  platforms: string[];
  status: BatchStatus;
  total_generations: number;
  completed_generations: number;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  workspace_id: string | null;
  name: string;
  description: string | null;
  platform: PlatformType;
  output_type: OutputType;
  prompt_template: string;
  is_system: boolean;
  created_at: string;
}

export interface UsageLog {
  id: string;
  workspace_id: string;
  action: UsageAction;
  tokens_used: number;
  credits_used: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  interval: PlanInterval;
  price_cents: number;
  generation_limit: number;
  platform_limit: number;
  voice_profile_limit: number;
  features: Record<string, unknown>;
  created_at: string;
}

// Supabase Database type definition for typed client
export interface Database {
  public: {
    Tables: {
      users: { Row: User; Insert: Partial<User> & Pick<User, 'id' | 'email'>; Update: Partial<User>; Relationships: [] };
      workspaces: { Row: Workspace; Insert: Partial<Workspace> & Pick<Workspace, 'user_id' | 'name'>; Update: Partial<Workspace>; Relationships: [] };
      platform_connections: { Row: PlatformConnection; Insert: Partial<PlatformConnection> & Pick<PlatformConnection, 'workspace_id' | 'platform'>; Update: Partial<PlatformConnection>; Relationships: [] };
      voice_profiles: { Row: VoiceProfile; Insert: Partial<VoiceProfile> & Pick<VoiceProfile, 'workspace_id' | 'name'>; Update: Partial<VoiceProfile>; Relationships: [] };
      content_items: { Row: ContentItem; Insert: Partial<ContentItem> & Pick<ContentItem, 'workspace_id' | 'source_type'>; Update: Partial<ContentItem>; Relationships: [] };
      generations: { Row: Generation; Insert: Partial<Generation> & Pick<Generation, 'content_item_id' | 'workspace_id' | 'platform' | 'output_type'>; Update: Partial<Generation>; Relationships: [] };
      generation_batches: { Row: GenerationBatch; Insert: Partial<GenerationBatch> & Pick<GenerationBatch, 'content_item_id' | 'workspace_id'>; Update: Partial<GenerationBatch>; Relationships: [] };
      templates: { Row: Template; Insert: Partial<Template> & Pick<Template, 'name' | 'platform' | 'output_type' | 'prompt_template'>; Update: Partial<Template>; Relationships: [] };
      usage_logs: { Row: UsageLog; Insert: Partial<UsageLog> & Pick<UsageLog, 'workspace_id' | 'action'>; Update: Partial<UsageLog>; Relationships: [] };
      subscription_plans: { Row: SubscriptionPlan; Insert: Partial<SubscriptionPlan> & Pick<SubscriptionPlan, 'id' | 'name' | 'tier' | 'interval' | 'price_cents' | 'generation_limit' | 'platform_limit' | 'voice_profile_limit'>; Update: Partial<SubscriptionPlan>; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      subscription_tier: SubscriptionTier;
      subscription_status: SubscriptionStatus;
      platform_type: PlatformType;
      source_type: SourceType;
      content_status: ContentStatus;
      output_type: OutputType;
      generation_status: GenerationStatus;
      batch_status: BatchStatus;
      usage_action: UsageAction;
      plan_interval: PlanInterval;
    };
  };
}

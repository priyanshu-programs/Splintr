# Splintr – Comprehensive Product Specification

A full-stack content syndication and repurposing platform. Feed in one piece of content, get platform-optimized versions for LinkedIn, Instagram, X, blogs, video scripts, and AI-generated video — all from a single dashboard.

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [App Architecture](#app-architecture)
3. [Database Schema](#database-schema)
4. [Landing Page / Marketing Site](#landing-page-marketing-site)
5. [Pricing & Stripe Integration](#pricing-stripe-integration)
6. [Authentication & Signup Flow](#authentication-signup-flow)
7. [Onboarding Flow](#onboarding-flow)
8. [Core Engine: Content Syndication](#core-engine-content-syndication)
9. [Dashboard](#dashboard)
10. [Content Library](#content-library)
11. [Platform Connections](#platform-connections)
12. [AI Configuration & Voice Model](#ai-configuration-voice-model)
13. [Scheduling & Calendar](#scheduling-calendar)
14. [Analytics & Reporting](#analytics-reporting)
15. [Settings & Account Management](#settings-account-management)
16. [API & Webhook Architecture](#api-webhook-architecture)
17. [Future: Direct Platform Publishing](#future-direct-platform-publishing)
18. [Future: AI Video Generation](#future-ai-video-generation)

-

## Tech Stack

| Layer | Technology |
|------|-------------|
| Framework | Next.js 15 (App Router, Server Components, Server Actions) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS 4 + shadcn/ui component library |
| Database | Supabase (Postgres) + Supabase Realtime for live updates |
| Auth | Supabase Auth (email/password + OAuth: Google, GitHub) |
| Payments | Stripe (Checkout Sessions, Customer Portal, Webhooks) |
| AI | Anthropic Claude API, specifically Claude Opus-4.6 (content generation) |
| File Storage | Supabase Storage (uploads, generated assets) |
| Video Generation | Replicate API or RunwayML API (future) |
| State Management | Zustand (client), React Query / TanStack Query (server state) |
| Forms | React Hook Form + Zod validation |
| Charts | Recharts |
| Animations | Framer Motion |
| Email | Resend (transactional emails) |
| Deployment | Vercel |
| Monitoring | Sentry (error tracking) |
| Rate Limiting | Upstash Redis |
| Job Queue | Supabase Edge Functions + pg_cron for scheduled jobs |

-

## App Architecture

/
├─ /                      # Landing page, pricing, blog — public routes
│  ├─ page.tsx            # Landing page
│  ├─ pricing/page.tsx
│  └─ blog/
│
├─ (auth)/                # Login, signup, forgot password
│  ├─ login/page.tsx
│  ├─ signup/page.tsx
│  └─ callback/page.tsx   # OAuth callback
│
├─ (onboarding)/
│  └─ page.tsx            # Multi-step onboarding wizard
│
├─ (app)/                 # Authenticated app routes
│  ├─ dashboard/page.tsx  # Content syndication engine
│  ├─ create/page.tsx
│  ├─ library/page.tsx    # Content library / history
│  ├─ analytics/page.tsx  # Analytics dashboard
│  ├─ voice/page.tsx      # AI voice/prompt configuration
│  └─ settings/page.tsx   # Account, billing, team
│
├─ api/
│  ├─ webhooks/stripe/    # Stripe webhook handler
│  ├─ generate/           # AI content generation endpoint
│  ├─ transcribe/         # Audio/video transcription
│  └─ publish/            # Platform publishing (future)
│
├─ lib/
│  ├─ supabase/           # Client, server, middleware helpers
│  ├─ stripe/             # Stripe helpers
│  ├─ ai/                 # Claude API wrapper, prompt templates
│  ├─ platforms/          # Platform-specific formatters
│  └─ utils/

## Database Schema

### users

| Column | Type | Notes |
|------|------|------|
| id | uuid (PK) | Supabase auth.users FK |
| email | text | Unique |
| full_name | text | |
| avatar_url | text | |
| onboarding_completed | boolean | Default false |
| stripe_customer_id | text | Nullable |
| subscription_tier | enum | 'free', 'starter', 'pro', 'business' |
| subscription_status | enum | 'active', 'past_due', 'canceled', 'trialing' |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

### workspaces

| Column | Type | Notes |
|------|------|------|
| id | uuid (PK) | |
| user_id | uuid (FK) | Owner |
| name | text | |
| logo_url | text | Nullable |
| timezone | text | Default 'America/New_York' |
| created_at | timestamptz | |

---

### platform_connections

| Column | Type | Notes |
|------|------|------|
| id | uuid (PK) | |
| workspace_id | uuid (FK) | |
| platform | enum | 'linkedin', 'instagram', 'x', 'blog', 'youtube', 'tiktok', 'threads', 'meta' |
| platform_user_id | text | External platform user ID |
| platform_username | text | Display name |
| access_token | text | Encrypted |
| refresh_token | text | Encrypted, nullable |
| token_expires_at | timestamptz | |
| is_active | boolean | Default true |
| metadata | jsonb | Platform-specific data |
| created_at | timestamptz | |

---

### voice_profiles

| Column | Type | Notes |
|------|------|------|
| id | uuid (PK) | |
| workspace_id | uuid (FK) | |
| name | text | e.g., "Professional", "Casual" |
| is_default | boolean | |
| system_prompt | text | Base AI system prompt |
| tone | text | e.g., "authoritative", "friendly", "witty" |
| writing_samples | text[] | Array of example content for style matching |
| platform_overrides | jsonb | Per-platform prompt adjustments |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

### content_items (source content fed into the system)

| Column | Type | Notes |
|------|------|------|
| id | uuid (PK) | |
| workspace_id | uuid (FK) | |
| title | text | User-provided or auto-generated |
| source_type | enum | 'text', 'url', 'audio', 'video', 'document' |
| source_content | text | Raw text, URL, or storage path |
| source_file_url | text | Supabase Storage URL if file upload |
| transcript | text | For audio/video — auto-generated |
| word_count | integer | |
| status | enum | 'draft', 'processing', 'ready', 'archived' |
| metadata | jsonb | Duration, format, dimensions, etc. |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### content_items (source content fed into the system)

| workspace_id | uuid (FK) | |
| title | text | User-provided or auto-generated |
| source_type | enum | 'text', 'url', 'audio', 'video', 'document' |
| source_content | text | Raw text, URL, or storage path |
| source_file_url | text | Supabase Storage URL if file upload |
| transcript | text | For audio/video — auto-generated |
| word_count | integer | |
| status | enum | 'draft', 'processing', 'ready', 'archived' |
| metadata | jsonb | Duration, format, dimensions, etc. |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

### generations (AI-generated platform-specific outputs)

| Column | Type | Notes |
|------|------|------|
| id | uuid (PK) | |
| content_item_id | uuid (FK) | Source content |
| workspace_id | uuid (FK) | |
| voice_profile_id | uuid (FK) | Which voice was used |
| platform | enum | Target platform |
| output_type | enum | 'post', 'thread', 'article', 'caption', 'script_short', 'script_long', 'carousel', 'video' |
| generated_content | text | The AI output |
| generated_media_urls | text[] | Any generated images/videos |
| status | enum | 'generating', 'ready', 'edited', 'scheduled', 'published', 'failed' |
| scheduled_for | timestamptz | Nullable |
| published_at | timestamptz | Nullable |
| published_url | text | Nullable — link to live post |
| edit_history | jsonb | Array of previous versions |
| ai_model | text | Which model generated this |
| ai_tokens_used | integer | Token tracking |
| metadata | jsonb | Platform-specific data (hashtags, mentions, etc.) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

### generation_batches (groups generations from a single syndication run)

| Column | Type | Notes |
|------|------|------|
| id | uuid (PK) | |
| content_item_id | uuid (FK) | |
| workspace_id | uuid (FK) | |
| voice_profile_id | uuid (FK) | |
| platforms | text[] | Array of target platforms |
| status | enum | 'processing', 'complete', 'partial_failure' |
| total_generations | integer | |
| completed_generations | integer | |

# Splintr – Comprehensive Product Specification
## Database Schema

### templates

| Column | Type | Notes |
|------|------|------|
| id | uuid (PK) | |
| workspace_id | uuid (FK) | Nullable (null = system template) |
| name | text | |
| description | text | |
| platform | enum | |
| output_type | enum | |
| prompt_template | text | With {{variables}} |
| is_system | boolean | System-provided vs user-created |
| created_at | timestamptz | |

---

### usage_logs

| Column | Type | Notes |
|------|------|------|
| id | uuid (PK) | |
| workspace_id | uuid (FK) | |
| action | enum | 'generation', 'transcription', 'video_generation' |
| tokens_used | integer | |
| credits_used | integer | |
| metadata | jsonb | |
| created_at | timestamptz | |

---

### subscription_plans (Stripe plan mirror for fast access)

| Column | Type | Notes |
|------|------|------|
| id | text (PK) | Stripe Price ID |
| name | text | |
| tier | enum | 'starter', 'pro', 'business' |
| interval | enum | 'month', 'year' |
| price_cents | integer | |
| generation_limit | integer | Monthly limit, -1 = unlimited |
| platform_limit | integer | Max connected platforms |
| voice_profile_limit | integer | |
| features | jsonb | Feature flags |

---

# Landing Page

## Hero Section

**Headline:**  
"One piece of content. Every platform. Instantly."

**Subheadline:**  
"Feed Splintr a blog post, podcast, or video — get ready-to-publish content for LinkedIn, Instagram, X, your blog, and video scripts in seconds."

## Prompt for Landing Page:
# Splintr – Comprehensive Product Specification

## Landing Page

### Hero Section
- **Headline:** "One piece of content. Every platform. Instantly."
- **Subheadline:** "Feed Splintr a blog post, podcast, or video — get ready-to-publish content for LinkedIn, Instagram, X, your blog, and video scripts in seconds."

### Prompt for Landing Page:

### Social Proof Bar
- Logos of platforms supported
- "Trusted by X creators" counter
- Star ratings / testimonial snippets

### Feature Sections (scroll)

1. **"Paste. Click. Syndicate."** — 3-step visual showing input + AI processing + multi-platform output

2. **"Your voice, amplified"** — Voice profile customization: show tone slider, writing sample ingestion, per-platform adjustments

3. **"Every format, handled"** — Grid of output types: LinkedIn posts, X threads, Instagram carousels, blog articles, short-form video scripts, long-form video scripts, audiograms

4. **"AI that learns you"** — Explain Voice Model: ingests your writing samples, matches your tone, improves with feedback

5. **"See everything at a glance"** — Dashboard preview: calendar, analytics charts, content library

6. **"Schedule or publish now"** — Calendar view with drag-and-drop scheduling

---

### Pricing Section (inline on Landing page + dedicated /pricing route)

- Toggle: Monthly / Annual (annual shows savings badge)
- 3 plan cards + enterprise CTA
- Feature comparison table below cards

---

### FAQ Section
- Collapsible accordion with 8–10 common questions

---

### Footer
- Product links, legal (Privacy, Terms), social links, "Built with [tech]" badge

---

## Pricing & Stripe Integration

### Plans

| Feature | Starter ($19/mo or $190/yr) | Pro ($49/mo or $490/yr) | Business ($99/mo or $990/yr) |

## Landing Page

### Hero Section
- **Headline:** "One piece of content. Every platform. Instantly."
- **Subheadline:** "Feed Splintr a blog post, podcast, or video — get ready-to-publish content for LinkedIn, Instagram, X, your blog, and video scripts in seconds."

### Prompt for Landing Page:

### Social Proof Bar
- Logos of platforms supported
- "Trusted by X creators" counter
- Star ratings / testimonial snippets

### Feature Sections (scroll)

1. **"Paste. Click. Syndicate."** — 3-step visual showing input + AI processing + multi-platform output

2. **"Your voice, amplified"** — Voice profile customization: show tone slider, writing sample ingestion, per-platform adjustments

3. **"Every format, handled"** — Grid of output types: LinkedIn posts, X threads, Instagram carousels, blog articles, short-form video scripts, long-form video scripts, audiograms

4. **"AI that learns you"** — Explain Voice Model: ingests your writing samples, matches your tone, improves with feedback

5. **"See everything at a glance"** — Dashboard preview: calendar, analytics charts, content library

6. **"Schedule or publish now"** — Calendar view with drag-and-drop scheduling

### Pricing Section (inline on Landing page + dedicated /pricing route)

- Toggle: Monthly / Annual (annual shows savings badge)
- 3 plan cards + enterprise CTA
- Feature comparison table below cards

### FAQ Section
- Collapsible accordion with 8–10 common questions

### Footer
- Product links, legal (Privacy, Terms), social links, "Built with [tech]" badge

---

## Pricing & Stripe Integration

### Plans

| Feature | Starter ($19/mo or $190/yr) | Pro ($49/mo or $490/yr) | Business ($99/mo or $990/yr) |
|--------|------------------------------|--------------------------|-------------------------------|
| Generations/month | 50 | 300 | Unlimited |
| Connected platforms | 3 | 8 | Unlimited |
| Voice profiles | 1 | 5 | Unlimited |

### Plans

| Feature | Starter ($19/mo or $190/yr) | Pro ($49/mo or $490/yr) | Business ($99/mo or $990/yr) |
|--------|------------------------------|--------------------------|-------------------------------|
| Generations/month | 50 | 300 | Unlimited |
| Connected platforms | 3 | 8 | Unlimited |
| Voice profiles | 1 | 5 | Unlimited |
| Content library | 100 items | 1,000 items | Unlimited |
| Output types | Posts, captions | + Threads, articles, scripts | + Video generation, carousels |
| Scheduling | Basic (manual time pick) | Smart scheduling (optimal times) | + Bulk scheduling, auto-queue |
| Analytics | Basic (generation counts) | Full (per-platform performance) | + Export, custom reports |
| Team members | 1 | 3 | 10 |
| Support | Email | Priority email | Priority + onboarding call |
| Transcription | 2 hrs/mo | 10 hrs/mo | 50 hrs/mo |

---

### Stripe Implementation

1. **Checkout Flow:**  
   User clicks plan → `stripe.checkout.sessions.create()` with `mode: 'subscription'`, `success_url` pointing to `/onboarding`, `cancel_url` back to `/pricing`. Include `client_reference_id` with the user's Supabase ID.

2. **Webhook Handler** (`/api/webhooks/stripe`):

   - `checkout.session.completed` → Create user account in Supabase if not exists, set `subscription_tier`, `stripe_customer_id`
   - `invoice.paid` → Reset monthly usage counters
   - `invoice.payment_failed` → Set `subscription_status` to `past_due`, send email via Resend
   - `customer.subscription.updated` → Sync plan changes
   - `customer.subscription.deleted` → Downgrade to free, set `subscription_status` to `canceled`

3. **Customer Portal:**  
   Stripe Customer Portal for self-serve plan changes, payment method updates, invoice history. Link from Settings page.

4. **Usage Tracking:**  
   Increment `usage_logs` on each generation. Check against plan limits before processing. Return 402 with upgrade CTA when limits hit.

5. **Annual Billing:**  
   ~17% discount. Show monthly equivalent price on cards. Badge: "Save $X/year".

6. **Free Trial:**  
   7-day trial on Pro plan. `subscription_status: 'trialing'`. Banner in-app showing days remaining. Email reminders at day 3 and day 6.

   ## Core Engine: Content Syndication

This is the heart of the app — the `/create` page.

### Input Methods

1. **Text paste** — Raw text content (blog post, article, transcript, notes)

2. **URL import** — Paste a URL, server-side scrapes and extracts main content  
   (use `@mozilla/readability` or similar)

3. **File upload** — Drag-and-drop zone supporting:
   - Documents: `.txt`, `.md`, `.docx`, `.pdf`
   - Audio: `.mp3`, `.wav`, `.m4a`, `.ogg` (auto-transcribed via Whisper)
   - Video: `.mp4`, `.mov`, `.webm` (extract audio → transcribe)

4. **YouTube/podcast URL** — Detect YouTube/podcast URLs, extract transcript automatically

---

### Processing Pipeline


Results displayed in card grid → User edits/approves → Schedule or copy

---

### AI Generation Details

For each platform, the AI receives:

- **System prompt** from the active voice profile (tone, style, rules)
- **Platform-specific instructions** (character limits, hashtag conventions, format rules)
- **Source content** (the full text or transcript)
- **Output type** requested (post, thread, article, script, etc.)
- **Template** if user selected one

---

### Platform-Specific Rules (embedded in prompts)

**LinkedIn**
- Max ~3,000 chars
- Hook-driven first line (pattern interrupt)
- Line breaks for readability (short paragraphs)
- 3–5 relevant hashtags at the end
- Professional but personal tone
- CTA at the end (comment, share, follow)
- No emojis unless voice profile permits


**X (Twitter)**
- Single post: 280 chars
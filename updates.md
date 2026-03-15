# Splintr - Development Updates

## Session: 2026-03-15 (continued)

### Completed Updates

#### Fix LinkedIn OAuth `callback_failed` Error
- **`src/app/api/connect/callback/route.ts`**: Fixed cookie mutation crash — moved cookie operations from `cookies()` API to `NextResponse.redirect().cookies.set()` which is safe in route handlers.
- Added `Accept: application/json` header to token exchange request (LinkedIn-specific fix).
- Made profile fetch non-fatal — connection completes even if userinfo endpoint fails.
- Replaced generic `callback_failed` error with specific error messages (`token_exchange_failed: <status>`, `db_storage_failed`, `callback_error: <message>`) so actual cause is visible in the UI.

#### Fix LinkedIn Publish Errors (426 + fetch failed)
- **`src/app/api/publish/route.ts`**: Updated `LinkedIn-Version` header from `"202401"` (sunset) to `"202501"`. Made configurable via `LINKEDIN_API_VERSION` env var.
- **`src/app/api/publish/route.ts`**: Fixed "fetch failed" error caused by Next.js patched `fetch` interfering with LinkedIn API calls. Added `cache: "no-store"`, `AbortController` timeout (15s), and detailed error logging with cause capture.
- OAuth connect flow verified working correctly — no changes needed.

#### LinkedIn Real Posting Integration
- **`src/lib/oauth-config.ts`**: Re-added `w_member_social` scope to LinkedIn OAuth — required for posting content. User must enable "Share on LinkedIn" product in LinkedIn Developer Portal.
- **`src/app/api/connect/callback/route.ts`**: Added persistent httpOnly cookie (`linkedin_token`) storing access token and platform user ID so the publish API route can use it server-side.
- **`src/app/api/publish/route.ts`**: Replaced stub `publishToPlatformApi()` with real LinkedIn Posts API integration (`POST https://api.linkedin.com/rest/posts`). Works in both mock and Supabase modes. Other platforms still return mock URLs.
- **`src/app/(app)/create/page.tsx`**: Wired `handlePublish()` to call `/api/publish` with content, platform, and generationId. Shows published URL in success message.
- **`src/lib/connections-store.ts`**: `consumeOAuthResult()` now also persists access token in localStorage (`splintr_platform_tokens`) for potential client-side use.

### What's Still Needed (TODOs)
- User must enable "Sign In with LinkedIn using OpenID Connect" product in LinkedIn Developer Portal
- User must enable "Share on LinkedIn" product in LinkedIn Developer Portal for posting to work
- After enabling, disconnect and reconnect LinkedIn in Setup page to authorize with new `w_member_social` scope
- Implement real posting for other platforms (X/Twitter, Instagram, YouTube, etc.)

---

## Session: 2026-03-11

### Starting State
- Landing page fully implemented (all 15 components with WebGL, HUD, smooth scroll, custom cursor)
- Next.js 16 app scaffolded with route structure
- All app pages, auth pages, API routes, and lib clients were stubs/placeholders
- Build passes successfully

---

### Completed Updates

#### 1. Auth Pages (Login, Signup, OAuth Callback)
- **Login page** (`(auth)/login/page.tsx`): Full split-screen layout with branding panel, Google + GitHub OAuth buttons, email/password form with show/hide toggle, remember me, forgot password link, loading states
- **Signup page** (`(auth)/signup/page.tsx`): Split-screen with benefits panel (7-day trial, no CC required), full name/email/password form, OAuth buttons, terms agreement
- **OAuth callback** (`(auth)/callback/page.tsx`): Loading spinner with auto-redirect to dashboard

#### 2. Onboarding Wizard (`(onboarding)/page.tsx`)
- 4-step wizard with visual progress indicators (Profile → Platforms → Voice → Ready)
- Step 1: Workspace name + timezone selection
- Step 2: Platform picker grid (8 platforms: LinkedIn, X, Instagram, Blog, YouTube, TikTok, Threads, Bluesky)
- Step 3: Tone selector (8 options) + writing sample textarea
- Step 4: Summary confirmation with workspace details
- Back/Continue navigation with data persistence

#### 3. App Layout with Sidebar (`(app)/layout.tsx`)
- Collapsible sidebar (260px → 72px) with smooth transitions
- Mobile-responsive: drawer overlay on small screens
- Navigation: Dashboard, Create, Library, Analytics, Voice Profiles, Settings
- Usage indicator showing generation count vs plan limit
- User profile section with avatar and logout
- Top header bar with "New Content" quick action

#### 4. Dashboard Page (`(app)/dashboard/page.tsx`)
- Stats grid: Generations, Published Posts, Scheduled, Avg. Engagement (with change indicators)
- Recent generations list with platform icons, status badges (published/scheduled/draft), timestamps
- Upcoming posts sidebar with platform + time scheduling
- Quick actions grid: Paste text, Upload audio/video, View analytics, Manage voice profiles

#### 5. Create Content Page (`(app)/create/page.tsx`) — Core Syndication Engine
- 3-tab input: Paste Text, Import URL, Upload File (drag-and-drop zone)
- Platform selection grid (LinkedIn, X/Twitter, Instagram, Blog, Short Video, Long Video)
- Generate button with loading/processing state
- Results view: Card grid of generated outputs per platform
- Per-output actions: Copy to clipboard, Approve, Regenerate
- Mock data demonstrating LinkedIn post, X thread, Instagram caption, Blog article formats

#### 6. Content Library Page (`(app)/library/page.tsx`)
- Search + status filter (All/Ready/Processing/Draft/Archived)
- Toggle between List view and Grid view
- Content items showing: title, source type icon, platforms, word count, output count, status badge, date
- 6 mock content items with varied statuses and source types

#### 7. Analytics Page (`(app)/analytics/page.tsx`)
- Period selector (7d / 30d / 90d)
- Overview stats: Total Impressions, Engagement Rate, Link Clicks, Shares (with trend indicators)
- Weekly activity bar chart (CSS-based, no chart library needed)
- Top performing content list ranked by engagement
- Platform breakdown table with impression bars, followers, engagement rates, post counts

#### 8. Voice Profiles Page (`(app)/voice/page.tsx`)
- Profile list sidebar with 3 example profiles (Professional, Casual & Witty, Educational)
- Detail view with tone sliders (Analytical↔Emotional, Formal↔Casual, Concise↔Descriptive)
- Confidence meter and system log showing sample match percentage
- Writing samples section with 3 examples
- Platform overrides grid
- Actions: Edit, Duplicate, Delete, Create new

#### 9. Settings Page (`(app)/settings/page.tsx`)
- 4-tab interface: Profile, Billing, Connections, Notifications
- **Profile**: Avatar upload, name/email fields, workspace settings, danger zone (delete account)
- **Billing**: Current plan display (Pro/$49), usage meters (generations, platforms, profiles, transcription), invoice history, upgrade/manage buttons
- **Connections**: Platform connection status (LinkedIn, X connected; Instagram, Blog disconnected), connect/disconnect actions
- **Notifications**: Toggle switches for generation alerts, publishing reminders, weekly digest, usage alerts, product updates

#### 10. Pricing Page (`pricing/page.tsx`)
- Full standalone pricing page with nav header
- Monthly/Annual toggle with 17% savings badge
- 3 plan cards (Starter $19, Pro $49 popular, Business $99) with feature lists
- Dynamic price calculation based on billing period

#### 11. Library Clients
- **Supabase client** (`lib/supabase/client.ts`): Browser client using `@supabase/ssr`
- **Supabase server** (`lib/supabase/server.ts`): Server client with cookie-based auth
- **Stripe client** (`lib/stripe/client.ts`): Stripe SDK configured with plan definitions (Starter/Pro/Business with all limits)
- **Claude AI wrapper** (`lib/ai/claude.ts`): Full content generation with platform-specific prompts, voice profile support, batch generation for multiple platforms
- **Platform formatters** (`lib/platforms/index.ts`): Platform configs with character limits, output types, and content validation

#### 12. API Routes
- **`/api/generate`**: POST endpoint accepting sourceContent + platforms, calls Claude batch generation
- **`/api/webhooks/stripe`**: POST endpoint with signature verification scaffolding, event handler TODOs
- **`/api/transcribe`**: POST endpoint accepting file upload or URL, scaffolded for Whisper integration
- **`/api/publish`**: POST endpoint accepting generationId + platform + optional scheduling

#### 13. Dependencies Installed
- `@supabase/ssr` + `@supabase/supabase-js` — Auth & database
- `@anthropic-ai/sdk` — Claude API for content generation
- `stripe` — Payment processing

---

### Build Status
- All 18 routes compile and build successfully
- 14 static pages + 4 dynamic API routes
- Zero TypeScript errors
- Zero build warnings (besides lockfile detection)

#### 14. Supabase Auth Middleware & Auth Wiring
- **Middleware** (`src/middleware.ts`): Session refresh on every request via `@supabase/ssr`, route protection (protected routes redirect to `/login`, auth routes redirect to `/dashboard` if authenticated), matcher excludes static files/API routes/landing pages
- **Login page** (`(auth)/login/page.tsx`): Wired `signInWithPassword`, Google/GitHub OAuth buttons via `signInWithOAuth`, error state display, redirect to `/dashboard` on success
- **Signup page** (`(auth)/signup/page.tsx`): Wired `signUp` with `full_name` metadata, Google/GitHub OAuth buttons, error state display, redirect to `/onboarding` on success
- **OAuth callback** (`(auth)/callback/route.ts`): Server-side Route Handler that exchanges OAuth code for session, redirects new users to `/onboarding` and returning users to `/dashboard`
- **App layout** (`(app)/layout.tsx`): Logout button wired with `signOut()` + redirect to `/login`
- Removed old client-side callback page.tsx (conflicts with route.ts in Next.js)

#### 15. Database Schema & Types
- **Migration file** (`supabase/migrations/00001_initial_schema.sql`): Full Postgres schema with 10 enums, 10 tables, 16 indexes, 5 `updated_at` triggers, 12 RLS policies, auth trigger (`handle_new_user`), and seed data for 6 subscription plans
- **Tables**: `users`, `workspaces`, `platform_connections`, `voice_profiles`, `content_items`, `generations`, `generation_batches`, `templates`, `usage_logs`, `subscription_plans`
- **TypeScript types** (`lib/supabase/types.ts`): Interfaces for all tables, enum types, and `Database` type for typed Supabase client
- **Typed Supabase clients**: Both `client.ts` (browser) and `server.ts` (server) now use `Database` generic for full type safety
- **RLS policies**: Workspace-scoped access — users only see their own data; system templates and subscription plans readable by all authenticated users
- **Auth trigger**: Auto-creates `users` row on signup, pulling `full_name` and `avatar_url` from auth metadata

#### 16. Auth Flow Fixes — Email Confirmation (Option B)
- **Signup**: Added email confirmation handling — if Supabase returns user but no session, shows "Check your email" UI with green confirmation card instead of blindly redirecting
- **Signup**: Added `emailRedirectTo` option pointing to `/callback` so confirmation emails link back correctly
- **Signup + Login**: Added `router.refresh()` before `router.push()` so Next.js middleware picks up new session cookies before navigation
- **OAuth callback** (`callback/route.ts`): Replaced flawed 60-second "new user" heuristic with proper DB check — queries `users.onboarding_completed` to decide `/onboarding` vs `/dashboard`
- **Email confirm route** (`(auth)/confirm/route.ts`): NEW — handles `token_hash` + `type` params from Supabase confirmation emails via `verifyOtp()`, then redirects to `/onboarding` or `/dashboard` based on onboarding status
- **Login page**: Shows error message if redirected from failed confirmation (`?error=confirmation_failed`), wrapped in Suspense for `useSearchParams`
- All 19 routes build clean, no TS errors

#### 17. Auth Wiring — Real User Data in Dashboard & Sidebar
- **AuthProvider** (`lib/auth/AuthProvider.tsx`): NEW — React context that fetches Supabase auth user, `users` profile row, and workspace on mount; subscribes to `onAuthStateChange`; auto-creates a default workspace if none exists; exposes `useAuth()` hook with `{ user, profile, workspace, isLoading }`
- **Skeleton component** (`components/ui/Skeleton.tsx`): NEW — simple `animate-pulse` loading placeholder
- **App layout** (`(app)/layout.tsx`): Wrapped with `<AuthProvider>`, added client-side auth guard (redirects to `/login` if no session), loading spinner while auth resolves, sidebar now shows real user initial/name/email from Supabase instead of hardcoded "User"/"user@example.com", plan tier from `profile.subscription_tier`
- **Dashboard** (`(app)/dashboard/page.tsx`): Removed all hardcoded mock arrays (`recentGenerations`, `upcomingPosts`, fake stats). Now queries Supabase `generations` table for real data scoped by workspace. Shows loading skeletons while fetching. Shows empty states ("No content generated yet", "Nothing scheduled yet") when user has no data.
- All 19 routes build clean, no TS errors

#### 18. Mock Auth Bypass for Development
- **NEW** `src/lib/auth/mock-auth.ts`: Single source of truth — `MOCK_AUTH_ENABLED` flag, `MOCK_SUPABASE_USER` (SupabaseUser), `MOCK_PROFILE` (User with pro tier, onboarding complete), `MOCK_WORKSPACE` (Workspace), console warning when active
- **MODIFIED** `src/middleware.ts`: Early-return block at top of `middleware()` — when `NEXT_PUBLIC_MOCK_AUTH=true`, skips all Supabase client creation, lets requests through, auto-redirects `/login` and `/signup` → `/dashboard`
- **MODIFIED** `src/lib/auth/AuthProvider.tsx`: Imports mock constants, early return in `useEffect` — when enabled, sets mock user/profile/workspace and skips Supabase entirely
- **MODIFIED** `.env.local`: Added `NEXT_PUBLIC_MOCK_AUTH=false` (flip to `true` for UI dev, restart required)
- All existing auth code untouched — zero deletions

#### 19. Fix: "Go to Dashboard" button with mock auth
- **MODIFIED** `src/app/(onboarding)/onboarding/page.tsx`: Imported `MOCK_AUTH_ENABLED` from `@/lib/auth/mock-auth`, added early return in `handleFinish()` — when mock auth is enabled, skips all Supabase calls and navigates directly to `/dashboard`, fixing the redirect loop where `getUser()` returned null → pushed to `/login` → middleware redirected back to `/onboarding`

#### 20. Onboarding Page — Aesthetic Refactor
- **MODIFIED** `src/app/(onboarding)/onboarding/page.tsx`: Full visual refactor from tech/military aesthetic to clean minimal design
- Sidebar: green checkmark icons for completed steps, solid black dot for current, empty circle for future; removed progress bar and "modules armed" text
- Removed all eyebrow labels ("CORE PROTOCOL / 01"), sequence counters, "Snapshot" sidebar panels, "Routing Status" and "Sequence Intent" info boxes
- Step content simplified to core inputs only (no decorative panels)
- Step 4 (Dry Run) replaced: was a review summary, now a textarea for raw thought input to simulate syndication
- Color palette simplified: white main content, `#FAFAFA` sidebar, `#F5F6F8` page background (was multiple layered grays)
- Footer simplified: clean Back/Continue buttons, sharp edges, no instructional text
- Deleted `FieldLabel` component (no longer needed)
- Added `dryRunInput` state, added `Check` icon import from lucide-react
- All Supabase logic, state management, and navigation unchanged (~703 → ~470 lines)

#### 21. Onboarding Page — Layout Fine-Tuning
- **MODIFIED** `src/app/(onboarding)/onboarding/page.tsx`: Spacing and layout adjustments to match reference screenshots
- Removed separate `<footer>` bar — Back/Continue buttons now float inside the content area at bottom-right
- Content uses `flex-1 flex-col` so the action button pushes to the bottom naturally
- Increased padding: `px-16 py-16` on content area, `px-10 py-12` on sidebar
- Increased spacing between title block and step content (`mb-12`), and between content and action buttons (`mt-12`)
- Sidebar step items now have `py-4` (was `py-3`) for more breathing room

#### 22. Onboarding Page — Compact Redesign (Pixel-Perfect)
- **MODIFIED** `src/app/(onboarding)/onboarding/page.tsx`: Complete proportional tightening to match compact design reference
- Step 2 copy: title → "Establish Uplinks", description updated with mock mode note, action → "Confirm Uplinks"
- Platforms reduced from 8 to 5 (LinkedIn, X/Twitter, Instagram, YouTube Shorts, WordPress Blog), removed `desc` field
- Platform cards redesigned: tall selection cards → compact horizontal rows with checkbox on right (2-column grid, `max-w-xl`)
- Outer layout: page padding reduced (`p-2/3/4`), sidebar column narrowed to 220px
- Sidebar: padding reduced, nav margin `mt-8/mt-10`, stepper items `py-2.5` with `space-y-0`
- Main content: padding `px-6/8/10 py-6/8/10`, title `text-xl/2xl` (was 3xl/4xl), description `text-sm` (was base/lg)
- Title-to-content gap: `mb-6` (was `mb-12`), footer margin `mt-8` (was `mt-12`)
- All buttons: `h-9` (was h-11/h-12), `text-xs` (was text-sm)
- Steps 1,3,4,5: all tightened — smaller max-widths, smaller text, tighter padding/spacing
- Platform IDs unchanged (compatible with existing `PlatformType` enum)

#### 23. Onboarding — Voice Profile Slider Redesign + Voice Preview Step
- **MODIFIED** `src/app/(onboarding)/onboarding/page.tsx`:
  - Onboarding flow expanded from 5 steps to 6 steps (Welcome → Uplinks → Voice Profile → **Voice Preview** → Dry Run → Complete)
  - **Step 3 (Calibrate Tone)**: Replaced tone chip buttons + writing sample textarea with two range sliders matching reference design:
    - **Formality Index** (0–100%, default 70%) — Casual ↔ Corporate
    - **Humor Coefficient** (0–100%, default 22%) — Dry ↔ Witty
    - Uppercase labels with percentage readout, minimal slider styling with black thumb
    - **Advanced Settings [+/-]** collapsible section with custom system prompt textarea; shows "Profile successfully saved to local state." when prompt is entered
  - **New Step 4 (Voice Preview)**: Shows a live AI-generated sample output using the slider values + optional custom prompt; auto-generates on entry; displays model badge ("Claude Opus 4.6"), slider summary, and custom prompt indicator; includes Regenerate button and error/retry handling
  - Removed `selectedTone`, `writingSample`, `tones[]` array; added `formalityIndex`, `humorCoefficient`, derived `voiceToneLabel`
  - `handleFinish()` saves slider values in `platform_overrides` and derived tone label in `tone` field
  - Summary step (now step 6) shows slider percentages + custom prompt indicator
- **NEW** `src/app/api/voice-preview/route.ts`: POST endpoint that accepts `formalityIndex`, `humorCoefficient`, and `customPrompt`; translates slider values into natural language voice instructions; calls Claude Opus 4.6 with a sample LinkedIn post prompt; returns the generated preview text

#### 24. Voice Preview — Model Fix
- **MODIFIED** `src/app/api/voice-preview/route.ts`: Changed model from `claude-opus-4-6` to `claude-sonnet-4-5-20250929` — Opus was causing 500 errors (likely API key access/quota issue), Sonnet is sufficient for short preview text generation

#### 25. Fix: Voice Preview "Failed to generate preview" Error
- **MODIFIED** `src/app/api/voice-preview/route.ts`: Fixed invalid model ID `claude-sonnet-4-5-20250929` → `claude-sonnet-4-6` (the old ID was deprecated/nonexistent, causing 500 errors). Improved error handling to surface actionable Anthropic API errors — now distinguishes auth errors (401/403), insufficient credits (400), rate limits (429), and other API failures instead of returning a generic "Failed to generate" message.
- **MODIFIED** `src/app/(onboarding)/onboarding/page.tsx`: Client-side `generatePreview()` now reads the `error` field from the API response JSON and displays it to the user, instead of always showing a hardcoded generic message. This makes billing/auth issues immediately visible.
- **Root cause identified**: The Anthropic API key has insufficient credit balance (`"Your credit balance is too low to access the Anthropic API"`). Add credits at console.anthropic.com to resolve.

#### 26. Voice Preview — Switch from Anthropic to Google Gemini
- **MODIFIED** `src/app/api/voice-preview/route.ts`: Replaced Anthropic SDK with `@google/generative-ai` (Google Gemini). Now uses `gemini-2.0-flash` model instead of Claude. System prompt construction logic unchanged. Error handling updated for Gemini-specific errors (API key, quota/rate limits, safety filter blocks).
- **MODIFIED** `src/app/(onboarding)/onboarding/page.tsx`: Updated model badge from "Claude Opus 4.6" to "Gemini 2.0 Flash" in step 4 description and model indicator.
- **MODIFIED** `.env.local`: Added `GEMINI_API_KEY` placeholder. Get a free key at https://aistudio.google.com/apikey (no credit card required).
- **ADDED** `@google/generative-ai` dependency to `package.json`.
- **Why**: Anthropic API key had zero credits; Gemini 2.0 Flash has a permanently free tier (15 RPM, 1M tokens/day). Main content generation engine (`lib/ai/claude.ts`) remains on Claude.

#### 27. Voice Preview — Switch from OpenRouter to Anthropic (Fix Rate Limiting)
- **MODIFIED** `src/app/api/voice-preview/route.ts`: Replaced OpenRouter free-tier Llama model with Anthropic SDK using `claude-haiku-4-5-20251001`. OpenRouter's free tier has aggressive rate limits (~10 req/min per account) that caused constant "Rate limit reached" errors regardless of model selection. Haiku 4.5 is fast, cheap, and suitable for short preview text. Removed raw `fetch()` call and OpenRouter-specific error handling; now uses the same Anthropic SDK pattern as `lib/ai/claude.ts`.
- **Why**: Free-tier rate limits are per-account (not per-model), so changing models within OpenRouter didn't help. The project already has a working `ANTHROPIC_API_KEY`.

#### 28. Voice Preview — Switch to OpenRouter Free Model
- **MODIFIED** `src/app/api/voice-preview/route.ts`: Replaced Anthropic SDK with `@openrouter/sdk`. Now uses `openrouter/free` model (routes to free-tier models like Step 3.5 Flash) via the official OpenRouter SDK's `chat.send()` method. All prompt-building logic (formality/humor sliders, custom prompt) unchanged.
- **MODIFIED** `src/app/(onboarding)/onboarding/page.tsx`: Updated model labels from "Gemini 2.0 Flash" to "OpenRouter Free" in step description and model badge.
- **ADDED** `@openrouter/sdk` dependency to `package.json`. `OPENROUTER_API_KEY` was already in `.env.local`.
- **Why**: User requested strictly using the OpenRouter free model for voice preview, not Gemini or Claude.

#### 29. Font System Consistency — Landing Page Typography Applied App-Wide
- **MODIFIED** `src/app/layout.tsx`: Added Inter weight `"400"` to font loader. Changed `next/font` CSS variable from `--font-sans` to `--font-inter` to fix circular reference with Tailwind v4's `@theme` block (which defines `--font-sans` as a theme variable). Added `font-sans` class to `<body>`.
- **MODIFIED** `src/app/globals.css`: Fixed `@theme inline` block — changed `--font-sans: var(--font-sans)` (circular!) to `--font-sans: var(--font-inter)`. This was the root cause of Inter not rendering — the CSS variable pointed to itself, resolving to empty, falling back to browser default sans-serif.
- **MODIFIED** 9 page files — Added explicit `font-sans` to `<h1>` headings (matching dashboard pattern `font-sans text-2xl font-bold tracking-tight`):
  - `(app)/create/page.tsx`, `(app)/library/page.tsx`, `(app)/analytics/page.tsx`, `(app)/voice/page.tsx`, `(app)/settings/page.tsx`, `(onboarding)/onboarding/page.tsx`, `(auth)/login/page.tsx`, `(auth)/signup/page.tsx`, `pricing/page.tsx`
- **MODIFIED** `src/app/(app)/analytics/page.tsx`: Fixed subtitle — added `font-mono`, replaced hardcoded `#6A6D75` with `var(--sp-fg-light)`, added missing `text-[var(--sp-fg)]` on heading (consistent with all other app pages)
- **MODIFIED** `src/components/ui/button.tsx`: Added `font-sans` to shadcn Button base class in `cva()` so it's self-contained and doesn't rely on CSS inheritance

#### 30. URL Extract API — Robust Multi-Strategy Rewrite
- **MODIFIED** `src/app/api/extract/route.ts`: Replaced fragile regex-based HTML stripping with a 2-strategy extraction pipeline:
  - **Strategy 1 — Mozilla Readability + jsdom**: Parses HTML into a proper DOM, then uses the same Readability engine as Firefox Reader Mode to extract clean article text. Handles 90%+ of static web pages.
  - **Strategy 2 — Jina AI Reader fallback**: If Readability returns <100 chars (JS-rendered SPA, dynamic content), falls back to `r.jina.ai` which renders JavaScript before extracting. Free service, 25s timeout.
  - Improved User-Agent headers to mimic real Chrome browser (avoids bot-blocking).
  - Better error message when extraction truly fails (removes misleading "JavaScript-rendered" suggestion when the real issue is auth/empty page).
- **ADDED** `@mozilla/readability`, `jsdom` dependencies; `@types/jsdom` devDependency.
- **Tested**: Wikipedia article extracted 3,888 words successfully; various other URLs handled gracefully.

### What's Still Needed (TODOs)
- **Supabase email confirmation**: Either disable "Confirm email" in Supabase Dashboard → Auth → Email settings (for faster dev), or keep it enabled for production (the UI now handles both cases)
- Run migration in Supabase SQL Editor (if not done yet)
- Real data fetching on remaining pages (Library, Analytics, Voice, Settings still use mock data)
- Onboarding → save workspace, voice profile, platforms to Supabase
- Stripe checkout flow wiring
- File upload to Supabase Storage
- Platform OAuth connections (LinkedIn, X, Instagram APIs)
- Framer Motion animations on page transitions
- Recharts integration for analytics (currently CSS-based)

---

## Session: 2026-03-13 (Config & Setup)

### Completed Updates

#### 31. Grouped Sidebar Navigation (`(app)/layout.tsx`)
- Refactored sidebar from flat `navItems` to grouped `navSections`
- Added **Scheduling** item to the main navigation section
- Added a new section for **Setup** and **API Access** with a subtle spacer (removed visible "// CONFIG" text per user request)
- Maintained active path highlighting for all new routes

#### 32. Setup Page (`(app)/setup/page.tsx`)
- Implemented platform connection management dashboard
- 8 platform cards supported (LinkedIn, X, Instagram, YouTube, TikTok, Threads, Bluesky, WordPress)
- Connect/Disconnect functionality with local state persistence
- Coming-soon modal for OAuth integration with descriptive alerts
- Responsive grid layout with platform-specific branding colors

#### 33. API Access Page (`(app)/api-access/page.tsx`)
- Implemented API key and webhook management dashboard
- Key management: Generate new keys, show/hide keys, copy to clipboard, and revoke keys
- Webhook management: Display configured endpoints with event subscriptions and health status
- Event reference guide listing available system events (`generation.completed`, `content.published`, etc.)
- Real-time stats for active keys, webhooks, and monthly API usage

#### 34. Scheduling Page (`(app)/scheduling/page.tsx`)
- Full calendar view with month navigation (prev/next month, "Today" button)
- Calendar grid shows colored dots per day indicating scheduled (blue), published (green), and draft (amber) posts
- Click any day to see that day's posts in the sidebar with platform icon, title, time, and status badge
- "Upcoming (7 days)" panel showing the next week's scheduled content
- "This Month" quick stats (scheduled/published/drafts counts)
- Calendar/List toggle — list view shows all posts in a chronological table with platform icons and status
- Sample data with 6 posts across LinkedIn, X/Twitter, Instagram, and Blog
- Consistent design: `var(--sp-fg/sp-fg-light)` tokens, dark mode support, monospace fonts, rounded cards

### What's Still Needed (TODOs)
- **Supabase email confirmation**: Either disable "Confirm email" in Supabase Dashboard → Auth → Email settings (for faster dev), or keep it enabled for production
- Real data fetching on Setup and API Access pages (currently using interactive mock state)
- Platform OAuth connections integration
- Real data fetching on Scheduling page (currently using sample data)

---

## Session: 2026-03-14

### Completed Updates

#### 35. Content Management UX — Approve, Publish, Library Real Data
- **NEW** `src/lib/content-store.ts`: Dual-mode storage layer that auto-switches between localStorage (mock auth) and Supabase (real auth). Provides `approveContent()`, `getLibraryItems()`, `publishContent()`, `getConnectedPlatforms()`. Mock mode stores approved items in `localStorage` key `splintr_approved_items`. Real mode creates `content_items` + `generations` rows in Supabase.
- **MODIFIED** `src/app/(app)/create/page.tsx`:
  - Removed "New Generation" button from results view header
  - Wired "Approve" button — saves content to library via `content-store.ts`, shows approved state (green checkmark)
  - Added "Publish" button per output card — checks if platform is connected, shows message if not (with link to `/setup`), marks as published if connected
  - Visual states for all actions: loading spinners, approved indicator, published indicator, error/success toast messages
  - Regenerating a platform resets its approved/published state
- **MODIFIED** `src/app/(app)/library/page.tsx`:
  - Removed all 6 hardcoded mock `contentItems`
  - Now fetches real data via `getLibraryItems()` (from localStorage in mock mode, Supabase in real mode)
  - Added loading skeleton while fetching
  - Added empty state when no content approved yet
  - Expandable rows: click a content item to see all its generations with copy/publish actions
  - Grid view also supports inline expansion
  - Per-generation publish button with platform connection check
- **CONFIRMED** "New Syndication" button in `layout.tsx` already links to `/create` — no change needed

#### 36. Library Status Tagging — Clickable Status Dropdowns
- **MODIFIED** `src/lib/content-store.ts`: Added `updateContentStatus()` — updates a generation's status to any of ready/draft/published/archived in both mock (localStorage) and Supabase modes. Sets `published_at` timestamp when status changes to published.
- **MODIFIED** `src/app/(app)/library/page.tsx`:
  - Status badges on each generation row are now **clickable buttons** that open a dropdown with ready/draft/published/archived options
  - Works in both list view and grid view
  - Colored dot indicators for each status option in the dropdown
  - Current status is visually disabled in the dropdown
  - Shows "..." loading state while status is being updated
  - Click-outside-to-close behavior for the dropdown
  - Imported `useRef`, `useCallback` from React (for future use), added click-outside `useEffect`

#### 37. Library Status Colors — Distinct Per-Status Palette
- **MODIFIED** `src/app/(app)/library/page.tsx`: Updated `statusStyles` so each status has a distinct color with dark mode support:
  - **ready**: green (unchanged)
  - **published**: blue (unchanged)
  - **processing**: yellow with dark mode fix (was missing `dark:` variants)
  - **archived**: muted neutral gray (was same as draft)

#### 38. Fix Title Extraction Logic
- **Bug**: YouTube URLs displayed the raw URL as the title, some titles were too verbose (e.g. 60+ chars from start of content), and file uploads just used the filename instead of an AI-derived topic. This affected the library cards UI.
- **MODIFIED `src/app/(app)/create/page.tsx`**: Fixed `handleApprove` to always prefer the AI-derived `currentTopicTitle` for all input methods (text, URL, file), no longer bypassing it to use raw URLs or filenames. Capped `deriveTopicFromContent` fallback to 5 words max.
- **MODIFIED `src/app/api/extract/route.ts`**: Added `extractYouTubeTitle` using YouTube's public oEmbed API. YouTube pages often fail standard HTML extraction (Readability) because they are JS-rendered SPA shells; this dedicated strategy fetches the video title reliably and passes it through.
- **MODIFIED `src/lib/ai/openrouter.ts`**: Tightened the `extractTopic` prompt to ask for 3-5 words (was 3-6) and explicitly reject URLs. Added post-processing to clean up punctuation, reject results containing `http://`, and enforce a hard 5-word limit. Reduced the non-AI fallback length to 40 chars.
- **MODIFIED `src/app/api/generate/route.ts`**: Improved the title resolution chain to prefer the extracted title (e.g., YouTube video title) first, then the AI topic, and only fall back to a truncated 60-char source string as a last resort. Added a hard 80-char cap.

#### 39. Voice Profile CRUD — Store + Page Rewrite
- **NEW** `src/lib/voice-store.ts`: Dual-mode storage layer for voice profiles (localStorage in mock mode, Supabase in real mode). Exports 8 functions: `getVoiceProfiles()`, `getVoiceProfile(id)`, `createVoiceProfile()`, `updateVoiceProfile()`, `deleteVoiceProfile()`, `setDefaultProfile()`, `addWritingSample()`, `removeWritingSample()`. Mock mode seeds 3 default profiles (Professional, Casual & Witty, Educational) with slider values on first access. Supabase mode maps DB fields (`system_prompt` → `systemPrompt`, `writing_samples` → `writingSamples`, `platform_overrides` → stores sliders + overrides, `is_default` → `isDefault`). Prevents deletion of the default profile.
- **MODIFIED** `src/app/(app)/voice/page.tsx`: Full rewrite from static hardcoded data to live CRUD:
  - Loads profiles from `voice-store.ts` on mount via `useEffect`
  - Loading skeletons while fetching, empty state when no profiles
  - Profile list sidebar with clickable cards, selected state, DEFAULT badge
  - **Create**: "New Profile" button opens inline form (name input + 3 sliders) in detail area. Save/Cancel buttons.
  - **Edit**: Pencil icon makes name + sliders editable inline. Save/Cancel buttons call `updateVoiceProfile`.
  - **Delete**: Trash icon shows red confirmation dialog, calls `deleteVoiceProfile`. Disabled on default profile.
  - **Duplicate**: Copy icon calls `createVoiceProfile` with "(Copy)" suffix, copies sliders/samples/prompt.
  - **Set Default**: Star icon calls `setDefaultProfile`, only shown on non-default profiles.
  - **Writing Samples**: "+ Add Sample" opens textarea inline, save appends via `addWritingSample`. Each sample has X button to remove via `removeWritingSample` (hover-reveal).
  - All operations show loading spinners via `saving` state. Visual design unchanged (same CSS vars, card borders, rounded-xl, dark mode support).

---

## Session: 2026-03-15

### Completed Updates

#### 40. Scheduling Page — Wired to Real Data via Dual-Mode Store
- **NEW** `src/lib/scheduling-store.ts`: Dual-mode scheduling storage layer (pattern: `content-store.ts`).
  - Mock mode: localStorage key `splintr_scheduled_posts`, auto-seeds 6 sample posts if empty (2 scheduled, 2 published, 2 draft across linkedin/x/instagram/blog)
  - Real mode: Queries Supabase `generations` joined with `content_items` for titles
  - Exports: `getScheduledPosts(startDate, endDate)`, `schedulePost(id, date)`, `unschedulePost(id)`, `getUpcomingPosts()`, `getMonthStats(year, month)`
  - `getWorkspaceId()` helper for Supabase workspace scoping
- **MODIFIED** `src/app/(app)/scheduling/page.tsx`: Full rewrite from hardcoded sample data to real data fetching:
  - Loads posts via `getScheduledPosts()`, upcoming via `getUpcomingPosts()`, stats via `getMonthStats()` on mount and month navigation
  - Calendar dots now color-coded: blue=scheduled, green (#27C93F)=published, amber=draft
  - Click day shows real posts in sidebar with platform icon (mapped via lookup), title, time, status badge
  - Upcoming panel and This Month stats panel both pull from store
  - Loading skeletons (CalendarSkeleton, SidebarSkeleton) shown while fetching
  - Empty states for no-posts days and empty list view
  - Month navigation triggers data refetch via useCallback/useEffect
  - List view shows real posts sorted chronologically
  - Removed hardcoded `samplePosts` array and `icon` field on type (icons now resolved via `PLATFORM_ICONS` lookup)

#### 41. Settings Page — Wired to Real Data via settings-store.ts
- **NEW** `src/lib/settings-store.ts`: Dual-mode settings store (localStorage in mock mode, Supabase in real mode). Exports:
  - `getUserProfile()` / `updateUserProfile()` — reads/writes user profile (name, avatar). Mock: merges localStorage overrides with `MOCK_PROFILE`. Real: queries `users` table.
  - `getWorkspaceSettings()` / `updateWorkspaceSettings()` — reads/writes workspace (name, timezone). Mock: merges localStorage overrides with `MOCK_WORKSPACE`. Real: queries `workspaces` table.
  - `getBillingInfo()` — returns tier, status, and usage counts (generations this month, active platforms, voice profiles) with limits from `subscription_plans` table. Mock: returns pro tier defaults (23/50 gens, 2/6 platforms, 1/5 profiles).
  - `getConnections()` / `disconnectPlatform()` — reads platform connections, deactivates by setting `is_active = false`. Mock: stores in localStorage `splintr_connections`.
  - `getNotificationPrefs()` / `updateNotificationPrefs()` — localStorage-only in both modes with defaults.
- **MODIFIED** `src/app/(app)/settings/page.tsx`: Full rewrite from static hardcoded data to live store-backed state:
  - **Profile tab**: Loads user profile + workspace on mount. Editable full name, workspace name, timezone (expanded to 10 timezone options). Save button calls both `updateUserProfile` + `updateWorkspaceSettings`. Success/error inline messages. Email field disabled (read-only). Avatar initial derived from name. Delete account shows "Coming soon" alert.
  - **Billing tab**: Loads billing info on mount. Shows real tier badge and status. Three usage meters (generations, platforms, voice profiles) with progress bars. Upgrade/Manage buttons show "Stripe integration coming soon" alert. Invoice history remains placeholder.
  - **Connections tab**: Loads connections from store. Dynamic platform icons via lookup map. Disconnect button calls `disconnectPlatform` + refreshes list (with loading state). Connect button shows "OAuth integration coming soon" alert.
  - **Notifications tab**: Loads/saves from localStorage. Toggle switches persist immediately on click via `updateNotificationPrefs`. Uses typed keys instead of array indices.
  - All 4 tabs show loading skeletons while data fetches. Same visual design preserved (Tailwind classes, CSS vars, dark mode support).

#### 42. Setup/Connections Page — Wired to Real Data with OAuth Stubs
- **NEW** `src/lib/connections-store.ts`: Dual-mode storage layer for platform connections (pattern: `content-store.ts`).
  - Mock mode: localStorage key `splintr_connections`, auto-seeds with linkedin and x connected by default
  - Real mode: Queries/upserts Supabase `platform_connections` table (id, workspace_id, platform, platform_username, is_active, created_at)
  - Exports: `getConnections()`, `connectPlatform(platform, username?)`, `disconnectPlatform(platform)`, `isPlatformConnected(platform)`
  - `getWorkspaceId()` helper for Supabase workspace scoping
- **NEW** `src/app/api/connect/[platform]/route.ts`: OAuth initiation stub — returns OAuth URL for each platform (LinkedIn, X, Instagram, YouTube, TikTok, Threads, Bluesky) with a message about required API credentials. Blog returns 400 (no OAuth). In production, will add client_id, redirect_uri, scope, state params.
- **NEW** `src/app/api/connect/callback/route.ts`: OAuth callback stub — handles code/state/error params, redirects back to `/setup?connected=` or `/setup?error=`. Token exchange is TODO.
- **MODIFIED** `src/app/(app)/setup/page.tsx`: Full rewrite from static hardcoded data to live store-backed state:
  - Loads connections from `connections-store.ts` on mount via `useEffect`
  - Loading skeletons (8 placeholder cards) while fetching
  - Connect button calls `/api/connect/[platform]` API, shows info modal with credential requirements if not configured, still connects locally in mock mode for demo
  - Disconnect button calls `disconnectPlatform()`, refreshes list, shows success toast
  - Platform cards show: name, icon, connected username, green "Connected" badge, Connect/Disconnect button with loading spinners
  - URL params handling: `?connected=` shows success toast, `?error=` shows error toast (from OAuth callback)
  - Replaced Meta platform with Bluesky (added BlueskyIcon SVG)
  - Toast component with auto-dismiss (4s)
  - All 8 platforms: linkedin, x, instagram, youtube, tiktok, threads, bluesky, blog

#### 43. API Access Page — Wired to Dual-Mode Store
- **NEW** `src/lib/api-keys-store.ts`: Dual-mode storage layer for API keys and webhooks. Both mock and real mode use localStorage (no `api_keys`/`webhooks` tables in DB schema yet; TODO comment added for migration).
  - localStorage keys: `splintr_api_keys`, `splintr_webhooks`
  - Auto-seeds 1 example API key and 1 example webhook on first access
  - Key generation: `sk_live_` + 32 random hex chars, prefix stored as first 12 chars
  - Exports: `getApiKeys()`, `generateApiKey(name)`, `revokeApiKey(id)`, `getWebhooks()`, `createWebhook(url, events)`, `deleteWebhook(id)`, `testWebhook(id)`, `getApiUsageStats()`
  - `testWebhook()` simulates a ping with ~90% success rate and updates `lastTriggered`
- **MODIFIED** `src/app/(app)/api-access/page.tsx`: Full rewrite from hardcoded mock arrays to live store-backed state:
  - **API Keys section**: Loads keys from store on mount. Inline "Generate New Key" form (name input). On creation, shows modal with full key + copy button + "This key won't be shown again" warning. Key list: name, masked key (show/hide toggle), created date, last used (timeAgo), active/revoked badge. Copy to clipboard. Revoke with confirmation (inline Revoke/Cancel buttons).
  - **Webhooks section**: Loads webhooks from store. Inline "Add Webhook" form with URL input + event checkboxes (5 events: `generation.completed`, `content.published`, `content.scheduled`, `profile.updated`, `usage.limit_reached`). Webhook list: URL, event badges, active dot, last triggered (timeAgo), success rate bar. Test button sends simulated ping with result toast. Delete with confirmation.
  - **Stats bar**: Active keys count, active webhooks count, monthly API requests (from store).
  - Loading skeletons (StatSkeleton, KeySkeleton) while fetching. Empty states for no keys/webhooks.
  - Design tokens: `var(--sp-fg)`, `var(--sp-fg-light)`, `var(--sp-bg)`, `var(--sp-green)`. Dark mode support throughout.

#### 44. Transcribe API — Dual-Mode Rewrite (P10)
- **MODIFIED** `src/app/api/transcribe/route.ts`: Full rewrite with dual-mode pattern (matching `generate/route.ts`):
  - **Mock mode** (`MOCK_AUTH_ENABLED`): Returns 5 paragraphs of sample transcription about content creation and syndication (~127s duration, English). No API key required.
  - **Real mode**: Multi-provider Whisper support with automatic fallback:
    - Priority 1: Groq Whisper (`GROQ_API_KEY`) — free, fast, uses `whisper-large-v3`
    - Priority 2: OpenAI Whisper (`OPENAI_API_KEY`) — uses `whisper-1`
    - Returns 503 if neither key is configured
  - Input validation: file required, 25 MB max, supported formats (.mp3, .wav, .m4a, .ogg, .flac, .mp4, .mov, .mpeg, .mpga, .webm)
  - Typed `TranscriptionResult` interface: `{ transcript, duration, language, status }`
  - Extracted `resolveWhisperProvider()` and `handleWhisperError()` helpers for clean error handling (rate limit, auth, generic)
  - Imported `MOCK_AUTH_ENABLED` from `@/lib/auth/mock-auth` (works server-side since it reads `process.env`)
- **No changes needed to `src/app/(app)/create/page.tsx`**: The create page already wires audio/video uploads to `/api/transcribe` (lines 187-201) — detects audio/video files via `isAudioVideo()`, sends FormData, reads `data.transcript` from response. Fully compatible with new route.

#### 45. File Upload to Supabase Storage — Dual-Mode Upload Store + API Route (P9)
- **NEW** `src/lib/upload-store.ts`: Dual-mode file upload helper (localStorage metadata in mock mode, Supabase Storage in real mode).
  - `uploadFile(file, metadata?)` — validates type/size, mock mode returns fake URL (`https://mock-storage.splintr.dev/{path}`) and stores metadata in localStorage key `splintr_uploads`, real mode calls `/api/upload-storage` endpoint
  - `getUploadUrl(path)` — returns mock URL or Supabase Storage public URL
  - `deleteUpload(path)` — removes from localStorage (mock) or calls DELETE endpoint (real)
  - `listUploads()` — returns all stored upload metadata (mock mode)
  - Validation helpers: `isValidFileType()`, `isValidFileSize()`, `getFileCategory()` — exported for reuse
  - Allowed types: images (jpg/png/gif/webp), documents (pdf/txt/md), audio (mp3/wav/m4a)
  - Max file size: 10MB
- **NEW** `src/app/api/upload-storage/route.ts`: Server-side API route for file storage (separate from existing `/api/upload` which extracts text content).
  - POST: Accepts multipart form data (file + optional platform/contentItemId metadata). Validates file type and size. Mock mode returns fake URL. Real mode: authenticates user, uploads to Supabase Storage `uploads` bucket under `{userId}/{timestamp}-{rand}.{ext}`, returns public URL.
  - DELETE: Accepts `{ path }` JSON body. Mock mode returns success. Real mode: authenticates user, verifies path ownership (`path.startsWith(userId/)`), removes from Supabase Storage.
  - Returns JSON: `{ url, filename, size, type, path, platform?, contentItemId? }`
- **NOT MODIFIED** `src/app/api/upload/route.ts`: Existing text extraction endpoint left untouched — it serves the create page's document-to-text pipeline.
- **NOT MODIFIED** `src/app/(app)/create/page.tsx`: The file upload area on the create page is for feeding source content to AI generation (text extraction), not for file storage. No wiring changes needed.

#### 46. Stripe Checkout Integration (P8)
- **NEW** `src/lib/stripe-store.ts`: Client-side dual-mode store for Stripe billing operations.
  - `createCheckoutSession(priceId)` — calls POST `/api/stripe/checkout`, returns `{ url }` for redirect
  - `createPortalSession()` — calls POST `/api/stripe/portal`, returns `{ url }` for redirect
  - `getCurrentSubscription()` — mock mode returns pro subscription from localStorage/defaults, real mode returns null (handled by settings-store)
  - Types: `SubscriptionInfo`, `CheckoutResult`, `PortalResult`
- **NEW** `src/app/api/stripe/checkout/route.ts`: POST handler for creating Stripe Checkout sessions.
  - Mock mode: returns `{ url: "/dashboard?upgraded=true" }` with 300ms simulated delay
  - Real mode: dynamic imports Stripe SDK, gets user from Supabase auth, looks up or creates Stripe customer (stores `stripe_customer_id` in users table), creates checkout session with `mode: "subscription"`, `success_url`, `cancel_url`, and `supabase_user_id` in metadata
  - Input validation: requires `priceId` string
  - Error handling: missing Stripe config (500), auth required (401), Stripe API errors
- **NEW** `src/app/api/stripe/portal/route.ts`: POST handler for creating Stripe Billing Portal sessions.
  - Mock mode: returns `{ url: "/settings?tab=billing" }`
  - Real mode: gets user from Supabase auth, looks up `stripe_customer_id` from users table, creates portal session with `return_url` to settings billing tab
  - Error handling: missing Stripe config (500), auth required (401), no billing account (400)
- **MODIFIED** `src/app/api/webhooks/stripe/route.ts`: Full rewrite from stub to working webhook handler.
  - Mock mode: accepts any request, returns `{ received: true }`
  - Real mode: verifies signature via `stripe.webhooks.constructEvent` with `STRIPE_WEBHOOK_SECRET`
  - Handles 5 event types:
    - `checkout.session.completed` — sets `subscription_tier`, `subscription_status`, `stripe_customer_id` on users table; retrieves subscription to resolve price ID to tier
    - `customer.subscription.updated` — updates tier and status based on price ID
    - `customer.subscription.deleted` — downgrades to free tier, sets status canceled
    - `invoice.paid` — placeholder for usage counter reset
    - `invoice.payment_failed` — sets status to past_due
  - Uses Supabase service role client for DB writes (server-to-server)
  - `tierFromPriceId()` helper maps env var price IDs to tier names
- **MODIFIED** `src/app/pricing/page.tsx`: Full rewrite to wire checkout buttons.
  - Plan buttons now call `createCheckoutSession()` from `stripe-store.ts` with the correct price ID (monthly/yearly based on toggle)
  - Loading spinner on the clicked button during checkout (all other buttons disabled)
  - Error message bar below toggle when checkout fails
  - `?upgraded=true` query param triggers green success toast with auto-dismiss (5s)
  - URL cleaned up after showing toast via `router.replace`
  - Business tier redirects to `/signup` (contact sales placeholder)
  - Wrapped in `<Suspense>` for `useSearchParams` compatibility
  - Price IDs read from `NEXT_PUBLIC_STRIPE_*` env vars with fallback placeholders
  - Changed plan buttons from `<Link>` to `<button>` with `onClick` handlers

**Env vars needed (user will add later):**
- `STRIPE_SECRET_KEY` — server-side, for Stripe API calls
- `STRIPE_WEBHOOK_SECRET` — server-side, for webhook signature verification
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — client-side (future: Stripe.js)
- `NEXT_PUBLIC_STRIPE_STARTER_MONTHLY`, `NEXT_PUBLIC_STRIPE_STARTER_YEARLY` — price IDs
- `NEXT_PUBLIC_STRIPE_PRO_MONTHLY`, `NEXT_PUBLIC_STRIPE_PRO_YEARLY` — price IDs
- `NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY`, `NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY` — price IDs
- `STRIPE_PRICE_PRO`, `STRIPE_PRICE_TEAM` — server-side price IDs for webhook tier resolution
- `SUPABASE_SERVICE_ROLE_KEY` — server-side, for webhook DB writes

#### 18. Framer Motion Page Transitions (`src/app/(app)/template.tsx`)
- Created Next.js template file that re-renders on every navigation
- Wraps page content with `motion.div` for fade-in + slide-up animation
- Animation: opacity 0->1, y 8->0, 250ms easeOut
- Client component using `framer-motion` (already installed as dependency)
- No modifications to layout.tsx or any existing files

#### 47. Publish API — Dual-Mode Rewrite
- **MODIFIED** `src/app/api/publish/route.ts`: Full rewrite from 39-line stub (6 TODOs) to complete dual-mode publish endpoint.
  - **Mock mode** (`MOCK_AUTH_ENABLED`): Returns fake published URLs per platform (linkedin, x/twitter, instagram, youtube, tiktok, medium, wordpress, blog, threads, bluesky) using `getMockPublishedUrl()`. If `scheduledFor` is provided, returns `status: "scheduled"` with null URL. Otherwise returns `status: "published"` with mock URL and `publishedAt` timestamp.
  - **Real mode**: Full Supabase flow:
    1. Authenticates user via `createClient()` from `@/lib/supabase/server`
    2. Resolves workspace via `workspaces` table
    3. Verifies platform connection is active in `platform_connections` table (returns 400 if not connected)
    4. Fetches generation from `generations` table (scoped to workspace)
    5. If `scheduledFor` provided: updates generation to `status: "scheduled"` with `scheduled_for` timestamp
    6. If immediate: calls `publishToPlatformApi()` stub (generates mock URL with TODO comments for real OAuth per platform), updates generation to `status: "published"` with `published_at` and `published_url`
  - Platform API stubs: `publishToPlatformApi()` with TODO comments for each platform's OAuth posting endpoint (LinkedIn UGC API, X API v2, Instagram Graph API, YouTube Data API, TikTok Content Posting API, Medium API, WordPress REST API, Threads API, AT Protocol/Bluesky)
  - Error handling: 400 (missing params, unconnected platform), 401 (unauthenticated), 404 (no workspace, generation not found), 500 (DB update failures)
  - Response shape: `{ status, publishedUrl, platform, generationId, publishedAt, scheduledFor? }`

### What's Still Needed (TODOs)
- Create Supabase Storage bucket `uploads` with public access policy (via Supabase Dashboard or migration)
- Real data fetching on Analytics page (still mock)
- API keys/webhooks Supabase migration (currently localStorage-only; needs schema tables)
- Onboarding save to Supabase (workspace, voice profile, platforms)
- Wire settings page Billing tab "Manage Subscription" button to `createPortalSession()`
- Platform OAuth connections — real API credentials and token exchange (stubs in publish route and connect routes)
- Recharts integration for analytics (currently CSS-based)

# Golazo — Master Build Plan

> **Status:** Phase 5 complete — Phase 6 (Polish) next
> **Last commit:** `7e6df8c` — 2026-05-07
> **V1 Launch Target:** 15 May 2026
> **Model:** claude-sonnet-4-20250514 | Stack: Next.js 16 + Tailwind v4 + Supabase + Claude API + Vercel

---

## Pre-Build Notes

- All code must conform to the specs in `docs/backend-spec.md`, `docs/app-flow.md`, `docs/design.md`, and `docs/security-checklist.md`
- The Claude API is **always** called via `/api/claude` — `ANTHROPIC_API_KEY` never touches the client
- Every API route validates session + role before executing
- `is_locked = true` records are never overwritten by the parser
- Design tokens from `docs/design.md` are applied from the first component written

---

## Phase 1 — Project Setup ✅ COMPLETE

**Goal:** A clean, runnable Next.js 14 scaffold with the correct folder structure, all dependencies installed, environment variables wired, and a passing dev server.

### 1.1 Initialise Next.js project

```
npx create-next-app@latest . --typescript --tailwind --app --src-dir=false --import-alias="@/*"
```

**Files created by scaffolding (then immediately customised):**
- `package.json`
- `tsconfig.json`
- `tailwind.config.ts`
- `postcss.config.js`
- `next.config.ts`
- `app/layout.tsx` ← replaced with our root layout
- `app/globals.css` ← replaced with design token CSS variables
- `app/page.tsx` ← replaced with landing/redirect page

### 1.2 Install additional dependencies

```
npm install @supabase/supabase-js @supabase/ssr
npm install @anthropic-ai/sdk
npm install pdf-parse
npm install lucide-react
npm install clsx tailwind-merge
npm install @types/pdf-parse --save-dev
```

**Files modified:**
- `package.json`
- `package-lock.json`

### 1.3 Establish folder structure

Create all empty directories and placeholder `index.ts` barrel files as needed:

```
app/
  (auth)/
    login/
    signup/
    reset-password/
      confirm/
  (app)/
    trips/
      new/
      [tripId]/
        dashboard/
        vault/
        itinerary/
        flights/
        accommodation/
        chat/
        settings/
    layout.tsx          ← app shell (sidebar + main content)
  share/
    [tripId]/
  api/
    claude/
    trips/
      [tripId]/
        vault/
          [docId]/
        parse/
        itinerary/
          events/
            [eventId]/
        flights/
          [id]/
        accommodation/
          [id]/
        chat/
        members/
        share/
    share/
      [shareToken]/
components/
  ui/
  trip/
  vault/
  itinerary/
  flights/
  accommodation/
  chat/
lib/
  supabase/
  claude/
  services/
  utils/
types/
```

**Files created:**
- `lib/supabase/client.ts` — browser Supabase client (anon key)
- `lib/supabase/server.ts` — server Supabase client (service role key, SSR helpers)
- `types/database.ts` — hand-authored Supabase type definitions (full schema from `backend-spec.md`)
- `lib/utils/cn.ts` — `clsx` + `tailwind-merge` helper

### 1.4 Design token CSS variables

**Files created/modified:**
- `app/globals.css` — all `--color-*`, `--font-*`, `--space-*`, `--radius-*`, `--shadow-*` tokens from `design.md` written as CSS custom properties; Inter font loaded via `next/font`
- `tailwind.config.ts` — extended with design tokens so Tailwind classes map to CSS vars

### 1.5 Environment variables

**Files created:**
- `.env.local` — five variables with empty values (never committed):
  ```
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  ANTHROPIC_API_KEY=
  NEXT_PUBLIC_APP_URL=
  ```
- `.env.example` — same keys, empty values, committed as reference
- `.gitignore` — confirms `.env.local`, `.env`, `.env*.local` are excluded

### 1.6 Security headers

**Files modified:**
- `next.config.ts` — `headers()` function adds all security headers from `security-checklist.md` section 8 (CSP, X-Content-Type-Options, X-Frame-Options, HSTS, etc.)

### 1.7 Middleware (session guard)

**Files created:**
- `proxy.ts` — Next.js 16 uses `proxy.ts` (not `middleware.ts`); exports `proxy` function; protects all `/trips/*` routes; checks Supabase session via SSR helper; redirects unauthenticated users to `/login?redirect=[path]`; passes session through for authenticated routes

### 1.8 Root layout and landing redirect

**Files created/modified:**
- `app/layout.tsx` — root HTML shell; Inter font; no UI (just `{children}`)
- `app/page.tsx` — server component; redirects authenticated users to `/trips`, unauthenticated to `/login`

**Phase 1 deliverable:** `npm run dev` starts clean, middleware active, design tokens available. ✅

**Actual deviations from plan:**
- Next.js 16 installed (not 14); Tailwind v4 — no `tailwind.config.ts`, uses `@theme inline {}` blocks in `globals.css`
- `middleware.ts` → `proxy.ts` (Next.js 16 rename; function named `proxy`)
- Bricolage Grotesque + Epilogue fonts (replacing Inter) per `.impeccable.md` design direction
- Google Fonts `@import` must precede `@import "tailwindcss"` in CSS

---

## Phase 2 — Database Schema and Authentication ✅ COMPLETE

**Goal:** All Supabase tables created with correct schemas and RLS policies; auth pages fully functional.

### 2.1 Supabase database schema (SQL migrations)

Create all tables from `backend-spec.md` sections 2.2–2.12. Each table in a numbered migration file:

**Files created:**
- `supabase/migrations/001_profiles.sql`
- `supabase/migrations/002_trips.sql` — includes `deleted_at TIMESTAMPTZ DEFAULT NULL` for soft-delete
- `supabase/migrations/003_trip_members.sql`
- `supabase/migrations/004_documents.sql`
- `supabase/migrations/005_parsed_flights.sql`
- `supabase/migrations/006_parsed_accommodation.sql`
- `supabase/migrations/007_itinerary_days.sql`
- `supabase/migrations/008_itinerary_events.sql`
- `supabase/migrations/009_action_alerts.sql`
- `supabase/migrations/010_chat_messages.sql`
- `supabase/migrations/011_ai_audit_log.sql`
- `supabase/migrations/012_rls_policies.sql` — all RLS policies from `backend-spec.md` section 5
- `supabase/migrations/013_profile_trigger.sql` — `on_auth_user_created` trigger that inserts into `profiles` on Supabase `auth.users` insert

**Files modified:**
- `types/database.ts` — updated to match finalised schema

### 2.2 Auth UI — Login page

**Files created:**
- `app/(auth)/login/page.tsx` — email + password form; calls `supabase.auth.signInWithPassword()`; on success redirects to `/trips` (or `?redirect` param); on failure shows inline error (generic, does not reveal if email exists)
- `app/(auth)/layout.tsx` — centred single-column layout for all auth pages; Golazo logo + warm off-white background

### 2.3 Auth UI — Sign-up page

**Files created:**
- `app/(auth)/signup/page.tsx` — email + password form; calls `supabase.auth.signUp()`; shows confirmation email notice; link back to `/login`

### 2.4 Auth UI — Password reset

**Files created:**
- `app/(auth)/reset-password/page.tsx` — email form; calls `supabase.auth.resetPasswordForEmail()`; shows confirmation message
- `app/(auth)/reset-password/confirm/page.tsx` — new password form; validates Supabase magic link; calls `supabase.auth.updateUser()`; redirects to `/login` on success

### 2.5 Shared auth components

**Files created:**
- `components/ui/AuthCard.tsx` — white card container used by all auth pages
- `components/ui/Input.tsx` — styled input field (design.md spec); handles error state
- `components/ui/Button.tsx` — all four variants (Primary, Secondary, Danger, Ghost); all sizes; loading state with spinner
- `components/ui/Label.tsx`
- `components/ui/FormError.tsx`

**Phase 2 deliverable:** User can sign up, confirm email, log in, log out, and reset password. Supabase tables and RLS live. ✅

**Actual deviations from plan:**
- Migrations applied manually via Supabase dashboard (CLI not available)
- `012_share_token_access.sql` + `013_profile_trigger.sql` (not `012_rls_policies.sql`) — RLS is inline per table, not a separate file
- `trips` table uses `description` (not `destination`) and has no `travellers` column — travellers derived from `trip_members`
- `documents` table uses `file_name` (not `filename`), `uploaded_at` (not `created_at`), parse_status enum: `unparsed/parsing/parsed/failed`
- `useSearchParams()` in login page wrapped in `<Suspense>` boundary (Next.js 16 requirement)

---

## Phase 3 — Core API Endpoints ✅ COMPLETE

**Goal:** All server-side API routes built, role-guarded, and returning correct responses. No frontend wiring yet.

### 3.1 Claude proxy route

**Files created:**
- `app/api/claude/route.ts`
  - POST only; validates Supabase session before touching Claude
  - Reads `ANTHROPIC_API_KEY` from env
  - Accepts `{ agent, prompt, systemPrompt, maxTokens }` body
  - Logs every call to `ai_audit_log` (input tokens, output tokens, prompt hash)
  - Returns Claude response JSON; never exposes raw API key in response

### 3.2 Trip CRUD routes

**Files created:**
- `app/api/trips/route.ts` — GET (list user's trips) + POST (create trip; sets organiser role in `trip_members`)
- `app/api/trips/[tripId]/route.ts` — GET (trip details) + PATCH (update name/dates; organiser only) + DELETE (delete trip + cascade; organiser only)
- `app/api/trips/[tripId]/members/route.ts` — GET (list members)
- `app/api/trips/[tripId]/share/route.ts` — POST (regenerate share_token; organiser only)

### 3.3 Document vault routes

**Files created:**
- `app/api/trips/[tripId]/vault/route.ts` — GET (list documents) + POST (upload; organiser only; enforces 10MB + mime whitelist; sanitises filename; writes to Supabase Storage at `trips/{tripId}/{docId}/{filename}`; inserts into `documents` table)
- `app/api/trips/[tripId]/vault/[docId]/route.ts` — DELETE (remove from storage + DB; organiser only) + PUT (replace document; organiser only)

**Files created:**
- `lib/services/storageService.ts` — wraps Supabase Storage upload/delete/signed-URL; enforces size + mime type; path pattern enforced here

### 3.4 Parse route

**Files created:**
- `app/api/trips/[tripId]/parse/route.ts` — POST; organiser only; orchestrates parsing pipeline
- `lib/utils/pdf-extract.ts` — extracts raw text from PDF buffer using `pdf-parse`; returns plain string; if result is empty (scanned/image PDF), returns `null` so caller can surface manual entry fallback instead of sending empty context to Claude
- `lib/utils/rate-limit.ts` — checks `ai_audit_log` count for a given trip + agent within current UTC day; returns `{ allowed, remaining }`
- `lib/claude/parser-agent.ts` — constructs Document Parser Agent system prompt; calls `/api/claude`; validates JSON response against expected schema; retries once on bad JSON; returns structured output or throws
- `lib/services/parseService.ts` — full pipeline: fetch unparsed docs → extract text → if `pdf-extract` returns `null` (scanned PDF), mark document as `failed` with reason `"scanned_pdf"` and skip that doc (caller surfaces manual entry toast); otherwise call parser agent → write to `parsed_flights`, `parsed_accommodation`, `itinerary_days`, `itinerary_events`, `action_alerts`; skips `is_locked = true` records; updates `documents.parse_status`; if Claude returns bad JSON after one retry, sets status to `failed` and returns error for toast; calls alertService after successful write

### 3.5 Alert service

**Files created:**
- `lib/services/alertService.ts` — runs after every parse; queries `parsed_flights` + `parsed_accommodation` + `itinerary_events` to detect: missing accommodation for flight date ranges, date conflicts, traveller coverage gaps; writes new `action_alerts` records; marks previously detected resolved alerts as `is_resolved = true`

### 3.6 Itinerary routes

**Files created:**
- `app/api/trips/[tripId]/itinerary/route.ts` — GET (all days + events, ordered by date/sort_order)
- `app/api/trips/[tripId]/itinerary/events/route.ts` — POST (add event; organiser only)
- `app/api/trips/[tripId]/itinerary/events/[eventId]/route.ts` — PATCH (edit; organiser only) + DELETE (organiser only)

### 3.7 Flights routes

**Files created:**
- `app/api/trips/[tripId]/flights/route.ts` — GET (list) + POST (add manual flight; organiser only)
- `app/api/trips/[tripId]/flights/[id]/route.ts` — PATCH (edit; organiser only; sets `is_locked = true`, `confidence_score = 1.0`) + DELETE (organiser only)

### 3.8 Accommodation routes

**Files created:**
- `app/api/trips/[tripId]/accommodation/route.ts` — GET (list) + POST (add manual; organiser only)
- `app/api/trips/[tripId]/accommodation/[id]/route.ts` — PATCH (edit; organiser only; locks record) + DELETE (organiser only)

### 3.9 Chat routes

**Files created:**
- `app/api/trips/[tripId]/chat/route.ts` — GET (last 50 messages) + POST (send message; routes to chatbot agent)
- `lib/claude/chatbot-agent.ts` — constructs Chatbot Agent system prompt with full trip data + user role + last 10 messages; calls `/api/claude`; applies ANSWER vs UPDATE mode; returns response
- `lib/services/chatService.ts` — orchestrates: fetch context → determine mode → call chatbot agent → if UPDATE mode + organiser confirms → apply JSON update block to DB → save both messages to `chat_messages` → log to `ai_audit_log`

### 3.10 Share token validation route

**Files created:**
- `app/api/share/[shareToken]/route.ts` — GET; validates token against `trips.share_token`; returns `{ tripId }` or 404 (no distinction between wrong token and deleted trip)

**Phase 3 deliverable:** All API routes callable and role-guarded; parsing pipeline functional server-side. ✅

**Actual deviations from plan:**
- `callClaude.ts` is a shared server-side function (avoids circular HTTP self-calls); both services and the `/api/claude` proxy use it directly
- `getAuthUser()` returns `{ supabase, user }` — all routes destructure both
- `Database` types require `Relationships: []` on each table for Supabase JS v2 type inference
- `pdf-parse` uses `require()` (CJS) not dynamic `import().default` — ESM build lacks `.default`
- `itinerary_events` has `source_entity_id` (not `related_flight_id`/`related_accommodation_id`)
- `/api/claude` proxy route present but services call `callClaude` directly (no circular HTTP)

---

## Phase 4 — Frontend Shell ✅ COMPLETE

**Goal:** App layout, sidebar, navigation, and routing skeleton working end-to-end with real auth.

### 4.1 App shell layout

**Files created:**
- `app/(app)/layout.tsx` — three-column shell: fixed left sidebar (260px), fluid main content area, optional right contextual panel (280px, xl+ only); reads user session + trip list server-side
- `components/ui/Sidebar.tsx` — dark sidebar (`#1A1714`); Golazo logo; trip list with thumbnails and countdown badges; per-trip nav links (Dashboard, Documents, Itinerary, Flights, Accommodation, AI Chat, Settings); user avatar + name + logout at bottom
- `components/ui/SidebarNavItem.tsx` — nav item with active state (3px orange left border), hover fill, Lucide icon, label
- `components/trip/TripListItem.tsx` — trip thumbnail (32×32), name, countdown badge (orange pill, days remaining)
- `components/ui/CountdownBadge.tsx` — computes days remaining from trip start date; orange pill or "Today" / "In progress" states
- `components/ui/Avatar.tsx` — circular avatar; initials fallback; `--radius-full`
- `components/ui/AvatarStack.tsx` — overlapping avatar stack; +N overflow pill

### 4.2 Trip list page

**Files created:**
- `app/(app)/trips/page.tsx` — server component; fetches user's trips; renders `TripCard` grid or empty state with "Create your first trip" CTA

**Files created:**
- `components/trip/TripCard.tsx` — card with trip name, dates, destination, countdown; hover state; links to `/trips/[tripId]/dashboard`
- `components/trip/EmptyTripsState.tsx` — illustration + CTA

### 4.3 Create trip page

**Files created:**
- `app/(app)/trips/new/page.tsx` — form: Trip Name (required), Destination(s) (optional), Start Date, End Date; POST to `/api/trips`; on success redirects to `/trips/[tripId]/dashboard`
- `components/trip/TripForm.tsx` — reusable form component (used for create + edit)

### 4.4 Right contextual panel

**Files created:**
- `components/ui/RightPanel.tsx` — collapsible right panel; used for contextual info (alerts, member list, doc preview); hidden below xl breakpoint; slide-in animation on mobile

### 4.5 Toast notification system

**Files created:**
- `components/ui/Toast.tsx` — slide-in from bottom-right; variants: success, warning, error, info; auto-dismiss after 4s
- `lib/utils/toast.ts` — lightweight imperative toast trigger (no external library)

### 4.6 Modal system

**Files created:**
- `components/ui/Modal.tsx` — scale + fade animation; backdrop blur; focus trap; Escape to close; used for confirm dialogs throughout

### 4.7 Loading and skeleton states

**Files created:**
- `components/ui/Skeleton.tsx` — shimmer skeleton block; configurable width/height; used as loading placeholder across all pages
- `components/ui/Spinner.tsx` — small inline spinner for button loading states

**Phase 4 deliverable:** App shell renders with live sidebar; trip list loads; navigation routes correctly; auth guard active. ✅

**Actual deviations from plan:**
- `currentTripId` derived client-side in Sidebar via `usePathname()` regex match — no server-side header needed
- `userId` passed from layout to Sidebar; role derived from `trip.organiser_id === userId` (avoids extra membership query in layout)
- CSS animation keyframes (`shimmer`, `modal-in`, `toast-in`, `slide-in-right`, `progress-indeterminate`) added to `globals.css`
- `lib/utils/toast.ts` uses a pub-sub store (no external lib)

---

## Phase 5 — Feature Pages ✅ COMPLETE

**Goal:** All screens from `app-flow.md` section 5 built, data-connected, and role-aware.

### 5.1 Overview Dashboard (`/trips/[tripId]/dashboard`)

**Screens covered:** `app-flow.md` §5.1

**Files created:**
- `app/(app)/trips/[tripId]/dashboard/page.tsx` — server component; fetches trip, stats, alerts, members; renders dashboard
- `components/trip/DashboardHero.tsx` — trip name, cover image placeholder, destination flags, countdown hero (large number + "days to go" label in orange card)
- `components/trip/TripStats.tsx` — three stat pills: destinations, nights, travellers
- `components/trip/MemberAvatarStack.tsx` — avatar stack with member count; click opens right panel with member list
- `components/trip/ActionAlertList.tsx` — list of `ActionAlertCard` components; empty state if no alerts
- `components/trip/ActionAlertCard.tsx` — amber left-border card; alert title, description, suggested fix; click navigates to relevant section with item highlighted
- `components/trip/ParseCTA.tsx` — shown when unparsed documents exist; primary button triggers parse

**States handled:**
- Empty (no docs): onboarding CTA
- Parsed, no alerts: clean summary
- Parsed, alerts present: alert cards

### 5.2 Document Vault (`/trips/[tripId]/vault`)

**Screens covered:** `app-flow.md` §5.2

**Files created:**
- `app/(app)/trips/[tripId]/vault/page.tsx` — server component; fetches document list; renders vault
- `components/vault/VaultPage.tsx` — client component wrapper (needs upload interactivity)
- `components/vault/UploadZone.tsx` — drag-and-drop zone + file picker; validates file type (PDF/text) + size (≤10MB) client-side before sending; shows drag-over state; calls upload API
- `components/vault/DocumentList.tsx` — list of `DocumentRow` components; empty state
- `components/vault/DocumentRow.tsx` — file name, size (formatted), upload date, `ParseStatusBadge`; delete icon (with confirm modal); replace icon
- `components/vault/ParseStatusBadge.tsx` — colour-coded pill: Unparsed (neutral), Parsing (animated), Parsed (green), Failed (red)
- `components/vault/ParseAllButton.tsx` — primary button; disabled when no unparsed docs; triggers parse pipeline; shows loading overlay

**Error states handled:** file too large, unsupported format, parse failure

### 5.3 AI Parsing Flow

**Files created/modified:**
- `components/vault/ParseProgressOverlay.tsx` — full-page loading overlay: "Claude is reading your documents…"; animated; shown during parsing; dismisses on completion with success toast
- Toast triggered: "Documents parsed. Review your itinerary." → navigates to Dashboard

**Confidence flag handling:**
- `components/ui/ConfidenceFlag.tsx` — `⚠️` icon with tooltip "Claude is not confident about this field. Please review."

### 5.4 Day-by-Day Itinerary (`/trips/[tripId]/itinerary`)

**Screens covered:** `app-flow.md` §5.4

**Files created:**
- `app/(app)/trips/[tripId]/itinerary/page.tsx` — server component; fetches itinerary days + events
- `components/itinerary/ItineraryPage.tsx` — client wrapper; renders day list; handles add/edit/delete mutations
- `components/itinerary/DaySection.tsx` — day header (formatted date + optional label); event list; "+ Add event" prompt (organiser only)
- `components/itinerary/EventCard.tsx` — time, title, location, description; `ConfidenceFlag` if `confidence_score < 0.7`; edit + delete icons (organiser only); hover state
- `components/itinerary/EventForm.tsx` — inline expanding form: time picker, title, location, description; Save / Cancel; used for both add and edit
- `components/itinerary/EmptyDayState.tsx` — "+ Add event" prompt shown on empty days (organiser only); "No events" text (member)

**Role handling:** edit controls hidden entirely for members (not just disabled)

### 5.5 Flights Table (`/trips/[tripId]/flights`)

**Screens covered:** `app-flow.md` §5.5

**Files created:**
- `app/(app)/trips/[tripId]/flights/page.tsx` — server component; fetches flights
- `components/flights/FlightsPage.tsx` — client wrapper; handles inline edit mutations
- `components/flights/FlightsTable.tsx` — responsive data table; columns: Airline, From, To, Dep. Date, Dep. Time, Arr. Time, Flight No., Confirmation No., Travellers; row actions (delete, organiser only)
- `components/flights/FlightCell.tsx` — displays value or `ConfidenceFlag`; on click (organiser only) becomes `EditableCell`
- `components/flights/EditableCell.tsx` — text input inline; auto-saves on blur or Enter; Tab moves to next cell; sets `is_locked = true` on save
- `components/flights/AddFlightRow.tsx` — "+ Add Flight" button appends empty row in edit mode

### 5.6 Accommodation Table (`/trips/[tripId]/accommodation`)

**Screens covered:** `app-flow.md` §5.6

**Files created:**
- `app/(app)/trips/[tripId]/accommodation/page.tsx`
- `components/accommodation/AccommodationPage.tsx`
- `components/accommodation/AccommodationTable.tsx` — columns: Property Name, Location, Check-In, Check-Out, Nights (computed), Confirmation No., Travellers
- `components/accommodation/AccommodationCell.tsx` — same `EditableCell` pattern as flights
- `components/accommodation/AddAccommodationRow.tsx`

### 5.7 AI Chat (`/trips/[tripId]/chat`)

**Screens covered:** `app-flow.md` §5.7

**Files created:**
- `app/(app)/trips/[tripId]/chat/page.tsx` — server component; fetches chat history; determines user role
- `components/chat/ChatPage.tsx` — client component; full chat UI
- `components/chat/ChatMessage.tsx` — user vs assistant bubbles; timestamps; role badge on assistant messages
- `components/chat/ChatInput.tsx` — text area; Send button; Enter to send (Shift+Enter for newline); disabled when rate limit hit; max 2000 chars enforced
- `components/chat/RateLimitBanner.tsx` — shown when 100 messages/day limit hit: "You've reached the daily chat limit. Resets at midnight UTC."
- `components/chat/TypingIndicator.tsx` — three-dot animated indicator while awaiting Claude response
- `components/chat/RoleBadge.tsx` — "Organiser" or "Group Member" badge shown in chat header

**UPDATE mode flow (organiser only):**
- Bot proposes change in natural language → organiser confirms via button → server applies JSON update block → success toast

### 5.8 Trip Settings (`/trips/[tripId]/settings`)

**Screens covered:** `app-flow.md` §5.8

**Files created:**
- `app/(app)/trips/[tripId]/settings/page.tsx` — server component; validates organiser role (redirect non-organisers to dashboard); renders settings
- `components/trip/SettingsPage.tsx` — client wrapper
- `components/trip/TripDetailsForm.tsx` — editable trip name + start/end dates; Save button; PATCH to `/api/trips/[tripId]`
- `components/trip/MemberManagement.tsx` — list of current members with role badges; "Copy Shared Link" button (copies `/share/[tripId]?token=[share_token]` to clipboard + toast); no email invite in V1 (deferred to V2); remove member button (placeholder for V2)
- `components/trip/ShareLinkSection.tsx` — displays share link; copy button; "Regenerate link" button (invalidates old token)
- `components/trip/DangerZone.tsx` — "Delete Trip" button; confirm modal ("Are you sure? This cannot be undone."); DELETE to `/api/trips/[tripId]`; on success redirect to `/trips`

### 5.9 Shared Trip View (`/share/[tripId]`)

**Screens covered:** `app-flow.md` §5.9

**Files created:**
- `app/share/[tripId]/page.tsx` — server component; validates `share_token` query param via `/api/share/[shareToken]`; 404 if invalid; fetches trip data in read-only mode; renders shared view
- `components/trip/SharedTripHeader.tsx` — simplified top bar: Golazo logo, trip name, "Sign up to plan your own trip" CTA; no sidebar
- `components/trip/SharedDashboard.tsx` — read-only dashboard: trip stats, itinerary preview, flights, accommodation; no alerts, no vault, no settings
- Reuses read-only variants of `ItineraryPage`, `FlightsTable`, `AccommodationTable` (member-mode rendering)
- Chatbot available in ANSWER-only mode (role forced to "member" server-side regardless of any session)

**Phase 5 deliverable:** All screens functional; organiser and member flows working end-to-end. ✅

**Actual deviations from plan:**
- `FlightsTable` and `AccommodationTable` are standalone client components (no separate `FlightsPage.tsx` wrapper needed — pattern simplified)
- `EditableCell` in `components/flights/EditableCell.tsx` reused by `AccommodationTable` (shared across both features)
- Settings page uses `TripForm mode="edit"` directly (no separate `TripDetailsForm.tsx`)
- Shared trip view (`/share/[tripId]`) validates token inline via Supabase query (no separate API call)
- `MemberManagement` is a server-compatible display component (no remove-member action in V1, as per spec)
- Chat page height is `h-full` with overflow-hidden to enable fixed-bottom input; parent layout sets `overflow-y-auto`

---

## Phase 6 — Polish

**Goal:** Production-grade error handling, loading states, responsive design, accessibility pass, and security header audit.

### 6.1 Error states and edge cases

**Files created/modified (implementing all scenarios from `app-flow.md` §6):**
- `app/(app)/trips/[tripId]/not-found.tsx` — "Trip not found" page (used when trip doesn't exist or user doesn't have access)
- `app/(app)/trips/[tripId]/error.tsx` — generic error boundary for trip pages
- `app/share/[tripId]/not-found.tsx` — "Trip not found" for invalid share tokens
- `components/ui/ErrorState.tsx` — reusable inline error state component (icon + message + optional CTA)
- `components/ui/EmptyState.tsx` — reusable empty state (illustration + heading + body + CTA slot)

**Empty states to implement:**
- No trips: `components/trip/EmptyTripsState.tsx` (already planned in §4.2)
- No vault documents: `components/vault/EmptyVaultState.tsx`
- No itinerary events: `components/itinerary/EmptyItineraryState.tsx`
- No flights: `components/flights/EmptyFlightsState.tsx`
- No accommodation: `components/accommodation/EmptyAccommodationState.tsx`
- Vault docs deleted after parsing: warning banner in vault

### 6.2 Loading states

- All data-fetching pages use `loading.tsx` co-located with `page.tsx` (Next.js App Router streaming)
- **Files created:**
  - `app/(app)/trips/loading.tsx`
  - `app/(app)/trips/[tripId]/dashboard/loading.tsx`
  - `app/(app)/trips/[tripId]/vault/loading.tsx`
  - `app/(app)/trips/[tripId]/itinerary/loading.tsx`
  - `app/(app)/trips/[tripId]/flights/loading.tsx`
  - `app/(app)/trips/[tripId]/accommodation/loading.tsx`
  - `app/(app)/trips/[tripId]/chat/loading.tsx`
  - `app/(app)/trips/[tripId]/settings/loading.tsx`
- Each loading file renders relevant `Skeleton` components in the same grid layout as the loaded page

### 6.3 Responsive design

**Files modified:**
- All layout components audited against breakpoints in `design.md` §3 and §7:
  - `xs` (< 480px): sidebar hidden, single column, tables scroll horizontally
  - `sm` (480–767px): sidebar drawer mode
  - `md` (768–1023px): icon-only sidebar (64px)
  - `lg` (1024–1279px): full sidebar, no right panel
  - `xl` (≥1280px): full sidebar + right panel

**Files created:**
- `components/ui/MobileMenuTrigger.tsx` — hamburger icon to open sidebar drawer on mobile
- `components/ui/SidebarDrawer.tsx` — full-width overlay drawer for mobile sidebar

### 6.4 Accessibility pass

**Checks applied to all components:**
- All interactive elements reachable via keyboard Tab order
- Focus rings using `--shadow-focus` (orange)
- ARIA labels on icon-only buttons
- `aria-live` regions for toast notifications and chat messages
- `prefers-reduced-motion` respected: all animation durations halved (via CSS media query in `globals.css`)
- Colour contrast: all text/background combinations meet WCAG 2.1 AA (4.5:1 minimum)

### 6.5 Form validation

**Files modified:**
- All forms validate client-side before submit; server-side validation in API routes
- Trip form: name required, end date must be after start date
- Event form: title required, time format validated
- File upload: type + size checked before API call
- Chat input: max 2000 chars, empty message blocked
- Auth forms: min 8 chars + at least one uppercase letter + at least one number; error message: "Password must be at least 8 characters and include one uppercase letter and one number."

### 6.6 Input sanitisation and security hardening

**Files modified:**
- `lib/services/storageService.ts` — filename sanitisation (strip `../`, `/`; normalise to alphanumeric + extension)
- All API routes — UUID validation on `tripId`, `docId`, `eventId`, `id` params (regex check; 400 on invalid)
- `app/api/claude/route.ts` — enforces server-side rate limits before calling Claude
- Chat input — control characters stripped before sending to Claude

**Phase 6 deliverable:** All error/empty/loading states present; responsive across 375px–1440px; accessible; security hardened.

---

## Phase 7 — Testing and Deployment

**Goal:** Pre-launch security checklist complete; app deployed to Vercel production.

### 7.1 Security audit (per `security-checklist.md` §12)

Checklist to work through before deploying:
- [ ] All RLS policies tested with organiser session AND member session AND share token (unauthenticated)
- [ ] `.env.local` confirmed not committed; `.gitignore` verified
- [ ] `npm audit` run; zero critical vulnerabilities
- [ ] API security headers verified in response inspector
- [ ] Supabase Storage bucket confirmed private (not public)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` absent from all client-side code and `NEXT_PUBLIC_` vars
- [ ] `ANTHROPIC_API_KEY` absent from all client-side code
- [ ] Rate limits tested: parser blocks at 21st call/trip/day; chat blocks at 101st message/trip/day
- [ ] File upload: 10MB limit enforced; `.exe`, `.js` rejected; oversized file rejected
- [ ] Share token: old token invalidated after "Regenerate link"; old URL returns 404
- [ ] 403 returned when member accesses organiser-only routes directly
- [ ] Claude parser tested with adversarial content (prompt injection attempt in PDF body)

**Files created:**
- `docs/security-test-results.md` — manual test log (pass/fail per checklist item)

### 7.2 Performance checks

- Pages load < 2s on desktop broadband (Vercel network)
- Parse pipeline completes < 30s for 3-document batch
- `next build` output reviewed; no unacceptable bundle sizes

### 7.3 Vercel deployment

**Steps:**
1. Connect GitHub repo to Vercel project
2. Set all five environment variables in Vercel dashboard
3. Deploy main branch
4. Run smoke tests against production URL

**Smoke test flows:**
1. Sign up → confirm email → log in
2. Create trip
3. Upload PDF to vault
4. Parse documents → verify itinerary populates
5. Edit a flight inline
6. Open AI Chat → ask a question → receive answer
7. Open Trip Settings → copy shared link → open in incognito → verify read-only view
8. Delete trip → confirm all data removed

**Files created:**
- `vercel.json` — if any custom routing or function config needed

**Phase 7 deliverable:** V1 live at production Vercel URL; all smoke tests passing; security checklist signed off.

---

## File Count Summary

| Phase | New Files | Modified Files |
|---|---|---|
| 1 — Project Setup | ~15 | ~5 |
| 2 — Database + Auth | ~20 | ~2 |
| 3 — API Endpoints | ~20 | ~0 |
| 4 — Frontend Shell | ~18 | ~2 |
| 5 — Feature Pages | ~45 | ~5 |
| 6 — Polish | ~20 | ~15 |
| 7 — Testing + Deploy | ~3 | ~1 |
| **Total** | **~141** | **~30** |

---

## Resolved Decisions

All open questions answered on 2026-05-06:

| # | Decision | Impact |
|---|---|---|
| 1 | **Scanned PDF handling** — Accept any PDF. `pdf-parse` attempted first. If empty string returned (scanned/image PDF), surface manual entry fallback: toast "This document couldn't be read automatically. Please enter the details manually." with a CTA to the relevant add-record form. | `lib/utils/pdf-extract.ts`, `lib/services/parseService.ts`, vault error state |
| 2 | **Parsing failure UX** — Option A: generic error toast + manual entry CTA. Toast: "Parsing failed. Please check your documents or enter details manually." Document badge set to Failed. No dedicated failure page. | `components/vault/ParseStatusBadge.tsx`, `components/vault/ParseProgressOverlay.tsx` |
| 3 | **Trip deletion** — Soft delete. `trips` table gets a `deleted_at TIMESTAMPTZ` column. DELETE route sets `deleted_at = now()` instead of hard-deleting. All queries filter `WHERE deleted_at IS NULL`. Supabase Storage files and related records remain until a future cleanup job (V2). | Phase 2 schema, Phase 3 DELETE route |
| 4 | **Password policy** — Min 8 characters + at least one uppercase letter + at least one number. Validated client-side and enforced at Supabase Auth level. Error message: "Password must be at least 8 characters and include one uppercase letter and one number." | Auth pages, `components/ui/FormError.tsx` |
| 5 | **Invitation flow** — Shared link only for V1 (SHOULD). No email invite in V1. Group members access via the shared link the organiser copies from Settings. Email invite deferred to V2. | Trip Settings screen, `components/trip/MemberManagement.tsx` |

### Schema impact from decision 3 (soft delete)

**`supabase/migrations/002_trips.sql`** — add column:
```sql
deleted_at TIMESTAMPTZ DEFAULT NULL
```

**`supabase/migrations/012_rls_policies.sql`** — all `trips` SELECT policies add:
```sql
AND deleted_at IS NULL
```

**`app/api/trips/[tripId]/route.ts`** — DELETE handler changes from `DELETE FROM trips` to:
```sql
UPDATE trips SET deleted_at = now() WHERE id = $1 AND organiser_id = auth.uid()
```

**`app/(app)/trips/page.tsx`** — trip list query adds `WHERE deleted_at IS NULL`.

---

*plan.md — Golazo V1 | Generated: 2026-05-06 | Decisions resolved: 2026-05-06 | Last updated: 2026-05-07 | Phase 4+5 completed: 2026-05-07*

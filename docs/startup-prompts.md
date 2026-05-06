# Golazo — Startup Prompts

Ready-to-paste session starters for Claude Code. One prompt per sprint. Paste into a new Claude Code session at the start of each sprint.

---

## How to use these

1. Open VS Code in the `/golazo/app/` directory
2. Start a new Claude Code session
3. Paste the prompt for the current sprint
4. Claude Code will read `CLAUDE.md` first, then proceed with the session scope

**Rule:** One sprint = one session focus. Don't mix sprint scopes in a single session.

---

## Sprint 0 — Project scaffold

```
Read CLAUDE.md first.

Set up the Golazo project scaffold:

1. Initialise a Next.js 14 project with App Router, TypeScript, and Tailwind CSS
2. Install and configure Supabase client (@supabase/supabase-js and @supabase/ssr)
3. Set up the folder structure from CLAUDE.md — app/, components/, lib/, types/
4. Create lib/supabase/client.ts (browser client) and lib/supabase/server.ts (server client with service role)
5. Create a middleware.ts session guard that protects all /trips/* routes
6. Set up .env.local with the five environment variables listed in CLAUDE.md (empty values for now)
7. Create a basic layout.tsx for the (app) route group with a placeholder sidebar
8. Confirm the dev server runs clean with no errors

Present the plan before writing any code. Wait for my approval.
```

---

## Sprint 1 — Auth + multi-trip shell + vault upload

```
Read CLAUDE.md first. Then read app-flow.md sections 2 and 3 (authentication flow and onboarding).

Build Sprint 1:

1. Auth pages — /login, /signup, /reset-password using Supabase Auth
   - Email + password sign up with confirmation
   - Login → session → redirect to /trips
   - Logout clears session
   - Password reset via email link
   - Session guard in middleware redirects unauthenticated users to /login

2. Profiles table — create in Supabase with the schema from backend-spec.md section 2.2
   - Auto-create profile row on user sign up via Supabase trigger

3. Multi-trip shell
   - /trips page — list of user's trips (empty state with 'Create trip' CTA)
   - /trips/new — create trip form (name, start date, end date)
   - /trips/[tripId]/dashboard — placeholder page (we'll fill this in Sprint 3)
   - Left sidebar with trip list, countdown badges, and nav links
   - Supabase RLS on trips and trip_members tables (schemas from backend-spec.md sections 2.3 and 2.4)

4. Document vault — /trips/[tripId]/vault
   - Upload zone (drag and drop + file picker)
   - Accepts PDF and plain text files only; max 10MB enforced
   - Files upload to Supabase Storage (bucket: 'documents', path pattern: trips/{tripId}/{docId}/{filename})
   - Vault list shows: file name, size, upload date, parse status badge (Unparsed)
   - Delete document (with confirm dialog)
   - Documents table schema from backend-spec.md section 2.5

Use design tokens from design.md for all UI — colours, spacing, typography, component specs.

Present the plan first. Wait for my approval before writing any code.
```

---

## Sprint 2 — Claude parsing pipeline + itinerary auto-generation

```
Read CLAUDE.md first. Then read backend-spec.md sections 2.5–2.9 (data models) and the AI agent specs in CLAUDE.md.

Build Sprint 2:

1. PDF text extraction
   - Install pdf-parse
   - Create lib/utils/pdf-extract.ts — extracts raw text from a PDF buffer

2. /api/claude proxy route
   - Server-side only; validates Supabase session before forwarding to Claude API
   - Reads ANTHROPIC_API_KEY from env — never exposes it
   - Logs all calls to ai_audit_log table

3. Document Parser Agent — lib/claude/parser-agent.ts
   - Prompt: Document Parser Agent spec from CLAUDE.md
   - Input: extracted PDF text + trip context + traveller names
   - Output: structured JSON (flights, accommodation, events, alerts)
   - confidence_score < 0.7 → flagged
   - Bad JSON → retry once
   - Rate limit check: 20 calls/trip/day via ai_audit_log

4. /api/trips/[tripId]/parse route
   - Organiser only
   - Fetches all 'unparsed' documents for the trip
   - Extracts text from each, sends to parser agent
   - Writes results to: parsed_flights, parsed_accommodation, itinerary_days, itinerary_events, action_alerts
   - Never overwrites records where is_locked = true
   - Updates document parse_status to 'parsed' or 'failed'

5. Itinerary view — /trips/[tripId]/itinerary
   - Day-by-day view, auto-generated from itinerary_days + itinerary_events
   - Organiser: add, edit, delete events inline
   - Group member: read-only
   - Confidence flag icon on events with score < 0.7

6. Flights table — /trips/[tripId]/flights
   - Auto-populated from parsed_flights
   - Organiser: inline cell editing (click to edit, tab to move, auto-save)
   - Add flight row, delete flight row
   - Confidence flags inline

7. Accommodation table — /trips/[tripId]/accommodation
   - Same pattern as flights table
   - Auto-populated from parsed_accommodation

Create all Supabase tables (parsed_flights, parsed_accommodation, itinerary_days, itinerary_events, action_alerts, ai_audit_log) with schemas from backend-spec.md and RLS policies from section 6.

Present the plan first. Wait for my approval before writing any code.
```

---

## Sprint 3 — Dashboard + alerts + chatbot

```
Read CLAUDE.md first. Then read app-flow.md section 5.1 (dashboard) and the chatbot agent spec in CLAUDE.md.

Build Sprint 3:

1. Overview dashboard — /trips/[tripId]/dashboard
   - Countdown badge (days to departure, accurate to the day)
   - Trip stats: # destinations, # nights, # travellers
   - Group member avatar stack
   - Action alerts list — flagged items from action_alerts table
   - Each alert links to the relevant section with the flagged item highlighted
   - 'Parse Documents' CTA shown if unparsed docs exist

2. Alert service — lib/services/alertService.ts
   - Runs after every parse
   - Detects: missing accommodation for date ranges covered by flights, date conflicts, traveller coverage gaps
   - Writes new action_alerts records; marks resolved alerts as is_resolved = true

3. AI Chatbot — /trips/[tripId]/chat
   - Chat interface: message history + input field + role badge
   - Trip Chatbot Agent: lib/claude/chatbot-agent.ts
     - Input: full trip data + last 10 chat turns + user role + current date
     - ANSWER mode: any user; answers from trip data only; no hallucination
     - UPDATE mode: organiser only; confirm intent → apply JSON update block server-side
     - Group member edit attempts: politely declined
     - Rate limit: 100 messages/trip/day
   - /api/trips/[tripId]/chat GET (history) and POST (send message)
   - chat_messages table with schema from backend-spec.md section 2.11

4. Shared trip link
   - /trips/[tripId]/settings — organiser only
     - Edit trip name and dates
     - Copy shared link button (uses share_token from trips table)
     - Delete trip (confirm dialog; cascades all data)
   - /share/[tripId] — public read-only view
     - Validates share_token → loads trip in read-only mode
     - No sidebar; simplified top bar
     - Chatbot available in ANSWER-only mode

Present the plan first. Wait for my approval before writing any code.
```

---

## Sprint 4 — Polish + V1 launch

```
Read CLAUDE.md first. Then read security-checklist.md section 12 (pre-launch checklist).

Sprint 4 is the V1 polish and launch sprint. Work through these in order:

1. Pre-launch security pass
   - Run through every item in security-checklist.md section 12
   - Test all routes with organiser session AND member session
   - Confirm SUPABASE_SERVICE_ROLE_KEY and ANTHROPIC_API_KEY are not in any NEXT_PUBLIC_ variable
   - Test file upload: 10MB limit, mime type rejection, file name sanitisation
   - Test share token: confirm old token invalidated after regeneration
   - Run npm audit — resolve any critical vulnerabilities

2. Error states and edge cases
   - Implement all edge cases from app-flow.md section 6
   - Empty states for: no trips, no vault docs, no itinerary events, no flights, no accommodation
   - Loading states for: parsing pipeline, chat response, page loads
   - Toast notifications for: successful save, parse complete, copy link, delete confirm

3. UI polish pass
   - Audit all screens against design tokens in design.md
   - Confirm consistent spacing, typography, and colour usage throughout
   - Check all tables render correctly at 375px viewport (min supported width)
   - Confidence flag icons rendering correctly on all flagged fields

4. Performance check
   - Pages load under 2s on desktop broadband
   - Parsing response under 30s for a 3-document batch

5. Vercel deploy
   - Confirm all env vars are set in Vercel dashboard
   - Deploy to production
   - Smoke test all critical flows: sign up, upload, parse, itinerary view, chatbot, shared link

Present a checklist-style plan first. Work through it one section at a time. Wait for my approval on each section before proceeding.
```

---

## Sprints 5–6 — V2 features (target: 1 June 2026)

```
Read CLAUDE.md first.

V2 sprint — confirm which V2 features to build before starting. V2 scope from the PRD:
- Google Drive OAuth connector
- Mobile-optimised layout (full redesign from 375px up)
- Budget tracker (per-trip spend tracking, per-person split)
- Smart suggestions (things to do, local events, real-time alerts during trip)

Tell me which V2 feature you want to tackle first and I'll scope the session accordingly.
```

---

## Hotfix / change brief template

```
Read CLAUDE.md first.

This is a targeted change session. The change is:

[Describe the change in 1–2 sentences]

Affected files/areas:
[List the files or sections you expect to touch]

Do not touch anything outside the scope of this change. Present the diff before implementing.
Wait for my approval before writing any code.
```

---

*Golazo | Generated: 2026-05-06 | CEREBRO Build OS — Phase 2 output*

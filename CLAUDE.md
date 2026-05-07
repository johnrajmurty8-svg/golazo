# CLAUDE.md — Golazo

> This file is the master instruction set for every Claude Code session on this project.
> Read this first. It overrides any general assumptions or default behaviours.

---

## What we're building

**Golazo** is an AI-powered group trip coordination platform. It turns uploaded booking documents (PDFs, email confirmations) into a living, structured itinerary — automatically parsing flights, accommodation, and events using the Claude API, then surfacing gaps and conflicts before they become problems.

**One-liner:** Upload your booking docs → Golazo builds your trip plan.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth (email/password) |
| File Storage | Supabase Storage |
| AI | Anthropic Claude API — `claude-sonnet-4-20250514` |
| Hosting | Vercel (free tier) |

**Critical rule:** The Claude API is **always** called through `/api/claude` — a server-side proxy route. The `ANTHROPIC_API_KEY` must **never** appear in client-side code or any `NEXT_PUBLIC_` variable.

---

## Project knowledge files

Before writing any code, check which of these are in Project Knowledge and read the relevant one:

| File | What it covers | Read before... |
|---|---|---|
| `prd.md` | Requirements, personas, MoSCoW priorities, FR-001–FR-042 | Any feature work |
| `app-flow.md` | Route map, auth flows, screen-by-screen interactions, edge cases | Any frontend or navigation work |
| `design.md` | Design tokens (colours, type, spacing), component specs, motion | Any UI/component work |
| `backend-spec.md` | Data models, API endpoints, services, RLS policies, env vars, folder structure | Any backend, DB, or API work |
| `security-checklist.md` | Auth, RBAC, OWASP coverage, AI-specific security, pre-launch checklist | Any auth, file upload, or AI pipeline work |

---

## Roles & permissions — always enforce

| Role | Can do |
|---|---|
| **Organiser** | Full CRUD on all trip data, vault, parse, settings, share link |
| **Member** | Read-only on all trip data; can send chat messages (Q&A only) |
| **Public (share link)** | Read-only trip view via `share_token`; no vault, no settings |

**Every API route must validate the caller's role before executing.** No exceptions. RLS is the enforcement layer in Supabase — all tables have RLS enabled.

---

## AI agents — how they work

### Agent 1 — Document Parser
- **Trigger:** Organiser clicks "Parse Documents"
- **Route:** `/api/parse` → `/api/claude`
- **Model:** `claude-sonnet-4-20250514`
- **Max tokens:** 1000
- **Output:** Structured JSON only — no preamble, no markdown
- **Rules:**
  - Null unknown fields — never guess
  - `confidence_score < 0.7` → flag for organiser review
  - Conflicting data across docs → raise as `date_conflict` alert
  - Bad JSON → retry once, then prompt manual entry
  - Rate limit: 20 calls/trip/day

### Agent 2 — Trip Chatbot
- **Trigger:** User types in AI Chat tab
- **Route:** `/api/trips/[tripId]/chat` → `/api/claude`
- **Model:** `claude-sonnet-4-20250514`
- **Max tokens:** 500
- **Output:** Natural language (all users) | JSON update block (organiser-confirmed edits only)
- **Rules:**
  - ANSWER mode: any user; answer strictly from trip data; no hallucination
  - UPDATE mode: organiser only; confirm before executing; return structured JSON update block server-side
  - Group members requesting edits → politely declined
  - Rate limit: 100 messages/trip/day

### Shared AI rules
- All AI inputs and outputs logged to `ai_audit_log` table
- Re-parse must never overwrite records where `is_locked = true` (confidence = 1.0)
- API key never on client — always `/api/claude` proxy

---

## Key data relationships

```
trips
  └── trip_members (organiser + members)
  └── documents (vault — raw uploads)
  └── parsed_flights (extracted from docs)
  └── parsed_accommodation (extracted from docs)
  └── itinerary_days
        └── itinerary_events (linked to parsed entities)
  └── action_alerts (gap detection results)
  └── chat_messages
  └── ai_audit_log
```

`confidence_score` is on every parsed record:
- `1.0` = manually entered or confirmed → `is_locked = true` → never overwritten by re-parse
- `0.7–0.99` = parsed, acceptable confidence
- `< 0.7` = flag for organiser review

---

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL       ← client + server
NEXT_PUBLIC_SUPABASE_ANON_KEY  ← client + server
SUPABASE_SERVICE_ROLE_KEY      ← server only — never NEXT_PUBLIC_
ANTHROPIC_API_KEY              ← server only — never NEXT_PUBLIC_
NEXT_PUBLIC_APP_URL            ← client + server
```

---

## Folder structure (reference)

```
golazo/
├── app/
│   ├── (auth)/login, signup, reset-password
│   ├── (app)/trips/[tripId]/ — dashboard, vault, itinerary, flights, accommodation, chat, settings
│   ├── share/[tripId]/       — public read-only view
│   └── api/                  — claude, trips, vault, parse, itinerary, flights, accommodation, chat, share
├── components/               — ui/, trip/, vault/, itinerary/, flights/, accommodation/, chat/
├── lib/
│   ├── supabase/client.ts + server.ts
│   ├── claude/parser-agent.ts + chatbot-agent.ts
│   ├── services/parseService, chatService, alertService, storageService
│   └── utils/pdf-extract, rate-limit
├── middleware.ts              — session guard for all /trips/* routes
└── types/database.ts          — generated Supabase types
```

---

## How to work in this project

**Planning first, code second.** When I ask you to plan something, present the approach and wait for approval before writing code.

**Check the spec before inventing.** The data models, API routes, and RLS policies are already defined in `backend-spec.md`. Use them — don't create alternatives unless I ask you to.

**One feature at a time.** When I say "let's build the vault" — scope the work, confirm it, then build only the vault.

**Test both roles.** Any auth or permission work must be tested with an organiser session AND a member session before it's considered done.

**Change briefs for scope changes.** If I ask for something that changes the architecture, data model, or security model, flag it before building. That's a change brief, not a quick edit.

---

## V1 launch target

**15 May 2026.** Nine sprints from kickoff. Scope discipline is critical — SHOULD items get deferred if time runs short. MUST items are non-negotiable.

---

## Open questions (resolve before building)

1. **Scanned PDF handling** — OCR stack not specified. Decide: Tesseract, manual entry fallback, or text-PDF-only restriction.
2. **Parsing failure UX** — What does the organiser see if Claude returns bad JSON after retry? Define the fallback screen.
3. **Trip deletion data retention** — Immediate purge from Supabase Storage, or soft delete?
4. **Password policy** — Min character count and complexity rules not yet defined.
5. **Invitation flow** — Email invite is COULD; shared link is SHOULD. Confirm V1 scope.

---

*Last updated: 2026-05-06 | CEREBRO Build OS — Phase 2 output*

---

## Design Context

### Users

**Primary — The Organiser (35–45, non-technical).** Planning a multi-city group trip. In task-completion mode — laptop, desk, slightly burdened by coordination overhead. They open Golazo because they want the situation handled. Needs clarity fast, not entertainment.

**Secondary — Group Members.** Casually checking flight times, check-in dates, the daily schedule. No editing. Mobile and desktop both plausible.

**Emotional goal:** Calm confidence. The interface should make the organiser feel like a brilliant PA has already done the work.

### Brand Personality

**Three words: warm, considered, unhurried.**

- **Warm** — human and personable; country flags, destination photos, avatar stacks. Group trips are about people, not spreadsheet rows.
- **Considered** — nothing superfluous. Every element earns its place. The AI works quietly in the background.
- **Unhurried** — feels like quality stationery, not a project management dashboard.

### Aesthetic Direction

**Theme:** Light. Warm off-white surfaces (`#F9F7F4`). Orange accent (`#F26419`) used sparingly — signals action only. Dark sidebar (`#1A1714`).

**Typography:**
- Display / headings: **Bricolage Grotesque** (Google Fonts, variable weight) — humanist grotesque with optical warmth; replaces Inter for headings
- Body / UI text: **Epilogue** (Google Fonts) — subtle personality, excellent small-size legibility

**Reference:** `assets/app inspo.webp` (app.designyow.com) — card-based layout, left sidebar, orange primary, country flags, avatar stacks.

**Anti-references:** No Airbnb/TripAdvisor energy; no dark mode glows or glassmorphism; no corporate SaaS coldness.

### Design Principles

1. **Reassurance through clarity** — every screen reduces anxiety; right information at the right time
2. **Warm, not cute** — human touches without being bubbly; the organiser is managing real logistics
3. **Intelligent restraint** — orange is rare so it always signals action; tables are tables; cards are cards
4. **Organisational authority** — organiser's data at the centre; AI works for them, quietly
5. **Speed over delight** — micro-interactions confirm state, they don't entertain

*Full context in `.impeccable.md`*

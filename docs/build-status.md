# Golazo — Build Status
**Generated:** 2026-06-11
**Current branch:** main | **Last commit:** `69a89aa` — "chore: v1 launch" (2026-05-12)
**Build:** passing (`npm run build` — 33 routes, 0 TypeScript errors)

---

## Phase Summary

| Phase | Status | Notes |
|---|---|---|
| 1 — Project Setup | ✅ Complete | Next.js 16, Tailwind v4, Supabase, folder structure, env vars, security headers, middleware |
| 2 — Database + Auth | ✅ Complete | 19 migrations applied; all tables, RLS, profile trigger; signup/login/logout/password reset |
| 3 — Core API Endpoints | ✅ Complete | All routes from `backend-spec.md`; Claude proxy; parse pipeline; chat; share token |
| 4 — Frontend Shell | ✅ Complete | Dark sidebar, trip list, nav, app layout, toast/modal/skeleton/avatar system |
| 5 — Feature Pages | ✅ Complete | Dashboard, Vault, Itinerary, Flights, Accommodation, Chat, Settings, Share view |
| 6 — Polish | ✅ Complete | Error/empty/loading states; responsive; accessibility; form validation; security hardening |
| 7 — Deploy | ⚠️ Partial | Build passes; `vercel.json` ready; **Vercel deploy + smoke tests not yet completed** |
| V2 — Itinerary Enhancements | ✅ Complete | All CB-1 through CB-9 shipped (commit `69a89aa`, 2026-05-12) |

---

## What's Built

### Authentication
- Signup, login, logout, password reset (email link)
- Password policy: min 8 chars + 1 uppercase + 1 number
- Supabase Auth; session guard via `middleware.ts`

### Trips
- Create, list, switch, edit (name/dates), delete (soft delete via `deleted_at`)
- Organiser / Member roles enforced at API and RLS level throughout

### Document Vault
- PDF + text upload (max 10MB); Supabase Storage
- Inline PDF viewer modal; source-doc attribution on itinerary/flights/accommodation
- Parse status badge: Unparsed / Parsing / Parsed / Failed
- Scanned PDF fallback: marks doc `failed` + shows manual entry CTA

### AI Document Parser (Agent 1)
- `POST /api/trips/[tripId]/parse` → `callClaude.ts` → `parser-agent.ts`
- Extracts: flights, accommodation, itinerary events, action alerts
- `confidence_score < 0.7` → flagged for review; `is_locked = true` records never overwritten
- Rate limit: 20 calls/trip/day
- Bad JSON retry once, then `failed` status + toast

### Itinerary
- Timeline view (day-by-day) + Calendar view toggle (CSS grid, no external library)
- Add/edit/delete events; drag-and-drop reorder within day (`@dnd-kit`); sort_order persisted
- Collapsible day sections (Expand All / Collapse All)
- Event colour coding by type (flight=indigo, accommodation=emerald, activity=amber, transfer=sky, general=slate)
- Tags, travellers, booking URL, source doc link on event cards
- Per-event file attachments (upload/list/delete; Supabase Storage `event-attachments/`)
- Organiser-only controls hidden entirely from members

### Flights & Accommodation
- Auto-populated from parse; inline editing (organiser only); source-doc links
- Search bars (client-side filtering); sort controls

### Dashboard
- Countdown to trip start; trip stats (destinations, nights, travellers)
- Member avatar stack; action alerts list
- Parse CTA when unparsed docs exist

### AI Chat (Agent 2)
- Q&A for all users; answers strictly from trip data
- Organiser-only UPDATE mode (confirm before edit; JSON update block server-side)
- 10-turn context; rate limit: 100 messages/trip/day
- Typing indicator; optimistic messages; rate limit banner

### Settings
- Share link generation + copy-to-clipboard + regenerate token
- Member list with role badges (display only; no remove in V1)
- Trip edit (name/dates); danger zone (delete trip with confirm)

### Shared Read-Only View (`/share/[tripId]`)
- No login required; validated via `share_token`; full read-only trip view
- Anon RLS policies scoped correctly (migration 018/019)

### Database
- 19 migrations applied in Supabase
- All tables RLS-enabled; service role key server-only
- `ai_audit_log` table exists; write attempted after every Claude call

---

## Outstanding Items

### 1. Known Bug — `ai_audit_log` Silent Failure
**File:** `lib/claude/callClaude.ts` (line 82)
**Issue:** The `catch {}` block around the audit log insert is bare — errors are swallowed with no logging. Audit log rows = 0 after confirmed successful parse runs.
**Fix needed:** Add `console.error` to the catch block so failures appear in server logs. The main flow must not break, but we need visibility.
**Impact:** Violates CLAUDE.md compliance rule "All AI inputs and outputs logged to `ai_audit_log`."

### 2. Vercel Deployment Not Yet Done
**Steps remaining:**
1. Connect GitHub repo to Vercel project
2. Set 5 env vars in Vercel dashboard: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_APP_URL`
3. Deploy `main` branch
4. Run 8-step smoke test (see `plan.md` §7.3)

### 3. Security Checklist Not Yet Signed Off
**From `plan.md` §7.1 — still unchecked:**
- RLS policies tested with all 3 session types (organiser / member / share token anon)
- `npm audit` run; zero critical vulnerabilities
- Supabase Storage bucket confirmed private
- Rate limits tested at boundary (21st parse call; 101st chat message)
- Share token invalidation after regenerate tested
- 403 confirmed when member hits organiser-only routes directly
- Claude parser tested with adversarial PDF content

### 4. SHOULD Features — Not Yet Verified as Working End-to-End
| FR | Feature | Status |
|---|---|---|
| FR-020 | `confidence < 0.7` flag UI on itinerary/flights/accommodation cards | `ConfidenceFlag.tsx` exists; needs live test with low-confidence parsed data |
| FR-031 | Traveller avatars/names on flights & accommodation table rows | Added to itinerary; flights/accommodation tables may not surface this yet |
| FR-036 | Action alert "suggested fix" text | Alerts surface on dashboard; whether `suggested_fix` field is populated by parser needs verification |
| FR-038 | Chat-driven itinerary edits (organiser UPDATE mode, confirmed → DB write) | Chat exists; UPDATE mode flow needs end-to-end verification with a real organiser session |

---

## V2 — Itinerary Enhancements (shipped 2026-05-12)

All 9 change brief items complete:
- **CB-1** Add Event modal (global, any date, auto-creates day row)
- **CB-2** Event tag pills (location, travellers, category badge)
- **CB-3** Collapsible day sections + Expand All / Collapse All
- **CB-4** Search bars (sidebar global, itinerary, vault, flights, accommodation)
- **CB-5** Event colour coding by type (left border + tint)
- **CB-6** Booking URL + source doc links on event cards
- **CB-7** Drag-and-drop reorder within day (organiser only; `@dnd-kit`)
- **CB-8** Per-event file attachments (upload/list/delete; `event_attachments` table)
- **CB-9** Calendar view toggle (CSS grid, no external library)

New DB: `itinerary_events` gained `travellers`, `tags`, `booking_url` columns; new `event_attachments` table (migrations 014–019).

---

## Next Steps (Priority Order)

1. **Fix `ai_audit_log` silent failure** — `lib/claude/callClaude.ts` catch block
2. **Verify FR-038** — chat UPDATE mode end-to-end with organiser session
3. **Verify FR-020** — confidence flag UI with sub-0.7 parsed data
4. **Vercel deploy** — connect repo, set env vars, run smoke tests
5. **Security checklist sign-off** — walk through `plan.md` §7.1 checklist
6. **V1 launch** — target was 15 May 2026; code is ready; blocked only on deploy + smoke test

---

*Stack: Next.js 16 · Tailwind v4 · Supabase (Postgres + Auth + Storage) · Anthropic Claude API (`claude-sonnet-4-20250514`) · Vercel*

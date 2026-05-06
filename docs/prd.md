# Golazo — Product Requirements Document

---

## 1. Document Control

| Field | Value |
|---|---|
| Product Name | Golazo |
| Version | 1.0 |
| Author / Owner | John |
| Last Updated | 2026-05-06 |
| Target Launch | V1 → 15 May 2026 · V2 → 1 June 2026 |
| Status | Active |

---

## 2. Problem Statement

Group trip coordination is fundamentally broken. Bookings, confirmations, and travel documents are scattered across email inboxes, PDFs, WhatsApp threads, and spreadsheets — with no single intelligent source of truth. When no single person owns the full picture, things fall through the cracks: missed connections, unbooked legs, and organisers spending hours manually compiling information that should be surfaced automatically.

**Core pain:** The trip organiser spends hours extracting data from PDFs and emails to build a shared view — a task that is entirely mechanical and should be automated.

---

## 3. User Personas

### Primary — The Organiser (John, 35–45)
Non-technical trip organiser managing a 4-person multi-city group trip. Frustrated by scattered confirmations, no consolidated view of who has booked what, and the manual effort of keeping the group informed. Wants a tool that builds the plan from his existing documents — not another spreadsheet to fill in manually.

**Goals:** Upload docs → see itinerary → share with group → sleep easy.

### Secondary — Group Members (Read-Only Consumers)
Travel companions who need to reference the trip plan without messaging the organiser. No editing rights; access via shared trip link. Need fast, accurate answers to questions like "what time does our flight leave?"

---

## 4. Goals & Metrics

### Top Goals
1. Organiser can go from zero to a complete auto-generated itinerary in under 10 minutes after uploading documents.
2. Group members can answer any trip question without messaging the organiser.
3. Zero missed bookings or gaps at trip departure.

### KPIs
| Metric | Target |
|---|---|
| Time from first upload to draft itinerary | < 10 minutes |
| End-to-end trip planning time (full docs → ready plan) | 1–2 hours |
| AI parsing accuracy on flights/accommodation | > 90% correct fields |
| Gap detection coverage | 100% of date conflicts and missing legs flagged |

---

## 5. Functional Requirements

### Epic 1 — User Authentication & Accounts

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-001 | User can sign up with email + password via Supabase Auth | MUST | Account created; email confirmation sent; user redirected to onboarding |
| FR-002 | User can log in and log out | MUST | Session persists on refresh; logout clears session |
| FR-003 | Organiser vs Group Member roles are enforced at all levels | MUST | Organiser can edit; Group Member sees read-only views; RLS enforced in DB |
| FR-004 | Password reset via email | MUST | Reset link valid for 1 hour; new password accepted on next login |

### Epic 2 — Multi-Trip Management

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-005 | Organiser can create a new trip with a name and date range | MUST | Trip appears in sidebar; user is set as organiser |
| FR-006 | Organiser can switch between multiple trips | MUST | Switching loads correct trip data with no state bleed |
| FR-007 | Organiser can delete a trip | MUST | All trip data (docs, parsed entities, itinerary) removed; confirm dialog shown |
| FR-008 | Trip shows countdown to departure date | SHOULD | Countdown badge accurate to the day |

### Epic 3 — Document Vault

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-009 | Organiser can upload PDF files to the vault | MUST | File stored in Supabase Storage; name and size shown in vault list |
| FR-010 | Organiser can upload email text/HTML as documents | MUST | Accepted as .eml or pasted text; stored and listed |
| FR-011 | Organiser can delete documents from the vault | MUST | File removed from storage; parse state reflects removal |
| FR-012 | Organiser can replace a document (re-upload) | MUST | New version replaces old; re-parse triggered or prompted |
| FR-013 | Vault shows upload date, file name, file size, and parse status | MUST | All metadata visible in list view |
| FR-014 | Document preview (inline PDF viewer) | COULD | PDF renders inline without download |

### Epic 4 — AI Document Parsing

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-015 | Clicking "Parse Documents" triggers Claude parsing pipeline | MUST | All vault docs sent to Document Parser Agent; structured JSON returned |
| FR-016 | Parser extracts flights (airline, route, date, time, confirmation number) | MUST | All fields populated where present in source doc; null where absent |
| FR-017 | Parser extracts accommodation (name, location, check-in, check-out, confirmation) | MUST | All fields populated where present; null where absent |
| FR-018 | Parser extracts itinerary events (date, time, description, location) | MUST | Events correctly dated and sequenced |
| FR-019 | Parser extracts action alerts (gaps, conflicts, missing bookings) | MUST | Alerts surface in dashboard |
| FR-020 | Fields with confidence < 0.7 are flagged for organiser review | SHOULD | Flag icon shown; organiser prompted to verify |
| FR-021 | Re-parse after new upload does not overwrite confirmed manual edits | SHOULD | Locked fields (confidence = 1.0) survive re-parse |
| FR-022 | Re-parse can be manually triggered by organiser | COULD | "Re-parse" button available in vault; confirmation dialog shown |

### Epic 5 — Itinerary View

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-023 | Day-by-day itinerary auto-generated from parsed docs | MUST | All parsed events appear in correct chronological order by day |
| FR-024 | Organiser can add, edit, and delete itinerary events | MUST | Changes persist; timestamps updated |
| FR-025 | Group members see itinerary in read-only mode | MUST | No edit controls visible; data identical to organiser view |
| FR-026 | Itinerary shows location, time, description per event | MUST | All three fields shown; empty fields shown as placeholder |

### Epic 6 — Flights & Accommodation Tables

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-027 | Flights table auto-populated from parsed docs | MUST | All parsed flights displayed with correct fields |
| FR-028 | Organiser can edit any flight record inline | MUST | Edits saved on blur or confirm; row updates without page reload |
| FR-029 | Accommodation table auto-populated from parsed docs | MUST | All parsed stays displayed with correct fields |
| FR-030 | Organiser can edit any accommodation record inline | MUST | Edits saved; row updates without page reload |
| FR-031 | Tables show which travellers are on each booking | SHOULD | Traveller avatars or names shown per row |

### Epic 7 — Overview Dashboard

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-032 | Dashboard shows countdown to trip start | MUST | Days remaining accurate; updates daily |
| FR-033 | Dashboard shows trip summary stats (destinations, nights, travellers) | MUST | Counts accurate to current data |
| FR-034 | Dashboard shows group member list with avatars | MUST | All invited/linked members visible |
| FR-035 | Gap detection flags missing bookings, date conflicts, traveller coverage gaps | MUST | All detected gaps shown as action alerts on dashboard |
| FR-036 | Action alerts include suggested fix where possible | SHOULD | Alert text includes actionable recommendation |

### Epic 8 — AI Chatbot

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-037 | Any user can ask trip Q&A in natural language | SHOULD | Bot responds based strictly on trip data; no hallucination |
| FR-038 | Organiser can request itinerary edits via chat | SHOULD | Bot confirms intent before executing; JSON update returned server-side |
| FR-039 | Group members attempting edits are politely declined | SHOULD | Bot explains read-only role; no edit executed |
| FR-040 | Chat retains last 10 turns of context per session | SHOULD | Bot answers with awareness of recent conversation |

### Epic 9 — Shared Access

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-041 | Organiser can generate a read-only shared trip link | SHOULD | Link uses trip ID; accessible without login; group member role applied |
| FR-042 | Group members can access trip view via shared link | SHOULD | Read-only view loads; no edit controls shown |

---

## 6. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Pages load < 2s on desktop broadband; parsing response < 30s per document batch |
| Availability | Vercel free tier; no SLA commitment for V1 |
| Browser Support | Chrome, Firefox, Safari, Edge — latest 2 versions; min viewport 375px |
| Responsiveness | Functional layout from 375px; desktop-optimised for V1; mobile-optimised in V2 |
| Accessibility | WCAG 2.1 AA for core flows (auth, dashboard, itinerary) |
| File Upload Limits | Max 10MB per PDF; max 20 docs per vault per trip |
| AI Rate Limits | 20 parser calls/trip/day; 100 chat messages/trip/day |
| Audit Logging | All AI inputs/outputs logged to Supabase audit table |

---

## 7. Scope

### In Scope — V1
- User auth (sign up, login, logout, password reset)
- Organiser vs Group Member roles + Supabase RLS
- Multi-trip support
- Document vault (upload, delete, replace)
- AI document parsing pipeline (flights, accommodation, events, alerts)
- Day-by-day itinerary view (auto-generated, organiser-editable)
- Flights table (auto-populated, editable)
- Accommodation table (auto-populated, editable)
- Overview dashboard (countdown, stats, gap detection)
- AI chatbot (Q&A + organiser-driven edits) [SHOULD]
- Shared read-only trip link [SHOULD]
- Parsing confidence flags [SHOULD]

### Out of Scope — V1
- Google Drive OAuth connector → V2
- Mobile-optimised layout → V2
- Budget tracker → V2
- Smart suggestions / local events → V2
- Real-time location sharing → V2
- Collaborative editing by group members → V2
- Push notifications → V2
- Platform rebrand → post-V2

---

## 8. Technical Architecture

### Stack
| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router) |
| Backend | Next.js API Routes (server-side) |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth |
| File Storage | Supabase Storage |
| AI | Anthropic Claude API (claude-sonnet-4-20250514) |
| Hosting | Vercel (free tier) |

### AI Agents
**Agent 1 — Document Parser**
- Trigger: Organiser clicks "Parse Documents"
- Input: Extracted PDF text + existing trip data + traveller names
- Output: Structured JSON (flights, accommodation, events, alerts)
- Rules: Null unknown fields; flag confidence < 0.7; retry once on bad JSON; max 1000 tokens

**Agent 2 — Trip Chatbot**
- Trigger: User message in AI Chat tab
- Input: Full trip data + traveller list + current date + user role + last 10 turns
- Output: Natural language (all users); JSON update block (organiser confirmed edits only)
- Rules: Strict trip-data-only answers; group member edits declined; max 500 tokens

### Key Integrations
- Claude API via `/api/claude` server-side proxy — API key never exposed to client
- Supabase client for auth, DB queries, and storage access
- Vercel environment variables for all secrets

---

## 9. Release Plan

| Sprint | Focus | Target |
|---|---|---|
| Sprint 0 | Repo setup, Supabase project, env config, CI/CD | Day 1 |
| Sprint 1 | Auth + multi-trip shell + vault upload | Days 2–3 |
| Sprint 2 | Claude parsing pipeline + itinerary auto-generation | Days 4–5 |
| Sprint 3 | Dashboard + alerts + chatbot | Days 6–7 |
| Sprint 4 | Polish, bug fixes, V1 launch | Day 9 (15 May 2026) |
| Sprint 5–6 | V2 features (Drive, mobile, budget, smart suggestions) | 1 June 2026 |

---

## 10. Go / No-Go Criteria

| Criterion | V1 Go Condition |
|---|---|
| Auth | Sign up, login, logout working |
| Parsing | Parser extracts flights + accommodation + events from sample docs |
| Itinerary | Day-by-day view auto-generates from parsed output |
| Tables | Flights + accommodation tables populated and editable |
| Dashboard | Countdown + gap detection alerts functional |
| Roles | Organiser edit / Group Member read-only enforced |

---

## 11. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| 9-day V1 deadline is extremely tight | High | High | Strict scope discipline; SHOULD items deferred if time runs short |
| AI parsing accuracy below acceptable threshold | Medium | High | Manual edit layer; confidence flags; organiser review flow |
| Supabase RLS misconfiguration exposes trip data | Medium | High | RLS policies reviewed before launch; all routes tested with both roles |
| Vercel free tier cold starts slow parsing response | Low | Medium | Server-side streaming where possible; loading state in UI |
| PDF text extraction fails on scanned/image PDFs | Medium | Medium | Graceful fallback with manual entry prompt |

---

## 12. Open Questions

⚠️ ATTENTION NEEDED — The following items are unresolved and require owner input before implementation:

1. **Go/No-Go criteria** — Owner stated "NA". Recommended to define before Sprint 4 to avoid ambiguous launch decision.
2. **Traveller invitation flow** — Email invite is COULD priority but shared link is SHOULD. Confirm whether email invite is in scope for V1 or deferred.
3. **Scanned PDF handling** — No OCR stack specified. Decision needed: use Tesseract, fallback to manual entry, or restrict to text-based PDFs only.
4. **Parsing failure UX** — What does the organiser see if Claude returns bad JSON on the retry? Define fallback screen.
5. **Trip deletion data retention** — When a trip is deleted, are vault files purged from Supabase Storage immediately, or soft-deleted?

---

## 13. Appendix — Data Entities (Summary)

| Entity | Purpose |
|---|---|
| `trips` | Core trip record; owned by organiser |
| `trip_members` | Join table linking users to trips with roles |
| `documents` | Raw uploaded files in vault |
| `parsed_flights` | Extracted flight records per trip |
| `parsed_accommodation` | Extracted accommodation records per trip |
| `itinerary_days` | Day-level itinerary container |
| `itinerary_events` | Individual events per day |
| `action_alerts` | Gap detection and conflict flags |
| `chat_messages` | Chatbot conversation history per trip |
| `ai_audit_log` | All Claude inputs/outputs for logging |

---

*Document generated as part of CEREBRO Build OS — Phase 2 output.*

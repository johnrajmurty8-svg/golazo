# Golazo — Change Log

---

## V2 — 11 May 2026
**Change:** Itinerary Page Enhancements (9 features)
**Brief:** `change-brief-v2.md`

### What Changed
- Added global "+ Add Event" button (top right of itinerary page) with full modal: date, time, location, description, category, travellers, tags, and booking URL — works on any date, not just existing day rows
- Added inline tag pills to event cards: location tag, traveller tags, and colour-coded category badge
- Made itinerary day sections collapsible (accordion) with Expand All / Collapse All control
- Added search bars to: left sidebar (global), itinerary page, vault/documents page, flights page, accommodation page — all client-side filtering
- Added event colour coding by type via left-border accent and background tint (flight = indigo, accommodation = emerald, activity = amber, transfer = sky, general = slate)
- Added booking URL links and source document links to each event card
- Added drag-and-drop reordering of events within a day (Organiser only) using @dnd-kit; sort_order persisted via new PATCH API endpoint
- Added per-event file attachment uploads (Organiser only); stored in Supabase Storage under `event-attachments/`; new `event_attachments` table
- Added Calendar view toggle to itinerary page header (CSS grid, no external calendar library)

### Database Changes
- `itinerary_events` table: added `travellers text[]`, `tags text[]`, `booking_url text` columns
- New table: `event_attachments` (id, event_id, trip_id, file_name, storage_path, file_size, mime_type, uploaded_by, uploaded_at) with RLS matching existing pattern

### New API Routes
- `POST /api/trips/[tripId]/itinerary/events` — updated to auto-create `itinerary_days` row if date has none
- `PATCH /api/trips/[tripId]/itinerary/reorder` — batch update sort_order (Organiser only)
- `POST /api/trips/[tripId]/itinerary/events/[eventId]/attachments` — upload attachment (Organiser only)
- `GET /api/trips/[tripId]/itinerary/events/[eventId]/attachments` — list attachments with signed URLs
- `DELETE /api/trips/[tripId]/itinerary/events/[eventId]/attachments/[attachmentId]` — delete attachment (Organiser only)

### What Didn't Change
- AI Document Parser agent and `/api/parse` pipeline
- AI Chatbot agent and `/api/trips/[tripId]/chat`
- Document Vault upload flow
- Flights table structure and inline editing
- Accommodation table structure and inline editing
- Overview Dashboard
- Auth model and RLS pattern
- `confidence_score` / `is_locked` logic
- Shared read-only trip view (`/share/[tripId]`)

### Affected Documents
| Document | Changed |
|---|---|
| PRD | Yes — Epic 5 extended; CB-1 through CB-9 as new FRs |
| App Flow | Yes — Section 5.4 (Itinerary) updated for modal, collapse, calendar, drag |
| UI Guide / design.md | Yes — Event type colours, tag pill styles, calendar grid spec |
| Backend Spec | Yes — `itinerary_events` new columns, `event_attachments` table, 5 new routes |
| Security Checklist | No — new file upload follows existing vault security pattern |

---

*End of log — V1 was the original build.*

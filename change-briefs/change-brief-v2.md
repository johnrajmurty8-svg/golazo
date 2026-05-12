# Change Brief: V2 — Itinerary Page Enhancements
**Product:** Golazo
**Date:** 11 May 2026
**Version:** V2
**Prepared for:** Claude Code

---

## Summary

This change upgrades the Itinerary page (`/trips/[tripId]/itinerary`) from a basic read/edit timeline into a fully-featured scheduling hub. Nine enhancements are being added: global event creation, event tagging, collapsible day sections, site-wide search, event colour coding, document/booking links, drag-and-drop reordering, per-event file attachments, and a calendar view toggle. Several changes also require new columns and a new table in the Supabase schema.

---

## What's Changing

### Frontend — Itinerary Page (`/trips/[tripId]/itinerary`)

- **[CB-1] Add Event button (top right):** Add a persistent "+ Add Event" button in the top-right of the itinerary page header. Clicking it opens a modal (not an inline form on a specific day). The modal includes: Title (required), Date (date picker — any date, not constrained to existing itinerary days), Time (time picker, optional), Location (text, optional), Description (text, optional), Category (dropdown: `flight` | `accommodation` | `activity` | `transfer` | `general`), Travellers (multi-select from trip member list), Tags (free-text tag input), Booking URL (text input). On save, if the selected date has no existing `itinerary_day`, one is created automatically via the API before the event is inserted.

- **[CB-2] Event tags:** Each event card on the itinerary displays inline tag pills below the title row: a 📍 Location tag (if location is set), 👥 Traveller tags (names or avatars of who is involved), and a Category badge (flight, accommodation, activity, transfer, general — colour-matched to CB-5 colours). Tags are rendered read-only on the card and are editable inside the event edit modal.

- **[CB-3] Collapsible day sections:** Each day header (e.g. "Day 1 — Mon 23 June") is now a clickable accordion toggle. Days with events default to **expanded**; empty days default to **collapsed**. A chevron icon (▶ / ▼) indicates state. A "Expand All / Collapse All" control sits at the top of the itinerary list. State is stored in local component state (not persisted to DB).

- **[CB-4] Search bars:** Add a search input to the following pages:
  - Left sidebar panel — global trip search (searches across itinerary events, flights, accommodation, documents by title/name/location)
  - `/trips/[tripId]/itinerary` — filters events by title, location, tag, or traveller name
  - `/trips/[tripId]/vault` (documents page) — filters document list by filename
  - `/trips/[tripId]/flights` — filters flight rows by airline, route, or traveller name
  - `/trips/[tripId]/accommodation` — filters accommodation rows by property name or location
  - All search is client-side filtering (no new API endpoints required for V2 scope); search state is not persisted.

- **[CB-5] Event colour coding:** Each event card renders a left-border accent and a subtle background tint based on `event_type`:
  - `flight` → Indigo (`4F46E5`)
  - `accommodation` → Emerald (`10B981`)
  - `activity` → Amber (`F59E0B`)
  - `transfer` → Sky (`0EA5E9`)
  - `general` → Slate (`64748B`)
  - Colour is applied as a 4px left border and a 5% opacity background tint. Text colour remains dark throughout for accessibility.

- **[CB-6] Document & booking links on event cards:** Each event card shows a link row at the bottom with:
  - A "Booking" link (external URL) — rendered if `booking_url` is set on the event
  - A "Source Doc" link — rendered if `source_document_id` is set; links to the document in the vault (`/trips/[tripId]/vault?doc=[id]`)
  - Both links open in a new tab. Link icons (🔗 for booking, 📄 for doc) precede the label.

- **[CB-7] Drag-and-drop event reordering:** Event cards within a day are draggable (using `@dnd-kit/core` and `@dnd-kit/sortable`). Dragging an event within its day updates `sort_order` for all affected events via a `PATCH /api/trips/[tripId]/itinerary/reorder` call. Cross-day drag is NOT supported in this version (future enhancement). Drag is only available to the Organiser role. Members see a static list.

- **[CB-8] Per-event file attachments:** Each event card has an "+ Attach file" button (Organiser only). Clicking opens a file picker (same restrictions as vault: PDF/text, max 10MB). Uploaded files are stored in Supabase Storage under `event-attachments/[tripId]/[eventId]/[filename]`. The new `event_attachments` table records each attachment. Attached files are listed on the event card as clickable download links (open in new tab via signed URL). Members can view/download attachments but cannot upload or delete.

- **[CB-9] Calendar view toggle:** A toggle control in the itinerary page header switches between **Timeline** (current day-by-day list) and **Calendar** (monthly grid) views. Calendar view renders events as chips on their respective dates using a simple CSS grid calendar (no external calendar library required). Clicking a chip in calendar view scrolls the timeline view to that day (when toggling back). The active view is stored in local component state.

---

### Backend — API Routes

- **[CB-1 API] Auto-create itinerary day:** `POST /api/trips/[tripId]/itinerary/events` — if the submitted `date` has no existing `itinerary_days` row for that trip, the route creates one before inserting the event. This allows events to be added on any date within the trip range, not just pre-existing day rows.

- **[CB-7 API] Reorder endpoint:** `PATCH /api/trips/[tripId]/itinerary/reorder` — accepts `{ dayId: string, orderedEventIds: string[] }`. Updates `sort_order` for each event ID in the array using a batched Supabase upsert. Organiser only (role check enforced server-side).

- **[CB-8 API] Event attachment upload:** `POST /api/trips/[tripId]/itinerary/events/[eventId]/attachments` — accepts multipart form data (file). Validates MIME type and size. Uploads to Supabase Storage. Inserts record into `event_attachments`. Returns the new attachment record. Organiser only.

- **[CB-8 API] List attachments:** `GET /api/trips/[tripId]/itinerary/events/[eventId]/attachments` — returns all attachments for the event with signed download URLs (60-minute expiry). Available to Organiser and Member.

- **[CB-8 API] Delete attachment:** `DELETE /api/trips/[tripId]/itinerary/events/[eventId]/attachments/[attachmentId]` — removes storage file and DB record. Organiser only.

---

### Database — Schema Changes

- **`itinerary_events` table — new columns:**

  | Column | Type | Constraints | Description |
  |---|---|---|---|
  | `travellers` | `text[]` | NULLABLE | Names of trip members involved in this event |
  | `tags` | `text[]` | NULLABLE | Free-text user-defined tags |
  | `booking_url` | `text` | NULLABLE | External link to booking confirmation page |

  Migrate with: `ALTER TABLE itinerary_events ADD COLUMN travellers text[], ADD COLUMN tags text[], ADD COLUMN booking_url text;`

  > Note: `color` is NOT stored — it is derived from `event_type` in the frontend. `source_document_id` already exists on the table.

- **New table: `event_attachments`**

  | Column | Type | Constraints | Description |
  |---|---|---|---|
  | `id` | `uuid` | PK | — |
  | `event_id` | `uuid` | FK → `itinerary_events.id` ON DELETE CASCADE, NOT NULL | Parent event |
  | `trip_id` | `uuid` | FK → `trips.id` ON DELETE CASCADE, NOT NULL | Denormalised for RLS |
  | `file_name` | `text` | NOT NULL | Original filename |
  | `storage_path` | `text` | NOT NULL | Path in Supabase Storage |
  | `file_size` | `integer` | NOT NULL | Bytes |
  | `mime_type` | `text` | NOT NULL | e.g. `application/pdf` |
  | `uploaded_by` | `uuid` | FK → `profiles.id`, NOT NULL | Uploader |
  | `uploaded_at` | `timestamptz` | NOT NULL, DEFAULT now() | — |

  RLS policies:
  - SELECT: trip Organiser or Member (via `trip_members` check on `trip_id`)
  - INSERT: Organiser only
  - DELETE: Organiser only

---

### Components — New & Modified

| Component | Action | Notes |
|---|---|---|
| `components/itinerary/AddEventModal.tsx` | CREATE | Full event creation modal (CB-1) |
| `components/itinerary/EventCard.tsx` | MODIFY | Add tags, colour border, links, attach button, drag handle |
| `components/itinerary/DaySection.tsx` | MODIFY | Add accordion collapse, drag context wrapper |
| `components/itinerary/ItineraryHeader.tsx` | MODIFY | Add "+ Add Event" button, view toggle, "Expand All" control |
| `components/itinerary/CalendarView.tsx` | CREATE | Monthly CSS grid calendar (CB-9) |
| `components/itinerary/EventAttachments.tsx` | CREATE | Attachment list + upload UI (CB-8) |
| `components/ui/SearchBar.tsx` | CREATE | Reusable search input component (CB-4) |
| `components/layout/Sidebar.tsx` | MODIFY | Add global search bar to sidebar (CB-4) |
| `components/vault/DocumentList.tsx` | MODIFY | Add search bar (CB-4) |
| `components/flights/FlightsTable.tsx` | MODIFY | Add search bar (CB-4) |
| `components/accommodation/AccommodationTable.tsx` | MODIFY | Add search bar (CB-4) |

---

## What's NOT Changing

- The AI Document Parser agent — no changes to `/api/parse` or the Claude parsing pipeline
- The AI Chatbot agent — no changes to `/api/trips/[tripId]/chat`
- The Document Vault upload flow — vault uploads remain unchanged; per-event attachments are a separate system
- The Flights table structure and edit-inline behaviour
- The Accommodation table structure and edit-inline behaviour
- The Overview Dashboard
- Auth and RLS policy model — the new `event_attachments` RLS follows the existing pattern exactly
- The `confidence_score` and `is_locked` logic on itinerary events
- The shared read-only trip view (`/share/[tripId]`) — calendar and search are not added to the public view in this change
- Cross-day drag-and-drop — events can only be reordered within their own day

---

## Design Notes

- Colour coding (CB-5) must meet WCAG AA contrast — use the left-border + tint pattern, never colour as the only differentiator.
- Calendar view (CB-9) must be a simple CSS grid — do NOT add `react-big-calendar`, `fullcalendar`, or any external calendar library. Keep bundle size lean.
- Drag handles (CB-7) are only visible on hover for Organiser. Use `@dnd-kit` (already commonly used with Next.js/React). If not yet installed: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`.
- The "+ Add Event" modal (CB-1) must use the same design tokens as the existing inline edit form — font, spacing, input border radius, button styles from `design.md`.
- Tag pills (CB-2) should be compact: 12px text, 4px vertical padding, 8px horizontal padding, rounded-full, colour-matched to event type for category badge; neutral slate for location and traveller tags.
- Search bars (CB-4) are client-side only — no debounce API calls, no new endpoints. Filter the already-loaded data in component state.

---

## Affected Documents

- [x] PRD — Epic 5 (Itinerary View): FR-023 through FR-026 extended; new FRs for CB-1 through CB-9 should be logged
- [x] App Flow — Section 5.4 (Itinerary) needs update to reflect modal, collapsible days, calendar view, and drag-and-drop
- [x] UI Guide / design.md — Colour palette for event types, tag pill styles, calendar grid spec to be added
- [x] Backend Spec — `itinerary_events` schema additions + new `event_attachments` table + 5 new API routes
- [ ] Security Checklist — No changes required; new file upload follows existing vault security pattern

---

## Test Checklist

- [ ] CB-1: Organiser can create an event on a date that has no existing day row — new day row is auto-created
- [ ] CB-1: Organiser can create an event with only Title + Date (all other fields optional)
- [ ] CB-1: Member sees no "+ Add Event" button
- [ ] CB-2: Event card shows correct location tag, traveller tags, and category badge
- [ ] CB-2: Category badge colour matches event type (spot-check: flight = indigo, accommodation = emerald)
- [ ] CB-3: Clicking day header collapses/expands that day's events; chevron rotates correctly
- [ ] CB-3: "Collapse All" collapses every day; "Expand All" expands every day
- [ ] CB-4: Searching on itinerary page filters events correctly and clears on empty input
- [ ] CB-4: Sidebar search returns results from across itinerary, flights, and accommodation
- [ ] CB-5: All 5 event types render with correct left-border colour
- [ ] CB-6: Booking URL link appears only when `booking_url` is set; opens in new tab
- [ ] CB-6: Source doc link appears only when `source_document_id` is set; navigates to vault doc
- [ ] CB-7: Organiser can drag an event to a new position within the same day; order persists on page reload
- [ ] CB-7: Member cannot drag events (no drag handle rendered)
- [ ] CB-8: Organiser can upload a PDF attachment to an event; it appears as a download link
- [ ] CB-8: Attachment > 10MB is rejected with an error message
- [ ] CB-8: Member can see and download attachments but has no upload/delete controls
- [ ] CB-9: Toggling to Calendar view shows all events on correct dates
- [ ] CB-9: Toggling back to Timeline view preserves previously expanded/collapsed state
- [ ] Regression: Existing add/edit/delete inline event flow still works
- [ ] Regression: Parsing pipeline still populates itinerary correctly on fresh parse
- [ ] Regression: Both Organiser and Member roles tested for every new control

---

## Claude Code Prompt

Paste this into a new Claude Code session:

---

Read `change-brief-v2.md` and `change-log.md` in this project folder. Also read `CLAUDE.md`, `backend-spec.md`, `app-flow.md`, and `design.md`.

This is a V2 update to Golazo. Make ONLY the changes listed in the brief.

**Before writing any code:**
1. List every file you will create or modify
2. Describe what you will change in each file
3. For the DB migration, write the SQL ALTER statements and the new `event_attachments` CREATE TABLE + RLS policies
4. Wait for my approval before proceeding

Do not rebuild from scratch. Surgical edits only. Do not touch the parser, chatbot, vault upload flow, flights table, or accommodation table beyond adding the CB-4 search bar.

---

# Golazo — Project Brief

**AI-powered group trip coordination. Upload your booking docs. Get your itinerary.**

---

## The problem

Group trip coordination is broken. Flights, hotels, and confirmation emails live across inboxes, PDFs, and WhatsApp threads — no single intelligent source of truth. The trip organiser ends up spending hours manually extracting data from documents to build a plan that everyone else can reference. That work is entirely mechanical. It should be automatic.

---

## What Golazo does

Golazo is a web app for group travellers. The organiser uploads their booking PDFs and email confirmations into a document vault. Claude reads them and automatically builds a structured itinerary — flights table, accommodation table, day-by-day plan — in minutes. It flags gaps, conflicts, and missing bookings before they become problems. The whole group gets read-only access via a shared link, so no one needs to message the organiser for basic trip information.

---

## Who it's for

**Primary user:** John, 35–45, non-technical trip organiser. Planning a 4-person multi-city trip. Frustrated by scattered documents and the manual work of keeping everyone informed. Wants the plan built *for* him from documents he already has.

**Secondary users:** Group members who need to reference the trip plan — flight times, check-in dates, daily schedule — without contacting the organiser.

---

## V1 scope

| Feature | Status |
|---|---|
| Document vault — upload, delete, replace PDFs and email confirmations | MUST |
| AI parsing — Claude extracts flights, accommodation, and events automatically | MUST |
| Day-by-day itinerary — auto-generated, organiser-editable | MUST |
| Flights table — auto-populated, inline-editable | MUST |
| Accommodation table — auto-populated, inline-editable | MUST |
| Overview dashboard — countdown, trip stats, gap detection alerts | MUST |
| User accounts — organiser vs group member roles | MUST |
| Multi-trip support — one account, multiple trips | MUST |
| AI chatbot — trip Q&A + organiser-driven edits via chat | SHOULD |
| Shared read-only trip link for group members | SHOULD |
| Parsing confidence flags — flag low-certainty extractions for review | SHOULD |

**Out of scope for V1:** Google Drive connector, mobile-optimised layout, budget tracker, smart suggestions, real-time location sharing, push notifications.

---

## Technical approach

**Stack:** Next.js + Supabase + Claude API + Vercel

- Supabase handles auth, Postgres database, and file storage for the document vault
- Claude API called server-side only (API key never exposed to client)
- Two AI agents: Document Parser (structured JSON extraction) and Trip Chatbot (Q&A + organiser edits)
- Hosted on Vercel free tier

---

## Timeline

| Milestone | Date |
|---|---|
| V1 launch | 15 May 2026 |
| V2 launch (Drive, mobile, budget tracker) | 1 June 2026 |

**Team:** Solo builder (John)

---

## Key risks

1. **9-day V1 deadline is tight** — strict scope discipline required; SHOULD items deferred if time runs short
2. **AI parsing accuracy** — mitigated by manual edit layer, confidence flags, and organiser review flow
3. **Google Drive deferred to V2** — protects the V1 timeline

---

*Golazo | Author: John | Generated: 2026-05-06 | CEREBRO Build OS — Phase 2 output*

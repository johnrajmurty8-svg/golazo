# Golazo — App Flow & Navigation

---

## 1. Route Map

| Route | Access | Description |
|---|---|---|
| `/` | Public | Landing / marketing page → redirects to `/login` if no session |
| `/login` | Public | Login form |
| `/signup` | Public | Sign up form |
| `/reset-password` | Public | Password reset request |
| `/reset-password/confirm` | Public | Password reset confirmation (via email link) |
| `/trips` | Authenticated | Trip list / home — redirected here after login |
| `/trips/new` | Organiser | Create new trip |
| `/trips/[tripId]/dashboard` | Authenticated | Overview dashboard for a trip |
| `/trips/[tripId]/vault` | Authenticated | Document vault |
| `/trips/[tripId]/itinerary` | Authenticated | Day-by-day itinerary view |
| `/trips/[tripId]/flights` | Authenticated | Flights table |
| `/trips/[tripId]/accommodation` | Authenticated | Accommodation table |
| `/trips/[tripId]/chat` | Authenticated | AI chatbot |
| `/trips/[tripId]/settings` | Organiser only | Trip settings (name, dates, members, delete) |
| `/share/[tripId]` | Public (read-only) | Shared trip view for group members without login |
| `/api/claude` | Server-side only | Proxy route for all Claude API calls |
| `/api/parse` | Server-side only | Trigger parsing pipeline |
| `/api/trips` | Server-side only | CRUD for trips |
| `/api/vault` | Server-side only | Upload, delete, list vault documents |

---

## 2. Authentication Flow

### Sign Up
1. User lands on `/signup`
2. Enters email + password → submits form
3. Client calls Supabase Auth `signUp()`
4. Supabase sends confirmation email
5. User clicks confirmation link → Supabase confirms account
6. User redirected to `/login` with success message
7. User logs in → session created → redirected to `/trips`

### Login
1. User lands on `/login`
2. Enters email + password → submits form
3. Client calls Supabase Auth `signInWithPassword()`
4. On success: session stored in cookie → redirect to `/trips`
5. On failure: inline error message shown (do not reveal whether email exists)

### Logout
1. User clicks "Log out" in sidebar
2. Client calls `supabase.auth.signOut()`
3. Session cleared → redirect to `/login`

### Password Reset
1. User clicks "Forgot password" on `/login`
2. Directed to `/reset-password` → enters email
3. Supabase sends reset link
4. User clicks link → lands on `/reset-password/confirm`
5. Enters new password → confirmed → redirected to `/login`

### Session Guard
- All `/trips/*` routes wrapped in middleware that checks for valid Supabase session
- No session → redirect to `/login?redirect=[original path]`
- On login, redirect to original intended path

---

## 3. Onboarding Flow (First Login)

1. User logs in for the first time → `/trips` shows empty state
2. Empty state: "No trips yet — create your first trip" with a CTA button
3. Click CTA → `/trips/new` — modal or page with form: Trip Name, Destination(s), Start Date, End Date
4. On create → trip record inserted → user set as organiser → redirected to `/trips/[tripId]/dashboard`
5. Dashboard shows empty state with next step: "Upload your booking documents to get started"
6. Step-by-step prompt guides organiser: Upload docs → Parse → Review itinerary

---

## 4. Main App Layout

```
┌────────────────────────────────────────────────────────┐
│  LEFT SIDEBAR (fixed, 260px)                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │ [Logo] Golazo                                     │  │
│  │ ─────────────────────────────────────────────    │  │
│  │ MY TRIPS                                          │  │
│  │  ▶ [Trip Thumbnail] Trip Name   [countdown badge] │  │
│  │  ▶ [Trip Thumbnail] Another Trip                  │  │
│  │  + New Trip                                       │  │
│  │ ─────────────────────────────────────────────    │  │
│  │ [Selected Trip Navigation]                        │  │
│  │  🏠 Dashboard                                     │  │
│  │  📂 Documents                                     │  │
│  │  📅 Itinerary                                     │  │
│  │  ✈️ Flights                                       │  │
│  │  🏨 Accommodation                                  │  │
│  │  💬 AI Chat                                       │  │
│  │  ⚙️ Settings (organiser only)                    │  │
│  │ ─────────────────────────────────────────────    │  │
│  │ [User avatar] John ▾                              │  │
│  │ Log out                                           │  │
│  └──────────────────────────────────────────────────┘  │
│  MAIN CONTENT (fluid, min 375px)                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │  [Page content]                                   │  │
│  └──────────────────────────────────────────────────┘  │
│  RIGHT CONTEXTUAL PANEL (optional, 280px, collapsible) │
│  ┌──────────────────────────────────────────────────┐  │
│  │  [Contextual info: alerts, member list, doc ref]  │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

## 5. Screen-by-Screen Interaction Flows

### 5.1 Dashboard (`/trips/[tripId]/dashboard`)

**What loads:**
- Trip name, cover image (if set), destination flags
- Countdown badge (days to departure)
- Trip stats: # destinations, # nights, # travellers
- Group member avatar stack
- Action alerts list (gap detection results)
- Quick links to other sections

**User actions:**
- Click action alert → navigates to relevant section (e.g., Flights) with the flagged item highlighted
- Click member avatar → opens member detail panel
- Click "Parse Documents" CTA (if unparsed docs exist) → triggers parsing flow

**States:**
- Empty (no docs uploaded): onboarding CTA shown
- Parsed, no alerts: clean summary view
- Parsed, alerts present: alert cards shown with amber badges

---

### 5.2 Document Vault (`/trips/[tripId]/vault`)

**What loads:**
- List of uploaded documents (name, size, upload date, parse status badge)
- Upload zone (drag-and-drop or file picker)
- "Parse All Documents" button (disabled if no unparsed docs)

**User actions (Organiser):**
1. **Upload:** Drag file onto zone or click to select → file uploads to Supabase Storage → appears in list with "Unparsed" badge
2. **Delete:** Click delete icon → confirm dialog → file removed from storage and list
3. **Replace:** Click replace icon → file picker opens → new file uploaded, old replaced
4. **Parse:** Click "Parse All Documents" → loading state → Claude pipeline runs → results stored → success toast → user prompted to review itinerary
5. **Preview (COULD):** Click file name → PDF renders inline in right panel

**Error states:**
- Upload > 10MB: "File too large. Max size is 10MB."
- Unsupported format: "Only PDF and text files are supported."
- Parse failure: "Parsing failed. Please check your documents or enter details manually."

---

### 5.3 AI Parsing Flow

1. Organiser clicks "Parse All Documents" in vault
2. Loading overlay: "Claude is reading your documents…"
3. Server calls `/api/parse` → extracts text from PDFs in storage → sends to `/api/claude` (Document Parser Agent)
4. Claude returns structured JSON
5. JSON written to DB: `parsed_flights`, `parsed_accommodation`, `itinerary_events`, `action_alerts`
6. Fields with `confidence_score < 0.7` flagged in DB
7. UI navigates to Dashboard → alerts shown; Itinerary populated
8. Flagged fields shown with ⚠️ icon → organiser reviews and confirms or corrects

---

### 5.4 Day-by-Day Itinerary (`/trips/[tripId]/itinerary`)

**What loads:**
- Chronological list of days from trip start to end date
- Each day: date header + list of events (time, title, location, description)
- Empty days shown with "+ Add event" prompt

**User actions (Organiser):**
- **Add event:** Click "+ Add event" on a day → inline form expands → fill in time/title/location/description → Save
- **Edit event:** Click event card → fields become editable inline → Save / Cancel
- **Delete event:** Click delete icon on event → confirm → removed
- **Reorder events:** Drag handle to reorder within a day (stretch goal)

**Group member view:** All events shown, no edit controls visible.

**Error states:**
- Save fails: inline error "Could not save. Please try again."
- Conflicting event times: yellow warning shown on card

---

### 5.5 Flights Table (`/trips/[tripId]/flights`)

**What loads:**
- Table with columns: Airline, From, To, Departure Date, Departure Time, Arrival Time, Flight No., Confirmation No., Travellers
- Auto-populated from parsed docs
- Confidence flags shown inline on uncertain fields

**User actions (Organiser):**
- **Edit field:** Click any cell → editable input → Tab/Enter to move → changes auto-saved
- **Add flight:** Click "+ Add Flight" → new empty row appended
- **Delete flight:** Click row delete → confirm dialog

**Group member view:** Table shown read-only; no edit controls.

---

### 5.6 Accommodation Table (`/trips/[tripId]/accommodation`)

**What loads:**
- Table with columns: Property Name, Location, Check-In Date, Check-Out Date, Nights, Confirmation No., Travellers
- Auto-populated from parsed docs

**User actions:** Same pattern as Flights Table (edit inline, add row, delete row).

---

### 5.7 AI Chat (`/trips/[tripId]/chat`)

**What loads:**
- Chat interface with message history
- Input field at bottom
- Role badge (Organiser / Group Member) shown

**User actions:**
- Type question → send → bot responds using trip data only
- Organiser: can request edit ("Move the Rio dinner to 8pm") → bot confirms intent → on confirm, edit applied and itinerary updated
- Group member: edit attempts → bot politely declines

**States:**
- Empty: "Ask me anything about your trip…" placeholder
- Rate limit hit: "You've reached the daily chat limit. Resets at midnight UTC."

---

### 5.8 Trip Settings (`/trips/[tripId]/settings`)

**Access:** Organiser only. Group members do not see this link in sidebar.

**What loads:**
- Trip name (editable)
- Start/end dates (editable)
- Group member management (list, invite link, remove member)
- Danger zone: Delete trip

**User actions:**
- Edit name/dates → Save → changes reflected in sidebar and dashboard
- Copy shared link → link copied to clipboard with toast
- Delete trip → "Are you sure? This cannot be undone." confirm → all data deleted → redirected to `/trips`

---

### 5.9 Shared Trip View (`/share/[tripId]`)

**Access:** Public (no login required). Read-only.

**What loads:**
- Trip name, dates, destinations
- Same Dashboard, Itinerary, Flights, Accommodation views as authenticated flow
- No sidebar nav; simplified top bar with trip name + "Sign up to plan your own trip" CTA
- No vault, no settings, no chat edit access (chatbot in read-only ANSWER mode)

---

## 6. Error & Edge Cases

| Scenario | Behaviour |
|---|---|
| User accesses `/trips/[tripId]` they don't belong to | 403 page: "You don't have access to this trip." |
| Shared link for non-existent trip | 404 page: "Trip not found." |
| Session expires mid-session | Middleware catches → redirect to `/login?redirect=[current path]` |
| Claude API returns error | Toast: "AI service unavailable. Please try again shortly." |
| Parse returns no data | Dashboard shows empty state with manual entry CTA |
| Upload of corrupt PDF | "File could not be read. Please check the file and try again." |
| All documents deleted after parsing | Parsed data remains; vault shows empty with warning "Source documents removed — data may be incomplete." |
| Group member attempts direct URL to organiser-only route | Redirect to read-only dashboard with notice |

---

*Document generated as part of CEREBRO Build OS — Phase 2 output.*

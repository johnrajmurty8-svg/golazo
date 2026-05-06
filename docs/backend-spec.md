# Golazo — Backend Specification

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth (email/password) |
| File Storage | Supabase Storage |
| AI | Anthropic Claude API (`claude-sonnet-4-20250514`) |
| Hosting | Vercel (free tier) |
| ORM / Query | Supabase JS client (`@supabase/supabase-js`) |

---

## 2. Data Models

### 2.1 `users` (managed by Supabase Auth)
Supabase Auth manages the `auth.users` table. A public `profiles` table mirrors display data.

### 2.2 `profiles`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK, FK → `auth.users.id`, NOT NULL | Supabase Auth user ID |
| `display_name` | `text` | NOT NULL | User's display name |
| `avatar_url` | `text` | NULLABLE | Avatar image URL |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | Profile creation time |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT now() | Last update |

---

### 2.3 `trips`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Trip ID |
| `organiser_id` | `uuid` | FK → `profiles.id`, NOT NULL | Trip owner |
| `name` | `text` | NOT NULL | Trip display name |
| `description` | `text` | NULLABLE | Optional description |
| `start_date` | `date` | NOT NULL | Trip start date |
| `end_date` | `date` | NOT NULL | Trip end date |
| `cover_image_url` | `text` | NULLABLE | Trip thumbnail URL |
| `share_token` | `uuid` | UNIQUE, DEFAULT gen_random_uuid() | Read-only share link token |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | — |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT now() | — |

**Relationships:**
- `organiser_id` → `profiles.id`
- One trip → many `trip_members`, `documents`, `parsed_flights`, `parsed_accommodation`, `itinerary_days`, `action_alerts`, `chat_messages`

---

### 2.4 `trip_members`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK | — |
| `trip_id` | `uuid` | FK → `trips.id` ON DELETE CASCADE, NOT NULL | Trip reference |
| `user_id` | `uuid` | FK → `profiles.id`, NOT NULL | Member reference |
| `role` | `text` | NOT NULL, CHECK (role IN ('organiser','member')) | Access level |
| `joined_at` | `timestamptz` | NOT NULL, DEFAULT now() | — |

**Unique constraint:** `(trip_id, user_id)`

---

### 2.5 `documents`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK | — |
| `trip_id` | `uuid` | FK → `trips.id` ON DELETE CASCADE, NOT NULL | — |
| `uploaded_by` | `uuid` | FK → `profiles.id`, NOT NULL | — |
| `file_name` | `text` | NOT NULL | Original file name |
| `file_size_bytes` | `integer` | NOT NULL | File size |
| `storage_path` | `text` | NOT NULL, UNIQUE | Supabase Storage path |
| `mime_type` | `text` | NOT NULL | `application/pdf`, `text/plain`, etc. |
| `parse_status` | `text` | NOT NULL, DEFAULT 'unparsed', CHECK (IN ('unparsed','parsing','parsed','failed')) | — |
| `parsed_at` | `timestamptz` | NULLABLE | When parsing completed |
| `uploaded_at` | `timestamptz` | NOT NULL, DEFAULT now() | — |

---

### 2.6 `parsed_flights`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK | — |
| `trip_id` | `uuid` | FK → `trips.id` ON DELETE CASCADE, NOT NULL | — |
| `source_document_id` | `uuid` | FK → `documents.id`, NULLABLE | Source doc if parseable |
| `airline` | `text` | NULLABLE | Airline name |
| `flight_number` | `text` | NULLABLE | Flight number |
| `from_airport` | `text` | NULLABLE | Departure IATA code or city |
| `to_airport` | `text` | NULLABLE | Arrival IATA code or city |
| `departure_date` | `date` | NULLABLE | — |
| `departure_time` | `time` | NULLABLE | — |
| `arrival_date` | `date` | NULLABLE | — |
| `arrival_time` | `time` | NULLABLE | — |
| `confirmation_number` | `text` | NULLABLE | Booking reference |
| `travellers` | `text[]` | NULLABLE | Array of traveller names on this leg |
| `confidence_score` | `float4` | NOT NULL, DEFAULT 0.8 | AI extraction confidence (0–1) |
| `is_locked` | `boolean` | NOT NULL, DEFAULT false | Locked = manual confirmed, skip re-parse |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | — |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT now() | — |

---

### 2.7 `parsed_accommodation`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK | — |
| `trip_id` | `uuid` | FK → `trips.id` ON DELETE CASCADE, NOT NULL | — |
| `source_document_id` | `uuid` | FK → `documents.id`, NULLABLE | — |
| `property_name` | `text` | NULLABLE | Hotel / property name |
| `location` | `text` | NULLABLE | City or address |
| `check_in_date` | `date` | NULLABLE | — |
| `check_out_date` | `date` | NULLABLE | — |
| `confirmation_number` | `text` | NULLABLE | — |
| `travellers` | `text[]` | NULLABLE | Travellers covered |
| `confidence_score` | `float4` | NOT NULL, DEFAULT 0.8 | — |
| `is_locked` | `boolean` | NOT NULL, DEFAULT false | — |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | — |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT now() | — |

---

### 2.8 `itinerary_days`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK | — |
| `trip_id` | `uuid` | FK → `trips.id` ON DELETE CASCADE, NOT NULL | — |
| `date` | `date` | NOT NULL | Calendar date of this itinerary day |
| `title` | `text` | NULLABLE | Optional day label (e.g. "Arrival Day") |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | — |

**Unique constraint:** `(trip_id, date)`

---

### 2.9 `itinerary_events`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK | — |
| `day_id` | `uuid` | FK → `itinerary_days.id` ON DELETE CASCADE, NOT NULL | Parent day |
| `trip_id` | `uuid` | FK → `trips.id` ON DELETE CASCADE, NOT NULL | Denormalised for RLS |
| `time` | `time` | NULLABLE | Event time |
| `title` | `text` | NOT NULL | Short event name |
| `description` | `text` | NULLABLE | Full details |
| `location` | `text` | NULLABLE | Location string |
| `event_type` | `text` | NOT NULL, DEFAULT 'general', CHECK (IN ('flight','accommodation','activity','transfer','general')) | — |
| `source_entity_id` | `uuid` | NULLABLE | FK to parsed_flights or parsed_accommodation if auto-generated |
| `confidence_score` | `float4` | NOT NULL, DEFAULT 1.0 | 1.0 = manually entered/confirmed; < 0.7 = flagged |
| `is_locked` | `boolean` | NOT NULL, DEFAULT false | — |
| `sort_order` | `integer` | NOT NULL, DEFAULT 0 | Display order within day |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | — |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT now() | — |

---

### 2.10 `action_alerts`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK | — |
| `trip_id` | `uuid` | FK → `trips.id` ON DELETE CASCADE, NOT NULL | — |
| `alert_type` | `text` | NOT NULL, CHECK (IN ('missing_booking','date_conflict','traveller_gap','confidence_flag','general')) | — |
| `severity` | `text` | NOT NULL, DEFAULT 'warning', CHECK (IN ('info','warning','critical')) | — |
| `title` | `text` | NOT NULL | Alert headline |
| `description` | `text` | NOT NULL | Detail + suggested action |
| `is_resolved` | `boolean` | NOT NULL, DEFAULT false | Dismissed or fixed by organiser |
| `related_entity_type` | `text` | NULLABLE | `flight`, `accommodation`, `event` |
| `related_entity_id` | `uuid` | NULLABLE | FK to relevant record |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | — |

---

### 2.11 `chat_messages`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK | — |
| `trip_id` | `uuid` | FK → `trips.id` ON DELETE CASCADE, NOT NULL | — |
| `user_id` | `uuid` | FK → `profiles.id`, NOT NULL | Sender |
| `role` | `text` | NOT NULL, CHECK (IN ('user','assistant')) | Message origin |
| `content` | `text` | NOT NULL | Message text |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | — |

---

### 2.12 `ai_audit_log`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK | — |
| `trip_id` | `uuid` | FK → `trips.id`, NULLABLE | — |
| `user_id` | `uuid` | FK → `profiles.id`, NULLABLE | — |
| `agent` | `text` | NOT NULL, CHECK (IN ('parser','chatbot')) | — |
| `input_tokens` | `integer` | NULLABLE | — |
| `output_tokens` | `integer` | NULLABLE | — |
| `prompt_hash` | `text` | NULLABLE | SHA256 of prompt for dedup |
| `response_summary` | `text` | NULLABLE | Truncated response for audit |
| `error` | `text` | NULLABLE | Error message if failed |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | — |

---

## 3. API Endpoints

### Auth (handled by Supabase client-side)
| Route | Method | Description |
|---|---|---|
| Supabase Auth | — | Sign up, login, logout, password reset handled via Supabase JS client |

### Trips
| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/trips` | GET | Organiser | List all trips for authenticated user |
| `/api/trips` | POST | Organiser | Create new trip |
| `/api/trips/[tripId]` | GET | Member | Get trip details |
| `/api/trips/[tripId]` | PATCH | Organiser | Update trip name/dates |
| `/api/trips/[tripId]` | DELETE | Organiser | Delete trip + all related data |
| `/api/trips/[tripId]/members` | GET | Member | List trip members |
| `/api/trips/[tripId]/share` | POST | Organiser | Regenerate share token |

### Documents
| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/trips/[tripId]/vault` | GET | Member | List documents in vault |
| `/api/trips/[tripId]/vault` | POST | Organiser | Upload document to vault |
| `/api/trips/[tripId]/vault/[docId]` | DELETE | Organiser | Delete document |
| `/api/trips/[tripId]/vault/[docId]` | PUT | Organiser | Replace document |

### Parsing
| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/trips/[tripId]/parse` | POST | Organiser | Trigger Claude parsing pipeline on vault documents |

### Itinerary
| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/trips/[tripId]/itinerary` | GET | Member | Get all itinerary days + events |
| `/api/trips/[tripId]/itinerary/events` | POST | Organiser | Add event |
| `/api/trips/[tripId]/itinerary/events/[eventId]` | PATCH | Organiser | Edit event |
| `/api/trips/[tripId]/itinerary/events/[eventId]` | DELETE | Organiser | Delete event |

### Flights & Accommodation
| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/trips/[tripId]/flights` | GET | Member | List flights |
| `/api/trips/[tripId]/flights` | POST | Organiser | Add flight manually |
| `/api/trips/[tripId]/flights/[id]` | PATCH | Organiser | Edit flight |
| `/api/trips/[tripId]/flights/[id]` | DELETE | Organiser | Delete flight |
| `/api/trips/[tripId]/accommodation` | GET | Member | List accommodation |
| `/api/trips/[tripId]/accommodation` | POST | Organiser | Add accommodation manually |
| `/api/trips/[tripId]/accommodation/[id]` | PATCH | Organiser | Edit accommodation |
| `/api/trips/[tripId]/accommodation/[id]` | DELETE | Organiser | Delete accommodation |

### AI Chatbot
| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/claude` | POST | Authenticated | Proxy route for all Claude API calls; validates auth, enforces rate limits, logs to audit table |
| `/api/trips/[tripId]/chat` | GET | Member | Get chat history (last 50 messages) |
| `/api/trips/[tripId]/chat` | POST | Member | Send message; routes to chatbot agent |

### Shared View
| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/share/[shareToken]` | GET | Public | Validate share token; return trip ID for read-only access |

---

## 4. Services

### `parseService`
- Fetches documents from Supabase Storage for a trip
- Extracts text from PDFs using `pdf-parse`
- Constructs Document Parser Agent prompt with extracted text + trip context
- Calls `/api/claude` with parser agent instructions
- Parses JSON response; writes to `parsed_flights`, `parsed_accommodation`, `itinerary_events`, `action_alerts`
- Respects `is_locked = true` — never overwrites locked records
- Logs all calls to `ai_audit_log`
- Rate limit: 20 calls/trip/day (checked against audit log count)

### `chatService`
- Fetches trip data (flights, accommodation, itinerary, alerts) for context
- Fetches last 10 chat messages for conversation history
- Determines user role; applies mode (ANSWER or UPDATE)
- Constructs chatbot agent prompt
- Calls `/api/claude`
- If UPDATE mode + organiser confirmed: parses JSON update block, applies changes to DB
- Saves both user message and assistant reply to `chat_messages`
- Logs to `ai_audit_log`
- Rate limit: 100 messages/trip/day

### `alertService`
- Runs after every parse to detect gaps
- Checks: missing accommodation for date ranges covered by flights, date conflicts, traveller coverage gaps between legs
- Writes new `action_alerts` records; marks resolved alerts as `is_resolved = true`

### `storageService`
- Wraps Supabase Storage operations: upload, delete, get signed URL
- Enforces file size limit (10MB) and mime type whitelist
- Storage bucket: `documents`; path pattern: `trips/{tripId}/{docId}/{filename}`

---

## 5. Row-Level Security (RLS) Policies

All tables use Supabase RLS. Key policies:

| Table | Policy | Rule |
|---|---|---|
| `trips` | SELECT | `trip_members.user_id = auth.uid()` OR `share_token` matches |
| `trips` | INSERT/UPDATE/DELETE | `organiser_id = auth.uid()` |
| `trip_members` | SELECT | `user_id = auth.uid()` OR organiser of trip |
| `documents` | SELECT/INSERT/DELETE | Organiser only |
| `parsed_flights` | SELECT | Trip member |
| `parsed_flights` | INSERT/UPDATE/DELETE | Organiser only |
| `parsed_accommodation` | SELECT | Trip member |
| `parsed_accommodation` | INSERT/UPDATE/DELETE | Organiser only |
| `itinerary_events` | SELECT | Trip member |
| `itinerary_events` | INSERT/UPDATE/DELETE | Organiser only |
| `action_alerts` | SELECT | Trip member |
| `action_alerts` | UPDATE (resolve) | Organiser only |
| `chat_messages` | SELECT | Trip member |
| `chat_messages` | INSERT | Trip member |

---

## 6. Environment Variables

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # Server-side only; never expose to client

# Anthropic
ANTHROPIC_API_KEY=                 # Server-side only; never expose to client

# App
NEXT_PUBLIC_APP_URL=               # e.g. https://golazo.vercel.app
```

---

## 7. Folder Structure

```
golazo/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (app)/
│   │   ├── trips/
│   │   │   ├── page.tsx              # Trip list
│   │   │   ├── new/page.tsx
│   │   │   └── [tripId]/
│   │   │       ├── dashboard/page.tsx
│   │   │       ├── vault/page.tsx
│   │   │       ├── itinerary/page.tsx
│   │   │       ├── flights/page.tsx
│   │   │       ├── accommodation/page.tsx
│   │   │       ├── chat/page.tsx
│   │   │       └── settings/page.tsx
│   │   └── layout.tsx               # App shell with sidebar
│   ├── share/[tripId]/page.tsx       # Public read-only view
│   └── api/
│       ├── claude/route.ts           # Claude proxy
│       ├── trips/route.ts
│       ├── trips/[tripId]/
│       │   ├── route.ts
│       │   ├── vault/route.ts
│       │   ├── parse/route.ts
│       │   ├── itinerary/route.ts
│       │   ├── flights/route.ts
│       │   ├── accommodation/route.ts
│       │   └── chat/route.ts
│       └── share/[shareToken]/route.ts
├── components/
│   ├── ui/                          # Design system primitives
│   ├── trip/                        # Trip-specific components
│   ├── vault/
│   ├── itinerary/
│   ├── flights/
│   ├── accommodation/
│   └── chat/
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # Browser client
│   │   └── server.ts                # Server client (with service role)
│   ├── claude/
│   │   ├── parser-agent.ts          # Document parser prompts + calls
│   │   └── chatbot-agent.ts         # Chatbot prompts + calls
│   ├── services/
│   │   ├── parseService.ts
│   │   ├── chatService.ts
│   │   ├── alertService.ts
│   │   └── storageService.ts
│   └── utils/
│       ├── pdf-extract.ts           # PDF text extraction
│       └── rate-limit.ts            # Rate limit checker
├── middleware.ts                     # Session guard
├── types/
│   └── database.ts                  # Generated Supabase types
└── .env.local
```

---

*Document generated as part of CEREBRO Build OS — Phase 2 output.*

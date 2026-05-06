# Golazo — Security Checklist

---

## 1. Authentication

| Item | Implementation | Status |
|---|---|---|
| Auth provider | Supabase Auth (email + password) | ✅ Specified |
| Session management | Supabase session stored in HTTP-only cookie via SSR helpers | ✅ Specified |
| Session expiry | Supabase default: 1 hour access token; 7-day refresh token | ✅ Default |
| Password minimum requirements | Min 8 characters enforced at client + Supabase level | ⚠️ Define policy |
| Password reset | Via Supabase email link; valid 1 hour | ✅ Specified |
| Email confirmation | Required before access granted | ✅ Standard Supabase |
| Brute force protection | Supabase built-in rate limiting on auth endpoints | ✅ Built-in |
| Logout | Clears session token client-side and Supabase server-side | ✅ Specified |
| API key exposure | `ANTHROPIC_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` server-side only; never in client bundle | ✅ Specified |

---

## 2. Authorisation & RBAC

### Role Model

| Role | Permissions |
|---|---|
| **Organiser** | Full CRUD on all trip data (documents, flights, accommodation, itinerary, settings, members); can delete trip; can generate share link; can trigger parse; can execute chatbot edits |
| **Member** | Read-only on all trip data; can send chat messages (ANSWER mode only); cannot edit, delete, or trigger parse |
| **Public (share link)** | Read-only trip view without login; no chat; no documents; uses `share_token` to identify trip |
| **Unauthenticated** | Access to `/login`, `/signup`, `/reset-password`, `/share/[tripId]` only |

### Supabase Row-Level Security
- All tables have RLS enabled — no table is accessible without a valid policy match
- Organiser-only operations enforced via `auth.uid() = trips.organiser_id`
- Member read access: `EXISTS (SELECT 1 FROM trip_members WHERE trip_id = ... AND user_id = auth.uid())`
- Service role key (`SUPABASE_SERVICE_ROLE_KEY`) used only server-side for parsing pipeline writes; never in client-side code
- `/api/claude` proxy validates `auth.uid()` from session before passing any request to Claude API

### Server-Side Route Guards
- All `/api/trips/[tripId]/*` routes validate session + trip membership before processing
- Organiser-only routes (`/parse`, vault DELETE/PUT, settings) return 403 if requester is not organiser
- Share link routes (`/share/*`) bypass auth but enforce read-only; no mutation endpoints accessible

---

## 3. Encryption

| Layer | Implementation |
|---|---|
| In transit | HTTPS enforced by Vercel + Supabase (TLS 1.2+) |
| At rest | Supabase Postgres data encrypted at rest (AES-256) by default |
| File storage (vault) | Supabase Storage encrypted at rest |
| Secrets management | `.env.local` locally; Vercel Environment Variables for production; never committed to git |
| `.gitignore` | `.env.local`, `.env`, `.env*.local` must be listed |
| API key rotation | `ANTHROPIC_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` should be rotated if suspected exposure |

---

## 4. Input Validation

| Input | Validation Rule |
|---|---|
| File uploads | Mime type whitelist: `application/pdf`, `text/plain`; max size 10MB; filename sanitised before storage |
| File names | Strip path traversal characters (`../`, `/`, etc.); normalise to alphanumeric + extension |
| Trip name, event title | Max 500 chars; HTML stripped server-side |
| Text areas (description, notes) | Max 5000 chars; no raw HTML stored; escaped on render |
| Date/time fields | Validated as ISO 8601 dates; server rejects invalid formats |
| Chat messages | Max 2000 chars; stripped of control characters before sending to Claude |
| URL parameters (`tripId`, `docId`) | Validated as UUIDs; reject non-UUID values with 400 |
| Share token | Validated as UUID; matched against DB; no other data exposed on mismatch |
| Claude API output | JSON schema validated before writing to DB; bad JSON triggers retry then graceful failure |

---

## 5. OWASP Top 10 Coverage

| # | Risk | Coverage in Golazo |
|---|---|---|
| A01 | Broken Access Control | ✅ Supabase RLS on all tables; server-side role checks on all API routes; 403 on unauthorised access |
| A02 | Cryptographic Failures | ✅ HTTPS enforced; AES-256 at rest; no sensitive data in URLs; API keys server-side only |
| A03 | Injection | ✅ Supabase JS client uses parameterised queries (no raw SQL); file names sanitised; Claude outputs schema-validated |
| A04 | Insecure Design | ✅ Role model designed upfront; RLS as enforcement layer; no privilege escalation path |
| A05 | Security Misconfiguration | ⚠️ Supabase RLS policies must be tested with both roles before launch; Vercel env vars audited |
| A06 | Vulnerable Components | ⚠️ `npm audit` must be run before V1 launch; dependency updates scheduled monthly |
| A07 | Auth & Session Failures | ✅ Supabase Auth handles session lifecycle; no custom session management |
| A08 | Software & Data Integrity | ✅ Claude API called server-side only; no client-side code execution of external data |
| A09 | Logging & Monitoring | ✅ `ai_audit_log` captures all Claude calls; Supabase query logs available; Vercel function logs |
| A10 | Server-Side Request Forgery | ✅ No server-side URL fetching from user input; all external calls (Supabase, Claude) use hardcoded endpoints |

---

## 6. File Upload Security

| Concern | Mitigation |
|---|---|
| Malicious file content | Files stored in Supabase Storage; never executed on server; only text extracted via `pdf-parse` |
| Path traversal in file name | File names sanitised; storage path uses `{tripId}/{docId}/{sanitised_name}` |
| Oversized uploads | 10MB limit enforced at API route level before Storage write |
| Unauthenticated upload | `/api/trips/[tripId]/vault` requires valid organiser session |
| Serving files to wrong user | Supabase Storage signed URLs scoped to session; RLS applied |
| PDF parsing exploits | `pdf-parse` used for text extraction only; no rendering or execution |

---

## 7. AI-Specific Security

| Concern | Mitigation |
|---|---|
| Prompt injection via document content | Claude parser treats document text as data, not instructions; system prompt clearly separates instruction and data context |
| API key exposure | `ANTHROPIC_API_KEY` stored server-side only; never in client bundle or response |
| Claude hallucination in ANSWER mode | Chatbot instructed: answer only from trip data; null response if not found |
| Unauthorised chatbot edits | UPDATE mode gated on: (1) organiser role, (2) explicit confirmation before execution |
| Rate limit abuse | 20 parser calls/trip/day; 100 chat messages/trip/day enforced in `ai_audit_log` |
| Data leakage via Claude | Trip data sent to Claude API only — review Anthropic's data usage policy; no PII beyond trip context |
| Audit trail | All inputs and outputs logged to `ai_audit_log` with timestamps and user ID |

---

## 8. API Security Headers

All responses from Next.js API routes must include:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

Configure in `next.config.js` under `headers()`.

---

## 9. Shared Link Security

| Concern | Mitigation |
|---|---|
| Guessable share token | Token is a UUID v4 (122 bits of entropy); not sequential |
| Token enumeration | 404 returned if token not found — no distinction between "wrong token" and "trip deleted" |
| Read-only enforcement | Share link routes have no mutation endpoints; API enforces read-only |
| Token invalidation | Organiser can regenerate `share_token` from trip settings; old token becomes invalid |
| No login required | Public share view intentional; no personal data beyond trip details exposed |

---

## 10. Compliance

### GDPR (applicable if any EU users)

| Requirement | Implementation |
|---|---|
| Data minimisation | Only name, email, and travel doc content collected; no tracking pixels |
| Right to erasure | Trip deletion removes all associated data; account deletion removes profile |
| Data residency | ⚠️ Supabase region must be confirmed (default may be US); select EU region if required |
| Third-party processors | Anthropic (Claude API), Supabase, Vercel — ensure DPAs in place |
| Privacy policy | ⚠️ Must be drafted before public launch |
| Cookie consent | ⚠️ Session cookies are functional (exempt); if analytics added later, consent banner required |

### SOC 2 (aspirational for V2+)

| Area | Note |
|---|---|
| Logging | `ai_audit_log` provides AI-specific audit trail; Supabase and Vercel logs cover infrastructure |
| Access control | RLS + role model established; formal access control policy needed for SOC 2 |
| Incident response | ⚠️ No formal IR plan for V1; recommended before any enterprise use |

---

## 11. Incident Response (Minimum Viable)

| Step | Action |
|---|---|
| API key compromised | Immediately rotate `ANTHROPIC_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel env vars |
| Data breach suspected | Disable RLS-bypass service role; audit `ai_audit_log`; notify affected users |
| Supabase outage | App degrades gracefully (read from cache where possible); status page: status.supabase.com |
| Vercel outage | status.vercel.com; no user action required |
| Malicious upload detected | Remove file from storage; revoke vault access for trip; review parse logs |

---

## 12. Pre-Launch Security Checklist

- [ ] All RLS policies tested with organiser account AND member account (including share token)
- [ ] `.env.local` not committed to git; `.gitignore` confirmed
- [ ] `npm audit` run; no critical vulnerabilities
- [ ] API security headers configured in `next.config.js`
- [ ] Supabase Storage bucket is private (not public)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` not present in any client-side code or Next.js `NEXT_PUBLIC_` variable
- [ ] `ANTHROPIC_API_KEY` not present in any client-side code
- [ ] Rate limits tested: parser 20/day, chat 100/day
- [ ] File upload: 10MB limit enforced; mime type validation tested
- [ ] Share token: old token invalidated after regeneration
- [ ] 403 returned for organiser-only routes when accessed by member
- [ ] Claude parser tested with adversarial PDF content (prompt injection attempt)

---

*Document generated as part of CEREBRO Build OS — Phase 2 output.*

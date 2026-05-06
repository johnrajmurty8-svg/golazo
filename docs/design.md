# Golazo — UI Design Guide (DESIGN.md)

---

## 1. Design Direction

Warm, confident, and intelligent. Golazo is a planning tool that should feel like a smart travel companion — not a spreadsheet. The aesthetic combines warm off-white surfaces with bold typographic hierarchy and a vibrant orange primary action colour. Visual wayfinding uses country flags, trip thumbnails, and avatar stacks to make group trips feel human and alive.

**Reference aesthetic:** app.designyow.com — card-based content, left sidebar navigation, clean data tables with generous spacing.

---

## 2. Design Tokens

### Colours

| Token | Hex | Usage |
|---|---|---|
| `--color-primary` | `#F26419` | Primary actions (CTA buttons, active nav, badges) |
| `--color-primary-hover` | `#D4521A` | Button hover state |
| `--color-primary-light` | `#FEF0E7` | Alert backgrounds, highlight fills |
| `--color-bg` | `#F9F7F4` | App background (warm off-white) |
| `--color-surface` | `#FFFFFF` | Card surfaces, panels, modals |
| `--color-surface-secondary` | `#F3F1EE` | Hover states on cards, secondary surfaces |
| `--color-border` | `#E5E2DC` | Card borders, table dividers, input borders |
| `--color-border-strong` | `#C8C4BC` | Dividers, focused input borders |
| `--color-text-primary` | `#1A1714` | Headings, key data |
| `--color-text-secondary` | `#6B6560` | Labels, captions, secondary text |
| `--color-text-muted` | `#A39D97` | Placeholder text, disabled states |
| `--color-success` | `#2D9E6B` | Confirmed, complete, parsed states |
| `--color-success-bg` | `#E8F7F0` | Success badge backgrounds |
| `--color-warning` | `#D97706` | Confidence flags, action alerts |
| `--color-warning-bg` | `#FFFBEB` | Warning badge backgrounds |
| `--color-danger` | `#DC2626` | Delete actions, error states |
| `--color-danger-bg` | `#FEF2F2` | Error badge backgrounds |
| `--color-sidebar-bg` | `#1A1714` | Left sidebar background |
| `--color-sidebar-text` | `#F9F7F4` | Sidebar text |
| `--color-sidebar-active` | `#F26419` | Active nav item indicator |
| `--color-sidebar-hover` | `#2C2724` | Nav item hover |

### Typography

| Token | Value | Usage |
|---|---|---|
| `--font-family` | `'Inter', sans-serif` | All body + UI text |
| `--font-family-heading` | `'Inter', sans-serif` | Headings (use weight to differentiate) |
| `--font-size-xs` | `11px` | Labels, badges, captions |
| `--font-size-sm` | `13px` | Secondary body, table cells, metadata |
| `--font-size-base` | `15px` | Primary body text |
| `--font-size-md` | `17px` | Section titles, nav items |
| `--font-size-lg` | `20px` | Page subtitles, card headings |
| `--font-size-xl` | `24px` | Page headings |
| `--font-size-2xl` | `30px` | Dashboard hero numbers (countdown) |
| `--font-size-3xl` | `38px` | Hero/title page text |
| `--font-weight-regular` | `400` | Body text |
| `--font-weight-medium` | `500` | Labels, nav items |
| `--font-weight-semibold` | `600` | Card titles, column headers |
| `--font-weight-bold` | `700` | Page headings, key metrics |
| `--line-height-tight` | `1.2` | Display text, large numbers |
| `--line-height-normal` | `1.5` | Body text |
| `--line-height-relaxed` | `1.75` | Long-form descriptions |

### Spacing

| Token | Value |
|---|---|
| `--space-1` | `4px` |
| `--space-2` | `8px` |
| `--space-3` | `12px` |
| `--space-4` | `16px` |
| `--space-5` | `20px` |
| `--space-6` | `24px` |
| `--space-8` | `32px` |
| `--space-10` | `40px` |
| `--space-12` | `48px` |
| `--space-16` | `64px` |

### Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `4px` | Badges, small inputs |
| `--radius-md` | `8px` | Buttons, input fields |
| `--radius-lg` | `12px` | Cards, panels |
| `--radius-xl` | `16px` | Modals, large cards |
| `--radius-full` | `9999px` | Avatars, pill badges |

### Shadows

| Token | Value | Usage |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.06)` | Subtle card lift |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.08)` | Cards, dropdowns |
| `--shadow-lg` | `0 8px 24px rgba(0,0,0,0.12)` | Modals, popovers |
| `--shadow-focus` | `0 0 0 3px rgba(242,100,25,0.2)` | Focus ring (orange) |

---

## 3. Breakpoints & Responsive Behaviour

| Breakpoint | Width | Layout Behaviour |
|---|---|---|
| `xs` | < 480px | Single column; sidebar hidden (drawer toggle); table horizontal scroll |
| `sm` | 480px–767px | Single column; sidebar drawer; simplified nav |
| `md` | 768px–1023px | Sidebar shown (collapsed, icons only); no right panel |
| `lg` | 1024px–1279px | Full sidebar; main content; no right panel |
| `xl` | ≥ 1280px | Full sidebar + right contextual panel visible |

**V1 Note:** Mobile layout (< 768px) is functional but not optimised. Full mobile-first redesign is a V2 deliverable. Min viewport width: 375px.

---

## 4. Component Specifications

### Sidebar

- Width: `260px` (desktop); collapses to drawer on mobile
- Background: `--color-sidebar-bg` (`#1A1714`)
- Padding: `--space-4` horizontal
- Logo area: `64px` height, `--font-size-lg`, bold, white
- Trip list items: `48px` height, `--font-size-sm`, with 32×32px thumbnail image, left padding `--space-4`
- Countdown badge: right-aligned; background `--color-primary`; `--radius-full`; `10px` font
- Nav items: `44px` height; left border `3px` solid `--color-sidebar-active` when active; hover background `--color-sidebar-hover`
- Avatar + user name at bottom: fixed position; `--space-4` padding

### Cards

- Background: `--color-surface`
- Border: `1px solid var(--color-border)`
- Border radius: `--radius-lg`
- Shadow: `--shadow-md`
- Padding: `--space-6`
- Hover: shadow lifts to `--shadow-lg`; border colour to `--color-border-strong`

### Buttons

| Variant | Background | Text | Border | Hover |
|---|---|---|---|---|
| Primary | `--color-primary` | White | None | `--color-primary-hover` |
| Secondary | `--color-surface` | `--color-text-primary` | `--color-border` | `--color-surface-secondary` |
| Danger | `--color-danger-bg` | `--color-danger` | `--color-danger` | Darken 10% |
| Ghost | Transparent | `--color-text-secondary` | None | `--color-surface-secondary` |

- Height: `36px` (sm), `40px` (default), `48px` (lg)
- Border radius: `--radius-md`
- Font: `--font-size-sm`, `--font-weight-medium`
- Focus: `--shadow-focus`
- Disabled: 40% opacity, cursor: not-allowed

### Input Fields

- Height: `40px`
- Border: `1px solid var(--color-border)`
- Border radius: `--radius-md`
- Padding: `--space-3` horizontal
- Font: `--font-size-base`
- Focus: border `--color-primary`; shadow `--shadow-focus`
- Error: border `--color-danger`; error message below in `--color-danger` `--font-size-sm`
- Placeholder: `--color-text-muted`

### Badges / Status Pills

- Border radius: `--radius-full`
- Padding: `2px 8px`
- Font: `--font-size-xs`, `--font-weight-medium`

| Status | Background | Text |
|---|---|---|
| Parsed / Success | `--color-success-bg` | `--color-success` |
| Flagged / Warning | `--color-warning-bg` | `--color-warning` |
| Unparsed / Neutral | `--color-surface-secondary` | `--color-text-secondary` |
| Error | `--color-danger-bg` | `--color-danger` |

### Data Tables

- Header row: background `--color-surface-secondary`; font `--font-size-sm`, `--font-weight-semibold`; `--color-text-secondary`
- Body rows: alternating white / `--color-bg`; `48px` min row height
- Cell padding: `--space-3` vertical, `--space-4` horizontal
- Border: `1px solid var(--color-border)` on rows only (no column separators)
- Editable cell (organiser): on click, cell background becomes white with `--shadow-focus` border
- Confidence flag icon: `⚠️` shown inline in cell; tooltip explains the flag

### Avatar Stack (Group Members)

- Avatar size: `32px` diameter; `--radius-full`
- Overlap: `-8px` horizontal margin (stack effect)
- Border: `2px solid var(--color-surface)` (separates stacked avatars)
- Overflow count: `+N` pill in `--color-surface-secondary`

### Action Alert Cards

- Border-left: `4px solid var(--color-warning)`
- Background: `--color-warning-bg`
- Border radius: `--radius-md`
- Padding: `--space-4`
- Icon: warning icon in `--color-warning`
- Title: `--font-size-sm`, `--font-weight-semibold`
- Description + suggested action: `--font-size-sm`, `--color-text-secondary`

### Countdown Badge (Dashboard Hero)

- Large number: `--font-size-3xl`, `--font-weight-bold`, `--color-primary`
- Label: "days to go", `--font-size-sm`, `--color-text-secondary`
- Background: `--color-primary-light`; padding `--space-6`; `--radius-xl`

---

## 5. Motion & Animation

| Element | Animation | Duration | Easing |
|---|---|---|---|
| Page transitions | Fade in (opacity 0→1) | 150ms | ease-out |
| Card hover | Shadow lift + scale 1.005 | 120ms | ease |
| Sidebar nav item hover | Background fill left-to-right | 100ms | ease |
| Modal open | Scale 0.96→1 + fade in | 180ms | cubic-bezier(0.16,1,0.3,1) |
| Toast notification | Slide in from bottom-right | 200ms | ease-out |
| Button press | Scale 0.97 | 80ms | ease |
| Loading skeleton | Shimmer left-to-right | 1.4s | ease-in-out (loop) |
| Alert card appear | Slide down + fade | 200ms | ease-out |

**Principle:** Motion should feel immediate and purposeful — never decorative. Reduce all durations by 50% when `prefers-reduced-motion: reduce` is active.

---

## 6. Iconography

- **Library:** Lucide React (consistent, minimal, open-source)
- **Size:** 16px (inline/small), 20px (default), 24px (page actions)
- **Stroke width:** 1.5px
- **Colour:** Inherit from parent text colour; `--color-primary` for active states

### Key Icon Assignments

| Icon | Usage |
|---|---|
| `Plane` | Flights section, flight records |
| `Building2` | Accommodation section, property records |
| `CalendarDays` | Itinerary, date fields |
| `FolderOpen` | Document vault |
| `MessageCircle` | AI Chat |
| `Settings` | Trip settings |
| `AlertTriangle` | Action alerts, confidence flags |
| `CheckCircle2` | Confirmed / parsed status |
| `Clock` | Time fields, countdown |
| `Users` | Group members, traveller count |
| `Plus` | Add actions |
| `Trash2` | Delete actions |
| `Pencil` | Edit actions |
| `Link` | Share link |
| `Upload` | File upload |

---

## 7. Responsive Layout Specs

### Sidebar
- `≥ 1024px`: Fixed left sidebar, always visible, `260px` wide
- `768px–1023px`: Icon-only sidebar, `64px` wide; hover shows label tooltip
- `< 768px`: Hidden; accessible via hamburger toggle → full-width drawer overlay

### Right Panel
- `≥ 1280px`: Shown, `280px` wide, fixed right
- `< 1280px`: Hidden; content accessible via contextual sheet/drawer

### Tables (Flights, Accommodation)
- `≥ 768px`: All columns visible
- `< 768px`: Horizontal scroll; key columns (route, date) pinned left

### Cards (Dashboard)
- `≥ 768px`: 2–3 column grid
- `< 768px`: Single column stack

---

*Document generated as part of CEREBRO Build OS — Phase 2 output.*

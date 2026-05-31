# UroScan

A mobile-first web app for scanning urine dipstick test strips, detecting 10 biomarkers via computer vision, and tracking urinalysis results over time.

## Features

- **Camera scan** — point your phone at a dipstick strip; the app crops each reagent pad, samples its colour, and classifies all 10 markers in one shot
- **AI-powered insights** — Claude generates plain-language health insights tailored to your result panel (no diagnosis language)
- **History & trends** — every test is persisted; sparkline charts track each marker over time
- **Share / export** — download results as a PDF or share a summary image
- **Demo mode** — the full app runs without a backend by serving mock data when Supabase keys are absent

## Tech stack

| Layer | Choice |
|---|---|
| Framework | SvelteKit 5 (Svelte runes) |
| Styling | TailwindCSS v4 (Vite plugin) |
| Backend / Auth | Supabase (Postgres + Auth) |
| Vision API | Roboflow (pad detection) |
| AI insights | Anthropic Claude API |
| UI primitives | bits-ui, svelte-sonner, Chart.js, Lucide |

## Getting started

### Prerequisites

- Node.js ≥ 20
- A [Supabase](https://supabase.com) project (optional — app runs in demo mode without it)
- A [Roboflow](https://roboflow.com) API key for the `urine-test-strips-main/24` model (optional)
- An [Anthropic](https://console.anthropic.com) API key for AI insights (optional)

### Install

```bash
git clone <repo-url>
cd gen-c
npm install
```

### Environment variables

Copy `.env` to `.env.local` and fill in your keys (`.env.local` is git-ignored):

```bash
cp .env .env.local
```

```env
PUBLIC_SUPABASE_URL=https://<project>.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_DB_URL=postgresql://postgres:<password>@db.<project>.supabase.co:5432/postgres

ROBOFLOW_API_KEY=<key>
ROBOFLOW_MODEL=urine-test-strips-main/24   # optional override

ANTHROPIC_API_KEY=<key>
```

When `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY` are absent the app boots in **demo mode**: all data is served from `src/lib/mock/data.ts` and auth uses a signed cookie (`uroscan-demo=1`).

### Database

Apply the schema to your Supabase project:

```bash
node scripts/db-apply.mjs
```

This runs `supabase/migrations/0001_init.sql` against `SUPABASE_DB_URL`.

### Run

```bash
npm run dev        # http://localhost:5173
npm run build      # production build
npm run preview    # preview production build
```

## Project structure

```
src/
├── app.css                  ← global styles, CSS custom properties
├── app.d.ts                 ← SvelteKit ambient types (locals, platform)
├── hooks.server.ts          ← supabase handle + authGuard
└── routes/
    ├── +layout.*            ← root layout, Supabase client, auth seeding
    ├── +page.*              ← landing redirect
    ├── (app)/               ← authenticated shell (TabBar, AppHeader)
    │   ├── dashboard/
    │   ├── history/
    │   ├── trends/
    │   └── profile/
    ├── auth/
    │   ├── signin/
    │   ├── signup/
    │   └── callback/        ← OAuth callback handler
    ├── scan/                ← fullscreen camera scan flow
    ├── results/[id]/        ← per-test detail panel
    └── api/
        ├── scan/            ← POST → Roboflow inference
        └── recommend/       ← POST → Claude AI insights

src/lib/
├── types.ts                 ← Test, MarkerResult, Profile, SessionUser, Status
├── config.ts                ← app-wide constants
├── components/              ← UI components
│   ├── AppHeader.svelte
│   ├── TabBar.svelte
│   ├── Sidebar.svelte
│   ├── MarkerRow.svelte
│   ├── ResultPanel.svelte
│   ├── ClaudeRecommendation.svelte
│   ├── VerdictRing.svelte
│   ├── TrendChart.svelte
│   ├── ReadingCard.svelte
│   └── Badge.svelte / Button.svelte
├── data/
│   ├── markers.ts           ← 10 marker keys + display metadata (MARKER_META, MARKER_ORDER)
│   └── tests.ts             ← all Supabase queries; null client returns mock data
├── mock/
│   └── data.ts              ← demo-mode fixture tests + user
├── scan/
│   ├── analyze.ts           ← buildPanel() (CIE76 ΔE colour matching) + summarize()
│   ├── chart.ts             ← reference colour chart for all 10 markers × all statuses
│   └── sample.ts            ← crop + sample RGB from a detected pad
├── server/
│   ├── roboflow.ts          ← detectPads() — server-only Roboflow API call
│   └── demo.ts              ← demo-mode helpers
├── stores/
│   ├── auth.svelte.ts       ← authStore (Svelte 5 rune singleton)
│   └── theme.svelte.ts      ← themeStore
├── supabase/
│   └── browser.ts           ← createBrowserClient helper
├── ui/
│   └── status.ts            ← STATE tokens, panelScore(), countByStatus(), overallHeadline()
└── utils/
    ├── cn.ts                ← clsx + tailwind-merge helper
    └── format.ts            ← date / number formatting helpers

static/
├── favicon.svg
├── brand/                   ← logo SVGs
└── fonts/                   ← SF Pro Display OTF files

supabase/
└── migrations/
    └── 0001_init.sql        ← profiles, tests, results tables + RLS policies

scripts/
└── db-apply.mjs             ← runs migrations against SUPABASE_DB_URL
```

## Scan pipeline

```
Camera frame (JPEG/base64)
        │
        ▼
POST /api/scan
        │  server-side
        ▼
roboflow.ts → detectPads()
        │  returns SampledPad[] (class label + bounding box + sampled RGB)
        ▼
analyze.ts → buildPanel()
        │  CIE76 ΔE colour distance against chart.ts reference values
        │  → MarkerResult[] sorted in strip order
        ▼
summarize()
        │  plain-language summary + insights (no diagnosis language)
        ▼
result stored in Supabase → redirect to /results/[id]
```

## Authentication

`hooks.server.ts` chains two handles:
1. **`supabase`** — attaches `locals.supabase` (request-scoped client) and `locals.safeGetSession()`
2. **`authGuard`** — redirects unauthenticated requests for routes in the `PROTECTED` array

In demo mode both handles are short-circuited: `locals.supabase` is `null` and the session is a signed cookie.

## Markers

The 10 reagent pads detected per strip, in strip order:

| # | Key | Display name |
|---|-----|--------------|
| 1 | `leukocytes` | Leukocytes |
| 2 | `nitrite` | Nitrite |
| 3 | `urobilinogen` | Urobilinogen |
| 4 | `protein` | Protein |
| 5 | `ph` | pH |
| 6 | `blood` | Blood |
| 7 | `specific_gravity` | Specific Gravity |
| 8 | `ketone` | Ketone |
| 9 | `bilirubin` | Bilirubin |
| 10 | `glucose` | Glucose |

Each marker is classified as `normal`, `borderline`, or `abnormal`. The health score weights are 1.0 / 0.62 / 0.15.

## Development commands

```bash
npm run dev           # Vite dev server
npm run build         # production build
npm run preview       # preview production build
npm run check         # TypeScript + Svelte type-check
npm run check:watch   # type-check in watch mode
npm run lint          # Prettier check
npm run format        # Prettier write
```

## Contributing

The codebase uses **Svelte 5 runes** (`$state`, `$derived`, `$props`, `$effect`) project-wide — do not mix in the legacy Options API.

- All Supabase data calls go through `src/lib/data/tests.ts`; pass `null` as the client to get mock data — never branch on demo mode at the call site
- Server-only secrets (Roboflow, Anthropic keys) must stay in `src/lib/server/` files
- Use the `cn()` helper for conditional Tailwind classes
- Status visual tokens are CSS custom properties (`--color-normal`, `--color-watch`, `--color-alert`) — don't hardcode hex colours in components

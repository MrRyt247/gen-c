# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**UroScan** is a SvelteKit 5 mobile-first app that lets users scan urine dipstick test strips, detect 10 biomarkers via computer vision, and track results over time.

## Commands

All commands run from the repo root:

```bash
npm run dev          # dev server (http://localhost:5173)
npm run build        # production build
npm run preview      # preview the production build
npm run check        # TypeScript + Svelte type-check
npm run check:watch  # type-check in watch mode
npm run lint         # Prettier check
npm run format       # Prettier write
```

There is no test suite currently.

## Environment variables

Create `.env.local` at the repo root:

```
PUBLIC_SUPABASE_URL=...
PUBLIC_SUPABASE_ANON_KEY=...
ROBOFLOW_API_KEY=...
ROBOFLOW_MODEL=urine-test-strips-main/24   # optional override
```

When `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY` are absent the app boots in **demo mode**: all data is served from `$lib/mock/data.ts` and auth is a signed cookie (`uroscan-demo=1`). This means the whole app is explorable without a backend.

## Architecture

### Route layout

```
src/routes/
  +layout.svelte / +layout.ts / +layout.server.ts   ← root layout, Supabase client, auth seeding
  +page.svelte / +page.ts                            ← landing / redirect
  (app)/                                             ← authenticated shell (TabBar, AppHeader)
    dashboard/
    history/
    trends/
    profile/
  auth/signin/  auth/signup/
  scan/                                              ← camera scan flow (fullscreen overlay)
  results/[id]/                                      ← per-test detail panel
  api/scan/+server.ts                                ← POST endpoint → Roboflow inference
```

### Auth & backend abstraction

`src/hooks.server.ts` runs two sequential handles (`supabase` then `authGuard`). It attaches a request-scoped `locals.supabase` client and a `locals.safeGetSession()` helper — or `null` + cookie-based session in demo mode. Protected routes are declared in the `PROTECTED` array at the top of that file.

All Supabase data queries go through `$lib/data/tests.ts`. Every function accepts `supabase: SupabaseClient | null`; a null client returns mock data from `$lib/mock/data.ts`, so call sites don't need to branch.

### Scan pipeline

1. `POST /api/scan` receives a base64 image → calls `$lib/server/roboflow.ts:detectPads()` (server-only, key stays private).
2. `$lib/scan/analyze.ts:buildPanel()` takes `SampledPad[]`, matches each pad's sampled RGB against the reference chart in `$lib/scan/chart.ts` using CIE76 ΔE colour distance, and returns a `MarkerResult[]` panel in strip order.
3. `summarize()` in the same file produces plain-language `summary` + `insights` strings without any diagnosis language.

### State management

Svelte 5 **runes** are enabled project-wide (`svelte.config.js` sets `runes: true` for all non-`node_modules` files). Global singletons live in `$lib/stores/`: `authStore` (seeded by root layout from server data, kept in sync via `supabase.auth.onAuthStateChange`) and `themeStore`.

### Domain types

All shared types are in `$lib/types.ts`: `Test`, `MarkerResult`, `Profile`, `SessionUser`, `MarkerKey`, `Status`. The 10 marker keys and their display metadata live in `$lib/data/markers.ts`.

### UI conventions

- Status uses three states: `normal` / `borderline` / `abnormal`. Visual tokens (`--color-normal`, `--color-watch`, `--color-alert`, etc.) are CSS custom properties consumed via `$lib/ui/status.ts:STATE`.
- `panelScore()` converts a result array to a 0–100 health score (normal=1, borderline=0.62, abnormal=0.15 weighting).
- Components are in `$lib/components/`. Helper `cn()` (`$lib/utils/cn.ts`) merges Tailwind classes with `clsx` + `tailwind-merge`.
- TailwindCSS v4 (Vite plugin, no `tailwind.config.js`), bits-ui for accessible primitives, svelte-sonner for toasts, Chart.js for trend charts, Lucide Svelte for icons.

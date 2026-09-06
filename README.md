# cloud-control-plane-web

React console for the [Cloud Control Plane](../cloud-control-plane-api)
project — see that repo's `docs/implementation-plan.md` for the full design
and phase plan.

**Status:** Phase 1 and 2 done. Application shell, navigation, and the S3
list/create/delete workflow are implemented against the real backend API,
with loading/empty/error states and light/dark theming throughout, plus a
real Playwright E2E suite (`tests/e2e/`) driving the app in a browser
against a live backend.

## Quickstart

Requires `cloud-control-plane-api` running (see its README —
`docker compose up --build`, or run it standalone).

```bash
npm install
npm run dev
```

Opens on `http://localhost:5173`. The dev server proxies `/api` and
`/health` to `http://localhost:8000` (see `vite.config.ts`), so no CORS
configuration or `.env` is needed for local development. Set
`VITE_API_BASE_URL` (see `.env.example`) only if the API is reachable at a
different host — e.g. a built/deployed bundle.

## Design system

A warm, editorial neutral palette (cream/charcoal with a single terracotta
accent) in the spirit of Anthropic's product design language — see
`src/index.css` for the token definitions and `tailwind.config.ts` for how
they're exposed as Tailwind classes. Every color a component uses comes
from a semantic token (`bg-surface`, `text-ink`, `border-border`, ...)
rather than a raw hex value, so light/dark mode is nothing more than
swapping the token values in one place.

Theme preference (light / dark / system) is set via the sun/monitor/moon
control in the top bar, persisted to `localStorage`, and applied before
first paint (see the inline script in `index.html`) so there's no flash of
the wrong theme on load. `src/theme/ThemeProvider.tsx` also tracks live OS
theme changes while "system" is selected.

## Architecture

```text
main.tsx                    — providers: ThemeProvider, QueryClientProvider, BrowserRouter
App.tsx                     — route table
components/layout/          — AppShell, Sidebar, TopBar, ThemeToggle, StatusPill
components/ui/               — Button, Dialog, Badge, EmptyState, ErrorState, Skeleton — generic, resource-agnostic
components/s3/               — BucketList, CreateBucketDialog, DeleteBucketDialog
pages/                       — DashboardPage, S3Page, NotFoundPage
api/                         — client.ts (fetch wrapper + ApiError), types.ts (mirrors the backend's Pydantic models), s3.ts
hooks/                       — useBuckets/useCreateBucket/useDeleteBucket (TanStack Query), useHealth
theme/                       — ThemeProvider
```

- **State management**: [TanStack Query](https://tanstack.com/query) owns
  all server state (buckets, health) — caching, loading/error states, and
  cache invalidation after mutations, rather than hand-rolled
  `useState`/`useEffect` data fetching. There's no separate client-state
  library; the only client state here (dialog open/closed, form input,
  theme preference) is small enough for plain `useState`/context.
- **API client** (`api/client.ts`): every non-2xx response is parsed into
  the backend's unified error shape and thrown as an `ApiError`
  (`code`/`message`/`requestId`/`retryable`) — components never handle a
  raw `fetch` rejection or an ad-hoc error shape.
- **BucketList is presentational**: it takes `buckets`/`isLoading`/`error`
  as props and decides what to render (skeleton, error, empty, or the
  table) — it doesn't call any hooks itself. `S3Page` is the only place
  that wires it to real data. This is why its tests (`BucketList.test.tsx`)
  don't need MSW or a QueryClientProvider at all.

## Tests

```bash
npm test          # vitest — 12 tests: BucketList, CreateBucketDialog, ThemeProvider
npm run lint
npm run typecheck
npm run build
```

- [MSW](https://mswjs.io) mocks the API at the network layer
  (`src/test/mocks/`), so `CreateBucketDialog`'s tests exercise the real
  TanStack Query mutation and `api/client.ts` code — not a mocked hook.
- `src/test/utils.tsx#renderWithProviders` wraps a component in a fresh
  `QueryClientProvider` (retries off) per test.

### End-to-end (Playwright)

```bash
# 1. start the real backend first (from cloud-control-plane-api):
./scripts/dev-up.sh

# 2. then, from this repo:
npx playwright install --with-deps chromium   # first time only
npm run test:e2e          # headless
npm run test:e2e:ui       # Playwright's UI mode, for debugging
```

Unlike the Vitest suite, these drive a real browser against a **real
running backend** — no MSW. See `tests/e2e/README.md` for what each spec
covers and why `resilience.spec.ts` uses network interception rather than
a real failure source (that's Phase 4).

## CI

`.github/workflows/ci.yml` has two jobs: `test` (lint, type check, unit
tests, build) and `e2e` (checks out the sibling API repo, brings up the
real `docker compose` stack, and runs the Playwright suite against it),
both on every push/PR to `main`.

## Roadmap

SQS, DynamoDB, EC2, and VPC are listed in the sidebar (badged "Soon") to
signal where this is headed, per the plan's resource roadmap — but nothing
backs them yet; only S3 is implemented end-to-end (Phase 1 scope). Phase 3
of the plan covers extracting `BucketList`/`CreateBucketDialog`'s patterns
into resource-agnostic components once a second resource exists to
generalize from.

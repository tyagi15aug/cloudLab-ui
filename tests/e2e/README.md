# E2E tests (Phase 2.3, extended through Phase 5)

[Playwright](https://playwright.dev) tests that drive the real app in a
real browser against a **real backend** — no MSW, no mocks, no network
interception anywhere in this suite as of Phase 4 (see the note below on
`resilience.spec.ts`, which used to be the exception).

## Running them

1. Start the backend first (from `cloud-control-plane-api`):
   ```bash
   ./scripts/dev-up.sh          # docker compose: real LocalStack + API
   ```
   Any way of getting a healthy API at `http://localhost:8000` works —
   `E2E_API_URL` overrides the address `global-setup.ts` checks.

2. From this repo:
   ```bash
   npx playwright install --with-deps chromium   # first time only
   npm run test:e2e
   ```
   Playwright starts the Vite dev server itself (`playwright.config.ts`'s
   `webServer`), so you don't need `npm run dev` running separately.

## What's here

| File | Covers |
|---|---|
| `s3.spec.ts` | Create/list/delete lifecycle, client-side validation, a server-side error rendered through the real error envelope |
| `sqs.spec.ts` | Create queue → send → receive → delete message → delete queue, plus client-side name validation |
| `dynamodb.spec.ts` | Create table → put item (including a float, to catch the `Decimal` round-trip bug) → delete item → delete table, plus client-side validation |
| `theme.spec.ts` | Light/dark toggle, and that the choice survives a reload (the pre-paint script in `index.html`) |
| `failure-injection.spec.ts` | The Developer Tools page itself: inject a rule through the UI, watch a real resource action fail because of it, clear it, watch it succeed |
| `resilience.spec.ts` | UI behavior on a failed list load, a failed create, and artificial latency — now driven by the real failure-injection API, see the note below |
| `operations.spec.ts` | The Operations page (Phase 5): a real resource action shows up in history/metrics, an injected failure appears with its error code, the detail dialog, and Clear history |
| `global-setup.ts` | Fails fast with a clear message if no backend is reachable, instead of 20 confusing timeouts |

## A note on sqs.spec.ts and message polling

SQS's `ReceiveMessage` isn't an idempotent "list" — it hides what it
returns from other `ReceiveMessage` calls for the queue's visibility
timeout. During Phase 3 development this caused a real bug (a sent message
would seem to vanish) traced to TanStack Query's `invalidateQueries` doing
prefix-key matching and triggering an unwanted extra receive; see the fix
and comments in `src/hooks/useQueues.ts`. `sqs.spec.ts` is written to
respect the same constraint: it clicks "Receive messages" exactly once
after sending, rather than polling in a loop, so the test can't reintroduce
the same race it exists to guard against.

## resilience.spec.ts now drives the real failure-injection API

`resilience.spec.ts` used to simulate backend failures at the network layer
with Playwright's `page.route()`, because no real failure source existed
yet. Phase 4 added one — `/api/dev/failures`
(`cloud-control-plane-api/app/core/failure_injection.py`) sits inside
`ProviderService._call()`, the same seam every resource service's calls
already funnel through, so a rule posted there really does make the next
matching call fail. Every test in this file now uses Playwright's built-in
`request` fixture to POST/DELETE real rules before/after driving the UI —
the honest end-to-end version of what route interception used to stand in
for: real HTTP request → `ProviderService._call()` → injected `AppError` →
real error envelope → UI error state. Each test clears every rule in
`finally` so a failure can't leak into whichever spec runs next (all E2E
specs share one backend process and its process-wide failure registry).

## operations.spec.ts and cross-spec state

`/api/dev/operations` (Phase 5) is a process-wide history shared by every
spec in this suite, the same way `/api/dev/failures`'s rule registry is —
so `operations.spec.ts` clears it in both `beforeEach` and `afterEach`
rather than just one or the other: `beforeEach` so an earlier spec's
requests can't inflate a count this file asserts on, `afterEach` so this
file doesn't leave operations behind for whichever spec runs next.

## Environment note

This sandbox can't pull Docker images (see the API repo's README), so these
suites were authored and verified here against `moto.server` standing in
for LocalStack — a real HTTP server, just not LocalStack's own image. CI
(`.github/workflows/ci.yml`) runs the real `docker compose up` stack, which
GitHub-hosted runners can pull normally.

# E2E tests (Phase 2.3)

[Playwright](https://playwright.dev) tests that drive the real app in a
real browser against a **real backend** — no MSW, no mocks, except where a
test explicitly intercepts the network to simulate a failure the backend
can't currently produce on demand (see `resilience.spec.ts`).

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
| `resilience.spec.ts` | UI behavior on a failed list load and a failed create — see the note below |
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

## Why route interception for "resilience"

Phase 4 of the plan adds a real failure-injection layer *inside* the
backend (`AppError`s triggered on demand — 500s, timeouts, throttling —
between the provider and LocalStack). Until that exists, `resilience.spec.ts`
simulates the same failures at the network layer with Playwright's
`page.route()`, which is honest about what it's testing (the UI's handling
of a given HTTP response) without pretending there's a real failure source
yet. Once Phase 4 ships, the equivalent tests belong here too, switched to
drive the real injection API instead of intercepting requests.

## Environment note

This sandbox can't pull Docker images (see the API repo's README), so these
suites were authored and verified here against `moto.server` standing in
for LocalStack — a real HTTP server, just not LocalStack's own image. CI
(`.github/workflows/ci.yml`) runs the real `docker compose up` stack, which
GitHub-hosted runners can pull normally.

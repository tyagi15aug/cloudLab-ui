# cloud-control-plane-web

React console for the [Cloud Control Plane](../cloud-control-plane-api)
project — see that repo's `docs/implementation-plan.md` for the full design
and phase plan.

**Status:** Phases 1–4 done. Application shell, navigation, and S3, SQS,
and DynamoDB workflows are implemented against the real backend API, with
loading/empty/error states and light/dark theming throughout, plus a real
Playwright E2E suite (`tests/e2e/`) driving the app in a browser against a
live backend. SQS and DynamoDB share the same resource-list/dialog/table
primitives S3 introduced in Phase 1 — see "Architecture" and "Phase 3"
below for how that reuse works. A Developer Tools page (Phase 4) can inject
real backend failures (500s, timeouts, throttling, latency, connection
failures) into any resource operation on demand — see "Phase 4" below.

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
components/ui/               — Button, Dialog, Badge, EmptyState, ErrorState, Skeleton, FormField — generic, resource-agnostic
components/resource/         — ResourceTable, ResourceListSection, ConfirmDialog, Pagination, SummaryCard — Phase 3's shared resource primitives
components/s3/               — BucketList, CreateBucketDialog, DeleteBucketDialog
components/sqs/               — QueueList, CreateQueueDialog, SendMessageDialog
components/dynamodb/          — TableList, CreateTableDialog, PutItemDialog
pages/                       — DashboardPage, S3Page, SqsPage, QueueDetailPage, DynamoDbPage, TableDetailPage, DeveloperToolsPage, NotFoundPage
api/                         — client.ts (fetch wrapper + ApiError), types.ts (mirrors the backend's Pydantic models), s3.ts, sqs.ts, dynamodb.ts, dev.ts (Phase 4)
hooks/                       — useBuckets/useCreateBucket/useDeleteBucket, useQueues/useMessages/useSendMessage, useTables/useItems/usePutItem, useFailures/useCreateFailure/useDeleteFailure (all TanStack Query), useCursorPager, useHealth
theme/                       — ThemeProvider
```

- **State management**: [TanStack Query](https://tanstack.com/query) owns
  all server state (buckets, queues, tables, health) — caching,
  loading/error states, and cache invalidation after mutations, rather
  than hand-rolled `useState`/`useEffect` data fetching. There's no
  separate client-state library; the only client state here (dialog
  open/closed, form input, theme preference) is small enough for plain
  `useState`/context.
- **API client** (`api/client.ts`): every non-2xx response is parsed into
  the backend's unified error shape and thrown as an `ApiError`
  (`code`/`message`/`requestId`/`retryable`) — components never handle a
  raw `fetch` rejection or an ad-hoc error shape.
- **Resource list components are presentational**: `BucketList`,
  `QueueList`, and `TableList` each take `data`/`isLoading`/`error` as
  props and decide what to render — they don't call any hooks themselves.
  Each resource's page (`S3Page`, `SqsPage`, `DynamoDbPage`) is the only
  place that wires its list to real data. This is why their tests don't
  need MSW or a `QueryClientProvider` at all — only a `MemoryRouter`, since
  each list renders a `Link` to its resource's detail page.

## Tests

```bash
npm test          # vitest — 66 tests across S3, SQS, DynamoDB, Developer Tools components, shared resource primitives, and ThemeProvider
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
running backend** — no MSW. `sqs.spec.ts` and `dynamodb.spec.ts` cover
their full create → use → delete lifecycles, including a float-value item
in DynamoDB (guarding the backend's `Decimal` round-trip) and a careful
single "Receive messages" click in SQS (see `tests/e2e/README.md`'s note
on why). `failure-injection.spec.ts` and `resilience.spec.ts` drive the
real `/api/dev/failures` endpoint (Phase 4) rather than any network
interception — see `tests/e2e/README.md` for what each spec covers.

## CI

`.github/workflows/ci.yml` has two jobs: `test` (lint, type check, unit
tests, build) and `e2e` (checks out the sibling API repo, brings up the
real `docker compose` stack, and runs the Playwright suite against it),
both on every push/PR to `main`.

## Phase 3 — SQS, DynamoDB, and the shared resource components

Phase 3's exit criterion was that adding a new resource should need
significantly less duplicated UI code than the first one did. The approach
here was to build the shared primitives *before* SQS or DynamoDB existed
to prove they generalize, retrofit S3 onto them, and only then build the
new resources on top:

1. **Extract first, from S3 alone.** `ResourceTable`/`ResourceListSection`
   (the loading/error/empty/table state machine originally inline in
   `BucketList`), `ConfirmDialog` (generalized from `DeleteBucketDialog`),
   `Pagination` + `useCursorPager` (cursor-stack pagination), `FormField` +
   `textInputClassName` (label/input/error layout), and `SummaryCard`
   (from `DashboardPage`'s dashboard tiles) all live in
   `components/resource/` and `components/ui/` now.
2. **Retrofit `BucketList` onto them with zero test changes.** Its
   external prop API (`buckets`/`isLoading`/`error`/`onDelete`/...) didn't
   change, and all of its existing tests passed unmodified against the
   refactored implementation — real evidence the extraction preserved
   behavior rather than just moving code around.
3. **Build SQS and DynamoDB on the same primitives.** `QueueList` and
   `TableList` are each ~40 lines of column definitions plus a
   `ResourceListSection` call — no re-implementation of skeleton/error/empty
   states. `CreateQueueDialog`/`SendMessageDialog`/`CreateTableDialog`/
   `PutItemDialog` are each a validation function plus `FormField`s. Delete
   confirmations for queues, tables, messages, and items are all the same
   `ConfirmDialog`, parameterized by title/message/danger.

The two resources also deliberately differ where the *domain* differs,
rather than forcing artificial uniformity (Phase 3.1's guidance):

- **SQS's queue list doesn't paginate** (`ListQueues` has no `next_cursor`
  in either the API or `QueueList`'s type) — an honest scope decision, not
  a missing feature, documented in the backend. DynamoDB's item list does,
  using the real `useCursorPager`/`Pagination` pair.
- **SQS messages are a "peek," not a live list.** `QueueDetailPage` says so
  directly in the UI, and the message list is fetched only on an explicit
  "Receive messages" click — never an automatic refetch. This came from a
  real bug: `ReceiveMessage` hides what it returns from other
  `ReceiveMessage` calls for the queue's visibility timeout, so an
  automatic refetch (originally triggered both by an explicit
  `invalidateQueries(messagesQueryKey)` and, subtler, by TanStack Query's
  *prefix-key matching* on `invalidateQueries(queuesQueryKey)` cascading
  into the nested `messagesQueryKey`) would silently consume a just-sent
  message and make it look like it never arrived. The fix, and the full
  story, is in `src/hooks/useQueues.ts`'s comments — every
  `queuesQueryKey`/`tablesQueryKey` invalidation in `useQueues.ts` and
  `useTables.ts` now passes `exact: true` for exactly this reason.
- **DynamoDB items are raw JSON**, edited via a plain JSON textarea
  (`PutItemDialog`) rather than a schema-aware form — items in this app are
  genuinely freeform (mirrors the backend's `ItemResource`), so a form that
  pretended to know a table's schema would be dishonest about what the API
  actually accepts.

EC2 and VPC remain in the sidebar (badged "Soon") for the resource
roadmap Phase 5+ covers.

## Phase 4 — Failure Injection

Phase 4's exit criterion (per the implementation plan) was a real failure
source the UI and E2E suite could drive on demand, with the guarantee that
no injected failure can leave the UI permanently stuck. The design:

1. **No new layer — reuse the existing seam.** The backend's
   `ProviderService._call()` (introduced in Phase 3 as the one method every
   resource operation already funnels through, for logging and error
   translation) is also where `failure_injector.apply()` is now consulted,
   before the real boto3 call runs. Every existing and future resource
   operation gets failure injection for free — nothing in `S3Service`,
   `SqsService`, or `DynamoDbService` changed at all.
2. **An in-memory, process-wide rule registry**, not persisted and not
   authenticated (deferred to a later phase — see the backend README).
   Rules match on `service`/`operation` with `"*"` wildcards (e.g. "fail
   every SQS operation"), and carry a `probability` and `delay_ms` so a
   rule can be partial or slow rather than absolute.
3. **`latency` and `timeout` are deliberately different failure types**,
   not synonyms: `latency` sleeps `delay_ms` and then lets the real call
   succeed — useful for testing that slow-but-working calls don't
   misrender as errors. `timeout` sleeps and then raises a retryable
   `PROVIDER_UNAVAILABLE`, simulating a call that was slow *and* ultimately
   failed.
4. **The Developer Tools page** (`/dev/failures`, sidebar-linked, not
   route-guarded) is a plain form over the same `useMutation`/`useQuery`
   patterns as every other page here — Service/Operation selects cascade
   (choosing a service resets the operation to "any"), a Failure type
   select shows a one-line description of what that failure does, and the
   active-rules table reuses `ResourceListSection` like every other
   resource list in this app, right down to per-row delete buttons.
5. **`resilience.spec.ts` went from simulated to real.** It used to
   intercept requests with `page.route()` because no real failure source
   existed; now that `/api/dev/failures` is real, it (and the new
   `failure-injection.spec.ts`) drive that endpoint directly with
   Playwright's built-in `request` fixture — see `tests/e2e/README.md` for
   the full story.

EC2 and VPC remain in the sidebar (badged "Soon") for the resource
roadmap Phase 5+ covers.

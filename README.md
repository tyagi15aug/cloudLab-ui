# cloud-control-plane-web

React console for the [Cloud Control Plane](../cloud-control-plane-api)
project — see that repo's `docs/implementation-plan.md` for the full design
and phase plan.

**Status:** Phases 1–5 done. Application shell, navigation, and S3, SQS,
and DynamoDB workflows are implemented against the real backend API, with
loading/empty/error states and light/dark theming throughout, plus a real
Playwright E2E suite (`tests/e2e/`) driving the app in a browser against a
live backend. SQS and DynamoDB share the same resource-list/dialog/table
primitives S3 introduced in Phase 1 — see "Architecture" and "Phase 3"
below for how that reuse works. A Developer Tools section adds a Failure
Injection page (Phase 4) that can inject real backend failures (500s,
timeouts, throttling, latency, connection failures) into any resource
operation on demand, and an Operations page (Phase 5) showing recent
requests, per-operation metrics, and a request detail view — see "Phase 4"
and "Phase 5" below.

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
pages/                       — DashboardPage, S3Page, SqsPage, QueueDetailPage, DynamoDbPage, TableDetailPage, DeveloperToolsPage, OperationsPage (Phase 5), NotFoundPage
api/                         — client.ts (fetch wrapper + ApiError), types.ts (mirrors the backend's Pydantic models), s3.ts, sqs.ts, dynamodb.ts, dev.ts (Phase 4), operations.ts (Phase 5)
hooks/                       — useBuckets/useCreateBucket/useDeleteBucket, useQueues/useMessages/useSendMessage, useTables/useItems/usePutItem, useFailures/useCreateFailure/useDeleteFailure, useOperations/useOperationMetrics/useClearOperations (all TanStack Query), useCursorPager, useHealth
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
npm test          # vitest — 71 tests across S3, SQS, DynamoDB, Developer Tools, Operations components, shared resource primitives, and ThemeProvider
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
interception, and `operations.spec.ts` (Phase 5) verifies a real resource
action shows up in `/api/dev/operations` and its metrics — see
`tests/e2e/README.md` for what each spec covers.

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
roadmap later phases cover.

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
roadmap later phases cover.

## Phase 5 — Observability and Operation Debugging

Phase 5's objective was to make the system explain what happened, per
Section 5 of the plan (request IDs, structured logs, operation history,
request detail, metrics). Requests IDs and structured logging already
existed from Phase 1 (`app/main.py`'s middleware, `app/core/logging.py`);
this phase adds the developer-facing surface on top of them:

1. **Same seam as Failure Injection, again.** `ProviderService._call()`
   already logs every operation's outcome — Phase 5 adds one more line
   there, `operation_recorder.record(...)`, right alongside it. Every
   resource operation is recorded with zero per-service code, the same way
   every operation already got failure injection for free in Phase 4. An
   operation that Phase 4 failure-injected shows up here too, since by the
   time `_call()` is logging the outcome, an injected `AppError` and a real
   translated one are indistinguishable — which is itself a nice property:
   the history panel shows *actual* behavior, not a sanitized view of it.
2. **An in-memory ring buffer plus cumulative counters**, not persisted —
   the same "process-wide singleton, `threading.Lock()`-guarded" pattern as
   the failure-injection registry (`app/core/operations.py`). The ring
   buffer caps recent history at 200 entries; separate running counters
   (total count, error count, duration sum, per-operation breakdown) are
   kept outside the buffer so `/api/dev/operations/metrics` stays accurate
   for the whole process lifetime even after old entries age out of
   history.
3. **The Operations page** (`/dev/operations`) shows four stat tiles
   (total requests, errors, error rate, average latency), a "Recent
   operations" table built on the same `ResourceListSection` every other
   resource list uses, and a "Details" action per row that opens a `Dialog`
   with the operation's full record — request ID, provider, resource,
   error code, retryable flag, and timestamp. This is the plan's Section
   5.3/5.4 in one page: history and detail view together, since the list
   response already carries everything the detail view needs.
4. **One deliberate exception to this app's `exact: true` invalidation
   rule.** Every other mutation in this codebase invalidates its query key
   with `exact: true` (see Phase 3's SQS bug below for why that convention
   exists). `useClearOperations` is the one intentional exception: clearing
   history is meant to invalidate both the operations list and its nested
   metrics query under the shared `["dev","operations"]` prefix, and unlike
   SQS's `ReceiveMessage`, both are idempotent GETs with no vanishing-data
   race to guard against — see `useOperations.ts`'s comment for the
   reasoning.

EC2 and VPC remain in the sidebar (badged "Soon") for the resource
roadmap later phases cover.

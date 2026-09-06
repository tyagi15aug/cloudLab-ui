import { useState } from "react";
import { ResourceListSection } from "../components/resource/ResourceListSection";
import type { ResourceColumn } from "../components/resource/ResourceTable";
import { TopBar } from "../components/layout/TopBar";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Dialog } from "../components/ui/Dialog";
import { Skeleton } from "../components/ui/Skeleton";
import type { OperationResource } from "../api/types";
import { useClearOperations, useOperationMetrics, useOperations } from "../hooks/useOperations";

function formatTimestamp(epochSeconds: number): string {
  return new Date(epochSeconds * 1000).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "medium" });
}

/** A plain metric tile (Phase 5.5) — deliberately not `SummaryCard`, which
 * links out to a resource page; these describe the process itself, not a
 * navigable resource. */
function StatTile({ label, value, tone }: { label: string; value: string; tone?: "danger" }) {
  return (
    <div className="rounded-xl border border-border bg-surface-raised p-5 shadow-soft">
      <p className={`text-2xl font-semibold ${tone === "danger" ? "text-danger" : "text-ink"}`}>{value}</p>
      <p className="mt-1 text-sm text-ink-muted">{label}</p>
    </div>
  );
}

const columns: ResourceColumn<OperationResource>[] = [
  { key: "time", header: "Time", render: (r) => formatTimestamp(r.timestamp) },
  { key: "service", header: "Service", render: (r) => <span className="font-mono text-xs">{r.service}</span> },
  { key: "operation", header: "Operation", render: (r) => <span className="font-mono text-xs">{r.operation}</span> },
  { key: "resource", header: "Resource", render: (r) => r.resource ?? "—" },
  {
    key: "status",
    header: "Status",
    render: (r) => (
      <Badge tone={r.status === "error" ? "danger" : "success"}>{r.status === "error" ? r.error : "OK"}</Badge>
    ),
  },
  { key: "duration", header: "Duration", render: (r) => `${r.duration_ms}ms`, align: "right" },
];

export function OperationsPage() {
  const { data, isLoading, error, refetch, isFetching } = useOperations();
  const metrics = useOperationMetrics();
  const clearMutation = useClearOperations();
  const [selected, setSelected] = useState<OperationResource | null>(null);

  return (
    <>
      <TopBar
        title="Developer Tools · Operations"
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => clearMutation.mutate()}
            disabled={!data?.items.length}
            loading={clearMutation.isPending}
          >
            Clear history
          </Button>
        }
      />

      <div className="flex-1 space-y-6 p-6">
        <p className="max-w-2xl text-sm text-ink-faint">
          Every call to <code className="font-mono">ProviderService._call</code> — the same seam
          Failure Injection hooks — also records here: request ID, duration, status, and error, for
          every resource operation in the console. This is in-memory and resets when the API
          process restarts.
        </p>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {metrics.isLoading ? (
            <>
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </>
          ) : (
            <>
              <StatTile label="Total requests" value={String(metrics.data?.total_count ?? 0)} />
              <StatTile
                label="Errors"
                value={String(metrics.data?.error_count ?? 0)}
                tone={metrics.data?.error_count ? "danger" : undefined}
              />
              <StatTile
                label="Error rate"
                value={`${Math.round((metrics.data?.error_rate ?? 0) * 100)}%`}
                tone={metrics.data?.error_rate ? "danger" : undefined}
              />
              <StatTile label="Avg latency" value={`${Math.round(metrics.data?.avg_duration_ms ?? 0)}ms`} />
            </>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Recent operations</h2>
            {isFetching && <span className="text-xs text-ink-faint">Refreshing…</span>}
          </div>
          <ResourceListSection
            data={data?.items}
            isLoading={isLoading}
            error={error}
            onRetry={() => refetch()}
            columns={columns}
            rowKey={(r) => String(r.id)}
            emptyTitle="No operations recorded yet"
            emptyDescription="Every resource call in the console — S3, SQS, DynamoDB — will show up here as it happens."
            renderActions={(op) => (
              <Button variant="ghost" size="sm" onClick={() => setSelected(op)}>
                Details
              </Button>
            )}
          />
        </div>
      </div>

      <Dialog open={selected !== null} onClose={() => setSelected(null)} title="Operation detail">
        {selected && (
          <dl className="space-y-2 text-sm">
            {(
              [
                ["Operation", `${selected.service} · ${selected.operation}`],
                ["Resource", selected.resource ?? "—"],
                ["Status", selected.status],
                ["Duration", `${selected.duration_ms}ms`],
                ["Provider", selected.provider],
                ["Request ID", selected.request_id ?? "—"],
                ["Error", selected.error ?? "—"],
                ["Retryable", selected.retryable === null ? "—" : selected.retryable ? "Yes" : "No"],
                ["Time", formatTimestamp(selected.timestamp)],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 border-b border-border pb-2 last:border-0">
                <dt className="text-ink-faint">{label}</dt>
                <dd className="text-right font-mono text-xs text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Dialog>
    </>
  );
}

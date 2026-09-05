import type { BucketResource } from "../../api/types";
import { TrashIcon } from "../icons";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { ErrorState } from "../ui/ErrorState";
import { TableSkeleton } from "../ui/Skeleton";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export interface BucketListProps {
  buckets: BucketResource[] | undefined;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  onDelete: (name: string) => void;
  onCreateClick: () => void;
  /** Name currently mid-delete, so its row can show a busy state. */
  deletingName?: string;
}

export function BucketList({
  buckets,
  isLoading,
  error,
  onRetry,
  onDelete,
  onCreateClick,
  deletingName,
}: BucketListProps) {
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-surface-raised">
        <TableSkeleton />
      </div>
    );
  }

  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }

  if (!buckets || buckets.length === 0) {
    return (
      <EmptyState
        title="No buckets yet"
        description="Create your first S3 bucket to get started."
        action={
          <Button variant="primary" size="sm" onClick={onCreateClick}>
            Create bucket
          </Button>
        }
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface-raised shadow-soft">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-ink-faint">
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Region</th>
            <th className="px-4 py-3 font-medium">Created</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {buckets.map((bucket) => {
            const isDeleting = deletingName === bucket.name;
            return (
              <tr key={bucket.id} className="group">
                <td className="px-4 py-3 font-medium text-ink">{bucket.name}</td>
                <td className="px-4 py-3 text-ink-muted">{bucket.region}</td>
                <td className="px-4 py-3 text-ink-muted">{formatDate(bucket.created_at)}</td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={isDeleting}
                    aria-label={`Delete ${bucket.name}`}
                    onClick={() => onDelete(bucket.name)}
                    className="text-ink-faint hover:!bg-danger-subtle hover:!text-danger"
                  >
                    {!isDeleting && <TrashIcon width={14} height={14} />}
                    Delete
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

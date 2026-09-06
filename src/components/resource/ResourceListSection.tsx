import type { ReactNode } from "react";
import { EmptyState } from "../ui/EmptyState";
import { ErrorState } from "../ui/ErrorState";
import { TableSkeleton } from "../ui/Skeleton";
import type { ResourceColumn } from "./ResourceTable";
import { ResourceTable } from "./ResourceTable";

export interface ResourceListSectionProps<T> {
  data: T[] | undefined;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  columns: ResourceColumn<T>[];
  rowKey: (row: T) => string;
  renderActions?: (row: T) => ReactNode;
  emptyTitle: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
}

/** The loading/error/empty/table state machine every resource list page in
 * this app needs — originally written once, inline, in BucketList, then
 * extracted here once SQS queues and DynamoDB tables needed the identical
 * branching. A resource page now only has to supply *what* a row looks
 * like (columns + actions), not re-derive *when* to show a skeleton vs.
 * an error vs. an empty state. */
export function ResourceListSection<T>({
  data,
  isLoading,
  error,
  onRetry,
  columns,
  rowKey,
  renderActions,
  emptyTitle,
  emptyDescription,
  emptyAction,
}: ResourceListSectionProps<T>) {
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-surface-raised">
        <TableSkeleton cols={columns.length + (renderActions ? 1 : 0)} />
      </div>
    );
  }

  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }

  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }

  return <ResourceTable columns={columns} rows={data} rowKey={rowKey} renderActions={renderActions} />;
}

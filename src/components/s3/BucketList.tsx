import type { BucketResource } from "../../api/types";
import { ResourceListSection } from "../resource/ResourceListSection";
import type { ResourceColumn } from "../resource/ResourceTable";
import { TrashIcon } from "../icons";
import { Button } from "../ui/Button";

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

const columns: ResourceColumn<BucketResource>[] = [
  { key: "name", header: "Name", render: (b) => <span className="font-medium text-ink">{b.name}</span> },
  { key: "region", header: "Region", render: (b) => b.region },
  { key: "created", header: "Created", render: (b) => formatDate(b.created_at) },
];

export function BucketList({
  buckets,
  isLoading,
  error,
  onRetry,
  onDelete,
  onCreateClick,
  deletingName,
}: BucketListProps) {
  return (
    <ResourceListSection
      data={buckets}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      columns={columns}
      rowKey={(b) => b.id}
      emptyTitle="No buckets yet"
      emptyDescription="Create your first S3 bucket to get started."
      emptyAction={
        <Button variant="primary" size="sm" onClick={onCreateClick}>
          Create bucket
        </Button>
      }
      renderActions={(bucket) => {
        const isDeleting = deletingName === bucket.name;
        return (
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
        );
      }}
    />
  );
}

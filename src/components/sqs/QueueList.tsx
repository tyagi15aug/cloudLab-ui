import { Link } from "react-router-dom";
import type { QueueResource } from "../../api/types";
import { ResourceListSection } from "../resource/ResourceListSection";
import type { ResourceColumn } from "../resource/ResourceTable";
import { TrashIcon } from "../icons";
import { Button } from "../ui/Button";

const columns: ResourceColumn<QueueResource>[] = [
  {
    key: "name",
    header: "Name",
    render: (q) => (
      <Link to={`/sqs/${encodeURIComponent(q.name)}`} className="font-medium text-ink hover:text-accent">
        {q.name}
      </Link>
    ),
  },
  { key: "messages", header: "Messages", render: (q) => q.approximate_message_count },
  { key: "region", header: "Region", render: (q) => q.region },
];

export interface QueueListProps {
  queues: QueueResource[] | undefined;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  onDelete: (name: string) => void;
  onCreateClick: () => void;
  deletingName?: string;
}

export function QueueList({
  queues,
  isLoading,
  error,
  onRetry,
  onDelete,
  onCreateClick,
  deletingName,
}: QueueListProps) {
  return (
    <ResourceListSection
      data={queues}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      columns={columns}
      rowKey={(q) => q.id}
      emptyTitle="No queues yet"
      emptyDescription="Create your first SQS queue to get started."
      emptyAction={
        <Button variant="primary" size="sm" onClick={onCreateClick}>
          Create queue
        </Button>
      }
      renderActions={(queue) => {
        const isDeleting = deletingName === queue.name;
        return (
          <Button
            variant="ghost"
            size="sm"
            loading={isDeleting}
            aria-label={`Delete ${queue.name}`}
            onClick={() => onDelete(queue.name)}
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

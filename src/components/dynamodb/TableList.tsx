import { Link } from "react-router-dom";
import type { TableResource } from "../../api/types";
import { ResourceListSection } from "../resource/ResourceListSection";
import type { ResourceColumn } from "../resource/ResourceTable";
import { TrashIcon } from "../icons";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

function formatKey(table: TableResource): string {
  return table.sort_key ? `${table.partition_key.name} + ${table.sort_key.name}` : table.partition_key.name;
}

const columns: ResourceColumn<TableResource>[] = [
  {
    key: "name",
    header: "Name",
    render: (t) => (
      <Link to={`/dynamodb/${encodeURIComponent(t.name)}`} className="font-medium text-ink hover:text-accent">
        {t.name}
      </Link>
    ),
  },
  { key: "key", header: "Key", render: (t) => <span className="font-mono text-xs">{formatKey(t)}</span> },
  { key: "items", header: "Items", render: (t) => t.item_count },
  {
    key: "status",
    header: "Status",
    render: (t) => <Badge tone={t.status === "ACTIVE" ? "success" : "neutral"}>{t.status}</Badge>,
  },
];

export interface TableListProps {
  tables: TableResource[] | undefined;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  onDelete: (name: string) => void;
  onCreateClick: () => void;
  deletingName?: string;
}

export function TableList({
  tables,
  isLoading,
  error,
  onRetry,
  onDelete,
  onCreateClick,
  deletingName,
}: TableListProps) {
  return (
    <ResourceListSection
      data={tables}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      columns={columns}
      rowKey={(t) => t.id}
      emptyTitle="No tables yet"
      emptyDescription="Create your first DynamoDB table to get started."
      emptyAction={
        <Button variant="primary" size="sm" onClick={onCreateClick}>
          Create table
        </Button>
      }
      renderActions={(table) => {
        const isDeleting = deletingName === table.name;
        return (
          <Button
            variant="ghost"
            size="sm"
            loading={isDeleting}
            aria-label={`Delete ${table.name}`}
            onClick={() => onDelete(table.name)}
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

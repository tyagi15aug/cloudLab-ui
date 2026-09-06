import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { TopBar } from "../components/layout/TopBar";
import { PutItemDialog } from "../components/dynamodb/PutItemDialog";
import { ConfirmDialog } from "../components/resource/ConfirmDialog";
import { Pagination } from "../components/resource/Pagination";
import { ResourceListSection } from "../components/resource/ResourceListSection";
import type { ResourceColumn } from "../components/resource/ResourceTable";
import { PlusIcon, RefreshIcon, TrashIcon } from "../components/icons";
import { Button } from "../components/ui/Button";
import { IconButton } from "../components/ui/IconButton";
import { useCursorPager } from "../hooks/useCursorPager";
import { useDeleteItem, useItems, useTable } from "../hooks/useTables";
import type { DynamoItem } from "../api/types";

export function TableDetailPage() {
  const { name = "" } = useParams<{ name: string }>();
  const table = useTable(name);
  const pager = useCursorPager();
  const { data, isLoading, error, refetch, isFetching } = useItems(name, pager.cursor);
  const deleteMutation = useDeleteItem(name);

  const [putOpen, setPutOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<DynamoItem | null>(null);

  const partitionKeyName = table.data?.partition_key.name ?? "id";
  const sortKeyName = table.data?.sort_key?.name ?? null;

  // DynamoDB items don't have a single id field — the partition key (plus
  // sort key, if the table has one) is what actually identifies a row, so
  // that's what both the delete call and the row's React key are built
  // from, rather than hashing the whole item.
  function keyOf(item: DynamoItem): DynamoItem {
    const key: DynamoItem = { [partitionKeyName]: item[partitionKeyName] };
    if (sortKeyName) key[sortKeyName] = item[sortKeyName];
    return key;
  }

  function rowIdentity(item: DynamoItem): string {
    return JSON.stringify(keyOf(item));
  }

  const columns: ResourceColumn<DynamoItem>[] = [
    {
      key: "item",
      header: "Item",
      render: (item) => <span className="font-mono text-xs text-ink">{JSON.stringify(item)}</span>,
    },
  ];

  function handleConfirmDelete() {
    if (!pendingDelete) return;
    deleteMutation.mutate(keyOf(pendingDelete), { onSuccess: () => setPendingDelete(null) });
  }

  return (
    <>
      <TopBar
        title={`DynamoDB · ${name}`}
        actions={
          <>
            <IconButton aria-label="Refresh items" onClick={() => refetch()} disabled={isFetching}>
              <RefreshIcon width={16} height={16} className={isFetching ? "animate-spin" : ""} />
            </IconButton>
            <Button variant="primary" size="sm" onClick={() => setPutOpen(true)}>
              <PlusIcon width={14} height={14} />
              Put item
            </Button>
          </>
        }
      />

      <div className="flex-1 p-6">
        <Link to="/dynamodb" className="mb-4 inline-block text-sm text-ink-muted hover:text-ink">
          ← Back to tables
        </Link>

        <ResourceListSection
          data={data?.items}
          isLoading={isLoading}
          error={error}
          onRetry={() => refetch()}
          columns={columns}
          rowKey={rowIdentity}
          emptyTitle="No items yet"
          emptyDescription="Put your first item to get started."
          emptyAction={
            <Button variant="primary" size="sm" onClick={() => setPutOpen(true)}>
              Put item
            </Button>
          }
          renderActions={(item) => {
            const isDeleting = deleteMutation.isPending && rowIdentity(item) === rowIdentity(pendingDelete ?? {});
            return (
              <Button
                variant="ghost"
                size="sm"
                loading={isDeleting}
                aria-label="Delete item"
                onClick={() => setPendingDelete(item)}
                className="text-ink-faint hover:!bg-danger-subtle hover:!text-danger"
              >
                {!isDeleting && <TrashIcon width={14} height={14} />}
                Delete
              </Button>
            );
          }}
        />

        <Pagination
          hasPrev={pager.hasPrev}
          hasNext={Boolean(data?.next_cursor)}
          onPrev={pager.goPrev}
          onNext={() => pager.goNext(data?.next_cursor)}
          disabled={isFetching}
        />
      </div>

      <PutItemDialog
        open={putOpen}
        onClose={() => setPutOpen(false)}
        tableName={name}
        partitionKeyHint={partitionKeyName}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete item"
        message={
          pendingDelete ? (
            <>
              Delete item with key{" "}
              <span className="font-mono font-medium text-ink">{JSON.stringify(keyOf(pendingDelete))}</span>?
              This can't be undone.
            </>
          ) : (
            ""
          )
        }
        confirmLabel="Delete item"
        danger
        onClose={() => {
          setPendingDelete(null);
          deleteMutation.reset();
        }}
        onConfirm={handleConfirmDelete}
        isPending={deleteMutation.isPending}
        error={deleteMutation.error}
      />
    </>
  );
}

import { useState } from "react";
import { TopBar } from "../components/layout/TopBar";
import { CreateTableDialog } from "../components/dynamodb/CreateTableDialog";
import { TableList } from "../components/dynamodb/TableList";
import { ConfirmDialog } from "../components/resource/ConfirmDialog";
import { PlusIcon, RefreshIcon } from "../components/icons";
import { Button } from "../components/ui/Button";
import { IconButton } from "../components/ui/IconButton";
import { useDeleteTable, useTables } from "../hooks/useTables";

export function DynamoDbPage() {
  const { data, isLoading, error, refetch, isFetching } = useTables();
  const deleteMutation = useDeleteTable();

  const [createOpen, setCreateOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  function handleConfirmDelete() {
    if (!pendingDelete) return;
    deleteMutation.mutate(pendingDelete, { onSuccess: () => setPendingDelete(null) });
  }

  return (
    <>
      <TopBar
        title="DynamoDB · Tables"
        actions={
          <>
            <IconButton aria-label="Refresh tables" onClick={() => refetch()} disabled={isFetching}>
              <RefreshIcon width={16} height={16} className={isFetching ? "animate-spin" : ""} />
            </IconButton>
            <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
              <PlusIcon width={14} height={14} />
              Create table
            </Button>
          </>
        }
      />

      <div className="flex-1 p-6">
        <TableList
          tables={data?.items}
          isLoading={isLoading}
          error={error}
          onRetry={() => refetch()}
          onDelete={setPendingDelete}
          onCreateClick={() => setCreateOpen(true)}
          deletingName={deleteMutation.isPending ? (pendingDelete ?? undefined) : undefined}
        />
      </div>

      <CreateTableDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete table"
        message={
          <>
            Delete <span className="font-mono font-medium text-ink">{pendingDelete}</span>? All items in
            it will be lost. This can't be undone.
          </>
        }
        confirmLabel="Delete table"
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

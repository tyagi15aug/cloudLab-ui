import { useState } from "react";
import { TopBar } from "../components/layout/TopBar";
import { CreateQueueDialog } from "../components/sqs/CreateQueueDialog";
import { QueueList } from "../components/sqs/QueueList";
import { ConfirmDialog } from "../components/resource/ConfirmDialog";
import { PlusIcon, RefreshIcon } from "../components/icons";
import { Button } from "../components/ui/Button";
import { IconButton } from "../components/ui/IconButton";
import { useDeleteQueue, useQueues } from "../hooks/useQueues";

export function SqsPage() {
  const { data, isLoading, error, refetch, isFetching } = useQueues();
  const deleteMutation = useDeleteQueue();

  const [createOpen, setCreateOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  function handleConfirmDelete() {
    if (!pendingDelete) return;
    deleteMutation.mutate(pendingDelete, { onSuccess: () => setPendingDelete(null) });
  }

  function closeDeleteDialog() {
    setPendingDelete(null);
    deleteMutation.reset();
  }

  return (
    <>
      <TopBar
        title="SQS · Queues"
        actions={
          <>
            <IconButton aria-label="Refresh queues" onClick={() => refetch()} disabled={isFetching}>
              <RefreshIcon width={16} height={16} className={isFetching ? "animate-spin" : ""} />
            </IconButton>
            <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
              <PlusIcon width={14} height={14} />
              Create queue
            </Button>
          </>
        }
      />

      <div className="flex-1 p-6">
        <QueueList
          queues={data?.items}
          isLoading={isLoading}
          error={error}
          onRetry={() => refetch()}
          onDelete={setPendingDelete}
          onCreateClick={() => setCreateOpen(true)}
          deletingName={deleteMutation.isPending ? (pendingDelete ?? undefined) : undefined}
        />
      </div>

      <CreateQueueDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete queue"
        message={
          <>
            Delete <span className="font-mono font-medium text-ink">{pendingDelete}</span>? Any messages
            still in the queue will be lost. This can't be undone.
          </>
        }
        confirmLabel="Delete queue"
        danger
        onClose={closeDeleteDialog}
        onConfirm={handleConfirmDelete}
        isPending={deleteMutation.isPending}
        error={deleteMutation.error}
      />
    </>
  );
}

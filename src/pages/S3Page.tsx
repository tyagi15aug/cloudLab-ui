import { useState } from "react";
import { TopBar } from "../components/layout/TopBar";
import { BucketList } from "../components/s3/BucketList";
import { CreateBucketDialog } from "../components/s3/CreateBucketDialog";
import { DeleteBucketDialog } from "../components/s3/DeleteBucketDialog";
import { PlusIcon, RefreshIcon } from "../components/icons";
import { Button } from "../components/ui/Button";
import { IconButton } from "../components/ui/IconButton";
import { useBuckets, useDeleteBucket } from "../hooks/useBuckets";

export function S3Page() {
  const { data, isLoading, error, refetch, isFetching } = useBuckets();
  const deleteMutation = useDeleteBucket();

  const [createOpen, setCreateOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  function handleConfirmDelete() {
    if (!pendingDelete) return;
    deleteMutation.mutate(pendingDelete, {
      onSuccess: () => setPendingDelete(null),
    });
  }

  function closeDeleteDialog() {
    setPendingDelete(null);
    deleteMutation.reset();
  }

  return (
    <>
      <TopBar
        title="S3 · Buckets"
        actions={
          <>
            <IconButton
              aria-label="Refresh buckets"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshIcon width={16} height={16} className={isFetching ? "animate-spin" : ""} />
            </IconButton>
            <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
              <PlusIcon width={14} height={14} />
              Create bucket
            </Button>
          </>
        }
      />

      <div className="flex-1 p-6">
        <BucketList
          buckets={data?.items}
          isLoading={isLoading}
          error={error}
          onRetry={() => refetch()}
          onDelete={setPendingDelete}
          onCreateClick={() => setCreateOpen(true)}
          deletingName={deleteMutation.isPending ? pendingDelete ?? undefined : undefined}
        />
      </div>

      <CreateBucketDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      <DeleteBucketDialog
        bucketName={pendingDelete}
        onClose={closeDeleteDialog}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteMutation.isPending}
        error={deleteMutation.error}
      />
    </>
  );
}

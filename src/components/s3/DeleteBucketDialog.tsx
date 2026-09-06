import { ConfirmDialog } from "../resource/ConfirmDialog";

export function DeleteBucketDialog({
  bucketName,
  onClose,
  onConfirm,
  isDeleting,
  error,
}: {
  bucketName: string | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  error: unknown;
}) {
  return (
    <ConfirmDialog
      open={bucketName !== null}
      title="Delete bucket"
      message={
        <>
          Delete <span className="font-mono font-medium text-ink">{bucketName}</span>? This can't be
          undone.
        </>
      }
      confirmLabel="Delete bucket"
      danger
      onClose={onClose}
      onConfirm={onConfirm}
      isPending={isDeleting}
      error={error}
    />
  );
}

import { ApiError } from "../../api/client";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";

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
  const message = error instanceof ApiError ? error.message : error ? "Something went wrong." : null;

  return (
    <Dialog open={bucketName !== null} onClose={onClose} title="Delete bucket">
      <p className="text-sm text-ink-muted">
        Delete <span className="font-mono font-medium text-ink">{bucketName}</span>? This can't be
        undone.
      </p>

      {message && (
        <div role="alert" className="mt-3 rounded-lg bg-danger-subtle px-3 py-2 text-sm text-danger">
          {message}
        </div>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" variant="danger" loading={isDeleting} onClick={onConfirm}>
          Delete bucket
        </Button>
      </div>
    </Dialog>
  );
}

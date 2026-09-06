import type { ReactNode } from "react";
import { ApiError } from "../../api/client";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  /** Uses the danger button variant — for destructive confirmations. */
  danger?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
  error?: unknown;
}

/** The one confirmation dialog every "delete this thing" / "are you sure"
 * action in the app uses — delete queue, delete table, delete message,
 * delete item all share this instead of each rolling their own. Started
 * out as a bucket-delete-only dialog and got generalized once the second
 * resource needed the same thing. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
  onClose,
  onConfirm,
  isPending,
  error,
}: ConfirmDialogProps) {
  const errorMessage = error instanceof ApiError ? error.message : error ? "Something went wrong." : null;

  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <div className="text-sm text-ink-muted">{message}</div>

      {errorMessage && (
        <div role="alert" className="mt-3 rounded-lg bg-danger-subtle px-3 py-2 text-sm text-danger">
          {errorMessage}
        </div>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          variant={danger ? "danger" : "primary"}
          loading={isPending}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}

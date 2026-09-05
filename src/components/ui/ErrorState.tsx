import { ApiError } from "../../api/client";
import { AlertIcon } from "../icons";
import { Button } from "./Button";

/** Maps an error to the copy + action the Error Model calls for
 * (docs/implementation-plan.md, "Error Model"): retryable errors get a
 * Retry button, permission errors are labeled distinctly, everything else
 * is just an actionable message — never a raw stack trace. */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const isApiError = error instanceof ApiError;
  const message = isApiError ? error.message : "Something went wrong.";
  const isPermission = isApiError && error.code === "ACCESS_DENIED";
  const canRetry = isApiError ? error.retryable : true;

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-xl border border-danger-subtle bg-danger-subtle/40 px-6 py-16 text-center"
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-danger-subtle text-danger">
        <AlertIcon />
      </div>
      <p className="text-sm font-medium text-ink">
        {isPermission ? "You don't have permission to do this" : "Couldn't load this"}
      </p>
      <p className="mt-1 max-w-sm text-sm text-ink-muted">{message}</p>
      {isApiError && error.requestId && (
        <p className="mt-1 font-mono text-xs text-ink-faint">Request ID: {error.requestId}</p>
      )}
      {onRetry && canRetry && (
        <div className="mt-4">
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}

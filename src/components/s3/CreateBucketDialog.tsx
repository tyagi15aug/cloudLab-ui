import { useState } from "react";
import type { FormEvent } from "react";
import { ApiError } from "../../api/client";
import { useCreateBucket } from "../../hooks/useBuckets";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";

const NAME_PATTERN = /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/;

/** A pragmatic subset of S3's real bucket-naming rules — enough to catch
 * the common mistakes client-side; the backend is still the source of
 * truth and will reject anything this misses. */
function validateName(name: string): string | null {
  if (name.length === 0) return "Bucket name is required.";
  if (name.length < 3 || name.length > 63) return "Must be 3–63 characters long.";
  if (!NAME_PATTERN.test(name)) {
    return "Use lowercase letters, numbers, dots, and hyphens only. Must start and end with a letter or number.";
  }
  return null;
}

export function CreateBucketDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const mutation = useCreateBucket();

  const validationError = touched ? validateName(name) : null;

  function handleClose() {
    setName("");
    setTouched(false);
    mutation.reset();
    onClose();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    const error = validateName(name);
    if (error) return;

    mutation.mutate(name, {
      onSuccess: handleClose,
    });
  }

  const serverMessage =
    mutation.error instanceof ApiError ? mutation.error.message : mutation.error ? "Something went wrong." : null;

  return (
    <Dialog open={open} onClose={handleClose} title="Create bucket">
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="bucket-name" className="mb-1.5 block text-sm font-medium text-ink">
          Bucket name
        </label>
        <input
          id="bucket-name"
          name="name"
          type="text"
          autoFocus
          autoComplete="off"
          spellCheck={false}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="my-app-assets"
          aria-invalid={Boolean(validationError)}
          aria-describedby={validationError ? "bucket-name-error" : undefined}
          className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-ink outline-none
            placeholder:text-ink-faint focus:border-accent
            ${validationError ? "border-danger" : "border-border"}`}
        />
        <div className="mt-1.5 min-h-[1.25rem] text-xs">
          {validationError ? (
            <p id="bucket-name-error" className="text-danger">
              {validationError}
            </p>
          ) : (
            <p className="text-ink-faint">Globally unique, lowercase, 3–63 characters.</p>
          )}
        </div>

        {serverMessage && (
          <div role="alert" className="mt-3 rounded-lg bg-danger-subtle px-3 py-2 text-sm text-danger">
            {serverMessage}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={mutation.isPending}>
            Create bucket
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

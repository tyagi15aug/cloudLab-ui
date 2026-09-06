import { useState } from "react";
import type { FormEvent } from "react";
import { ApiError } from "../../api/client";
import { useCreateQueue } from "../../hooks/useQueues";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { FormField, textInputClassName } from "../ui/FormField";

const NAME_PATTERN = /^[A-Za-z0-9_-]+$/;

function validateName(name: string): string | null {
  if (name.length === 0) return "Queue name is required.";
  if (name.length > 80) return "Must be 80 characters or fewer.";
  if (!NAME_PATTERN.test(name)) {
    return "Use letters, numbers, hyphens, and underscores only.";
  }
  return null;
}

export function CreateQueueDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const mutation = useCreateQueue();

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
    if (validateName(name)) return;

    mutation.mutate(name, { onSuccess: handleClose });
  }

  const serverMessage =
    mutation.error instanceof ApiError ? mutation.error.message : mutation.error ? "Something went wrong." : null;

  return (
    <Dialog open={open} onClose={handleClose} title="Create queue">
      <form onSubmit={handleSubmit} noValidate>
        <FormField
          id="queue-name"
          label="Queue name"
          error={validationError}
          hint="Letters, numbers, hyphens, and underscores, up to 80 characters."
        >
          <input
            id="queue-name"
            name="name"
            type="text"
            autoFocus
            autoComplete="off"
            spellCheck={false}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="order-events"
            aria-invalid={Boolean(validationError)}
            aria-describedby={validationError ? "queue-name-error" : undefined}
            className={textInputClassName(Boolean(validationError))}
          />
        </FormField>

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
            Create queue
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

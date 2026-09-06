import { useState } from "react";
import type { FormEvent } from "react";
import { ApiError } from "../../api/client";
import { useSendMessage } from "../../hooks/useQueues";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { FormField, textInputClassName } from "../ui/FormField";

export function SendMessageDialog({
  open,
  onClose,
  queueName,
}: {
  open: boolean;
  onClose: () => void;
  queueName: string;
}) {
  const [body, setBody] = useState("");
  const [touched, setTouched] = useState(false);
  const mutation = useSendMessage(queueName);

  const validationError = touched && body.length === 0 ? "Message body is required." : null;

  function handleClose() {
    setBody("");
    setTouched(false);
    mutation.reset();
    onClose();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (body.length === 0) return;
    mutation.mutate(body, { onSuccess: handleClose });
  }

  const serverMessage =
    mutation.error instanceof ApiError ? mutation.error.message : mutation.error ? "Something went wrong." : null;

  return (
    <Dialog open={open} onClose={handleClose} title="Send message">
      <form onSubmit={handleSubmit} noValidate>
        <FormField id="message-body" label="Message body" error={validationError}>
          <textarea
            id="message-body"
            name="body"
            autoFocus
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder='{"orderId": "1234", "event": "placed"}'
            aria-invalid={Boolean(validationError)}
            className={`${textInputClassName(Boolean(validationError))} font-mono`}
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
            Send message
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

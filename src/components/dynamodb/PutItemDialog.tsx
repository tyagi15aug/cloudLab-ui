import { useState } from "react";
import type { FormEvent } from "react";
import { ApiError } from "../../api/client";
import { usePutItem } from "../../hooks/useTables";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { FormField, textInputClassName } from "../ui/FormField";

/** DynamoDB items are freeform JSON (see the backend's ItemResource
 * docstring) — a raw JSON textarea is the honest editor for that, rather
 * than a form that pretends to know a table's schema. Must include the
 * table's key attribute(s); the backend 400s with a clear message
 * otherwise. */
export function PutItemDialog({
  open,
  onClose,
  tableName,
  partitionKeyHint,
}: {
  open: boolean;
  onClose: () => void;
  tableName: string;
  partitionKeyHint: string;
}) {
  const [json, setJson] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const mutation = usePutItem(tableName);

  function handleClose() {
    setJson("");
    setParseError(null);
    mutation.reset();
    onClose();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    let item: unknown;
    try {
      item = JSON.parse(json);
    } catch {
      setParseError("Not valid JSON.");
      return;
    }
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      setParseError("Must be a JSON object, e.g. {\"id\": \"1\"}.");
      return;
    }
    setParseError(null);
    mutation.mutate(item as Record<string, unknown>, { onSuccess: handleClose });
  }

  const serverMessage =
    mutation.error instanceof ApiError ? mutation.error.message : mutation.error ? "Something went wrong." : null;

  return (
    <Dialog open={open} onClose={handleClose} title="Put item">
      <form onSubmit={handleSubmit} noValidate>
        <FormField
          id="item-json"
          label="Item (JSON)"
          error={parseError}
          hint={`Must include the table's key attribute — "${partitionKeyHint}".`}
        >
          <textarea
            id="item-json"
            autoFocus
            rows={6}
            value={json}
            onChange={(e) => setJson(e.target.value)}
            placeholder={`{"${partitionKeyHint}": "1", "name": "Alice"}`}
            aria-invalid={Boolean(parseError)}
            className={`${textInputClassName(Boolean(parseError))} font-mono`}
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
            Put item
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

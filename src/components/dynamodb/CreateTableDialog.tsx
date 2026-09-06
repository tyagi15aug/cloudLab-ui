import { useState } from "react";
import type { FormEvent } from "react";
import { ApiError } from "../../api/client";
import type { AttributeType } from "../../api/types";
import { useCreateTable } from "../../hooks/useTables";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { FormField, textInputClassName } from "../ui/FormField";

const NAME_PATTERN = /^[A-Za-z0-9_.-]+$/;

function validateTableName(name: string): string | null {
  if (name.length === 0) return "Table name is required.";
  if (name.length < 3 || name.length > 255) return "Must be 3–255 characters long.";
  if (!NAME_PATTERN.test(name)) return "Use letters, numbers, underscores, dots, and hyphens only.";
  return null;
}

function validateKeyName(name: string, label: string): string | null {
  if (name.length === 0) return `${label} is required.`;
  return null;
}

const selectClassName = textInputClassName(false);

export function CreateTableDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [partitionKey, setPartitionKey] = useState("");
  const [partitionKeyType, setPartitionKeyType] = useState<AttributeType>("S");
  const [hasSortKey, setHasSortKey] = useState(false);
  const [sortKey, setSortKey] = useState("");
  const [sortKeyType, setSortKeyType] = useState<AttributeType>("S");
  const [touched, setTouched] = useState(false);
  const mutation = useCreateTable();

  const nameError = touched ? validateTableName(name) : null;
  const partitionKeyError = touched ? validateKeyName(partitionKey, "Partition key") : null;
  const sortKeyError = touched && hasSortKey ? validateKeyName(sortKey, "Sort key") : null;

  function reset() {
    setName("");
    setPartitionKey("");
    setPartitionKeyType("S");
    setHasSortKey(false);
    setSortKey("");
    setSortKeyType("S");
    setTouched(false);
    mutation.reset();
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (validateTableName(name) || validateKeyName(partitionKey, "Partition key")) return;
    if (hasSortKey && validateKeyName(sortKey, "Sort key")) return;

    mutation.mutate(
      {
        name,
        partition_key: partitionKey,
        partition_key_type: partitionKeyType,
        ...(hasSortKey ? { sort_key: sortKey, sort_key_type: sortKeyType } : {}),
      },
      { onSuccess: handleClose },
    );
  }

  const serverMessage =
    mutation.error instanceof ApiError ? mutation.error.message : mutation.error ? "Something went wrong." : null;

  return (
    <Dialog open={open} onClose={handleClose} title="Create table">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField id="table-name" label="Table name" error={nameError}>
          <input
            id="table-name"
            type="text"
            autoFocus
            autoComplete="off"
            spellCheck={false}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="users"
            className={textInputClassName(Boolean(nameError))}
          />
        </FormField>

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <FormField id="partition-key" label="Partition key" error={partitionKeyError}>
            <input
              id="partition-key"
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={partitionKey}
              onChange={(e) => setPartitionKey(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="id"
              className={textInputClassName(Boolean(partitionKeyError))}
            />
          </FormField>
          <FormField id="partition-key-type" label="Type">
            <select
              id="partition-key-type"
              value={partitionKeyType}
              onChange={(e) => setPartitionKeyType(e.target.value as AttributeType)}
              className={selectClassName}
            >
              <option value="S">String</option>
              <option value="N">Number</option>
              <option value="B">Binary</option>
            </select>
          </FormField>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            checked={hasSortKey}
            onChange={(e) => setHasSortKey(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          Add a sort key
        </label>

        {hasSortKey && (
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <FormField id="sort-key" label="Sort key" error={sortKeyError}>
              <input
                id="sort-key"
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="createdAt"
                className={textInputClassName(Boolean(sortKeyError))}
              />
            </FormField>
            <FormField id="sort-key-type" label="Type">
              <select
                id="sort-key-type"
                value={sortKeyType}
                onChange={(e) => setSortKeyType(e.target.value as AttributeType)}
                className={selectClassName}
              >
                <option value="S">String</option>
                <option value="N">Number</option>
                <option value="B">Binary</option>
              </select>
            </FormField>
          </div>
        )}

        {serverMessage && (
          <div role="alert" className="rounded-lg bg-danger-subtle px-3 py-2 text-sm text-danger">
            {serverMessage}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={mutation.isPending}>
            Create table
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

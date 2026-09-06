import type { ReactNode } from "react";

export interface FormFieldProps {
  id: string;
  label: string;
  error?: string | null;
  hint?: string;
  children: ReactNode;
}

/** The label + input-slot + hint-or-error layout every create-resource
 * dialog needs (Phase 3.4) — extracted from Phase 1's CreateBucketDialog,
 * which had this markup inline, once CreateQueueDialog/CreateTableDialog
 * needed the identical thing. Owns layout only; the actual `<input>` /
 * `<select>` stays with the caller since field types genuinely differ. */
export function FormField({ id, label, error, hint, children }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      <div className="mt-1.5 min-h-[1.25rem] text-xs">
        {error ? (
          <p id={`${id}-error`} className="text-danger">
            {error}
          </p>
        ) : hint ? (
          <p className="text-ink-faint">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}

export const textInputClassName = (hasError: boolean) =>
  `w-full rounded-lg border bg-surface px-3 py-2 text-sm text-ink outline-none
   placeholder:text-ink-faint focus:border-accent
   ${hasError ? "border-danger" : "border-border"}`;

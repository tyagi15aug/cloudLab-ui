import type { ReactNode } from "react";
import { InboxIcon } from "../icons";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-16 text-center"
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-surface-sunken text-ink-faint">
        <InboxIcon />
      </div>
      <p className="text-sm font-medium text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

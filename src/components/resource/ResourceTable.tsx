import type { ReactNode } from "react";

export interface ResourceColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: "left" | "right";
}

export interface ResourceTableProps<T> {
  columns: ResourceColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Rendered as a trailing "Actions" column when provided. */
  renderActions?: (row: T) => ReactNode;
}

/** A plain, resource-agnostic data table. BucketList was the only table in
 * the app until SQS/DynamoDB queues/tables/items needed the exact same
 * layout — this is that layout, parameterized by columns instead of
 * copy-pasted per resource. */
export function ResourceTable<T>({ columns, rows, rowKey, renderActions }: ResourceTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface-raised shadow-soft">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-ink-faint">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 font-medium ${col.align === "right" ? "text-right" : ""}`}
              >
                {col.header}
              </th>
            ))}
            {renderActions && <th className="px-4 py-3 font-medium text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={rowKey(row)} className="group">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3 ${col.align === "right" ? "text-right" : "text-ink-muted"}`}
                >
                  {col.render(row)}
                </td>
              ))}
              {renderActions && <td className="px-4 py-3 text-right">{renderActions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div role="presentation" className={`animate-pulse rounded bg-surface-sunken ${className}`} />;
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div data-testid="table-skeleton" className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-6 px-4 py-3.5">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={`h-4 ${c === 0 ? "w-40" : "w-20"}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

import type { SVGProps } from "react";
import { Link } from "react-router-dom";
import { ExternalLinkIcon } from "../icons";

export function SummaryCard({
  to,
  icon: Icon,
  count,
  label,
}: {
  to: string;
  icon: (props: SVGProps<SVGSVGElement>) => React.JSX.Element;
  count: number | string;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="group rounded-xl border border-border bg-surface-raised p-5 shadow-soft transition-colors hover:border-border-strong"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-subtle text-accent">
          <Icon width={18} height={18} />
        </div>
        <ExternalLinkIcon
          width={14}
          height={14}
          className="text-ink-faint opacity-0 transition-opacity group-hover:opacity-100"
        />
      </div>
      <p className="mt-4 text-2xl font-semibold text-ink">{count}</p>
      <p className="text-sm text-ink-muted">{label}</p>
    </Link>
  );
}

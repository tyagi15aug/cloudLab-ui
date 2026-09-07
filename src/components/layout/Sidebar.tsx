import { NavLink } from "react-router-dom";
import { ActivityIcon, BoltIcon, BucketIcon } from "../icons";
import { Badge } from "../ui/Badge";

interface NavItem {
  to?: string;
  label: string;
  icon: typeof BucketIcon;
  soon?: boolean;
}

// EC2 and VPC are on the roadmap but don't have a backend yet. Listing
// them here — disabled, badged "Soon" — signals where this is headed
// without pretending they're live.
const resourceItems: NavItem[] = [
  { to: "/s3", label: "S3", icon: BucketIcon },
  { to: "/sqs", label: "SQS", icon: BucketIcon },
  { to: "/dynamodb", label: "DynamoDB", icon: BucketIcon },
  { label: "EC2", icon: BucketIcon, soon: true },
  { label: "VPC", icon: BucketIcon, soon: true },
];

// Separate section from "Resources" on purpose — neither of these is a
// cloud resource; both are capabilities that observe or change how the
// resources above behave, which is also why the API namespaces them
// under /api/dev/... instead of /api/resources/....
const devToolsItems: NavItem[] = [
  { to: "/dev/failures", label: "Failure Injection", icon: BoltIcon },
  { to: "/dev/operations", label: "Operations", icon: ActivityIcon },
];

function NavSection({ title, items }: { title: string; items: NavItem[] }) {
  return (
    <>
      <p className="px-2 pb-1.5 pt-3 text-xs font-medium uppercase tracking-wide text-ink-faint">{title}</p>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item.label}>
            {item.soon || !item.to ? (
              <div className="flex cursor-not-allowed items-center justify-between rounded-lg px-2.5 py-1.5 text-sm text-ink-faint">
                <span className="flex items-center gap-2">
                  <item.icon width={16} height={16} />
                  {item.label}
                </span>
                <Badge>Soon</Badge>
              </div>
            ) : (
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent-subtle text-accent"
                      : "text-ink-muted hover:bg-surface-sunken hover:text-ink"
                  }`
                }
              >
                <item.icon width={16} height={16} />
                {item.label}
              </NavLink>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface-raised">
      <div className="flex h-14 items-center gap-2 px-5">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-accent-ink">
          <BucketIcon width={14} height={14} />
        </div>
        <span className="text-sm font-semibold tracking-tight text-ink">CloudLab</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <NavSection title="Resources" items={resourceItems} />
        <NavSection title="Developer Tools" items={devToolsItems} />
      </nav>

      <div className="border-t border-border px-4 py-3">
        <p className="text-xs text-ink-faint">Phase 5 · Observability</p>
      </div>
    </aside>
  );
}

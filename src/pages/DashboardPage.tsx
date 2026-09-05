import { Link } from "react-router-dom";
import { TopBar } from "../components/layout/TopBar";
import { BucketIcon, ExternalLinkIcon } from "../components/icons";
import { useBuckets } from "../hooks/useBuckets";

export function DashboardPage() {
  const { data, isLoading } = useBuckets();
  const bucketCount = data?.items.length;

  return (
    <>
      <TopBar title="Dashboard" />
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link
            to="/s3"
            className="group rounded-xl border border-border bg-surface-raised p-5 shadow-soft transition-colors hover:border-border-strong"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-subtle text-accent">
                <BucketIcon width={18} height={18} />
              </div>
              <ExternalLinkIcon
                width={14}
                height={14}
                className="text-ink-faint opacity-0 transition-opacity group-hover:opacity-100"
              />
            </div>
            <p className="mt-4 text-2xl font-semibold text-ink">
              {isLoading ? "—" : bucketCount}
            </p>
            <p className="text-sm text-ink-muted">S3 buckets</p>
          </Link>
        </div>

        <div className="mt-8 max-w-2xl rounded-xl border border-border bg-surface-raised p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-ink">About this environment</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            This console talks to a FastAPI backend backed by LocalStack — an AWS-compatible
            emulator running entirely on your machine. Nothing here touches a real AWS account.
            The backend's provider abstraction means the same code can be pointed at real AWS by
            changing one environment variable.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            S3 is the first resource implemented end-to-end. SQS, DynamoDB, EC2, and VPC are next
            on the roadmap (see the sidebar).
          </p>
        </div>
      </div>
    </>
  );
}

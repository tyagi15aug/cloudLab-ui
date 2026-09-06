import { TopBar } from "../components/layout/TopBar";
import { BucketIcon } from "../components/icons";
import { SummaryCard } from "../components/resource/SummaryCard";
import { useBuckets } from "../hooks/useBuckets";
import { useQueues } from "../hooks/useQueues";
import { useTables } from "../hooks/useTables";

export function DashboardPage() {
  const buckets = useBuckets();
  const queues = useQueues();
  const tables = useTables();

  return (
    <>
      <TopBar title="Dashboard" />
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            to="/s3"
            icon={BucketIcon}
            count={buckets.isLoading ? "—" : (buckets.data?.items.length ?? 0)}
            label="S3 buckets"
          />
          <SummaryCard
            to="/sqs"
            icon={BucketIcon}
            count={queues.isLoading ? "—" : (queues.data?.items.length ?? 0)}
            label="SQS queues"
          />
          <SummaryCard
            to="/dynamodb"
            icon={BucketIcon}
            count={tables.isLoading ? "—" : (tables.data?.items.length ?? 0)}
            label="DynamoDB tables"
          />
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
            S3, SQS, and DynamoDB are implemented end-to-end. EC2 and VPC are next on the roadmap
            (see the sidebar).
          </p>
        </div>
      </div>
    </>
  );
}

import type { ReactNode } from "react";
import { useReadiness } from "../../hooks/useReadiness";
import { CheckIcon, SpinnerIcon } from "../icons";
import type { DependencyStatus } from "../../api/readiness";

/**
 * Cold-start splash (Master Plan §3.2 / CloudLab Implementation Plan §8.5).
 *
 * CloudLab's frontend is a static SPA — Render serves it instantly, it has
 * no cold start of its own. The cold start that matters is the API's (and,
 * behind it, LocalStack's) free-tier Render service waking up, which the
 * SPA's *first* call to `/api/health` is what actually triggers. Rendering
 * this instead of the app shell turns that wait into a legible checklist
 * instead of a blank screen sitting in front of a spinning-but-unreachable
 * dashboard.
 *
 * Wrap the app with <LaunchScreen>{children}</LaunchScreen> — children
 * render once `overall === "ready"`; until then this owns the screen.
 */
export function LaunchScreen({ children }: { children: ReactNode }) {
  const { data, isError } = useReadiness();

  // No data yet (first request in flight, or it errored outright before
  // even reaching the "starting" body) reads the same as "starting" here —
  // see useReadiness.ts on why a thrown request isn't treated as fatal.
  const apiStatus: DependencyStatus = data?.api ?? "starting";
  const localstackStatus: DependencyStatus = data?.localstack ?? "starting";
  const overall = data?.overall ?? "starting";

  if (overall === "ready") {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-8 bg-surface px-6">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-ink-faint">CloudLab</p>
        <h1 className="mt-1 text-lg font-semibold text-ink">Waking up your sandbox…</h1>
        <p className="mt-1 max-w-sm text-sm text-ink-muted">
          {isError
            ? "Still trying to reach the API — this is normal on the first request after a while."
            : "First load after some idle time can take up to a minute while the backend and simulated AWS services spin back up."}
        </p>
      </div>

      <ul className="w-full max-w-xs space-y-3">
        <ChecklistRow label="Waking API" status={apiStatus} />
        <ChecklistRow label="Starting LocalStack (SQS/S3)" status={localstackStatus} />
      </ul>
    </div>
  );
}

function ChecklistRow({ label, status }: { label: string; status: DependencyStatus }) {
  const ready = status === "ready";

  return (
    <li className="flex items-center gap-3 rounded-lg border border-border bg-surface-raised px-4 py-3">
      <span
        className={`flex h-6 w-6 flex-none items-center justify-center rounded-full ${
          ready ? "bg-success-subtle text-success" : "bg-surface-sunken text-ink-faint"
        }`}
      >
        {ready ? <CheckIcon width={14} height={14} /> : <SpinnerIcon width={14} height={14} />}
      </span>
      <span className={`text-sm ${ready ? "text-ink" : "text-ink-muted"}`}>{label}</span>
    </li>
  );
}

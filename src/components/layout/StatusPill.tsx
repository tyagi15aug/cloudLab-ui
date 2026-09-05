import { useHealth } from "../../hooks/useHealth";

export function StatusPill() {
  const { data, isError, isLoading } = useHealth();

  const label = isLoading ? "Checking…" : isError ? "API unreachable" : `${data?.provider}`;
  const dotClass = isLoading ? "bg-ink-faint" : isError ? "bg-danger" : "bg-success";

  return (
    <div
      className="flex items-center gap-1.5 rounded-full border border-border bg-surface-sunken px-2.5 py-1 text-xs font-medium text-ink-muted"
      title={isError ? "Could not reach the API — is it running?" : "Connected cloud provider"}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      {label}
    </div>
  );
}

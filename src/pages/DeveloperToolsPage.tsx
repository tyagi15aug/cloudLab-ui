import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ApiError } from "../api/client";
import { FAILURE_TYPES, KNOWN_OPERATIONS_BY_SERVICE, KNOWN_SERVICES } from "../api/dev";
import type { FailureRuleResource, FailureType } from "../api/types";
import { ResourceListSection } from "../components/resource/ResourceListSection";
import type { ResourceColumn } from "../components/resource/ResourceTable";
import { TopBar } from "../components/layout/TopBar";
import { TrashIcon } from "../components/icons";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { FormField, textInputClassName } from "../components/ui/FormField";
import { useClearFailures, useCreateFailure, useDeleteFailure, useFailures } from "../hooks/useFailures";

const selectClassName = textInputClassName(false);

function formatFailure(failure: FailureType): string {
  return FAILURE_TYPES.find((f) => f.value === failure)?.label ?? failure;
}

const columns: ResourceColumn<FailureRuleResource>[] = [
  { key: "service", header: "Service", render: (r) => <span className="font-mono text-xs">{r.service}</span> },
  { key: "operation", header: "Operation", render: (r) => <span className="font-mono text-xs">{r.operation}</span> },
  { key: "failure", header: "Failure", render: (r) => <Badge tone="danger">{formatFailure(r.failure)}</Badge> },
  { key: "delay", header: "Delay", render: (r) => (r.delay_ms ? `${r.delay_ms}ms` : "—"), align: "right" },
  {
    key: "probability",
    header: "Probability",
    render: (r) => `${Math.round(r.probability * 100)}%`,
    align: "right",
  },
  { key: "hits", header: "Hits", render: (r) => r.hit_count, align: "right" },
];

export function DeveloperToolsPage() {
  const { data, isLoading, error, refetch, isFetching } = useFailures();
  const createMutation = useCreateFailure();
  const deleteMutation = useDeleteFailure();
  const clearMutation = useClearFailures();

  const [service, setService] = useState<string>(KNOWN_SERVICES[1]); // "s3"
  const [operation, setOperation] = useState<string>("*");
  const [failure, setFailure] = useState<FailureType>("http_500");
  const [delayMs, setDelayMs] = useState<string>("0");
  const [probability, setProbability] = useState<string>("100");

  const operationOptions = useMemo(() => KNOWN_OPERATIONS_BY_SERVICE[service] ?? ["*"], [service]);

  function handleServiceChange(next: string) {
    // Operation options are keyed per service — whatever was picked for the
    // old service likely isn't a valid operation for the new one, so reset
    // to "any operation" rather than leaving a stale, possibly-invalid value.
    setService(next);
    setOperation("*");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    createMutation.mutate(
      {
        service,
        operation,
        failure,
        delay_ms: Math.max(0, Number(delayMs) || 0),
        probability: Math.min(100, Math.max(0, Number(probability) || 0)) / 100,
      },
      { onSuccess: () => createMutation.reset() },
    );
  }

  const serverMessage =
    createMutation.error instanceof ApiError
      ? createMutation.error.message
      : createMutation.error
        ? "Something went wrong."
        : null;

  const selectedFailure = FAILURE_TYPES.find((f) => f.value === failure);

  return (
    <>
      <TopBar
        title="Developer Tools · Failure Injection"
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => clearMutation.mutate()}
            disabled={!data?.items.length}
            loading={clearMutation.isPending}
          >
            Clear all
          </Button>
        }
      />

      <div className="flex-1 space-y-6 p-6">
        <p className="max-w-2xl text-sm text-ink-faint">
          Every resource call in this app funnels through one instrumented helper
          (<code className="font-mono">ProviderService._call</code>), so a rule added here applies
          instantly to the matching service/operation across the whole console — no restart
          needed. This is a development and testing capability, not a real network simulator: it
          resets whenever the API process restarts.
        </p>

        <form
          onSubmit={handleSubmit}
          className="max-w-2xl space-y-4 rounded-xl border border-border bg-surface-raised p-5 shadow-soft"
        >
          <h2 className="text-sm font-semibold text-ink">Inject a failure</h2>

          <div className="grid grid-cols-2 gap-4">
            <FormField id="failure-service" label="Service">
              <select
                id="failure-service"
                value={service}
                onChange={(e) => handleServiceChange(e.target.value)}
                className={selectClassName}
              >
                {KNOWN_SERVICES.map((s) => (
                  <option key={s} value={s}>
                    {s === "*" ? "* (every service)" : s}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField id="failure-operation" label="Operation">
              <select
                id="failure-operation"
                value={operation}
                onChange={(e) => setOperation(e.target.value)}
                className={selectClassName}
              >
                {operationOptions.map((op) => (
                  <option key={op} value={op}>
                    {op === "*" ? "* (every operation)" : op}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField id="failure-type" label="Failure type" hint={selectedFailure?.description}>
            <select
              id="failure-type"
              value={failure}
              onChange={(e) => setFailure(e.target.value as FailureType)}
              className={selectClassName}
            >
              {FAILURE_TYPES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField id="failure-delay" label="Delay (ms)" hint="Applies before the failure/latency.">
              <input
                id="failure-delay"
                type="number"
                min={0}
                max={30000}
                step={100}
                value={delayMs}
                onChange={(e) => setDelayMs(e.target.value)}
                className={selectClassName}
              />
            </FormField>

            <FormField id="failure-probability" label="Probability (%)" hint="Chance the rule fires per call.">
              <input
                id="failure-probability"
                type="number"
                min={0}
                max={100}
                step={5}
                value={probability}
                onChange={(e) => setProbability(e.target.value)}
                className={selectClassName}
              />
            </FormField>
          </div>

          {serverMessage && (
            <div role="alert" className="rounded-lg bg-danger-subtle px-3 py-2 text-sm text-danger">
              {serverMessage}
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" variant="primary" loading={createMutation.isPending}>
              Inject failure
            </Button>
          </div>
        </form>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Active rules</h2>
            {isFetching && <span className="text-xs text-ink-faint">Refreshing…</span>}
          </div>
          <ResourceListSection
            data={data?.items}
            isLoading={isLoading}
            error={error}
            onRetry={() => refetch()}
            columns={columns}
            rowKey={(r) => r.id}
            emptyTitle="No active failure rules"
            emptyDescription="Inject one above to see the rest of the console react to it."
            renderActions={(rule) => (
              <Button
                variant="ghost"
                size="sm"
                loading={deleteMutation.isPending && deleteMutation.variables === rule.id}
                aria-label={`Delete rule for ${rule.service} ${rule.operation}`}
                onClick={() => deleteMutation.mutate(rule.id)}
                className="text-ink-faint hover:!bg-danger-subtle hover:!text-danger"
              >
                <TrashIcon width={14} height={14} />
                Delete
              </Button>
            )}
          />
        </div>
      </div>
    </>
  );
}

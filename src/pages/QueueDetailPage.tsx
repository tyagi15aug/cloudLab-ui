import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { TopBar } from "../components/layout/TopBar";
import { SendMessageDialog } from "../components/sqs/SendMessageDialog";
import { ConfirmDialog } from "../components/resource/ConfirmDialog";
import { ResourceListSection } from "../components/resource/ResourceListSection";
import type { ResourceColumn } from "../components/resource/ResourceTable";
import { PlusIcon, RefreshIcon, TrashIcon } from "../components/icons";
import { Button } from "../components/ui/Button";
import { IconButton } from "../components/ui/IconButton";
import { useDeleteMessage, useMessages } from "../hooks/useQueues";
import type { MessageResource } from "../api/types";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function QueueDetailPage() {
  const { name = "" } = useParams<{ name: string }>();
  const { data, isLoading, error, refetch, isFetching } = useMessages(name);
  const deleteMutation = useDeleteMessage(name);

  const [sendOpen, setSendOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const columns: ResourceColumn<MessageResource>[] = [
    { key: "body", header: "Body", render: (m) => <span className="font-mono text-ink">{m.body}</span> },
    { key: "sent", header: "Sent", render: (m) => formatDate(m.sent_at) },
    { key: "receives", header: "Receives", render: (m) => m.approximate_receive_count ?? "—" },
  ];

  function handleConfirmDelete() {
    if (!pendingDelete) return;
    deleteMutation.mutate(pendingDelete, { onSuccess: () => setPendingDelete(null) });
  }

  return (
    <>
      <TopBar
        title={`SQS · ${name}`}
        actions={
          <>
            <IconButton aria-label="Receive messages" onClick={() => refetch()} disabled={isFetching}>
              <RefreshIcon width={16} height={16} className={isFetching ? "animate-spin" : ""} />
            </IconButton>
            <Button variant="primary" size="sm" onClick={() => setSendOpen(true)}>
              <PlusIcon width={14} height={14} />
              Send message
            </Button>
          </>
        }
      />

      <div className="flex-1 p-6">
        <Link to="/sqs" className="mb-4 inline-block text-sm text-ink-muted hover:text-ink">
          ← Back to queues
        </Link>

        <p className="mb-4 text-sm text-ink-faint">
          SQS's ReceiveMessage is a "peek," not a live list — messages appear here only after the Refresh
          action above polls for them, matching how the API actually works.
        </p>

        <ResourceListSection
          data={data?.items}
          isLoading={isLoading}
          error={error}
          onRetry={() => refetch()}
          columns={columns}
          rowKey={(m) => m.message_id}
          emptyTitle="No messages received"
          emptyDescription="Send a message, then use Refresh to receive it."
          emptyAction={
            <Button variant="primary" size="sm" onClick={() => setSendOpen(true)}>
              Send message
            </Button>
          }
          renderActions={(message) => {
            const isDeleting = deleteMutation.isPending && pendingDelete === message.receipt_handle;
            return (
              <Button
                variant="ghost"
                size="sm"
                loading={isDeleting}
                aria-label="Delete message"
                onClick={() => setPendingDelete(message.receipt_handle)}
                className="text-ink-faint hover:!bg-danger-subtle hover:!text-danger"
              >
                {!isDeleting && <TrashIcon width={14} height={14} />}
                Delete
              </Button>
            );
          }}
        />
      </div>

      <SendMessageDialog open={sendOpen} onClose={() => setSendOpen(false)} queueName={name} />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete message"
        message="Delete this message from the queue? This can't be undone."
        confirmLabel="Delete message"
        danger
        onClose={() => {
          setPendingDelete(null);
          deleteMutation.reset();
        }}
        onConfirm={handleConfirmDelete}
        isPending={deleteMutation.isPending}
        error={deleteMutation.error}
      />
    </>
  );
}

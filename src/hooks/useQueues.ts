import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createQueue, deleteMessage, deleteQueue, listQueues, receiveMessages, sendMessage } from "../api/sqs";

export const queuesQueryKey = ["sqs", "queues"] as const;
export const messagesQueryKey = (name: string) => ["sqs", "queues", name, "messages"] as const;

export function useQueues() {
  return useQuery({
    queryKey: queuesQueryKey,
    queryFn: listQueues,
  });
}

export function useCreateQueue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createQueue(name),
    onSuccess: () => {
      // exact: true — see the note in useSendMessage. Without it this
      // would also match (and refetch/invalidate) every open queue's
      // messagesQueryKey, since that key is nested under this one.
      queryClient.invalidateQueries({ queryKey: queuesQueryKey, exact: true });
    },
  });
}

export function useDeleteQueue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => deleteQueue(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queuesQueryKey, exact: true });
    },
  });
}

export function useMessages(queueName: string) {
  return useQuery({
    queryKey: messagesQueryKey(queueName),
    queryFn: () => receiveMessages(queueName),
  });
}

export function useSendMessage(queueName: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => sendMessage(queueName, body),
    onSuccess: () => {
      // Two real bugs were found writing this one line, both from treating
      // ReceiveMessage like an idempotent "list" call (S3's ListBuckets):
      // it's actually stateful — receiving a message hides it from every
      // other ReceiveMessage call for the queue's visibility timeout.
      //
      // 1. This originally also invalidated messagesQueryKey(queueName) to
      //    "refresh" the message list after sending. That auto-refetch
      //    raced the user's own next poll: it silently received the
      //    just-sent message and hid it, so the next explicit "Receive
      //    messages" click came back empty even though the message really
      //    did arrive. Removed — polling for messages is a deliberate,
      //    explicit action (the Refresh button), never implicit.
      // 2. TanStack Query's invalidateQueries matches by *key prefix*, so
      //    invalidating queuesQueryKey (["sqs","queues"]) without
      //    `exact: true` ALSO invalidates messagesQueryKey(queueName)
      //    (["sqs","queues",name,"messages"]) — the exact same bug via a
      //    different path, since that key is nested under this one.
      queryClient.invalidateQueries({ queryKey: queuesQueryKey, exact: true });
    },
  });
}

export function useDeleteMessage(queueName: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (receiptHandle: string) => deleteMessage(queueName, receiptHandle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagesQueryKey(queueName) });
      queryClient.invalidateQueries({ queryKey: queuesQueryKey, exact: true });
    },
  });
}

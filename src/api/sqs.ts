import { apiClient } from "./client";
import type { MessageList, MessageResource, QueueList, QueueResource } from "./types";

const BASE = "/api/resources/sqs/queues";

export function listQueues(): Promise<QueueList> {
  return apiClient.get<QueueList>(BASE);
}

export function getQueue(name: string): Promise<QueueResource> {
  return apiClient.get<QueueResource>(`${BASE}/${encodeURIComponent(name)}`);
}

export function createQueue(name: string): Promise<QueueResource> {
  return apiClient.post<QueueResource>(BASE, { name });
}

export function deleteQueue(name: string): Promise<void> {
  return apiClient.delete(`${BASE}/${encodeURIComponent(name)}`);
}

export function receiveMessages(name: string): Promise<MessageList> {
  return apiClient.get<MessageList>(`${BASE}/${encodeURIComponent(name)}/messages`);
}

export function sendMessage(name: string, body: string): Promise<MessageResource> {
  return apiClient.post<MessageResource>(`${BASE}/${encodeURIComponent(name)}/messages`, { body });
}

export function deleteMessage(name: string, receiptHandle: string): Promise<void> {
  // 204 No Content — apiClient's request() already short-circuits that to
  // `undefined` without trying to parse a body.
  return apiClient.post<void>(`${BASE}/${encodeURIComponent(name)}/messages/delete`, {
    receipt_handle: receiptHandle,
  });
}

import { apiClient } from "./client";
import type { CreateTableRequest, DynamoItem, ItemList, TableList, TableResource } from "./types";

const BASE = "/api/resources/dynamodb/tables";

export function listTables(): Promise<TableList> {
  return apiClient.get<TableList>(BASE);
}

export function getTable(name: string): Promise<TableResource> {
  return apiClient.get<TableResource>(`${BASE}/${encodeURIComponent(name)}`);
}

export function createTable(request: CreateTableRequest): Promise<TableResource> {
  return apiClient.post<TableResource>(BASE, request);
}

export function deleteTable(name: string): Promise<void> {
  return apiClient.delete(`${BASE}/${encodeURIComponent(name)}`);
}

export interface ListItemsParams {
  pageSize?: number;
  cursor?: string;
}

export function listItems(name: string, { pageSize, cursor }: ListItemsParams = {}): Promise<ItemList> {
  const params = new URLSearchParams();
  if (pageSize) params.set("page_size", String(pageSize));
  if (cursor) params.set("cursor", cursor);
  const qs = params.toString();
  return apiClient.get<ItemList>(`${BASE}/${encodeURIComponent(name)}/items${qs ? `?${qs}` : ""}`);
}

export function putItem(name: string, item: DynamoItem): Promise<DynamoItem> {
  return apiClient.post<DynamoItem>(`${BASE}/${encodeURIComponent(name)}/items`, { item });
}

export function deleteItem(name: string, key: DynamoItem): Promise<void> {
  return apiClient.post<void>(`${BASE}/${encodeURIComponent(name)}/items/delete`, { key });
}

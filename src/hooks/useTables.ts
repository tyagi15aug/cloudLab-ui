import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTable, deleteItem, deleteTable, getTable, listItems, listTables, putItem } from "../api/dynamodb";
import type { CreateTableRequest, DynamoItem } from "../api/types";

export const tablesQueryKey = ["dynamodb", "tables"] as const;
export const tableQueryKey = (name: string) => ["dynamodb", "tables", name] as const;
export const itemsQueryKey = (tableName: string, cursor?: string) =>
  ["dynamodb", "tables", tableName, "items", cursor ?? null] as const;

export function useTables() {
  return useQuery({
    queryKey: tablesQueryKey,
    queryFn: listTables,
  });
}

export function useTable(name: string) {
  return useQuery({
    queryKey: tableQueryKey(name),
    queryFn: () => getTable(name),
    enabled: Boolean(name),
  });
}

export function useCreateTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateTableRequest) => createTable(request),
    onSuccess: () => {
      // exact: true so this doesn't also match (and refetch) every open
      // table's tableQueryKey/itemsQueryKey — those are nested under
      // tablesQueryKey and would otherwise match by prefix too. Unlike
      // SQS's ReceiveMessage, DynamoDB's reads here (Scan/DescribeTable)
      // are side-effect-free, so a stray cascade wouldn't corrupt data —
      // it would just be wasted refetching.
      queryClient.invalidateQueries({ queryKey: tablesQueryKey, exact: true });
    },
  });
}

export function useDeleteTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => deleteTable(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tablesQueryKey, exact: true });
    },
  });
}

export function useItems(tableName: string, cursor?: string) {
  return useQuery({
    queryKey: itemsQueryKey(tableName, cursor),
    queryFn: () => listItems(tableName, { cursor }),
  });
}

export function usePutItem(tableName: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: DynamoItem) => putItem(tableName, item),
    onSuccess: () => {
      // No `exact` here on purpose — this key is a prefix of every
      // itemsQueryKey(tableName, cursor) variant, and invalidating all of
      // them (every paginated cursor page for this table) is exactly what
      // should happen after a write. Scan-based reads have no
      // ReceiveMessage-style side effects, so refetching them is safe.
      queryClient.invalidateQueries({ queryKey: ["dynamodb", "tables", tableName, "items"] });
      queryClient.invalidateQueries({ queryKey: tablesQueryKey, exact: true });
    },
  });
}

export function useDeleteItem(tableName: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (key: DynamoItem) => deleteItem(tableName, key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dynamodb", "tables", tableName, "items"] });
      queryClient.invalidateQueries({ queryKey: tablesQueryKey, exact: true });
    },
  });
}

"use client";

import { useQuery } from "@tanstack/react-query";
import {
  listOrders,
  type OrderHistoryQuery,
} from "@/services/orderService";
import { useIsAuthed } from "@/hooks/useIsAuthed";

export const orderKeys = {
  list: (q: OrderHistoryQuery) => ["orders", "list", q] as const,
};

export function useOrders(q: OrderHistoryQuery = {}) {
  const isAuthed = useIsAuthed();
  return useQuery({
    queryKey: orderKeys.list(q),
    queryFn: () => listOrders(q),
    enabled: isAuthed,
    staleTime: 30_000,
  });
}

import { useState } from "react";

/** Client-side cursor-stack pagination (Phase 3.4). The backend's cursor
 * is forward-only (an opaque token for "the next page"), so "Previous"
 * isn't something the API can answer on its own — this hook keeps the
 * stack of cursors already visited so going back is just popping it.
 * Shared by every paginated list in the app (S3 buckets, DynamoDB tables,
 * DynamoDB items) instead of each page re-deriving it. */
export function useCursorPager() {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [history, setHistory] = useState<(string | undefined)[]>([]);

  function goNext(nextCursor: string | null | undefined) {
    if (!nextCursor) return;
    setHistory((h) => [...h, cursor]);
    setCursor(nextCursor);
  }

  function goPrev() {
    setHistory((h) => {
      if (h.length === 0) return h;
      setCursor(h[h.length - 1]);
      return h.slice(0, -1);
    });
  }

  function reset() {
    setCursor(undefined);
    setHistory([]);
  }

  return { cursor, goNext, goPrev, reset, hasPrev: history.length > 0 };
}

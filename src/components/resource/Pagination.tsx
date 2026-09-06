import { Button } from "../ui/Button";

export interface PaginationProps {
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  disabled?: boolean;
}

/** Prev/Next controls for the cursor pagination every listing endpoint
 * uses — pairs with the `useCursorPager` hook, which tracks the cursor
 * stack "Previous" needs (a cursor is forward-only by design; see the
 * backend's pagination docs). */
export function Pagination({ hasPrev, hasNext, onPrev, onNext, disabled }: PaginationProps) {
  if (!hasPrev && !hasNext) return null;

  return (
    <div className="mt-3 flex items-center justify-end gap-2">
      <Button variant="ghost" size="sm" onClick={onPrev} disabled={!hasPrev || disabled}>
        Previous
      </Button>
      <Button variant="ghost" size="sm" onClick={onNext} disabled={!hasNext || disabled}>
        Next
      </Button>
    </div>
  );
}

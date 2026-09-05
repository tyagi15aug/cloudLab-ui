import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "../icons";
import { IconButton } from "./IconButton";

export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape-to-close. Kept separate from the autofocus effect below: onClose
  // is a new function identity on every parent render (it closes over
  // component state), and re-running *that* effect harmlessly re-binds a
  // listener — but sharing the dependency array with the focus effect would
  // re-run the focus() call on every keystroke inside the dialog and yank
  // focus back to the first field mid-typing.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Move focus into the dialog once, when it opens — not on every re-render.
  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>("input, button, [tabindex]")?.focus();
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* A modal scrim darkens the page in both themes — it should never
          use the `ink` token, which is near-white in dark mode and would
          wash the backdrop out instead of dimming it. */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="relative w-full max-w-md rounded-xl border border-border bg-surface-raised p-5 shadow-raised"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="dialog-title" className="text-base font-semibold text-ink">
            {title}
          </h2>
          <IconButton aria-label="Close dialog" onClick={onClose}>
            <CloseIcon width={16} height={16} />
          </IconButton>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

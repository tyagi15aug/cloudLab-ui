import type { ReactNode } from "react";
import { StatusPill } from "./StatusPill";
import { ThemeToggle } from "./ThemeToggle";

export function TopBar({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
      <h1 className="text-sm font-semibold text-ink">{title}</h1>
      <div className="flex items-center gap-3">
        {actions}
        <StatusPill />
        <ThemeToggle />
      </div>
    </header>
  );
}

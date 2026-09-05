import { useTheme } from "../../theme/ThemeProvider";
import type { ThemePreference } from "../../theme/ThemeProvider";
import { MonitorIcon, MoonIcon, SunIcon } from "../icons";

const options: { value: ThemePreference; label: string; icon: typeof SunIcon }[] = [
  { value: "light", label: "Light theme", icon: SunIcon },
  { value: "system", label: "Use system theme", icon: MonitorIcon },
  { value: "dark", label: "Dark theme", icon: MoonIcon },
];

export function ThemeToggle() {
  const { preference, setPreference } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex items-center rounded-lg border border-border bg-surface-sunken p-0.5"
    >
      {options.map(({ value, label, icon: Icon }) => {
        const active = preference === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setPreference(value)}
            className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors
              ${active ? "bg-surface-raised text-ink shadow-soft" : "text-ink-faint hover:text-ink-muted"}`}
          >
            <Icon width={15} height={15} />
          </button>
        );
      })}
    </div>
  );
}

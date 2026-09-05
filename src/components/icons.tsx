// Small hand-rolled icon set (stroke-based, 20x20) rather than an icon
// library dependency — a handful of glyphs doesn't justify the package.
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function SunIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="10" cy="10" r="3.25" />
      <path d="M10 2.5v1.75M10 15.75v1.75M4.4 4.4l1.24 1.24M14.36 14.36l1.24 1.24M2.5 10h1.75M15.75 10h1.75M4.4 15.6l1.24-1.24M14.36 5.64l1.24-1.24" />
    </svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M16.5 12.4A6.9 6.9 0 0 1 7.6 3.5a7 7 0 1 0 8.9 8.9Z" />
    </svg>
  );
}

export function MonitorIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="2.5" y="3.5" width="15" height="10" rx="1.5" />
      <path d="M7 17h6M10 13.5V17" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M10 4.5v11M4.5 10h11" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 6h12M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6M6 6l.6 9.4a1.5 1.5 0 0 0 1.5 1.4h3.8a1.5 1.5 0 0 0 1.5-1.4L14 6" />
    </svg>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M16 10a6 6 0 1 1-1.76-4.24M16 3v3.5h-3.5" />
    </svg>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M10 3.5 2.75 16h14.5L10 3.5Z" />
      <path d="M10 8.25v3.25M10 14.25h.01" strokeWidth="1.8" />
    </svg>
  );
}

export function InboxIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 10.5 5 4h10l2 6.5M3 10.5v4A1.5 1.5 0 0 0 4.5 16h11a1.5 1.5 0 0 0 1.5-1.5v-4M3 10.5h4.2l.8 2h4l.8-2H17" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 5l10 10M15 5 5 15" />
    </svg>
  );
}

export function SpinnerIcon(props: IconProps) {
  return (
    <svg
      {...base}
      strokeWidth={2}
      className={`animate-spin ${props.className ?? ""}`}
      {...props}
    >
      <path d="M10 2.75a7.25 7.25 0 1 0 7.25 7.25" />
    </svg>
  );
}

export function BucketIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 6.5h11l-1.1 9.2a1.5 1.5 0 0 1-1.49 1.3H7.1a1.5 1.5 0 0 1-1.49-1.3L4.5 6.5Z" />
      <path d="M3.5 6.5h13M7.5 6.5V5a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v1.5" />
    </svg>
  );
}

export function ExternalLinkIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8.5 4.5h-3a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3M11.5 3.5h5v5M16 4l-7 7" />
    </svg>
  );
}

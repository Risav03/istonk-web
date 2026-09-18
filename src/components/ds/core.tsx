import type {
  ButtonHTMLAttributes,
  CSSProperties,
  HTMLAttributes,
  ReactNode,
} from "react";

/* ── Button ──────────────────────────────────────────────
   The one pill. Ink is the primary action; accent is reserved for
   "start a message" and there is only ever one per view. */

type ButtonVariant =
  | "primary"
  | "accent"
  | "outline"
  | "quiet"
  | "ghost"
  | "danger";
type ButtonSize = "sm" | "md" | "lg";

const BTN_SIZES: Record<ButtonSize, CSSProperties> = {
  sm: { height: 34, padding: "0 14px", font: "600 13px/1 var(--font-text)" },
  md: { height: 44, padding: "0 20px", font: "600 15px/1 var(--font-text)" },
  lg: { height: 52, padding: "0 26px", font: "650 16px/1 var(--font-text)" },
};

const BTN_VARIANTS: Record<ButtonVariant, CSSProperties> = {
  primary: {
    background: "var(--action-primary)",
    color: "var(--text-on-ink)",
    border: "1px solid var(--action-primary)",
    boxShadow: "var(--shadow-card)",
  },
  accent: {
    background: "var(--action-accent)",
    color: "#fff",
    border: "1px solid var(--action-accent)",
    boxShadow: "var(--shadow-accent)",
  },
  outline: {
    background: "transparent",
    color: "var(--text-primary)",
    border: "1px solid var(--border-strong)",
  },
  quiet: {
    background: "var(--bg-sunk)",
    color: "var(--text-primary)",
    border: "1px solid transparent",
  },
  ghost: {
    background: "transparent",
    color: "var(--text-secondary)",
    border: "1px solid transparent",
  },
  danger: {
    background: "var(--down)",
    color: "#fff",
    border: "1px solid var(--down)",
  },
};

export type ButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: "pill" | "square";
  busy?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  shape = "pill",
  busy = false,
  disabled,
  icon,
  children,
  style,
  className,
  ...rest
}: ButtonProps) {
  const off = disabled || busy;
  return (
    <button
      type="button"
      disabled={off}
      className={className ? `istonk-press ${className}` : "istonk-press"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        whiteSpace: "nowrap",
        cursor: off ? "not-allowed" : "pointer",
        borderRadius: shape === "pill" ? "var(--r-pill)" : "var(--r-field)",
        letterSpacing: "var(--track-tight)",
        ...BTN_SIZES[size],
        ...BTN_VARIANTS[variant],
        ...(off
          ? {
              background: "var(--action-disabled)",
              color: "var(--text-tertiary)",
              border: "1px solid transparent",
              boxShadow: "none",
            }
          : null),
        ...style,
      }}
      {...rest}
    >
      {busy ? <Spinner /> : icon}
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <span
      className="istonk-spin"
      style={{
        width: 14,
        height: 14,
        borderRadius: "var(--r-pill)",
        border: "2px solid currentColor",
        borderTopColor: "transparent",
        display: "inline-block",
      }}
    />
  );
}

/* ── Chip ────────────────────────────────────────────────
   Pill-shaped label. Ticker chips use mono; word chips use text. */

type ChipTone = "neutral" | "ink" | "accent" | "paper";

const CHIP_TONES: Record<ChipTone, CSSProperties> = {
  neutral: {
    background: "var(--bg-sunk)",
    color: "var(--text-secondary)",
    border: "1px solid var(--border-hairline)",
  },
  ink: {
    background: "var(--ink)",
    color: "var(--text-on-ink)",
    border: "1px solid var(--ink)",
  },
  accent: {
    background: "var(--tang-50)",
    color: "var(--tang-ink)",
    border: "1px solid var(--tang-100)",
  },
  paper: {
    background: "var(--surface)",
    color: "var(--text-primary)",
    border: "1px solid var(--border-hairline)",
  },
};

export function Chip({
  tone = "neutral",
  mono = false,
  dot,
  icon,
  children,
  style,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: ChipTone;
  mono?: boolean;
  dot?: boolean | string;
  icon?: ReactNode;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        height: 30,
        padding: "0 12px",
        borderRadius: "var(--r-pill)",
        font: mono ? "var(--type-mono)" : "var(--type-label)",
        letterSpacing: mono ? 0 : "var(--track-tight)",
        ...CHIP_TONES[tone],
        ...style,
      }}
      {...rest}
    >
      {dot ? (
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "var(--r-pill)",
            background: dot === true ? "var(--live)" : dot,
            flexShrink: 0,
          }}
        />
      ) : null}
      {icon}
      {children}
    </span>
  );
}

/* ── Badge ───────────────────────────────────────────────
   The six market states. Square-ish, not a pill: status is data,
   not conversation. */

export type BadgeState =
  | "up"
  | "down"
  | "pending"
  | "live"
  | "escrow"
  | "claimed";

const BADGE_STATES: Record<
  BadgeState,
  { label: string; fg: string; bg: string }
> = {
  up: { label: "up", fg: "var(--up)", bg: "var(--up-tint)" },
  down: { label: "down", fg: "var(--down)", bg: "var(--down-tint)" },
  pending: {
    label: "pending",
    fg: "var(--pending)",
    bg: "var(--pending-tint)",
  },
  live: { label: "live", fg: "var(--live)", bg: "var(--up-tint)" },
  escrow: { label: "in escrow", fg: "var(--escrow)", bg: "var(--escrow-tint)" },
  claimed: {
    label: "claimed",
    fg: "var(--claimed)",
    bg: "var(--claimed-tint)",
  },
};

export function Badge({
  state = "pending",
  children,
  style,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { state?: BadgeState }) {
  const s = BADGE_STATES[state] ?? BADGE_STATES.pending;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        minHeight: 22,
        padding: "0 8px",
        borderRadius: "var(--r-xs)",
        background: s.bg,
        color: s.fg,
        font: "var(--type-micro)",
        letterSpacing: "0.02em",
        ...style,
      }}
      {...rest}
    >
      {state === "live" || state === "pending" ? (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "var(--r-pill)",
            background: "currentColor",
            opacity: state === "pending" ? 0.6 : 1,
            flexShrink: 0,
          }}
        />
      ) : null}
      {children ?? s.label}
    </span>
  );
}

/* ── Avatar ──────────────────────────────────────────────
   The mascot render is the bot's only avatar; humans get initials
   on paper. */

export function Avatar({
  src,
  name = "",
  size = 40,
  ring = false,
  style,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & {
  src?: string | null;
  name?: string;
  size?: number;
  ring?: boolean;
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span
      className={ring ? "istonk-iris-edge" : undefined}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: "var(--r-pill)",
        overflow: "hidden",
        background: src ? "var(--paper-2)" : "var(--surface-sunk)",
        color: "var(--text-secondary)",
        font: `600 ${Math.round(size * 0.36)}px/1 var(--font-text)`,
        flexShrink: 0,
        ...style,
      }}
      {...rest}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          width={size}
          height={size}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        initials || "?"
      )}
    </span>
  );
}

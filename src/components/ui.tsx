import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function Logo({ size = 26 }: { size?: number }) {
  const glyph = Math.round(size * 0.54);
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-[30%] bg-primary"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        width={glyph}
        height={glyph}
        viewBox="0 0 16 16"
        fill="none"
        stroke="var(--primary-foreground)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 11 6.5 6.5 9.5 9.5 14 5" />
        <path d="M10 5h4v4" />
      </svg>
    </span>
  );
}

type ButtonVariant = "primary" | "outline" | "ghost";

export function Button({
  variant = "primary",
  busy = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; busy?: boolean }) {
  const base =
    "inline-flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed";
  const styles: Record<ButtonVariant, string> = {
    primary:
      "bg-primary text-primary-foreground hover:bg-primary-hover disabled:bg-disabled disabled:text-faint",
    outline:
      "border border-border-strong text-foreground hover:bg-chip disabled:text-faint",
    ghost: "text-muted hover:text-foreground disabled:text-faint",
  };
  return (
    <button type="button" className={cx(base, styles[variant], className)} disabled={disabled || busy} {...rest}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

export function Card({ className, accent = false, ...rest }: HTMLAttributes<HTMLDivElement> & { accent?: boolean }) {
  return (
    <div
      className={cx(
        "flex flex-col overflow-hidden rounded-[14px] border bg-card",
        accent ? "border-primary-border" : "border-border",
        className,
      )}
      {...rest}
    />
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 pb-3.5 pt-[18px]">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold">{title}</span>
        {subtitle ? <span className="text-xs text-muted">{subtitle}</span> : null}
      </div>
      {action}
    </div>
  );
}

export function Row({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx("flex items-center justify-between gap-4 border-t border-hairline px-5 py-3.5", className)}
      {...rest}
    />
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs text-muted">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "h-11 w-full rounded-[10px] border border-border-strong bg-background px-3.5 text-sm outline-none transition-colors focus:border-primary";

export function Pill({ tone = "neutral", children }: { tone?: "primary" | "neutral"; children: ReactNode }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2 py-[3px] text-xs",
        tone === "primary" ? "bg-primary-dim text-primary" : "text-faint",
      )}
    >
      {children}
    </span>
  );
}

export function Bubble({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-[14px] bg-primary px-3 py-1.5 font-mono text-xs text-primary-foreground">
      {children}
    </span>
  );
}

export function ExternalIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 2h5v5" />
      <path d="M14 2 7 9" />
    </svg>
  );
}

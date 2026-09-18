import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

/* ── Toast ───────────────────────────────────────────────
   Ink pill that slides in from the bottom. One line, past tense,
   no icon zoo. */

type ToastTone = "ink" | "up" | "down";

const TOAST_TONES: Record<ToastTone, CSSProperties> = {
  ink: { background: "var(--ink)", color: "var(--text-on-ink)" },
  up: { background: "var(--up)", color: "#fff" },
  down: { background: "var(--down)", color: "#fff" },
};

export function Toast({
  tone = "ink",
  action,
  children,
  style,
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  tone?: ToastTone;
  action?: ReactNode;
}) {
  return (
    <div
      role="status"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 14,
        minHeight: 46,
        padding: action ? "0 8px 0 18px" : "0 18px",
        borderRadius: "var(--r-pill)",
        boxShadow: "var(--shadow-pop)",
        font: "var(--type-label)",
        letterSpacing: "var(--track-tight)",
        ...TOAST_TONES[tone],
        ...style,
      }}
      {...rest}
    >
      <span>{children}</span>
      {action ? (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            height: 32,
            padding: "0 14px",
            borderRadius: "var(--r-pill)",
            background: "rgba(255,255,255,.16)",
            font: "var(--type-label)",
          }}
        >
          {action}
        </span>
      ) : null}
    </div>
  );
}

/* ── Product chrome ──────────────────────────────────────
   Cards are white with a 1px hairline and a short warm shadow. Lists
   inside them are separated by hairlines, not boxed again. */

export function Panel({
  children,
  style,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border-hairline)",
        borderRadius: "var(--r-card)",
        boxShadow: "var(--shadow-card)",
        overflow: "hidden",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

export function PanelHead({
  title,
  sub,
  action,
}: {
  title: ReactNode;
  sub?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3.5 px-5 pt-4 pb-3">
      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <span style={{ font: "var(--type-h3)" }}>{title}</span>
        {sub ? (
          <span
            style={{ font: "var(--type-body-sm)", color: "var(--text-secondary)" }}
          >
            {sub}
          </span>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function SectionHead({
  title,
  sub,
  action,
}: {
  title: ReactNode;
  sub?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="type-h2 font-text-face">{title}</h2>
        {sub ? (
          <p
            style={{
              font: "var(--type-body-sm)",
              color: "var(--text-secondary)",
              marginTop: 4,
            }}
          >
            {sub}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

/** Uppercase micro label. Metadata, table heads, section eyebrows. */
export function Eyebrow({
  children,
  style,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="istonk-caps" style={style} {...rest}>
      {children}
    </div>
  );
}

import type { HTMLAttributes, ReactNode } from "react";

import { Avatar } from "./core";

/* ── Bubble ──────────────────────────────────────────────
   iStonk never restyles Apple's chrome: incoming stays system grey,
   outgoing stays iMessage blue (or SMS green in a mixed thread). The
   brand lives in what is attached to the bubble, not in the bubble. */

export function Bubble({
  from = "bot",
  channel = "imessage",
  tail = true,
  mono = false,
  night = false,
  children,
  style,
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  from?: "bot" | "you";
  channel?: "imessage" | "sms";
  tail?: boolean;
  mono?: boolean;
  night?: boolean;
}) {
  const out = from === "you";
  const bg = out
    ? channel === "sms"
      ? "var(--msg-sms)"
      : "var(--msg-out)"
    : night
      ? "#26262a"
      : "var(--msg-in)";
  const fg = out
    ? "var(--msg-out-ink)"
    : night
      ? "var(--night-ink)"
      : "var(--msg-in-ink)";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: out ? "flex-end" : "flex-start",
        ...style,
      }}
      {...rest}
    >
      <p
        style={{
          margin: 0,
          maxWidth: "76%",
          padding: "8px 13px",
          background: bg,
          color: fg,
          borderRadius: "var(--r-bubble)",
          borderBottomRightRadius:
            out && tail ? "var(--r-bubble-tail)" : "var(--r-bubble)",
          borderBottomLeftRadius:
            !out && tail ? "var(--r-bubble-tail)" : "var(--r-bubble)",
          font: mono ? "var(--type-mono)" : "400 16px/1.32 var(--font-text)",
          letterSpacing: "-0.01em",
          whiteSpace: "pre-line",
          overflowWrap: "anywhere",
        }}
      >
        {children}
      </p>
    </div>
  );
}

/* ── Tapback ─────────────────────────────────────────────
   Reaction badge pinned to a bubble corner. iStonk reads tapbacks;
   it never sends them. */

type TapbackKind = "heart" | "like" | "dislike" | "haha" | "exclaim" | "question";

const TAPBACK_GLYPHS: Record<TapbackKind, string> = {
  heart: "♥",
  like: "👍",
  dislike: "👎",
  haha: "!!",
  exclaim: "!!",
  question: "?",
};

export function Tapback({
  kind = "like",
  side = "left",
  style,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & {
  kind?: TapbackKind;
  side?: "left" | "right";
}) {
  const bold = kind === "heart" || kind === "exclaim" || kind === "question";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 30,
        height: 26,
        padding: "0 7px",
        borderRadius: "var(--r-pill)",
        background: "var(--surface)",
        border: "1px solid var(--border-hairline)",
        boxShadow: "var(--shadow-card)",
        font: bold ? "600 14px/1 var(--font-text)" : "13px/1 var(--font-text)",
        color: kind === "heart" ? "var(--down)" : "var(--text-primary)",
        [side === "left" ? "marginRight" : "marginLeft"]: -6,
        ...style,
      }}
      {...rest}
    >
      {TAPBACK_GLYPHS[kind]}
    </span>
  );
}

/* ── LinkPreview ─────────────────────────────────────────
   The rich link card iMessage renders for connect, Apple Pay and
   token URLs. */

export function LinkPreview({
  imageSrc,
  imageBg = "var(--paper-2)",
  eyebrow,
  title,
  domain,
  compact = false,
  style,
  ...rest
}: Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  imageSrc?: string;
  imageBg?: string;
  eyebrow?: ReactNode;
  title: ReactNode;
  domain: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        width: compact ? 232 : 268,
        borderRadius: "var(--r-md)",
        overflow: "hidden",
        background: "var(--msg-in)",
        boxShadow: "var(--shadow-flat)",
        ...style,
      }}
      {...rest}
    >
      <div
        style={{
          height: compact ? 96 : 138,
          background: imageBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : null}
      </div>
      <div
        style={{
          padding: "9px 12px 11px",
          background: "#dedee2",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {eyebrow ? (
          <span
            style={{
              font: "var(--type-micro)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "#5b5b63",
            }}
          >
            {eyebrow}
          </span>
        ) : null}
        <span style={{ font: "600 14px/1.25 var(--font-text)", color: "#000" }}>
          {title}
        </span>
        <span style={{ font: "var(--type-mono-sm)", color: "#6b6b73" }}>
          {domain}
        </span>
      </div>
    </div>
  );
}

/* ── ThreadHeader ────────────────────────────────────────
   Messages thread header: avatar over name, chevron, info button. */

export function ThreadHeader({
  name = "iStonk",
  avatarSrc,
  subtitle,
  night = false,
  style,
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  name?: string;
  avatarSrc?: string;
  subtitle?: ReactNode;
  night?: boolean;
}) {
  const ink = night ? "var(--night-ink)" : "#000";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "6px 14px 10px",
        background: night ? "rgba(20,20,24,.86)" : "rgba(246,246,246,.86)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        borderBottom: `0.5px solid ${
          night ? "var(--night-rule)" : "rgba(0,0,0,.14)"
        }`,
        ...style,
      }}
      {...rest}
    >
      <span
        style={{
          font: "400 17px/1 var(--font-text)",
          color: "var(--msg-out)",
          flexShrink: 0,
        }}
      >
        ‹
      </span>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
          flex: 1,
        }}
      >
        <Avatar src={avatarSrc} name={name} size={38} />
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            font: "500 12px/1 var(--font-text)",
            color: ink,
          }}
        >
          {name}
          <span
            style={{
              color: night ? "var(--night-slate)" : "#8a8a90",
              fontSize: 10,
            }}
          >
            ›
          </span>
        </span>
        {subtitle ? (
          <span
            style={{
              font: "var(--type-mono-sm)",
              color: night ? "var(--night-slate)" : "#8a8a90",
            }}
          >
            {subtitle}
          </span>
        ) : null}
      </div>
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: "var(--r-pill)",
          border: "1.5px solid var(--msg-out)",
          color: "var(--msg-out)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          font: "600 12px/1 var(--font-text)",
          flexShrink: 0,
        }}
      >
        i
      </span>
    </div>
  );
}

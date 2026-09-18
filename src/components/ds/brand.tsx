import Image from "next/image";
import type { CSSProperties } from "react";

export const MASCOT_SRC = "/brand/squawk.png";
export const MASCOT_AVATAR_SRC = "/brand/squawk-avatar.png";
export const OG_SRC = "/brand/og.png";

/**
 * Squawk, the mark. A 3D render with two eyes and a specular highlight — below
 * ~28px it stops reading as a face, so 34px is the hard floor anywhere.
 */
export function Mascot({
  size = 34,
  priority = false,
  className,
  style,
}: {
  size?: number;
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const px = Math.max(34, Math.round(size));
  return (
    <Image
      src={MASCOT_SRC}
      alt=""
      width={px}
      height={px}
      priority={priority}
      className={className}
      style={{ display: "block", width: px, height: px, ...style }}
    />
  );
}

/**
 * The flat lockup: the mascot PNG plus "iStonk" in Bricolage Grotesque 800.
 * There is no vector wordmark file — this is the wordmark. The mark sits at
 * roughly 1.75× the type size.
 */
export function Wordmark({
  size = 19,
  markSize,
  priority = false,
  style,
}: {
  size?: number;
  markSize?: number;
  priority?: boolean;
  style?: CSSProperties;
}) {
  const m = markSize ?? Math.max(34, Math.round(size * 1.75));
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: Math.round(size * 0.34),
        ...style,
      }}
    >
      <Mascot
        size={m}
        priority={priority}
        style={{ marginLeft: -Math.round(m * 0.08) }}
      />
      <span
        style={{
          font: `800 ${size}px/1 var(--font-display)`,
          letterSpacing: "-0.04em",
        }}
      >
        iStonk
      </span>
    </span>
  );
}

/** The message glyph. Tangerine icons live only inside the accent pill. */
export function MsgGlyph({ size = 17 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 11.5a8.4 8.4 0 0 1-8.6 8.4 9.3 9.3 0 0 1-3.6-.7L3 21l1.5-4.2A8.2 8.2 0 0 1 3 11.5 8.4 8.4 0 0 1 11.6 3 8.4 8.4 0 0 1 21 11.5Z" />
    </svg>
  );
}

/** Newsprint grain. Requires a positioned parent. */
export function Grain() {
  return (
    <span
      aria-hidden
      className="istonk-grain pointer-events-none absolute inset-0"
    />
  );
}

/** `↗` is the external-link mark. Unicode, not an icon. */
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

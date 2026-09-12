"use client";

import { useEffect, useId } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

/**
 * Glass speech-bubble mark. Pupils drift toward the cursor.
 * Drop the real render at /public/brand/mascot.png and swap `<Mascot>` for an <img>
 * if you'd rather use the 3D asset; this SVG keeps the page dependency-free.
 */
export function Mascot({
  size = 320,
  track = true,
  className,
}: {
  size?: number;
  track?: boolean;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const px = useSpring(useTransform(mx, [-1, 1], [-9, 9]), { stiffness: 120, damping: 14 });
  const py = useSpring(useTransform(my, [-1, 1], [-7, 7]), { stiffness: 120, damping: 14 });

  useEffect(() => {
    if (!track) return;
    const onMove = (e: PointerEvent) => {
      mx.set((e.clientX / window.innerWidth) * 2 - 1);
      my.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [track, mx, my]);

  const g = (n: string) => `url(#${uid}-${n})`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 400 400"
      fill="none"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={`${uid}-body`} x1="60" y1="90" x2="340" y2="320" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3b6bff" />
          <stop offset="0.35" stopColor="#2b4de0" />
          <stop offset="0.6" stopColor="#ff5ad9" />
          <stop offset="0.82" stopColor="#ffa24a" />
          <stop offset="1" stopColor="#3ad4ff" />
        </linearGradient>
        <radialGradient id={`${uid}-sheen`} cx="0.3" cy="0.2" r="0.8">
          <stop offset="0" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0.15" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-rim`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="0.4" stopColor="#ffd6f5" stopOpacity="0.5" />
          <stop offset="0.7" stopColor="#8fd8ff" stopOpacity="0.6" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.9" />
        </linearGradient>
        <radialGradient id={`${uid}-eye`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.7" stopColor="#eef3ff" />
          <stop offset="1" stopColor="#bcd0ff" />
        </radialGradient>
        <linearGradient id={`${uid}-eyerim`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7fb6ff" />
          <stop offset="0.5" stopColor="#ff8ee6" />
          <stop offset="1" stopColor="#ffc46b" />
        </linearGradient>
        <radialGradient id={`${uid}-pupil`} cx="0.35" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#2a2f45" />
          <stop offset="1" stopColor="#05060d" />
        </radialGradient>
        <filter id={`${uid}-shadow`} x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="22" stdDeviation="22" floodColor="#4a3cff" floodOpacity="0.28" />
        </filter>
        <filter id={`${uid}-blur`}>
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {/* body */}
      <g filter={`url(#${uid}-shadow)`}>
        <path
          d="M118 84h172c46 0 76 30 76 74v62c0 44-30 74-76 74H190l-52 40c-8 6-18 0-16-10l6-30h-10c-46 0-76-30-76-74v-62c0-44 30-74 76-74Z"
          fill={g("body")}
        />
      </g>
      {/* inner refraction */}
      <path
        d="M124 100h160c38 0 62 24 62 60v58c0 36-24 60-62 60H186l-40 30 6-30h-28c-38 0-62-24-62-60v-58c0-36 24-60 62-60Z"
        fill="none"
        stroke={g("rim")}
        strokeWidth="6"
        opacity="0.8"
      />
      {/* top sheen */}
      <path
        d="M118 84h172c46 0 76 30 76 74v62c0 44-30 74-76 74H190l-52 40c-8 6-18 0-16-10l6-30h-10c-46 0-76-30-76-74v-62c0-44 30-74 76-74Z"
        fill={g("sheen")}
      />
      {/* glossy highlight streak */}
      <ellipse cx="160" cy="112" rx="70" ry="14" fill="#fff" opacity="0.55" filter={`url(#${uid}-blur)`} />

      {/* eyes */}
      {[
        { cx: 158, cy: 190 },
        { cx: 248, cy: 190 },
      ].map((e, i) => (
        <g key={i}>
          <circle cx={e.cx} cy={e.cy} r="56" fill={g("eyerim")} opacity="0.9" />
          <circle cx={e.cx} cy={e.cy} r="50" fill={g("eye")} />
          <motion.g style={{ x: px, y: py }}>
            <circle cx={e.cx + 8} cy={e.cy + 4} r="24" fill={g("pupil")} />
            <circle cx={e.cx + 16} cy={e.cy - 6} r="6" fill="#fff" />
            <circle cx={e.cx + 2} cy={e.cy + 12} r="2.5" fill="#fff" opacity="0.7" />
          </motion.g>
          <circle cx={e.cx - 22} cy={e.cy - 26} r="9" fill="#fff" opacity="0.8" />
        </g>
      ))}
    </svg>
  );
}

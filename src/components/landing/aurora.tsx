"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

const blobs = [
  { color: "rgba(255, 120, 215, 0.6)", size: 640, x: "0%", y: "0%", drift: 40, dur: 26 },
  { color: "rgba(110, 160, 255, 0.6)", size: 720, x: "58%", y: "-6%", drift: -50, dur: 32 },
  { color: "rgba(255, 180, 90, 0.6)", size: 560, x: "66%", y: "40%", drift: 36, dur: 28 },
  { color: "rgba(160, 140, 255, 0.6)", size: 680, x: "-4%", y: "48%", drift: -44, dur: 30 },
  { color: "rgba(100, 220, 255, 0.6)", size: 520, x: "34%", y: "62%", drift: 30, dur: 24 },
  { color: "rgba(255, 230, 120, 0.5)", size: 480, x: "72%", y: "72%", drift: -28, dur: 27 },
];

/** Slow-moving pastel blobs behind the page; drifts upward with scroll for depth. */
export function Aurora() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "-18%"]);

  return (
    <div className="aurora-wash pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <motion.div style={{ y }} className="absolute inset-[-10%]">
        {blobs.map((b, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full blur-3xl"
            style={{
              width: b.size,
              height: b.size,
              left: b.x,
              top: b.y,
              background: `radial-gradient(circle at 40% 40%, ${b.color}, transparent 70%)`,
            }}
            animate={
              reduce
                ? undefined
                : {
                    x: [0, b.drift, -b.drift * 0.6, 0],
                    y: [0, -b.drift * 0.8, b.drift * 0.5, 0],
                    scale: [1, 1.08, 0.96, 1],
                  }
            }
            transition={{ duration: b.dur, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </motion.div>
      {/* white centre so copy stays legible, like the brand render */}
      <div className="absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_45%,rgba(255,255,255,0.55),rgba(255,255,255,0)_75%)]" />
      {/* fine grain */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />
    </div>
  );
}

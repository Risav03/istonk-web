"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Pair assets from the Stonks QuoteRegistry. Order is decorative. */
const pairs = ["AAPL", "NVDA", "TSLA", "ETH", "STONKEX", "MSFT", "GOOGL", "cbBTC", "META", "AMZN", "COIN", "HOOD"];

export function Ticker() {
  const reduce = useReducedMotion();
  const row = [...pairs, ...pairs];
  return (
    <section aria-label="Pairable assets" className="relative w-full overflow-hidden py-6">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-[linear-gradient(90deg,var(--background),transparent)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-[linear-gradient(270deg,var(--background),transparent)]" />
      <div className="mx-auto mb-4 max-w-6xl px-6 text-center text-[12px] font-medium uppercase tracking-[0.18em] text-faint">
        Pair your coin against a live quote on Base
      </div>
      <motion.div
        className="flex w-max gap-3"
        animate={reduce ? undefined : { x: ["0%", "-50%"] }}
        transition={{ duration: 38, repeat: Infinity, ease: "linear" }}
      >
        {row.map((p, i) => (
          <span
            key={`${p}-${i}`}
            className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 font-mono text-[13px] font-semibold text-foreground"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{
                background: `hsl(${(i * 47) % 360} 90% 65%)`,
              }}
            />
            vs {p}
          </span>
        ))}
      </motion.div>
    </section>
  );
}

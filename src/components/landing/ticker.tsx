"use client";

import { useLiteMotion } from "./motion";

/** Coinbase B20 names live on https://www.base.org/stocks — the only stocks iStonk can send. */
const stocks = [
  "Apple",
  "Amazon",
  "Alphabet",
  "Meta",
  "Microsoft",
  "Strategy",
  "SanDisk",
  "SpaceX",
  "Tesla",
];

function Chip({ p, i }: { p: string; i: number }) {
  return (
    <span className="glass inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 font-mono text-[13px] font-semibold text-foreground">
      <span className="h-2 w-2 rounded-full" style={{ background: `hsl(${(i * 47) % 360} 90% 65%)` }} />
      {p}
    </span>
  );
}

export function Ticker() {
  const lite = useLiteMotion();
  return (
    <section aria-label="Stocks you can send" className="relative w-full overflow-hidden py-6">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-[linear-gradient(90deg,var(--background),transparent)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-[linear-gradient(270deg,var(--background),transparent)]" />
      <div className="mx-auto mb-4 max-w-6xl px-6 text-center text-[12px] font-medium uppercase tracking-[0.18em] text-faint">
        Stocks you can send
      </div>
      {lite ? (
        <div className="flex gap-3 overflow-x-auto px-6 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {stocks.map((p, i) => (
            <Chip key={p} p={p} i={i} />
          ))}
        </div>
      ) : (
        <div className="marquee flex w-max gap-3">
          {[...stocks, ...stocks].map((p, i) => (
            <Chip key={`${p}-${i}`} p={p} i={i} />
          ))}
        </div>
      )}
    </section>
  );
}

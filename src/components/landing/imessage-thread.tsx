"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";

type Msg = { from: "you" | "bot"; text: string; media?: boolean };

/** Mirrors the real launch wizard: name, ticker, image, pair, confirm. */
const thread: Msg[] = [
  { from: "you", text: "launch pizza coin vs AAPL" },
  { from: "bot", text: "pizza coin, $PIZZA, paired with AAPL. send a photo or say skip" },
  { from: "you", text: "pizza.png", media: true },
  { from: "bot", text: "got it. say confirm to launch" },
  { from: "you", text: "confirm" },
  { from: "bot", text: "$PIZZA is live on stonks exchange. creator fees go to your wallet.\nthestonks.exchange/token/0x…" },
];

const BEAT = 1400;
const PAUSE = 4200;

export function IMessageThread({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  // Only tick the conversation while it's actually on screen.
  const inView = useInView(ref, { amount: 0.3 });
  const [shown, setShown] = useState(reduce ? thread.length : 0);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (reduce || !inView) return;
    let t: ReturnType<typeof setTimeout>;
    if (shown >= thread.length) {
      t = setTimeout(() => setShown(0), PAUSE);
    } else {
      const next = thread[shown];
      if (next.from === "bot") {
        setTyping(true);
        t = setTimeout(() => {
          setTyping(false);
          setShown((s) => s + 1);
        }, BEAT);
      } else {
        t = setTimeout(() => setShown((s) => s + 1), BEAT * 0.75);
      }
    }
    return () => clearTimeout(t);
  }, [shown, reduce, inView]);

  return (
    <div ref={ref} className={className}>
      <div className="glass iris-ring flex w-[300px] flex-col gap-2 rounded-[28px] p-4 sm:w-[340px]">
        <div className="mb-1 flex items-center justify-center gap-2 text-[11px] font-medium text-faint">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          iMessage · iStonk
        </div>
        <AnimatePresence initial={false}>
          {thread.slice(0, shown).map((m, i) => (
            <Bubble key={`${i}-${m.text}`} msg={m} />
          ))}
          {typing ? <Typing key="typing" /> : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  const you = msg.from === "you";
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className={`flex ${you ? "justify-end" : "justify-start"}`}
    >
      {msg.media ? (
        <div className="flex items-center gap-2 rounded-2xl bg-primary px-3 py-2 text-[12.5px] font-medium text-white shadow-[0_6px_20px_-8px_rgba(47,91,255,0.8)]">
          <span className="h-9 w-9 rounded-lg bg-[linear-gradient(135deg,#ffd66b,#ff9a3c_45%,#ff4fd8)]" />
          {msg.text}
        </div>
      ) : (
        <p
          className={`max-w-[84%] whitespace-pre-line rounded-2xl px-3.5 py-2 text-[13.5px] leading-snug ${
            you
              ? "rounded-br-md bg-primary text-white shadow-[0_6px_20px_-8px_rgba(47,91,255,0.8)]"
              : "rounded-bl-md bg-white/85 text-foreground shadow-[0_1px_0_rgba(255,255,255,1)_inset,0_4px_14px_-8px_rgba(20,26,70,0.25)]"
          }`}
        >
          {msg.text}
        </p>
      )}
    </motion.div>
  );
}

function Typing() {
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      className="flex justify-start"
    >
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-white/85 px-3.5 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="typing-dot h-1.5 w-1.5 rounded-full bg-faint"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </motion.div>
  );
}

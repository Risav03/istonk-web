"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";

type Msg = { from: "you" | "bot"; text: string; media?: boolean };

const thread: Msg[] = [
  { from: "you", text: "send $2 of Tesla to Mom" },
  { from: "bot", text: "I'm going to send $2 of Tesla stock to Mom.\n\nWant to add a note? type anything, or say skip." },
  { from: "you", text: "skip" },
  {
    from: "bot",
    text: "Send $2 of Tesla stock to Mom\n\n  Total     $2.08\n  Pay with  Apple Pay",
  },
  { from: "you", text: "Apple Pay" },
  { from: "bot", text: "Tap this link and pay $2.08 with Apple Pay.\n\nAfter it clears I'll send $2 of Tesla stock to Mom." },
  { from: "bot", text: "Sent. Mom can claim it from the text." },
];

const BEAT = 1400;
const PAUSE = 4200;

export function IMessageThread({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const [shown, setShown] = useState(reduce ? thread.length : 2);
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
      <div className="glass iris-ring flex h-[420px] w-[300px] shrink-0 flex-col overflow-hidden rounded-[28px] p-4 sm:h-[440px] sm:w-[340px]">
        <div className="mb-2 flex shrink-0 items-center justify-center gap-2 text-[11px] font-medium text-faint">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          iMessage · iStonk
        </div>
        <div className="flex min-h-0 flex-1 flex-col justify-end gap-2 overflow-hidden">
          <AnimatePresence initial={false}>
            {thread.slice(0, shown).map((m, i) => (
              <Bubble key={`${i}-${m.text}`} msg={m} />
            ))}
            {typing ? <Typing key="typing" /> : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  const you = msg.from === "you";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      transition={{ duration: 0.2 }}
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
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.1 } }}
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

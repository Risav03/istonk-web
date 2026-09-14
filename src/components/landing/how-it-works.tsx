"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";

import { Reveal, Stagger, fadeUp, useLiteMotion } from "./motion";
import { SendStocksButton } from "./send-stocks-button";

const steps = [
  {
    n: "01",
    title: "Pick who",
    body: "A contact, their number, or their email. iMessage, text, or AgentMail.",
    you: "Mom · +1… or email",
  },
  {
    n: "02",
    title: "Pay with Apple Pay",
    body: "Checkout on the web. Apple Pay. That's it.",
    you: "Apple Pay",
  },
  {
    n: "03",
    title: "They claim it",
    body: "They get a text or an email, tap once, and the stock is theirs.",
    you: "claimed",
  },
];

export function HowItWorks() {
  const lite = useLiteMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 60%"] });
  const line = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });
  const lineScale = useTransform(line, [0, 1], [0, 1]);

  return (
    <section id="how" className="relative mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-24 lg:py-32">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <Reveal>
            <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">
              How it works
            </span>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-3 text-[36px] font-extrabold leading-[1.02] tracking-[-0.03em] sm:text-[48px]">
              Three steps.
              <br />
              <span className="text-iris">They get the stock.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 max-w-[420px] text-[16px] leading-relaxed text-muted">
              Pick a channel, pay on the web, and iStonk delivers it.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-8">
              <SendStocksButton variant="dark" />
            </div>
          </Reveal>
        </div>

        <div ref={ref} className="relative">
          <div className="absolute left-[27px] top-2 bottom-2 hidden w-px bg-border-strong sm:block">
            <motion.div
              style={{ scaleY: lite ? 1 : lineScale }}
              className="h-full w-full origin-top bg-[linear-gradient(180deg,var(--iris-blue),var(--iris-magenta),var(--iris-peach))]"
            />
          </div>

          <Stagger as="ol" className="flex flex-col gap-4">
            {steps.map((s) => (
              <motion.li key={s.n} variants={fadeUp} className="relative sm:pl-20">
                <span className="glass iris-ring absolute left-0 top-5 hidden h-14 w-14 items-center justify-center rounded-full font-mono text-[13px] font-bold text-foreground sm:flex">
                  {s.n}
                </span>
                <div className="glass group flex flex-col gap-4 rounded-[22px] p-6 sm:flex-row sm:items-start sm:justify-between">
                  <div className="max-w-[380px]">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[12px] font-bold text-faint sm:hidden">{s.n}</span>
                      <h3 className="text-[19px] font-bold tracking-tight">{s.title}</h3>
                    </div>
                    <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{s.body}</p>
                  </div>
                  <span className="inline-flex w-fit shrink-0 rounded-2xl rounded-br-md bg-primary px-3.5 py-2 font-mono text-[13px] text-white shadow-[0_8px_20px_-10px_rgba(47,91,255,0.9)]">
                    {s.you}
                  </span>
                </div>
              </motion.li>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}

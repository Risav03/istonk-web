"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { CreditCard, LineChart, Smartphone } from "lucide-react";

import { Reveal, Stagger, fadeUp } from "./motion";

const items = [
  {
    icon: CreditCard,
    title: "Fund with Apple Pay",
    body: "Top up your iStonk wallet with Apple Pay or a card through Coinbase Onramp. Or send USDC to your address, same as today.",
    you: "add $50",
  },
  {
    icon: LineChart,
    title: "Buy tokenized stocks",
    body: "Coinbase tokenized equities on Base: AAPL, NVDA, META, GOOGL and more. Quote, confirm, hold it in the same wallet as your coins.",
    you: "buy $25 of NVDA",
  },
  {
    icon: Smartphone,
    title: "Send stock to a phone number",
    body: "Gift a share to anyone in your contacts. They get a text, tap once, and claim it. No wallet needed to receive.",
    you: "send mom 1 Apple stock",
  },
];

export function NextUp() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const glowX = useTransform(scrollYProgress, [0, 1], ["-20%", "120%"]);

  return (
    <section id="next" className="relative mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-24 lg:py-32">
      <div
        ref={ref}
        className="glass iris-ring relative overflow-hidden rounded-[32px] px-6 py-12 sm:px-10 sm:py-16 lg:px-16"
      >
        {/* sweeping iridescent glow tied to scroll */}
        <motion.div
          style={{ left: glowX }}
          className="pointer-events-none absolute top-[-40%] h-[180%] w-[40%] -translate-x-1/2 rotate-12 bg-[linear-gradient(90deg,transparent,rgba(122,92,255,0.18),rgba(255,79,216,0.18),rgba(255,154,60,0.14),transparent)] blur-2xl"
        />

        <div className="relative grid grid-cols-1 gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full bg-foreground px-3 py-1.5 text-[12px] font-semibold text-white">
                <motion.span
                  className="h-1.5 w-1.5 rounded-full bg-iris-cyan"
                  animate={reduce ? undefined : { opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                />
                Coming to iStonk
              </span>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="mt-5 text-[36px] font-extrabold leading-[1.02] tracking-[-0.03em] sm:text-[48px]">
                Stocks over
                <br />
                <span className="text-iris">text message.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-5 max-w-[440px] text-[16px] leading-relaxed text-muted">
                The next leg brings real onramps and real equities into the same iMessage thread. Fund
                your wallet, buy a tokenized stock, and send it to a phone number, all in the voice you
                already use with iStonk.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mt-4 text-[13px] text-faint">
                Shipping on Basemate first, then landing here. Same wallet, same number.
              </p>
            </Reveal>
          </div>

          <Stagger as="ul" className="flex flex-col gap-4">
            {items.map((it) => (
              <motion.li
                key={it.title}
                variants={fadeUp}
                className="group relative flex flex-col gap-4 rounded-[22px] border border-white/80 bg-white/55 p-5 transition-transform duration-300 hover:-translate-y-1 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-4">
                  <span className="glass flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
                    <it.icon className="h-5 w-5 text-primary" />
                  </span>
                  <div>
                    <h3 className="text-[16.5px] font-bold tracking-tight">{it.title}</h3>
                    <p className="mt-1.5 max-w-[380px] text-[13.5px] leading-relaxed text-muted">{it.body}</p>
                  </div>
                </div>
                <span className="inline-flex w-fit shrink-0 rounded-2xl rounded-br-md bg-primary px-3.5 py-2 font-mono text-[12.5px] text-white shadow-[0_8px_20px_-10px_rgba(47,91,255,0.9)]">
                  {it.you}
                </span>
              </motion.li>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}

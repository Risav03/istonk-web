"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Coins, Mail, Send, ShieldCheck } from "lucide-react";

import { site } from "@/lib/site";

import { Reveal, Stagger, fadeUp } from "./motion";

const points = [
  {
    icon: Mail,
    title: "Email in, wallet out",
    body: "A Coinbase embedded smart account on Base. Sign in with a one-time code. No extension, no seed phrase.",
  },
  {
    icon: ShieldCheck,
    title: "90-day signing",
    body: "You grant iStonk delegated signing for ~90 days so launches and claims happen from a text. Revoke any time.",
  },
  {
    icon: Coins,
    title: "Creator fees, yours",
    body: "Every coin you launch routes trading fees to your wallet. See what's claimable and collect it all in one tap.",
  },
  {
    icon: Send,
    title: "Hold it, send it",
    body: "Balances, holdings and launch history in one place. Send ETH or any coin to another wallet on Base.",
  },
];

export function Wallet() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const back = useTransform(scrollYProgress, [0, 1], [80, -80]);
  const mid = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const front = useTransform(scrollYProgress, [0, 1], [0, -10]);

  return (
    <section id="wallet" className="relative mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-24 lg:py-32">
      <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-12">
        {/* stacked parallax cards */}
        <div ref={ref} className="relative mx-auto h-[440px] w-full max-w-[460px] lg:order-first">
          <motion.div
            style={{ y: back }}
            className="glass absolute left-6 top-4 h-[240px] w-[80%] rotate-[-4deg] rounded-[26px] p-5 opacity-80"
          >
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-faint">Holdings</span>
            <ul className="mt-3 flex flex-col gap-2.5">
              {[
                ["PIZZA", "vs AAPL"],
                ["MOON", "vs ETH"],
                ["GPU", "vs NVDA"],
              ].map(([t, p]) => (
                <li key={t} className="flex items-center justify-between rounded-xl bg-white/60 px-3 py-2">
                  <span className="flex items-center gap-2 font-mono text-[13px] font-semibold">
                    <span className="h-6 w-6 rounded-full bg-[linear-gradient(135deg,var(--iris-blue),var(--iris-magenta))]" />
                    ${t}
                  </span>
                  <span className="text-[12px] text-muted">{p}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            style={{ y: mid }}
            className="glass iris-ring absolute right-0 top-[120px] w-[78%] rotate-[3deg] rounded-[26px] p-5"
          >
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-faint">Creator fees</span>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-[13px] text-muted">Ready to collect</span>
              <span className="rounded-full bg-primary-dim px-2.5 py-1 text-[11px] font-semibold text-primary">
                3 coins
              </span>
            </div>
            <button
              type="button"
              tabIndex={-1}
              className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-full bg-primary text-[13px] font-semibold text-white shadow-[0_10px_24px_-10px_rgba(47,91,255,0.9)]"
            >
              Collect all
            </button>
          </motion.div>

          <motion.div
            style={{ y: front }}
            className="glass absolute bottom-0 left-1/2 w-[70%] -translate-x-1/2 rounded-[26px] p-5"
          >
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-faint">Send</span>
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2.5 font-mono text-[12.5px] text-muted">
              0x
              <span className="h-3.5 w-24 rounded bg-border-strong" />
            </div>
            <div className="mt-2 flex items-center justify-between text-[12.5px] text-muted">
              <span>Base · gas from ETH</span>
              <ArrowRight className="h-4 w-4 text-primary" />
            </div>
          </motion.div>
        </div>

        <div>
          <Reveal>
            <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">The wallet</span>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-3 text-[36px] font-extrabold leading-[1.02] tracking-[-0.03em] sm:text-[48px]">
              Your wallet.
              <br />
              <span className="text-iris">Your fees.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 max-w-[460px] text-[16px] leading-relaxed text-muted">
              iStonk never holds your coins. The bot launches from a wallet only you control, and this
              site is where you see it, claim from it and send from it.
            </p>
          </Reveal>

          <Stagger as="ul" className="mt-9 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {points.map((p) => (
              <motion.li key={p.title} variants={fadeUp} className="glass rounded-[20px] p-5">
                <p.icon className="h-5 w-5 text-primary" />
                <h3 className="mt-3 text-[15.5px] font-bold tracking-tight">{p.title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{p.body}</p>
              </motion.li>
            ))}
          </Stagger>

          <Reveal delay={0.1}>
            <Link
              href={site.links.app}
              className="mt-8 inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-[14px] font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              Open your wallet
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

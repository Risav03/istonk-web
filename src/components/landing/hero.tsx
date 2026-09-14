"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { site } from "@/lib/site";

import { IMessageThread } from "./imessage-thread";
import { Mascot } from "./mascot";
import { SplitWords, useLiteMotion } from "./motion";
import { SendStocksButton } from "./send-stocks-button";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const lite = useLiteMotion();

  return (
    <section className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 overflow-x-hidden px-6 pb-20 pt-36 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:overflow-visible lg:pb-28 lg:pt-44">
      <div className="relative z-10 flex flex-col items-start gap-7">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12.5px] font-medium text-muted"
        >
          <span className="relative flex h-2 w-2">
            {lite ? null : (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            )}
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          Apple Pay · iMessage · text · email
        </motion.span>

        <h1 className="text-[44px] font-extrabold leading-[0.98] tracking-[-0.035em] text-foreground sm:text-[64px] lg:text-[76px]">
          <SplitWords text="Send Stocks to Anyone," />
          <br />
          <SplitWords text="Anywhere in the World" className="text-iris" />
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease, delay: 0.35 }}
          className="max-w-[520px] text-[17px] leading-relaxed text-muted sm:text-[19px]"
        >
          Pick iMessage, a text, or email. Pay with Apple Pay. They claim the stock.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease, delay: 0.45 }}
          className="flex flex-wrap items-center gap-3"
        >
          <SendStocksButton />
          <Link
            href={site.links.app}
            className="glass inline-flex h-12 items-center gap-2 rounded-full px-5 text-[15px] font-semibold text-foreground transition-transform hover:-translate-y-0.5"
          >
            Your account
            <ArrowRight className="h-4 w-4 text-muted" />
          </Link>
        </motion.div>
      </div>

      <div className="relative mx-auto h-[660px] w-full max-w-[520px] shrink-0 self-start overflow-hidden lg:h-[600px]">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 lg:left-[44%] lg:top-[6%]">
          <motion.div
            animate={lite ? undefined : { y: [0, -14, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, ease, delay: 0.15 }}
            >
              <Mascot size={360} className="h-[280px] w-[280px] sm:h-[360px] sm:w-[360px]" />
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.4 }}
          className="absolute bottom-0 left-1/2 z-10 -translate-x-1/2 lg:left-[8%] lg:translate-x-0"
        >
          <IMessageThread />
        </motion.div>

        {[
          { label: "vs AAPL", x: "2%", y: "10%", d: 0 },
          { label: "vs ETH", x: "82%", y: "26%", d: 1.2 },
          { label: "vs NVDA", x: "76%", y: "78%", d: 2.1 },
        ].map((c) => (
          <motion.span
            key={c.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease, delay: 0.8 + c.d * 0.15 }}
            style={{ left: c.x, top: c.y }}
            className="glass iris-ring absolute z-10 hidden rounded-full px-3 py-1.5 font-mono text-[12px] font-semibold text-foreground lg:inline-flex"
          >
            {c.label}
          </motion.span>
        ))}
      </div>
    </section>
  );
}

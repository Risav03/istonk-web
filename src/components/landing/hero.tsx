"use client";

import { motion } from "framer-motion";

import { IMessageThread } from "./imessage-thread";
import { Mascot } from "./mascot";
import { SplitWords, useLiteMotion } from "./motion";
import { SendStocksButton } from "./send-stocks-button";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const lite = useLiteMotion();

  return (
    <section className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-8 px-6 pb-12 pt-28 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6 lg:pb-16 lg:pt-32">
      <div className="relative z-10 flex flex-col items-start gap-5">
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

        <h1 className="text-[40px] font-extrabold leading-[0.98] tracking-[-0.035em] text-foreground sm:text-[58px] lg:text-[68px]">
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
          className="flex w-full max-w-[420px] flex-col items-stretch gap-3 sm:max-w-none sm:items-start"
        >
          <SendStocksButton />
        </motion.div>
      </div>

      <div className="relative mx-auto flex w-full max-w-[420px] flex-col items-center gap-3 lg:max-w-none">
        <motion.div
          animate={lite ? undefined : { y: [0, -6, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.15 }}
          >
            <Mascot size={160} className="h-[140px] w-[140px] sm:h-[160px] sm:w-[160px]" />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.35 }}
        >
          <IMessageThread />
        </motion.div>
      </div>
    </section>
  );
}

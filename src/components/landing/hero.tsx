"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";

import { site } from "@/lib/site";

import { IMessageThread } from "./imessage-thread";
import { Mascot } from "./mascot";
import { SplitWords, useLiteMotion } from "./motion";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero({ signedIn = false }: { signedIn?: boolean }) {
  const lite = useLiteMotion();

  return (
    <section className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-6 pb-20 pt-36 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:pb-28 lg:pt-44">
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
          Live on Base · powered by Stonks Exchange
        </motion.span>

        <h1 className="text-[44px] font-extrabold leading-[0.98] tracking-[-0.035em] text-foreground sm:text-[64px] lg:text-[76px]">
          <SplitWords text="Launch a coin" />
          <br />
          <SplitWords text="from iMessage." className="text-iris" />
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease, delay: 0.35 }}
          className="max-w-[520px] text-[17px] leading-relaxed text-muted sm:text-[19px]"
        >
          Text iStonk a name, a ticker, a photo and a stock to pair it with. It goes live on{" "}
          <span className="font-semibold text-foreground">Stonks Exchange</span>, and creator fees land
          in <span className="font-semibold text-foreground">your</span> account. No app, no seed phrase.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease, delay: 0.45 }}
          className="flex flex-wrap items-center gap-3"
        >
          <a
            href={site.bot.smsHref}
            className="group relative inline-flex h-12 items-center gap-2.5 overflow-hidden rounded-full bg-primary px-6 text-[15px] font-semibold text-primary-foreground shadow-[0_14px_40px_-12px_rgba(47,91,255,0.75)] transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <span className="absolute inset-0 -translate-x-full bg-[linear-gradient(100deg,transparent,rgba(255,255,255,0.35),transparent)] transition-transform duration-700 group-hover:translate-x-full" />
            <MessageCircle className="h-[18px] w-[18px]" />
            Text {site.bot.phonePretty}
          </a>
          <Link
            href={site.links.app}
            className="glass inline-flex h-12 items-center gap-2 rounded-full px-5 text-[15px] font-semibold text-foreground transition-transform hover:-translate-y-0.5"
          >
            {signedIn ? "Open account" : "Sign in with email"}
            <ArrowRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-[13px] text-faint"
        >
          Say <span className="font-mono text-muted">launch</span> to start, or{" "}
          <span className="font-mono text-muted">connect</span> if you already have an account.{" "}
          <Link href={site.links.dashboard} className="font-medium text-primary hover:text-primary-hover">
            See every coin launched so far →
          </Link>
        </motion.p>
      </div>

      <div className="mx-auto flex w-full max-w-[360px] flex-col items-center">
        <Mascot size={220} className="h-[200px] w-[200px] sm:h-[220px] sm:w-[220px]" />
        <IMessageThread />
      </div>
    </section>
  );
}

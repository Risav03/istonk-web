"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, MessageCircle } from "lucide-react";

import { site } from "@/lib/site";

import { Mascot } from "./mascot";
import { Reveal } from "./motion";

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M18.9 2H22l-7.4 8.5L23 22h-6.8l-5.3-6.9L4.8 22H1.7l7.9-9.1L1 2h7l4.8 6.3L18.9 2Zm-1.2 18h1.9L7.4 3.9H5.4L17.7 20Z" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M21.9 4.3 18.7 19.6c-.2 1.1-.9 1.3-1.8.8l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.1 9.2-8.3c.4-.4-.1-.6-.6-.2L6 13.1 1.1 11.6c-1.1-.3-1.1-1.1.2-1.6L20.5 2.6c.9-.3 1.7.2 1.4 1.7Z" />
    </svg>
  );
}

const socials = [
  { label: "Follow on X", href: site.links.x, Icon: XIcon },
  { label: "Join the Telegram", href: site.links.telegram, Icon: TelegramIcon },
];

export function Footer() {
  const reduce = useReducedMotion();
  return (
    <>
      {/* closing CTA */}
      <section className="relative mx-auto w-full max-w-6xl px-6 pb-16 pt-8 lg:pb-24">
        <div className="relative flex flex-col items-center gap-8 overflow-hidden rounded-[36px] px-6 py-16 text-center sm:px-12 lg:py-24">
          <div className="absolute inset-0 -z-10 aurora-wash rounded-[36px] opacity-90" />
          <div className="absolute inset-0 -z-10 rounded-[36px] border border-white/80" />

          <motion.div
            animate={reduce ? undefined : { y: [0, -12, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <Mascot size={140} />
          </motion.div>

          <Reveal>
            <h2 className="text-[34px] font-extrabold leading-[1] tracking-[-0.035em] sm:text-[60px]">
              Your next coin is
              <br />
              <span className="text-iris">one text away.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="max-w-[460px] text-[16px] leading-relaxed text-muted">
              Save the number, say hi, and iStonk walks you through it. Follow along for launches,
              pairs and what ships next.
            </p>
          </Reveal>

          <Reveal delay={0.14} className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={site.bot.smsHref}
              className="inline-flex h-12 items-center gap-2.5 rounded-full bg-primary px-6 text-[15px] font-semibold text-white shadow-[0_14px_40px_-12px_rgba(47,91,255,0.75)] transition-transform hover:-translate-y-0.5"
            >
              <MessageCircle className="h-[18px] w-[18px]" />
              Text {site.bot.phonePretty}
            </a>
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="glass inline-flex h-12 items-center gap-2.5 rounded-full px-5 text-[15px] font-semibold text-foreground transition-transform hover:-translate-y-0.5"
              >
                <s.Icon className="h-4 w-4" />
                {s.label}
              </a>
            ))}
          </Reveal>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pb-10 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <Mascot size={24} track={false} />
          <span className="font-bold text-foreground">iStonks</span>
          <span className="text-faint">· {site.domain}</span>
        </div>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <a href="/#how" className="hover:text-foreground">
            How it works
          </a>
          <Link href={site.links.dashboard} className="hover:text-foreground">
            Dashboard
          </Link>
          <Link href={site.links.app} className="hover:text-foreground">
            Wallet
          </Link>
          <a
            href={site.links.stonks}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            Stonks Exchange <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
          <a href={site.links.x} target="_blank" rel="noreferrer" className="hover:text-foreground">
            X
          </a>
          <a href={site.links.telegram} target="_blank" rel="noreferrer" className="hover:text-foreground">
            Telegram
          </a>
        </nav>
        <p className="text-faint">Built on Base. Not financial advice.</p>
      </footer>
    </>
  );
}

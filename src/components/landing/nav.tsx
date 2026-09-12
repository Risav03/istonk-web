"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { MessageCircle } from "lucide-react";

import { site } from "@/lib/site";

import { Mascot } from "./mascot";

const links = [
  { href: "/#how", label: "How it works" },
  { href: "/#wallet", label: "Wallet" },
  { href: site.links.dashboard, label: "Dashboard" },
  { href: "/#next", label: "What's next" },
];

export function Nav() {
  const { scrollY } = useScroll();
  const bg = useTransform(scrollY, [0, 80], ["rgba(255,255,255,0)", "rgba(255,255,255,0.7)"]);
  const border = useTransform(scrollY, [0, 80], ["rgba(255,255,255,0)", "rgba(255,255,255,0.9)"]);
  const blur = useTransform(scrollY, [0, 80], ["blur(0px)", "blur(16px)"]);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-40 flex justify-center px-4 pt-4"
    >
      <motion.nav
        style={{ backgroundColor: bg, borderColor: border, backdropFilter: blur }}
        className="flex h-14 w-full max-w-6xl items-center justify-between rounded-full border px-3 pl-4 transition-shadow"
      >
        <Link href="/" className="flex items-center gap-2.5">
          <Mascot size={34} track={false} />
          <span className="text-iris text-[19px] font-extrabold tracking-tight">iStonks</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) =>
            l.href.startsWith("/") && !l.href.startsWith("/#") ? (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-full px-3.5 py-2 text-[13.5px] font-medium text-muted transition-colors hover:bg-white/60 hover:text-foreground"
              >
                {l.label}
              </Link>
            ) : (
              <a
                key={l.href}
                href={l.href}
                className="rounded-full px-3.5 py-2 text-[13.5px] font-medium text-muted transition-colors hover:bg-white/60 hover:text-foreground"
              >
                {l.label}
              </a>
            ),
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={site.links.app}
            className="hidden h-9 items-center rounded-full px-4 text-[13px] font-semibold text-foreground/80 transition-colors hover:bg-white/60 sm:inline-flex"
          >
            Open wallet
          </Link>
          <a
            href={site.bot.smsHref}
            className="inline-flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-[13px] font-semibold text-primary-foreground shadow-[0_8px_24px_-8px_rgba(47,91,255,0.7)] transition-colors hover:bg-primary-hover"
          >
            <MessageCircle className="h-4 w-4" />
            Text iStonk
          </a>
        </div>
      </motion.nav>
    </motion.header>
  );
}

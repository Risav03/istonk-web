"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import { site } from "@/lib/site";

import { Mascot } from "./mascot";
import { SendStocksButton } from "./send-stocks-button";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-40 flex justify-center px-4 pt-4"
    >
      <nav
        className={`flex h-14 w-full max-w-6xl items-center justify-between rounded-full border px-3 pl-4 transition-colors duration-300 ${
          scrolled ? "glass" : "border-transparent bg-transparent"
        }`}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <Mascot size={34} track={false} />
          <span className="text-iris text-[19px] font-extrabold tracking-tight">iStonks</span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          <a
            href="/#how"
            className="whitespace-nowrap rounded-full px-3.5 py-2 text-[13.5px] font-medium text-muted transition-colors hover:bg-white/60 hover:text-foreground"
          >
            How it works
          </a>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={site.links.app}
            className="inline-flex h-9 items-center whitespace-nowrap rounded-full px-3 text-[13px] font-semibold text-foreground/80 transition-colors hover:bg-white/60 sm:px-4"
          >
            Your account
          </Link>
          <SendStocksButton variant="nav" />
        </div>
      </nav>
    </motion.header>
  );
}

"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";

import { site } from "@/lib/site";

import { IMessageThread } from "./imessage-thread";
import { Mascot } from "./mascot";
import { SplitWords } from "./motion";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const reduce = useReducedMotion();
  const artRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  // Art parallax is tied to the art's own position so it also works when it stacks below the copy.
  const { scrollYProgress: artProgress } = useScroll({
    target: artRef,
    offset: ["start 20%", "end start"],
  });

  // Scroll parallax: copy drifts up slowly, the art lifts faster and fades as it leaves.
  const copyY = useTransform(scrollY, [0, 600], [0, -60]);
  const artY = useTransform(artProgress, [0, 1], [0, -120]);
  const artOpacity = useTransform(artProgress, [0, 1], [1, 0.1]);

  // Pointer parallax on the art stack.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotX = useSpring(useTransform(my, [-1, 1], [8, -8]), { stiffness: 80, damping: 18 });
  const rotY = useSpring(useTransform(mx, [-1, 1], [-10, 10]), { stiffness: 80, damping: 18 });
  const mascotX = useSpring(useTransform(mx, [-1, 1], [-18, 18]), { stiffness: 60, damping: 16 });
  const mascotY = useSpring(useTransform(my, [-1, 1], [-12, 12]), { stiffness: 60, damping: 16 });
  const threadX = useSpring(useTransform(mx, [-1, 1], [10, -10]), { stiffness: 60, damping: 16 });

  useEffect(() => {
    if (reduce) return;
    const onMove = (e: PointerEvent) => {
      mx.set((e.clientX / window.innerWidth) * 2 - 1);
      my.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduce, mx, my]);

  return (
    <section className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-6 pb-20 pt-36 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:pb-28 lg:pt-44">
      <motion.div style={{ y: copyY }} className="relative z-10 flex flex-col items-start gap-7">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12.5px] font-medium text-muted"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
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
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.5 }}
          className="max-w-[520px] text-[17px] leading-relaxed text-muted sm:text-[19px]"
        >
          Text iStonk a name, a ticker, a photo and a stock to pair it with. It goes live on{" "}
          <span className="font-semibold text-foreground">Stonks Exchange</span>, and creator fees land
          in <span className="font-semibold text-foreground">your</span> wallet. No app, no seed phrase.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.65 }}
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
            Open your wallet
            <ArrowRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="text-[13px] text-faint"
        >
          Say <span className="font-mono text-muted">launch</span> to start, or{" "}
          <span className="font-mono text-muted">connect</span> if you already have a wallet.
        </motion.p>
      </motion.div>

      {/* Art stack: mascot floating behind the chat, both tilt with the pointer */}
      <motion.div
        ref={artRef}
        style={{ y: artY, opacity: artOpacity, rotateX: rotX, rotateY: rotY, transformPerspective: 1200 }}
        className="relative mx-auto flex h-[660px] w-full max-w-[520px] items-center justify-center lg:h-[600px]"
      >
        <motion.div
          style={{ x: mascotX, y: mascotY }}
          className="absolute left-1/2 top-0 -translate-x-1/2 lg:top-[6%] lg:left-[44%]"
        >
          <motion.div
            animate={reduce ? undefined : { y: [0, -16, 0], rotate: [-2, 2, -2] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1, ease, delay: 0.2 }}
            >
              <Mascot size={360} className="h-[280px] w-[280px] drop-shadow-[0_30px_50px_rgba(90,60,255,0.25)] sm:h-[360px] sm:w-[360px]" />
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div
          style={{ x: threadX }}
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease, delay: 0.55 }}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 lg:left-[8%] lg:translate-x-0"
        >
          <IMessageThread />
        </motion.div>

        {/* floating pair chips */}
        {[
          { label: "vs AAPL", x: "2%", y: "10%", d: 0 },
          { label: "vs ETH", x: "82%", y: "26%", d: 1.2 },
          { label: "vs NVDA", x: "76%", y: "78%", d: 2.1 },
        ].map((c) => (
          <motion.span
            key={c.label}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease, delay: 1 + c.d * 0.15 }}
            style={{ left: c.x, top: c.y }}
            className="absolute hidden lg:block"
          >
            <motion.span
              animate={reduce ? undefined : { y: [0, -10, 0] }}
              transition={{ duration: 4 + c.d, repeat: Infinity, ease: "easeInOut", delay: c.d }}
              className="glass iris-ring inline-flex rounded-full px-3 py-1.5 font-mono text-[12px] font-semibold text-foreground"
            >
              {c.label}
            </motion.span>
          </motion.span>
        ))}
      </motion.div>
    </section>
  );
}

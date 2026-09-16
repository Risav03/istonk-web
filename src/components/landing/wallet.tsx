"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Mail, Send, Smartphone } from "lucide-react";

import { site } from "@/lib/site";

import { Reveal, Stagger, fadeUp, useLiteMotion } from "./motion";

const points = [
  {
    icon: Mail,
    title: "On the web",
    body: "Open istonks.meme/app and enter your email. We send a one-time code — that's how you sign in.",
  },
  {
    icon: Send,
    title: "Then you can see everything",
    body: "Holdings, stocks you sent, who claimed them, and your contacts.",
  },
  {
    icon: Smartphone,
    title: "From iMessage",
    body: "Text iStonk connect from your phone so gifts to your number land in the same account.",
  },
];

export function Wallet() {
  const lite = useLiteMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const back = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const mid = useTransform(scrollYProgress, [0, 1], [30, -30]);

  return (
    <section id="wallet" className="relative mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-24 lg:py-32">
      <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-12">
        <div ref={ref} className="relative mx-auto h-[440px] w-full max-w-[460px] lg:order-first">
          <motion.div
            style={{ y: lite ? 0 : back }}
            className="glass absolute left-6 top-4 h-[240px] w-[80%] rotate-[-4deg] rounded-[26px] p-5 opacity-80"
          >
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-faint">Holdings</span>
            <ul className="mt-3 flex flex-col gap-2.5">
              {[
                ["AAPL", "Apple"],
                ["TSLA", "Tesla"],
                ["META", "Meta"],
              ].map(([t, p]) => (
                <li key={t} className="flex items-center justify-between rounded-xl bg-white/60 px-3 py-2">
                  <span className="flex items-center gap-2 font-mono text-[13px] font-semibold">
                    <span className="h-6 w-6 rounded-full bg-[linear-gradient(135deg,var(--iris-blue),var(--iris-magenta))]" />
                    {t}
                  </span>
                  <span className="text-[12px] text-muted">{p}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            style={{ y: lite ? 0 : mid }}
            className="glass iris-ring absolute right-0 top-[120px] w-[78%] rotate-[3deg] rounded-[26px] p-5"
          >
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-faint">Sent</span>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-[13px] text-muted">Tesla to Mom</span>
              <span className="rounded-full bg-primary-dim px-2.5 py-1 text-[11px] font-semibold text-primary">
                claimed
              </span>
            </div>
            <div className="mt-3 text-[13px] text-muted">$2 of Tesla · Apple Pay</div>
          </motion.div>

          <div className="glass absolute bottom-0 left-1/2 w-[70%] -translate-x-1/2 rounded-[26px] p-5">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-faint">Waiting</span>
            <div className="mt-3 rounded-xl bg-white/70 px-3 py-2.5 text-[13px] text-muted">
              Apple for Nema
            </div>
            <div className="mt-2 text-[12.5px] text-muted">They get a text to claim it</div>
          </div>
        </div>

        <div>
          <Reveal>
            <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">The account</span>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-3 text-[36px] font-extrabold leading-[1.02] tracking-[-0.03em] sm:text-[48px]">
              Sign in with
              <br />
              <span className="text-iris">your email.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 max-w-[460px] text-[16px] leading-relaxed text-muted">
              No app to install. Go to{" "}
              <span className="font-semibold text-foreground">istonks.meme/app</span>, enter your
              email, and tap the code we send. That’s your iStonk account.
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

          <Reveal delay={0.1} className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={site.links.app}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-[14px] font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              Sign in with email
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={site.bot.connectSmsHref}
              className="inline-flex h-11 items-center rounded-full px-4 text-[14px] font-semibold text-foreground/80 transition-colors hover:bg-white/60"
            >
              Or text connect
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { Mail, MessageCircle, Smartphone, X } from "lucide-react";

import { SEND_CHANNELS } from "@/lib/send-channels";

const icons = {
  imessage: MessageCircle,
  text: Smartphone,
  email: Mail,
} as const;

type Variant = "primary" | "nav" | "dark";

const styles: Record<Variant, string> = {
  primary:
    "group relative inline-flex h-12 w-full items-center justify-center gap-2.5 overflow-hidden rounded-full bg-primary px-6 text-[15px] font-semibold text-primary-foreground shadow-[0_14px_40px_-12px_rgba(47,91,255,0.75)] transition-transform hover:-translate-y-0.5 active:translate-y-0 sm:w-auto",
  nav: "inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-full bg-primary px-3 text-[13px] font-semibold text-primary-foreground shadow-[0_8px_24px_-8px_rgba(47,91,255,0.7)] transition-colors hover:bg-primary-hover sm:px-4",
  dark: "inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-[14px] font-semibold text-white transition-transform hover:-translate-y-0.5",
};

export function SendStocksButton({
  variant = "primary",
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className ?? styles[variant]}>
        {variant === "primary" ? (
          <span className="absolute inset-0 -translate-x-full bg-[linear-gradient(100deg,transparent,rgba(255,255,255,0.35),transparent)] transition-transform duration-700 group-hover:translate-x-full" />
        ) : null}
        <MessageCircle className={variant === "nav" ? "h-4 w-4" : "h-[18px] w-[18px]"} />
        Send Stocks
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="glass relative z-10 w-full max-w-[440px] rounded-[28px] p-5 shadow-[0_24px_80px_-24px_rgba(20,24,48,0.45)] sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id={titleId} className="text-[20px] font-extrabold tracking-tight">
                  How do you want to send?
                </h2>
                <p className="mt-1 text-[13.5px] leading-relaxed text-muted">
                  Pay with Apple Pay on the next screen. They get it the way you pick.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-white/70 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 flex flex-col gap-2.5">
              {SEND_CHANNELS.map((channel) => {
                const Icon = icons[channel.id];
                return (
                  <Link
                    key={channel.id}
                    href={channel.href}
                    className="flex items-start gap-3 rounded-[18px] border border-border-strong bg-white/70 px-4 py-3.5 transition-colors hover:border-primary-border hover:bg-white"
                  >
                    <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-dim text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex flex-col gap-0.5">
                      <span className="text-[15px] font-semibold tracking-tight">{channel.title}</span>
                      <span className="text-[13px] leading-relaxed text-muted">{channel.body}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

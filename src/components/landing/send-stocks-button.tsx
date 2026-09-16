"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";

import { site } from "@/lib/site";

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
  return (
    <Link href={`${site.links.app}?send=imessage`} className={className ?? styles[variant]}>
      {variant === "primary" ? (
        <span className="absolute inset-0 -translate-x-full bg-[linear-gradient(100deg,transparent,rgba(255,255,255,0.35),transparent)] transition-transform duration-700 group-hover:translate-x-full" />
      ) : null}
      <MessageCircle className={variant === "nav" ? "h-4 w-4" : "h-[18px] w-[18px]"} />
      Send Stocks
    </Link>
  );
}

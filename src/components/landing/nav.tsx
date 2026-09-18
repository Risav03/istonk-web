import Link from "next/link";

import { Button, MsgGlyph, Wordmark } from "@/components/ds";
import { site } from "@/lib/site";

const links = [
  { href: "/#how", label: "How it works" },
  { href: "/#account", label: "Your account" },
  { href: site.links.dashboard, label: "Dashboard" },
  { href: site.links.stonks, label: "Stonks Exchange", external: true },
];

/**
 * A hairline rule on paper — never a floating glass capsule. The nav and the
 * Messages header are the only fixed elements on the site.
 */
export function Nav({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <header
      className="sticky top-0 z-40 border-b border-rule"
      style={{ background: "var(--paper-2)" }}
    >
      <div className="mx-auto flex h-[68px] max-w-[var(--container)] items-center gap-7 px-[var(--gutter-mobile)] md:px-[var(--gutter-desktop)]">
        <Link href="/" className="shrink-0 no-underline" style={{ color: "var(--ink)" }}>
          <Wordmark size={20} markSize={48} priority />
        </Link>

        <nav className="hidden flex-1 items-center gap-[22px] lg:flex">
          {links.map((l) =>
            l.external ? (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="type-label no-underline transition-colors hover:text-ink"
                style={{ color: "var(--text-secondary)" }}
              >
                {l.label} ↗
              </a>
            ) : (
              <Link
                key={l.href}
                href={l.href}
                className="type-label no-underline transition-colors hover:text-ink"
                style={{ color: "var(--text-secondary)" }}
              >
                {l.label}
              </Link>
            ),
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2.5 lg:ml-0">
          <Link href={site.links.app} className="no-underline">
            <Button variant="ghost" size="sm">
              {signedIn ? "Your account" : "Sign in"}
            </Button>
          </Link>
          {/*
            Ink, not tangerine. The nav is always on screen, so an accent pill
            here would mean two accents per view — the hero's CTA is the one
            tangerine element in the first viewport.
          */}
          <a href={site.bot.smsHref} className="no-underline">
            <Button variant="primary" size="sm" icon={<MsgGlyph size={15} />}>
              Text iStonk
            </Button>
          </a>
        </div>
      </div>
    </header>
  );
}

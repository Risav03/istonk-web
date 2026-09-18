import Link from "next/link";

import { Button, Mascot, MsgGlyph } from "@/components/ds";
import { site } from "@/lib/site";

type Col = { h: string; items: Array<{ label: string; href: string }> };

const COLS: Col[] = [
  {
    h: "Product",
    items: [
      { label: "How it works", href: "/#how" },
      { label: "Your account", href: site.links.app },
      { label: "Dashboard", href: site.links.dashboard },
      { label: "Stonks Exchange", href: site.links.stonks },
    ],
  },
  {
    h: "Company",
    items: [
      { label: `X · ${site.twitter}`, href: site.links.x },
      { label: "Telegram", href: site.links.telegram },
      { label: site.domain, href: site.url },
    ],
  },
];

/** Night is a secondary system. The footer is the one place it earns the page. */
export function Footer() {
  return (
    <footer style={{ background: "var(--ink)", color: "var(--text-on-ink)" }}>
      <div className="mx-auto max-w-[var(--container)] px-[var(--gutter-mobile)] pt-16 pb-9 md:px-[var(--gutter-desktop)] lg:pt-18">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,0.6fr))]">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <h2 className="type-d3" style={{ color: "var(--text-on-ink)" }}>
              Text a stock
              <br />
              to anyone.
            </h2>
            <p
              className="mt-3.5 max-w-[320px]"
              style={{ font: "var(--type-body-sm)", color: "var(--night-slate)" }}
            >
              iMessage, text, or email. Pay with Apple Pay. They claim it.
            </p>
            <div className="mt-5.5">
              <a href={site.bot.smsHref} className="no-underline">
                <Button variant="accent" size="md" icon={<MsgGlyph />}>
                  Text iStonk
                </Button>
              </a>
            </div>
          </div>

          {COLS.map((col) => (
            <div key={col.h}>
              <div
                style={{
                  font: "var(--type-micro)",
                  letterSpacing: "var(--track-caps)",
                  textTransform: "uppercase",
                  color: "var(--night-slate)",
                }}
              >
                {col.h}
              </div>
              <ul className="mt-3.5 flex list-none flex-col gap-2.25">
                {col.items.map((i) => (
                  <li key={i.label}>
                    <FooterLink href={i.href}>{i.label}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <div
              style={{
                font: "var(--type-micro)",
                letterSpacing: "var(--track-caps)",
                textTransform: "uppercase",
                color: "var(--night-slate)",
              }}
            >
              Legal
            </div>
            <ul className="mt-3.5 flex list-none flex-col gap-2.25">
              {["Terms", "Privacy", "Not financial advice"].map((label) => (
                <li
                  key={label}
                  style={{ font: "var(--type-body-sm)", color: "#cfcdc6" }}
                >
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-5 border-t border-[var(--night-rule)] pt-5.5 sm:flex-row sm:items-center">
          <span className="inline-flex items-center gap-2.5">
            <Mascot size={38} />
            <span
              style={{
                font: "800 17px/1 var(--font-display)",
                letterSpacing: "-0.04em",
              }}
            >
              iStonk
            </span>
            <span
              style={{ font: "var(--type-mono-sm)", color: "var(--night-slate)" }}
            >
              {site.domain}
            </span>
          </span>
          <span
            className="max-w-[520px] sm:text-right"
            style={{ font: "var(--type-legal)", color: "var(--night-slate)" }}
          >
            iStonk does not trade. Markets live on Stonks Exchange. Tokenized stocks
            are Base assets, not equity. Not financial advice.
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: string }) {
  const external = href.startsWith("http");
  const style = {
    font: "var(--type-body-sm)",
    color: "#cfcdc6",
    textDecoration: "none",
  };
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" style={style}>
        {children} ↗
      </a>
    );
  }
  return (
    <Link href={href} style={style}>
      {children}
    </Link>
  );
}

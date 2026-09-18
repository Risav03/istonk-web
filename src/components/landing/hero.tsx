import Link from "next/link";

import { Button, MsgGlyph, TickerTape, type TapeItem } from "@/components/ds";
import { site } from "@/lib/site";

import { PhoneThread } from "./phone-thread";

/**
 * The sendable universe. Real tickers and the Base stock names only — the tape
 * carries no prices because inventing a quote is worse than leaving it out.
 */
const TAPE: TapeItem[] = [
  { symbol: "AAPL", value: "Apple" },
  { symbol: "TSLA", value: "Tesla" },
  { symbol: "NVDA" },
  { symbol: "AMZN", value: "Amazon" },
  { symbol: "GOOGL", value: "Alphabet" },
  { symbol: "META", value: "Meta" },
  { symbol: "MSFT", value: "Microsoft" },
  { symbol: "MSTR", value: "Strategy" },
  { symbol: "ETH" },
  { symbol: "USDC" },
  { symbol: "STONKEX" },
];

/**
 * The first viewport as a poster: one line, one object, one action, tape at the
 * floor. Deliberately asymmetric and left-aligned — centring everything is a
 * don't.
 */
export function Hero({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "var(--mat-paper)" }}
    >
      <span aria-hidden className="istonk-grain pointer-events-none absolute inset-0" />

      <div className="relative mx-auto grid max-w-[var(--container)] grid-cols-1 items-start gap-10 px-[var(--gutter-mobile)] pt-11 md:px-[var(--gutter-desktop)] lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
        <div className="pt-4.5 pb-10 lg:pb-16">
          <h1
            style={{
              font: "800 clamp(56px, 8.4vw, 124px)/0.86 var(--font-display)",
              letterSpacing: "var(--track-poster)",
            }}
          >
            Text a
            <br />
            stock.
          </h1>

          <p
            className="mt-6.5 max-w-[480px]"
            style={{ font: "var(--type-body-lg)", color: "var(--text-secondary)" }}
          >
            Send stocks to anyone, anywhere in the world, from the Messages app you
            already have open. Launch a coin paired to AAPL. Buy a gift card with
            USDC. No app, no seed phrase.
          </p>

          <div className="mt-8.5 flex flex-wrap items-center gap-3">
            <a href={site.bot.smsHref} className="no-underline">
              <Button variant="accent" size="lg" icon={<MsgGlyph />}>
                Text iStonk
              </Button>
            </a>
            <Link href={site.links.app} className="no-underline">
              <Button variant="outline" size="lg">
                {signedIn ? "Open your account" : "Set up your account"}
              </Button>
            </Link>
          </div>

          <p
            className="mt-7"
            style={{ font: "var(--type-body-sm)", color: "var(--text-tertiary)" }}
          >
            Text{" "}
            <code style={{ font: "var(--type-mono)", color: "var(--text-secondary)" }}>
              send $25 of AAPL to Alex
            </code>{" "}
            to {site.bot.phonePretty}
          </p>
        </div>

        {/* Bottom padding keeps the phone off the tape — the poster needs a floor,
            not a collision. */}
        <div className="relative flex items-end justify-center pt-2.5 pb-12 lg:pb-16">
          <PhoneThread
            script="launch"
            className="[--phone-scale:0.76] sm:[--phone-scale:0.9] lg:[--phone-scale:1]"
          />
        </div>
      </div>

      <TickerTape items={TAPE} speed={46} />
    </section>
  );
}

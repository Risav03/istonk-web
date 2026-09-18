import Link from "next/link";

import {
  Badge,
  Button,
  DataRow,
  Eyebrow,
  Figure,
  TokenLogo,
} from "@/components/ds";
import { site } from "@/lib/site";

/** An illustration of the real /app, built from the same primitives it uses. */
const EXAMPLE_HOLDINGS = [
  {
    // Gifting a stock is gas-sponsored by the paymaster. ETH is only needed for
    // the self-funded paths: collecting creator fees and withdrawing out.
    sym: "ETH",
    title: "ETH",
    note: "Covers gas to collect fees or withdraw",
    amount: "0.0412",
    usd: "$127.90",
  },
  {
    sym: "AAPL",
    title: "$AAPLc",
    note: "Apple · tokenized",
    amount: "4.8100",
    usd: "$1,116.60",
  },
  {
    sym: "FRUIT",
    title: "$FRUIT",
    note: "fruit · vs AAPL",
    amount: "184.20",
    usd: "fees ready",
    tone: "up" as const,
  },
];

export function AccountTeaser({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <section
      id="account"
      className="scroll-mt-[68px] border-t border-rule"
      style={{ background: "var(--mat-paper)" }}
    >
      <div className="mx-auto grid max-w-[var(--container)] grid-cols-1 items-center gap-12 px-[var(--gutter-mobile)] py-16 md:px-[var(--gutter-desktop)] lg:grid-cols-2 lg:gap-14 lg:py-22">
        <div>
          <Eyebrow>Your account</Eyebrow>
          <h2 className="type-d2 mt-3.5">
            Fees land
            <br />
            in your account.
          </h2>
          <p
            className="mt-4.5 max-w-[420px]"
            style={{ font: "var(--type-body)", color: "var(--text-secondary)" }}
          >
            Every coin you launch pays its creator fees to the same place: the
            iStonk account tied to your number. Open it on the web to see balances,
            collect fees, and send to any Base address.
          </p>
          <div className="mt-6.5 flex flex-wrap gap-2.5">
            <Link href={site.links.app} className="no-underline">
              <Button size="md">
                {signedIn ? "Open your account" : "Set up your account"}
              </Button>
            </Link>
            <Link href={site.links.dashboard} className="no-underline">
              <Button variant="outline" size="md">
                See every launch
              </Button>
            </Link>
          </div>
        </div>

        <div
          className="overflow-hidden border border-rule"
          style={{
            background: "var(--surface)",
            borderRadius: "var(--r-card)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div className="flex items-end justify-between px-5 pt-5 pb-4">
            <div>
              <div
                style={{
                  font: "var(--type-body-sm)",
                  color: "var(--text-secondary)",
                }}
              >
                iStonk account · Base
              </div>
              <Figure value="1,284.06" prefix="$" size="xl" style={{ marginTop: 6 }} />
            </div>
            <Badge state="live" />
          </div>
          {EXAMPLE_HOLDINGS.map((h) => (
            <DataRow
              key={h.sym}
              leading={<TokenLogo symbol={h.sym} />}
              title={h.title}
              note={h.note}
              value={<Figure value={h.amount} size="md" mono tone={h.tone ?? "ink"} />}
              meta={h.usd}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

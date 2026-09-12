import type { Metadata } from "next";
import Link from "next/link";

import { Aurora } from "@/components/landing/aurora";
import { Footer } from "@/components/landing/footer";
import { Nav } from "@/components/landing/nav";
import { formatAaplAmount, loadAirdropSnapshot, type AirdropRow } from "@/lib/airdrops";
import { fetchTokensLaunched } from "@/lib/launch-stats";
import { shortAddr } from "@/lib/format";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Tokens launched by iStonk and AAPL fees airdropped to holders.",
};

function dropLabel(file: string | null): string | null {
  if (!file) return null;
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(file);
  if (!match) return file.replace(/\.csv$/, "");
  return new Date(`${match[1]}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatCount(value: number | null): string {
  if (value == null) return "—";
  return value.toLocaleString("en-US");
}

export default async function DashboardPage() {
  const [tokensLaunched, airdrops] = await Promise.all([
    fetchTokensLaunched(),
    loadAirdropSnapshot(),
  ]);
  const latestWhen = dropLabel(airdrops.latestFile);

  return (
    <>
      <Aurora />
      <Nav />
      <main className="relative z-10 mx-auto flex w-full max-w-[1040px] flex-col gap-10 px-5 pb-20 pt-32">
        <header className="flex flex-col gap-2">
          <span className="text-[13px] text-muted">iStonk · public stats</span>
          <h1 className="text-[34px] font-extrabold leading-none tracking-[-0.035em] sm:text-[44px]">
            Dashboard
          </h1>
          <p className="max-w-[520px] text-[15px] leading-relaxed text-muted">
            Coins launched from iMessage, and tokenized AAPL sent to holders after each local drop.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <StatCard
            label="Tokens launched"
            value={formatCount(tokensLaunched)}
            note="Successful launches on Stonks Exchange"
          />
          <StatCard
            label="Fees airdropped"
            value={`${formatAaplAmount(airdrops.totalAapl)} AAPL`}
            note={
              airdrops.dropCount > 0
                ? `${airdrops.recipientCount} recipient${airdrops.recipientCount === 1 ? "" : "s"} · ${airdrops.dropCount} drop${airdrops.dropCount === 1 ? "" : "s"}`
                : "Copy a leaderboard CSV after the next send"
            }
          />
        </section>

        <section className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-sm font-semibold">Latest drop</h2>
            {latestWhen ? <span className="text-xs text-faint">{latestWhen}</span> : null}
          </div>
          <div className="glass flex flex-col overflow-hidden rounded-[16px]">
            {airdrops.latest.length === 0 ? (
              <div className="px-5 py-6 text-[13px] text-muted">
                No sent airdrops yet. After{" "}
                <span className="font-mono">npm run send</span>, run{" "}
                <span className="font-mono">npm run publish-csv</span> in aapl-holder-drop.
              </div>
            ) : (
              <>
                <div className="hidden grid-cols-[auto_1fr_auto_auto] gap-3 px-5 py-2.5 text-[11px] uppercase tracking-[0.06em] text-faint sm:grid">
                  <span>Rank</span>
                  <span>Wallet</span>
                  <span className="text-right">AAPL</span>
                  <span className="text-right">Tx</span>
                </div>
                {airdrops.latest.map((row) => (
                  <DropRow key={row.txHash} row={row} />
                ))}
              </>
            )}
          </div>
        </section>

        <p className="text-[13px] text-muted">
          Want to launch the next one?{" "}
          <a href={site.bot.smsHref} className="font-medium text-primary hover:text-primary-hover">
            Text iStonk
          </a>
          {" · "}
          <Link href={site.links.app} className="font-medium text-primary hover:text-primary-hover">
            Open wallet
          </Link>
        </p>
      </main>
      <div className="relative z-10">
        <Footer />
      </div>
    </>
  );
}

function StatCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="glass flex flex-col gap-2 rounded-[16px] px-5 py-6">
      <span className="text-[13px] text-muted">{label}</span>
      <span className="font-mono text-[32px] font-medium leading-none tracking-[-0.03em] tabular sm:text-[40px]">
        {value}
      </span>
      <span className="text-xs text-faint">{note}</span>
    </div>
  );
}

function DropRow({ row }: { row: AirdropRow }) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-t border-hairline px-5 py-3.5 sm:grid-cols-[auto_1fr_auto_auto]">
      <span className="w-8 font-mono text-[13px] text-muted tabular">{row.rank}</span>
      <span className="font-mono text-[13px] text-foreground/80">{shortAddr(row.wallet)}</span>
      <span className="text-right font-mono text-[13px] tabular">
        {formatAaplAmount(row.aapl)}
      </span>
      <a
        href={`https://basescan.org/tx/${row.txHash}`}
        target="_blank"
        rel="noreferrer"
        className="hidden items-center justify-end gap-1 text-[13px] text-primary hover:text-primary-hover sm:inline-flex"
      >
        Basescan
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M9 2h5v5" />
          <path d="M14 2 7 9" />
        </svg>
      </a>
    </div>
  );
}

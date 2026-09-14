"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, Loader2 } from "lucide-react";

import {
  api,
  ApiError,
  type ActivityItem,
  type FeeRow,
  type LaunchRow,
  type WalletInfo,
} from "@/lib/api";
import { amountUsd, formatTokenAmount, formatUsd, shortAddr, timeAgo, weiToEth } from "@/lib/format";
import { site } from "@/lib/site";
import { useUsdPrices } from "@/lib/use-usd-prices";

import { AmountWithUsd, CompactDecimal } from "./compact-decimal";
import { SendCard, type SendAsset } from "./send-card";
import {
  Bubble,
  Button,
  Card,
  CardHeader,
  ETH_LOGO_URL,
  USDC_LOGO_URL,
  ExternalIcon,
  Logo,
  Pill,
  Row,
  TokenLogo,
} from "./ui";

/** Balances read from RPC can lag the claim receipt by a block or two. */
const POST_CLAIM_REFRESH_MS = 6_000;

export function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [launches, setLaunches] = useState<LaunchRow[]>([]);
  const [held, setHeld] = useState<FeeRow[]>([]);
  const [pending, setPending] = useState<FeeRow[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimedTx, setClaimedTx] = useState<string | null>(null);
  const [reauth, setReauth] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const [walletBody, feeBody, activityBody] = await Promise.all([
      api.wallet(),
      api.fees(),
      api.activity().catch(() => ({ items: [] as ActivityItem[] })),
    ]);
    setWallet(walletBody);
    setLaunches(Array.isArray(feeBody.launches) ? feeBody.launches : []);
    setHeld(
      (Array.isArray(feeBody.held) ? feeBody.held : []).filter(
        (row) => Number(row.amount) > 0,
      ),
    );
    setPending(
      (Array.isArray(feeBody.items) ? feeBody.items : []).filter(
        (row) => row.claimable && Number(row.amount) > 0,
      ),
    );
    setActivity(Array.isArray(activityBody.items) ? activityBody.items : []);
  }, []);

  useEffect(() => {
    void load().catch((err) =>
      setError(err instanceof Error ? err.message : String(err)),
    );
  }, [load]);

  const canCollect =
    launches.some((row) => row.canCollect) || pending.length > 0;

  async function claim() {
    setClaiming(true);
    setError(null);
    setClaimedTx(null);
    try {
      const { txHash } = await api.claim();
      setClaimedTx(txHash);
      // Pull fresh pending fees + wallet balances now, then once more after the RPC catches up.
      await load();
      setTimeout(() => void load().catch(() => {}), POST_CLAIM_REFRESH_MS);
    } catch (err) {
      if (err instanceof ApiError && err.needsReauth) setReauth(true);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setClaiming(false);
    }
  }

  const sendAssets = useMemo<SendAsset[]>(() => {
    const pairFor = (token: string) => {
      const launch = launches.find(
        (row) => row.tokenAddress?.toLowerCase() === token.toLowerCase(),
      );
      return launch?.pairSymbol ? `vs ${launch.pairSymbol}` : null;
    };
    const eth: SendAsset = {
      id: "eth",
      symbol: "ETH",
      available: wallet ? Number(wallet.ethWei) / 1e18 : 0,
      logoUrl: ETH_LOGO_URL,
    };
    return [
      eth,
      ...held.map((row) => ({
        id: row.token,
        symbol: row.symbol,
        available: Number(row.amount),
        availableExact: row.amount,
        note:
          pairFor(row.token) ??
          (row.symbol.toUpperCase() === "USDC" ? "USD Coin on Base" : null),
        logoUrl:
          row.symbol.toUpperCase() === "USDC"
            ? (row.logoUrl || USDC_LOGO_URL)
            : row.logoUrl,
      })),
    ];
  }, [wallet, held, launches]);

  const priceIds = useMemo(() => {
    const ids = ["eth"];
    for (const row of held) ids.push(row.token);
    for (const row of pending) ids.push(row.token);
    return ids;
  }, [held, pending]);
  const prices = useUsdPrices(priceIds);
  const ethUsd = wallet ? amountUsd(weiToEth(wallet.ethWei), prices.eth) : null;
  // Sum of the $ figures shown in Holdings. Unpriced coins (mostly fresh
  // launches) show no $ there, so they add nothing here either.
  const totalUsd = useMemo(() => {
    // No price response yet (or it failed): fall back to the ETH figure rather
    // than flashing "$0.00" for a wallet that clearly holds something.
    if (!wallet || prices.eth == null) return null;
    let sum = ethUsd ?? 0;
    for (const row of held) {
      sum += amountUsd(Number(row.amount), prices[row.token.toLowerCase()]) ?? 0;
    }
    return sum;
  }, [wallet, ethUsd, held, prices]);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <TopBar address={wallet?.address ?? null} onLogout={onLogout} />

      <main className="mx-auto flex w-full max-w-[1040px] flex-col gap-10 px-5 pb-20 pt-10 sm:pt-12">
        {wallet?.linked === false ? <LinkPhoneBanner /> : null}

        <BalanceHero wallet={wallet} coinCount={held.length} totalUsd={totalUsd} />

        <div className="grid gap-6 md:grid-cols-2">
          <Holdings wallet={wallet} held={held} launches={launches} prices={prices} />
          <CreatorFees
            pending={pending}
            canCollect={canCollect}
            claiming={claiming}
            claimedTx={claimedTx}
            onClaim={claim}
            heldCount={held.length}
            prices={prices}
          />
        </div>

        <Launches launches={launches} pending={pending} />

        <ActivityFeed items={activity} />

        <SendCard
          assets={sendAssets}
          prices={prices}
          onSent={load}
          onReauth={() => setReauth(true)}
        />

        {reauth ? (
          <p className="text-[13px] text-muted">
            Your account authorization expired. Text iStonk{" "}
            <span className="font-mono">connect</span> to renew it, then try
            again.
          </p>
        ) : null}
        {error ? <p className="text-[13px] text-danger">{error}</p> : null}
      </main>
    </div>
  );
}

/**
 * Web sign-in creates the wallet under a CDP user id only. Gifts sent by phone
 * number look the recipient up by phone, so until this wallet is linked to one
 * they land in escrow and never release here. `connect` from iMessage links it.
 */
function LinkPhoneBanner() {
  return (
    <Card accent className="gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <p className="text-[14px] font-semibold text-foreground">
          Link your phone number to this account
        </p>
        <p className="text-[13px] leading-relaxed text-muted">
          Stock sent to your number can&apos;t reach this account yet — it waits in
          escrow instead. Text iStonk <span className="font-mono">connect</span> and
          sign in with the same email to link it.
        </p>
      </div>
      <a
        href={site.bot.connectSmsHref}
        className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-primary px-4 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
      >
        Text connect
      </a>
    </Card>
  );
}

function TopBar({
  address,
  onLogout,
}: {
  address: string | null;
  onLogout: () => void;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <header className="border-b border-hairline">
      <div className="mx-auto flex h-16 w-full max-w-[1040px] items-center justify-between px-5">
        <div className="flex items-center gap-2.5">
          <Logo />
          <span className="text-[15px] font-semibold tracking-[-0.01em]">
            iStonk
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copy}
            disabled={!address}
            title={address ?? undefined}
            className="flex h-9 items-center gap-2 rounded-full border border-border-strong bg-chip px-3 transition-colors hover:border-primary-border"
          >
            <span
              className={`h-2 w-2 rounded-full ${address ? "bg-primary" : "bg-faint"}`}
            />
            <span className="font-mono text-[13px] text-foreground/80">
              {address ? shortAddr(address) : "…"}
            </span>
            {copied ? (
              <Check className="h-3.5 w-3.5 text-primary" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-muted" />
            )}
          </button>
          <Button
            variant="ghost"
            onClick={onLogout}
            className="h-9 px-3.5 font-normal"
          >
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}

const HERO_FIGURE =
  "whitespace-nowrap font-mono text-[44px] font-medium leading-none tracking-[-0.03em] tabular sm:text-[56px]";

function BalanceHero({
  wallet,
  coinCount,
  totalUsd,
}: {
  wallet: WalletInfo | null;
  coinCount: number;
  /** Sum of the $ values shown in Holdings; null until wallet + prices load. */
  totalUsd: number | null;
}) {
  const [showDeposit, setShowDeposit] = useState(false);
  const totalLabel = formatUsd(totalUsd);
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-2.5">
          <span className="text-[13px] text-muted">iStonk account · Base</span>
          <div className="flex items-baseline gap-3">
            {!wallet ? (
              <span className="flex h-[44px] items-center sm:h-[56px]">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </span>
            ) : totalLabel ? (
              <span className={HERO_FIGURE}>{totalLabel}</span>
            ) : (
              <>
                <CompactDecimal as="eth" value={weiToEth(wallet.ethWei)} className={HERO_FIGURE} />
                <span className="text-xl text-muted">ETH</span>
              </>
            )}
          </div>
          {wallet && totalLabel ? (
            <span className="flex items-baseline gap-1.5 font-mono text-[15px] text-muted tabular">
              <CompactDecimal as="eth" value={weiToEth(wallet.ethWei)} />
              <span>ETH for gas</span>
            </span>
          ) : null}
          <span className="text-sm text-muted">
            {coinCount > 0
              ? `${coinCount} asset${coinCount === 1 ? "" : "s"} held in this account, plus ETH`
              : "USDC, coins you launch, and fees you collect land here"}
          </span>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <Button
            variant="outline"
            className="flex-1 sm:flex-none"
            onClick={() => setShowDeposit((v) => !v)}
            disabled={!wallet}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M8 13V3" />
              <path d="M4 7l4-4 4 4" />
            </svg>
            Deposit
          </Button>
          <a
            href={
              wallet
                ? `https://basescan.org/address/${wallet.address}`
                : undefined
            }
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-border-strong px-4 text-[13px] font-semibold transition-colors hover:bg-chip sm:flex-none"
          >
            Basescan <ExternalIcon />
          </a>
        </div>
      </div>
      {showDeposit && wallet ? (
        <Card className="gap-1.5 p-5">
          <span className="text-sm font-medium">
            Send ETH or any Base token to this address
          </span>
          <span className="break-all font-mono text-[13px] text-muted">
            {wallet.address}
          </span>
          <span className="text-xs text-faint">
            Base network only. Funds sent on another chain will not show up.
          </span>
        </Card>
      ) : null}
    </section>
  );
}

function Holdings({
  wallet,
  held,
  launches,
  prices,
}: {
  wallet: WalletInfo | null;
  held: FeeRow[];
  launches: LaunchRow[];
  prices: Record<string, number>;
}) {
  const pairFor = (token: string) => {
    const launch = launches.find(
      (row) => row.tokenAddress?.toLowerCase() === token.toLowerCase(),
    );
    if (!launch) return null;
    return [
      launch.tokenName,
      launch.pairSymbol ? `vs ${launch.pairSymbol}` : null,
    ]
      .filter(Boolean)
      .join(" · ");
  };
  return (
    <Card>
      <CardHeader
        title="Holdings"
        action={
          <span className="text-xs text-faint">{held.length + 1} assets</span>
        }
      />
      <Row>
        <AssetLabel
          logo={ETH_LOGO_URL}
          symbol="ETH"
          name="ETH"
          note="Pays gas for sends and claims"
        />
        {wallet ? (
          <AmountWithUsd
            as="eth"
            value={weiToEth(wallet.ethWei)}
            usd={amountUsd(weiToEth(wallet.ethWei), prices.eth)}
            className="font-mono text-sm tabular"
          />
        ) : (
          <span className="font-mono text-sm tabular">…</span>
        )}
      </Row>
      {held.map((row) => (
        <Row key={row.token}>
          <AssetLabel
            logo={
              row.symbol.toUpperCase() === "USDC"
                ? row.logoUrl || USDC_LOGO_URL
                : row.logoUrl
            }
            symbol={row.symbol}
            name={row.symbol.toUpperCase() === "USDC" ? "USDC" : `$${row.symbol}`}
            note={
              pairFor(row.token) ??
              (row.symbol.toUpperCase() === "USDC" ? "USD Coin on Base" : null)
            }
          />
          <AmountWithUsd
            value={Number(row.amount)}
            usd={amountUsd(Number(row.amount), prices[row.token.toLowerCase()])}
            className="font-mono text-sm tabular"
          />
        </Row>
      ))}
    </Card>
  );
}

function AssetLabel({
  logo,
  symbol,
  name,
  note,
}: {
  logo?: string | null;
  symbol: string;
  name: string;
  note: string | null;
}) {
  return (
    <div className="flex items-center gap-3">
      <TokenLogo src={logo} symbol={symbol} />
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{name}</span>
        {note ? <span className="text-xs text-muted">{note}</span> : null}
      </div>
    </div>
  );
}

function CreatorFees({
  pending,
  canCollect,
  claiming,
  claimedTx,
  heldCount,
  onClaim,
  prices,
}: {
  pending: FeeRow[];
  canCollect: boolean;
  claiming: boolean;
  claimedTx: string | null;
  heldCount: number;
  onClaim: () => void;
  prices: Record<string, number>;
}) {
  return (
    <Card accent={canCollect}>
      <CardHeader
        title="Creator fees"
        subtitle="Uncollected trading fees from your launches"
        action={
          <Button
            onClick={onClaim}
            busy={claiming}
            disabled={!canCollect}
            className="h-9"
          >
            {claiming ? "Collecting" : "Collect all"}
          </Button>
        }
      />
      {pending.length > 0 ? (
        pending.map((row) => (
          <Row key={row.token}>
            <span className="flex items-center gap-2.5 text-sm font-medium">
              <TokenLogo src={row.logoUrl} symbol={row.symbol} size={24} />
              {row.symbol}
            </span>
            <AmountWithUsd
              prefix="+"
              value={Number(row.amount)}
              usd={amountUsd(Number(row.amount), prices[row.token.toLowerCase()])}
              className="font-mono text-sm text-primary tabular"
            />
          </Row>
        ))
      ) : (
        <Row>
          <span className="text-[13px] text-muted">
            {canCollect
              ? "New trading fees are ready. Collect to pull them in."
              : heldCount > 0
                ? "Nothing new to collect. Holdings are already yours."
                : "No fees yet. They land here after people trade your coins."}
          </span>
        </Row>
      )}
      {claimedTx ? (
        <Row className="bg-card-inset">
          <span className="text-xs text-muted">
            Collected. Holdings above are updated.
          </span>
          <a
            href={`https://basescan.org/tx/${claimedTx}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary-hover"
          >
            View tx <ExternalIcon />
          </a>
        </Row>
      ) : null}
    </Card>
  );
}

function Launches({
  launches,
  pending,
}: {
  launches: LaunchRow[];
  pending: FeeRow[];
}) {
  const readyFor = (row: LaunchRow) =>
    pending.filter(
      (fee) =>
        fee.token.toLowerCase() === row.tokenAddress?.toLowerCase() ||
        fee.token.toLowerCase() === row.quoteAddress?.toLowerCase(),
    );
  return (
    <section className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold">Your launches</h2>
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-faint">
            To launch another, text iStonk
          </span>
          <Bubble>launch pizza coin vs AAPL</Bubble>
        </div>
      </div>
      <Card>
        {launches.length === 0 ? (
          <div className="px-5 py-6 text-[13px] text-muted">
            No coins yet. Text iStonk and say launch pizza coin.
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-5 px-5 py-2.5 text-[11px] uppercase tracking-[0.06em] text-faint sm:grid">
              <span>Coin</span>
              <span>Pair</span>
              <span>Launched</span>
              <span>Fees</span>
              <span className="text-right">Link</span>
            </div>
            {launches.map((row) => {
              const ready = readyFor(row);
              const when = timeAgo(row.createdAt);
              const link = row.tokenAddress
                ? `https://thestonks.exchange/token/${row.tokenAddress}`
                : null;
              return (
                <div
                  key={`${row.tokenAddress}-${row.txHash}`}
                  className="grid grid-cols-[1fr_auto] items-center gap-3 border-t border-hairline px-5 py-3.5 sm:grid-cols-5"
                >
                  <div className="flex items-center gap-3">
                    <TokenLogo
                      src={row.imageUrl}
                      symbol={row.tokenSymbol ?? "TOKEN"}
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">
                        ${row.tokenSymbol ?? "TOKEN"}
                        {row.pairSymbol ? (
                          <span className="font-normal text-muted sm:hidden">
                            {" "}
                            / {row.pairSymbol}
                          </span>
                        ) : null}
                      </span>
                      <span className="text-xs text-muted">
                        {row.tokenName}
                      </span>
                    </div>
                  </div>
                  <span className="hidden font-mono text-[13px] text-foreground/80 sm:block">
                    {row.pairSymbol ?? "·"}
                  </span>
                  <span className="hidden text-[13px] text-muted sm:block">
                    {when ?? "·"}
                  </span>
                  <div className="flex justify-end sm:justify-start">
                    {ready.length > 0 ? (
                      <Pill tone="primary">
                        {ready.length === 1
                          ? `${formatTokenAmount(ready[0].amount)} ${ready[0].symbol} ready`
                          : "fees ready"}
                      </Pill>
                    ) : row.canCollect ? (
                      <Pill tone="primary">fees ready</Pill>
                    ) : (
                      <Pill>nothing new</Pill>
                    )}
                  </div>
                  <div className="hidden justify-end sm:flex">
                    {link ? (
                      <a
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[13px] text-primary hover:text-primary-hover"
                      >
                        Stonks Exchange <ExternalIcon />
                      </a>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </Card>
    </section>
  );
}

function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <section className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold">Activity</h2>
        <p className="text-xs text-muted">Stock sends from iMessage and Apple Pay</p>
      </div>
      <Card>
        {items.length === 0 ? (
          <div className="px-5 py-6 text-[13px] text-muted">
            No stock sends yet. Text iStonk and say send $2 of Apple to a friend.
          </div>
        ) : (
          items.map((row) => {
            const when = timeAgo(row.createdAt);
            const directionLabel = row.direction === "sent" ? "Sent" : "Received";
            const statusTone = row.status === "sent" ? "primary" : undefined;
            return (
              <Row key={row.id}>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium">
                    {directionLabel} {row.amountLabel}
                  </span>
                  <span className="truncate text-xs text-muted">
                    {row.direction === "sent" ? "to" : "from"} {row.counterparty}
                    {when ? ` · ${when}` : ""}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Pill tone={statusTone}>{row.status}</Pill>
                  {row.txHash ? (
                    <a
                      href={`https://basescan.org/tx/${row.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary-hover"
                    >
                      tx <ExternalIcon />
                    </a>
                  ) : null}
                </div>
              </Row>
            );
          })
        )}
      </Card>
    </section>
  );
}

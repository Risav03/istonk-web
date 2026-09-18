"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  api,
  ApiError,
  type ActivityItem,
  type ContactRow,
  type FeeRow,
  type LaunchRow,
  type WalletInfo,
} from "@/lib/api";
import { amountUsd, formatTokenAmount, formatUsd, shortAddr, timeAgo, weiToEth } from "@/lib/format";
import { parseSendChannel } from "@/lib/send-channels";
import { site } from "@/lib/site";
import { useUsdPrices } from "@/lib/use-usd-prices";

import { AmountWithUsd, CompactDecimal } from "./compact-decimal";
import { ConnectHint } from "./connect-hint";
import { ContactsCard } from "./contacts-card";
import { LaunchCoinButton } from "./launch-coin-button";
import { SendCard, type SendAsset } from "./send-card";
import { SendStockCard } from "./send-stock-card";
import {
  Badge,
  Button,
  Chip,
  DataRow,
  ETH_LOGO_URL,
  Eyebrow,
  ExternalIcon,
  Figure,
  Panel,
  PanelHead,
  TokenLogo,
  USDC_LOGO_URL,
  Wordmark,
  type BadgeState,
} from "./ds";
import { Card, Row } from "./ui";

/** Balances read from RPC can lag the claim receipt by a block or two. */
const POST_CLAIM_REFRESH_MS = 6_000;

type AppPanel = "send" | "wallet" | "launches" | "activity";

const APP_TABS = [
  { id: "send", label: "Send" },
  { id: "wallet", label: "Account" },
  { id: "launches", label: "Launches" },
  { id: "activity", label: "Activity" },
] as const;

export function Dashboard({ onLogout }: { onLogout: () => void }) {
  const searchParams = useSearchParams();
  const sendChannel = parseSendChannel(searchParams.get("send"));
  const [panel, setPanel] = useState<AppPanel>(sendChannel ? "send" : "wallet");
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [launches, setLaunches] = useState<LaunchRow[]>([]);
  const [held, setHeld] = useState<FeeRow[]>([]);
  const [pending, setPending] = useState<FeeRow[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimedTx, setClaimedTx] = useState<string | null>(null);
  const [reauth, setReauth] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const [walletBody, feeBody, activityBody, contactItems] = await Promise.all([
      api.wallet(),
      api.fees(),
      api.activity().catch(() => ({ items: [] as ActivityItem[] })),
      api.contacts().catch(() => [] as ContactRow[]),
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
    setContacts(Array.isArray(contactItems) ? contactItems : []);
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
    <div className="relative flex min-h-[100dvh] flex-col">
      <span aria-hidden className="istonk-grain pointer-events-none fixed inset-0" />
      <TopBar address={wallet?.address ?? null} onLogout={onLogout} />

      <main className="relative mx-auto flex w-full max-w-[1040px] flex-col gap-7 px-[var(--gutter-mobile)] pt-9 pb-24 md:px-7">
        {wallet?.linked === false ? <LinkPhoneBanner /> : null}

        <BalanceHero wallet={wallet} coinCount={held.length} totalUsd={totalUsd} />

        <div
          role="tablist"
          aria-label="Account sections"
          className="flex gap-6 overflow-x-auto border-b border-rule"
        >
          {APP_TABS.map((t) => {
            const on = panel === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setPanel(t.id)}
                className="shrink-0 cursor-pointer border-0 bg-transparent pb-3"
                style={{
                  font: "var(--type-label)",
                  letterSpacing: "var(--track-tight)",
                  color: on ? "var(--text-primary)" : "var(--text-secondary)",
                  boxShadow: on ? "inset 0 -2px 0 var(--ink)" : "none",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {panel === "send" ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <SendStockCard
              contacts={contacts}
              onSent={load}
              onReauth={() => setReauth(true)}
            />
            <ContactsCard contacts={contacts} onChanged={load} />
          </div>
        ) : null}

        {panel === "wallet" ? (
          <div className="flex flex-col gap-6">
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
            <SendCard
              assets={sendAssets}
              prices={prices}
              onSent={load}
              onReauth={() => setReauth(true)}
            />
          </div>
        ) : null}

        {panel === "launches" ? (
          <Launches
            launches={launches}
            pending={pending}
            onLaunched={load}
            onReauth={() => setReauth(true)}
          />
        ) : null}

        {panel === "activity" ? <ActivityFeed items={activity} /> : null}

        {reauth ? (
          <ConnectHint eyebrow="Authorization expired" tail="to renew it, then try that again." />
        ) : null}
        {error ? (
          <p style={{ font: "var(--type-body-sm)", color: "var(--down)" }}>{error}</p>
        ) : null}
      </main>
    </div>
  );
}

/**
 * Web sign-in creates the account under a CDP user id only. Gifts sent by phone
 * number look the recipient up by phone, so until this account is linked to one
 * they land in escrow and never release here. `connect` from iMessage links it.
 */
function LinkPhoneBanner() {
  return (
    <Card accent className="gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1.5">
        <p style={{ font: "var(--type-h3)" }}>Link your phone number to this account</p>
        <p
          className="max-w-[52ch]"
          style={{ font: "var(--type-body-sm)", color: "var(--text-secondary)" }}
        >
          Stock sent to your number can&apos;t reach this account yet — it waits in escrow
          instead. Text <code style={{ font: "var(--type-mono)" }}>connect</code> to iStonk and
          sign in with the same email to link it.
        </p>
      </div>
      <a
        href={site.bot.connectSmsHref}
        className="istonk-press inline-flex shrink-0 flex-col items-center justify-center no-underline"
        style={{
          minHeight: 52,
          padding: "8px 20px",
          borderRadius: "var(--r-pill)",
          background: "var(--action-accent)",
          color: "#fff",
          boxShadow: "var(--shadow-accent)",
          font: "600 15px/1.15 var(--font-text)",
          letterSpacing: "var(--track-tight)",
        }}
      >
        Text connect
        <span
          className="type-mono-sm"
          style={{ color: "rgba(255,255,255,.82)", letterSpacing: 0 }}
        >
          {site.bot.phonePretty}
        </span>
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
    <header
      className="sticky top-0 z-30 border-b border-rule"
      style={{ background: "color-mix(in oklch, var(--paper) 88%, transparent)", backdropFilter: "blur(12px)" }}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1040px] items-center justify-between gap-4 px-[var(--gutter-mobile)] md:px-7">
        <Wordmark size={17} markSize={34} priority />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copy}
            disabled={!address}
            title={address ?? undefined}
            className="cursor-pointer border-0 bg-transparent p-0 disabled:cursor-default"
          >
            <Chip mono dot={address ? "var(--live)" : "var(--faint)"} tone="paper">
              {address ? shortAddr(address) : "…"}
              <span style={{ color: copied ? "var(--up)" : "var(--text-tertiary)" }}>
                {copied ? "copied" : "copy"}
              </span>
            </Chip>
          </button>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}

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
        <div className="flex flex-col gap-2">
          <Eyebrow>iStonk account · Base</Eyebrow>
          <div className="flex min-h-[56px] items-baseline gap-3">
            {!wallet ? (
              <span
                className="istonk-spin"
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "var(--r-pill)",
                  border: "2px solid var(--ink)",
                  borderTopColor: "transparent",
                  alignSelf: "center",
                }}
              />
            ) : totalLabel ? (
              <Figure value={totalLabel} size="hero" mono />
            ) : (
              <Figure
                value={<CompactDecimal as="eth" value={weiToEth(wallet.ethWei)} />}
                suffix="ETH"
                size="hero"
                mono
              />
            )}
          </div>
          {wallet && totalLabel ? (
            <span
              className="type-mono inline-flex items-baseline gap-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              <CompactDecimal as="eth" value={weiToEth(wallet.ethWei)} />
              <span>ETH for gas</span>
            </span>
          ) : null}
          <p
            className="max-w-[46ch]"
            style={{ font: "var(--type-body-sm)", color: "var(--text-secondary)" }}
          >
            {coinCount > 0
              ? `${coinCount} asset${coinCount === 1 ? "" : "s"} held in this account, plus ETH`
              : "USDC, coins you launch, and fees you collect land here"}
          </p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <Button
            variant="outline"
            className="flex-1 sm:flex-none"
            onClick={() => setShowDeposit((v) => !v)}
            disabled={!wallet}
          >
            Deposit
          </Button>
          <a
            href={wallet ? `https://basescan.org/address/${wallet.address}` : undefined}
            target="_blank"
            rel="noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 border border-rule-strong no-underline sm:flex-none"
            style={{
              height: 44,
              padding: "0 20px",
              borderRadius: "var(--r-pill)",
              font: "600 15px/1 var(--font-text)",
              letterSpacing: "var(--track-tight)",
              color: "var(--text-primary)",
            }}
          >
            Basescan <ExternalIcon />
          </a>
        </div>
      </div>
      {showDeposit && wallet ? (
        <Card className="gap-2 p-5">
          <span style={{ font: "var(--type-h3)" }}>
            Send ETH or any Base token to this address
          </span>
          <span className="type-mono break-all" style={{ color: "var(--text-secondary)" }}>
            {wallet.address}
          </span>
          <span style={{ font: "var(--type-legal)", color: "var(--text-tertiary)" }}>
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
    <Panel>
      <PanelHead
        title="Holdings"
        action={
          <Eyebrow>
            {held.length + 1} asset{held.length === 0 ? "" : "s"}
          </Eyebrow>
        }
      />
      <DataRow
        leading={<TokenLogo src={ETH_LOGO_URL} symbol="ETH" size={34} />}
        title="ETH"
        note="Covers gas to collect fees or withdraw"
        value={
          wallet ? (
            <AmountWithUsd
              as="eth"
              value={weiToEth(wallet.ethWei)}
              usd={amountUsd(weiToEth(wallet.ethWei), prices.eth)}
              className="type-mono"
              usdClassName="type-mono-sm"
            />
          ) : (
            <span className="type-mono" style={{ color: "var(--text-tertiary)" }}>
              …
            </span>
          )
        }
      />
      {held.map((row) => {
        const isUsdc = row.symbol.toUpperCase() === "USDC";
        return (
          <DataRow
            key={row.token}
            leading={
              <TokenLogo
                src={isUsdc ? row.logoUrl || USDC_LOGO_URL : row.logoUrl}
                symbol={row.symbol}
                size={34}
              />
            }
            title={isUsdc ? "USDC" : `$${row.symbol}`}
            note={pairFor(row.token) ?? (isUsdc ? "USD Coin on Base" : null)}
            value={
              <AmountWithUsd
                value={Number(row.amount)}
                usd={amountUsd(Number(row.amount), prices[row.token.toLowerCase()])}
                className="type-mono"
                usdClassName="type-mono-sm"
              />
            }
          />
        );
      })}
    </Panel>
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
      <PanelHead
        title="Creator fees"
        sub="Uncollected trading fees from your launches"
        action={
          <Button size="sm" onClick={onClaim} busy={claiming} disabled={!canCollect}>
            {claiming ? "Collecting" : "Collect all"}
          </Button>
        }
      />
      {pending.length > 0 ? (
        pending.map((row) => (
          <DataRow
            key={row.token}
            style={{
              background: "linear-gradient(90deg, var(--up-tint), transparent 60%)",
            }}
            leading={<TokenLogo src={row.logoUrl} symbol={row.symbol} size={34} />}
            title={row.symbol}
            note={<Badge state="pending">ready to collect</Badge>}
            value={
              <AmountWithUsd
                prefix="+"
                value={Number(row.amount)}
                usd={amountUsd(Number(row.amount), prices[row.token.toLowerCase()])}
                className="type-mono"
                usdClassName="type-mono-sm"
              />
            }
          />
        ))
      ) : (
        <Row>
          <span style={{ font: "var(--type-body-sm)", color: "var(--text-secondary)" }}>
            {canCollect
              ? "New trading fees are ready. Collect to pull them in."
              : heldCount > 0
                ? "Nothing new to collect. Holdings are already yours."
                : "No fees yet. They land here after people trade your coins."}
          </span>
        </Row>
      )}
      {claimedTx ? (
        <Row style={{ background: "var(--bg-sunk)" }}>
          <span style={{ font: "var(--type-body-sm)", color: "var(--text-secondary)" }}>
            Collected. Holdings above are updated.
          </span>
          <a
            href={`https://basescan.org/tx/${claimedTx}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 no-underline"
            style={{ font: "var(--type-micro)" }}
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
  onLaunched,
  onReauth,
}: {
  launches: LaunchRow[];
  pending: FeeRow[];
  onLaunched: () => Promise<void>;
  onReauth: () => void;
}) {
  const readyFor = (row: LaunchRow) =>
    pending.filter(
      (fee) =>
        fee.token.toLowerCase() === row.tokenAddress?.toLowerCase() ||
        fee.token.toLowerCase() === row.quoteAddress?.toLowerCase(),
    );
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="type-h2 font-text-face">Your launches</h2>
          <p
            className="mt-1"
            style={{ font: "var(--type-body-sm)", color: "var(--text-secondary)" }}
          >
            Coins you created. Trading happens on Stonks Exchange.
          </p>
        </div>
        <LaunchCoinButton onLaunched={onLaunched} onReauth={onReauth} />
      </div>
      <Panel>
        {launches.length === 0 ? (
          <div
            className="px-5 py-7"
            style={{ font: "var(--type-body-sm)", color: "var(--text-secondary)" }}
          >
            No coins yet. Launch one from here or in iMessage.
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-[1.4fr_0.7fr_0.8fr_1fr_auto] gap-3 px-5 py-2.5 sm:grid">
              {["Coin", "Pair", "Launched", "Fees", "Link"].map((h, i) => (
                <Eyebrow key={h} style={i === 4 ? { textAlign: "right" } : undefined}>
                  {h}
                </Eyebrow>
              ))}
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
                  className="grid grid-cols-[1fr_auto] items-center gap-3 border-t border-rule px-5 py-3.5 sm:grid-cols-[1.4fr_0.7fr_0.8fr_1fr_auto]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <TokenLogo src={row.imageUrl} symbol={row.tokenSymbol ?? "TOKEN"} size={34} />
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate" style={{ font: "var(--type-label)" }}>
                        ${row.tokenSymbol ?? "TOKEN"}
                        {row.pairSymbol ? (
                          <span className="sm:hidden" style={{ color: "var(--text-secondary)" }}>
                            {" "}
                            / {row.pairSymbol}
                          </span>
                        ) : null}
                      </span>
                      <span
                        className="truncate"
                        style={{ font: "var(--type-legal)", color: "var(--text-tertiary)" }}
                      >
                        {row.tokenName}
                      </span>
                    </div>
                  </div>
                  <span
                    className="type-mono-sm hidden sm:block"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {row.pairSymbol ?? "·"}
                  </span>
                  <span
                    className="hidden sm:block"
                    style={{ font: "var(--type-body-sm)", color: "var(--text-secondary)" }}
                    suppressHydrationWarning
                  >
                    {when ?? "·"}
                  </span>
                  <div className="flex justify-end sm:justify-start">
                    {ready.length > 0 ? (
                      <Badge state="pending">
                        {ready.length === 1
                          ? `${formatTokenAmount(ready[0].amount)} ${ready[0].symbol} ready`
                          : "fees ready"}
                      </Badge>
                    ) : row.canCollect ? (
                      <Badge state="pending">fees ready</Badge>
                    ) : (
                      <Badge state="claimed">nothing new</Badge>
                    )}
                  </div>
                  <div className="hidden justify-end sm:flex">
                    {link ? (
                      <a
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 whitespace-nowrap no-underline"
                        style={{ font: "var(--type-micro)" }}
                      >
                        Stonks <ExternalIcon />
                      </a>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </Panel>
    </section>
  );
}

function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="type-h2 font-text-face">Activity</h2>
        <p
          className="mt-1"
          style={{ font: "var(--type-body-sm)", color: "var(--text-secondary)" }}
        >
          Stock sends from iMessage and Apple Pay
        </p>
      </div>
      <Panel>
        {items.length === 0 ? (
          <div
            className="px-5 py-7"
            style={{ font: "var(--type-body-sm)", color: "var(--text-secondary)" }}
          >
            No stock sends yet. Text iStonk and say send $2 of Apple to a friend.
          </div>
        ) : (
          items.map((row) => {
            const awaitingPay = row.status === "awaiting_payment";
            const directionLabel = awaitingPay
              ? "Checkout"
              : row.direction === "sent"
                ? "Sent"
                : "Received";
            const statusLabel =
              row.status === "awaiting_payment"
                ? "awaiting Apple Pay"
                : row.status === "pending"
                  ? "pending"
                  : row.status;
            const state: BadgeState =
              row.status === "sent"
                ? "claimed"
                : row.status === "failed"
                  ? "down"
                  : awaitingPay
                    ? "escrow"
                    : "pending";
            const when = timeAgo(row.createdAt);
            return (
              <DataRow
                key={row.id}
                title={`${directionLabel} ${row.amountLabel}`}
                note={
                  <span suppressHydrationWarning>
                    {row.direction === "sent" || awaitingPay ? "to" : "from"} {row.counterparty}
                    {when ? ` · ${when}` : ""}
                  </span>
                }
                value={<Badge state={state}>{statusLabel}</Badge>}
                trailing={
                  row.txHash ? (
                    <a
                      href={`https://basescan.org/tx/${row.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex shrink-0 items-center gap-1 no-underline"
                      style={{ font: "var(--type-micro)" }}
                    >
                      tx <ExternalIcon />
                    </a>
                  ) : null
                }
              />
            );
          })
        )}
      </Panel>
    </section>
  );
}

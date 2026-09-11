"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, Loader2 } from "lucide-react";

import {
  api,
  ApiError,
  type FeeRow,
  type LaunchRow,
  type WalletInfo,
} from "@/lib/api";
import { formatEth, formatTokenAmount, shortAddr, timeAgo } from "@/lib/format";

import { SendCard, type SendAsset } from "./send-card";
import {
  Bubble,
  Button,
  Card,
  CardHeader,
  ETH_LOGO_URL,
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
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimedTx, setClaimedTx] = useState<string | null>(null);
  const [reauth, setReauth] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const [walletBody, feeBody] = await Promise.all([api.wallet(), api.fees()]);
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
        note: pairFor(row.token),
        logoUrl: row.logoUrl,
      })),
    ];
  }, [wallet, held, launches]);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <TopBar address={wallet?.address ?? null} onLogout={onLogout} />

      <main className="mx-auto flex w-full max-w-[1040px] flex-col gap-10 px-5 pb-20 pt-10 sm:pt-12">
        <BalanceHero wallet={wallet} coinCount={held.length} />

        <div className="grid gap-6 md:grid-cols-2">
          <Holdings wallet={wallet} held={held} launches={launches} />
          <CreatorFees
            pending={pending}
            canCollect={canCollect}
            claiming={claiming}
            claimedTx={claimedTx}
            onClaim={claim}
            heldCount={held.length}
          />
        </div>

        <Launches launches={launches} pending={pending} />

        <SendCard
          assets={sendAssets}
          onSent={load}
          onReauth={() => setReauth(true)}
        />

        {reauth ? (
          <p className="text-[13px] text-muted">
            Your wallet authorization expired. Text iStonk{" "}
            <span className="font-mono">connect</span> to renew it, then try
            again.
          </p>
        ) : null}
        {error ? <p className="text-[13px] text-danger">{error}</p> : null}
      </main>
    </div>
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
            <span className="font-mono text-[13px] text-[#c9d4cc]">
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

function BalanceHero({
  wallet,
  coinCount,
}: {
  wallet: WalletInfo | null;
  coinCount: number;
}) {
  const [showDeposit, setShowDeposit] = useState(false);
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-2.5">
          <span className="text-[13px] text-muted">iStonk wallet · Base</span>
          <div className="flex items-baseline gap-3">
            {wallet ? (
              <span className="font-mono text-[44px] font-medium leading-none tracking-[-0.03em] tabular sm:text-[56px]">
                {formatEth(wallet.ethWei)}
              </span>
            ) : (
              <span className="flex h-[44px] items-center sm:h-[56px]">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </span>
            )}
            <span className="text-xl text-muted">ETH</span>
          </div>
          <span className="text-sm text-muted">
            {coinCount > 0
              ? `plus ${coinCount} coin${coinCount === 1 ? "" : "s"} you launched, held in this wallet`
              : "Coins you launch and fees you collect land here"}
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
}: {
  wallet: WalletInfo | null;
  held: FeeRow[];
  launches: LaunchRow[];
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
        <span className="font-mono text-sm tabular">
          {wallet ? formatEth(wallet.ethWei) : "…"}
        </span>
      </Row>
      {held.map((row) => (
        <Row key={row.token}>
          <AssetLabel
            logo={row.logoUrl}
            symbol={row.symbol}
            name={`$${row.symbol}`}
            note={pairFor(row.token)}
          />
          <span className="font-mono text-sm tabular">
            {formatTokenAmount(row.amount)}
          </span>
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
}: {
  pending: FeeRow[];
  canCollect: boolean;
  claiming: boolean;
  claimedTx: string | null;
  heldCount: number;
  onClaim: () => void;
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
            <span className="font-mono text-sm text-primary tabular">
              +{formatTokenAmount(row.amount)}
            </span>
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
                  <span className="hidden font-mono text-[13px] text-[#c9d4cc] sm:block">
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

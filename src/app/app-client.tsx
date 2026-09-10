"use client";

import { useCallback, useEffect, useState } from "react";
import { CDPReactProvider } from "@coinbase/cdp-react";
import {
  useCurrentUser,
  useGetAccessToken,
  useIsSignedIn,
  useSignInWithEmail,
  useSignOut,
  useVerifyEmailOTP,
} from "@coinbase/cdp-hooks";
import { Copy, ExternalLink, Loader2, LogOut, Wallet } from "lucide-react";

import { cdpSignInError } from "@/lib/cdp-errors";

const PROJECT_ID =
  process.env.NEXT_PUBLIC_CDP_PROJECT_ID ?? "eaa74d0f-2a2d-470b-8a13-51aba1bf5e7b";

const cdpConfig = {
  projectId: PROJECT_ID,
  appName: "iStonk",
  ethereum: { createOnLogin: "smart" as const },
};

type Phase = "checking" | "email" | "otp" | "linking" | "ready" | "error";

type WalletInfo = { address: string; ethWei: string };
type LaunchRow = {
  tokenAddress: string | null;
  tokenSymbol: string | null;
  tokenName: string | null;
  pairSymbol: string | null;
  txHash?: string | null;
  feeLocker?: string | null;
  createdAt?: string | null;
  canCollect?: boolean;
};
type FeeRow = {
  token: string;
  symbol: string;
  amount: string;
  claimable?: boolean;
};

export function AppClient({ initialHasSession = false }: { initialHasSession?: boolean }) {
  return (
    <CDPReactProvider config={cdpConfig}>
      <AuthGate initialHasSession={initialHasSession} />
    </CDPReactProvider>
  );
}

function AuthGate({ initialHasSession }: { initialHasSession: boolean }) {
  const { isSignedIn } = useIsSignedIn();
  const { currentUser } = useCurrentUser();
  const { getAccessToken } = useGetAccessToken();
  const { signInWithEmail } = useSignInWithEmail();
  const { verifyEmailOTP } = useVerifyEmailOTP();
  const { signOut } = useSignOut();

  const [phase, setPhase] = useState<Phase>(initialHasSession ? "checking" : "email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [flowId, setFlowId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!initialHasSession) return;
    let cancelled = false;
    fetch("/api/app/stonks/wallet", { cache: "no-store" })
      .then((res) => {
        if (cancelled) return;
        setPhase(res.ok ? "ready" : "email");
      })
      .catch(() => {
        if (!cancelled) setPhase("email");
      });
    return () => {
      cancelled = true;
    };
  }, [initialHasSession]);

  const linkSession = useCallback(async () => {
    setPhase("linking");
    try {
      const raw = (await getAccessToken()) as unknown;
      const accessToken =
        typeof raw === "string" ? raw : (raw as { accessToken?: string })?.accessToken;
      if (!accessToken) throw new Error("Couldn't read your iStonk session.");
      const res = await fetch("/api/app/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ accessToken }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Sign-in failed.");
      setPhase("ready");
    } catch (err) {
      setPhase("error");
      setMessage(err instanceof Error ? err.message : "Sign-in failed.");
    }
  }, [getAccessToken]);

  useEffect(() => {
    if ((phase === "email" || phase === "otp") && isSignedIn) setPhase("linking");
  }, [phase, isSignedIn]);

  useEffect(() => {
    if (phase === "linking" && isSignedIn && currentUser) {
      void linkSession();
    }
  }, [phase, isSignedIn, currentUser, linkSession]);

  async function submitEmail() {
    if (!email) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await signInWithEmail({ email });
      setFlowId(result.flowId);
      setPhase("otp");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Couldn't send the code.";
      if (/already authenticated|already signed in/i.test(msg)) {
        setPhase("linking");
        return;
      }
      setMessage(cdpSignInError(err));
    } finally {
      setBusy(false);
    }
  }

  async function submitOtp() {
    if (!flowId || !otp) return;
    setBusy(true);
    setMessage(null);
    try {
      await verifyEmailOTP({ flowId, otp });
      setPhase("linking");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "That code didn't work — try again.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/app/session", { method: "DELETE" }).catch(() => {});
    await signOut().catch(() => {});
    setPhase("email");
  }

  if (phase === "ready") return <Dashboard onLogout={logout} />;

  return (
    <section className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-6 px-5 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--primary)]/30 bg-[var(--primary)]/10 text-[var(--primary)]">
        <Wallet className="h-7 w-7" />
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">iStonk</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Sign in to see your wallet, launches, and creator fees.
        </p>
      </div>
      {phase === "otp" ? (
        <div className="w-full">
          <input
            inputMode="numeric"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))}
            placeholder="123456"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-center text-lg tracking-widest"
          />
          <button
            type="button"
            onClick={submitOtp}
            disabled={busy || otp.length < 6}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-[var(--primary-foreground)] disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Verify
          </button>
        </div>
      ) : phase === "linking" || phase === "checking" ? (
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      ) : (
        <div className="w-full">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3"
          />
          <button
            type="button"
            onClick={submitEmail}
            disabled={busy || !email}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-[var(--primary-foreground)] disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Send code
          </button>
        </div>
      )}
      {message ? <p className="text-sm text-[var(--danger)]">{message}</p> : null}
    </section>
  );
}

function formatEth(wei: string): string {
  try {
    const value = Number(wei) / 1e18;
    if (!Number.isFinite(value)) return "0";
    return value < 0.0001 ? value.toExponential(2) : value.toFixed(5);
  } catch {
    return "0";
  }
}

function formatTokenAmount(amount: string): string {
  const n = Number(amount);
  if (!Number.isFinite(n) || n === 0) return "0";
  if (n < 0.0001) return n.toExponential(2);
  if (n < 1) return n.toFixed(6);
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

function shortAddr(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [launches, setLaunches] = useState<LaunchRow[]>([]);
  const [held, setHeld] = useState<FeeRow[]>([]);
  const [pending, setPending] = useState<FeeRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const [walletRes, feeRes] = await Promise.all([
      fetch("/api/app/stonks/wallet", { cache: "no-store" }),
      fetch("/api/app/stonks/fees", { cache: "no-store" }),
    ]);
    const walletBody = await walletRes.json().catch(() => ({}));
    const feeBody = await feeRes.json().catch(() => ({}));
    if (!walletRes.ok) throw new Error(walletBody?.error || "Could not load wallet.");
    if (!feeRes.ok) throw new Error(feeBody?.error || "Could not load fees.");
    setWallet(walletBody as WalletInfo);
    const liveLaunches = Array.isArray(feeBody?.launches) ? feeBody.launches : [];
    setLaunches(liveLaunches);
    const heldRows = Array.isArray(feeBody?.held) ? (feeBody.held as FeeRow[]) : [];
    setHeld(heldRows.filter((row) => Number(row.amount) > 0));
    const lockerRows = Array.isArray(feeBody?.items) ? (feeBody.items as FeeRow[]) : [];
    setPending(lockerRows.filter((row) => row.claimable && Number(row.amount) > 0));
  }, []);

  useEffect(() => {
    void load().catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, [load]);

  const canCollect = launches.some((row) => row.canCollect) || pending.length > 0;

  async function claim() {
    setClaiming(true);
    setError(null);
    try {
      const res = await fetch("/api/app/stonks/fees/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || "Collect failed.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setClaiming(false);
    }
  }

  async function copyAddress() {
    if (!wallet?.address) return;
    await navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">iStonk</p>
          <h1 className="text-2xl font-bold tracking-tight">Wallet</h1>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)]"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </header>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <p className="text-sm text-[var(--muted)]">iStonk wallet</p>
        {wallet ? (
          <div className="mt-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button type="button" onClick={copyAddress} className="inline-flex items-center gap-2 font-mono text-sm">
                {shortAddr(wallet.address)}
                <Copy className="h-3.5 w-3.5" />
                {copied ? <span className="text-[var(--primary)]">copied</span> : null}
              </button>
              <a
                href={`https://basescan.org/address/${wallet.address}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm text-[var(--primary)]"
              >
                Basescan <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center justify-between text-sm">
                <span>ETH</span>
                <span className="font-semibold">{formatEth(wallet.ethWei)}</span>
              </li>
              {held.map((row) => (
                <li key={row.token} className="flex items-center justify-between text-sm">
                  <span>{row.symbol}</span>
                  <span className="font-semibold">{formatTokenAmount(row.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <Loader2 className="mt-3 h-5 w-5 animate-spin text-[var(--primary)]" />
        )}
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Ready to collect</h2>
            <p className="text-sm text-[var(--muted)]">
              Uncollected trading fees from your launches. Collect sends them to this wallet.
            </p>
          </div>
          <button
            type="button"
            onClick={claim}
            disabled={claiming || !canCollect}
            className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] disabled:opacity-50"
          >
            {claiming ? "Collecting…" : "Collect"}
          </button>
        </div>
        <ul className="mt-4 space-y-2">
          {pending.length > 0 ? (
            pending.map((row) => (
              <li key={row.token} className="flex items-center justify-between text-sm">
                <span>{row.symbol}</span>
                <span className="text-[var(--primary)]">{formatTokenAmount(row.amount)}</span>
              </li>
            ))
          ) : (
            <li className="text-sm text-[var(--muted)]">
              {canCollect
                ? "New trading fees are ready — collect to pull them in."
                : held.length > 0
                  ? "Nothing new to collect. Balances above are already yours."
                  : "No fees yet. They land here after people trade your coins."}
            </li>
          )}
        </ul>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="text-lg font-semibold">Your launches</h2>
        <ul className="mt-4 space-y-3">
          {launches.length === 0 ? (
            <li className="text-sm text-[var(--muted)]">
              No tokens yet. Text iStonk and say launch pizza coin.
            </li>
          ) : (
            launches.map((row) => (
              <li key={`${row.tokenAddress}-${row.txHash}`} className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-semibold">
                    ${row.tokenSymbol ?? "TOKEN"}
                    {row.pairSymbol ? (
                      <span className="ml-2 font-normal text-[var(--muted)]">/ {row.pairSymbol}</span>
                    ) : null}
                  </p>
                  <p className="text-[var(--muted)]">{row.tokenName}</p>
                </div>
                {row.tokenAddress ? (
                  <a
                    href={`https://thestonks.exchange/token/${row.tokenAddress}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[var(--primary)]"
                  >
                    View <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </section>

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
    </main>
  );
}

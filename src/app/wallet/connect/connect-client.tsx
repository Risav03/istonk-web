"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CDPReactProvider } from "@coinbase/cdp-react";
import {
  useCreateDelegation,
  useCurrentUser,
  useEvmSmartAccounts,
  useGetAccessToken,
  useIsSignedIn,
  useSignInWithEmail,
  useVerifyEmailOTP,
} from "@coinbase/cdp-hooks";
import { AlertCircle, CheckCircle2, Loader2, Wallet } from "lucide-react";

const DELEGATION_DAYS = 90;
const PROJECT_ID =
  process.env.NEXT_PUBLIC_CDP_PROJECT_ID ?? "213ae300-ae45-48ba-b2c0-823126466b83";

const cdpConfig = {
  projectId: PROJECT_ID,
  appName: "iStonk",
  ethereum: { createOnLogin: "smart" as const },
};

export function ConnectClient({ sessionToken }: { sessionToken: string }) {
  if (!PROJECT_ID) {
    return (
      <Shell>
        <StatusBlock icon="error" message="Wallet setup is not configured (missing project id)." />
      </Shell>
    );
  }
  return (
    <CDPReactProvider config={cdpConfig}>
      <ConnectInner sessionToken={sessionToken} />
    </CDPReactProvider>
  );
}

type Phase = "loading" | "email" | "otp" | "finishing" | "error";

function ConnectInner({ sessionToken }: { sessionToken: string }) {
  const router = useRouter();
  const { isSignedIn } = useIsSignedIn();
  const { currentUser } = useCurrentUser();
  const { evmSmartAccounts } = useEvmSmartAccounts();
  const { signInWithEmail } = useSignInWithEmail();
  const { verifyEmailOTP } = useVerifyEmailOTP();
  const { createDelegation } = useCreateDelegation();
  const { getAccessToken } = useGetAccessToken();

  const [phase, setPhase] = useState<Phase>(sessionToken ? "loading" : "error");
  const [message, setMessage] = useState(
    sessionToken ? "" : "Missing setup link. Open the latest link from iStonk.",
  );
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [flowId, setFlowId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!sessionToken) return;
    let cancelled = false;
    fetch(`/api/wallet/connect?s=${encodeURIComponent(sessionToken)}`, {
      cache: "no-store",
      headers: { accept: "application/json" },
    })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error || "Could not load setup.");
      })
      .then(() => {
        if (!cancelled) setPhase((p) => (p === "loading" ? "email" : p));
      })
      .catch((err) => {
        if (!cancelled) {
          setPhase("error");
          setMessage(err instanceof Error ? err.message : String(err));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [sessionToken]);

  const smartAddress = ((): string | undefined => {
    const smart = evmSmartAccounts?.[0] as unknown;
    if (typeof smart === "string") return smart;
    if (smart && typeof smart === "object" && "address" in smart) {
      return (smart as { address?: string }).address;
    }
    return undefined;
  })();

  const finishingRef = useRef(false);

  const finish = useCallback(async () => {
    if (!smartAddress) return;
    if (finishingRef.current) return;
    finishingRef.current = true;
    try {
      const raw = (await getAccessToken()) as unknown;
      const accessToken =
        typeof raw === "string" ? raw : (raw as { accessToken?: string })?.accessToken;
      if (!accessToken) throw new Error("Couldn't read your iStonk session.");

      const requestedExpiresAt = new Date(
        Date.now() + DELEGATION_DAYS * 24 * 60 * 60 * 1000,
      ).toISOString();
      let delegationId: string | undefined;
      let delegationExpiresAt = requestedExpiresAt;
      try {
        const delegation = await createDelegation({ expiresAt: requestedExpiresAt });
        delegationId = (delegation as { delegationId?: string })?.delegationId;
        delegationExpiresAt =
          (delegation as { expiresAt?: string })?.expiresAt ?? requestedExpiresAt;
      } catch (err) {
        const text = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
        if (!text.includes("active delegation already exists")) throw err;
      }

      const res = await fetch("/api/wallet/connect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionToken,
          accessToken,
          delegationId,
          expiresAt: delegationExpiresAt,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Could not finish setup.");
      router.replace("/");
    } catch (err) {
      finishingRef.current = false;
      setPhase("error");
      setMessage(err instanceof Error ? err.message : "Could not finish setup.");
    }
  }, [createDelegation, getAccessToken, smartAddress, sessionToken, router]);

  useEffect(() => {
    if (phase === "email" && isSignedIn) setPhase("finishing");
  }, [phase, isSignedIn]);

  useEffect(() => {
    if (phase === "finishing" && isSignedIn && smartAddress) {
      void finish();
    }
  }, [phase, isSignedIn, smartAddress, finish]);

  useEffect(() => {
    if (phase !== "finishing") return;
    const t = setTimeout(() => {
      if (!finishingRef.current) {
        setPhase("error");
        setMessage("Your wallet is taking longer than expected. Tap the link again to retry.");
      }
    }, 45_000);
    return () => clearTimeout(t);
  }, [phase]);

  async function submitEmail() {
    if (!email) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await signInWithEmail({ email });
      setFlowId(result.flowId);
      setPhase("otp");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Couldn't send the code.");
    } finally {
      setBusy(false);
    }
  }

  async function submitOtp() {
    if (!flowId || !otp) return;
    setBusy(true);
    setMessage("");
    try {
      await verifyEmailOTP({ flowId, otp });
      setPhase("finishing");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "That code didn't work — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      {phase === "loading" ? (
        <StatusBlock icon="spin" message="Loading…" />
      ) : phase === "error" ? (
        <StatusBlock icon="error" message={message} />
      ) : phase === "finishing" ? (
        <StatusBlock icon="spin" message="Setting up your iStonk wallet…" />
      ) : phase === "otp" ? (
        <div className="w-full max-w-sm">
          <p className="mb-3 text-sm text-[var(--muted)]">Enter the 6-digit code we emailed you.</p>
          <input
            inputMode="numeric"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))}
            placeholder="123456"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-center text-lg tracking-widest"
          />
          {message ? <p className="mt-2 text-sm text-[var(--danger)]">{message}</p> : null}
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
      ) : (
        <div className="w-full max-w-sm">
          <p className="mb-3 text-sm text-[var(--muted)]">
            Sign in with your email — no wallet apps, no seed phrases.
          </p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3"
          />
          {message ? <p className="mt-2 text-sm text-[var(--danger)]">{message}</p> : null}
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
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="mx-auto flex min-h-[100dvh] max-w-xl flex-col items-center justify-center gap-6 px-4 py-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--primary)]/30 bg-[var(--primary)]/10 text-[var(--primary)]">
        <Wallet className="h-7 w-7" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Set up your iStonk wallet</h1>
      {children}
    </section>
  );
}

function StatusBlock({
  icon,
  message,
}: {
  icon: "spin" | "ok" | "error";
  message: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      {icon === "spin" ? (
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      ) : icon === "ok" ? (
        <CheckCircle2 className="h-10 w-10 text-[var(--primary)]" />
      ) : (
        <AlertCircle className="h-10 w-10 text-[var(--danger)]" />
      )}
      <p className="max-w-sm text-sm text-[var(--muted)]">{message}</p>
    </div>
  );
}

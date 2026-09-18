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

import { ConnectHint } from "@/components/connect-hint";
import { Button, Chip, Input, OtpField, Wordmark } from "@/components/ds";
import { cdpSignInError } from "@/lib/cdp-errors";

const DELEGATION_DAYS = 90;
const PROJECT_ID =
  process.env.NEXT_PUBLIC_CDP_PROJECT_ID ?? "eaa74d0f-2a2d-470b-8a13-51aba1bf5e7b";

const cdpConfig = {
  projectId: PROJECT_ID,
  appName: "iStonk",
  ethereum: { createOnLogin: "smart" as const },
};

export function ConnectClient({ sessionToken }: { sessionToken: string }) {
  if (!PROJECT_ID) {
    return (
      <Shell>
        <StatusBlock
          tone="error"
          title="Setup is not configured"
          message="Account setup is missing its project id."
        />
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
        if (!res.ok) throw new Error(body?.error || body?.detail || "Could not load setup.");
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
      if (!res.ok) throw new Error(body?.error || body?.detail || "Could not finish setup.");
      router.replace("/app");
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
        setMessage("Your account is taking longer than expected. Tap the link again to retry.");
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
      setMessage(cdpSignInError(err));
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
      setMessage(err instanceof Error ? err.message : "That code didn't work. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      {phase === "loading" ? (
        <StatusBlock tone="wait" title="Opening your setup link" message="One moment." />
      ) : phase === "finishing" ? (
        <StatusBlock
          tone="wait"
          title="Setting up your account"
          message="Creating your smart account on Base and authorizing iStonk to sign for it. This takes a few seconds."
        />
      ) : phase === "error" ? (
        <StatusBlock tone="error" title="That didn't work" message={message} />
      ) : phase === "otp" ? (
        <>
          <div>
            <h2 className="type-h1 font-text-face">Check your email</h2>
            <p
              className="mt-2"
              style={{ font: "var(--type-body-sm)", color: "var(--text-secondary)" }}
            >
              Six digits, sent to{" "}
              <span style={{ color: "var(--text-primary)" }}>{email || "your email"}</span>.
            </p>
          </div>
          <OtpField value={otp} onChange={setOtp} autoFocus disabled={busy} />
          {message ? <ErrorLine>{message}</ErrorLine> : null}
          <Button
            size="lg"
            shape="square"
            busy={busy}
            disabled={otp.length < 6}
            onClick={submitOtp}
          >
            Open your account
          </Button>
          <button
            type="button"
            onClick={() => {
              setPhase("email");
              setOtp("");
              setMessage("");
            }}
            className="cursor-pointer border-0 bg-transparent text-left"
            style={{ font: "var(--type-body-sm)", color: "var(--text-secondary)" }}
          >
            Use a different email
          </button>
        </>
      ) : (
        <>
          <div>
            <h2 className="type-h1 font-text-face">Set up your account</h2>
            <p
              className="mt-2"
              style={{ font: "var(--type-body-sm)", color: "var(--text-secondary)" }}
            >
              Use the email iStonk texted you about. We will send a one-time code.
            </p>
          </div>
          <Input
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && email && !busy) void submitEmail();
            }}
          />
          {message ? <ErrorLine>{message}</ErrorLine> : null}
          <Button size="lg" shape="square" busy={busy} disabled={!email} onClick={submitEmail}>
            Send code
          </Button>
          <ConnectHint />
        </>
      )}
    </Shell>
  );
}

function ErrorLine({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ font: "var(--type-body-sm)", color: "var(--down)" }}>{children}</p>
  );
}

/**
 * Poster on the left, form on the right. The left panel is the only place this
 * page argues; the right panel just takes an email and a code.
 */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="grid min-h-[100dvh] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px]"
      style={{ background: "var(--mat-paper)" }}
    >
      <div className="relative flex flex-col justify-between gap-12 border-b border-rule px-[var(--gutter-mobile)] py-10 md:px-14 md:py-14 lg:border-r lg:border-b-0">
        <span aria-hidden className="istonk-grain pointer-events-none absolute inset-0" />
        <Wordmark size={22} markSize={52} priority />
        <div className="relative">
          <h1 className="type-d2 max-w-[460px]">
            No app.
            <br />
            No seed phrase.
          </h1>
          <p
            className="mt-5 max-w-[430px]"
            style={{ font: "var(--type-body-lg)", color: "var(--text-secondary)" }}
          >
            One email code opens your iStonk account. It signs your launches and holds
            your creator fees for about 90 days before it asks again.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Chip mono tone="paper">
              connect
            </Chip>
            <Chip mono tone="paper">
              fees
            </Chip>
            <Chip mono tone="paper">
              send $25 of AAPL to Alex
            </Chip>
          </div>
        </div>
        <p
          className="relative max-w-[420px]"
          style={{ font: "var(--type-legal)", color: "var(--text-tertiary)" }}
        >
          Coinbase embedded smart account on Base. iStonk never sees a private key and
          never asks for a seed phrase.
        </p>
      </div>

      <div
        className="flex flex-col justify-center gap-5.5 px-[var(--gutter-mobile)] py-12 md:px-11 md:py-14"
        style={{ background: "var(--surface)" }}
      >
        {children}
      </div>
    </div>
  );
}

function StatusBlock({
  tone,
  title,
  message,
}: {
  tone: "wait" | "error";
  title: string;
  message: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        {tone === "wait" ? (
          <span
            className="istonk-spin inline-block"
            style={{
              width: 16,
              height: 16,
              borderRadius: "var(--r-pill)",
              border: "2px solid var(--ink)",
              borderTopColor: "transparent",
            }}
          />
        ) : (
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "var(--r-pill)",
              background: "var(--down)",
            }}
          />
        )}
        <h2 className="type-h1 font-text-face">{title}</h2>
      </div>
      <p
        className="max-w-[340px]"
        style={{
          font: "var(--type-body-sm)",
          color: tone === "error" ? "var(--down)" : "var(--text-secondary)",
        }}
      >
        {message}
      </p>
    </div>
  );
}

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

import { AuthScreen, type AuthPhase } from "@/components/auth-screen";
import { Dashboard } from "@/components/dashboard";
import { api } from "@/lib/api";
import { cdpSignInError } from "@/lib/cdp-errors";

const PROJECT_ID =
  process.env.NEXT_PUBLIC_CDP_PROJECT_ID ?? "eaa74d0f-2a2d-470b-8a13-51aba1bf5e7b";

const cdpConfig = {
  projectId: PROJECT_ID,
  appName: "iStonk",
  ethereum: { createOnLogin: "smart" as const },
};

type Phase = AuthPhase | "ready";

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
    api
      .wallet()
      .then(() => {
        if (!cancelled) setPhase("ready");
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
      await api.linkSession(accessToken);
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
      setOtp("");
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
      setMessage(err instanceof Error ? err.message : "That code didn't work. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function restart() {
    setOtp("");
    setFlowId(null);
    setMessage(null);
    setPhase("email");
  }

  async function logout() {
    await api.endSession();
    await signOut().catch(() => {});
    restart();
  }

  if (phase === "ready") return <Dashboard onLogout={logout} />;

  return (
    <AuthScreen
      phase={phase}
      email={email}
      otp={otp}
      busy={busy}
      message={message}
      onEmailChange={setEmail}
      onOtpChange={setOtp}
      onSubmitEmail={submitEmail}
      onSubmitOtp={submitOtp}
      onRestart={restart}
    />
  );
}

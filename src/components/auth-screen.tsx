"use client";

import { Loader2 } from "lucide-react";

import { Button, Logo, inputClass } from "./ui";

export type AuthPhase = "checking" | "email" | "otp" | "linking" | "error";

type Props = {
  phase: AuthPhase;
  email: string;
  otp: string;
  busy: boolean;
  message: string | null;
  onEmailChange: (value: string) => void;
  onOtpChange: (value: string) => void;
  onSubmitEmail: () => void;
  onSubmitOtp: () => void;
  onRestart: () => void;
};

export function AuthScreen(props: Props) {
  const { phase } = props;
  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-[360px] flex-col justify-center gap-8 px-5 py-12">
      <div className="flex flex-col gap-4">
        <Logo size={40} />
        {phase === "otp" ? (
          <Heading
            title="Check your email"
            body={
              <>
                We sent a 6-digit code to <span className="text-foreground">{props.email}</span>.
              </>
            }
          />
        ) : phase === "linking" || phase === "checking" ? (
          <Heading title="Opening your wallet" body="One sec." />
        ) : (
          <Heading
            title="Open your iStonk wallet"
            body="Use the email you signed up with when iStonk texted you a wallet. We will send a one-time code."
          />
        )}
      </div>

      {phase === "otp" ? (
        <OtpStep {...props} />
      ) : phase === "linking" || phase === "checking" ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      ) : (
        <EmailStep {...props} />
      )}

      {props.message ? <p className="text-sm text-danger">{props.message}</p> : null}

      {phase === "email" || phase === "error" ? (
        <p className="text-xs leading-relaxed text-faint">
          No wallet yet? Text iStonk on iMessage and say <span className="font-mono text-muted">connect</span>. It
          will send you here.
        </p>
      ) : null}
    </main>
  );
}

function Heading({ title, body }: { title: string; body: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">{title}</h1>
      <p className="text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}

function EmailStep({ email, busy, onEmailChange, onSubmitEmail }: Props) {
  return (
    <form
      className="flex flex-col gap-2.5"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmitEmail();
      }}
    >
      <input
        type="email"
        autoComplete="email"
        autoFocus
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        placeholder="you@email.com"
        className={`${inputClass} h-12 rounded-xl bg-card px-4 text-[15px]`}
      />
      <Button type="submit" className="h-12 text-sm" busy={busy} disabled={!email}>
        Send code
      </Button>
    </form>
  );
}

const OTP_LENGTH = 6;

function OtpStep({ otp, busy, onOtpChange, onSubmitOtp, onRestart }: Props) {
  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => otp[i] ?? "");
  const active = Math.min(otp.length, OTP_LENGTH - 1);
  return (
    <form
      className="flex flex-col gap-2.5"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmitOtp();
      }}
    >
      <label className="relative block">
        <span className="sr-only">6-digit code</span>
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          value={otp}
          onChange={(e) => onOtpChange(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))}
          className="absolute inset-0 z-10 w-full opacity-0"
        />
        <div className="grid grid-cols-6 gap-2" aria-hidden>
          {digits.map((d, i) => (
            <div
              key={i}
              className={`flex h-14 items-center justify-center rounded-xl border bg-card font-mono text-[22px] ${
                d || i === active ? "border-primary" : "border-border-strong text-faint"
              }`}
            >
              {d || "·"}
            </div>
          ))}
        </div>
      </label>
      <Button type="submit" className="h-12 text-sm" busy={busy} disabled={otp.length < OTP_LENGTH}>
        Verify
      </Button>
      <p className="flex gap-1.5 pt-2 text-xs text-faint">
        <span>Didn&apos;t get it?</span>
        <button type="button" onClick={onRestart} className="text-muted hover:text-foreground">
          Use a different email
        </button>
      </p>
    </form>
  );
}

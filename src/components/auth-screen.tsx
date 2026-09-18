"use client";

import { ConnectHint } from "./connect-hint";
import { Button, Input, OtpField, Wordmark } from "./ds";

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
  const waiting = phase === "linking" || phase === "checking";
  return (
    <main
      className="relative mx-auto flex min-h-[100dvh] w-full flex-col justify-center gap-7 px-[var(--gutter-mobile)] py-14"
      style={{ maxWidth: 420 }}
    >
      <span aria-hidden className="istonk-grain pointer-events-none absolute inset-0" />

      <div className="relative flex flex-col gap-6">
        <Wordmark size={20} markSize={44} priority />

        {phase === "otp" ? (
          <Heading
            title="Check your email"
            body={
              <>
                Six digits, sent to{" "}
                <span style={{ color: "var(--text-primary)" }}>{props.email}</span>.
              </>
            }
          />
        ) : waiting ? (
          <Heading title="Opening your account" body="One sec." />
        ) : (
          <Heading
            title="Open your iStonk account"
            body="Use the email iStonk texted you about. We will send a one-time code."
          />
        )}
      </div>

      <div className="relative flex flex-col gap-4">
        {phase === "otp" ? (
          <OtpStep {...props} />
        ) : waiting ? (
          <span
            className="istonk-spin inline-block"
            style={{
              width: 18,
              height: 18,
              borderRadius: "var(--r-pill)",
              border: "2px solid var(--ink)",
              borderTopColor: "transparent",
            }}
          />
        ) : (
          <EmailStep {...props} />
        )}

        {props.message ? (
          <p style={{ font: "var(--type-body-sm)", color: "var(--down)" }}>{props.message}</p>
        ) : null}

        {phase === "email" || phase === "error" ? <ConnectHint /> : null}
      </div>
    </main>
  );
}

function Heading({ title, body }: { title: string; body: React.ReactNode }) {
  return (
    <div>
      <h1 className="type-d3">{title}</h1>
      <p
        className="mt-3"
        style={{ font: "var(--type-body)", color: "var(--text-secondary)" }}
      >
        {body}
      </p>
    </div>
  );
}

function EmailStep({ email, busy, onEmailChange, onSubmitEmail }: Props) {
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmitEmail();
      }}
    >
      <Input
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoFocus
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        placeholder="you@email.com"
      />
      <Button type="submit" size="lg" shape="square" busy={busy} disabled={!email}>
        Send code
      </Button>
    </form>
  );
}

const OTP_LENGTH = 6;

function OtpStep({ otp, busy, onOtpChange, onSubmitOtp, onRestart }: Props) {
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmitOtp();
      }}
    >
      <OtpField value={otp} onChange={onOtpChange} autoFocus disabled={busy} />
      <Button
        type="submit"
        size="lg"
        shape="square"
        busy={busy}
        disabled={otp.length < OTP_LENGTH}
      >
        Open your account
      </Button>
      <button
        type="button"
        onClick={onRestart}
        className="cursor-pointer border-0 bg-transparent text-left"
        style={{ font: "var(--type-body-sm)", color: "var(--text-secondary)" }}
      >
        Use a different email
      </button>
    </form>
  );
}

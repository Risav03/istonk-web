"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";

import { api, ApiError } from "@/lib/api";
import { formatTokenAmount, isAddress, normalizeAmount, shortAddr } from "@/lib/format";

import { CompactDecimal } from "./compact-decimal";
import { Button, Card, ExternalIcon, Field, inputClass, TokenLogo } from "./ui";

export type SendAsset = {
  /** "eth" or ERC-20 contract address. */
  id: string;
  symbol: string;
  /** Human-readable available balance. */
  available: number;
  /** Original amount string from the API — used for Max so we don't float-round. */
  availableExact?: string;
  /** Pair / name, so two $iSTONKS rows are distinguishable. */
  note?: string | null;
  logoUrl?: string | null;
};

type Step = "form" | "review" | "sent";

export function SendCard({
  assets,
  onSent,
  onReauth,
}: {
  assets: SendAsset[];
  onSent: () => Promise<void>;
  onReauth: () => void;
}) {
  const [to, setTo] = useState("");
  const [assetId, setAssetId] = useState(assets[0]?.id ?? "eth");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const asset = useMemo(
    () => assets.find((a) => a.id === assetId) ?? assets[0],
    [assets, assetId],
  );
  const sendAmount = normalizeAmount(amount);
  const parsed = Number(sendAmount);
  const amountOk =
    sendAmount !== "" &&
    Number.isFinite(parsed) &&
    parsed > 0 &&
    asset &&
    parsed <= asset.available;
  const addressOk = isAddress(to);
  const canReview = addressOk && amountOk;
  const trimmedTo = to.trim();
  const toHint =
    trimmedTo.length >= 42 && !addressOk
      ? "That doesn't look like a Base address."
      : null;
  const amountHint =
    amount !== "" && !amountOk && sendAmount !== "0."
      ? asset && Number.isFinite(parsed) && parsed > asset.available
        ? `Only ${formatTokenAmount(asset.available)} ${asset.symbol} available.`
        : "Enter an amount like 0.25."
      : null;

  function reset() {
    setTo("");
    setAmount("");
    setStep("form");
    setError(null);
    setTxHash(null);
  }

  async function send() {
    if (!asset) return;
    setBusy(true);
    setError(null);
    try {
      const result = await api.transfer({
        to: to.trim(),
        token: asset.id,
        asset: asset.id,
        amount: sendAmount,
      });
      setTxHash(result.txHash);
      setStep("sent");
      await onSent();
    } catch (err) {
      if (err instanceof ApiError && err.needsReauth) onReauth();
      setError(err instanceof Error ? err.message : "Send failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="grid items-start gap-6 md:grid-cols-2">
      <div className="flex flex-col gap-2 pt-1">
        <h2 className="text-sm font-semibold">Send to another wallet</h2>
        <p className="max-w-[380px] text-[13px] leading-relaxed text-muted">
          Move ETH or any coin you hold out of your iStonk wallet to an address
          you control. Sends go on Base and gas comes out of your ETH.
        </p>
      </div>

      <Card className="gap-3.5 p-5">
        {step === "sent" && txHash ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">Sent.</p>
            <p className="text-[13px] text-muted">
              {amount} {asset?.symbol} is on its way to{" "}
              <span className="font-mono">{shortAddr(to)}</span>.
            </p>
            <div className="flex items-center justify-between">
              <a
                href={`https://basescan.org/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[13px] text-primary hover:text-primary-hover"
              >
                View on Basescan <ExternalIcon />
              </a>
              <Button variant="outline" onClick={reset}>
                Send another
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Field label="To">
              <input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="0x…"
                spellCheck={false}
                autoComplete="off"
                className={`${inputClass} font-mono text-[13px]`}
              />
            </Field>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Asset">
                <div className="relative">
                  {asset ? (
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                      <TokenLogo
                        src={asset.logoUrl}
                        symbol={asset.symbol}
                        size={20}
                      />
                    </span>
                  ) : null}
                  <select
                    value={assetId}
                    onChange={(e) => {
                      setAssetId(e.target.value);
                      setAmount("");
                    }}
                    className={`${inputClass} appearance-none pl-10 pr-9 font-medium`}
                    style={{
                      backgroundImage:
                        "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 16 16' fill='none' stroke='%238a9a8e' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'><path d='m4 6 4 4 4-4'/></svg>\")",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 14px center",
                    }}
                  >
                    {assets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.note ? `${a.symbol} · ${a.note}` : a.symbol}
                      </option>
                    ))}
                  </select>
                </div>
              </Field>
              <Field label="Amount">
                <div className="relative">
                  <input
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) =>
                      setAmount(e.target.value.replace(/[^\d.]/g, ""))
                    }
                    placeholder="0.00"
                    className={`${inputClass} pr-14 font-mono tabular`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      asset && setAmount(asset.availableExact ?? String(asset.available))
                    }
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-primary hover:text-primary-hover"
                  >
                    Max
                  </button>
                </div>
              </Field>
            </div>
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-xs text-faint">
                Available{" "}
                <span className="inline-flex items-baseline gap-1 font-mono text-muted">
                  {asset ? (
                    <>
                      <CompactDecimal
                        as={asset.id === "eth" ? "eth" : "token"}
                        value={asset.available}
                      />
                      {asset.symbol}
                    </>
                  ) : (
                    "…"
                  )}
                </span>
              </span>
              <Button onClick={() => setStep("review")} disabled={!canReview}>
                Review send
              </Button>
            </div>
            {toHint ? <p className="text-[13px] text-danger">{toHint}</p> : null}
            {amountHint ? (
              <p className="text-[13px] text-danger">{amountHint}</p>
            ) : null}
            {error ? <p className="text-[13px] text-danger">{error}</p> : null}
          </>
        )}
      </Card>

      {step === "review" && asset ? (
        <ReviewDialog
          to={to.trim()}
          amount={sendAmount}
          symbol={asset.symbol}
          remaining={asset.available - parsed}
          busy={busy}
          error={error}
          onCancel={() => {
            setStep("form");
            setError(null);
          }}
          onConfirm={send}
        />
      ) : null}
    </section>
  );
}

function ReviewDialog({
  to,
  amount,
  symbol,
  remaining,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  to: string;
  amount: string;
  symbol: string;
  remaining: number;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal
      aria-label="Review send"
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm p-4 sm:items-center"
      onClick={busy ? undefined : onCancel}
    >
      <Card
        className="w-full max-w-[420px] rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-[18px]">
          <span className="text-[15px] font-semibold">Review send</span>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="text-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>
        <div className="flex flex-col items-center gap-1.5 px-5 pb-7 pt-3">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[40px] font-medium leading-none tracking-[-0.03em] tabular">
              {amount}
            </span>
            <span className="text-base text-muted">{symbol}</span>
          </div>
          <span className="text-[13px] text-muted">
            from your iStonk wallet
          </span>
        </div>
        <dl className="flex flex-col border-t border-hairline">
          <ReviewRow label="To">
            <span className="max-w-[240px] break-all text-right font-mono text-xs">
              {to}
            </span>
          </ReviewRow>
          <ReviewRow label="Network">Base</ReviewRow>
          <ReviewRow label="Gas">paid from your ETH</ReviewRow>
          <ReviewRow label="Left after send" last>
            <span className="inline-flex items-baseline gap-1 font-mono tabular">
              <CompactDecimal value={Math.max(0, remaining)} />
              {symbol}
            </span>
          </ReviewRow>
        </dl>
        <div className="flex flex-col gap-2.5 border-t border-hairline bg-card-inset px-5 pb-5 pt-4">
          {error ? <p className="text-[13px] text-danger">{error}</p> : null}
          <Button className="h-12 text-sm" busy={busy} onClick={onConfirm}>
            Send {amount} {symbol}
          </Button>
          <p className="text-center text-xs leading-relaxed text-faint">
            Onchain sends cannot be reversed. Double-check the address.
          </p>
        </div>
      </Card>
    </div>
  );
}

function ReviewRow({
  label,
  children,
  last = false,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between px-5 py-3.5 text-[13px] ${last ? "" : "border-b border-hairline"}`}
    >
      <dt className="text-muted">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

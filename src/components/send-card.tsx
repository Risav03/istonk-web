"use client";

import { useMemo, useState } from "react";

import { api, ApiError } from "@/lib/api";
import { amountUsd, formatTokenAmount, formatUsd, isAddress, normalizeAmount, shortAddr } from "@/lib/format";

import { CompactDecimal } from "./compact-decimal";
import { Button, ExternalIcon, Figure, Panel, Receipt, TokenLogo } from "./ds";
import { Field, inputClass } from "./ui";

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
  prices = {},
  onSent,
  onReauth,
}: {
  assets: SendAsset[];
  prices?: Record<string, number>;
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
  const assetPrice = asset
    ? prices[asset.id === "eth" ? "eth" : asset.id.toLowerCase()]
    : undefined;
  const availableUsdLabel = formatUsd(asset ? amountUsd(asset.available, assetPrice) : null);
  const sendUsd = amountOk && asset ? amountUsd(parsed, assetPrice) : null;
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
      <div className="flex flex-col gap-2">
        <h2 className="type-h2 font-text-face">Send to another account</h2>
        <p
          className="max-w-[42ch]"
          style={{ font: "var(--type-body-sm)", color: "var(--text-secondary)" }}
        >
          Move ETH or any coin you hold out of your iStonk account to an address you
          control. Sends go on Base and gas comes out of your ETH.
        </p>
      </div>

      {step === "sent" && txHash ? (
        <Receipt
          kicker="Sent"
          title={`${formatTokenAmount(sendAmount)} ${asset?.symbol ?? ""}`}
          rows={[
            { label: "To", value: shortAddr(to) },
            { label: "Network", value: "Base", mono: false },
          ]}
          footer="Onchain and final. The receipt below is the proof."
        >
          <div className="mt-4 flex items-center justify-between gap-3">
            <a
              href={`https://basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 no-underline"
              style={{ font: "var(--type-label)" }}
            >
              View on Basescan <ExternalIcon />
            </a>
            <Button variant="outline" size="sm" onClick={reset}>
              Send another
            </Button>
          </div>
        </Receipt>
      ) : (
        <Panel className="flex flex-col gap-3.5 p-5">
          <Field label="To">
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="0x…"
              spellCheck={false}
              autoComplete="off"
              className={`${inputClass} type-mono`}
            />
          </Field>
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Asset">
              <div className="relative">
                {asset ? (
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
                    <TokenLogo src={asset.logoUrl} symbol={asset.symbol} size={22} />
                  </span>
                ) : null}
                <select
                  value={assetId}
                  onChange={(e) => {
                    setAssetId(e.target.value);
                    setAmount("");
                  }}
                  className={inputClass}
                  style={{ paddingLeft: 42 }}
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
                  onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="0.00"
                  className={`${inputClass} type-mono`}
                  style={{ paddingRight: 56 }}
                />
                <button
                  type="button"
                  onClick={() =>
                    asset && setAmount(asset.availableExact ?? String(asset.available))
                  }
                  className="absolute top-1/2 right-3.5 -translate-y-1/2 cursor-pointer border-0 bg-transparent p-0"
                  style={{ font: "var(--type-micro)", color: "var(--text-accent)" }}
                >
                  Max
                </button>
              </div>
            </Field>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span style={{ font: "var(--type-legal)", color: "var(--text-tertiary)" }}>
              Available{" "}
              <span className="type-mono-sm inline-flex items-baseline gap-1" style={{ color: "var(--text-secondary)" }}>
                {asset ? (
                  <>
                    <CompactDecimal
                      as={asset.id === "eth" ? "eth" : "token"}
                      value={asset.available}
                    />
                    {asset.symbol}
                    {availableUsdLabel ? <span>({availableUsdLabel})</span> : null}
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
          {toHint ? <Hint>{toHint}</Hint> : null}
          {amountHint ? <Hint>{amountHint}</Hint> : null}
          {error ? <Hint>{error}</Hint> : null}
        </Panel>
      )}

      {step === "review" && asset ? (
        <ReviewDialog
          to={to.trim()}
          amount={sendAmount}
          symbol={asset.symbol}
          sendUsd={sendUsd}
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

function Hint({ children }: { children: React.ReactNode }) {
  return <p style={{ font: "var(--type-body-sm)", color: "var(--down)" }}>{children}</p>;
}

function ReviewDialog({
  to,
  amount,
  symbol,
  sendUsd,
  remaining,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  to: string;
  amount: string;
  symbol: string;
  sendUsd: number | null;
  remaining: number;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const sendUsdLabel = formatUsd(sendUsd);
  const displayAmount = formatTokenAmount(amount);
  return (
    <div
      role="dialog"
      aria-modal
      aria-label="Review send"
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      style={{ background: "rgba(16,16,20,.42)", backdropFilter: "blur(3px)" }}
      onClick={busy ? undefined : onCancel}
    >
      <div
        className="istonk-arrive w-full max-w-[420px]"
        onClick={(e) => e.stopPropagation()}
      >
        <Receipt
          kicker="Review send"
          title={
            <span className="flex flex-col items-center gap-1.5 text-center">
              <span title={amount} className="max-w-full break-all">
                <Figure value={displayAmount} suffix={symbol} size="xl" mono />
              </span>
              {sendUsdLabel ? (
                <span className="type-mono-sm" style={{ color: "var(--text-secondary)" }}>
                  {sendUsdLabel}
                </span>
              ) : null}
              <span style={{ font: "var(--type-body-sm)", color: "var(--text-secondary)" }}>
                from your iStonk account
              </span>
            </span>
          }
          rows={[
            { label: "To", value: to },
            { label: "Network", value: "Base", mono: false },
            { label: "Gas", value: "paid from your ETH", mono: false },
            {
              label: "Left after send",
              value: (
                <span className="inline-flex items-baseline gap-1">
                  <CompactDecimal value={Math.max(0, remaining)} />
                  {symbol}
                </span>
              ),
            },
          ]}
          footer="Onchain sends cannot be reversed. Double-check the address."
          style={{ boxShadow: "var(--shadow-pop)" }}
        >
          <div className="mt-5 flex flex-col gap-2.5 border-t border-rule pt-4">
            {error ? <Hint>{error}</Hint> : null}
            <Button
              busy={busy}
              onClick={onConfirm}
              style={{
                width: "100%",
                height: "auto",
                minHeight: 52,
                padding: "12px 18px",
                whiteSpace: "normal",
                lineHeight: 1.3,
              }}
            >
              Send {displayAmount} {symbol}
            </Button>
            <Button variant="ghost" size="sm" disabled={busy} onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </Receipt>
      </div>
    </div>
  );
}

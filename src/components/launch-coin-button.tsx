"use client";

import { useEffect, useId, useState } from "react";

import { api, ApiError, type StockOffer } from "@/lib/api";
import { site } from "@/lib/site";

import { Button, Chip, Panel } from "./ds";
import { Field, inputClass } from "./ui";

type Step = "pick" | "web";

export function LaunchCoinButton({
  onLaunched,
  onReauth,
}: {
  onLaunched: () => Promise<void>;
  onReauth: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("pick");
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  function close() {
    setOpen(false);
    setStep("pick");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="istonk-press inline-flex shrink-0 cursor-pointer items-center gap-2.5 border-0 bg-transparent p-0"
      >
        <Chip tone="ink">Launch a coin</Chip>
        <span
          className="hidden sm:inline-flex"
          style={{
            padding: "6px 12px",
            background: "var(--msg-out)",
            color: "var(--msg-out-ink)",
            borderRadius: "var(--r-bubble)",
            borderBottomRightRadius: "var(--r-bubble-tail)",
            font: "var(--type-mono-sm)",
          }}
        >
          launch pizza coin vs AAPL
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 cursor-default border-0"
            style={{ background: "rgba(16,16,20,.34)", backdropFilter: "blur(2px)" }}
            onClick={close}
          />
          <Panel
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 w-full max-w-[440px] p-5 sm:p-6"
            style={{ borderRadius: "var(--r-xl)", boxShadow: "var(--shadow-pop)" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id={titleId} className="type-h1 font-text-face">
                  {step === "web" ? "Launch on the web" : "How do you want to launch?"}
                </h2>
                <p
                  className="mt-1.5"
                  style={{ font: "var(--type-body-sm)", color: "var(--text-secondary)" }}
                >
                  {step === "web"
                    ? "Name the coin and pick the stock it trades against."
                    : "Same launch, from this account or in iMessage."}
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="shrink-0 cursor-pointer border-0 bg-transparent p-0"
                style={{ font: "var(--type-micro)", color: "var(--text-secondary)" }}
              >
                Close
              </button>
            </div>

            {step === "pick" ? (
              <div className="mt-5 flex flex-col gap-2.5">
                <Choice
                  as="button"
                  onClick={() => setStep("web")}
                  title="Web"
                  body="Name it, pick a stock, launch from this account."
                />
                <Choice
                  as="a"
                  href={site.bot.launchSmsHref}
                  title="iMessage"
                  body="Text iStonk and say launch pizza coin vs Apple."
                  accent
                />
              </div>
            ) : (
              <LaunchForm
                onLaunched={async () => {
                  await onLaunched();
                  close();
                }}
                onReauth={onReauth}
                onBack={() => setStep("pick")}
              />
            )}
          </Panel>
        </div>
      ) : null}
    </>
  );
}

/** Two ways to do the same thing. The iMessage one carries the accent. */
function Choice({
  as,
  href,
  onClick,
  title,
  body,
  accent = false,
}: {
  as: "a" | "button";
  href?: string;
  onClick?: () => void;
  title: string;
  body: string;
  accent?: boolean;
}) {
  const inner = (
    <>
      <span className="flex flex-1 flex-col gap-1">
        <span style={{ font: "var(--type-h3)" }}>{title}</span>
        <span style={{ font: "var(--type-body-sm)", color: "var(--text-secondary)" }}>{body}</span>
      </span>
      <span
        aria-hidden
        style={{ font: "var(--type-h3)", color: accent ? "var(--tang)" : "var(--text-tertiary)" }}
      >
        ›
      </span>
    </>
  );
  const style = {
    display: "flex",
    alignItems: "center",
    gap: 14,
    width: "100%",
    padding: "14px 16px",
    textAlign: "left" as const,
    background: accent ? "var(--tang-50)" : "var(--bg-sunk)",
    border: `1px solid ${accent ? "var(--tang-100)" : "var(--border-hairline)"}`,
    borderRadius: "var(--r-md)",
    cursor: "pointer",
    textDecoration: "none",
    color: "var(--text-primary)",
  };
  return as === "a" ? (
    <a href={href} className="istonk-press" style={style}>
      {inner}
    </a>
  ) : (
    <button type="button" onClick={onClick} className="istonk-press" style={style}>
      {inner}
    </button>
  );
}

function LaunchForm({
  onLaunched,
  onReauth,
  onBack,
}: {
  onLaunched: () => Promise<void>;
  onReauth: () => void;
  onBack: () => void;
}) {
  const [pairs, setPairs] = useState<StockOffer[]>([]);
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [pairSymbol, setPairSymbol] = useState("AAPLc");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fundUrl, setFundUrl] = useState<string | null>(null);

  useEffect(() => {
    void api
      .launchPairs()
      .then((items) => {
        setPairs(items);
        if (items[0] && !items.some((item) => item.symbol === pairSymbol)) {
          setPairSymbol(items[0].symbol);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit() {
    setBusy(true);
    setError(null);
    setFundUrl(null);
    try {
      await api.launchCoin({
        name: name.trim(),
        symbol: symbol.trim(),
        pairSymbol,
      });
      await onLaunched();
    } catch (err) {
      if (err instanceof ApiError && err.needsReauth) onReauth();
      setError(err instanceof Error ? err.message : "Couldn't launch that coin.");
      if (err instanceof ApiError && err.fundUrl) setFundUrl(err.fundUrl);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-5 flex flex-col gap-3.5">
      <Field label="Name">
        <input
          className={inputClass}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Pizza Coin"
        />
      </Field>
      <Field label="Ticker">
        <input
          className={`${inputClass} type-mono`}
          value={symbol}
          onChange={(event) => setSymbol(event.target.value.toUpperCase())}
          placeholder="PIZZA"
        />
      </Field>
      <Field label="Pair">
        <select
          className={inputClass}
          value={pairSymbol}
          onChange={(event) => setPairSymbol(event.target.value)}
        >
          {(pairs.length > 0 ? pairs : [{ symbol: "AAPLc", name: "Apple" }]).map((item) => (
            <option key={item.symbol} value={item.symbol}>
              {item.name}
            </option>
          ))}
        </select>
      </Field>
      {error ? (
        <p style={{ font: "var(--type-body-sm)", color: "var(--down)" }}>{error}</p>
      ) : null}
      {fundUrl ? (
        <a href={fundUrl} style={{ font: "var(--type-label)" }}>
          Add ETH for gas, then try again
        </a>
      ) : null}
      <div className="mt-1 flex gap-2.5">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button busy={busy} onClick={() => void submit()} className="flex-1">
          Launch
        </Button>
      </div>
    </div>
  );
}

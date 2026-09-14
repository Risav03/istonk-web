"use client";

import { useEffect, useId, useState } from "react";
import { Globe, MessageCircle, Rocket, X } from "lucide-react";

import { api, ApiError, type StockOffer } from "@/lib/api";
import { site } from "@/lib/site";

import { Button, Field, inputClass } from "./ui";

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
        className="inline-flex items-center gap-2"
      >
        <span className="text-xs text-faint">Launch a coin</span>
        <span className="inline-flex rounded-[14px] bg-primary px-3 py-1.5 font-mono text-xs text-primary-foreground">
          launch pizza coin vs AAPL
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={close}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="glass relative z-10 w-full max-w-[440px] rounded-[28px] p-5 shadow-[0_24px_80px_-24px_rgba(20,24,48,0.45)] sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id={titleId} className="text-[20px] font-extrabold tracking-tight">
                  {step === "web" ? "Launch on the web" : "How do you want to launch?"}
                </h2>
                <p className="mt-1 text-[13.5px] leading-relaxed text-muted">
                  {step === "web"
                    ? "Name the coin and pick the stock it trades against."
                    : "Same launch, from this account or in iMessage."}
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-white/70 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {step === "pick" ? (
              <div className="mt-5 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => setStep("web")}
                  className="flex items-start gap-3 rounded-[18px] border border-border-strong bg-white/70 px-4 py-3.5 text-left transition-colors hover:border-primary-border hover:bg-white"
                >
                  <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-dim text-primary">
                    <Globe className="h-4 w-4" />
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-[15px] font-semibold tracking-tight">Web</span>
                    <span className="text-[13px] leading-relaxed text-muted">
                      Name it, pick a stock, launch from this account.
                    </span>
                  </span>
                </button>
                <a
                  href={site.bot.launchSmsHref}
                  className="flex items-start gap-3 rounded-[18px] border border-border-strong bg-white/70 px-4 py-3.5 transition-colors hover:border-primary-border hover:bg-white"
                >
                  <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-dim text-primary">
                    <MessageCircle className="h-4 w-4" />
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-[15px] font-semibold tracking-tight">iMessage</span>
                    <span className="text-[13px] leading-relaxed text-muted">
                      Text iStonk and say launch pizza coin vs Apple.
                    </span>
                  </span>
                </a>
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
          </div>
        </div>
      ) : null}
    </>
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
    <div className="mt-5 flex flex-col gap-3">
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
          className={inputClass}
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
      {error ? <p className="text-[13px] text-danger">{error}</p> : null}
      {fundUrl ? (
        <a href={fundUrl} className="text-[13px] font-medium text-primary hover:text-primary-hover">
          Add ETH for gas, then try again
        </a>
      ) : null}
      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button busy={busy} onClick={() => void submit()} className="flex-1">
          <Rocket className="h-3.5 w-3.5" />
          Launch
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";

import {
  api,
  ApiError,
  type ContactRow,
  type StockOffer,
} from "@/lib/api";

import { Button, Card, CardHeader, Field, inputClass } from "./ui";

const SEND_HINT =
  "They get an iMessage after you pay. Add an email and we also send a claim link — they sign in with that phone number within 72 hours or it returns to you.";

export function SendStockCard({
  contacts,
  onSent,
  onReauth,
}: {
  channel?: string | null;
  contacts: ContactRow[];
  onSent: () => Promise<void>;
  onReauth: () => void;
}) {
  const [stocks, setStocks] = useState<StockOffer[]>([]);
  const [contactId, setContactId] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [symbol, setSymbol] = useState("AAPLc");
  const [usd, setUsd] = useState("25");
  const [memo, setMemo] = useState("");
  const [saveContact, setSaveContact] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentLabel, setSentLabel] = useState<string | null>(null);

  useEffect(() => {
    void api
      .stocks()
      .then((items) => {
        setStocks(items);
        if (items[0] && !items.some((item) => item.symbol === symbol)) {
          setSymbol(items[0].symbol);
        }
      })
      .catch(() => {});
    // Only load the catalog once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = useMemo(
    () => contacts.find((c) => String(c.id) === contactId) ?? null,
    [contacts, contactId],
  );

  useEffect(() => {
    if (!selected) return;
    setName(selected.name);
    setPhone(selected.phone ?? "");
    setEmail(selected.email ?? "");
  }, [selected]);

  async function submit() {
    setBusy(true);
    setError(null);
    setSentLabel(null);
    try {
      const result = await api.createGift({
        channel: "imessage",
        symbol,
        usd,
        memo: memo.trim() || undefined,
        saveContact: saveContact && !selected,
        recipient: {
          name: name.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          contactId: selected?.id,
        },
      });
      if (result.status === "pay") {
        window.location.assign(result.payUrl);
        return;
      }
      setSentLabel(`Sent ${result.amountLabel}.`);
      setUsd("25");
      setMemo("");
      await onSent();
    } catch (err) {
      if (err instanceof ApiError && err.needsReauth) onReauth();
      setError(err instanceof Error ? err.message : "Couldn't start that send.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card accent className="gap-0">
      <CardHeader title="Send a stock" subtitle={SEND_HINT} />
      <div className="flex flex-col gap-4 px-5 pb-5">
        {contacts.length > 0 ? (
          <Field label="Contact">
            <select
              className={inputClass}
              value={contactId}
              onChange={(event) => {
                setContactId(event.target.value);
                if (!event.target.value) {
                  setName("");
                  setPhone("");
                  setEmail("");
                }
              }}
            >
              <option value="">Someone new</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.phone ? ` · ${c.phone}` : ""}
                  {c.email ? ` · ${c.email}` : ""}
                </option>
              ))}
            </select>
          </Field>
        ) : null}

        <Field label="Name">
          <input
            className={inputClass}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Mom"
            autoComplete="name"
          />
        </Field>

        <Field label="Phone">
          <input
            className={inputClass}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+1 555 123 4567"
            inputMode="tel"
            autoComplete="tel"
          />
        </Field>

        <Field label="Email (optional)">
          <input
            className={inputClass}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="mom@example.com"
            type="email"
            autoComplete="email"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Stock">
            <select
              className={inputClass}
              value={symbol}
              onChange={(event) => setSymbol(event.target.value)}
            >
              {(stocks.length > 0 ? stocks : [{ symbol: "AAPLc", name: "Apple" }]).map((item) => (
                <option key={item.symbol} value={item.symbol}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Amount (USD)">
            <input
              className={inputClass}
              value={usd}
              onChange={(event) => setUsd(event.target.value)}
              inputMode="decimal"
              placeholder="25"
            />
          </Field>
        </div>

        <Field label="Note (optional)">
          <input
            className={inputClass}
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            placeholder="Happy birthday"
          />
        </Field>

        {!selected ? (
          <label className="flex items-center gap-2 text-[13px] text-muted">
            <input
              type="checkbox"
              checked={saveContact}
              onChange={(event) => setSaveContact(event.target.checked)}
            />
            Save to contacts
          </label>
        ) : null}

        {error ? <p className="text-[13px] text-danger">{error}</p> : null}
        {sentLabel ? <p className="text-[13px] text-primary">{sentLabel}</p> : null}

        <Button busy={busy} onClick={() => void submit()} className="h-11 w-full">
          Continue to Apple Pay
        </Button>
      </div>
    </Card>
  );
}

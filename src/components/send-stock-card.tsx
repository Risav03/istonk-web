"use client";

import { useEffect, useMemo, useState } from "react";

import {
  api,
  ApiError,
  type ContactRow,
  type GiftChannel,
  type StockOffer,
} from "@/lib/api";
import { SEND_CHANNELS } from "@/lib/send-channels";

import { Button, Card, CardHeader, Field, inputClass } from "./ui";

const CHANNEL_HINT: Record<GiftChannel, string> = {
  imessage: "They get an iMessage from iStonk after you pay.",
  text: "We'll text their number from the web after you pay.",
  email: "We'll email them with AgentMail after you pay.",
};

export function SendStockCard({
  channel,
  contacts,
  onSent,
  onReauth,
}: {
  channel: GiftChannel | null;
  contacts: ContactRow[];
  onSent: () => Promise<void>;
  onReauth: () => void;
}) {
  const [channelId, setChannelId] = useState<GiftChannel>(channel ?? "text");
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
    if (channel) setChannelId(channel);
  }, [channel]);

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

  const needsPhone = channelId !== "email";
  const needsEmail = channelId === "email";

  async function submit() {
    setBusy(true);
    setError(null);
    setSentLabel(null);
    try {
      const result = await api.createGift({
        channel: channelId,
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
      <CardHeader
        title="Send a stock"
        subtitle={CHANNEL_HINT[channelId]}
      />
      <div className="flex flex-col gap-4 px-5 pb-5">
        <div className="grid grid-cols-3 gap-1.5 rounded-[12px] bg-chip p-1">
          {SEND_CHANNELS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setChannelId(item.id)}
              className={`h-9 rounded-[10px] text-[12.5px] font-semibold transition-colors ${
                channelId === item.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {item.title}
            </button>
          ))}
        </div>

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

        {needsPhone ? (
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
        ) : (
          <Field label="Phone (optional)">
            <input
              className={inputClass}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+1 555 123 4567"
              inputMode="tel"
              autoComplete="tel"
            />
          </Field>
        )}

        {needsEmail || Boolean(email) ? (
          <Field label={needsEmail ? "Email" : "Email (optional)"}>
            <input
              className={inputClass}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="mom@example.com"
              type="email"
              autoComplete="email"
            />
          </Field>
        ) : null}

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

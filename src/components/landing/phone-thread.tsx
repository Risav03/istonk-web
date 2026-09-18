import {
  Bubble,
  LinkPreview,
  MASCOT_AVATAR_SRC,
  OG_SRC,
  Receipt,
  Tapback,
  ThreadHeader,
} from "@/components/ds";
import { site } from "@/lib/site";

/**
 * iPhone frame, iOS Messages thread. The product, shown not described.
 *
 * iStonk never restyles Messages — grey in, blue out. The design lives in the
 * attachment, which is why every flow ends in a torn-tape receipt.
 */

export type ScriptName = "launch" | "send" | "gift" | "connect";

type Msg = {
  from: "you" | "bot";
  text?: string;
  receipt?: "launch" | "pay" | "sent" | "gift";
  preview?: "connect";
};

const SCRIPTS: Record<ScriptName, Msg[]> = {
  launch: [
    { from: "you", text: "launch fruit vs Apple stock" },
    {
      from: "bot",
      text: "fruit, $FRUIT, paired with Apple stock. send a photo or say skip",
    },
    { from: "you", text: "skip" },
    { from: "bot", text: "got it. say confirm to launch" },
    { from: "you", text: "confirm" },
    { from: "bot", text: "Deploying please wait" },
    { from: "bot", receipt: "launch" },
  ],
  send: [
    { from: "you", text: "send $25 of AAPL to Alex" },
    {
      from: "bot",
      text: "$25 of AAPL to Alex, +1 (415) 555-0123. add a note or say skip",
    },
    { from: "you", text: "happy birthday" },
    { from: "bot", receipt: "pay" },
    { from: "you", text: "APPLE PAY" },
    { from: "bot", receipt: "sent" },
  ],
  gift: [
    { from: "you", text: "buy me a $25 amazon gift card" },
    {
      from: "bot",
      text: "$25 amazon card, paid in usdc on base. where should the code go",
    },
    { from: "you", text: "me" },
    { from: "bot", receipt: "gift" },
  ],
  connect: [
    { from: "you", text: "connect" },
    {
      from: "bot",
      text: "open this to set up your account. email code, no seed phrase. takes a minute",
    },
    { from: "bot", preview: "connect" },
    {
      from: "bot",
      text: "come back here when you're done and we'll pick up where we left off",
    },
  ],
};

const RECEIPT_WIDTH = 252;

/** An iris hairline is earned: the launch is confirmed live. */
function LaunchReceipt() {
  return (
    <Receipt
      accent
      kicker="launch receipt"
      title="$FRUIT is live"
      rows={[
        { label: "pair", value: "AAPL" },
        { label: "fee recipient", value: "your account" },
        { label: "contract", value: "0x3a…c91f" },
      ]}
      footer="thestonks.exchange/token/0x3a…c91f"
      style={{ width: RECEIPT_WIDTH }}
    />
  );
}

/** One total. Never fee line items, never a bare "APPLE". */
function PayReceipt() {
  return (
    <Receipt
      kicker="apple pay · confirm"
      title="$25 of AAPL"
      rows={[
        { label: "to", value: "Alex · +1 (415) 555-0123", mono: false },
        { label: "note", value: "happy birthday", mono: false },
      ]}
      total={{ label: "total", value: "$25.00" }}
      footer="reply APPLE PAY to open checkout"
      style={{ width: RECEIPT_WIDTH }}
    />
  );
}

function SentReceipt() {
  return (
    <Receipt
      kicker="sent"
      title="Alex got $25 of AAPL"
      rows={[
        { label: "amount", value: "0.1077 AAPLc" },
        { label: "claimed", value: "instantly", mono: false },
        { label: "tx", value: "0x91b…44e2" },
      ]}
      footer="they hold it in their own iStonk account"
      style={{ width: RECEIPT_WIDTH }}
    />
  );
}

function GiftReceipt() {
  return (
    <Receipt
      kicker="gift card"
      title="Amazon · $25"
      rows={[
        { label: "paid", value: "25.00 USDC" },
        { label: "network", value: "Base", mono: false },
      ]}
      style={{ width: RECEIPT_WIDTH }}
    >
      <div
        style={{
          marginTop: 12,
          padding: "12px 14px",
          borderRadius: "var(--r-xs)",
          background: "var(--bg-sunk)",
          border: "1px dashed var(--border-strong)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <span style={{ font: "var(--type-mono)", letterSpacing: "0.12em" }}>
          •••• •••• •••• ••••
        </span>
        <span style={{ font: "var(--type-micro)", color: "var(--text-tertiary)" }}>
          TAP TO REVEAL
        </span>
      </div>
    </Receipt>
  );
}

function ConnectPreview() {
  return (
    <LinkPreview
      eyebrow="account setup"
      title="Open your iStonk account"
      domain={`${site.domain}/wallet/connect`}
      imageSrc={OG_SRC}
    />
  );
}

const RECEIPTS = {
  launch: LaunchReceipt,
  pay: PayReceipt,
  sent: SentReceipt,
  gift: GiftReceipt,
} as const;

/** Commands the user types are shown in mono. */
const TYPED = new Set(["connect", "confirm", "skip", "me", "APPLE PAY"]);

function Thread({
  script = "launch",
  night = false,
  showTapback = false,
}: {
  script?: ScriptName;
  night?: boolean;
  showTapback?: boolean;
}) {
  const msgs = SCRIPTS[script] ?? SCRIPTS.launch;
  return (
    <div className="flex flex-col gap-1 px-3 pt-2.5 pb-2">
      <div
        style={{
          textAlign: "center",
          font: "var(--type-mono-sm)",
          color: night ? "var(--night-slate)" : "#8a8a90",
          padding: "4px 0 10px",
        }}
      >
        iMessage · Today 9:41 AM
      </div>
      {msgs.map((m, i) => {
        if (m.receipt) {
          const R = RECEIPTS[m.receipt];
          return (
            <div key={i} className="relative my-1 mb-2.5 self-start">
              <R />
              {showTapback && m.receipt === "launch" ? (
                <Tapback
                  kind="heart"
                  style={{ position: "absolute", top: -13, right: 16 }}
                />
              ) : null}
            </div>
          );
        }
        if (m.preview) {
          return (
            <div key={i} className="my-1 mb-2">
              <ConnectPreview />
            </div>
          );
        }
        return (
          <Bubble key={i} from={m.from} night={night} mono={TYPED.has(m.text ?? "")}>
            {m.text}
          </Bubble>
        );
      })}
    </div>
  );
}

/**
 * The frame is drawn at a fixed 360×736 and scaled, so the thread reads exactly
 * as designed at any container width instead of reflowing. Callers set the scale
 * per breakpoint with `[--phone-scale:0.8]`.
 */
export function PhoneThread({
  script = "launch",
  night = false,
  showTapback = true,
  className,
}: {
  script?: ScriptName;
  night?: boolean;
  showTapback?: boolean;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{ width: "calc(360px * var(--phone-scale, 1))", flexShrink: 0 }}
    >
      <div
        style={{
          position: "relative",
          width: 360,
          height: 736,
          transform: "scale(var(--phone-scale, 1))",
          transformOrigin: "top left",
          marginBottom: "calc((var(--phone-scale, 1) - 1) * 736px)",
          borderRadius: 52,
          padding: 11,
          background:
            "linear-gradient(150deg,#d8d4c9,#8d8a82 40%,#e6e3da 62%,#a3a09a)",
          boxShadow: "var(--shadow-raised)",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            borderRadius: 42,
            overflow: "hidden",
            background: night ? "var(--night)" : "#fff",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 9,
              left: "50%",
              transform: "translateX(-50%)",
              width: 92,
              height: 26,
              borderRadius: 999,
              background: night ? "#000" : "#0a0a0c",
              zIndex: 5,
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 24px 2px",
              font: "600 12.5px/1 var(--font-text)",
              color: night ? "var(--night-ink)" : "#000",
              zIndex: 4,
            }}
          >
            <span style={{ fontVariantNumeric: "tabular-nums" }}>9:41</span>
            <span
              style={{
                display: "inline-flex",
                gap: 4,
                alignItems: "center",
                fontSize: 11,
              }}
            >
              <span>▮▮▮</span>
            </span>
          </div>
          <ThreadHeader
            name="iStonk"
            avatarSrc={MASCOT_AVATAR_SRC}
            subtitle={site.bot.phonePretty}
            night={night}
          />
          <div
            style={{
              flex: 1,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              background: night ? "var(--night)" : "#fff",
            }}
          >
            <Thread script={script} night={night} showTapback={showTapback} />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px 16px",
              borderTop: night
                ? "0.5px solid var(--night-rule)"
                : "0.5px solid rgba(0,0,0,.1)",
              background: night ? "rgba(20,20,24,.9)" : "rgba(246,246,246,.9)",
            }}
          >
            <span
              style={{
                width: 30,
                height: 30,
                borderRadius: 999,
                background: night ? "#2a2a32" : "#e4e4e8",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: night ? "var(--night-slate)" : "#6b6b73",
                font: "500 17px/1 var(--font-text)",
              }}
            >
              +
            </span>
            <span
              style={{
                flex: 1,
                height: 34,
                borderRadius: 999,
                border: night
                  ? "1px solid var(--night-rule)"
                  : "1px solid rgba(0,0,0,.12)",
                display: "flex",
                alignItems: "center",
                padding: "0 12px",
                font: "400 15px/1 var(--font-text)",
                color: night ? "var(--night-slate)" : "#8a8a90",
              }}
            >
              iMessage
            </span>
            <span
              style={{
                width: 30,
                height: 30,
                borderRadius: 999,
                background: "var(--msg-out)",
                color: "#fff",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                font: "600 15px/1 var(--font-text)",
              }}
            >
              ↑
            </span>
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 7,
              left: "50%",
              transform: "translateX(-50%)",
              width: 128,
              height: 5,
              borderRadius: 999,
              background: night ? "rgba(255,255,255,.4)" : "rgba(0,0,0,.35)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

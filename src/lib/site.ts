/**
 * Public-facing links used by the landing page.
 * Socials are read from NEXT_PUBLIC_* so they can be set per deploy without a code change.
 */

const BOT_PHONE_E164 = process.env.NEXT_PUBLIC_BOT_PHONE ?? "+16287895375";

function prettyPhone(e164: string): string {
  const m = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(e164);
  return m ? `+1 (${m[1]}) ${m[2]}-${m[3]}` : e164;
}

export const site = {
  name: "iStonks",
  domain: "istonks.meme",
  tagline: "Launch a coin from iMessage.",
  description:
    "Text iStonk a name, a ticker, a photo and a stock to pair it with. It goes live on Stonks Exchange on Base, and creator fees land in your wallet.",
  bot: {
    phoneE164: BOT_PHONE_E164,
    phonePretty: prettyPhone(BOT_PHONE_E164),
    /** Opens Messages with the bot prefilled. Body is a suggested first message. */
    smsHref: `sms:${BOT_PHONE_E164}&body=${encodeURIComponent("launch")}`,
  },
  links: {
    app: "/app",
    stonks: "https://thestonks.exchange",
    x: process.env.NEXT_PUBLIC_SOCIAL_X ?? "https://x.com/istonks",
    telegram: process.env.NEXT_PUBLIC_SOCIAL_TELEGRAM ?? "https://t.me/istonks",
  },
} as const;

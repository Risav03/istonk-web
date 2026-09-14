/**
 * Public-facing copy, links, and metadata used by the site.
 * Socials are read from NEXT_PUBLIC_* so they can be set per deploy without a code change.
 */

const BOT_PHONE_E164 = process.env.NEXT_PUBLIC_BOT_PHONE ?? "+16287895375";
const X_URL = process.env.NEXT_PUBLIC_SOCIAL_X ?? "https://x.com/iStonksbase";

function prettyPhone(e164: string): string {
  const m = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(e164);
  return m ? `+1 (${m[1]}) ${m[2]}-${m[3]}` : e164;
}

function twitterHandleFromUrl(url: string): string {
  const match = /(?:x\.com|twitter\.com)\/([^/?#]+)/i.exec(url);
  return match ? `@${match[1]}` : "@iStonksbase";
}

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://istonks.meme").replace(/\/$/, "");

export const site = {
  name: "iStonks",
  domain: "istonks.meme",
  url: siteUrl,
  tagline: "Send Stocks to Anyone, Anywhere in the World",
  description:
    "Send a stock by iMessage, text, or email. Pay with Apple Pay on the web. They claim it.",
  keywords: [
    "iStonks",
    "iStonk",
    "iMessage",
    "Apple Pay",
    "send stock",
    "text a stock",
    "email a stock",
    "AAPL",
    "TSLA",
  ],
  twitter: twitterHandleFromUrl(X_URL),
  bot: {
    phoneE164: BOT_PHONE_E164,
    phonePretty: prettyPhone(BOT_PHONE_E164),
    /** Opens Messages with a send started. */
    smsHref: `sms:${BOT_PHONE_E164}&body=${encodeURIComponent("send $25 of AAPL")}`,
    /** Opens Messages with a launch started. */
    launchSmsHref: `sms:${BOT_PHONE_E164}&body=${encodeURIComponent("launch pizza coin vs AAPL")}`,
    /** Opens Messages prefilled with `connect` — links this phone to the account. */
    connectSmsHref: `sms:${BOT_PHONE_E164}&body=${encodeURIComponent("connect")}`,
  },
  links: {
    app: "/app",
    dashboard: "/dashboard",
    stonks: "https://thestonks.exchange",
    x: X_URL,
    telegram: process.env.NEXT_PUBLIC_SOCIAL_TELEGRAM ?? "https://t.me/istonksxbasemate",
  },
} as const;

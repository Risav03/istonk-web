import type { GiftChannel } from "@/lib/api";

export const SEND_CHANNELS: {
  id: GiftChannel;
  title: string;
  body: string;
  href: string;
}[] = [
  {
    id: "imessage",
    title: "iMessage",
    body: "Pay with Apple Pay. They get an iMessage from iStonk.",
    href: "/app?send=imessage",
  },
  {
    id: "text",
    title: "Text",
    body: "Pay with Apple Pay. We'll text their number from the web.",
    href: "/app?send=text",
  },
  {
    id: "email",
    title: "Email",
    body: "Pay with Apple Pay. We'll email them with AgentMail.",
    href: "/app?send=email",
  },
];

export function parseSendChannel(value: string | null | undefined): GiftChannel | null {
  if (value === "imessage" || value === "text" || value === "email") return value;
  return null;
}

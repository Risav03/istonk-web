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
    id: "email",
    title: "Email",
    body: "Pay with Apple Pay. We'll email them with AgentMail.",
    href: "/app?send=email",
  },
];

export function parseSendChannel(value: string | null | undefined): GiftChannel | null {
  if (value === "email") return "email";
  if (value === "imessage" || value === "text") return "imessage";
  return null;
}

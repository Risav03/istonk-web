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
    body: "Pay with Apple Pay. They get an iMessage. Optional email includes a claim link — they sign in with that phone within 72 hours.",
    href: "/app?send=imessage",
  },
];

export function parseSendChannel(value: string | null | undefined): GiftChannel | null {
  // Email-only web send is gone — treat legacy ?send=email as iMessage.
  if (value === "email" || value === "imessage" || value === "text") return "imessage";
  return null;
}

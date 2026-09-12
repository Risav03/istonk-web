import type { Metadata } from "next";

import { getAppSession } from "@/lib/app-session";

import { AppClient } from "./app-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Wallet",
  description: "Balances, holdings, claimable creator fees and launches for your iStonk wallet.",
};

export default async function WalletAppPage() {
  const session = await getAppSession();
  return <AppClient initialHasSession={Boolean(session)} />;
}

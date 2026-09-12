import { getAppSession } from "@/lib/app-session";
import { pageMetadata } from "@/lib/metadata";

import { AppClient } from "./app-client";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Wallet",
  description: "Balances, holdings, claimable creator fees and launches for your iStonk wallet.",
  path: "/app",
  index: false,
});

export default async function WalletAppPage() {
  const session = await getAppSession();
  return <AppClient initialHasSession={Boolean(session)} />;
}

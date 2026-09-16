import { redirect } from "next/navigation";

import { getAppSession } from "@/lib/app-session";
import { pageMetadata } from "@/lib/metadata";

import { AppClient } from "./app-client";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Account",
  description: "Balances, holdings, claimable creator fees and launches for your iStonk account.",
  path: "/app",
  index: false,
});

const SETUP_TOKEN_RE = /^[a-f0-9]{32}$/i;

type PageProps = {
  searchParams: Promise<{ s?: string | string[] }>;
};

export default async function WalletAppPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const raw = Array.isArray(params.s) ? params.s[0] : params.s;
  const token = raw?.trim() ?? "";
  if (SETUP_TOKEN_RE.test(token)) {
    redirect(`/wallet/connect?s=${encodeURIComponent(token)}`);
  }

  const session = await getAppSession();
  return <AppClient initialHasSession={Boolean(session)} />;
}

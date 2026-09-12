import { pageMetadata } from "@/lib/metadata";

import { ConnectClient } from "./connect-client";

export const metadata = pageMetadata({
  title: "Set up your wallet",
  description: "Sign in with email to create your iStonk wallet — no seed phrases.",
  path: "/wallet/connect",
  index: false,
});

type PageProps = {
  searchParams: Promise<{ s?: string | string[] }>;
};

export default async function WalletConnectPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sessionToken = Array.isArray(params.s) ? params.s[0] ?? "" : params.s ?? "";
  return <ConnectClient sessionToken={sessionToken} />;
}

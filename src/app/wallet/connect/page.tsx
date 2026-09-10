import type { Metadata } from "next";

import { ConnectClient } from "./connect-client";

export const metadata: Metadata = {
  title: "Set up your iStonk wallet",
  description: "Sign in with email to create your iStonk wallet — no seed phrases.",
};

type PageProps = {
  searchParams: Promise<{ s?: string | string[] }>;
};

export default async function WalletConnectPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sessionToken = Array.isArray(params.s) ? params.s[0] ?? "" : params.s ?? "";
  return <ConnectClient sessionToken={sessionToken} />;
}

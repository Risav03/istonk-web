/** Client-safe launch types + helpers. Server fetchers live in `launch-stats.ts`. */

/** Mirrors `PublicLaunch` from the iStonk API (`GET /api/agent/istonks/launches`). */
export interface PublicLaunch {
  id: number;
  tokenAddress: string | null;
  tokenSymbol: string | null;
  tokenName: string | null;
  pairSymbol: string | null;
  pairAddress: string | null;
  txHash: string | null;
  launcher: string;
  tokenUrl: string | null;
  explorerUrl: string | null;
  createdAt: string | null;
}

/** The API caps `limit` at 200. */
export const LAUNCH_FEED_LIMIT = 200;

export function stonksTokenUrl(address: string): string {
  return `https://thestonks.exchange/token/${address}`;
}

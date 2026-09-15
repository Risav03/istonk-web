export type AirdropRow = {
  file: string;
  rank: number;
  wallet: string;
  aaplRaw: bigint;
  aapl: number;
  txHash: string;
};

export type BuyBurnDrop = {
  file: string;
  tokenAddress: string;
  tokenOut: number;
  tokenDecimals: number;
  swapTxHash: string;
  burnTxHash: string;
};

export type TokenBurnDrop = {
  file: string;
  tokenAddress: string;
  amount: number;
  tokenDecimals: number;
  burnTxHash: string;
};

export type AirdropDrop = {
  file: string;
  totalAapl: number;
  recipientCount: number;
  totalBurned: number;
  burnTokenAddress: string | null;
  swapTxHash: string | null;
  burnTxHash: string | null;
};

export type AirdropSnapshot = {
  totalAapl: number;
  recipientCount: number;
  dropCount: number;
  latestFile: string | null;
  latest: AirdropRow[];
  drops: AirdropDrop[];
  totalBurned: number;
  burnTokenAddress: string | null;
  latestBuyBurn: BuyBurnDrop | null;
  totalTokenBurned: number;
  sourceTokenAddress: string | null;
  latestTokenBurn: TokenBurnDrop | null;
  tokenBurns: TokenBurnDrop[];
  feeBurns: BuyBurnDrop[];
};

export function formatAaplAmount(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "0";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  });
}

export function formatBurnAmount(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return value.toLocaleString("en-US", {
      notation: "compact",
      maximumFractionDigits: 2,
    });
  }
  return value.toLocaleString("en-US", {
    maximumFractionDigits: abs >= 1 ? 2 : 6,
  });
}

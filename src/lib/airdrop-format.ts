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

const DROP_FILE_SUFFIX = /\.(csv|buyburn\.json|tokenburn\.json)$/i;

/** Instant encoded in a drop filename (`2026-09-15.csv` or `20260915-060000.tokenburn.json`). */
export function parseDropInstant(file: string): Date | null {
  const stem = file.replace(DROP_FILE_SUFFIX, "").replace(/^.*[/\\]/, "");
  let y = "";
  let mo = "";
  let d = "";
  let hh = "00";
  let mm = "00";
  let ss = "00";
  const dashed = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(stem);
  const compact = /^(\d{4})(\d{2})(\d{2})(?:-(\d{2})(\d{2})(\d{2}))?/.exec(stem);
  if (dashed) {
    [, y, mo, d, hh = "00", mm = "00", ss = "00"] = dashed;
  } else if (compact) {
    [, y, mo, d, hh = "00", mm = "00", ss = "00"] = compact;
  } else {
    return null;
  }
  const date = new Date(`${y}-${mo}-${d}T${hh}:${mm}:${ss}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDropStamp(
  file: string,
  opts?: { withYear?: boolean; withTime?: boolean },
): string {
  const date = parseDropInstant(file);
  if (!date) return file.replace(DROP_FILE_SUFFIX, "");
  const datePart = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(opts?.withYear ? { year: "numeric" as const } : {}),
    timeZone: "UTC",
  });
  if (!opts?.withTime) return datePart;
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
  return `${datePart} ${timePart} UTC`;
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

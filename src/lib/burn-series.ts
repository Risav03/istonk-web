import type { BuyBurnDrop, TokenBurnDrop } from "@/lib/airdrop-format";

/** ISTONKS on Base — source-token burns always classify here. */
export const ISTONKS_TOKEN = "0xcb2baff7177c8966a8b059b3df3e9323dc2ee267";
export const BASEMATE_TOKEN = "0x07e61d8a4e197dfc269e90d7ece1df0d26702ba3";
export const FEE_ACCOUNT = "0xa56a71986f6e27d50a15b4bab65d63aa870db93a";
export const DEAD_ADDRESS = "0x000000000000000000000000000000000000dead";

export type DailyPoint = { file: string; value: number };
export type DailyBar = { key: string; label: string; hint: string; value: number };

export function fileDay(file: string): string | null {
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(file);
  return m?.[1] ?? null;
}

/** One bar per UTC day so hourly burns do not fight each other on the axis. */
export function dailyAmountSeries(points: DailyPoint[], days = 14, now = new Date()): DailyBar[] {
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const sums = new Map<string, { value: number; count: number }>();
  for (const point of points) {
    const day = fileDay(point.file);
    if (!day || !Number.isFinite(point.value)) continue;
    const cur = sums.get(day) ?? { value: 0, count: 0 };
    cur.value += point.value;
    cur.count += 1;
    sums.set(day, cur);
  }
  const out: DailyBar[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(end - i * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    const row = sums.get(key);
    out.push({
      key,
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
      hint: `${d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      })} · ${row?.count ?? 0} burn${(row?.count ?? 0) === 1 ? "" : "s"}`,
      value: Number((row?.value ?? 0).toFixed(4)),
    });
  }
  return out;
}

/** ISTONKS buy/burns belong on the source-token chart, not mixed into BASEMATE. */
export function splitBurnsByToken(
  buyburns: BuyBurnDrop[],
  tokenBurns: TokenBurnDrop[],
): { buyburns: BuyBurnDrop[]; tokenBurns: TokenBurnDrop[] } {
  const extraToken: TokenBurnDrop[] = [];
  const fee: BuyBurnDrop[] = [];
  for (const burn of buyburns) {
    if (burn.tokenAddress === ISTONKS_TOKEN) {
      extraToken.push({
        file: burn.file.replace(/buyburn\.json$/i, "tokenburn.json"),
        tokenAddress: burn.tokenAddress,
        amount: burn.tokenOut,
        tokenDecimals: burn.tokenDecimals,
        burnTxHash: burn.burnTxHash,
      });
    } else {
      fee.push(burn);
    }
  }
  return { buyburns: fee, tokenBurns: [...tokenBurns, ...extraToken] };
}

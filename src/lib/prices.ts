import { isAddress } from "@/lib/format";

export const ETH_PRICE_ID = "eth";

const WETH_BASE = "0x4200000000000000000000000000000000000006";
const USDC_BASE = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const DEX_BATCH = 30;
const FETCH_MS = 8_000;

type DexPair = {
  baseToken?: { address?: string };
  quoteToken?: { address?: string };
  priceUsd?: string | null;
  priceNative?: string | null;
  liquidity?: { usd?: number | null } | null;
};

export function normalizePriceId(id: string): string {
  const trimmed = id.trim().toLowerCase();
  if (trimmed === "eth" || trimmed === "ethereum") return ETH_PRICE_ID;
  return trimmed;
}

export function isPriceId(id: string): boolean {
  return id === ETH_PRICE_ID || isAddress(id);
}

function liquidityUsd(pair: DexPair): number {
  return pair.liquidity?.usd ?? 0;
}

function priceFromPair(pair: DexPair, address: string): number | null {
  const lower = address.toLowerCase();
  const base = pair.baseToken?.address?.toLowerCase();
  const quote = pair.quoteToken?.address?.toLowerCase();
  const priceUsd = pair.priceUsd ? Number(pair.priceUsd) : NaN;
  if (!Number.isFinite(priceUsd) || priceUsd <= 0) return null;

  if (base === lower) return priceUsd;
  if (quote === lower) {
    const native = pair.priceNative ? Number(pair.priceNative) : NaN;
    if (!Number.isFinite(native) || native <= 0) return null;
    const quoteUsd = priceUsd / native;
    return Number.isFinite(quoteUsd) && quoteUsd > 0 ? quoteUsd : null;
  }
  return null;
}

async function fetchDexScreenerPrices(addresses: string[]): Promise<Map<string, number>> {
  const prices = new Map<string, number>();
  const unique = [...new Set(addresses.map((address) => address.toLowerCase()))];

  for (let offset = 0; offset < unique.length; offset += DEX_BATCH) {
    const chunk = unique.slice(offset, offset + DEX_BATCH);
    try {
      const res = await fetch(`https://api.dexscreener.com/tokens/v1/base/${chunk.join(",")}`, {
        headers: { accept: "application/json" },
        next: { revalidate: 30 },
        signal: AbortSignal.timeout(FETCH_MS),
      });
      if (!res.ok) continue;
      const pairs = (await res.json()) as DexPair[];
      if (!Array.isArray(pairs)) continue;

      for (const address of chunk) {
        const matching = pairs.filter(
          (pair) =>
            pair.baseToken?.address?.toLowerCase() === address ||
            pair.quoteToken?.address?.toLowerCase() === address,
        );
        if (matching.length === 0) continue;
        const best = matching.sort((a, b) => liquidityUsd(b) - liquidityUsd(a))[0];
        const price = priceFromPair(best, address);
        if (price != null) prices.set(address, price);
      }
    } catch {
      // Skip this batch; CoinGecko may still fill the gaps.
    }
  }

  return prices;
}

async function fetchCoinGeckoEth(): Promise<number | null> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
      {
        headers: { accept: "application/json" },
        next: { revalidate: 30 },
        signal: AbortSignal.timeout(6_000),
      },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { ethereum?: { usd?: number } };
    const price = json.ethereum?.usd;
    return typeof price === "number" && price > 0 ? price : null;
  } catch {
    return null;
  }
}

async function fetchCoinGeckoTokenPrices(addresses: string[]): Promise<Map<string, number>> {
  const prices = new Map<string, number>();
  if (addresses.length === 0) return prices;
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/token_price/base?contract_addresses=${addresses.join(",")}&vs_currencies=usd`,
      {
        headers: { accept: "application/json" },
        next: { revalidate: 30 },
        signal: AbortSignal.timeout(6_000),
      },
    );
    if (!res.ok) return prices;
    const json = (await res.json()) as Record<string, { usd?: number }>;
    for (const [address, entry] of Object.entries(json)) {
      const price = entry?.usd;
      if (typeof price === "number" && price > 0) prices.set(address.toLowerCase(), price);
    }
  } catch {
    // Leave missing prices unset so the UI can hide the $ line.
  }
  return prices;
}

export async function fetchUsdPrices(ids: string[]): Promise<Record<string, number>> {
  const normalized = [...new Set(ids.map(normalizePriceId).filter(isPriceId))];
  const wantEth = normalized.includes(ETH_PRICE_ID);
  const addresses = normalized.filter((id) => id !== ETH_PRICE_ID);
  const dexAddresses = wantEth ? [...addresses, WETH_BASE] : addresses;

  const [dex, ethCg] = await Promise.all([
    dexAddresses.length > 0 ? fetchDexScreenerPrices(dexAddresses) : Promise.resolve(new Map<string, number>()),
    wantEth ? fetchCoinGeckoEth() : Promise.resolve(null),
  ]);

  const missing = addresses.filter((address) => !dex.has(address));
  const geckoTokens = missing.length > 0 ? await fetchCoinGeckoTokenPrices(missing) : new Map<string, number>();

  const prices: Record<string, number> = {};
  for (const address of addresses) {
    const price =
      dex.get(address) ?? geckoTokens.get(address) ?? (address === USDC_BASE ? 1 : undefined);
    if (price != null) prices[address] = price;
  }

  if (wantEth) {
    const eth = ethCg ?? dex.get(WETH_BASE);
    if (eth != null) prices[ETH_PRICE_ID] = eth;
  }

  return prices;
}

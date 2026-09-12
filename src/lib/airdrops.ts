import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const AAPL_DECIMALS = 8;
const AIRDROP_DIR = path.join(process.cwd(), "data", "airdrops");

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
  /** One entry per CSV with at least one sent row, oldest first. */
  drops: AirdropDrop[];
  totalBurned: number;
  burnTokenAddress: string | null;
  latestBuyBurn: BuyBurnDrop | null;
  totalTokenBurned: number;
  sourceTokenAddress: string | null;
  latestTokenBurn: TokenBurnDrop | null;
  tokenBurns: TokenBurnDrop[];
};

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]!;
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

function parseAaplRaw(raw: string, formatted: string): bigint | null {
  if (/^\d+$/.test(raw)) return BigInt(raw);
  const n = Number(formatted);
  if (!Number.isFinite(n) || n < 0) return null;
  return BigInt(Math.round(n * 10 ** AAPL_DECIMALS));
}

function stemName(name: string): string {
  return name
    .replace(/\.tokenburn\.(json|csv)$/i, "")
    .replace(/\.buyburn\.json$/i, "")
    .replace(/\.csv$/i, "");
}

export function parseAirdropCsv(text: string, file: string): AirdropRow[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const header = splitCsvLine(lines[0]!).map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);

  const rankI = idx("rank");
  const walletI = idx("wallet");
  const rawI = idx("aapl_amount");
  const formattedI = idx("aapl_amount_formatted");
  const txI = idx("tx_hash");
  const statusI = idx("status");
  if (walletI < 0 || txI < 0 || statusI < 0) return [];

  const rows: AirdropRow[] = [];
  for (const line of lines.slice(1)) {
    const cols = splitCsvLine(line);
    if ((cols[statusI] ?? "").trim().toLowerCase() !== "sent") continue;
    const txHash = (cols[txI] ?? "").trim();
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) continue;
    const aaplRaw = parseAaplRaw(cols[rawI] ?? "", cols[formattedI] ?? "");
    if (aaplRaw == null || aaplRaw <= BigInt(0)) continue;
    const wallet = (cols[walletI] ?? "").trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) continue;
    rows.push({
      file,
      rank: Number(cols[rankI] ?? 0),
      wallet,
      aaplRaw,
      aapl: Number(aaplRaw) / 10 ** AAPL_DECIMALS,
      txHash: txHash.toLowerCase(),
    });
  }
  return rows;
}

export function parseTokenBurnJson(text: string, file: string): TokenBurnDrop | null {
  let parsed: {
    tokenAddress?: string;
    amountRaw?: string;
    amountFormatted?: string;
    tokenDecimals?: number;
    burnTxHash?: string;
    status?: string;
  };
  try {
    parsed = JSON.parse(text) as typeof parsed;
  } catch {
    return null;
  }
  if ((parsed.status ?? "").trim().toLowerCase() !== "sent") return null;
  const tokenAddress = (parsed.tokenAddress ?? "").trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) return null;
  const decimals = Number(parsed.tokenDecimals ?? 18);
  if (!Number.isFinite(decimals) || decimals < 0 || decimals > 36) return null;
  let raw: bigint | null = null;
  if (parsed.amountRaw && /^\d+$/.test(parsed.amountRaw)) {
    raw = BigInt(parsed.amountRaw);
  } else {
    const n = Number(parsed.amountFormatted ?? "");
    if (Number.isFinite(n) && n > 0) raw = BigInt(Math.round(n * 10 ** decimals));
  }
  if (raw == null || raw <= BigInt(0)) return null;
  const burnTxHash = (parsed.burnTxHash ?? "").trim();
  if (!/^0x[a-fA-F0-9]{64}$/.test(burnTxHash)) return null;
  return {
    file,
    tokenAddress: tokenAddress.toLowerCase(),
    amount: Number(raw) / 10 ** decimals,
    tokenDecimals: decimals,
    burnTxHash: burnTxHash.toLowerCase(),
  };
}

export function parseBuyBurnJson(text: string, file: string): BuyBurnDrop | null {
  let parsed: {
    tokenAddress?: string;
    tokenOutRaw?: string;
    tokenOutFormatted?: string;
    tokenDecimals?: number;
    swapTxHash?: string;
    burnTxHash?: string;
    status?: string;
  };
  try {
    parsed = JSON.parse(text) as typeof parsed;
  } catch {
    return null;
  }
  if ((parsed.status ?? "").trim().toLowerCase() !== "sent") return null;
  const tokenAddress = (parsed.tokenAddress ?? "").trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) return null;
  const decimals = Number(parsed.tokenDecimals ?? 18);
  if (!Number.isFinite(decimals) || decimals < 0 || decimals > 36) return null;
  let raw: bigint | null = null;
  if (parsed.tokenOutRaw && /^\d+$/.test(parsed.tokenOutRaw)) {
    raw = BigInt(parsed.tokenOutRaw);
  } else {
    const n = Number(parsed.tokenOutFormatted ?? "");
    if (Number.isFinite(n) && n > 0) raw = BigInt(Math.round(n * 10 ** decimals));
  }
  if (raw == null || raw <= BigInt(0)) return null;
  const swapTxHash = (parsed.swapTxHash ?? "").trim();
  const burnTxHash = (parsed.burnTxHash ?? "").trim();
  if (!/^0x[a-fA-F0-9]{64}$/.test(burnTxHash)) return null;
  return {
    file,
    tokenAddress: tokenAddress.toLowerCase(),
    tokenOut: Number(raw) / 10 ** decimals,
    tokenDecimals: decimals,
    swapTxHash: /^0x[a-fA-F0-9]{64}$/.test(swapTxHash) ? swapTxHash.toLowerCase() : "",
    burnTxHash: burnTxHash.toLowerCase(),
  };
}

export function summarizeAirdrops(
  files: Array<{ name: string; text: string }>,
  buyburns: BuyBurnDrop[] = [],
  tokenBurns: TokenBurnDrop[] = [],
): AirdropSnapshot {
  const byTx = new Map<string, AirdropRow>();
  const filesWithSent = new Set<string>();
  for (const file of files) {
    for (const row of parseAirdropCsv(file.text, file.name)) {
      if (byTx.has(row.txHash)) continue;
      byTx.set(row.txHash, row);
      filesWithSent.add(file.name);
    }
  }

  const burnsBySidecar = new Map<string, BuyBurnDrop>();
  for (const burn of buyburns) {
    if (burnsBySidecar.has(burn.burnTxHash)) continue;
    burnsBySidecar.set(burn.burnTxHash, burn);
  }
  const uniqueBurns = [...burnsBySidecar.values()];
  const burnByStem = new Map<string, BuyBurnDrop>();
  for (const burn of uniqueBurns) {
    burnByStem.set(stemName(burn.file), burn);
  }

  const all = [...byTx.values()];
  const latestFile = [...filesWithSent].sort().at(-1) ?? null;
  const latest = all
    .filter((row) => row.file === latestFile)
    .sort((a, b) => a.rank - b.rank);

  const totalRaw = all.reduce((sum, row) => sum + row.aaplRaw, BigInt(0));
  const wallets = new Set(all.map((row) => row.wallet.toLowerCase()));

  const drops: AirdropDrop[] = [...filesWithSent].sort().map((file) => {
    const rows = all.filter((row) => row.file === file);
    const raw = rows.reduce((sum, row) => sum + row.aaplRaw, BigInt(0));
    const burn = burnByStem.get(stemName(file)) ?? null;
    return {
      file,
      totalAapl: Number(raw) / 10 ** AAPL_DECIMALS,
      recipientCount: new Set(rows.map((row) => row.wallet.toLowerCase())).size,
      totalBurned: burn?.tokenOut ?? 0,
      burnTokenAddress: burn?.tokenAddress ?? null,
      swapTxHash: burn?.swapTxHash || null,
      burnTxHash: burn?.burnTxHash ?? null,
    };
  });

  const latestBuyBurn =
    (latestFile ? burnByStem.get(stemName(latestFile)) : null) ??
    uniqueBurns.sort((a, b) => a.file.localeCompare(b.file)).at(-1) ??
    null;

  const tokenByTx = new Map<string, TokenBurnDrop>();
  for (const burn of tokenBurns) {
    if (!tokenByTx.has(burn.burnTxHash)) tokenByTx.set(burn.burnTxHash, burn);
  }
  const uniqueTokenBurns = [...tokenByTx.values()].sort((a, b) => a.file.localeCompare(b.file));
  const latestTokenBurn = uniqueTokenBurns.at(-1) ?? null;

  return {
    totalAapl: Number(totalRaw) / 10 ** AAPL_DECIMALS,
    recipientCount: wallets.size,
    dropCount: filesWithSent.size,
    latestFile,
    latest,
    drops,
    totalBurned: uniqueBurns.reduce((sum, burn) => sum + burn.tokenOut, 0),
    burnTokenAddress: latestBuyBurn?.tokenAddress ?? uniqueBurns[0]?.tokenAddress ?? null,
    latestBuyBurn,
    totalTokenBurned: uniqueTokenBurns.reduce((sum, burn) => sum + burn.amount, 0),
    sourceTokenAddress: latestTokenBurn?.tokenAddress ?? uniqueTokenBurns[0]?.tokenAddress ?? null,
    latestTokenBurn,
    tokenBurns: uniqueTokenBurns,
  };
}

export async function loadAirdropSnapshot(): Promise<AirdropSnapshot> {
  let names: string[] = [];
  try {
    names = (await readdir(AIRDROP_DIR)).sort();
  } catch {
    return summarizeAirdrops([]);
  }

  const csvNames = names.filter((name) => name.endsWith(".csv"));
  const files = await Promise.all(
    csvNames.map(async (name) => ({
      name,
      text: await readFile(path.join(AIRDROP_DIR, name), "utf8"),
    })),
  );

  const sidecarNames = names.filter((name) => name.endsWith(".buyburn.json"));
  const buyburns = (
    await Promise.all(
      sidecarNames.map(async (name) =>
        parseBuyBurnJson(await readFile(path.join(AIRDROP_DIR, name), "utf8"), name),
      ),
    )
  ).filter((row): row is BuyBurnDrop => row != null);

  const tokenBurnNames = names.filter((name) => name.endsWith(".tokenburn.json"));
  const tokenBurns = (
    await Promise.all(
      tokenBurnNames.map(async (name) =>
        parseTokenBurnJson(await readFile(path.join(AIRDROP_DIR, name), "utf8"), name),
      ),
    )
  ).filter((row): row is TokenBurnDrop => row != null);

  return summarizeAirdrops(files, buyburns, tokenBurns);
}

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

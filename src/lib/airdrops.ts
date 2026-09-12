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

export type AirdropSnapshot = {
  totalAapl: number;
  recipientCount: number;
  dropCount: number;
  latestFile: string | null;
  latest: AirdropRow[];
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

export function summarizeAirdrops(files: Array<{ name: string; text: string }>): AirdropSnapshot {
  const byTx = new Map<string, AirdropRow>();
  const filesWithSent = new Set<string>();
  for (const file of files) {
    for (const row of parseAirdropCsv(file.text, file.name)) {
      if (byTx.has(row.txHash)) continue;
      byTx.set(row.txHash, row);
      filesWithSent.add(file.name);
    }
  }

  const all = [...byTx.values()];
  const latestFile = [...filesWithSent].sort().at(-1) ?? null;
  const latest = all
    .filter((row) => row.file === latestFile)
    .sort((a, b) => a.rank - b.rank);

  const totalRaw = all.reduce((sum, row) => sum + row.aaplRaw, BigInt(0));
  const wallets = new Set(all.map((row) => row.wallet.toLowerCase()));

  return {
    totalAapl: Number(totalRaw) / 10 ** AAPL_DECIMALS,
    recipientCount: wallets.size,
    dropCount: filesWithSent.size,
    latestFile,
    latest,
  };
}

export async function loadAirdropSnapshot(): Promise<AirdropSnapshot> {
  let names: string[] = [];
  try {
    names = (await readdir(AIRDROP_DIR)).filter((name) => name.endsWith(".csv")).sort();
  } catch {
    return summarizeAirdrops([]);
  }
  const files = await Promise.all(
    names.map(async (name) => ({
      name,
      text: await readFile(path.join(AIRDROP_DIR, name), "utf8"),
    })),
  );
  return summarizeAirdrops(files);
}

export function formatAaplAmount(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "0";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  });
}

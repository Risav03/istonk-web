import type { BuyBurnDrop, TokenBurnDrop } from "@/lib/airdrop-format";

export type FeeCronBurns = {
  buyBurns: BuyBurnDrop[];
  tokenBurns: TokenBurnDrop[];
  source: string | null;
};

type FeeCronBurn = {
  kind?: string;
  at?: string;
  token?: string;
  aapl_in?: string;
  aaplIn?: string;
  amount_raw?: string;
  amountRaw?: string;
  amount?: string;
  decimals?: number;
  swap_tx?: string;
  swapTx?: string;
  burn_tx?: string;
  burnTx?: string;
};

function trimSlash(value: string): string {
  return value.trim().replace(/\/$/, "");
}

export function feeCronBaseCandidates(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (raw: string | undefined | null) => {
    if (!raw) return;
    const next = trimSlash(raw);
    if (!next || seen.has(next)) return;
    seen.add(next);
    out.push(next);
  };

  add(process.env.AAPL_FEE_CRON_URL);
  add(process.env.AAPL_FEE_CRON_PRIVATE_URL);
  if (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PRIVATE_DOMAIN) {
    add("http://aapl-fee-cron.railway.internal:3000");
    add("http://aapl-fee-cron.railway.internal");
  }
  return out;
}

function isoFileName(at: string, suffix: string): string {
  const stamp = /^\d{4}-\d{2}-\d{2}/.test(at)
    ? at.slice(0, 19).replace(/[-:]/g, "").replace("T", "-")
    : "fee";
  return `${stamp}.${suffix}`;
}

function asRow(row: FeeCronBurn): FeeCronBurn {
  return {
    kind: row.kind,
    at: row.at,
    token: row.token,
    amountRaw: row.amountRaw ?? row.amount_raw,
    amount: row.amount,
    decimals: row.decimals,
    swapTx: row.swapTx ?? row.swap_tx,
    burnTx: row.burnTx ?? row.burn_tx,
  };
}

function parseBuyBurn(row: FeeCronBurn): BuyBurnDrop | null {
  const token = (row.token ?? "").trim();
  const burnTx = (row.burnTx ?? row.burn_tx ?? "").trim();
  const decimals = Number(row.decimals ?? 18);
  if (!/^0x[a-fA-F0-9]{40}$/.test(token)) return null;
  if (!/^0x[a-fA-F0-9]{64}$/.test(burnTx)) return null;
  if (!Number.isFinite(decimals) || decimals < 0 || decimals > 36) return null;
  const amountRaw = (row.amountRaw ?? row.amount_raw ?? "").trim();
  let raw: bigint | null = null;
  if (/^\d+$/.test(amountRaw)) raw = BigInt(amountRaw);
  else {
    const n = Number(row.amount ?? "");
    if (Number.isFinite(n) && n > 0) raw = BigInt(Math.round(n * 10 ** decimals));
  }
  if (raw == null || raw <= BigInt(0)) return null;
  const swapTx = (row.swapTx ?? row.swap_tx ?? "").trim();
  return {
    file: isoFileName(row.at ?? "", "buyburn.json"),
    tokenAddress: token.toLowerCase(),
    tokenOut: Number(raw) / 10 ** decimals,
    tokenDecimals: decimals,
    swapTxHash: /^0x[a-fA-F0-9]{64}$/.test(swapTx) ? swapTx.toLowerCase() : "",
    burnTxHash: burnTx.toLowerCase(),
  };
}

function parseTokenBurn(row: FeeCronBurn): TokenBurnDrop | null {
  const parsed = parseBuyBurn(row);
  if (!parsed) return null;
  return {
    file: isoFileName(row.at ?? "", "tokenburn.json"),
    tokenAddress: parsed.tokenAddress,
    amount: parsed.tokenOut,
    tokenDecimals: parsed.tokenDecimals,
    burnTxHash: parsed.burnTxHash,
    at: (row.at ?? "").trim() || undefined,
  };
}

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
      } else if (ch === '"') quoted = false;
      else current += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      cells.push(current);
      current = "";
    } else current += ch;
  }
  cells.push(current);
  return cells;
}

function rowsFromCsv(text: string): FeeCronBurn[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const header = splitCsvLine(lines[0]!).map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const kindI = idx("kind");
  const atI = idx("at");
  const tokenI = idx("token");
  const rawI = idx("amount_raw");
  const amountI = idx("amount");
  const decI = idx("decimals");
  const swapI = idx("swap_tx");
  const burnI = idx("burn_tx");
  if (kindI < 0 || tokenI < 0 || burnI < 0) return [];
  const rows: FeeCronBurn[] = [];
  for (const line of lines.slice(1)) {
    const cols = splitCsvLine(line);
    rows.push({
      kind: cols[kindI],
      at: atI >= 0 ? cols[atI] : "",
      token: cols[tokenI],
      amountRaw: rawI >= 0 ? cols[rawI] : "",
      amount: amountI >= 0 ? cols[amountI] : "",
      decimals: decI >= 0 ? Number(cols[decI]) : 18,
      swapTx: swapI >= 0 ? cols[swapI] : "",
      burnTx: cols[burnI],
    });
  }
  return rows;
}

function splitRows(rows: FeeCronBurn[]): Omit<FeeCronBurns, "source"> {
  const buyBurns: BuyBurnDrop[] = [];
  const tokenBurns: TokenBurnDrop[] = [];
  for (const raw of rows) {
    const row = asRow(raw);
    if (row.kind === "buy15") {
      const parsed = parseBuyBurn(row);
      if (parsed) buyBurns.push(parsed);
    } else if (row.kind === "buy25") {
      const parsed = parseTokenBurn(row);
      if (parsed) tokenBurns.push(parsed);
    }
  }
  return { buyBurns, tokenBurns };
}

async function fetchFromBase(base: string): Promise<Omit<FeeCronBurns, "source"> | null> {
  const jsonRes = await fetch(`${base}/burns`, {
    cache: "no-store",
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(12_000),
  });
  if (jsonRes.ok) {
    const body = (await jsonRes.json()) as { burns?: FeeCronBurn[] };
    if (Array.isArray(body.burns)) return splitRows(body.burns);
  }
  const csvRes = await fetch(`${base}/burns.csv`, {
    cache: "no-store",
    headers: { accept: "text/csv" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!csvRes.ok) return null;
  return splitRows(rowsFromCsv(await csvRes.text()));
}

export async function fetchFeeCronBurns(): Promise<FeeCronBurns> {
  const candidates = feeCronBaseCandidates();
  if (candidates.length === 0) {
    console.warn("[fee-cron] no AAPL_FEE_CRON_URL (and no private DNS fallback)");
    return { buyBurns: [], tokenBurns: [], source: null };
  }

  for (const base of candidates) {
    try {
      const parsed = await fetchFromBase(base);
      if (!parsed) continue;
      if (parsed.buyBurns.length + parsed.tokenBurns.length === 0 && base.includes("railway.internal")) {
        // Empty can mean a reachable idle service — still a valid source.
        return { ...parsed, source: base };
      }
      if (parsed.buyBurns.length + parsed.tokenBurns.length > 0) {
        return { ...parsed, source: base };
      }
      return { ...parsed, source: base };
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      console.warn(`[fee-cron] ${base} failed: ${detail}`);
    }
  }
  return { buyBurns: [], tokenBurns: [], source: null };
}

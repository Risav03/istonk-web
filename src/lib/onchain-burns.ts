import type { BuyBurnDrop, TokenBurnDrop } from "@/lib/airdrop-format";
import {
  BASEMATE_TOKEN,
  DEAD_ADDRESS,
  FEE_ACCOUNT,
  ISTONKS_TOKEN,
} from "@/lib/burn-series";

const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const DEFAULT_FROM_BLOCK = 5_120_0000;
const CHUNK = 8_000;

type RpcLog = {
  address?: string;
  data?: string;
  topics?: string[];
  transactionHash?: string;
  blockNumber?: string;
};

function rpcUrl(): string {
  return (
    process.env.BASE_RPC_URL?.trim() ||
    process.env.NEXT_PUBLIC_BASE_RPC_URL?.trim() ||
    "https://mainnet.base.org"
  );
}

function fromBlock(): number {
  const raw = Number(process.env.ONCHAIN_BURNS_FROM_BLOCK ?? DEFAULT_FROM_BLOCK);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_FROM_BLOCK;
}

function padTopic(addr: string): string {
  return `0x${addr.slice(2).toLowerCase().padStart(64, "0")}`;
}

function hexToNumber(hex: string | undefined): number {
  if (!hex) return 0;
  return Number(BigInt(hex));
}

function isoFileName(at: string, suffix: string): string {
  const stamp = /^\d{4}-\d{2}-\d{2}/.test(at)
    ? at.slice(0, 19).replace(/[-:]/g, "").replace("T", "-")
    : "onchain";
  return `${stamp}.${suffix}`;
}

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(rpcUrl(), {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw new Error(`rpc ${res.status}`);
  const body = (await res.json()) as { result?: T; error?: { message?: string } };
  if (body.error?.message) throw new Error(body.error.message);
  if (body.result === undefined) throw new Error("rpc empty");
  return body.result;
}

async function getLogs(token: string, start: number, end: number): Promise<RpcLog[]> {
  const logs: RpcLog[] = [];
  for (let from = start; from <= end; from += CHUNK) {
    const to = Math.min(end, from + CHUNK - 1);
    const chunk = await rpc<RpcLog[]>("eth_getLogs", [
      {
        address: token,
        fromBlock: `0x${from.toString(16)}`,
        toBlock: `0x${to.toString(16)}`,
        topics: [TRANSFER_TOPIC, padTopic(FEE_ACCOUNT), padTopic(DEAD_ADDRESS)],
      },
    ]);
    if (Array.isArray(chunk)) logs.push(...chunk);
  }
  return logs;
}

async function blockTimes(blocks: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(blocks)];
  const out = new Map<string, string>();
  await Promise.all(
    unique.map(async (blockHex) => {
      const block = await rpc<{ timestamp?: string }>("eth_getBlockByNumber", [blockHex, false]);
      const ts = hexToNumber(block.timestamp);
      if (ts > 0) out.set(blockHex, new Date(ts * 1000).toISOString());
    }),
  );
  return out;
}

function asAmount(data: string | undefined, decimals: number): number {
  if (!data || !/^0x[0-9a-fA-F]+$/.test(data)) return 0;
  const raw = BigInt(data);
  if (raw <= BigInt(0)) return 0;
  return Number(raw) / 10 ** decimals;
}

export async function fetchOnchainBurns(): Promise<{
  feeBurns: BuyBurnDrop[];
  tokenBurns: TokenBurnDrop[];
}> {
  try {
    const latestHex = await rpc<string>("eth_blockNumber", []);
    const latest = hexToNumber(latestHex);
    const start = fromBlock();
    if (latest < start) return { feeBurns: [], tokenBurns: [] };

    const [istonksLogs, basemateLogs] = await Promise.all([
      getLogs(ISTONKS_TOKEN, start, latest),
      getLogs(BASEMATE_TOKEN, start, latest),
    ]);
    const times = await blockTimes(
      [...istonksLogs, ...basemateLogs].map((log) => log.blockNumber ?? "").filter(Boolean),
    );

    const tokenBurns: TokenBurnDrop[] = [];
    for (const log of istonksLogs) {
      const hash = (log.transactionHash ?? "").toLowerCase();
      const amount = asAmount(log.data, 18);
      if (!/^0x[a-f0-9]{64}$/.test(hash) || amount <= 0) continue;
      const at = times.get(log.blockNumber ?? "") ?? new Date().toISOString();
      tokenBurns.push({
        file: isoFileName(at, "tokenburn.json"),
        tokenAddress: ISTONKS_TOKEN,
        amount,
        tokenDecimals: 18,
        burnTxHash: hash,
        at,
      });
    }

    const feeBurns: BuyBurnDrop[] = [];
    for (const log of basemateLogs) {
      const hash = (log.transactionHash ?? "").toLowerCase();
      const amount = asAmount(log.data, 18);
      if (!/^0x[a-f0-9]{64}$/.test(hash) || amount <= 0) continue;
      const at = times.get(log.blockNumber ?? "") ?? new Date().toISOString();
      feeBurns.push({
        file: isoFileName(at, "buyburn.json"),
        tokenAddress: BASEMATE_TOKEN,
        tokenOut: amount,
        tokenDecimals: 18,
        swapTxHash: "",
        burnTxHash: hash,
      });
    }

    return { feeBurns, tokenBurns };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.warn(`[onchain-burns] ${detail}`);
    return { feeBurns: [], tokenBurns: [] };
  }
}

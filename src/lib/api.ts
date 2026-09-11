export type WalletInfo = { address: string; ethWei: string };

export type LaunchRow = {
  tokenAddress: string | null;
  tokenSymbol: string | null;
  tokenName: string | null;
  pairSymbol: string | null;
  quoteAddress?: string | null;
  txHash?: string | null;
  feeLocker?: string | null;
  createdAt?: string | null;
  imageUrl?: string | null;
  canCollect?: boolean;
};

export type FeeRow = {
  token: string;
  symbol: string;
  amount: string;
  amountRaw?: string;
  decimals?: number;
  claimable?: boolean;
  logoUrl?: string;
};

export type FeesSnapshot = {
  items: FeeRow[];
  launches: LaunchRow[];
  held: FeeRow[];
};

export type TransferRequest = {
  to: string;
  /** "eth" for native ETH, otherwise the ERC-20 contract address. */
  token: "eth" | string;
  /** Same as `token`. Preferred so session `token` cannot clobber the asset. */
  asset: "eth" | string;
  /** Human amount, e.g. "0.25". */
  amount: string;
};

export type TransferResult = { txHash: string };

export class ApiError extends Error {
  status: number;
  needsReauth: boolean;
  constructor(message: string, status: number, needsReauth = false) {
    super(message);
    this.status = status;
    this.needsReauth = needsReauth;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { cache: "no-store", ...init });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(body?.error || `Request failed (${res.status}).`, res.status, Boolean(body?.needsReauth));
  }
  return body as T;
}

function post<T>(path: string, payload: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload ?? {}),
  });
}

export const api = {
  wallet: () => request<WalletInfo>("/api/app/stonks/wallet"),
  fees: () => request<FeesSnapshot>("/api/app/stonks/fees"),
  claim: () => post<{ txHash: string }>("/api/app/stonks/fees/claim", {}),
  transfer: (payload: TransferRequest) => post<TransferResult>("/api/app/stonks/transfer", payload),
  linkSession: (accessToken: string) => post<{ ok: true; address: string }>("/api/app/session", { accessToken }),
  endSession: () => fetch("/api/app/session", { method: "DELETE" }).catch(() => {}),
};

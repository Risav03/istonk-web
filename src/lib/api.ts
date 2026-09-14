export type WalletInfo = {
  address: string;
  ethWei: string;
  /** False when the wallet is only known by CDP user id — no phone linked via iMessage `connect`. */
  linked?: boolean;
};

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

export type ActivityItem = {
  id: string;
  direction: "sent" | "received";
  amountLabel: string;
  symbol: string;
  counterparty: string;
  txHash: string | null;
  status: "sent" | "pending" | "failed";
  createdAt: string;
};

export type ActivitySnapshot = {
  items: ActivityItem[];
};

export type GiftChannel = "imessage" | "text" | "email";

export type ContactRow = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StockOffer = {
  symbol: string;
  name: string;
};

export type GiftCheckoutResult =
  | { status: "pay"; payUrl: string; giftId: string; chargeUsd: number; amountLabel: string }
  | { status: "sent"; giftId: string; amountLabel: string; txHash?: string };

export type GiftCheckoutRequest = {
  channel: GiftChannel;
  symbol: string;
  usd: string;
  memo?: string;
  saveContact?: boolean;
  recipient: {
    name?: string;
    phone?: string;
    email?: string;
    contactId?: number;
  };
};

export class ApiError extends Error {
  status: number;
  needsReauth: boolean;
  fundUrl?: string;
  constructor(message: string, status: number, needsReauth = false, fundUrl?: string) {
    super(message);
    this.status = status;
    this.needsReauth = needsReauth;
    this.fundUrl = fundUrl;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { cache: "no-store", ...init });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      body?.error || `Request failed (${res.status}).`,
      res.status,
      Boolean(body?.needsReauth),
      typeof body?.fundUrl === "string" ? body.fundUrl : undefined,
    );
  }
  return body as T;
}

function json<T>(path: string, method: "POST" | "PATCH" | "DELETE", payload?: unknown): Promise<T> {
  return request<T>(path, {
    method,
    headers: payload === undefined ? undefined : { "content-type": "application/json" },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
}

function post<T>(path: string, payload: unknown): Promise<T> {
  return json<T>(path, "POST", payload);
}

export const api = {
  wallet: () => request<WalletInfo>("/api/app/stonks/wallet"),
  fees: () => request<FeesSnapshot>("/api/app/stonks/fees"),
  activity: () => request<ActivitySnapshot>("/api/app/stonks/activity"),
  claim: () => post<{ txHash: string }>("/api/app/stonks/fees/claim", {}),
  transfer: (payload: TransferRequest) => post<TransferResult>("/api/app/stonks/transfer", payload),
  stocks: () => request<{ items: StockOffer[] }>("/api/app/stonks/stocks").then((body) => body.items ?? []),
  launchPairs: () =>
    request<{ launchable?: StockOffer[] }>("/api/app/stonks/stocks").then((body) => body.launchable ?? []),
  launchCoin: (payload: { name: string; symbol: string; pairSymbol: string }) =>
    post<{
      txHash: string | null;
      tokenAddress: string;
      pairSymbol: string;
      tokenUrl: string;
      explorerUrl: string | null;
    }>("/api/app/istonks/launch", payload),
  contacts: () =>
    request<{ items: ContactRow[] }>("/api/app/stonks/contacts").then((body) => body.items ?? []),
  saveContact: (payload: { name: string; phone?: string; email?: string }) =>
    post<{ item: ContactRow | null }>("/api/app/stonks/contacts", payload).then((body) => body.item),
  updateContact: (id: number, payload: { name?: string; phone?: string | null; email?: string | null }) =>
    json<{ item: ContactRow }>("/api/app/stonks/contacts/" + id, "PATCH", payload).then((body) => body.item),
  deleteContact: (id: number) => json<{ ok: true }>("/api/app/stonks/contacts/" + id, "DELETE"),
  createGift: (payload: GiftCheckoutRequest) => post<GiftCheckoutResult>("/api/app/stonks/gifts", payload),
  linkSession: (accessToken: string) =>
    post<{ ok: true; address: string; linked?: boolean }>("/api/app/session", { accessToken }),
  endSession: () => fetch("/api/app/session", { method: "DELETE" }).catch(() => {}),
  prices: (ids: string[]) => {
    const query = ids.map((id) => id.trim()).filter(Boolean).join(",");
    return request<{ prices?: Record<string, number> }>(
      `/api/prices?ids=${encodeURIComponent(query)}`,
    ).then((body) => body.prices ?? {});
  },
};

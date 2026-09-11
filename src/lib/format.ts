export function formatEth(wei: string): string {
  const value = Number(wei) / 1e18;
  if (!Number.isFinite(value)) return "0";
  if (value === 0) return "0.0000";
  return value < 0.0001 ? value.toExponential(2) : value.toFixed(4);
}

export function formatTokenAmount(amount: string | number): string {
  const n = Number(amount);
  if (!Number.isFinite(n) || n === 0) return "0";
  if (n < 0.0001) return n.toExponential(2);
  if (n < 1) return n.toFixed(6).replace(/0+$/, "");
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export function shortAddr(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function isAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
}

export function timeAgo(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return null;
  const mins = Math.max(0, Math.round((Date.now() - then) / 60_000));
  if (mins < 60) return mins <= 1 ? "just now" : `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 14) return `${days} day${days === 1 ? "" : "s"} ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 8) return `${weeks} weeks ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

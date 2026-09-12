const SUBSCRIPT_DIGITS = ["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉"] as const;
const TINY_DECIMAL = 1e-4;
const TINY_SIGNIFICANT_DIGITS = 4;

export type TinyDecimalParts = {
  sign: string;
  zeros: number;
  digits: string;
};

export function weiToEth(wei: string): number {
  return Number(wei) / 1e18;
}

export function toSubscript(n: number): string {
  return String(Math.trunc(Math.abs(n))).replace(/[0-9]/g, (d) => SUBSCRIPT_DIGITS[Number(d)] ?? d);
}

/**
 * DexScreener-style leading-zero count: 0.0000739 → { zeros: 4, digits: "739" }.
 * Returns null when the value is 0, not finite, or ≥ 0.0001.
 */
export function tinyDecimalParts(
  value: number,
  significantDigits = TINY_SIGNIFICANT_DIGITS,
): TinyDecimalParts | null {
  if (!Number.isFinite(value) || value === 0) return null;
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= TINY_DECIMAL) return null;

  let exp = Math.floor(Math.log10(abs));
  if (!Number.isFinite(exp)) return null;
  let zeros = -exp - 1;
  if (zeros < 1) return null;

  const scale = 10 ** (significantDigits - 1);
  let scaled = Math.round(abs * 10 ** -exp * scale);
  if (scaled >= 10 ** significantDigits) {
    scaled = scale;
    zeros -= 1;
    exp += 1;
  }
  if (zeros < 1 || 10 ** exp >= TINY_DECIMAL) return null;

  const digits = String(scaled).replace(/0+$/, "") || "1";
  return { sign, zeros, digits };
}

export function formatTinyDecimal(value: number, significantDigits = TINY_SIGNIFICANT_DIGITS): string | null {
  const parts = tinyDecimalParts(value, significantDigits);
  if (!parts) return null;
  return `${parts.sign}0.0${toSubscript(parts.zeros)}${parts.digits}`;
}

export function formatEthAmount(value: number): string {
  if (!Number.isFinite(value)) return "0";
  if (value === 0) return "0.0000";
  return formatTinyDecimal(value) ?? value.toFixed(4);
}

export function formatEth(wei: string): string {
  return formatEthAmount(weiToEth(wei));
}

export function formatTokenAmount(amount: string | number): string {
  const n = Number(amount);
  if (!Number.isFinite(n) || n === 0) return "0";
  const tiny = formatTinyDecimal(n);
  if (tiny) return tiny;
  if (Math.abs(n) < 1) return n.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export function amountUsd(amount: number, priceUsd: number | undefined): number | null {
  if (priceUsd == null || !Number.isFinite(priceUsd) || !Number.isFinite(amount)) return null;
  return amount * priceUsd;
}

export function formatUsd(value: number | null | undefined): string | null {
  if (value == null || !Number.isFinite(value)) return null;
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs === 0) return "$0.00";
  if (abs < 0.01) {
    const tiny = formatTinyDecimal(abs);
    return `${sign}$${tiny ?? abs.toPrecision(2)}`;
  }
  return `${sign}$${abs.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function shortAddr(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function isAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
}

/** ".1" → "0.1". Used before send so the API amount regex accepts it. */
export function normalizeAmount(value: string): string {
  const text = value.trim();
  return text.startsWith(".") ? `0${text}` : text;
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

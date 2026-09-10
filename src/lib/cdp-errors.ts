/** CDP axios "Network Error" almost always means CORS — the page origin is not allowlisted. */
export function cdpSignInError(err: unknown): string {
  const msg = err instanceof Error ? err.message : "Couldn't send the code.";
  if (/already authenticated|already signed in/i.test(msg)) return msg;
  if (/network error|failed to fetch|load failed|origin is not an allowed origin/i.test(msg)) {
    const origin = typeof window !== "undefined" ? window.location.origin : "this site";
    return `Couldn't reach Coinbase sign-in from ${origin}. Add that exact origin in CDP Portal → Embedded Wallet → Allowed domains.`;
  }
  return msg;
}

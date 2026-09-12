import { agentHost } from "@/lib/app-session";

export async function fetchTokensLaunched(): Promise<number | null> {
  const host = agentHost();
  if (!host) return null;
  try {
    const endpoint = new URL("/api/agent/istonks/stats", host.replace(/\/$/, ""));
    const res = await fetch(endpoint, {
      headers: { accept: "application/json" },
      next: { revalidate: 15 },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { tokensLaunched?: number };
    return typeof body.tokensLaunched === "number" && Number.isFinite(body.tokensLaunched)
      ? body.tokensLaunched
      : null;
  } catch {
    return null;
  }
}

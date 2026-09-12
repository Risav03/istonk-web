import { agentHost } from "@/lib/app-session";
import { LAUNCH_FEED_LIMIT, type PublicLaunch } from "@/lib/launches";

export type { PublicLaunch } from "@/lib/launches";

function endpoint(path: string): URL | null {
  const host = agentHost();
  if (!host) return null;
  return new URL(path, host.replace(/\/$/, ""));
}

export async function fetchTokensLaunched(): Promise<number | null> {
  const url = endpoint("/api/agent/istonks/stats");
  if (!url) return null;
  try {
    const res = await fetch(url, { headers: { accept: "application/json" }, next: { revalidate: 15 } });
    if (!res.ok) return null;
    const body = (await res.json()) as { tokensLaunched?: number };
    return typeof body.tokensLaunched === "number" && Number.isFinite(body.tokensLaunched)
      ? body.tokensLaunched
      : null;
  } catch {
    return null;
  }
}

/** Newest first. Empty on any failure so the page still renders. */
export async function fetchLaunches(limit = LAUNCH_FEED_LIMIT): Promise<PublicLaunch[]> {
  const url = endpoint("/api/agent/istonks/launches");
  if (!url) return [];
  url.searchParams.set("limit", String(limit));
  try {
    const res = await fetch(url, { headers: { accept: "application/json" }, cache: "no-store" });
    if (!res.ok) return [];
    const body = (await res.json()) as { items?: PublicLaunch[] };
    return Array.isArray(body.items) ? body.items : [];
  } catch {
    return [];
  }
}

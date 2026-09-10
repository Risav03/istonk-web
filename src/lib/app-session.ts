import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

export const APP_SESSION_COOKIE = "istonk_app_session";
export const APP_SESSION_MAX_AGE_S = 30 * 24 * 60 * 60;

export const APP_SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: APP_SESSION_MAX_AGE_S,
};

export interface AppSession {
  user: string;
  token: string;
  address: string;
}

export function encodeAppSessionValue(session: AppSession): string {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}

export function applyAppSessionCookie(res: NextResponse, session: AppSession): void {
  res.cookies.set(APP_SESSION_COOKIE, encodeAppSessionValue(session), APP_SESSION_COOKIE_OPTIONS);
}

export function clearAppSessionCookie(res: NextResponse): void {
  res.cookies.set(APP_SESSION_COOKIE, "", { ...APP_SESSION_COOKIE_OPTIONS, maxAge: 0 });
}

export async function getAppSession(): Promise<AppSession | null> {
  const jar = await cookies();
  const raw = jar.get(APP_SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (parsed && typeof parsed.user === "string" && typeof parsed.token === "string") {
      return parsed as AppSession;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function agentHost(): string | undefined {
  return process.env.AGENT_API_HOST?.trim() || undefined;
}

export function agentUnreachableError(err: unknown, what: string): { error: string; detail: string } {
  const host = agentHost() || "(unset)";
  const detail = fetchErrorDetail(err);
  return {
    error: `${what} Set AGENT_API_HOST on the istonk-web Railway service to the iStonk API public URL (https://api.istonks.meme), then restart.`,
    detail: `${host} — ${detail}`,
  };
}

function fetchErrorDetail(err: unknown): string {
  if (!(err instanceof Error)) return String(err);
  const cause = (err as Error & { cause?: unknown }).cause;
  if (cause instanceof Error) return `${err.message}: ${cause.message}`;
  if (cause && typeof cause === "object" && "code" in cause) {
    return `${err.message}: ${String((cause as { code: unknown }).code)}`;
  }
  return err.message;
}

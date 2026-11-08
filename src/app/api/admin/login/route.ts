import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, SESSION_COOKIE_OPTS, signSession } from "@/lib/admin-session";
import {
  MAX_FAILURES,
  failureDelayMs,
  getClientIp,
  lockedForSeconds,
  recordFailure,
  recordSuccess,
} from "@/lib/login-rate-limit";

function tooManyAttempts(retryAfterS: number) {
  const minutes = Math.max(1, Math.ceil(retryAfterS / 60));
  return NextResponse.json(
    { error: `Příliš mnoho neúspěšných pokusů. Zkuste to znovu za ${minutes} min.`, retryAfter: retryAfterS },
    { status: 429, headers: { "Retry-After": String(retryAfterS) } },
  );
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);

  // Zablokovaná IP: PIN se vůbec neověřuje.
  const locked = lockedForSeconds(ip);
  if (locked > 0) return tooManyAttempts(locked);

  const body: unknown = await req.json().catch(() => null);
  const pin = body && typeof body === "object" ? (body as { pin?: unknown }).pin : undefined;

  // Mezi kontrolou blokace, ověřením PINu a zápisem neúspěchu nesmí být žádné `await`,
  // jinak by souběžné požadavky obešly limit.
  const lockedNow = lockedForSeconds(ip);
  if (lockedNow > 0) return tooManyAttempts(lockedNow);

  const ADMIN_PIN = process.env.ADMIN_PIN ?? "";
  const ok = !!ADMIN_PIN && typeof pin === "string" && pin === ADMIN_PIN;

  if (!ok) {
    const { failures, lockedForS } = recordFailure(ip);
    // Zpoždění zdržuje jen tenhle požadavek (async), ostatní uživatelé nečekají.
    await new Promise((r) => setTimeout(r, failureDelayMs(failures)));
    if (lockedForS > 0) {
      console.warn(`[admin] login: ${MAX_FAILURES} neúspěšných pokusů, IP dočasně zablokovaná`);
      return tooManyAttempts(lockedForS);
    }
    return NextResponse.json({ error: "Nesprávný PIN" }, { status: 401 });
  }

  recordSuccess(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, signSession(), SESSION_COOKIE_OPTS);
  return res;
}

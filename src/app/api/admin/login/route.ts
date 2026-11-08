import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, SESSION_COOKIE_OPTS, pinMatches, signSession } from "@/lib/admin-session";
import {
  MAX_FAILURES,
  checkLoginAllowed,
  failureDelayMs,
  getClientIp,
  recordFailure,
  recordSuccess,
  type Gate,
} from "@/lib/login-rate-limit";

const MAX_PIN_LENGTH = 64;

function tooManyAttempts(gate: Exclude<Gate, { allowed: true }>) {
  const minutes = Math.max(1, Math.ceil(gate.retryAfterS / 60));
  const error =
    gate.reason === "ip"
      ? `Příliš mnoho neúspěšných pokusů. Zkuste to znovu za ${minutes} min.`
      : `Přihlašování je kvůli mnoha neúspěšným pokusům dočasně omezené. Zkuste to znovu za ${minutes} min.`;
  return NextResponse.json(
    { error, retryAfter: gate.retryAfterS },
    { status: 429, headers: { "Retry-After": String(gate.retryAfterS) } },
  );
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);

  // Zablokovaná IP / globální omezení: PIN se vůbec neověřuje.
  const before = checkLoginAllowed(ip);
  if (!before.allowed) return tooManyAttempts(before);

  const body: unknown = await req.json().catch(() => null);
  const pin = body && typeof body === "object" ? (body as { pin?: unknown }).pin : undefined;

  // Mezi kontrolou, ověřením PINu a zápisem neúspěchu nesmí být žádné `await`,
  // jinak by souběžné požadavky obešly limit.
  const gate = checkLoginAllowed(ip);
  if (!gate.allowed) return tooManyAttempts(gate);

  const ok =
    typeof pin === "string" && pin.length > 0 && pin.length <= MAX_PIN_LENGTH && pinMatches(pin);

  if (!ok) {
    const { failures, lockedForS } = recordFailure(ip);
    // Zpoždění zdržuje jen tenhle požadavek (async), ostatní uživatelé nečekají.
    await new Promise((r) => setTimeout(r, failureDelayMs(failures)));
    if (lockedForS > 0) {
      console.warn(`[admin] login: ${MAX_FAILURES} neúspěšných pokusů z jedné IP, IP dočasně zablokovaná`);
      return tooManyAttempts({ allowed: false, reason: "ip", retryAfterS: lockedForS });
    }
    return NextResponse.json({ error: "Nesprávný PIN" }, { status: 401 });
  }

  recordSuccess(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, signSession(), SESSION_COOKIE_OPTS);
  return res;
}

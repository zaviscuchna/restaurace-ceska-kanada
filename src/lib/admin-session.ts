import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.ADMIN_SESSION_SECRET ?? "dev-secret-change-in-production";

export function signSession(): string {
  const payload = `admin:${Date.now()}`;
  const sig = createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifySession(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const lastDot = token.lastIndexOf(".");
    if (lastDot === -1) return false;
    const payload = token.slice(0, lastDot);
    const sig = token.slice(lastDot + 1);
    const expected = createHmac("sha256", SECRET).update(payload).digest("hex");
    const sigBuf = Buffer.from(sig, "hex");
    const expectedBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) return false;
    const ts = parseInt(payload.split(":")[1]);
    return !isNaN(ts) && Date.now() - ts < 8 * 60 * 60 * 1000;
  } catch { return false; }
}

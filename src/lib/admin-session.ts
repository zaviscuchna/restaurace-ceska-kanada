import { createHash, createHmac, timingSafeEqual } from "crypto";

export const COOKIE_NAME = "ck_admin";

const SESSION_MAX_AGE_S = 8 * 60 * 60;
// Jen pro lokální vývoj (next dev). V produkci se nikdy nepoužije, viz getSessionSecret().
const DEV_ONLY_SECRET = "dev-secret-jen-pro-lokalni-vyvoj";
const MIN_PIN_LENGTH_RECOMMENDED = 6;
const MIN_SECRET_LENGTH_RECOMMENDED = 32;

const isProduction = () => process.env.NODE_ENV === "production";

export const SESSION_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "strict" as const,
  // Produkce běží za Traefikem na HTTPS. Podle NODE_ENV, ne podle volitelné HTTPS_ENABLED,
  // aby se Secure nedalo omylem vypnout chybějící proměnnou.
  secure: isProduction(),
  maxAge: SESSION_MAX_AGE_S,
  path: "/",
};

export class AdminConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminConfigError";
  }
}

function getSessionSecret(): string {
  // Hodnota se používá beze změny (bez trim), aby zůstaly platné stávající relace.
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (secret && secret.trim()) return secret;
  if (isProduction()) {
    throw new AdminConfigError(
      "Chybí proměnná prostředí ADMIN_SESSION_SECRET. Bez ní nejde bezpečně podepsat " +
        "přihlášení do administrace. Nastav ji (např. výstup `openssl rand -hex 32`) " +
        "v Coolify u aplikace a nasaď znovu.",
    );
  }
  return DEV_ONLY_SECRET;
}

/**
 * Kontrola konfigurace při startu serveru (volá ji src/instrumentation.ts).
 * V produkci bez ADMIN_SESSION_SECRET vyhodí chybu, takže server nenaběhne.
 * Hodnoty proměnných nikdy nevypisuje.
 */
export function assertAdminConfig(): void {
  const secret = getSessionSecret();
  if (isProduction() && secret.length < MIN_SECRET_LENGTH_RECOMMENDED) {
    console.warn(
      `[admin] ADMIN_SESSION_SECRET je kratší než ${MIN_SECRET_LENGTH_RECOMMENDED} znaků, doporučuji ho prodloužit.`,
    );
  }
  const pin = process.env.ADMIN_PIN ?? "";
  if (!pin) {
    console.warn("[admin] ADMIN_PIN není nastavený, přihlášení do administrace nepůjde.");
  } else if (pin.length < MIN_PIN_LENGTH_RECOMMENDED) {
    console.warn(
      `[admin] ADMIN_PIN je kratší než ${MIN_PIN_LENGTH_RECOMMENDED} znaků, doporučuji ho prodloužit.`,
    );
  }
}

/** Porovná zadaný PIN s ADMIN_PIN v konstantním čase (bez ohledu na délku). */
export function pinMatches(input: string): boolean {
  const expected = process.env.ADMIN_PIN ?? "";
  if (!expected) return false;
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export function signSession(): string {
  const payload = `admin:${Date.now()}`;
  const sig = createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifySession(token: string | undefined): boolean {
  if (!token) return false;
  const secret = getSessionSecret();
  try {
    const lastDot = token.lastIndexOf(".");
    if (lastDot === -1) return false;
    const payload = token.slice(0, lastDot);
    const sig = token.slice(lastDot + 1);
    const expected = createHmac("sha256", secret).update(payload).digest("hex");
    const sigBuf = Buffer.from(sig, "hex");
    const expectedBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) return false;
    const ts = parseInt(payload.split(":")[1]);
    return !isNaN(ts) && Date.now() - ts < SESSION_MAX_AGE_S * 1000;
  } catch { return false; }
}

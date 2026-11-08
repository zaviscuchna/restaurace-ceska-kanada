/**
 * Omezení pokusů o přihlášení do administrace.
 *
 * Dvě úrovně:
 * 1. Podle IP (IPv6 po /64): 5 neúspěchů za 15 min -> ta IP je 15 min zablokovaná.
 *    Zablokovaná IP neblokuje ostatní, klíčem je IP klienta.
 * 2. Globálně: 30 neúspěchů za 15 min ze všech IP dohromady -> přihlašování se na 15 min
 *    zavře pro všechny kromě IP, ze kterých se někdo v posledních 30 dnech úspěšně přihlásil.
 *    Jedna IP ho sama spustit nemůže (po 5 chybách je zablokovaná), chrání proti
 *    hádání PINu z mnoha IP najednou.
 *
 * Paměť je v procesu (jedna instance `next start` v Coolify), po restartu se vynuluje.
 */

const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;
export const MAX_FAILURES = 5;
export const GLOBAL_MAX_FAILURES = 30;
const GLOBAL_LOCK_MS = 15 * 60 * 1000;
const TRUSTED_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_TRUSTED = 50;
export const MAX_ENTRIES = 10_000; // strop paměti pro sledované IP
const CAPACITY_RETRY_S = 60;

type Entry = { failures: number; windowStart: number; lockedUntil: number };
type GlobalState = { failures: number; windowStart: number; lockedUntil: number };
type State = {
  entries: Map<string, Entry>;
  trusted: Map<string, number>; // IP -> čas posledního úspěšného přihlášení
  global: GlobalState;
};

function freshState(): State {
  return { entries: new Map(), trusted: new Map(), global: { failures: 0, windowStart: 0, lockedUntil: 0 } };
}

const g = globalThis as unknown as { __ckLoginRateLimit?: State };
const state = (g.__ckLoginRateLimit ??= freshState());

/** Jen pro testy. */
export function _resetForTests(): void {
  const s = freshState();
  state.entries = s.entries;
  state.trusted = s.trusted;
  state.global = s.global;
}

/** Jen pro testy: vynuluje globální počítadlo a zámek, záznamy IP nechá. */
export function _resetGlobalForTests(): void {
  state.global = { failures: 0, windowStart: 0, lockedUntil: 0 };
}

/** Jen pro testy. */
export function _stats() {
  return { entries: state.entries.size, trusted: state.trusted.size, globalFailures: state.global.failures };
}

// ── IP klienta ──────────────────────────────────────────────────────────────

function expandIpv6(ip: string): string[] | null {
  const halves = ip.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const missing = 8 - head.length - tail.length;
  if (halves.length === 1 && missing !== 0) return null;
  if (missing < 0) return null;
  const groups = [...head, ...Array(halves.length === 2 ? missing : 0).fill("0"), ...tail];
  if (groups.length !== 8 || !groups.every((h) => /^[0-9a-f]{1,4}$/i.test(h))) return null;
  return groups.map((h) => h.toLowerCase().padStart(4, "0"));
}

/** IPv4 beze změny, IPv4 mapovaná do IPv6 -> IPv4, IPv6 -> prefix /64. */
export function normalizeIp(raw: string): string {
  let ip = raw.trim();
  if (ip.startsWith("[")) ip = ip.slice(1, ip.indexOf("]") > 0 ? ip.indexOf("]") : undefined);
  const zone = ip.indexOf("%");
  if (zone !== -1) ip = ip.slice(0, zone);
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(ip);
  if (mapped) return mapped[1];
  if (!ip.includes(":")) return ip;
  const groups = expandIpv6(ip);
  if (!groups) return ip.toLowerCase();
  return `${groups.slice(0, 4).join(":")}::/64`;
}

/**
 * Klíč klienta za Coolify proxy.
 *
 * Coolify proxy je Traefik v3.6 bez `forwardedHeaders.insecure` a bez `trustedIPs` a DNS míří
 * přímo na server (žádný Cloudflare). Traefik proto X-Forwarded-For / X-Real-Ip poslané
 * klientem smaže (forwardedheaders: `Del(h)` pro nedůvěryhodný zdroj) a jeho reverse proxy
 * pak do X-Forwarded-For přidá právě jednu položku = IP TCP spojení. Bereme POSLEDNÍ položku,
 * tj. tu od Traefiku; kdyby se hlavičkám od klienta začalo důvěřovat, klient by mohl
 * podvrhnout jen položky před ní. Next.js `next start` X-Forwarded-For nepřepisuje, jen ho
 * doplní adresou socketu, když chybí (lokální běh bez proxy).
 */
export function getClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((p) => p.trim()).filter(Boolean);
    const last = parts[parts.length - 1];
    if (last) return normalizeIp(last);
  }
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return normalizeIp(realIp);
  return "neznama-ip";
}

// ── Stav ───────────────────────────────────────────────────────────────────

function isTrusted(ip: string, now: number): boolean {
  const ts = state.trusted.get(ip);
  if (ts === undefined) return false;
  if (now - ts > TRUSTED_TTL_MS) {
    state.trusted.delete(ip);
    return false;
  }
  return true;
}

function ipLockedForMs(ip: string, now: number): number {
  const e = state.entries.get(ip);
  return e && e.lockedUntil > now ? e.lockedUntil - now : 0;
}

/**
 * Uvolní místo pro nový záznam. Maže jen NEzamčené záznamy (nejdřív prošlé, pak nejstarší),
 * zamčené nikdy, aby se zámek nedal smazat zahlcením jinými IP. Vrací, jestli je místo.
 */
function makeRoom(now: number): boolean {
  if (state.entries.size < MAX_ENTRIES) return true;
  for (const [key, e] of state.entries) {
    if (e.lockedUntil <= now && now - e.windowStart > WINDOW_MS) state.entries.delete(key);
  }
  if (state.entries.size < MAX_ENTRIES) return true;
  for (const [key, e] of state.entries) {
    if (state.entries.size < MAX_ENTRIES) break;
    if (e.lockedUntil <= now) state.entries.delete(key);
  }
  return state.entries.size < MAX_ENTRIES;
}

export type Gate =
  | { allowed: true }
  | { allowed: false; reason: "ip" | "global" | "kapacita"; retryAfterS: number };

/**
 * Smí tahle IP teď zkusit PIN? Volat synchronně těsně před ověřením PINu
 * a mezi tímhle, ověřením a recordFailure() nesmí být žádné `await`.
 */
export function checkLoginAllowed(ip: string, now = Date.now()): Gate {
  const ipMs = ipLockedForMs(ip, now);
  if (ipMs > 0) return { allowed: false, reason: "ip", retryAfterS: Math.ceil(ipMs / 1000) };

  const trusted = isTrusted(ip, now);
  if (!trusted && state.global.lockedUntil > now) {
    return { allowed: false, reason: "global", retryAfterS: Math.ceil((state.global.lockedUntil - now) / 1000) };
  }

  // Nová IP a plná paměť samých zámků: radši odmítnout, než pustit nesledované pokusy.
  // Důvěryhodné IP (max. MAX_TRUSTED) smí strop mírně překročit.
  if (!state.entries.has(ip) && !trusted && !makeRoom(now)) {
    return { allowed: false, reason: "kapacita", retryAfterS: CAPACITY_RETRY_S };
  }
  return { allowed: true };
}

/** Zapíše neúspěšný pokus. Vrací počet chyb dané IP v okně a případnou délku její blokace. */
export function recordFailure(ip: string, now = Date.now()): { failures: number; lockedForS: number } {
  // Globální počítadlo
  const gs = state.global;
  if (now - gs.windowStart > WINDOW_MS || gs.windowStart === 0) {
    gs.failures = 0;
    gs.windowStart = now;
  }
  gs.failures += 1;
  if (gs.failures >= GLOBAL_MAX_FAILURES) {
    gs.lockedUntil = now + GLOBAL_LOCK_MS;
    gs.failures = 0;
    gs.windowStart = gs.lockedUntil;
    console.warn(`[admin] login: ${GLOBAL_MAX_FAILURES} neúspěšných pokusů za 15 min ze všech IP, přihlašování dočasně omezeno`);
  }

  // Počítadlo IP
  let e = state.entries.get(ip);
  if (!e || (e.lockedUntil <= now && now - e.windowStart > WINDOW_MS)) {
    e = { failures: 0, windowStart: now, lockedUntil: 0 };
  }
  e.failures += 1;
  const failures = e.failures;
  if (e.failures >= MAX_FAILURES) {
    e.lockedUntil = now + LOCK_MS;
    // Po blokaci začne nové okno, pokusy po jejím vypršení se počítají znovu od nuly.
    e.failures = 0;
    e.windowStart = e.lockedUntil;
  }
  if (!state.entries.has(ip)) makeRoom(now);
  state.entries.delete(ip); // přesunout na konec (pořadí = stáří pro makeRoom)
  state.entries.set(ip, e);
  return { failures, lockedForS: Math.ceil(ipLockedForMs(ip, now) / 1000) };
}

/** Úspěšné přihlášení: vynuluje počítadlo IP a zapamatuje si ji jako důvěryhodnou. */
export function recordSuccess(ip: string, now = Date.now()): void {
  state.entries.delete(ip);
  state.trusted.delete(ip);
  state.trusted.set(ip, now);
  while (state.trusted.size > MAX_TRUSTED) {
    const oldest = state.trusted.keys().next().value;
    if (oldest === undefined) break;
    state.trusted.delete(oldest);
  }
}

/** Zpoždění odpovědi po neúspěchu: 1 s, 2 s, 3 s, 4 s (roste s počtem chyb). */
export function failureDelayMs(failures: number): number {
  return Math.min(Math.max(failures, 1), 4) * 1000;
}

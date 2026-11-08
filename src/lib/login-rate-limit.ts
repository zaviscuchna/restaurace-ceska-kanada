/**
 * Omezení pokusů o přihlášení do administrace, zvlášť pro každou IP adresu.
 *
 * Paměť je v procesu (jedna instance `next start` v Coolify), po restartu se vynuluje.
 * Zablokovaná IP neblokuje ostatní: klíčem je IP klienta, ne nic globálního.
 */

const WINDOW_MS = 15 * 60 * 1000; // okno, ve kterém se počítají neúspěšné pokusy
const LOCK_MS = 15 * 60 * 1000; // jak dlouho je IP po vyčerpání pokusů zablokovaná
export const MAX_FAILURES = 5;
const MAX_ENTRIES = 10_000; // strop paměti při záplavě z mnoha IP

type Entry = { failures: number; windowStart: number; lockedUntil: number };

const globalStore = globalThis as unknown as { __ckLoginAttempts?: Map<string, Entry> };
const store = (globalStore.__ckLoginAttempts ??= new Map<string, Entry>());

/**
 * IP klienta za Coolify proxy.
 *
 * Coolify proxy je Traefik v3.6 bez `forwardedHeaders.insecure` a bez `trustedIPs`, DNS míří
 * přímo na server (žádný Cloudflare). Traefik proto hlavičky X-Forwarded-For / X-Real-Ip
 * poslané klientem zahodí a nastaví vlastní podle TCP spojení. Bereme POSLEDNÍ položku
 * X-Forwarded-For: tu vždy připojí Traefik, i kdyby se později začalo hlavičkám důvěřovat
 * (klient by pak mohl podvrhnout jen položky před ní). Next.js `next start` X-Forwarded-For
 * nepřepisuje, jen ho doplní adresou socketu, když chybí (lokální běh).
 */
export function getClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((p) => p.trim()).filter(Boolean);
    const last = parts[parts.length - 1];
    if (last) return last;
  }
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "neznama-ip";
}

function prune(now: number) {
  if (store.size <= MAX_ENTRIES) return;
  for (const [key, e] of store) {
    if (e.lockedUntil <= now && now - e.windowStart > WINDOW_MS) store.delete(key);
  }
  // Pořád moc? Zahodit nejstarší záznamy (Map drží pořadí vložení).
  for (const key of store.keys()) {
    if (store.size <= MAX_ENTRIES) break;
    store.delete(key);
  }
}

/** Kolik sekund ještě trvá blokace dané IP (0 = může zkoušet). */
export function lockedForSeconds(key: string, now = Date.now()): number {
  const e = store.get(key);
  if (!e || e.lockedUntil <= now) return 0;
  return Math.ceil((e.lockedUntil - now) / 1000);
}

/** Zapíše neúspěšný pokus. Vrací počet neúspěchů v okně a případnou délku blokace. */
export function recordFailure(key: string, now = Date.now()): { failures: number; lockedForS: number } {
  let e = store.get(key);
  if (!e || now - e.windowStart > WINDOW_MS) {
    e = { failures: 0, windowStart: now, lockedUntil: 0 };
  }
  e.failures += 1;
  const failures = e.failures;
  if (e.failures >= MAX_FAILURES) {
    e.lockedUntil = now + LOCK_MS;
    // Po blokaci začne nové okno, další pokusy po jejím vypršení se počítají znovu od nuly.
    e.failures = 0;
    e.windowStart = e.lockedUntil;
  }
  store.delete(key); // přesunout na konec kvůli pořadí v prune()
  store.set(key, e);
  prune(now);
  return { failures, lockedForS: lockedForSeconds(key, now) };
}

export function recordSuccess(key: string): void {
  store.delete(key);
}

/** Zpoždění odpovědi po neúspěchu: 1 s, 2 s, 3 s, 4 s (roste s počtem chyb). */
export function failureDelayMs(failures: number): number {
  return Math.min(Math.max(failures, 1), 4) * 1000;
}

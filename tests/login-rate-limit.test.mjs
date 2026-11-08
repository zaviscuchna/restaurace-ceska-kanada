// Testy omezení pokusů o přihlášení. Spuštění: npm test (Node 22.18+ / 24, typy se odstraní za běhu).
import { test, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import * as rl from "../src/lib/login-rate-limit.ts";

const T0 = 1_800_000_000_000;
const MIN = 60 * 1000;
const h = (obj) => new Headers(obj);

beforeEach(() => {
  rl._resetForTests();
  mock.method(console, "warn", () => {}); // varování o globálním limitu v testech netřeba
});

test("IP z X-Forwarded-For: bere poslední položku (tu přidává Traefik)", () => {
  // Traefik v3.6 bez forwardedHeaders.insecure hlavičky od klienta maže a přidá jednu položku
  assert.equal(rl.getClientIp(h({ "x-forwarded-for": "203.0.113.7" })), "203.0.113.7");
  // Kdyby klientovi hlavičky prošly, podvržené položky jsou vlevo, Traefikova poslední
  assert.equal(rl.getClientIp(h({ "x-forwarded-for": "1.1.1.1, 6.6.6.6, 203.0.113.7" })), "203.0.113.7");
  assert.equal(rl.getClientIp(h({ "x-real-ip": "198.51.100.4" })), "198.51.100.4");
  assert.equal(rl.getClientIp(h({})), "neznama-ip");
});

test("IPv6 se seskupuje podle /64, IPv4 mapovaná na IPv4", () => {
  const a = rl.getClientIp(h({ "x-forwarded-for": "2001:db8:1:2:aaaa::1" }));
  const b = rl.getClientIp(h({ "x-forwarded-for": "2001:0db8:0001:0002:ffff:1:2:3" }));
  assert.equal(a, "2001:0db8:0001:0002::/64");
  assert.equal(a, b);
  assert.notEqual(a, rl.getClientIp(h({ "x-forwarded-for": "2001:db8:1:3::1" })));
  assert.equal(rl.normalizeIp("::ffff:192.0.2.9"), "192.0.2.9");
  assert.equal(rl.normalizeIp("::1"), "0000:0000:0000:0000::/64");
});

test("5 chyb z jedné IP ji zablokuje, jiná IP může dál", () => {
  for (let i = 1; i < rl.MAX_FAILURES; i++) {
    assert.equal(rl.checkLoginAllowed("10.0.0.1", T0).allowed, true);
    assert.equal(rl.recordFailure("10.0.0.1", T0).lockedForS, 0);
  }
  const last = rl.recordFailure("10.0.0.1", T0);
  assert.equal(last.lockedForS, 15 * 60);
  const gate = rl.checkLoginAllowed("10.0.0.1", T0 + 1000);
  assert.equal(gate.allowed, false);
  assert.equal(gate.reason, "ip");
  assert.equal(rl.checkLoginAllowed("10.0.0.2", T0 + 1000).allowed, true);
  // po 15 minutách smí znovu
  assert.equal(rl.checkLoginAllowed("10.0.0.1", T0 + 15 * MIN + 1).allowed, true);
});

test("úspěch vynuluje počítadlo IP", () => {
  for (let i = 0; i < rl.MAX_FAILURES - 1; i++) rl.recordFailure("10.0.0.3", T0);
  rl.recordSuccess("10.0.0.3", T0);
  for (let i = 0; i < rl.MAX_FAILURES - 1; i++) rl.recordFailure("10.0.0.3", T0);
  assert.equal(rl.checkLoginAllowed("10.0.0.3", T0).allowed, true);
});

test("zamčený záznam se nesmaže ani při zahlcení paměti jinými IP", () => {
  for (let i = 0; i < rl.MAX_FAILURES; i++) rl.recordFailure("10.9.9.9", T0);
  assert.equal(rl.checkLoginAllowed("10.9.9.9", T0).reason, "ip");
  // Zahlcení: MAX_ENTRIES + 500 různých IP po jedné chybě
  for (let i = 0; i < rl.MAX_ENTRIES + 500; i++) {
    rl.recordFailure(`172.16.${(i >> 8) & 255}.${i & 255}-${i}`, T0 + 1000);
  }
  assert.ok(rl._stats().entries <= rl.MAX_ENTRIES);
  const gate = rl.checkLoginAllowed("10.9.9.9", T0 + 2000);
  assert.equal(gate.allowed, false);
  assert.equal(gate.reason, "ip");
});

test("plná paměť samých zámků: nová IP se odmítne, nepustí se nesledovaně", () => {
  rl.recordSuccess("192.0.2.200", T0 - MIN); // důvěryhodná IP klienta
  for (let i = 0; i < rl.MAX_ENTRIES; i++) {
    for (let j = 0; j < rl.MAX_FAILURES; j++) rl.recordFailure(`ip-${i}`, T0);
  }
  assert.equal(rl._stats().entries, rl.MAX_ENTRIES);
  const gate = rl.checkLoginAllowed("198.51.100.77", T0 + 1000);
  assert.equal(gate.allowed, false);
  // důvěryhodná IP projde (strop smí mírně překročit)
  assert.equal(rl.checkLoginAllowed("192.0.2.200", T0 + 1000).allowed, true);
});

test("globální limit: 30 chyb z různých IP zavře přihlášení, důvěryhodná IP projde", () => {
  rl.recordSuccess("192.0.2.10", T0 - MIN);
  for (let i = 0; i < rl.GLOBAL_MAX_FAILURES; i++) rl.recordFailure(`10.1.0.${i}`, T0);
  const gate = rl.checkLoginAllowed("10.2.0.1", T0 + 1000);
  assert.equal(gate.allowed, false);
  assert.equal(gate.reason, "global");
  assert.equal(rl.checkLoginAllowed("192.0.2.10", T0 + 1000).allowed, true);
  // po 15 minutách se otevře
  assert.equal(rl.checkLoginAllowed("10.2.0.1", T0 + 15 * MIN + 1).allowed, true);
});

test("jedna IP sama globální limit nespustí", () => {
  for (let round = 0; round < 10; round++) {
    const now = T0 + round * 16 * MIN;
    for (let i = 0; i < rl.MAX_FAILURES; i++) {
      if (rl.checkLoginAllowed("10.3.0.1", now).allowed) rl.recordFailure("10.3.0.1", now);
    }
  }
  assert.ok(rl._stats().globalFailures < rl.GLOBAL_MAX_FAILURES);
  assert.equal(rl.checkLoginAllowed("10.3.0.2", T0 + 200 * MIN).allowed, true);
});

test("zpoždění po chybě roste 1-4 s", () => {
  assert.deepEqual([1, 2, 3, 4, 5, 9].map(rl.failureDelayMs), [1000, 2000, 3000, 4000, 4000, 4000]);
});

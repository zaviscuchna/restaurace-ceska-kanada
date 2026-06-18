#!/usr/bin/env node
// Nastaví is_active=true pro jídla z aktuálního jídelníčku, zbytek deaktivuje.
// Použití: node scripts/set-active-menu.mjs [--apply]
//   bez --apply = dry run (jen vypíše co by udělal)
//   --apply     = skutečně změní PocketBase

import { readFileSync } from "fs";

// ── Config ───────────────────────────────────────────────────────────────────
let PB_URL, PB_EMAIL, PB_PASSWORD;
try {
  const env = readFileSync(".env.local", "utf8");
  const get = (k) => env.match(new RegExp(`^${k}=(.+)`, "m"))?.[1]?.trim();
  PB_URL      = get("NEXT_PUBLIC_PB_URL");
  PB_EMAIL    = get("PB_ADMIN_EMAIL");
  PB_PASSWORD = get("PB_ADMIN_PASSWORD");
} catch {
  PB_URL      = process.env.NEXT_PUBLIC_PB_URL;
  PB_EMAIL    = process.env.PB_ADMIN_EMAIL;
  PB_PASSWORD = process.env.PB_ADMIN_PASSWORD;
}

const DRY_RUN = !process.argv.includes("--apply");

// ── Jídla z jídelníčku (klíčová slova — všechna musí být v názvu) ────────────
// Normalizujeme na lowercase bez diakritiky pro matching
const MENU_PATTERNS = [
  // Polévky
  ["drst"],                           // Dršťková
  ["drzt"],                           // dřžťková (překlep v DB)
  // Hlavní jídla
  ["hovezi", "koprova"],              // Hovězí vařené, koprová omáčka
  ["vejce", "koprova"],               // 2ks Vejce, koprová omáčka
  ["vepro", "cesnek"],                // Vepřové dušené na česneku
  ["spagety", "veprov"],              // Špagety s vepřovým masem (ne Boloňské)
  ["vypecky", "zeli"],                // Vepřové výpečky, zelí kysané
  ["krkovic"],                        // Uzená krkovička / krkovice
  ["kureci", "thaj"],                 // Kuřecí maso po thajsku
  ["francouzske"],                    // Francouzské brambory
  ["smazen", "kvetak"],              // Smažený květák (ne květáková polévka)
  ["smazen", "syr"],                  // Smažený sýr
  ["boruvkov"],                       // Kynuté borůvkové knedlíky
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function normalize(s) {
  return s.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")  // diakritika pryč
    .replace(/[^a-z0-9]/g, " ");
}

function matchesAnyPattern(dish) {
  const n = normalize(dish.name + " " + (dish.description ?? ""));
  return MENU_PATTERNS.some(keywords => keywords.every(k => n.includes(k)));
}

async function pbAuth() {
  const r = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: PB_EMAIL, password: PB_PASSWORD }),
  });
  if (!r.ok) throw new Error("PB auth selhal");
  return (await r.json()).token;
}

async function pbGetAll(token) {
  const r = await fetch(`${PB_URL}/api/collections/dishes/records?perPage=500`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return (await r.json()).items ?? [];
}

async function pbPatch(token, id, data) {
  const r = await fetch(`${PB_URL}/api/collections/dishes/records/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(`PATCH ${id} selhal: ${r.status}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
const token = await pbAuth();
const dishes = await pbGetAll(token);

const toActivate = dishes.filter(d => matchesAnyPattern(d));
const toDeactivate = dishes.filter(d => !matchesAnyPattern(d));

console.log(`\n${"─".repeat(60)}`);
console.log(DRY_RUN ? "DRY RUN — bez --apply se nic nemění\n" : "APPLY MODE — měním PocketBase\n");

console.log(`✓ AKTIVOVAT (${toActivate.length}):`);
toActivate.forEach(d => console.log(`  + ${d.name}${d.description ? ` [${d.description}]` : ""}`));

console.log(`\n✗ DEAKTIVOVAT (${toDeactivate.length}):`);
toDeactivate.forEach(d => console.log(`  - ${d.name}`));

// Kontrola: jídla z lístku která NEBYLA nalezena
const foundCount = toActivate.length;
const expectedCount = MENU_PATTERNS.length;
if (foundCount < expectedCount) {
  console.log(`\n⚠️  Nalezeno jen ${foundCount}/${expectedCount} jídel z lístku — zkontroluj názvy výše.`);
}

console.log(`${"─".repeat(60)}\n`);

if (DRY_RUN) {
  console.log("Spusť s --apply pro provedení změn:\n  node scripts/set-active-menu.mjs --apply\n");
  process.exit(0);
}

// Aplikuj změny
let ok = 0, err = 0;
for (const d of dishes) {
  const shouldBeActive = matchesAnyPattern(d);
  if (d.is_active === shouldBeActive) continue; // already correct
  try {
    await pbPatch(token, d.id, { is_active: shouldBeActive });
    ok++;
  } catch (e) {
    console.error(`  Chyba u "${d.name}": ${e.message}`);
    err++;
  }
}

console.log(`Hotovo: ${ok} změn, ${err} chyb.\n`);

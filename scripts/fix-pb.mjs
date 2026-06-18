/**
 * Opraví PB pravidla + přidá chybějící jídla z Excelu.
 */
import { readFileSync } from "fs";
import { resolve } from "path";

const envFile = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
const env = Object.fromEntries(
  envFile.split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0,i).trim(), l.slice(i+1).trim()]; })
);

const PB_URL = env.NEXT_PUBLIC_PB_URL;
const EMAIL = env.PB_ADMIN_EMAIL;
const PASSWORD = env.PB_ADMIN_PASSWORD;

let token;
async function pb(method, path, data) {
  const res = await fetch(`${PB_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { "Authorization": `Bearer ${token}` } : {}) },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
  if (res.status === 204) return null;
  const json = await res.json();
  if (!res.ok) throw new Error(`${res.status}: ${json.message}`);
  return json;
}

// Auth
const auth = await pb("POST", "/api/collections/_superusers/auth-with-password", { identity: EMAIL, password: PASSWORD });
token = auth.token;
console.log("✓ Auth ok");

// 1. Nastav veřejné list/view pravidla pro všechny kolekce
for (const [name, id] of [["categories","pbc_3292755704"],["dishes","pbc_1868475923"],["daily_menu","pbc_3350402454"]]) {
  await pb("PATCH", `/api/collections/${id}`, { listRule: "", viewRule: "" });
  console.log(`✓ ${name} — list/view otevřeno`);
}

// 2. Přidej chybějící jídla
const cats = await pb("GET", "/api/collections/categories/records?perPage=50");
const catMap = Object.fromEntries((cats.items ?? []).map(c => [c.name, c.id]));
const hlavniId = catMap["Hlavní jídla"];

const chybejici = [
  { name: "Tatarák z hovězího masa", description: "každý pátek", price: "", allergens: [3, 10], category: hlavniId, is_active: true },
  { name: "Pečené prase", description: "čtvrtek, sobota", price: "", allergens: [], category: hlavniId, is_active: true },
];

for (const d of chybejici) {
  try {
    const r = await pb("POST", "/api/collections/dishes/records", d);
    console.log(`✓ Přidáno: ${r.name}`);
  } catch (e) {
    console.error(`✗ Chyba: ${d.name} —`, e.message);
  }
}

// 3. Ověř celkový počet
const total = await pb("GET", "/api/collections/dishes/records?perPage=1");
console.log(`\n🎉 Celkem jídel v databázi: ${total.totalItems}`);

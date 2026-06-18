/**
 * Spusť po prvním nasazení PocketBase:
 *   node scripts/setup-pb.mjs <PB_URL> <ADMIN_EMAIL> <ADMIN_PASSWORD>
 *
 * Vytvoří kolekce: categories, dishes, daily_menu
 */

import PocketBase from "pocketbase";

const [, , PB_URL, EMAIL, PASSWORD] = process.argv;
if (!PB_URL || !EMAIL || !PASSWORD) {
  console.error("Použití: node scripts/setup-pb.mjs <URL> <email> <heslo>");
  process.exit(1);
}

const pb = new PocketBase(PB_URL);
await pb.admins.authWithPassword(EMAIL, PASSWORD);

async function createCollection(schema) {
  const existing = await pb.collections.getList(1, 100);
  if (existing.items.find((c) => c.name === schema.name)) {
    console.log(`✓ ${schema.name} — již existuje`);
    return;
  }
  await pb.collections.create(schema);
  console.log(`✓ ${schema.name} — vytvořeno`);
}

// Kategorie
await createCollection({
  name: "categories",
  type: "base",
  schema: [
    { name: "name", type: "text", required: true },
    { name: "order", type: "number", required: true },
  ],
});

// Jídla
await createCollection({
  name: "dishes",
  type: "base",
  schema: [
    { name: "name", type: "text", required: true },
    { name: "description", type: "text" },
    { name: "price", type: "text", required: true },
    { name: "photo", type: "file", options: { maxSelect: 1, maxSize: 5242880, mimeTypes: ["image/jpeg", "image/png", "image/webp"] } },
    { name: "allergens", type: "json" },
    { name: "category", type: "relation", required: true, options: { collectionId: "_categories_", maxSelect: 1 } },
    { name: "is_active", type: "bool", required: true },
  ],
});

// Denní menu
await createCollection({
  name: "daily_menu",
  type: "base",
  schema: [
    { name: "date", type: "text", required: true },
    { name: "note", type: "text" },
    { name: "dishes", type: "relation", options: { collectionId: "_dishes_", maxSelect: 999 } },
  ],
});

// Základní kategorie
const cats = await pb.collection("categories").getFullList();
if (cats.length === 0) {
  for (const [i, name] of ["Polévky", "Hlavní jídla", "K pivu", "Dezerty"].entries()) {
    await pb.collection("categories").create({ name, order: i + 1 });
  }
  console.log("✓ Základní kategorie vytvořeny");
}

console.log("\n🎉 PocketBase je připraven!");
console.log(`Admin panel: ${PB_URL}/_/`);

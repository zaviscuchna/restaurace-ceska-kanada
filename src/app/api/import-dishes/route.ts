import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/admin-session";
import { COOKIE_NAME } from "../admin/login/route";

type ImportDish = {
  name: string;
  description: string;
  price: string;
  allergens: number[];
  category: "soup" | "main";
};

async function pbFetch(pbUrl: string, token: string, path: string, options?: RequestInit) {
  const res = await fetch(`${pbUrl}${path}`, {
    cache: "no-store",
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      ...(options?.method === "POST" ? { "Content-Type": "application/json" } : {}),
      ...(options?.headers as Record<string, string> ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`PB ${res.status}: ${err.message ?? res.statusText}`);
  }
  return res.json();
}

export async function POST(req: NextRequest) {
  if (!verifySession(req.cookies.get(COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pbUrl = process.env.NEXT_PUBLIC_PB_URL;
  const email = process.env.PB_ADMIN_EMAIL;
  const password = process.env.PB_ADMIN_PASSWORD;

  if (!pbUrl || !email || !password) {
    return NextResponse.json({ error: "PB credentials not configured" }, { status: 500 });
  }

  try {
    const { dishes }: { dishes: ImportDish[] } = await req.json();

    // Auth
    const authRes = await fetch(`${pbUrl}/api/collections/_superusers/auth-with-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identity: email, password }),
    });
    if (!authRes.ok) throw new Error("PB auth failed");
    const { token } = await authRes.json();

    // Kategorie
    const catsData = await pbFetch(pbUrl, token, "/api/collections/categories/records?perPage=50");
    console.log("Kategorie načteny:", catsData.items?.length);
    const catMap: Record<string, string> = {};
    (catsData.items ?? []).forEach((c: { name: string; id: string }) => { catMap[c.name] = c.id; });
    const soupCatId = catMap["Polévky"] ?? catsData.items?.[0]?.id;
    const mainCatId = catMap["Hlavní jídla"] ?? catsData.items?.[1]?.id;

    // Existující jídla
    const existingData = await pbFetch(pbUrl, token, "/api/collections/dishes/records?perPage=500");
    console.log("Existující jídla:", existingData.items?.length);
    const existingNames = new Set<string>((existingData.items ?? []).map((d: { name: string }) => d.name));

    let imported = 0, skipped = 0, errors = 0;

    for (const d of dishes) {
      if (existingNames.has(d.name)) { skipped++; continue; }
      try {
        await pbFetch(pbUrl, token, "/api/collections/dishes/records", {
          method: "POST",
          body: JSON.stringify({
            name: d.name,
            description: d.description,
            price: d.price,
            allergens: d.allergens,
            category: d.category === "soup" ? soupCatId : mainCatId,
            is_active: true,
          }),
        });
        existingNames.add(d.name);
        imported++;
      } catch (e) {
        console.error("Dish error:", d.name, e instanceof Error ? e.message : e);
        errors++;
      }
    }

    return NextResponse.json({ imported, skipped, errors });
  } catch (e) {
    console.error("Import route error:", e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

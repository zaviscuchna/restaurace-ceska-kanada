import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/admin-session";
import { COOKIE_NAME } from "../login/route";

async function getPbToken() {
  const pbUrl = process.env.NEXT_PUBLIC_PB_URL!;
  const res = await fetch(`${pbUrl}/api/collections/_superusers/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: process.env.PB_ADMIN_EMAIL, password: process.env.PB_ADMIN_PASSWORD }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("PB auth failed");
  const { token } = await res.json();
  return { pbUrl, token };
}

export async function POST(req: NextRequest) {
  if (!verifySession(req.cookies.get(COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { date, note, dishes } = await req.json();
    const { pbUrl, token } = await getPbToken();
    const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

    // Zkontroluj jestli záznam pro dnešek existuje
    const searchRes = await fetch(
      `${pbUrl}/api/collections/daily_menu/records?filter=date%3D%22${date}%22&fields=id`,
      { headers, cache: "no-store" }
    );
    const searchData = await searchRes.json();
    const existing = searchData.items?.[0];

    const body = JSON.stringify({ date, note: note ?? "", dishes });

    const res = existing
      ? await fetch(`${pbUrl}/api/collections/daily_menu/records/${existing.id}`, { method: "PATCH", headers, body, cache: "no-store" })
      : await fetch(`${pbUrl}/api/collections/daily_menu/records`, { method: "POST", headers, body, cache: "no-store" });

    const data = await res.json();
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

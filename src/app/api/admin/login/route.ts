import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, SESSION_COOKIE_OPTS, signSession } from "@/lib/admin-session";

export async function POST(req: NextRequest) {
  const { pin } = await req.json().catch(() => ({ pin: "" }));
  const ADMIN_PIN = process.env.ADMIN_PIN ?? "";

  if (!ADMIN_PIN || typeof pin !== "string" || pin !== ADMIN_PIN) {
    return NextResponse.json({ error: "Nesprávný PIN" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, signSession(), SESSION_COOKIE_OPTS);
  return res;
}

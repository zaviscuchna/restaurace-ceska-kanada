import { NextRequest, NextResponse } from "next/server";
import { signSession } from "@/lib/admin-session";

const COOKIE_NAME = "ck_admin";
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: false,
  maxAge: 8 * 60 * 60,
  path: "/",
};

export async function POST(req: NextRequest) {
  const { pin } = await req.json().catch(() => ({ pin: "" }));
  const ADMIN_PIN = process.env.ADMIN_PIN ?? "";

  if (!ADMIN_PIN || typeof pin !== "string" || pin !== ADMIN_PIN) {
    return NextResponse.json({ error: "Nesprávný PIN" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, signSession(), COOKIE_OPTS);
  return res;
}

export { COOKIE_NAME };

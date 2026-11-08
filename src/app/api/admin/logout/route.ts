import { NextResponse } from "next/server";
import { COOKIE_NAME, SESSION_COOKIE_OPTS } from "@/lib/admin-session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", { ...SESSION_COOKIE_OPTS, maxAge: 0 });
  return res;
}

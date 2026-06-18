import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/admin-session";
import { COOKIE_NAME } from "../login/route";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!verifySession(token)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}

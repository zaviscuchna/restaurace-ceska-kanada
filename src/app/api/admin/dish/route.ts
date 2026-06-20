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

function authHeaders(token: string) {
  return { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };
}

function checkSession(req: NextRequest) {
  return verifySession(req.cookies.get(COOKIE_NAME)?.value);
}

// CREATE
export async function POST(req: NextRequest) {
  if (!checkSession(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const { pbUrl, token } = await getPbToken();
    const res = await fetch(`${pbUrl}/api/collections/dishes/records`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ ...body, allergens: JSON.stringify(body.allergens ?? []) }),
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// UPDATE
export async function PATCH(req: NextRequest) {
  if (!checkSession(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id, ...body } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const { pbUrl, token } = await getPbToken();
    const res = await fetch(`${pbUrl}/api/collections/dishes/records/${id}`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ ...body, allergens: JSON.stringify(body.allergens ?? []) }),
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// DELETE
export async function DELETE(req: NextRequest) {
  if (!checkSession(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const { pbUrl, token } = await getPbToken();
    const res = await fetch(`${pbUrl}/api/collections/dishes/records/${id}`, {
      method: "DELETE",
      headers: authHeaders(token),
      cache: "no-store",
    });
    return NextResponse.json({ ok: res.ok }, { status: res.status === 204 ? 200 : res.status });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

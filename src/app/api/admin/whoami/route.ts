import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdmin } from "@/lib/getAdmin";
import { getStaffNames, WHO_COOKIE } from "@/lib/adminStaff";

export async function POST(req: Request) {
  if (!(await getAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await req.json();
  const names = await getStaffNames();
  if (typeof name !== "string" || !names.includes(name)) {
    return NextResponse.json({ error: "Unknown name" }, { status: 400 });
  }

  (await cookies()).set(WHO_COOKIE, name, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 hours: pick again each day
  });

  return NextResponse.json({ ok: true });
}

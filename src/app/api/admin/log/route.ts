import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/getAdmin";
import { logActivity } from "@/lib/logActivity";
import { getActingName } from "@/lib/adminStaff";

// e.g. order.status_changed, product.updated, discount.created
const ACTION_FORMAT = /^[a-z_]+\.[a-z_]+$/;

export async function POST(req: Request) {
  const user = await getAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (
    typeof body.action !== "string" ||
    !ACTION_FORMAT.test(body.action) ||
    !body.entityType ||
    body.entityId == null
  ) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  // The admin's name comes from the session, never from the browser
  const name =
    (await getActingName()) ??
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split("@")[0] ??
    "Admin";

  await logActivity({
    admin: { id: user.id, name },
    action: body.action,
    entityType: body.entityType,
    entityId: body.entityId,
    entityLabel: body.entityLabel,
    details: body.details,
  });

  return NextResponse.json({ ok: true });
}
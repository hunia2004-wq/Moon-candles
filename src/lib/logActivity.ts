// lib/logActivity.ts
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server only
);

type LogInput = {
  admin: { id: string; name: string };
  action: string;
  entityType: string;
  entityId: string | number;
  entityLabel?: string;
  details?: Record<string, unknown>;
};

export async function logActivity(input: LogInput) {
  const { error } = await supabaseAdmin.from("admin_activity_log").insert({
    admin_id: input.admin.id,
    admin_name: input.admin.name,
    action: input.action,
    entity_type: input.entityType,
    entity_id: String(input.entityId),
    entity_label: input.entityLabel ?? null,
    details: input.details ?? {},
  });
  // Never let a logging failure break the actual admin action
  if (error) console.error("Activity log failed:", error);
}
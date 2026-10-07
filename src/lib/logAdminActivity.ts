export function logAdminActivity(input: {
  action: string;
  entityType: string;
  entityId: string;
  entityLabel?: string;
  details?: Record<string, unknown>;
}) {
  // Fire and forget: a logging hiccup should never block the admin
  fetch("/api/admin/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    keepalive: true,
  }).catch(() => {});
}
export function diffFields(
  before: Record<string, any> | null | undefined,
  after: Record<string, any>
) {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of Object.keys(after)) {
    if (JSON.stringify(before?.[key]) !== JSON.stringify(after[key])) {
      changes[key] = { from: before?.[key] ?? null, to: after[key] };
    }
  }
  return changes;
}
function stable(v: any): any {
  if (Array.isArray(v)) return v.map(stable);
  if (v && typeof v === "object") {
    return Object.keys(v).sort().reduce((o: any, k) => {
      if (v[k] !== undefined) o[k] = stable(v[k]);
      return o;
    }, {});
  }
  return v;
}

export function sameJson(a: unknown, b: unknown) {
  return JSON.stringify(stable(a)) === JSON.stringify(stable(b));
}

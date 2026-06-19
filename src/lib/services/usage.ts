import { createClient } from "@/lib/supabase/server";

export async function trackEvent(
  tenantId: string,
  profileId: string | null,
  eventType: string,
  payload: Record<string, unknown> = {}
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("usage_events").insert({
    tenant_id: tenantId,
    profile_id: profileId,
    event_type: eventType,
    payload,
  });
}

import { createClient } from "@/lib/supabase/server";
import type { MentorWithProfile } from "@/types/database";

export async function getMentors(tenantId: string): Promise<MentorWithProfile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mentors")
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching mentors:", error);
    return [];
  }

  return (data || []) as unknown as MentorWithProfile[];
}

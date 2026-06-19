import { createClient } from "@/lib/supabase/server";
import type { Membership, MembershipWithProfile } from "@/types/database";

export async function getMembership(
  tenantId: string,
  profileId: string
): Promise<Membership | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memberships")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("profile_id", profileId)
    .single();

  if (error) {
    return null;
  }
  return data as Membership;
}

export async function getMembers(tenantId: string): Promise<MembershipWithProfile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memberships")
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching members:", error);
    return [];
  }
  return (data || []) as unknown as MembershipWithProfile[];
}

export async function updateRole(
  membershipId: string,
  role: string
): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("memberships")
    .update({ role })
    .eq("id", membershipId);
  return !error;
}

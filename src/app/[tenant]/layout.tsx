import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import type { Tenant, Profile, Membership } from "@/types/database";

interface TenantLayoutProps {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}

export default async function TenantLayout({ children, params }: TenantLayoutProps) {
  const { tenant: tenantSlug } = await params;
  const supabase = await createClient();

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get tenant
  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", tenantSlug)
    .single();

  if (!tenant) {
    redirect("/auth/login");
  }

  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/auth/login");
  }

  // Get membership
  const { data: membership } = await supabase
    .from("memberships")
    .select("*")
    .eq("tenant_id", tenant.id)
    .eq("profile_id", user.id)
    .single();

  if (!membership) {
    redirect("/auth/login");
  }

  return (
    <AppShell
      tenant={tenant as Tenant}
      profile={profile as Profile}
      membership={membership as Membership}
    >
      {children}
    </AppShell>
  );
}

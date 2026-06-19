import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { DEFAULT_TENANT_SLUG } from "@/lib/constants";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data: authData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && authData.user) {
      await ensureMembership(authData.user.id);
      return NextResponse.redirect(`${origin}/${DEFAULT_TENANT_SLUG}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=Could not authenticate`);
}

async function ensureMembership(userId: string) {
  const admin = createServiceClient();

  const { data: tenant } = await admin
    .from("tenants")
    .select("id")
    .eq("slug", DEFAULT_TENANT_SLUG)
    .single();

  if (!tenant) return;

  await admin.from("memberships").upsert(
    { tenant_id: tenant.id, profile_id: userId, role: "student" },
    { onConflict: "tenant_id,profile_id", ignoreDuplicates: true }
  );
}

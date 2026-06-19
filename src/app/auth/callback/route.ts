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
      await ensureProfileAndMembership(authData.user);
      return NextResponse.redirect(`${origin}/${DEFAULT_TENANT_SLUG}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=Could not authenticate`);
}

async function ensureProfileAndMembership(user: { id: string; email?: string; user_metadata?: Record<string, unknown> }) {
  const admin = createServiceClient();

  const email = user.email || "";
  const fullName = (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || "";

  await admin.from("profiles").upsert(
    { id: user.id, email, full_name: fullName },
    { onConflict: "id" }
  );

  const { data: tenant } = await admin
    .from("tenants")
    .select("id")
    .eq("slug", DEFAULT_TENANT_SLUG)
    .single();

  if (!tenant) return;

  await admin.from("memberships").upsert(
    { tenant_id: tenant.id, profile_id: user.id, role: "student" },
    { onConflict: "tenant_id,profile_id", ignoreDuplicates: true }
  );
}

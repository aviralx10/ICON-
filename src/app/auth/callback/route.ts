import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TENANT_SLUG } from "@/lib/constants";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data: authData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && authData.user) {
      const userId = authData.user.id;
      const email = authData.user.email || "";

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .single();

      if (!existingProfile) {
        // Create profile
        await supabase.from("profiles").insert({
          id: userId,
          email,
          full_name: email.split("@")[0],
        });

        // Get default tenant (ICON)
        const { data: tenant } = await supabase
          .from("tenants")
          .select("id")
          .eq("slug", DEFAULT_TENANT_SLUG)
          .single();

        if (tenant) {
          // Create default student membership
          await supabase.from("memberships").insert({
            tenant_id: tenant.id,
            profile_id: userId,
            role: "student",
          });
        }
      }

      return NextResponse.redirect(`${origin}/${DEFAULT_TENANT_SLUG}`);
    }
  }

  // If something went wrong, redirect to login with error
  return NextResponse.redirect(`${origin}/auth/login?error=Could not authenticate`);
}

"use server";

import { redirect } from "next/navigation";
import { IIMB_EMAIL_DOMAIN } from "@/lib/constants";

export async function signInWithEmail(formData: FormData) {
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Email is required" };
  }

  if (!email.endsWith(IIMB_EMAIL_DOMAIN)) {
    return { error: "Only @iimb.ac.in email addresses are allowed" };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  if (!supabaseUrl || !anonKey) {
    return { error: "Missing Supabase env vars on server" };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const result = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (result.error) {
      return {
        error: result.error.message || `Status ${result.error.status}`,
      };
    }

    return { success: true };
  } catch (err: unknown) {
    let msg = "Unknown error";
    if (err instanceof Error) {
      msg = err.message;
    } else if (typeof err === "string") {
      msg = err;
    } else {
      try {
        msg = JSON.stringify(err);
      } catch {
        msg = String(err);
      }
    }
    return { error: msg };
  }
}

export async function signOut() {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

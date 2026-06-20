"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { IIMB_EMAIL_DOMAIN } from "@/lib/constants";

export async function signInWithEmail(formData: FormData) {
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Email is required" };
  }

  if (!email.endsWith(IIMB_EMAIL_DOMAIN)) {
    return { error: "Only @iimb.ac.in email addresses are allowed" };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (error) {
      return { error: error.message || error.status?.toString() || JSON.stringify(error) };
    }

    return { success: true };
  } catch (err) {
    if (err instanceof Error) {
      return { error: `${err.name}: ${err.message}` };
    }
    return { error: `Unexpected error: ${JSON.stringify(err)}` };
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

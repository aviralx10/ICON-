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

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

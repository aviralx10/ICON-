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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return { error: "Server config error: NEXT_PUBLIC_SUPABASE_URL is not set" };
  }

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    return { error: "Server config error: NEXT_PUBLIC_SUPABASE_ANON_KEY is not set" };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  let supabase;
  try {
    supabase = await createClient();
  } catch (err) {
    return { error: `Failed to create Supabase client: ${String(err)}` };
  }

  try {
    const result = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (result.error) {
      return {
        error: result.error.message
          || `Auth error (status ${result.error.status}): ${result.error.name}`
      };
    }

    return { success: true };
  } catch (err) {
    const details = err instanceof Error
      ? `${err.name}: ${err.message}`
      : `(non-Error) keys: ${Object.keys(err as object).join(",")}, str: ${String(err)}`;
    return { error: `OTP request failed — ${details}` };
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

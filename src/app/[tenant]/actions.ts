"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createCase, updateCase, retireCase } from "@/lib/services/cases";
import { createCategory, updateCategory } from "@/lib/services/categories";
import { createCompany } from "@/lib/services/companies";
import { updateRole } from "@/lib/services/memberships";
import { trackEvent } from "@/lib/services/usage";
import type { ContentType, DifficultyLevel, PlacementSource } from "@/types/database";

export async function createCaseAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const tenantId = formData.get("tenant_id") as string;
  const title = formData.get("title") as string;
  const contentKind = (formData.get("content_kind") as string) || "case";
  const categoryId = formData.get("category_id") as string;
  const difficulty = formData.get("difficulty") as string;
  const isNumerical = formData.get("is_numerical") === "true";
  const section = formData.get("section") as string;
  const source = formData.get("source") as string;
  const prompt = formData.get("prompt") as string;
  const frameworksStr = formData.get("frameworks") as string;
  const tagsStr = formData.get("tags") as string;
  const status = formData.get("status") as string;
  const companyIdsStr = formData.get("company_ids") as string;

  const frameworks = frameworksStr ? frameworksStr.split(",").map((f) => f.trim()).filter(Boolean) : [];
  const tags = tagsStr ? tagsStr.split(",").map((t) => t.trim()).filter(Boolean) : [];
  const companyIds = companyIdsStr ? companyIdsStr.split(",").filter(Boolean) : [];

  const result = await createCase({
    tenant_id: tenantId,
    title,
    content_kind: (contentKind as ContentType) || undefined,
    category_id: categoryId || undefined,
    difficulty: (difficulty as DifficultyLevel) || undefined,
    is_numerical: isNumerical,
    section: section || undefined,
    source: (source as PlacementSource) || undefined,
    prompt: prompt || undefined,
    frameworks,
    tags,
    status: status || "draft",
    created_by: user.id,
    company_ids: companyIds,
  });

  if (!result) return { error: "Failed to create case" };

  const { data: tenant } = await supabase.from("tenants").select("slug").eq("id", tenantId).single();
  revalidatePath(`/${tenant?.slug}`);
  return { success: true, id: result.id };
}

export async function updateCaseAction(formData: FormData) {
  const caseId = formData.get("case_id") as string;
  const title = formData.get("title") as string;
  const contentKind = (formData.get("content_kind") as string) || "case";
  const categoryId = formData.get("category_id") as string;
  const difficulty = formData.get("difficulty") as string;
  const isNumerical = formData.get("is_numerical") === "true";
  const section = formData.get("section") as string;
  const source = formData.get("source") as string;
  const prompt = formData.get("prompt") as string;
  const frameworksStr = formData.get("frameworks") as string;
  const tagsStr = formData.get("tags") as string;
  const status = formData.get("status") as string;
  const companyIdsStr = formData.get("company_ids") as string;
  const tenantSlug = formData.get("tenant_slug") as string;

  const frameworks = frameworksStr ? frameworksStr.split(",").map((f) => f.trim()).filter(Boolean) : [];
  const tags = tagsStr ? tagsStr.split(",").map((t) => t.trim()).filter(Boolean) : [];
  const companyIds = companyIdsStr ? companyIdsStr.split(",").filter(Boolean) : [];

  const result = await updateCase(caseId, {
    title,
    content_kind: contentKind as ContentType,
    category_id: categoryId || null,
    difficulty: (difficulty as DifficultyLevel) || null,
    is_numerical: isNumerical,
    section: section || null,
    source: (source as PlacementSource) || null,
    prompt: prompt || null,
    frameworks,
    tags,
    status: status || "draft",
    company_ids: companyIds,
  });

  if (!result) return { error: "Failed to update case" };

  revalidatePath(`/${tenantSlug}`);
  return { success: true };
}

export async function retireCaseAction(formData: FormData) {
  const caseId = formData.get("case_id") as string;
  const tenantSlug = formData.get("tenant_slug") as string;

  const success = await retireCase(caseId);
  if (!success) return { error: "Failed to retire case" };

  revalidatePath(`/${tenantSlug}`);
  return { success: true };
}

export async function createCategoryAction(formData: FormData) {
  const tenantId = formData.get("tenant_id") as string;
  const name = formData.get("name") as string;
  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const tenantSlug = formData.get("tenant_slug") as string;

  const result = await createCategory(tenantId, name, slug);
  if (!result) return { error: "Failed to create category" };

  revalidatePath(`/${tenantSlug}`);
  return { success: true };
}

export async function updateCategoryAction(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const tenantSlug = formData.get("tenant_slug") as string;

  const result = await updateCategory(id, { name });
  if (!result) return { error: "Failed to update category" };

  revalidatePath(`/${tenantSlug}`);
  return { success: true };
}

export async function createCompanyAction(formData: FormData) {
  const tenantId = formData.get("tenant_id") as string;
  const name = formData.get("name") as string;
  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const tenantSlug = formData.get("tenant_slug") as string;

  const result = await createCompany(tenantId, name, slug);
  if (!result) return { error: "Failed to create company" };

  revalidatePath(`/${tenantSlug}`);
  return { success: true };
}

export async function updateMemberRoleAction(formData: FormData) {
  const membershipId = formData.get("membership_id") as string;
  const role = formData.get("role") as string;
  const tenantSlug = formData.get("tenant_slug") as string;

  const success = await updateRole(membershipId, role);
  if (!success) return { error: "Failed to update role" };

  revalidatePath(`/${tenantSlug}/admin`);
  return { success: true };
}

export async function trackEventAction(formData: FormData) {
  const tenantId = formData.get("tenant_id") as string;
  const profileId = formData.get("profile_id") as string;
  const eventType = formData.get("event_type") as string;
  const payloadStr = formData.get("payload") as string;
  const payload = payloadStr ? JSON.parse(payloadStr) : {};

  await trackEvent(tenantId, profileId, eventType, payload);
  return { success: true };
}

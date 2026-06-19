"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createCase, updateCase, retireCase } from "@/lib/services/cases";
import { createCategory, updateCategory } from "@/lib/services/categories";
import { createCompany } from "@/lib/services/companies";
import { updateRole } from "@/lib/services/memberships";
import { z } from "zod/v4";
import type { ContentType, DifficultyLevel, PlacementSource } from "@/types/database";

const caseSchema = z.object({
  tenant_id: z.uuid(),
  tenant_slug: z.string().min(1),
  title: z.string().min(1, "Title is required"),
  content_kind: z.enum(["case", "guesstimate", "industry_report", "framework"]).default("case"),
  category_id: z.string().optional(),
  difficulty: z.enum(["easy", "moderate", "challenging"]).optional(),
  is_numerical: z.boolean().default(false),
  section: z.string().optional(),
  source: z.enum(["final_2023_25", "summer_2024_26"]).optional(),
  prompt: z.string().optional(),
  frameworks: z.string().optional(),
  tags: z.string().optional(),
  status: z.enum(["draft", "published", "retired"]).default("draft"),
  company_ids: z.string().optional(),
});

function parseCaseForm(formData: FormData) {
  const raw = {
    tenant_id: formData.get("tenant_id") as string,
    tenant_slug: formData.get("tenant_slug") as string,
    title: formData.get("title") as string,
    content_kind: (formData.get("content_kind") as string) || "case",
    category_id: (formData.get("category_id") as string) || undefined,
    difficulty: (formData.get("difficulty") as string) || undefined,
    is_numerical: formData.get("is_numerical") === "true",
    section: (formData.get("section") as string) || undefined,
    source: (formData.get("source") as string) || undefined,
    prompt: (formData.get("prompt") as string) || undefined,
    frameworks: (formData.get("frameworks") as string) || undefined,
    tags: (formData.get("tags") as string) || undefined,
    status: (formData.get("status") as string) || "draft",
    company_ids: (formData.get("company_ids") as string) || undefined,
  };
  return caseSchema.safeParse(raw);
}

function splitCsv(s?: string): string[] {
  return s ? s.split(",").map((v) => v.trim()).filter(Boolean) : [];
}

export async function createCaseAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const parsed = parseCaseForm(formData);
  if (!parsed.success) return { error: z.prettifyError(parsed.error) };
  const v = parsed.data;

  const transcriptStr = formData.get("transcript") as string;
  const transcript = transcriptStr ? JSON.parse(transcriptStr) : [];

  const result = await createCase({
    tenant_id: v.tenant_id,
    title: v.title,
    content_kind: v.content_kind as ContentType,
    category_id: v.category_id || undefined,
    difficulty: (v.difficulty as DifficultyLevel) || undefined,
    is_numerical: v.is_numerical,
    section: v.section || undefined,
    source: (v.source as PlacementSource) || undefined,
    prompt: v.prompt || undefined,
    transcript,
    frameworks: splitCsv(v.frameworks),
    tags: splitCsv(v.tags),
    status: v.status || "draft",
    created_by: user.id,
    company_ids: splitCsv(v.company_ids),
  });

  if (!result) return { error: "Failed to create case" };

  revalidatePath(`/${v.tenant_slug}`);
  return { success: true, id: result.id };
}

export async function updateCaseAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const caseId = formData.get("case_id") as string;
  if (!caseId) return { error: "Missing case ID" };

  const parsed = parseCaseForm(formData);
  if (!parsed.success) return { error: z.prettifyError(parsed.error) };
  const v = parsed.data;

  const transcriptStr = formData.get("transcript") as string;
  const transcript = transcriptStr ? JSON.parse(transcriptStr) : [];

  const result = await updateCase(caseId, {
    title: v.title,
    content_kind: v.content_kind as ContentType,
    category_id: v.category_id || null,
    difficulty: (v.difficulty as DifficultyLevel) || null,
    is_numerical: v.is_numerical,
    section: v.section || null,
    source: (v.source as PlacementSource) || null,
    prompt: v.prompt || null,
    transcript,
    frameworks: splitCsv(v.frameworks),
    tags: splitCsv(v.tags),
    status: v.status || "draft",
    company_ids: splitCsv(v.company_ids),
  });

  if (!result) return { error: "Failed to update case" };

  revalidatePath(`/${v.tenant_slug}`);
  return { success: true };
}

export async function retireCaseAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const caseId = formData.get("case_id") as string;
  const tenantSlug = formData.get("tenant_slug") as string;
  if (!caseId || !tenantSlug) return { error: "Missing required fields" };

  const success = await retireCase(caseId);
  if (!success) return { error: "Failed to retire case" };

  revalidatePath(`/${tenantSlug}`);
  return { success: true };
}

export async function createCategoryAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const tenantId = formData.get("tenant_id") as string;
  const name = formData.get("name") as string;
  const tenantSlug = formData.get("tenant_slug") as string;

  if (!name || !tenantId) return { error: "Name and tenant are required" };

  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const result = await createCategory(tenantId, name, slug);
  if (!result) return { error: "Failed to create category" };

  revalidatePath(`/${tenantSlug}`);
  return { success: true };
}

export async function updateCategoryAction(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const tenantSlug = formData.get("tenant_slug") as string;

  if (!id || !name) return { error: "Missing required fields" };

  const result = await updateCategory(id, { name });
  if (!result) return { error: "Failed to update category" };

  revalidatePath(`/${tenantSlug}`);
  return { success: true };
}

export async function createCompanyAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const tenantId = formData.get("tenant_id") as string;
  const name = formData.get("name") as string;
  const tenantSlug = formData.get("tenant_slug") as string;

  if (!name || !tenantId) return { error: "Name and tenant are required" };

  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const result = await createCompany(tenantId, name, slug);
  if (!result) return { error: "Failed to create company" };

  revalidatePath(`/${tenantSlug}`);
  return { success: true };
}

export async function updateMemberRoleAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const membershipId = formData.get("membership_id") as string;
  const role = formData.get("role") as string;
  const tenantSlug = formData.get("tenant_slug") as string;

  if (!membershipId || !role) return { error: "Missing required fields" };

  const success = await updateRole(membershipId, role);
  if (!success) return { error: "Failed to update role" };

  revalidatePath(`/${tenantSlug}/admin`);
  return { success: true };
}

import { createClient } from "@/lib/supabase/server";
import type { Case, CaseWithRelations } from "@/types/database";

export interface CaseFilters {
  categories?: string[];
  companies?: string[];
  difficulty?: string;
  q?: string;
  status?: string;
  sort?: string;
}

export async function getCases(
  tenantId: string,
  filters: CaseFilters = {}
): Promise<CaseWithRelations[]> {
  const supabase = await createClient();

  let query = supabase
    .from("cases")
    .select(`
      *,
      category:categories(*),
      case_companies(company:companies(*)),
      created_by_profile:profiles!cases_created_by_fkey(*)
    `)
    .eq("tenant_id", tenantId);

  if (filters.status) {
    query = query.eq("status", filters.status);
  } else {
    query = query.eq("status", "published");
  }

  if (filters.categories && filters.categories.length > 0) {
    query = query.in("category_id", filters.categories);
  }

  if (filters.difficulty) {
    query = query.eq("difficulty", filters.difficulty);
  }

  if (filters.q) {
    query = query.textSearch("search_vector", filters.q, { type: "websearch" });
  }

  switch (filters.sort) {
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "popular":
      query = query.order("view_count", { ascending: false });
      break;
    case "title":
      query = query.order("title", { ascending: true });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching cases:", error);
    return [];
  }

  // Transform the nested case_companies into a flat companies array
  return (data || []).map((c) => {
    const caseData = c as Record<string, unknown>;
    const caseCompanies = (caseData.case_companies as Array<{ company: unknown }>) || [];
    return {
      ...caseData,
      companies: caseCompanies.map((cc) => cc.company),
      case_companies: undefined,
    } as unknown as CaseWithRelations;
  });
}

export async function getCase(id: string): Promise<CaseWithRelations | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cases")
    .select(`
      *,
      category:categories(*),
      case_companies(company:companies(*)),
      created_by_profile:profiles!cases_created_by_fkey(*)
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching case:", error);
    return null;
  }

  const caseData = data as Record<string, unknown>;
  const caseCompanies = (caseData.case_companies as Array<{ company: unknown }>) || [];

  return {
    ...caseData,
    companies: caseCompanies.map((cc) => cc.company),
    case_companies: undefined,
  } as unknown as CaseWithRelations;
}

export async function createCase(data: {
  tenant_id: string;
  title: string;
  description?: string;
  category_id?: string;
  difficulty?: string;
  sector?: string;
  tags?: string[];
  file_path?: string;
  file_name?: string;
  file_type?: string;
  status?: string;
  created_by?: string;
  company_ids?: string[];
}): Promise<Case | null> {
  const supabase = await createClient();
  const { company_ids, ...caseData } = data;

  const { data: newCase, error } = await supabase
    .from("cases")
    .insert(caseData)
    .select()
    .single();

  if (error) {
    console.error("Error creating case:", error);
    return null;
  }

  if (company_ids && company_ids.length > 0) {
    const caseCompanies = company_ids.map((company_id) => ({
      case_id: newCase.id,
      company_id,
    }));
    await supabase.from("case_companies").insert(caseCompanies);
  }

  return newCase as Case;
}

export async function updateCase(
  id: string,
  data: {
    title?: string;
    description?: string | null;
    category_id?: string | null;
    difficulty?: string | null;
    sector?: string | null;
    tags?: string[];
    file_path?: string | null;
    file_name?: string | null;
    file_type?: string | null;
    status?: string;
    company_ids?: string[];
  }
): Promise<Case | null> {
  const supabase = await createClient();
  const { company_ids, ...caseData } = data;

  const { data: updated, error } = await supabase
    .from("cases")
    .update(caseData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating case:", error);
    return null;
  }

  if (company_ids !== undefined) {
    await supabase.from("case_companies").delete().eq("case_id", id);
    if (company_ids.length > 0) {
      const caseCompanies = company_ids.map((company_id) => ({
        case_id: id,
        company_id,
      }));
      await supabase.from("case_companies").insert(caseCompanies);
    }
  }

  return updated as Case;
}

export async function retireCase(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("cases")
    .update({ status: "retired" })
    .eq("id", id);
  return !error;
}

export async function incrementViewCount(id: string): Promise<void> {
  const supabase = await createClient();

  // Simple increment approach
  const { data } = await supabase.from("cases").select("view_count").eq("id", id).single();
  if (data) {
    await supabase
      .from("cases")
      .update({ view_count: ((data.view_count as number) || 0) + 1 })
      .eq("id", id);
  }
}

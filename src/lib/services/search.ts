import { createClient } from "@/lib/supabase/server";
import type { CaseWithRelations } from "@/types/database";
import type { CaseFilters } from "./cases";

export async function searchCases(
  tenantId: string,
  query: string,
  filters: CaseFilters = {}
): Promise<CaseWithRelations[]> {
  const supabase = await createClient();

  // Try full-text search first
  let dbQuery = supabase
    .from("cases")
    .select(`
      *,
      category:categories(*),
      case_companies(company:companies(*)),
      created_by_profile:profiles!cases_created_by_fkey(*)
    `)
    .eq("tenant_id", tenantId)
    .eq("status", "published");

  if (filters.categories && filters.categories.length > 0) {
    dbQuery = dbQuery.in("category_id", filters.categories);
  }

  if (filters.difficulty) {
    dbQuery = dbQuery.eq("difficulty", filters.difficulty);
  }

  // Use text search on the search_vector column
  dbQuery = dbQuery.textSearch("search_vector", query, { type: "websearch" });

  const { data: tsResults, error: tsError } = await dbQuery;

  if (!tsError && tsResults && tsResults.length > 0) {
    return transformResults(tsResults);
  }

  // Fallback to trigram search on title
  const { data: trigramResults, error: trigramError } = await supabase
    .from("cases")
    .select(`
      *,
      category:categories(*),
      case_companies(company:companies(*)),
      created_by_profile:profiles!cases_created_by_fkey(*)
    `)
    .eq("tenant_id", tenantId)
    .eq("status", "published")
    .ilike("title", `%${query}%`)
    .limit(50);

  if (trigramError) {
    console.error("Search error:", trigramError);
    return [];
  }

  return transformResults(trigramResults || []);
}

function transformResults(data: unknown[]): CaseWithRelations[] {
  return data.map((c) => {
    const caseData = c as Record<string, unknown>;
    const caseCompanies = (caseData.case_companies as Array<{ company: unknown }>) || [];
    return {
      ...caseData,
      companies: caseCompanies.map((cc) => cc.company),
      case_companies: undefined,
    } as unknown as CaseWithRelations;
  });
}

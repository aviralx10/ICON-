import { createClient } from "@/lib/supabase/server";
import type { Company, CompanyWithCount } from "@/types/database";

export async function getCompanies(tenantId: string): Promise<Company[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching companies:", error);
    return [];
  }
  return data as Company[];
}

export async function getCompaniesWithCounts(tenantId: string): Promise<CompanyWithCount[]> {
  const supabase = await createClient();

  const { data: companies, error: companyError } = await supabase
    .from("companies")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("name", { ascending: true });

  if (companyError || !companies) {
    console.error("Error fetching companies:", companyError);
    return [];
  }

  // Get case counts per company
  const { data: counts, error: countError } = await supabase
    .from("case_companies")
    .select("company_id");

  if (countError) {
    return companies.map((c) => ({ ...c, case_count: 0 })) as CompanyWithCount[];
  }

  const countMap = new Map<string, number>();
  (counts || []).forEach((cc: { company_id: string }) => {
    countMap.set(cc.company_id, (countMap.get(cc.company_id) || 0) + 1);
  });

  return companies.map((c) => ({
    ...c,
    case_count: countMap.get(c.id) || 0,
  })) as CompanyWithCount[];
}

export async function createCompany(
  tenantId: string,
  name: string,
  slug: string
): Promise<Company | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .insert({ tenant_id: tenantId, name, slug })
    .select()
    .single();

  if (error) {
    console.error("Error creating company:", error);
    return null;
  }
  return data as Company;
}

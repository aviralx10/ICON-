import { createClient } from "@/lib/supabase/server";
import { getCases } from "@/lib/services/cases";
import { searchCases } from "@/lib/services/search";
import { getCategories } from "@/lib/services/categories";
import { getCompaniesWithCounts } from "@/lib/services/companies";
import { CaseGrid } from "@/components/case-grid";
import { FilterPanel } from "@/components/filter-panel";
import type { Tenant } from "@/types/database";
import { Suspense } from "react";

interface PageProps {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function TenantCasebookPage({ params, searchParams }: PageProps) {
  const { tenant: tenantSlug } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", tenantSlug)
    .single();

  if (!tenant) {
    return <div className="text-center py-16">Tenant not found</div>;
  }

  const tenantData = tenant as Tenant;

  const categoryFilter = sp.category
    ? Array.isArray(sp.category)
      ? sp.category
      : [sp.category]
    : [];
  const companyFilter = sp.company
    ? Array.isArray(sp.company)
      ? sp.company
      : [sp.company]
    : [];
  const query = typeof sp.q === "string" ? sp.q : "";
  const difficulty = typeof sp.difficulty === "string" ? sp.difficulty : "";
  const sort = typeof sp.sort === "string" ? sp.sort : "";

  const filters = {
    categories: categoryFilter,
    companies: companyFilter,
    difficulty: difficulty === "all" ? "" : difficulty,
    sort,
  };

  const [cases, categories, companies] = await Promise.all([
    query
      ? searchCases(tenantData.id, query, filters)
      : getCases(tenantData.id, filters),
    getCategories(tenantData.id),
    getCompaniesWithCounts(tenantData.id),
  ]);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <aside className="w-full lg:w-64 shrink-0">
        <div className="lg:sticky lg:top-24">
          <h3 className="font-semibold mb-4">Filters</h3>
          <Suspense fallback={null}>
            <FilterPanel categories={categories} companies={companies} />
          </Suspense>
        </div>
      </aside>

      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">
            Casebook
            {query && (
              <span className="text-muted-foreground font-normal text-base ml-2">
                Results for &ldquo;{query}&rdquo;
              </span>
            )}
          </h2>
          <span className="text-sm text-muted-foreground">{cases.length} cases</span>
        </div>

        <CaseGrid cases={cases} tenantSlug={tenantSlug} />
      </div>
    </div>
  );
}

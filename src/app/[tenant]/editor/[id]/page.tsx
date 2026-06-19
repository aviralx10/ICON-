import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCase } from "@/lib/services/cases";
import { getCategories } from "@/lib/services/categories";
import { getCompanies } from "@/lib/services/companies";
import { CaseForm } from "@/components/case-form";

interface PageProps {
  params: Promise<{ tenant: string; id: string }>;
}

export default async function EditCasePage({ params }: PageProps) {
  const { tenant: tenantSlug, id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", tenantSlug)
    .single();

  if (!tenant) redirect("/auth/login");

  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("tenant_id", tenant.id)
    .eq("profile_id", user.id)
    .single();

  if (!membership || !["editor", "admin"].includes(membership.role)) {
    redirect(`/${tenantSlug}`);
  }

  const existingCase = await getCase(id);
  if (!existingCase) notFound();

  const [categories, companies] = await Promise.all([
    getCategories(tenant.id),
    getCompanies(tenant.id),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit Case</h1>
      <CaseForm
        tenantId={tenant.id}
        tenantSlug={tenantSlug}
        categories={categories}
        companies={companies}
        existingCase={existingCase}
      />
    </div>
  );
}

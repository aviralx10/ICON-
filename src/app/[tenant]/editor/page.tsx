import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCases } from "@/lib/services/cases";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit, Eye, Trash2 } from "lucide-react";
import { DIFFICULTY_LEVELS, CASE_STATUSES } from "@/lib/constants";
import type { Tenant } from "@/types/database";

interface PageProps {
  params: Promise<{ tenant: string }>;
}

export default async function EditorPage({ params }: PageProps) {
  const { tenant: tenantSlug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", tenantSlug)
    .single();

  if (!tenant) redirect("/auth/login");

  // Check editor+ role
  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("tenant_id", tenant.id)
    .eq("profile_id", user.id)
    .single();

  if (!membership || !["editor", "admin", "owner"].includes(membership.role)) {
    redirect(`/${tenantSlug}`);
  }

  // Get all cases including drafts/retired
  const allCases = await getCases(tenant.id, { status: undefined as unknown as string });

  // Fetch all statuses
  const { data: cases } = await supabase
    .from("cases")
    .select(`*, category:categories(name)`)
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  const caseList = cases || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Editor Dashboard</h1>
          <p className="text-muted-foreground">Manage cases, create new ones, or edit existing.</p>
        </div>
        <Link href={`/${tenantSlug}/editor/new`}>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-1" />
            New Case
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {caseList.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No cases yet. Create your first case.</p>
            </CardContent>
          </Card>
        ) : (
          caseList.map((c: Record<string, unknown>) => {
            const caseStatus = CASE_STATUSES.find((s) => s.value === c.status);
            const caseDifficulty = DIFFICULTY_LEVELS.find((d) => d.value === c.difficulty);
            const category = c.category as { name: string } | null;

            return (
              <Card key={c.id as string} className="hover:shadow-sm transition-shadow">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{c.title as string}</h3>
                      <Badge
                        variant={c.status === "published" ? "default" : c.status === "draft" ? "secondary" : "outline"}
                        className="text-xs shrink-0"
                      >
                        {caseStatus?.label || (c.status as string)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {category && <span>{category.name}</span>}
                      {caseDifficulty && (
                        <Badge variant="outline" className={`text-xs ${caseDifficulty.color}`}>
                          {caseDifficulty.label}
                        </Badge>
                      )}
                      <span>{(c.view_count as number) || 0} views</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <Link href={`/${tenantSlug}/cases/${c.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/${tenantSlug}/editor/${c.id}`}>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

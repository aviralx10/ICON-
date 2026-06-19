import Link from "next/link";
import { notFound } from "next/navigation";
import { getCase, incrementViewCount } from "@/lib/services/cases";
import { trackEvent } from "@/lib/services/usage";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, Eye, Calendar, User, FileText } from "lucide-react";
import { DIFFICULTY_LEVELS } from "@/lib/constants";

interface PageProps {
  params: Promise<{ tenant: string; id: string }>;
}

export default async function CaseDetailPage({ params }: PageProps) {
  const { tenant: tenantSlug, id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", tenantSlug)
    .single();

  const caseData = await getCase(id);

  if (!caseData) {
    notFound();
  }

  // Track view
  await incrementViewCount(id);
  if (user && tenant) {
    await trackEvent(tenant.id, user.id, "case_view", { case_id: id });
  }

  const difficulty = DIFFICULTY_LEVELS.find((d) => d.value === caseData.difficulty);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href={`/${tenantSlug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to cases
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{caseData.title}</CardTitle>
              <div className="flex flex-wrap gap-2">
                {caseData.category && (
                  <Badge variant="default">{caseData.category.name}</Badge>
                )}
                {difficulty && (
                  <Badge variant="outline" className={difficulty.color}>
                    {difficulty.label}
                  </Badge>
                )}
                {caseData.sector && (
                  <Badge variant="secondary">{caseData.sector}</Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {caseData.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{caseData.description}</p>
            </div>
          )}

          <Separator />

          {/* Companies */}
          {caseData.companies && caseData.companies.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Companies</h3>
              <div className="flex flex-wrap gap-2">
                {caseData.companies.map((company) => (
                  <Badge key={company.id} variant="secondary">
                    {company.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {caseData.tags && caseData.tags.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {caseData.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* File */}
          {caseData.file_name && (
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-medium">{caseData.file_name}</p>
                  <p className="text-xs text-muted-foreground">{caseData.file_type || "Document"}</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {caseData.view_count} views
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(caseData.created_at).toLocaleDateString()}
            </div>
            {caseData.created_by_profile && (
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {caseData.created_by_profile.full_name || caseData.created_by_profile.email}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

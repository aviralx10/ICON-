import Link from "next/link";
import { notFound } from "next/navigation";
import { getCase, incrementViewCount } from "@/lib/services/cases";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Eye, Calendar, User } from "lucide-react";
import { DIFFICULTY_LEVELS } from "@/lib/constants";

interface PageProps {
  params: Promise<{ tenant: string; id: string }>;
}

export default async function CaseDetailPage({ params }: PageProps) {
  const { tenant: tenantSlug, id } = await params;

  const caseData = await getCase(id);

  if (!caseData) {
    notFound();
  }

  await incrementViewCount(id);

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
              <CardTitle className="text-2xl">
                {caseData.s_no && <span className="text-muted-foreground mr-2">#{caseData.s_no}</span>}
                {caseData.title}
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                {caseData.content_kind !== "case" && (
                  <Badge variant="outline">{caseData.content_kind.replace("_", " ")}</Badge>
                )}
                {caseData.category && (
                  <Badge variant="default">{caseData.category.name}</Badge>
                )}
                {difficulty && (
                  <Badge variant="outline" className={difficulty.color}>
                    {difficulty.label}
                  </Badge>
                )}
                {caseData.is_numerical && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">Numerical</Badge>
                )}
                {caseData.source && (
                  <Badge variant="secondary">
                    {caseData.source === "final_2023_25" ? "Final Placements 23-25" : "Summer Placements 24-26"}
                  </Badge>
                )}
                {caseData.section && (
                  <Badge variant="secondary">{caseData.section}</Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {caseData.prompt && (
            <div>
              <h3 className="font-semibold mb-2">Problem Statement</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{caseData.prompt}</p>
            </div>
          )}

          {caseData.transcript && caseData.transcript.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Transcript</h3>
              <div className="space-y-3">
                {caseData.transcript.map((turn) => (
                  <div
                    key={turn.turn}
                    className={`rounded-lg p-3 ${
                      turn.speaker === "interviewer"
                        ? "bg-muted"
                        : "bg-blue-50 dark:bg-blue-950"
                    }`}
                  >
                    <p className="text-xs font-semibold mb-1 capitalize">{turn.speaker}</p>
                    <p className="text-sm whitespace-pre-wrap">{turn.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {caseData.frameworks && caseData.frameworks.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Frameworks</h3>
              <div className="flex flex-wrap gap-2">
                {caseData.frameworks.map((fw) => (
                  <Badge key={fw} variant="outline">{fw}</Badge>
                ))}
              </div>
            </div>
          )}

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

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Hash } from "lucide-react";
import { DIFFICULTY_LEVELS, CONTENT_TYPES } from "@/lib/constants";
import type { CaseWithRelations } from "@/types/database";

interface CaseCardProps {
  caseItem: CaseWithRelations;
  tenantSlug: string;
}

export function CaseCard({ caseItem, tenantSlug }: CaseCardProps) {
  const difficulty = DIFFICULTY_LEVELS.find((d) => d.value === caseItem.difficulty);
  const contentType = CONTENT_TYPES.find((t) => t.value === caseItem.content_kind);

  return (
    <Link href={`/${tenantSlug}/cases/${caseItem.id}`}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-semibold line-clamp-2">
              {caseItem.s_no && <span className="text-muted-foreground mr-1">#{caseItem.s_no}</span>}
              {caseItem.title}
            </CardTitle>
            {caseItem.is_numerical && (
              <Badge variant="outline" className="text-xs shrink-0 bg-blue-50 text-blue-700">N</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {caseItem.prompt && (
            <p className="text-sm text-muted-foreground line-clamp-2">{caseItem.prompt}</p>
          )}

          <div className="flex flex-wrap gap-1.5">
            {contentType && contentType.value !== "case" && (
              <Badge variant="outline" className="text-xs">{contentType.label}</Badge>
            )}
            {caseItem.category && (
              <Badge variant="default" className="text-xs">
                {caseItem.category.name}
              </Badge>
            )}
            {difficulty && (
              <Badge variant="outline" className={`text-xs ${difficulty.color}`}>
                {difficulty.label}
              </Badge>
            )}
            {caseItem.source && (
              <Badge variant="secondary" className="text-xs">
                {caseItem.source === "final_2023_25" ? "Final 23-25" : "Summer 24-26"}
              </Badge>
            )}
          </div>

          {caseItem.companies && caseItem.companies.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {caseItem.companies.map((company) => (
                <Badge key={company.id} variant="secondary" className="text-xs">
                  {company.name}
                </Badge>
              ))}
            </div>
          )}

          {caseItem.frameworks && caseItem.frameworks.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {caseItem.frameworks.map((fw) => (
                <span key={fw} className="text-xs text-muted-foreground italic">{fw}</span>
              ))}
            </div>
          )}

          {caseItem.tags && caseItem.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {caseItem.tags.map((tag) => (
                <span key={tag} className="text-xs text-muted-foreground">
                  <Hash className="inline h-3 w-3" />{tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
            <Eye className="h-3 w-3" />
            <span>{caseItem.view_count} views</span>
            {caseItem.section && (
              <>
                <span className="mx-1">|</span>
                <span>{caseItem.section}</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

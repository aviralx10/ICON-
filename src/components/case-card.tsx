import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Eye, FileSpreadsheet, File } from "lucide-react";
import { DIFFICULTY_LEVELS } from "@/lib/constants";
import type { CaseWithRelations } from "@/types/database";

interface CaseCardProps {
  caseItem: CaseWithRelations;
  tenantSlug: string;
}

function getFileIcon(fileType: string | null) {
  if (!fileType) return <File className="h-4 w-4" />;
  if (fileType.includes("pdf")) return <FileText className="h-4 w-4 text-red-500" />;
  if (fileType.includes("sheet") || fileType.includes("excel"))
    return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
  return <File className="h-4 w-4 text-blue-500" />;
}

export function CaseCard({ caseItem, tenantSlug }: CaseCardProps) {
  const difficulty = DIFFICULTY_LEVELS.find((d) => d.value === caseItem.difficulty);

  return (
    <Link href={`/${tenantSlug}/cases/${caseItem.id}`}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-semibold line-clamp-2">
              {caseItem.title}
            </CardTitle>
            {caseItem.file_type && getFileIcon(caseItem.file_type)}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {caseItem.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{caseItem.description}</p>
          )}

          <div className="flex flex-wrap gap-1.5">
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

          {caseItem.tags && caseItem.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {caseItem.tags.map((tag) => (
                <span key={tag} className="text-xs text-muted-foreground">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
            <Eye className="h-3 w-3" />
            <span>{caseItem.view_count} views</span>
            {caseItem.sector && (
              <>
                <span className="mx-1">|</span>
                <span>{caseItem.sector}</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

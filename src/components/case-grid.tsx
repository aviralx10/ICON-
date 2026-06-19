import { CaseCard } from "@/components/case-card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen } from "lucide-react";
import type { CaseWithRelations } from "@/types/database";

interface CaseGridProps {
  cases: CaseWithRelations[];
  tenantSlug: string;
  loading?: boolean;
}

export function CaseGrid({ cases, tenantSlug, loading }: CaseGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-6 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No cases found</h3>
        <p className="text-muted-foreground mt-1 max-w-md">
          Try adjusting your filters or search query. You can also clear all filters to browse all
          available cases.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cases.map((caseItem) => (
        <CaseCard key={caseItem.id} caseItem={caseItem} tenantSlug={tenantSlug} />
      ))}
    </div>
  );
}

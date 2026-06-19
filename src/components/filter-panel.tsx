"use client";

import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { DIFFICULTY_LEVELS } from "@/lib/constants";
import type { Category, CompanyWithCount } from "@/types/database";

interface FilterPanelProps {
  categories: Category[];
  companies: CompanyWithCount[];
}

export function FilterPanel({ categories, companies }: FilterPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const selectedCategories = searchParams.getAll("category");
  const selectedCompanies = searchParams.getAll("company");
  const selectedDifficulty = searchParams.get("difficulty") || "";

  const updateParams = useCallback(
    (key: string, value: string, toggle = true) => {
      const params = new URLSearchParams(searchParams.toString());

      if (toggle) {
        const current = params.getAll(key);
        if (current.includes(value)) {
          params.delete(key);
          current.filter((v) => v !== value).forEach((v) => params.append(key, v));
        } else {
          params.append(key, value);
        }
      } else {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams, startTransition]
  );

  const clearAll = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasFilters =
    selectedCategories.length > 0 ||
    selectedCompanies.length > 0 ||
    selectedDifficulty;

  return (
    <div className="space-y-4">
      {/* Difficulty */}
      <div>
        <h4 className="text-sm font-medium mb-2">Difficulty</h4>
        <Select
          value={selectedDifficulty}
          onValueChange={(val) => updateParams("difficulty", val, false)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All difficulties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All difficulties</SelectItem>
            {DIFFICULTY_LEVELS.map((d) => (
              <SelectItem key={d.value} value={d.value}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Categories */}
      <div>
        <h4 className="text-sm font-medium mb-2">Categories</h4>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => {
            const isSelected = selectedCategories.includes(cat.id);
            return (
              <Badge
                key={cat.id}
                variant={isSelected ? "default" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => updateParams("category", cat.id)}
              >
                {cat.name}
              </Badge>
            );
          })}
          {categories.length === 0 && (
            <p className="text-xs text-muted-foreground">No categories yet</p>
          )}
        </div>
      </div>

      {/* Companies */}
      <div>
        <h4 className="text-sm font-medium mb-2">Companies</h4>
        <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
          {companies.map((company) => {
            const isSelected = selectedCompanies.includes(company.id);
            return (
              <Badge
                key={company.id}
                variant={isSelected ? "default" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => updateParams("company", company.id)}
              >
                {company.name}
                <span className="ml-1 opacity-60">({company.case_count})</span>
              </Badge>
            );
          })}
          {companies.length === 0 && (
            <p className="text-xs text-muted-foreground">No companies yet</p>
          )}
        </div>
      </div>

      {/* Sort */}
      <div>
        <h4 className="text-sm font-medium mb-2">Sort</h4>
        <Select
          value={searchParams.get("sort") || "newest"}
          onValueChange={(val) => updateParams("sort", val, false)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="popular">Most popular</SelectItem>
            <SelectItem value="title">Alphabetical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll} className="w-full">
          <X className="h-4 w-4 mr-1" />
          Clear all filters
        </Button>
      )}
    </div>
  );
}

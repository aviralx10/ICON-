"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [value, setValue] = useState(searchParams.get("q") || "");

  const updateSearch = useCallback(
    (term: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (term) {
        params.set("q", term);
      } else {
        params.delete("q");
      }
      startTransition(() => {
        // Navigate to tenant root (casebook browse) with search param
        const basePath = pathname.split("/").slice(0, 2).join("/");
        router.push(`${basePath}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams, startTransition]
  );

  // Debounce
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    const timeout = setTimeout(() => updateSearch(newValue), 300);
    return () => clearTimeout(timeout);
  };

  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search cases..."
        value={value}
        onChange={handleChange}
        className="pl-9"
      />
    </div>
  );
}

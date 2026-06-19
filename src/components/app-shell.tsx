"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchBar } from "@/components/search-bar";
import { UserNav } from "@/components/user-nav";
import { Badge } from "@/components/ui/badge";
import { BookOpen, FileEdit, Users, Shield, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tenant, Profile, Membership } from "@/types/database";
import { Suspense } from "react";

interface AppShellProps {
  tenant: Tenant;
  profile: Profile;
  membership: Membership;
  children: React.ReactNode;
}

export function AppShell({ tenant, profile, membership, children }: AppShellProps) {
  const pathname = usePathname();
  const basePath = `/${tenant.slug}`;

  const isEditor = ["editor", "admin", "owner"].includes(membership.role);
  const isAdmin = ["admin", "owner"].includes(membership.role);

  const navItems = [
    { href: basePath, label: "Cases", icon: BookOpen, show: true },
    { href: `${basePath}/mentors`, label: "Mentors", icon: Briefcase, show: true },
    { href: `${basePath}/editor`, label: "Editor", icon: FileEdit, show: isEditor },
    { href: `${basePath}/admin`, label: "Admin", icon: Shield, show: isAdmin },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href={basePath} className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-lg hidden sm:inline">{tenant.name}</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems
                .filter((item) => item.show)
                .map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === basePath
                      ? pathname === basePath
                      : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Suspense fallback={null}>
              <SearchBar />
            </Suspense>
            <UserNav profile={profile} membership={membership} />
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>

      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        {tenant.name} Casebook Platform
      </footer>
    </div>
  );
}

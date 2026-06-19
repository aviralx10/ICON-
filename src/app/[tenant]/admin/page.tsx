"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { createCategoryAction, createCompanyAction, updateMemberRoleAction } from "@/app/[tenant]/actions";
import { ROLES } from "@/lib/constants";
import { Plus, Users, FolderOpen, Building } from "lucide-react";
import { useParams } from "next/navigation";

interface Member {
  id: string;
  role: string;
  profile: {
    id: string;
    email: string;
    full_name: string | null;
  };
}

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
}

interface CompanyItem {
  id: string;
  name: string;
  slug: string;
}

export default function AdminPage() {
  const params = useParams();
  const tenantSlug = params.tenant as string;
  const { toast } = useToast();

  const [tenantId, setTenantId] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: tenant } = await supabase
        .from("tenants")
        .select("id")
        .eq("slug", tenantSlug)
        .single();

      if (!tenant) return;
      setTenantId(tenant.id);

      // Check admin role
      const { data: membership } = await supabase
        .from("memberships")
        .select("role")
        .eq("tenant_id", tenant.id)
        .eq("profile_id", user.id)
        .single();

      if (!membership || !["admin", "owner"].includes(membership.role)) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      setIsAdmin(true);

      // Load members
      const { data: membersData } = await supabase
        .from("memberships")
        .select("id, role, profile:profiles(id, email, full_name)")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false });

      setMembers((membersData || []) as unknown as Member[]);

      // Load categories
      const { data: catsData } = await supabase
        .from("categories")
        .select("id, name, slug")
        .eq("tenant_id", tenant.id)
        .order("sort_order");

      setCategories((catsData || []) as CategoryItem[]);

      // Load companies
      const { data: companiesData } = await supabase
        .from("companies")
        .select("id, name, slug")
        .eq("tenant_id", tenant.id)
        .order("name");

      setCompanies((companiesData || []) as CompanyItem[]);
      setLoading(false);
    }
    loadData();
  }, [tenantSlug]);

  const handleRoleChange = async (membershipId: string, newRole: string) => {
    const formData = new FormData();
    formData.set("membership_id", membershipId);
    formData.set("role", newRole);
    formData.set("tenant_slug", tenantSlug);

    const result = await updateMemberRoleAction(formData);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Role updated" });
      setMembers((prev) =>
        prev.map((m) => (m.id === membershipId ? { ...m, role: newRole } : m))
      );
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    const formData = new FormData();
    formData.set("tenant_id", tenantId);
    formData.set("name", newCategory.trim());
    formData.set("tenant_slug", tenantSlug);

    const result = await createCategoryAction(formData);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Category created" });
      setNewCategory("");
      // Reload
      const supabase = createClient();
      const { data } = await supabase.from("categories").select("id, name, slug").eq("tenant_id", tenantId).order("sort_order");
      setCategories((data || []) as CategoryItem[]);
    }
  };

  const handleAddCompany = async () => {
    if (!newCompany.trim()) return;
    const formData = new FormData();
    formData.set("tenant_id", tenantId);
    formData.set("name", newCompany.trim());
    formData.set("tenant_slug", tenantSlug);

    const result = await createCompanyAction(formData);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Company created" });
      setNewCompany("");
      const supabase = createClient();
      const { data } = await supabase.from("companies").select("id, name, slug").eq("tenant_id", tenantId).order("name");
      setCompanies((data || []) as CompanyItem[]);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-muted-foreground mt-2">You need admin or owner role to access this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">Manage members, categories, and companies.</p>
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members" className="gap-1">
            <Users className="h-4 w-4" /> Members
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-1">
            <FolderOpen className="h-4 w-4" /> Categories
          </TabsTrigger>
          <TabsTrigger value="companies" className="gap-1">
            <Building className="h-4 w-4" /> Companies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Members ({members.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">{member.profile.full_name || member.profile.email}</p>
                    <p className="text-sm text-muted-foreground">{member.profile.email}</p>
                  </div>
                  <Select value={member.role} onValueChange={(val) => handleRoleChange(member.id, val)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              {members.length === 0 && (
                <p className="text-muted-foreground text-sm">No members found.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="New category name"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                />
                <Button onClick={handleAddCategory} className="shrink-0">
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
              <Separator />
              <div className="space-y-2">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between py-2">
                    <span className="font-medium">{cat.name}</span>
                    <Badge variant="outline" className="text-xs">{cat.slug}</Badge>
                  </div>
                ))}
                {categories.length === 0 && (
                  <p className="text-muted-foreground text-sm">No categories yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="companies" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Companies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="New company name"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCompany()}
                />
                <Button onClick={handleAddCompany} className="shrink-0">
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
              <Separator />
              <div className="space-y-2">
                {companies.map((company) => (
                  <div key={company.id} className="flex items-center justify-between py-2">
                    <span className="font-medium">{company.name}</span>
                    <Badge variant="outline" className="text-xs">{company.slug}</Badge>
                  </div>
                ))}
                {companies.length === 0 && (
                  <p className="text-muted-foreground text-sm">No companies yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

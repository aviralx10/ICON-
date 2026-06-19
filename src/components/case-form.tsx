"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X } from "lucide-react";
import { DIFFICULTY_LEVELS, CASE_STATUSES } from "@/lib/constants";
import { createCaseAction, updateCaseAction } from "@/app/[tenant]/actions";
import { useToast } from "@/hooks/use-toast";
import type { Case, Category, Company } from "@/types/database";

interface CaseFormProps {
  tenantId: string;
  tenantSlug: string;
  categories: Category[];
  companies: Company[];
  existingCase?: Case & { companies?: Company[] };
}

export function CaseForm({ tenantId, tenantSlug, categories, companies, existingCase }: CaseFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(existingCase?.title || "");
  const [description, setDescription] = useState(existingCase?.description || "");
  const [categoryId, setCategoryId] = useState(existingCase?.category_id || "");
  const [difficulty, setDifficulty] = useState(existingCase?.difficulty || "");
  const [sector, setSector] = useState(existingCase?.sector || "");
  const [tags, setTags] = useState(existingCase?.tags?.join(", ") || "");
  const [status, setStatus] = useState<string>(existingCase?.status || "draft");
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>(
    existingCase?.companies?.map((c) => c.id) || []
  );
  const [fileName, setFileName] = useState(existingCase?.file_name || "");

  const toggleCompany = (companyId: string) => {
    setSelectedCompanyIds((prev) =>
      prev.includes(companyId) ? prev.filter((id) => id !== companyId) : [...prev, companyId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.set("tenant_id", tenantId);
    formData.set("tenant_slug", tenantSlug);
    formData.set("title", title);
    formData.set("description", description);
    formData.set("category_id", categoryId);
    formData.set("difficulty", difficulty);
    formData.set("sector", sector);
    formData.set("tags", tags);
    formData.set("status", status);
    formData.set("company_ids", selectedCompanyIds.join(","));

    let result;
    if (existingCase) {
      formData.set("case_id", existingCase.id);
      result = await updateCaseAction(formData);
    } else {
      result = await createCaseAction(formData);
    }

    setLoading(false);

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: existingCase ? "Case updated" : "Case created" });
      router.push(`/${tenantSlug}/editor`);
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>{existingCase ? "Edit Case" : "New Case"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Case title" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the case" rows={4} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_LEVELS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sector">Sector</Label>
            <Input id="sector" value={sector} onChange={(e) => setSector(e.target.value)} placeholder="e.g., Technology, Healthcare" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g., revenue growth, market entry, FMCG" />
          </div>

          <div className="space-y-2">
            <Label>Companies</Label>
            <div className="flex flex-wrap gap-1.5 p-3 border rounded-md min-h-[60px]">
              {companies.map((company) => {
                const isSelected = selectedCompanyIds.includes(company.id);
                return (
                  <Badge
                    key={company.id}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleCompany(company.id)}
                  >
                    {company.name}
                    {isSelected && <X className="ml-1 h-3 w-3" />}
                  </Badge>
                );
              })}
              {companies.length === 0 && (
                <span className="text-sm text-muted-foreground">No companies available. Add some in the admin panel.</span>
              )}
            </div>
          </div>

          {/* File Upload Dropzone */}
          <div className="space-y-2">
            <Label>Case File</Label>
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              {fileName ? (
                <p className="text-sm font-medium">{fileName}</p>
              ) : (
                <>
                  <p className="text-sm font-medium">Drop a file here or click to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, PPTX, or XLSX</p>
                </>
              )}
              <input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer"
                accept=".pdf,.docx,.pptx,.xlsx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setFileName(file.name);
                }}
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0 }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CASE_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading || !title} className="bg-blue-600 hover:bg-blue-700">
          {loading ? "Saving..." : existingCase ? "Update Case" : "Create Case"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

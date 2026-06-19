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
import { X } from "lucide-react";
import { DIFFICULTY_LEVELS, CASE_STATUSES, CONTENT_TYPES, PLACEMENT_SOURCES } from "@/lib/constants";
import { createCaseAction, updateCaseAction } from "@/app/[tenant]/actions";
import { useToast } from "@/hooks/use-toast";
import { TranscriptEditor } from "@/components/transcript-editor";
import type { Case, Category, Company, TranscriptTurn } from "@/types/database";

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
  const [contentKind, setContentKind] = useState<string>(existingCase?.content_kind || "case");
  const [categoryId, setCategoryId] = useState(existingCase?.category_id || "");
  const [difficulty, setDifficulty] = useState<string>(existingCase?.difficulty || "");
  const [isNumerical, setIsNumerical] = useState(existingCase?.is_numerical || false);
  const [section, setSection] = useState(existingCase?.section || "");
  const [source, setSource] = useState<string>(existingCase?.source || "");
  const [prompt, setPrompt] = useState(existingCase?.prompt || "");
  const [frameworks, setFrameworks] = useState(existingCase?.frameworks?.join(", ") || "");
  const [tags, setTags] = useState(existingCase?.tags?.join(", ") || "");
  const [transcript, setTranscript] = useState<TranscriptTurn[]>(existingCase?.transcript || []);
  const [status, setStatus] = useState<string>(existingCase?.status || "draft");
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>(
    existingCase?.companies?.map((c) => c.id) || []
  );

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
    formData.set("content_kind", contentKind);
    formData.set("category_id", categoryId);
    formData.set("difficulty", difficulty);
    formData.set("is_numerical", String(isNumerical));
    formData.set("section", section);
    formData.set("source", source);
    formData.set("prompt", prompt);
    formData.set("frameworks", frameworks);
    formData.set("tags", tags);
    formData.set("transcript", JSON.stringify(transcript));
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
            <Label htmlFor="prompt">Problem Statement</Label>
            <Textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Opening problem statement for the case" rows={4} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Content Type</Label>
              <Select value={contentKind} onValueChange={setContentKind}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
          </div>

          <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label>Placement Source</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {PLACEMENT_SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Input id="section" value={section} onChange={(e) => setSection(e.target.value)} placeholder="e.g., Best of the Season" />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="is_numerical"
                checked={isNumerical}
                onChange={(e) => setIsNumerical(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="is_numerical">Numerical Case</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="frameworks">Frameworks (comma-separated)</Label>
            <Input id="frameworks" value={frameworks} onChange={(e) => setFrameworks(e.target.value)} placeholder="e.g., Profitability tree, Customer journey" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g., revenue growth, market entry, FMCG" />
          </div>

          <TranscriptEditor turns={transcript} onChange={setTranscript} />

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

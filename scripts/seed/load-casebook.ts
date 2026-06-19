/**
 * Seed ICON casebook data from the source PDF's Table of Contents.
 *
 * Usage:  npx tsx scripts/seed/load-casebook.ts
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 *   data/icon-casebook.pdf  (the source PDF)
 */

import fs from "fs";
import path from "path";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse");
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

interface TocEntry {
  s_no: number;
  title: string;
  difficulty: "easy" | "moderate" | "challenging";
  company: string;
  is_numerical: boolean;
  page_start: number;
  category_guess?: string;
}

async function getTenantId(): Promise<string> {
  const { data, error } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", "icon")
    .single();
  if (error || !data) throw new Error("ICON tenant not found — run 0001 migration first");
  return data.id;
}

async function getOrCreateCompany(tenantId: string, name: string): Promise<string> {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const { data: existing } = await supabase
    .from("companies")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("slug", slug)
    .single();
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("companies")
    .insert({ tenant_id: tenantId, name, slug })
    .select("id")
    .single();
  if (error) throw new Error(`Failed to create company ${name}: ${error.message}`);
  return created!.id;
}

async function getCategoryMap(tenantId: string): Promise<Map<string, string>> {
  const { data } = await supabase
    .from("categories")
    .select("id, slug")
    .eq("tenant_id", tenantId);
  const map = new Map<string, string>();
  for (const c of data || []) map.set(c.slug, c.id);
  return map;
}

function parseTocLines(text: string): TocEntry[] {
  const entries: TocEntry[] = [];
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    // Try to match TOC rows like: "1 | South African FMCG Company | McKinsey | Moderate | N | 12"
    // or tab-separated, or various delimiters
    const match = line.match(
      /^(\d+)\s*[|\t]\s*(.+?)\s*[|\t]\s*(\w[\w&\s]*?)\s*[|\t]\s*(easy|moderate|challenging)\s*[|\t]?\s*(N)?\s*[|\t]\s*(\d+)\s*$/i
    );
    if (match) {
      entries.push({
        s_no: parseInt(match[1]),
        title: match[2].trim(),
        company: match[3].trim(),
        difficulty: match[4].toLowerCase() as TocEntry["difficulty"],
        is_numerical: match[5] === "N",
        page_start: parseInt(match[6]),
      });
    }
  }
  return entries;
}

function extractCaseText(fullText: string, pageStart: number, pageEnd: number): string {
  // pdf-parse gives us all pages concatenated. We split by page markers if available,
  // otherwise return a chunk. This is best-effort.
  const pages = fullText.split(/\f/);
  const start = Math.max(0, pageStart - 1);
  const end = Math.min(pages.length, pageEnd);
  return pages.slice(start, end).join("\n").trim();
}

async function main() {
  const pdfPath = path.join(process.cwd(), "data", "icon-casebook.pdf");
  if (!fs.existsSync(pdfPath)) {
    console.error(`PDF not found at ${pdfPath}`);
    console.error("Place the ICON casebook PDF at data/icon-casebook.pdf and re-run.");
    process.exit(1);
  }

  console.log("Parsing PDF...");
  const buffer = fs.readFileSync(pdfPath);
  const pdf = await pdfParse(buffer);
  const fullText = pdf.text;

  console.log(`PDF has ${pdf.numpages} pages, ${fullText.length} chars of text`);

  const tocEntries = parseTocLines(fullText);
  console.log(`Found ${tocEntries.length} TOC entries`);

  if (tocEntries.length === 0) {
    console.error("No TOC entries parsed. The TOC format may need manual adjustment.");
    console.error("First 2000 chars of extracted text:");
    console.error(fullText.slice(0, 2000));
    process.exit(1);
  }

  const tenantId = await getTenantId();
  const categoryMap = await getCategoryMap(tenantId);

  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < tocEntries.length; i++) {
    const entry = tocEntries[i];
    const nextEntry = tocEntries[i + 1];
    const pageEnd = nextEntry ? nextEntry.page_start : entry.page_start + 3;

    const companyId = await getOrCreateCompany(tenantId, entry.company);
    const extractedText = extractCaseText(fullText, entry.page_start, pageEnd);
    const promptLines = extractedText.split("\n").slice(0, 5).join("\n").trim();

    // Check if case already exists
    const { data: existing } = await supabase
      .from("cases")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("s_no", entry.s_no)
      .single();

    if (existing) {
      skipped++;
      continue;
    }

    const { data: newCase, error } = await supabase
      .from("cases")
      .insert({
        tenant_id: tenantId,
        s_no: entry.s_no,
        page_start: entry.page_start,
        title: entry.title,
        content_kind: "case",
        difficulty: entry.difficulty,
        is_numerical: entry.is_numerical,
        prompt: promptLines || null,
        transcript: [],
        frameworks: [],
        tags: [],
        extracted_text: extractedText || null,
        status: "published",
      })
      .select("id")
      .single();

    if (error) {
      console.error(`Failed to insert case #${entry.s_no}: ${error.message}`);
      continue;
    }

    await supabase.from("case_companies").insert({
      case_id: newCase!.id,
      company_id: companyId,
    });

    inserted++;
    if (inserted % 10 === 0) console.log(`  ...inserted ${inserted} cases`);
  }

  console.log(`Done. Inserted: ${inserted}, Skipped (already exist): ${skipped}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

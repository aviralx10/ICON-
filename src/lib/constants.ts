export const DIFFICULTY_LEVELS = [
  { value: "easy", label: "Easy", color: "bg-green-100 text-green-800" },
  { value: "moderate", label: "Moderate", color: "bg-yellow-100 text-yellow-800" },
  { value: "challenging", label: "Challenging", color: "bg-red-100 text-red-800" },
] as const;

export const CONTENT_TYPES = [
  { value: "case", label: "Case" },
  { value: "guesstimate", label: "Guesstimate" },
  { value: "industry_report", label: "Industry Report" },
  { value: "framework", label: "Framework" },
] as const;

export const PLACEMENT_SOURCES = [
  { value: "final_2023_25", label: "Final Placements 2023-25" },
  { value: "summer_2024_26", label: "Summer Placements 2024-26" },
] as const;

export const CASE_STATUSES = [
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "retired", label: "Retired" },
] as const;

export const ROLES = [
  { value: "student", label: "Student" },
  { value: "editor", label: "Editor" },
  { value: "admin", label: "Admin" },
  { value: "owner", label: "Owner" },
] as const;

export const DEFAULT_CATEGORIES = [
  "Profitability",
  "Market Entry",
  "Pricing",
  "Growth Strategy",
  "M&A",
  "Operations",
  "Market Sizing",
  "Unconventional",
] as const;

export const IIMB_EMAIL_DOMAIN = "@iimb.ac.in";

export const DEFAULT_TENANT_SLUG = "icon";

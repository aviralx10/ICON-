export const DIFFICULTY_LEVELS = [
  { value: "easy", label: "Easy", color: "bg-green-100 text-green-800" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
  { value: "hard", label: "Hard", color: "bg-red-100 text-red-800" },
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

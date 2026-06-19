export interface Tenant {
  id: string;
  slug: string;
  name: string;
  theme_json: Record<string, string>;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

export interface Membership {
  id: string;
  tenant_id: string;
  profile_id: string;
  role: "student" | "editor" | "admin";
}

export interface Category {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  sort_order: number;
}

export interface Company {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

export type DifficultyLevel = "easy" | "moderate" | "challenging";
export type ContentType = "case" | "guesstimate" | "industry_report" | "framework";
export type EntryStatus = "draft" | "published" | "retired";
export type PlacementSource = "final_2023_25" | "summer_2024_26";

export interface TranscriptTurn {
  turn: number;
  speaker: "interviewer" | "candidate";
  text: string;
}

export interface Case {
  id: string;
  tenant_id: string;
  s_no: number | null;
  page_start: number | null;
  title: string;
  content_kind: ContentType;
  category_id: string | null;
  difficulty: DifficultyLevel | null;
  is_numerical: boolean;
  section: string | null;
  source: PlacementSource | null;
  prompt: string | null;
  transcript: TranscriptTurn[];
  frameworks: string[];
  tags: string[];
  file_path: string | null;
  extracted_text: string | null;
  search_vector: string | null;
  view_count: number;
  status: EntryStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CaseCompany {
  case_id: string;
  company_id: string;
}

export interface Mentor {
  id: string;
  tenant_id: string;
  profile_id: string;
  calcom_link: string | null;
  bio: string | null;
  is_active: boolean;
  created_at: string;
}

export interface MentorWithProfile extends Mentor {
  profile: Profile;
}

export interface CaseWithRelations extends Case {
  category?: Category | null;
  companies?: Company[];
  created_by_profile?: Profile | null;
}

export interface MembershipWithProfile extends Membership {
  profile: Profile;
}

export interface CompanyWithCount extends Company {
  case_count: number;
}

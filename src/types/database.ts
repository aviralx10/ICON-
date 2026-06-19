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
  avatar_url: string | null;
  created_at: string;
}

export interface Membership {
  id: string;
  tenant_id: string;
  profile_id: string;
  role: "student" | "editor" | "admin" | "owner";
  created_at: string;
}

export interface Category {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  sort_order: number;
  created_at: string;
}

export interface Company {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Case {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  difficulty: "easy" | "medium" | "hard" | null;
  sector: string | null;
  tags: string[];
  file_path: string | null;
  file_name: string | null;
  file_type: string | null;
  extracted_text: string | null;
  search_vector: string | null;
  status: "published" | "draft" | "retired";
  view_count: number;
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

export interface Booking {
  id: string;
  tenant_id: string;
  mentor_id: string;
  student_id: string;
  starts_at: string;
  ends_at: string;
  status: "confirmed" | "cancelled" | "completed";
  created_at: string;
}

export interface UsageEvent {
  id: string;
  tenant_id: string;
  profile_id: string | null;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface CaseWithRelations extends Case {
  category?: Category | null;
  companies?: Company[];
  created_by_profile?: Profile | null;
}

export interface MentorWithProfile extends Mentor {
  profile: Profile;
}

export interface MembershipWithProfile extends Membership {
  profile: Profile;
}

export interface CompanyWithCount extends Company {
  case_count: number;
}

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Tenants
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  theme_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Profiles (linked to auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Memberships (per-tenant roles)
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('student', 'editor', 'admin', 'owner')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, profile_id)
);

-- Categories (tenant-scoped)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, slug)
);

-- Companies (tenant-scoped)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, slug)
);

-- Cases
CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id),
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  sector TEXT,
  tags TEXT[] DEFAULT '{}',
  file_path TEXT,
  file_name TEXT,
  file_type TEXT,
  extracted_text TEXT,
  search_vector TSVECTOR,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'retired')),
  view_count INT DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Case-Company many-to-many
CREATE TABLE case_companies (
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  PRIMARY KEY (case_id, company_id)
);

-- Mentors
CREATE TABLE mentors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  calcom_link TEXT,
  bio TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, profile_id)
);

-- Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(mentor_id, starts_at)
);

-- Usage events
CREATE TABLE usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  profile_id UUID REFERENCES profiles(id),
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_cases_search ON cases USING GIN(search_vector);
CREATE INDEX idx_cases_tags ON cases USING GIN(tags);
CREATE INDEX idx_cases_title_trgm ON cases USING GIN(title gin_trgm_ops);
CREATE INDEX idx_cases_tenant_category ON cases(tenant_id, category_id);
CREATE INDEX idx_cases_tenant_status ON cases(tenant_id, status);
CREATE INDEX idx_case_companies_company ON case_companies(company_id, case_id);
CREATE INDEX idx_memberships_tenant ON memberships(tenant_id, profile_id);
CREATE INDEX idx_usage_events_tenant ON usage_events(tenant_id, created_at);

-- Search vector trigger
CREATE OR REPLACE FUNCTION update_case_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.extracted_text, '')), 'D');
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cases_search_vector
  BEFORE INSERT OR UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION update_case_search_vector();

-- Profile creation trigger (domain enforcement)
CREATE OR REPLACE FUNCTION enforce_iimb_domain()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email NOT LIKE '%@iimb.ac.in' THEN
    RAISE EXCEPTION 'Only @iimb.ac.in email addresses are allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_iimb_domain
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION enforce_iimb_domain();

-- RLS Policies
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

-- Tenants: readable by members
CREATE POLICY tenant_select ON tenants FOR SELECT USING (
  EXISTS (SELECT 1 FROM memberships WHERE memberships.tenant_id = tenants.id AND memberships.profile_id = auth.uid())
);

-- Profiles: users can read all profiles, update own
CREATE POLICY profile_select ON profiles FOR SELECT USING (true);
CREATE POLICY profile_update ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY profile_insert ON profiles FOR INSERT WITH CHECK (id = auth.uid());

-- Memberships: readable by tenant members
CREATE POLICY membership_select ON memberships FOR SELECT USING (
  EXISTS (SELECT 1 FROM memberships m WHERE m.tenant_id = memberships.tenant_id AND m.profile_id = auth.uid())
);
CREATE POLICY membership_manage ON memberships FOR ALL USING (
  EXISTS (SELECT 1 FROM memberships m WHERE m.tenant_id = memberships.tenant_id AND m.profile_id = auth.uid() AND m.role IN ('admin', 'owner'))
);

-- Categories: readable by tenant members, writable by editors+
CREATE POLICY category_select ON categories FOR SELECT USING (
  EXISTS (SELECT 1 FROM memberships WHERE memberships.tenant_id = categories.tenant_id AND memberships.profile_id = auth.uid())
);
CREATE POLICY category_manage ON categories FOR ALL USING (
  EXISTS (SELECT 1 FROM memberships WHERE memberships.tenant_id = categories.tenant_id AND memberships.profile_id = auth.uid() AND role IN ('editor', 'admin', 'owner'))
);

-- Companies: same pattern
CREATE POLICY company_select ON companies FOR SELECT USING (
  EXISTS (SELECT 1 FROM memberships WHERE memberships.tenant_id = companies.tenant_id AND memberships.profile_id = auth.uid())
);
CREATE POLICY company_manage ON companies FOR ALL USING (
  EXISTS (SELECT 1 FROM memberships WHERE memberships.tenant_id = companies.tenant_id AND memberships.profile_id = auth.uid() AND role IN ('editor', 'admin', 'owner'))
);

-- Cases: published readable by members, all ops by editors+
CREATE POLICY case_select ON cases FOR SELECT USING (
  status = 'published' AND
  EXISTS (SELECT 1 FROM memberships WHERE memberships.tenant_id = cases.tenant_id AND memberships.profile_id = auth.uid())
);
CREATE POLICY case_select_editor ON cases FOR SELECT USING (
  EXISTS (SELECT 1 FROM memberships WHERE memberships.tenant_id = cases.tenant_id AND memberships.profile_id = auth.uid() AND role IN ('editor', 'admin', 'owner'))
);
CREATE POLICY case_insert ON cases FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM memberships WHERE memberships.tenant_id = cases.tenant_id AND memberships.profile_id = auth.uid() AND role IN ('editor', 'admin', 'owner'))
);
CREATE POLICY case_update ON cases FOR UPDATE USING (
  EXISTS (SELECT 1 FROM memberships WHERE memberships.tenant_id = cases.tenant_id AND memberships.profile_id = auth.uid() AND role IN ('editor', 'admin', 'owner'))
);
CREATE POLICY case_delete ON cases FOR DELETE USING (
  EXISTS (SELECT 1 FROM memberships WHERE memberships.tenant_id = cases.tenant_id AND memberships.profile_id = auth.uid() AND role IN ('editor', 'admin', 'owner'))
);

-- Case companies: follow case access
CREATE POLICY case_company_select ON case_companies FOR SELECT USING (
  EXISTS (SELECT 1 FROM cases WHERE cases.id = case_companies.case_id)
);
CREATE POLICY case_company_manage ON case_companies FOR ALL USING (
  EXISTS (SELECT 1 FROM cases JOIN memberships ON memberships.tenant_id = cases.tenant_id WHERE cases.id = case_companies.case_id AND memberships.profile_id = auth.uid() AND memberships.role IN ('editor', 'admin', 'owner'))
);

-- Mentors: readable by tenant members
CREATE POLICY mentor_select ON mentors FOR SELECT USING (
  EXISTS (SELECT 1 FROM memberships WHERE memberships.tenant_id = mentors.tenant_id AND memberships.profile_id = auth.uid())
);
CREATE POLICY mentor_manage ON mentors FOR ALL USING (
  EXISTS (SELECT 1 FROM memberships WHERE memberships.tenant_id = mentors.tenant_id AND memberships.profile_id = auth.uid() AND role IN ('admin', 'owner'))
);

-- Bookings: student sees own, mentor sees own
CREATE POLICY booking_select ON bookings FOR SELECT USING (
  student_id = auth.uid() OR
  EXISTS (SELECT 1 FROM mentors WHERE mentors.id = bookings.mentor_id AND mentors.profile_id = auth.uid())
);
CREATE POLICY booking_insert ON bookings FOR INSERT WITH CHECK (
  student_id = auth.uid()
);
CREATE POLICY booking_update ON bookings FOR UPDATE USING (
  student_id = auth.uid() OR
  EXISTS (SELECT 1 FROM mentors WHERE mentors.id = bookings.mentor_id AND mentors.profile_id = auth.uid())
);

-- Usage events: insert by authenticated, select by admins
CREATE POLICY usage_insert ON usage_events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY usage_select ON usage_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM memberships WHERE memberships.tenant_id = usage_events.tenant_id AND memberships.profile_id = auth.uid() AND role IN ('admin', 'owner'))
);

-- Seed ICON tenant
INSERT INTO tenants (slug, name, theme_json) VALUES (
  'icon', 'ICON - Consulting Club', '{"primaryColor": "#1e40af", "logo": "/icon-logo.png"}'
);

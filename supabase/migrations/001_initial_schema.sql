-- =====================================================================
-- Casebook platform — core schema (Supabase / Postgres)
-- Migration 0001: tenants, taxonomy, cases, and search
-- Derived from ICON Casebook 2025-26 (Vol 15a) field structure.
-- RLS policies live in a separate migration (0002_rls.sql).
-- =====================================================================

create extension if not exists pg_trgm;        -- fuzzy / typo-tolerant search

-- ---------- Enums (the controlled vocabularies from the book) ----------
create type difficulty_level as enum ('easy', 'moderate', 'challenging');

create type content_type as enum (
  'case',             -- 83 interview cases
  'guesstimate',      -- 15 guesstimates
  'industry_report',  -- 20 industry reports
  'framework'         -- the frameworks section
);

create type entry_status as enum ('draft', 'published', 'retired');

create type placement_source as enum (
  'final_2023_25',    -- final placements, Batch 2023-25
  'summer_2024_26'    -- summer placements, Batch 2024-26
);

-- ---------- Tenants (ICON, Sigma, … — the reusable skeleton) ----------
create table tenants (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,            -- 'icon', 'sigma'
  name        text not null,
  theme_json  jsonb default '{}'::jsonb,        -- logo, colours, category preset
  created_at  timestamptz not null default now()
);

-- ---------- Taxonomy: case TYPE (Pricing, RCA, Growth, Strategy…) ----------
-- This is the "category" filter. Tenant-scoped so Sigma can define its own.
create table categories (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants(id) on delete cascade,
  name       text not null,                     -- 'Profitability / RCA', 'Market Entry', 'Pricing', 'Growth', 'M&A'
  slug       text not null,
  sort_order int  not null default 0,
  unique (tenant_id, slug)
);

-- ---------- Taxonomy: FIRM (the LeetCode-style company filter) ----------
create table companies (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants(id) on delete cascade,
  name       text not null,                     -- 'McKinsey', 'BCG', 'Bain', 'Kearney', 'LEK', 'WWT', 'BCGX', 'Strategy&'
  slug       text not null,
  logo_url   text,
  unique (tenant_id, slug)
);

-- ---------- The cases themselves (one row = one case/guesstimate/report) ----------
create table cases (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,

  -- identity / ordering (S.No + page in the book)
  s_no            int,
  page_start      int,

  -- core metadata (the TOC columns)
  title           text not null,                            -- 'Particulars' e.g. 'South African FMCG Company'
  content_kind    content_type not null default 'case',
  category_id     uuid references categories(id),           -- the case TYPE
  difficulty      difficulty_level,                         -- easy | moderate | challenging
  is_numerical    boolean not null default false,           -- the 'N = Numerical' flag
  section         text,                                     -- 'Best of the Season', etc.
  source          placement_source,                         -- which placement cycle it came from

  -- content
  prompt          text,                                     -- opening problem statement
  transcript      jsonb default '[]'::jsonb,                -- chat-style dialogue, ordered turns:
                                                            -- [{"turn":1,"speaker":"interviewer","text":"..."},
                                                            --  {"turn":2,"speaker":"candidate","text":"..."}, ...]
                                                            -- speaker ∈ {'interviewer','candidate'}
  frameworks      text[] default '{}',                      -- e.g. {'Profitability tree','Customer journey'}
  tags            text[] default '{}',                      -- free concepts/sectors

  -- source file (the original PDF/PPT page export, in Supabase Storage)
  file_path       text,
  extracted_text  text,                                     -- text pulled from the file for search

  -- search + housekeeping
  search_vector   tsvector,
  view_count      int not null default 0,
  status          entry_status not null default 'published',
  created_by      uuid,                                      -- profiles(id); FK added with auth migration
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------- Case ↔ Company (many-to-many) ----------
-- The book lists one firm per case, but a question can recur across firms,
-- so we keep it many-to-many. Powers "all cases asked at Bain" + per-firm counts.
create table case_companies (
  case_id     uuid not null references cases(id) on delete cascade,
  company_id  uuid not null references companies(id) on delete cascade,
  primary key (case_id, company_id)
);

-- =====================================================================
-- Indexes
-- =====================================================================
create index idx_cases_tenant_category on cases (tenant_id, category_id);
create index idx_cases_tenant_kind     on cases (tenant_id, content_kind);
create index idx_cases_difficulty      on cases (tenant_id, difficulty);
create index idx_cases_search          on cases using gin (search_vector);
create index idx_cases_tags            on cases using gin (tags);
create index idx_cases_title_trgm      on cases using gin (title gin_trgm_ops);  -- typo tolerance
create index idx_case_companies_company on case_companies (company_id, case_id);  -- company filter

-- =====================================================================
-- Full-text search vector (weighted): title > frameworks/tags > prompt > body
-- A company name is searchable because we fold linked firms into the vector.
-- =====================================================================
create or replace function cases_build_search_vector()
returns trigger language plpgsql as $$
declare
  company_names   text;
  transcript_text text;
begin
  select coalesce(string_agg(c.name, ' '), '')
    into company_names
    from case_companies cc
    join companies c on c.id = cc.company_id
   where cc.case_id = new.id;

  -- flatten the chat turns into one searchable string
  select coalesce(string_agg(turn->>'text', ' '), '')
    into transcript_text
    from jsonb_array_elements(coalesce(new.transcript, '[]'::jsonb)) as turn;

  new.search_vector :=
      setweight(to_tsvector('english', coalesce(new.title, '')), 'A')
    || setweight(to_tsvector('english', company_names), 'B')
    || setweight(to_tsvector('english', array_to_string(new.frameworks, ' ')), 'B')
    || setweight(to_tsvector('english', array_to_string(new.tags, ' ')), 'B')
    || setweight(to_tsvector('english', coalesce(new.prompt, '')), 'C')
    || setweight(to_tsvector('english',
         transcript_text || ' ' || coalesce(new.extracted_text, '')), 'D');
  new.updated_at := now();
  return new;
end $$;

create trigger trg_cases_search
  before insert or update on cases
  for each row execute function cases_build_search_vector();

-- =====================================================================
-- Seed taxonomy for the ICON tenant (extend freely from the editor UI)
-- =====================================================================
insert into tenants (slug, name) values ('icon', 'ICON — Consulting Club, IIMB');

insert into categories (tenant_id, name, slug, sort_order)
select id, v.name, v.slug, v.ord from tenants t,
 (values
   ('Profitability / RCA', 'profitability-rca', 1),
   ('Market Entry',        'market-entry',      2),
   ('Pricing',             'pricing',           3),
   ('Growth',              'growth',            4),
   ('Strategy',            'strategy',          5),
   ('M&A',                 'm-and-a',           6),
   ('Cost Reduction',      'cost-reduction',    7),
   ('Guesstimate',         'guesstimate',       8)
 ) as v(name, slug, ord)
where t.slug = 'icon';

insert into companies (tenant_id, name, slug)
select id, v.name, v.slug from tenants t,
 (values
   ('McKinsey','mckinsey'), ('BCG','bcg'), ('Bain','bain'),
   ('Kearney','kearney'), ('LEK','lek'), ('WWT','wwt'),
   ('BCGX','bcgx'), ('Strategy&','strategy-and')
 ) as v(name, slug)
where t.slug = 'icon';

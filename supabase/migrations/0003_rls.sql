-- Helpers (security definer to avoid policy recursion on memberships).
create or replace function auth_is_member(p_tenant uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from memberships
    where profile_id = auth.uid() and tenant_id = p_tenant);
$$;

create or replace function auth_can_edit(p_tenant uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from memberships
    where profile_id = auth.uid() and tenant_id = p_tenant
      and role in ('editor','admin'));
$$;

alter table tenants        enable row level security;
alter table categories     enable row level security;
alter table companies      enable row level security;
alter table cases          enable row level security;
alter table case_companies enable row level security;
alter table profiles       enable row level security;
alter table memberships    enable row level security;

create policy profiles_self_select on profiles for select using (id = auth.uid());
create policy profiles_self_update on profiles for update using (id = auth.uid());

create policy memberships_self_select on memberships for select using (profile_id = auth.uid());

create policy tenants_member_select on tenants for select using (auth_is_member(id));

create policy categories_select on categories for select using (auth_is_member(tenant_id));
create policy categories_write  on categories for all
  using (auth_can_edit(tenant_id)) with check (auth_can_edit(tenant_id));

create policy companies_select on companies for select using (auth_is_member(tenant_id));
create policy companies_write  on companies for all
  using (auth_can_edit(tenant_id)) with check (auth_can_edit(tenant_id));

-- students see published; editors see everything in their tenant
create policy cases_read on cases for select
  using (auth_is_member(tenant_id) and (status = 'published' or auth_can_edit(tenant_id)));
create policy cases_write on cases for all
  using (auth_can_edit(tenant_id)) with check (auth_can_edit(tenant_id));

create policy case_companies_read on case_companies for select
  using (exists (select 1 from cases c where c.id = case_id and auth_is_member(c.tenant_id)));
create policy case_companies_write on case_companies for all
  using (exists (select 1 from cases c where c.id = case_id and auth_can_edit(c.tenant_id)))
  with check (exists (select 1 from cases c where c.id = case_id and auth_can_edit(c.tenant_id)));

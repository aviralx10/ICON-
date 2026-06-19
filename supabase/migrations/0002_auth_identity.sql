-- Identity tables + domain restriction. Run after 0001.
create type member_role as enum ('student','editor','admin');

create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text unique not null,
  full_name  text,
  created_at timestamptz not null default now()
);

create table memberships (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  role       member_role not null default 'student',
  unique (tenant_id, profile_id)
);
create index idx_memberships_profile on memberships(profile_id);

-- now that profiles exists, wire up cases.created_by
alter table cases
  add constraint cases_created_by_fkey
  foreign key (created_by) references profiles(id);

-- Enforce @iimb.ac.in at the DB layer + auto-create the profile row.
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  if new.email is null or new.email !~* '@iimb\.ac\.in$' then
    raise exception 'Only @iimb.ac.in email addresses are allowed';
  end if;
  insert into profiles (id, email) values (new.id, new.email)
    on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

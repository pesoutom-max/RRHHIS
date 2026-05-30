-- Run this once in Supabase SQL Editor after the admin auth user exists.
-- Admin user: pesoutom@gmail.com

update auth.users
set
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  confirmed_at = coalesce(confirmed_at, now()),
  updated_at = now()
where email = 'pesoutom@gmail.com';

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null check (role in ('admin', 'employee')),
  employee_id uuid unique references public.employees(id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  constraint employee_profile_requires_employee check (
    role = 'admin' or employee_id is not null
  )
);

alter table public.payrolls
  add column if not exists bonus_special integer not null default 0,
  add column if not exists overtime_pay integer not null default 0,
  add column if not exists family_allowance integer not null default 0,
  add column if not exists transport_allowance integer not null default 0,
  add column if not exists meal_allowance integer not null default 0,
  add column if not exists advance_payment integer not null default 0,
  add column if not exists loan_deduction integer not null default 0,
  add column if not exists third_party_deduction integer not null default 0,
  add column if not exists afp_code text not null default 'modelo',
  add column if not exists health_provider text not null default 'fonasa',
  add column if not exists employer_sis integer not null default 0,
  add column if not exists employer_unemployment integer not null default 0,
  add column if not exists employer_afp integer not null default 0,
  add column if not exists employer_social_security integer not null default 0,
  add column if not exists employer_total integer not null default 0;

alter table public.user_profiles enable row level security;

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.user_profiles where user_id = auth.uid()
$$;

create or replace function public.current_employee_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select employee_id from public.user_profiles where user_id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_profile_role() = 'admin', false)
$$;

grant execute on function public.current_profile_role() to authenticated;
grant execute on function public.current_employee_id() to authenticated;
grant execute on function public.is_admin() to authenticated;

insert into public.user_profiles (user_id, email, role, employee_id)
select id, email, 'admin', null
from auth.users
where email = 'pesoutom@gmail.com'
on conflict (user_id) do update
set email = excluded.email,
    role = 'admin',
    employee_id = null;

drop policy if exists "Authenticated users can manage companies" on public.companies;
drop policy if exists "Authenticated users can manage employees" on public.employees;
drop policy if exists "Authenticated users can manage payrolls" on public.payrolls;
drop policy if exists "Authenticated users can manage certificates" on public.certificates;

drop policy if exists "Profiles are visible to owner and admin" on public.user_profiles;
drop policy if exists "Admins can manage profiles" on public.user_profiles;
drop policy if exists "Admins can manage companies" on public.companies;
drop policy if exists "Users can view their company" on public.companies;
drop policy if exists "Admins can manage employees" on public.employees;
drop policy if exists "Employees can view own profile" on public.employees;
drop policy if exists "Admins can manage payrolls" on public.payrolls;
drop policy if exists "Employees can view own payrolls" on public.payrolls;
drop policy if exists "Admins can manage certificates" on public.certificates;
drop policy if exists "Employees can view own certificates" on public.certificates;

create policy "Profiles are visible to owner and admin"
on public.user_profiles
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy "Admins can manage profiles"
on public.user_profiles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage companies"
on public.companies
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Users can view their company"
on public.companies
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.employees e
    where e.company_id = companies.id
    and e.id = public.current_employee_id()
  )
);

create policy "Admins can manage employees"
on public.employees
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Employees can view own profile"
on public.employees
for select
to authenticated
using (id = public.current_employee_id());

create policy "Admins can manage payrolls"
on public.payrolls
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Employees can view own payrolls"
on public.payrolls
for select
to authenticated
using (employee_id = public.current_employee_id());

create policy "Admins can manage certificates"
on public.certificates
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Employees can view own certificates"
on public.certificates
for select
to authenticated
using (employee_id = public.current_employee_id());

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.companies to authenticated;
grant select, insert, update, delete on public.employees to authenticated;
grant select, insert, update, delete on public.payrolls to authenticated;
grant select, insert, update, delete on public.certificates to authenticated;
grant select, insert, update, delete on public.user_profiles to authenticated;

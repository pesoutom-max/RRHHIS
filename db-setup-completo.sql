-- ==========================================
-- ESTRUCTURA COMPLETA RRHH CENTRAL
-- ==========================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLAS BASE

-- Empresas
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  rut text,
  address text,
  created_at timestamp with time zone DEFAULT now()
);

-- Empleados
CREATE TABLE IF NOT EXISTS public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  rut text UNIQUE NOT NULL,
  email text,
  phone text,
  position text,
  department text,
  start_date date,
  base_salary integer DEFAULT 0,
  vacation_days numeric DEFAULT 0,
  status text DEFAULT 'Activo',
  created_at timestamp with time zone DEFAULT now()
);

-- Liquidaciones de Sueldo
CREATE TABLE IF NOT EXISTS public.payrolls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  period_month date NOT NULL,
  taxable_income integer DEFAULT 0,
  non_taxable_income integer DEFAULT 0,
  other_deductions integer DEFAULT 0,
  worked_days integer DEFAULT 30,
  pension_deduction integer DEFAULT 0,
  health_deduction integer DEFAULT 0,
  unemployment_deduction integer DEFAULT 0,
  total_deductions integer DEFAULT 0,
  gross_pay integer DEFAULT 0,
  net_pay integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Certificados (Vacaciones/Permisos)
CREATE TABLE IF NOT EXISTS public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('vacaciones', 'permiso')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  notes text,
  issued_at timestamp with time zone DEFAULT now()
);

-- Perfiles de Usuario (Extensión de Auth.Users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('admin', 'employee')),
  employee_id uuid UNIQUE REFERENCES public.employees(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT employee_profile_requires_employee CHECK (
    role = 'admin' OR employee_id IS NOT NULL
  )
);

-- 3. ACTUALIZACIÓN DE COLUMNAS (Operación Segura)

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS bank_account_type text,
  ADD COLUMN IF NOT EXISTS bank_account_number text,
  ADD COLUMN IF NOT EXISTS afp_code text NOT NULL DEFAULT 'modelo',
  ADD COLUMN IF NOT EXISTS health_provider text NOT NULL DEFAULT 'fonasa',
  ADD COLUMN IF NOT EXISTS health_plan_amount integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS contract_type text NOT NULL DEFAULT 'indefinite',
  ADD COLUMN IF NOT EXISTS contract_end_date date,
  ADD COLUMN IF NOT EXISTS transport_allowance integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meal_allowance integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS emergency_contact_name text,
  ADD COLUMN IF NOT EXISTS emergency_contact_relationship text,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text;

ALTER TABLE public.payrolls
  ADD COLUMN IF NOT EXISTS bonus_special integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS overtime_pay integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS family_allowance integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transport_allowance integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meal_allowance integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS advance_payment integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS loan_deduction integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS third_party_deduction integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS afp_code text NOT NULL DEFAULT 'modelo',
  ADD COLUMN IF NOT EXISTS health_provider text NOT NULL DEFAULT 'fonasa',
  ADD COLUMN IF NOT EXISTS health_plan_amount integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS contract_type text NOT NULL DEFAULT 'indefinite',
  ADD COLUMN IF NOT EXISTS employer_sis integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS employer_unemployment integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS employer_afp integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS employer_social_security integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS employer_total integer NOT NULL DEFAULT 0;

-- 4. SEGURIDAD Y FUNCIONES

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payrolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Funciones auxiliares
CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_profiles WHERE user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.current_employee_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT employee_id FROM public.user_profiles WHERE user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_profile_role() = 'admin', false)
$$;

-- Permisos de ejecución
GRANT EXECUTE ON FUNCTION public.current_profile_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_employee_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 5. POLÍTICAS RLS

-- Borrar políticas existentes para evitar errores de duplicado
DO $$
BEGIN
    DROP POLICY IF EXISTS "Profiles are visible to owner and admin" ON public.user_profiles;
    DROP POLICY IF EXISTS "Admins can manage profiles" ON public.user_profiles;
    DROP POLICY IF EXISTS "Admins can manage companies" ON public.companies;
    DROP POLICY IF EXISTS "Users can view their company" ON public.companies;
    DROP POLICY IF EXISTS "Admins can manage employees" ON public.employees;
    DROP POLICY IF EXISTS "Employees can view own profile" ON public.employees;
    DROP POLICY IF EXISTS "Admins can manage payrolls" ON public.payrolls;
    DROP POLICY IF EXISTS "Employees can view own payrolls" ON public.payrolls;
    DROP POLICY IF EXISTS "Admins can manage certificates" ON public.certificates;
    DROP POLICY IF EXISTS "Employees can view own certificates" ON public.certificates;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- User Profiles
CREATE POLICY "Profiles are visible to owner and admin" ON public.user_profiles
FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can manage profiles" ON public.user_profiles
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Companies
CREATE POLICY "Admins can manage companies" ON public.companies
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Users can view their company" ON public.companies
FOR SELECT TO authenticated USING (
  public.is_admin() OR EXISTS (
    SELECT 1 FROM public.employees e 
    WHERE e.company_id = companies.id AND e.id = public.current_employee_id()
  )
);

-- Employees
CREATE POLICY "Admins can manage employees" ON public.employees
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Employees can view own profile" ON public.employees
FOR SELECT TO authenticated USING (id = public.current_employee_id());

-- Payrolls
CREATE POLICY "Admins can manage payrolls" ON public.payrolls
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Employees can view own payrolls" ON public.payrolls
FOR SELECT TO authenticated USING (employee_id = public.current_employee_id());

-- Certificates
CREATE POLICY "Admins can manage certificates" ON public.certificates
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Employees can view own certificates" ON public.certificates
FOR SELECT TO authenticated USING (employee_id = public.current_employee_id());

-- 6. GRANTS FINALES

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payrolls TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO authenticated;

-- 7. INICIALIZACIÓN ADMIN (Opcional)
-- Asegura que el usuario admin tenga privilegios si ya está en auth.users

UPDATE auth.users
SET
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  confirmed_at = COALESCE(confirmed_at, now()),
  updated_at = now()
WHERE email = 'pesoutom@gmail.com';

INSERT INTO public.user_profiles (user_id, email, role, employee_id)
SELECT id, email, 'admin', null
FROM auth.users
WHERE email = 'pesoutom@gmail.com'
ON CONFLICT (user_id) DO UPDATE
SET email = EXCLUDED.email,
    role = 'admin',
    employee_id = null;

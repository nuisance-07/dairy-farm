-- ============================================================
-- DairyFlow — Database Schema Migration
-- Dairy Farm Management System
-- ============================================================
-- Run this SQL in your Supabase SQL Editor to create all tables
-- ============================================================

-- Enable UUID extension (should be enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. FARMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.farms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  currency TEXT DEFAULT 'KES',
  milk_price_per_litre DECIMAL(10,2) DEFAULT 50.00,
  milking_sessions_per_day INTEGER DEFAULT 2,
  target_milk_per_cow DECIMAL(10,2) DEFAULT 15.00,
  financial_year_start INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. ANIMALS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.animals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
  tag TEXT NOT NULL,
  name TEXT,
  breed TEXT,
  date_of_birth DATE,
  sex TEXT DEFAULT 'Female' CHECK (sex IN ('Female', 'Male')),
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Dry', 'Sold', 'Dead')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. MILK PRODUCTION
-- ============================================================
CREATE TABLE IF NOT EXISTS public.milk_production (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
  animal_id UUID REFERENCES public.animals(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  session TEXT CHECK (session IN ('AM', 'PM', 'Evening')) NOT NULL,
  litres DECIMAL(10,2) NOT NULL CHECK (litres >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(animal_id, date, session)
);

-- ============================================================
-- 4. MILK SALES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.milk_sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  quantity_litres DECIMAL(10,2) NOT NULL CHECK (quantity_litres > 0),
  price_per_litre DECIMAL(10,2) NOT NULL CHECK (price_per_litre >= 0),
  buyer_name TEXT,
  total_revenue DECIMAL(10,2) GENERATED ALWAYS AS (quantity_litres * price_per_litre) STORED,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. OTHER INCOME
-- ============================================================
CREATE TABLE IF NOT EXISTS public.other_income (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
  category TEXT CHECK (category IN ('Livestock Sales', 'Manure Sales', 'Government Subsidies', 'Other')) NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 6. FEED PURCHASES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.feed_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
  feed_type TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
  unit TEXT DEFAULT 'kg',
  cost DECIMAL(10,2) NOT NULL CHECK (cost >= 0),
  supplier TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 7. FEED USAGE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.feed_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
  feed_type TEXT NOT NULL,
  quantity_used DECIMAL(10,2) NOT NULL CHECK (quantity_used > 0),
  unit TEXT DEFAULT 'kg',
  animal_group TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 8. VET RECORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vet_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
  animal_id UUID REFERENCES public.animals(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  type TEXT CHECK (type IN ('Vaccination', 'Treatment', 'Deworming', 'Pregnancy Check', 'Other')) NOT NULL,
  description TEXT,
  cost DECIMAL(10,2) DEFAULT 0 CHECK (cost >= 0),
  vet_name TEXT,
  next_due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 9. STAFF
-- ============================================================
CREATE TABLE IF NOT EXISTS public.staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  role TEXT,
  wage_type TEXT DEFAULT 'Monthly' CHECK (wage_type IN ('Monthly', 'Daily')),
  wage_amount DECIMAL(10,2) DEFAULT 0 CHECK (wage_amount >= 0),
  contact TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 10. LABOUR LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.labour_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
  staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  hours_worked DECIMAL(4,1),
  is_casual BOOLEAN DEFAULT false,
  casual_name TEXT,
  casual_cost DECIMAL(10,2) DEFAULT 0 CHECK (casual_cost >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 11. OVERHEAD EXPENSES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.overhead_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
  category TEXT CHECK (category IN ('Utilities', 'Fuel', 'Repairs', 'Equipment Maintenance', 'Transport', 'Other')) NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 12. ASSETS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  purchase_date DATE,
  purchase_cost DECIMAL(10,2) DEFAULT 0 CHECK (purchase_cost >= 0),
  useful_life_years INTEGER DEFAULT 5 CHECK (useful_life_years > 0),
  condition TEXT DEFAULT 'Good' CHECK (condition IN ('Good', 'Fair', 'Poor')),
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Under Repair', 'Disposed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_farms_user_id ON public.farms(user_id);
CREATE INDEX IF NOT EXISTS idx_animals_farm_id ON public.animals(farm_id);
CREATE INDEX IF NOT EXISTS idx_animals_status ON public.animals(farm_id, status);
CREATE INDEX IF NOT EXISTS idx_milk_production_farm_date ON public.milk_production(farm_id, date);
CREATE INDEX IF NOT EXISTS idx_milk_production_animal ON public.milk_production(animal_id, date);
CREATE INDEX IF NOT EXISTS idx_milk_sales_farm_date ON public.milk_sales(farm_id, date);
CREATE INDEX IF NOT EXISTS idx_other_income_farm_date ON public.other_income(farm_id, date);
CREATE INDEX IF NOT EXISTS idx_feed_purchases_farm_date ON public.feed_purchases(farm_id, date);
CREATE INDEX IF NOT EXISTS idx_feed_usage_farm_date ON public.feed_usage(farm_id, date);
CREATE INDEX IF NOT EXISTS idx_vet_records_farm_date ON public.vet_records(farm_id, date);
CREATE INDEX IF NOT EXISTS idx_vet_records_animal ON public.vet_records(animal_id);
CREATE INDEX IF NOT EXISTS idx_staff_farm_id ON public.staff(farm_id);
CREATE INDEX IF NOT EXISTS idx_labour_logs_farm_date ON public.labour_logs(farm_id, date);
CREATE INDEX IF NOT EXISTS idx_overhead_expenses_farm_date ON public.overhead_expenses(farm_id, date);
CREATE INDEX IF NOT EXISTS idx_assets_farm_id ON public.assets(farm_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milk_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milk_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.other_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vet_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labour_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overhead_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- ---- FARMS: Direct user_id match ----
CREATE POLICY "Users can view own farms" ON public.farms
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own farms" ON public.farms
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own farms" ON public.farms
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own farms" ON public.farms
  FOR DELETE USING (auth.uid() = user_id);

-- ---- Helper function: Check farm ownership ----
CREATE OR REPLACE FUNCTION public.is_farm_owner(p_farm_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.farms
    WHERE id = p_farm_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---- ANIMALS ----
CREATE POLICY "Users can view own animals" ON public.animals
  FOR SELECT USING (public.is_farm_owner(farm_id));

CREATE POLICY "Users can create own animals" ON public.animals
  FOR INSERT WITH CHECK (public.is_farm_owner(farm_id));

CREATE POLICY "Users can update own animals" ON public.animals
  FOR UPDATE USING (public.is_farm_owner(farm_id));

CREATE POLICY "Users can delete own animals" ON public.animals
  FOR DELETE USING (public.is_farm_owner(farm_id));

-- ---- MILK PRODUCTION ----
CREATE POLICY "Users can view own milk production" ON public.milk_production
  FOR SELECT USING (public.is_farm_owner(farm_id));

CREATE POLICY "Users can create own milk production" ON public.milk_production
  FOR INSERT WITH CHECK (public.is_farm_owner(farm_id));

CREATE POLICY "Users can update own milk production" ON public.milk_production
  FOR UPDATE USING (public.is_farm_owner(farm_id));

CREATE POLICY "Users can delete own milk production" ON public.milk_production
  FOR DELETE USING (public.is_farm_owner(farm_id));

-- ---- MILK SALES ----
CREATE POLICY "Users can view own milk sales" ON public.milk_sales
  FOR SELECT USING (public.is_farm_owner(farm_id));

CREATE POLICY "Users can create own milk sales" ON public.milk_sales
  FOR INSERT WITH CHECK (public.is_farm_owner(farm_id));

CREATE POLICY "Users can update own milk sales" ON public.milk_sales
  FOR UPDATE USING (public.is_farm_owner(farm_id));

CREATE POLICY "Users can delete own milk sales" ON public.milk_sales
  FOR DELETE USING (public.is_farm_owner(farm_id));

-- ---- OTHER INCOME ----
CREATE POLICY "Users can view own other income" ON public.other_income
  FOR SELECT USING (public.is_farm_owner(farm_id));

CREATE POLICY "Users can create own other income" ON public.other_income
  FOR INSERT WITH CHECK (public.is_farm_owner(farm_id));

CREATE POLICY "Users can update own other income" ON public.other_income
  FOR UPDATE USING (public.is_farm_owner(farm_id));

CREATE POLICY "Users can delete own other income" ON public.other_income
  FOR DELETE USING (public.is_farm_owner(farm_id));

-- ---- FEED PURCHASES ----
CREATE POLICY "Users can view own feed purchases" ON public.feed_purchases
  FOR SELECT USING (public.is_farm_owner(farm_id));

CREATE POLICY "Users can create own feed purchases" ON public.feed_purchases
  FOR INSERT WITH CHECK (public.is_farm_owner(farm_id));

CREATE POLICY "Users can update own feed purchases" ON public.feed_purchases
  FOR UPDATE USING (public.is_farm_owner(farm_id));

CREATE POLICY "Users can delete own feed purchases" ON public.feed_purchases
  FOR DELETE USING (public.is_farm_owner(farm_id));

-- ---- FEED USAGE ----
CREATE POLICY "Users can view own feed usage" ON public.feed_usage
  FOR SELECT USING (public.is_farm_owner(farm_id));

CREATE POLICY "Users can create own feed usage" ON public.feed_usage
  FOR INSERT WITH CHECK (public.is_farm_owner(farm_id));

CREATE POLICY "Users can update own feed usage" ON public.feed_usage
  FOR UPDATE USING (public.is_farm_owner(farm_id));

CREATE POLICY "Users can delete own feed usage" ON public.feed_usage
  FOR DELETE USING (public.is_farm_owner(farm_id));

-- ---- VET RECORDS ----
CREATE POLICY "Users can view own vet records" ON public.vet_records
  FOR SELECT USING (public.is_farm_owner(farm_id));

CREATE POLICY "Users can create own vet records" ON public.vet_records
  FOR INSERT WITH CHECK (public.is_farm_owner(farm_id));

CREATE POLICY "Users can update own vet records" ON public.vet_records
  FOR UPDATE USING (public.is_farm_owner(farm_id));

CREATE POLICY "Users can delete own vet records" ON public.vet_records
  FOR DELETE USING (public.is_farm_owner(farm_id));

-- ---- STAFF ----
CREATE POLICY "Users can view own staff" ON public.staff
  FOR SELECT USING (public.is_farm_owner(farm_id));

CREATE POLICY "Users can create own staff" ON public.staff
  FOR INSERT WITH CHECK (public.is_farm_owner(farm_id));

CREATE POLICY "Users can update own staff" ON public.staff
  FOR UPDATE USING (public.is_farm_owner(farm_id));

CREATE POLICY "Users can delete own staff" ON public.staff
  FOR DELETE USING (public.is_farm_owner(farm_id));

-- ---- LABOUR LOGS ----
CREATE POLICY "Users can view own labour logs" ON public.labour_logs
  FOR SELECT USING (public.is_farm_owner(farm_id));

CREATE POLICY "Users can create own labour logs" ON public.labour_logs
  FOR INSERT WITH CHECK (public.is_farm_owner(farm_id));

CREATE POLICY "Users can update own labour logs" ON public.labour_logs
  FOR UPDATE USING (public.is_farm_owner(farm_id));

CREATE POLICY "Users can delete own labour logs" ON public.labour_logs
  FOR DELETE USING (public.is_farm_owner(farm_id));

-- ---- OVERHEAD EXPENSES ----
CREATE POLICY "Users can view own overhead expenses" ON public.overhead_expenses
  FOR SELECT USING (public.is_farm_owner(farm_id));

CREATE POLICY "Users can create own overhead expenses" ON public.overhead_expenses
  FOR INSERT WITH CHECK (public.is_farm_owner(farm_id));

CREATE POLICY "Users can update own overhead expenses" ON public.overhead_expenses
  FOR UPDATE USING (public.is_farm_owner(farm_id));

CREATE POLICY "Users can delete own overhead expenses" ON public.overhead_expenses
  FOR DELETE USING (public.is_farm_owner(farm_id));

-- ---- ASSETS ----
CREATE POLICY "Users can view own assets" ON public.assets
  FOR SELECT USING (public.is_farm_owner(farm_id));

CREATE POLICY "Users can create own assets" ON public.assets
  FOR INSERT WITH CHECK (public.is_farm_owner(farm_id));

CREATE POLICY "Users can update own assets" ON public.assets
  FOR UPDATE USING (public.is_farm_owner(farm_id));

CREATE POLICY "Users can delete own assets" ON public.assets
  FOR DELETE USING (public.is_farm_owner(farm_id));

-- ============================================================
-- FEED INVENTORY VIEW (computed from purchases - usage)
-- ============================================================
CREATE OR REPLACE VIEW public.feed_inventory AS
SELECT
  fp.farm_id,
  fp.feed_type,
  fp.unit,
  COALESCE(SUM(fp.quantity), 0) AS total_purchased,
  COALESCE(fu.total_used, 0) AS total_used,
  COALESCE(SUM(fp.quantity), 0) - COALESCE(fu.total_used, 0) AS current_stock,
  CASE WHEN SUM(fp.quantity) > 0 THEN SUM(fp.cost) / SUM(fp.quantity) ELSE 0 END AS unit_cost,
  (COALESCE(SUM(fp.quantity), 0) - COALESCE(fu.total_used, 0)) *
    CASE WHEN SUM(fp.quantity) > 0 THEN SUM(fp.cost) / SUM(fp.quantity) ELSE 0 END AS stock_value
FROM public.feed_purchases fp
LEFT JOIN (
  SELECT farm_id, feed_type, SUM(quantity_used) AS total_used
  FROM public.feed_usage
  GROUP BY farm_id, feed_type
) fu ON fp.farm_id = fu.farm_id AND fp.feed_type = fu.feed_type
GROUP BY fp.farm_id, fp.feed_type, fp.unit, fu.total_used;

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_farms_updated_at
  BEFORE UPDATE ON public.farms
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

// ============================================================
// Dairy Farm Management System — TypeScript Type Definitions
// ============================================================

// ---- Database Row Types ----

export interface Farm {
  id: string;
  user_id: string;
  name: string;
  location: string | null;
  currency: string;
  milk_price_per_litre: number;
  milking_sessions_per_day: number;
  target_milk_per_cow: number;
  financial_year_start: number;
  created_at: string;
  updated_at: string;
}

export interface Animal {
  id: string;
  farm_id: string;
  tag: string;
  name: string | null;
  breed: string | null;
  date_of_birth: string | null;
  sex: 'Female' | 'Male';
  status: 'Active' | 'Dry' | 'Sold' | 'Dead';
  notes: string | null;
  created_at: string;
}

export interface MilkProduction {
  id: string;
  farm_id: string;
  animal_id: string;
  date: string;
  session: 'AM' | 'PM' | 'Evening';
  litres: number;
  created_at: string;
  // Joined fields
  animal?: Animal;
}

export interface MilkSale {
  id: string;
  farm_id: string;
  date: string;
  quantity_litres: number;
  price_per_litre: number;
  buyer_name: string | null;
  total_revenue: number;
  created_at: string;
}

export interface OtherIncome {
  id: string;
  farm_id: string;
  category: 'Livestock Sales' | 'Manure Sales' | 'Government Subsidies' | 'Other';
  amount: number;
  date: string;
  description: string | null;
  created_at: string;
}

export interface FeedPurchase {
  id: string;
  farm_id: string;
  feed_type: string;
  quantity: number;
  unit: string;
  cost: number;
  supplier: string | null;
  date: string;
  created_at: string;
}

export interface FeedUsage {
  id: string;
  farm_id: string;
  feed_type: string;
  quantity_used: number;
  unit: string;
  animal_group: string | null;
  date: string;
  created_at: string;
}

export interface VetRecord {
  id: string;
  farm_id: string;
  animal_id: string;
  date: string;
  type: 'Vaccination' | 'Treatment' | 'Deworming' | 'Pregnancy Check' | 'Other';
  description: string | null;
  cost: number;
  vet_name: string | null;
  next_due_date: string | null;
  created_at: string;
  // Joined fields
  animal?: Animal;
}

export interface Staff {
  id: string;
  farm_id: string;
  name: string;
  role: string | null;
  wage_type: 'Monthly' | 'Daily';
  wage_amount: number;
  contact: string | null;
  status: 'Active' | 'Inactive';
  created_at: string;
}

export interface LabourLog {
  id: string;
  farm_id: string;
  staff_id: string | null;
  date: string;
  hours_worked: number | null;
  is_casual: boolean;
  casual_name: string | null;
  casual_cost: number;
  notes: string | null;
  created_at: string;
  // Joined fields
  staff?: Staff;
}

export interface OverheadExpense {
  id: string;
  farm_id: string;
  category: 'Utilities' | 'Fuel' | 'Repairs' | 'Equipment Maintenance' | 'Transport' | 'Other';
  amount: number;
  date: string;
  description: string | null;
  created_at: string;
}

export interface Asset {
  id: string;
  farm_id: string;
  name: string;
  purchase_date: string | null;
  purchase_cost: number;
  useful_life_years: number;
  condition: 'Good' | 'Fair' | 'Poor';
  status: 'Active' | 'Under Repair' | 'Disposed';
  notes: string | null;
  created_at: string;
}

// ---- Feed Inventory (computed) ----

export interface FeedInventoryItem {
  feed_type: string;
  unit: string;
  total_purchased: number;
  total_used: number;
  current_stock: number;
  unit_cost: number;
  stock_value: number;
  reorder_needed: boolean;
}

// ---- Dashboard Types ----

export interface DashboardKPIs {
  milkToday: number;
  milkThisMonth: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalAnimals: number;
  activeMilkingCows: number;
}

export interface MilkTrendData {
  date: string;
  litres: number;
}

export interface IncomeExpenseData {
  month: string;
  income: number;
  expenses: number;
}

export interface ExpenseBreakdown {
  category: string;
  amount: number;
  color: string;
}

export interface TopProducer {
  tag: string;
  name: string | null;
  totalLitres: number;
}

// ---- Form Input Types ----

export interface AnimalFormData {
  tag: string;
  name: string;
  breed: string;
  date_of_birth: string;
  sex: 'Female' | 'Male';
  status: 'Active' | 'Dry' | 'Sold' | 'Dead';
  notes: string;
}

export interface MilkProductionFormData {
  animal_id: string;
  date: string;
  session: 'AM' | 'PM' | 'Evening';
  litres: number;
}

export interface MilkSaleFormData {
  date: string;
  quantity_litres: number;
  price_per_litre: number;
  buyer_name: string;
}

export interface FarmSetupFormData {
  name: string;
  location: string;
  currency: string;
  milk_price_per_litre: number;
  milking_sessions_per_day: number;
  target_milk_per_cow: number;
  financial_year_start: number;
}

// ---- Utility Types ----

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
}

export interface FilterConfig {
  search: string;
  status?: string;
  breed?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
}

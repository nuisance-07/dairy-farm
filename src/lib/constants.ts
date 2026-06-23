// ============================================================
// Application Constants
// ============================================================

export const APP_NAME = 'DairyFlow';
export const APP_DESCRIPTION = 'Comprehensive Dairy Farm Management System';

// ---- Navigation Items ----
export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Farm Setup', href: '/dashboard/farm-setup', icon: 'Settings' },
  { label: 'Herd Register', href: '/dashboard/herd', icon: 'Beef' },
  { label: 'Milk Production', href: '/dashboard/milk-production', icon: 'Milk' },
  { label: 'Milk Sales', href: '/dashboard/milk-sales', icon: 'ShoppingCart' },
  { label: 'Other Income', href: '/dashboard/other-income', icon: 'Wallet' },
  { label: 'Feed & Nutrition', href: '/dashboard/feed-expenses', icon: 'Wheat' },
  { label: 'Vet & Health', href: '/dashboard/vet-records', icon: 'Stethoscope' },
  { label: 'Labour & Staff', href: '/dashboard/labour', icon: 'Users' },
  { label: 'Overheads', href: '/dashboard/overheads', icon: 'Receipt' },
  { label: 'Assets', href: '/dashboard/assets', icon: 'Tractor' },
  { label: 'Monthly Summary', href: '/dashboard/monthly-summary', icon: 'FileBarChart' },
  { label: 'Annual P&L', href: '/dashboard/annual-report', icon: 'TrendingUp' },
  { label: 'Cash Flow', href: '/dashboard/cash-flow', icon: 'ArrowLeftRight' },
  { label: 'Feed Inventory', href: '/dashboard/feed-inventory', icon: 'Package' },
  { label: 'Resources & Guides', href: '/dashboard/resources', icon: 'BookOpen' },
] as const;

// ---- Status Options ----
export const ANIMAL_STATUSES = ['Active', 'Dry', 'Sold', 'Dead'] as const;
export const ANIMAL_SEXES = ['Female', 'Male'] as const;
export const MILKING_SESSIONS = ['AM', 'PM', 'Evening'] as const;

export const INCOME_CATEGORIES = [
  'Livestock Sales',
  'Manure Sales',
  'Government Subsidies',
  'Other',
] as const;

export const OVERHEAD_CATEGORIES = [
  'Utilities',
  'Fuel',
  'Repairs',
  'Equipment Maintenance',
  'Transport',
  'Other',
] as const;

export const VET_TYPES = [
  'Vaccination',
  'Treatment',
  'Deworming',
  'Pregnancy Check',
  'Other',
] as const;

export const ASSET_CONDITIONS = ['Good', 'Fair', 'Poor'] as const;
export const ASSET_STATUSES = ['Active', 'Under Repair', 'Disposed'] as const;
export const WAGE_TYPES = ['Monthly', 'Daily'] as const;
export const STAFF_STATUSES = ['Active', 'Inactive'] as const;

export const CURRENCIES = [
  { value: 'KES', label: 'KES — Kenyan Shilling' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'UGX', label: 'UGX — Ugandan Shilling' },
  { value: 'TZS', label: 'TZS — Tanzanian Shilling' },
] as const;

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

export const COMMON_BREEDS = [
  'Friesian',
  'Ayrshire',
  'Jersey',
  'Guernsey',
  'Brown Swiss',
  'Holstein',
  'Sahiwal',
  'Boran',
  'Zebu',
  'Crossbreed',
  'Other',
] as const;

export const COMMON_FEED_TYPES = [
  'Dairy Meal',
  'Hay',
  'Silage',
  'Napier Grass',
  'Maize Germ',
  'Cotton Seed Cake',
  'Sunflower Cake',
  'Mineral Lick',
  'Molasses',
  'Bran',
  'Other',
] as const;

// ---- Chart Colors ----
export const CHART_COLORS = {
  primary: '#388E3C',
  primaryLight: '#4CAF50',
  secondary: '#F9A825',
  danger: '#EF4444',
  info: '#3B82F6',
  purple: '#8B5CF6',
  pink: '#EC4899',
  orange: '#F97316',
  teal: '#14B8A6',
  indigo: '#6366F1',
};

export const PIE_COLORS = [
  '#388E3C',
  '#F9A825',
  '#3B82F6',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#F97316',
  '#14B8A6',
];

// ---- Pagination ----
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// ---- Feed Inventory ----
export const REORDER_THRESHOLD_KG = 50;

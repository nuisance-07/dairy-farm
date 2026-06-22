# DairyFlow — Dairy Farm Management System

A comprehensive full-stack web application for dairy farmers to track, manage, and grow their farm operations profitably.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)

## Features

### Core Modules
- **Dashboard** — KPI cards, production charts, income vs expenses, top producers
- **Farm Setup** — Farm configuration, currency, milk price, production targets
- **Herd Register** — Animal tracking with breed, age, status management
- **Milk Production** — Daily recording by cow & session (AM/PM/Evening)
- **Milk Sales** — Revenue tracking with auto-calculated totals
- **Other Income** — Livestock sales, manure, subsidies tracking
- **Feed & Nutrition** — Purchase tracking with supplier management
- **Vet & Health** — Vaccination, treatment, deworming logs with reminders
- **Labour & Staff** — Payroll management, casual worker tracking
- **Overheads** — Utility, fuel, repair expense tracking
- **Equipment & Assets** — Asset register with depreciation tracking
- **Feed Inventory** — Stock levels with reorder alerts

### Financial Reports
- **Monthly Summary** — Income & expense breakdown with net profit
- **Annual P&L** — 12-month statement with charts
- **Cash Flow Tracker** — Running balance with negative balance alerts

### Bonus Features
- ✅ CSV export on all data tables
- ✅ Print/PDF support for financial reports
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Row Level Security (RLS) for data isolation
- ✅ Toast notifications & loading skeletons
- ✅ Empty states with helpful prompts

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- A [Supabase](https://supabase.com) account (free tier works)

### 1. Clone & Install

```bash
cd "Dairy Farm Management System"
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/migrations/001_initial_schema.sql`
3. Go to **Settings > API** and copy your project URL and anon key

### 3. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Create Your Account

1. Navigate to `/register` and create an account
2. Verify your email (check Supabase Auth settings for email confirmation)
3. Log in and set up your farm at `/dashboard/farm-setup`

---

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| Next.js 14 (App Router) | React framework with SSR |
| Tailwind CSS v4 | Utility-first CSS |
| Supabase | PostgreSQL database + Auth + RLS |
| Recharts | Interactive data visualization |
| React Hook Form + Zod | Form handling & validation |
| Lucide React | Icon library |
| react-hot-toast | Toast notifications |
| date-fns | Date utilities |
| jsPDF | PDF generation |
| PapaParse | CSV generation |

---

## Database Schema

The application uses 12 PostgreSQL tables with Row Level Security:

- `farms` — Farm configuration (linked to auth user)
- `animals` — Herd register
- `milk_production` — Daily milk records
- `milk_sales` — Sales transactions
- `other_income` — Non-milk income
- `feed_purchases` — Feed buy records
- `feed_usage` — Feed consumption
- `vet_records` — Health & vaccination logs
- `staff` — Employee records
- `labour_logs` — Work attendance
- `overhead_expenses` — Running costs
- `assets` — Equipment register

Plus a `feed_inventory` view computed from purchases minus usage.

---

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

---

## Project Structure

```
src/
├── app/
│   ├── login/                   # Auth pages
│   ├── register/
│   └── dashboard/               # Protected pages
│       ├── page.tsx             # Dashboard home
│       ├── farm-setup/
│       ├── herd/
│       ├── milk-production/
│       ├── milk-sales/
│       ├── other-income/
│       ├── feed-expenses/
│       ├── vet-records/
│       ├── labour/
│       ├── overheads/
│       ├── assets/
│       ├── monthly-summary/
│       ├── annual-report/
│       ├── cash-flow/
│       └── feed-inventory/
├── components/
│   ├── layout/                  # Sidebar, Header
│   └── ui/                      # Reusable components
├── hooks/                       # Custom React hooks
├── lib/                         # Utilities, types, constants
│   └── supabase/                # Supabase clients
└── middleware.ts                # Auth middleware
```

---

## License

MIT

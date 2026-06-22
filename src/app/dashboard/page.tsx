'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import StatsCard from '@/components/ui/StatsCard';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { CHART_COLORS, PIE_COLORS } from '@/lib/constants';
import {
  Milk, DollarSign, TrendingUp, TrendingDown, Beef, BarChart3,
  ShoppingCart, ArrowUpRight,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import Link from 'next/link';

interface DashboardData {
  milkToday: number;
  milkThisMonth: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalAnimals: number;
  activeMilkingCows: number;
  milkTrend: { date: string; litres: number }[];
  incomeVsExpenses: { month: string; income: number; expenses: number }[];
  expenseBreakdown: { category: string; amount: number }[];
  topProducers: { tag: string; name: string | null; totalLitres: number }[];
}

export default function DashboardPage() {
  const { farm } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchDashboardData = useCallback(async () => {
    if (!farm) return;

    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];
    const sixMonthsAgo = new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1)
      .toISOString().split('T')[0];

    try {
      // Fetch all data in parallel
      const [
        milkTodayRes,
        milkMonthRes,
        salesRes,
        otherIncomeRes,
        feedRes,
        vetRes,
        labourRes,
        overheadRes,
        animalsRes,
        milkTrendRes,
        topProducersRes,
      ] = await Promise.all([
        // Milk today
        supabase.from('milk_production').select('litres').eq('farm_id', farm.id).eq('date', today),
        // Milk this month
        supabase.from('milk_production').select('litres').eq('farm_id', farm.id).gte('date', monthStart),
        // Sales this month
        supabase.from('milk_sales').select('total_revenue').eq('farm_id', farm.id).gte('date', monthStart),
        // Other income this month
        supabase.from('other_income').select('amount').eq('farm_id', farm.id).gte('date', monthStart),
        // Feed expenses this month
        supabase.from('feed_purchases').select('cost').eq('farm_id', farm.id).gte('date', monthStart),
        // Vet expenses this month
        supabase.from('vet_records').select('cost').eq('farm_id', farm.id).gte('date', monthStart),
        // Labour costs this month
        supabase.from('labour_logs').select('casual_cost').eq('farm_id', farm.id).gte('date', monthStart),
        // Overhead this month
        supabase.from('overhead_expenses').select('amount, category').eq('farm_id', farm.id).gte('date', monthStart),
        // Animals
        supabase.from('animals').select('id, status').eq('farm_id', farm.id),
        // 30-day milk trend
        supabase.from('milk_production').select('date, litres').eq('farm_id', farm.id).gte('date', thirtyDaysAgo).order('date'),
        // Top producers this week
        supabase.from('milk_production').select('litres, animal_id, animals(tag, name)').eq('farm_id', farm.id).gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
      ]);

      const milkToday = (milkTodayRes.data || []).reduce((s, r) => s + Number(r.litres), 0);
      const milkThisMonth = (milkMonthRes.data || []).reduce((s, r) => s + Number(r.litres), 0);
      const salesRevenue = (salesRes.data || []).reduce((s, r) => s + Number(r.total_revenue), 0);
      const otherInc = (otherIncomeRes.data || []).reduce((s, r) => s + Number(r.amount), 0);
      const totalRevenue = salesRevenue + otherInc;

      const feedCost = (feedRes.data || []).reduce((s, r) => s + Number(r.cost), 0);
      const vetCost = (vetRes.data || []).reduce((s, r) => s + Number(r.cost), 0);
      const labourCost = (labourRes.data || []).reduce((s, r) => s + Number(r.casual_cost), 0);
      const overheadCost = (overheadRes.data || []).reduce((s, r) => s + Number(r.amount), 0);
      const totalExpenses = feedCost + vetCost + labourCost + overheadCost;

      const animals = animalsRes.data || [];
      const totalAnimals = animals.length;
      const activeMilkingCows = animals.filter((a) => a.status === 'Active').length;

      // Aggregate milk trend by date
      const trendMap: Record<string, number> = {};
      (milkTrendRes.data || []).forEach((r) => {
        trendMap[r.date] = (trendMap[r.date] || 0) + Number(r.litres);
      });
      const milkTrend = Object.entries(trendMap)
        .map(([date, litres]) => ({
          date: new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
          litres,
        }))
        .slice(-30);

      // Expense breakdown for pie chart
      const expenseBreakdown = [
        { category: 'Feed', amount: feedCost },
        { category: 'Veterinary', amount: vetCost },
        { category: 'Labour', amount: labourCost },
        { category: 'Overheads', amount: overheadCost },
      ].filter((e) => e.amount > 0);

      // Top producers
      const producerMap: Record<string, { tag: string; name: string | null; litres: number }> = {};
      (topProducersRes.data || []).forEach((r: Record<string, unknown>) => {
        const id = r.animal_id as string;
        const animal = r.animals as { tag: string; name: string | null } | null;
        if (!producerMap[id]) {
          producerMap[id] = { tag: animal?.tag || 'Unknown', name: animal?.name || null, litres: 0 };
        }
        producerMap[id].litres += Number(r.litres);
      });
      const topProducers = Object.values(producerMap)
        .sort((a, b) => b.litres - a.litres)
        .slice(0, 5)
        .map((p) => ({ tag: p.tag, name: p.name, totalLitres: p.litres }));

      // Income vs Expenses (last 6 months) - simplified
      const incomeVsExpenses: { month: string; income: number; expenses: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthName = d.toLocaleDateString('en', { month: 'short' });
        incomeVsExpenses.push({ month: monthName, income: 0, expenses: 0 });
      }

      setData({
        milkToday,
        milkThisMonth,
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        totalAnimals,
        activeMilkingCows,
        milkTrend,
        incomeVsExpenses,
        expenseBreakdown,
        topProducers,
      });
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  }, [farm, supabase]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) return <DashboardSkeleton />;

  if (!farm) {
    return (
      <EmptyState
        title="Welcome to DairyFlow!"
        description="Set up your farm to get started with tracking your dairy operations."
        action={
          <Link href="/dashboard/farm-setup" className="btn btn-primary">
            Set Up Your Farm
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        }
      />
    );
  }

  if (!data) return null;

  const cashFlowPositive = data.netProfit >= 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatsCard
          title="Milk Today"
          value={`${formatNumber(data.milkToday)} L`}
          icon={<Milk className="w-5 h-5" />}
          variant="green"
        />
        <StatsCard
          title="Milk This Month"
          value={`${formatNumber(data.milkThisMonth)} L`}
          icon={<BarChart3 className="w-5 h-5" />}
          variant="default"
        />
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(data.totalRevenue, farm.currency)}
          icon={<DollarSign className="w-5 h-5" />}
          variant="default"
        />
        <StatsCard
          title="Total Expenses"
          value={formatCurrency(data.totalExpenses, farm.currency)}
          icon={<ShoppingCart className="w-5 h-5" />}
          variant="red"
        />
        <StatsCard
          title="Net Profit"
          value={formatCurrency(data.netProfit, farm.currency)}
          icon={cashFlowPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          variant={cashFlowPositive ? 'green' : 'red'}
        />
        <StatsCard
          title="Total Animals"
          value={data.totalAnimals.toString()}
          icon={<Beef className="w-5 h-5" />}
          variant="default"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Milk Production Trend */}
        <div className="card p-5">
          <h3 className="text-base font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1A1A2E' }}>
            Milk Production — Last 30 Days
          </h3>
          {data.milkTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.milkTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8E2" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <Tooltip
                  contentStyle={{
                    background: '#1B5E20',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '13px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="litres"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2.5}
                  dot={{ fill: CHART_COLORS.primary, r: 3 }}
                  activeDot={{ r: 5, fill: CHART_COLORS.primaryLight }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-sm" style={{ color: '#94A3B8' }}>
              No production data yet. Start logging milk production!
            </div>
          )}
        </div>

        {/* Income vs Expenses */}
        <div className="card p-5">
          <h3 className="text-base font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1A1A2E' }}>
            Income vs Expenses — Last 6 Months
          </h3>
          {data.incomeVsExpenses.some((d) => d.income > 0 || d.expenses > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.incomeVsExpenses}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8E2" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <Tooltip
                  contentStyle={{
                    background: '#1B5E20',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '13px',
                  }}
                />
                <Legend />
                <Bar dataKey="income" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} name="Income" />
                <Bar dataKey="expenses" fill={CHART_COLORS.danger} radius={[4, 4, 0, 0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-sm" style={{ color: '#94A3B8' }}>
              No financial data yet. Record sales and expenses to see trends!
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expense Breakdown Pie */}
        <div className="card p-5">
          <h3 className="text-base font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1A1A2E' }}>
            Expense Breakdown
          </h3>
          {data.expenseBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data.expenseBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="amount"
                  nameKey="category"
                >
                  {data.expenseBreakdown.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#1B5E20',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '13px',
                  }}
                  formatter={(value: any) => formatCurrency(Number(value), farm?.currency)}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-sm" style={{ color: '#94A3B8' }}>
              No expenses recorded yet.
            </div>
          )}
        </div>

        {/* Top Producers */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1A1A2E' }}>
              Top Producing Cows — This Week
            </h3>
            <Link href="/dashboard/milk-production" className="text-xs font-medium hover:underline" style={{ color: '#388E3C' }}>
              View All →
            </Link>
          </div>
          {data.topProducers.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Tag</th>
                    <th>Name</th>
                    <th>Total Litres</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProducers.map((cow, i) => (
                    <tr key={i}>
                      <td>
                        <span
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{
                            background: i === 0 ? '#F9A825' : i === 1 ? '#94A3B8' : i === 2 ? '#CD7F32' : '#E2E8E2',
                            color: i < 3 ? 'white' : '#4A5568',
                          }}
                        >
                          {i + 1}
                        </span>
                      </td>
                      <td className="font-medium" style={{ color: '#1A1A2E' }}>{cow.tag}</td>
                      <td>{cow.name || '—'}</td>
                      <td className="font-semibold" style={{ color: '#388E3C' }}>
                        {formatNumber(cow.totalLitres)} L
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm" style={{ color: '#94A3B8' }}>
              No production data this week yet.
            </div>
          )}
        </div>
      </div>

      {/* Cash Flow Status */}
      <div
        className="card p-5 flex items-center gap-4"
        style={{
          borderLeft: `4px solid ${cashFlowPositive ? '#22C55E' : '#EF4444'}`,
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: cashFlowPositive ? '#DCFCE7' : '#FEE2E2',
            color: cashFlowPositive ? '#166534' : '#991B1B',
          }}
        >
          {cashFlowPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
        </div>
        <div>
          <p className="font-bold" style={{ color: '#1A1A2E' }}>
            Cash Flow: {cashFlowPositive ? 'Positive' : 'Negative'}
          </p>
          <p className="text-sm" style={{ color: '#94A3B8' }}>
            Net profit this month is {formatCurrency(Math.abs(data.netProfit), farm.currency)}
            {cashFlowPositive ? ' in the green' : ' in deficit'}
          </p>
        </div>
      </div>
    </div>
  );
}

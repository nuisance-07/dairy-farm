'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { MONTHS } from '@/lib/constants';
import { TrendingUp, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export default function AnnualReportPage() {
  const { farm } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);

  const fetchData = useCallback(async () => {
    if (!farm) return;
    setLoading(true);

    const results: MonthlyData[] = [];

    for (let m = 0; m < 12; m++) {
      const startDate = `${year}-${String(m + 1).padStart(2, '0')}-01`;
      const endDate = new Date(year, m + 1, 0).toISOString().split('T')[0];

      const [salesRes, otherRes, feedRes, vetRes, labourRes, overheadRes] = await Promise.all([
        supabase.from('milk_sales').select('total_revenue').eq('farm_id', farm.id).gte('date', startDate).lte('date', endDate),
        supabase.from('other_income').select('amount').eq('farm_id', farm.id).gte('date', startDate).lte('date', endDate),
        supabase.from('feed_purchases').select('cost').eq('farm_id', farm.id).gte('date', startDate).lte('date', endDate),
        supabase.from('vet_records').select('cost').eq('farm_id', farm.id).gte('date', startDate).lte('date', endDate),
        supabase.from('labour_logs').select('casual_cost').eq('farm_id', farm.id).gte('date', startDate).lte('date', endDate),
        supabase.from('overhead_expenses').select('amount').eq('farm_id', farm.id).gte('date', startDate).lte('date', endDate),
      ]);

      const revenue = (salesRes.data || []).reduce((s, r) => s + Number(r.total_revenue), 0) + (otherRes.data || []).reduce((s, r) => s + Number(r.amount), 0);
      const expenses = (feedRes.data || []).reduce((s, r) => s + Number(r.cost), 0) + (vetRes.data || []).reduce((s, r) => s + Number(r.cost), 0) + (labourRes.data || []).reduce((s, r) => s + Number(r.casual_cost), 0) + (overheadRes.data || []).reduce((s, r) => s + Number(r.amount), 0);

      results.push({ month: MONTHS[m].slice(0, 3), revenue, expenses, profit: revenue - expenses });
    }

    setMonthlyData(results);
    setLoading(false);
  }, [farm, year, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePrint = () => window.print();

  if (loading) return <DashboardSkeleton />;

  const totalRevenue = monthlyData.reduce((s, m) => s + m.revenue, 0);
  const totalExpenses = monthlyData.reduce((s, m) => s + m.expenses, 0);
  const totalProfit = totalRevenue - totalExpenses;
  const profitPositive = totalProfit >= 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 no-print">
        <input type="number" className="input" style={{ width: '100px' }} value={year} onChange={(e) => setYear(Number(e.target.value))} min={2020} max={2030} />
        <button className="btn btn-secondary btn-sm" onClick={handlePrint}><Download className="w-4 h-4" /> Print / PDF</button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 text-center" style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', border: 'none' }}>
          <p className="text-xs uppercase tracking-wide" style={{ color: '#A5D6A7' }}>Total Revenue</p>
          <p className="text-3xl font-bold text-white mt-1" style={{ fontFamily: 'Outfit, sans-serif' }}>{formatCurrency(totalRevenue, farm?.currency)}</p>
        </div>
        <div className="card p-5 text-center" style={{ background: 'linear-gradient(135deg, #991B1B, #DC2626)', border: 'none' }}>
          <p className="text-xs uppercase tracking-wide" style={{ color: '#FCA5A5' }}>Total Expenses</p>
          <p className="text-3xl font-bold text-white mt-1" style={{ fontFamily: 'Outfit, sans-serif' }}>{formatCurrency(totalExpenses, farm?.currency)}</p>
        </div>
        <div className="card p-5 text-center" style={{ background: profitPositive ? 'linear-gradient(135deg, #065F46, #059669)' : 'linear-gradient(135deg, #7C2D12, #EA580C)', border: 'none' }}>
          <p className="text-xs uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.7)' }}>Net Profit</p>
          <p className="text-3xl font-bold text-white mt-1" style={{ fontFamily: 'Outfit, sans-serif' }}>{formatCurrency(totalProfit, farm?.currency)}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="card p-5">
        <h3 className="text-base font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Revenue vs Expenses — {year}</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8E2" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
            <Tooltip contentStyle={{ background: '#1B5E20', border: 'none', borderRadius: '8px', color: 'white', fontSize: '13px' }} formatter={(value: any) => formatCurrency(Number(value), farm?.currency)} />
            <Legend />
            <Bar dataKey="revenue" fill="#388E3C" radius={[4, 4, 0, 0]} name="Revenue" />
            <Bar dataKey="expenses" fill="#EF4444" radius={[4, 4, 0, 0]} name="Expenses" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Table */}
      <div className="card">
        <div className="px-6 py-4 border-b flex items-center gap-2" style={{ borderColor: '#E2E8E2' }}>
          <TrendingUp className="w-5 h-5" style={{ color: '#388E3C' }} />
          <h3 className="text-base font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>Profit & Loss — {year}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr><th>Month</th><th className="text-right">Revenue</th><th className="text-right">Expenses</th><th className="text-right">Profit</th><th className="text-right">Margin</th></tr>
            </thead>
            <tbody>
              {monthlyData.map((m) => (
                <tr key={m.month}>
                  <td className="font-medium" style={{ color: '#1A1A2E' }}>{m.month}</td>
                  <td className="text-right" style={{ color: '#388E3C' }}>{formatCurrency(m.revenue, farm?.currency)}</td>
                  <td className="text-right" style={{ color: '#EF4444' }}>{formatCurrency(m.expenses, farm?.currency)}</td>
                  <td className="text-right font-semibold" style={{ color: m.profit >= 0 ? '#388E3C' : '#EF4444' }}>{formatCurrency(m.profit, farm?.currency)}</td>
                  <td className="text-right text-sm" style={{ color: '#94A3B8' }}>{m.revenue > 0 ? `${formatNumber((m.profit / m.revenue) * 100)}%` : '—'}</td>
                </tr>
              ))}
              <tr style={{ background: '#F8FAF8', fontWeight: 'bold' }}>
                <td>TOTAL</td>
                <td className="text-right" style={{ color: '#1B5E20' }}>{formatCurrency(totalRevenue, farm?.currency)}</td>
                <td className="text-right" style={{ color: '#991B1B' }}>{formatCurrency(totalExpenses, farm?.currency)}</td>
                <td className="text-right" style={{ color: profitPositive ? '#1B5E20' : '#991B1B' }}>{formatCurrency(totalProfit, farm?.currency)}</td>
                <td className="text-right text-sm">{totalRevenue > 0 ? `${formatNumber((totalProfit / totalRevenue) * 100)}%` : '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

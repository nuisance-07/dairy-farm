'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { MONTHS } from '@/lib/constants';
import { FileBarChart, Download, TrendingUp, TrendingDown } from 'lucide-react';

export default function MonthlySummaryPage() {
  const { farm } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<{ income: { milkSales: number; otherIncome: number; total: number }; expenses: { feed: number; vet: number; labour: number; overheads: number; total: number }; netProfit: number } | null>(null);

  const fetchData = useCallback(async () => {
    if (!farm) return;
    setLoading(true);
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

    const [salesRes, otherRes, feedRes, vetRes, labourRes, overheadRes] = await Promise.all([
      supabase.from('milk_sales').select('total_revenue').eq('farm_id', farm.id).gte('date', startDate).lte('date', endDate),
      supabase.from('other_income').select('amount').eq('farm_id', farm.id).gte('date', startDate).lte('date', endDate),
      supabase.from('feed_purchases').select('cost').eq('farm_id', farm.id).gte('date', startDate).lte('date', endDate),
      supabase.from('vet_records').select('cost').eq('farm_id', farm.id).gte('date', startDate).lte('date', endDate),
      supabase.from('labour_logs').select('casual_cost').eq('farm_id', farm.id).gte('date', startDate).lte('date', endDate),
      supabase.from('overhead_expenses').select('amount').eq('farm_id', farm.id).gte('date', startDate).lte('date', endDate),
    ]);

    const milkSales = (salesRes.data || []).reduce((s, r) => s + Number(r.total_revenue), 0);
    const otherIncome = (otherRes.data || []).reduce((s, r) => s + Number(r.amount), 0);
    const feed = (feedRes.data || []).reduce((s, r) => s + Number(r.cost), 0);
    const vet = (vetRes.data || []).reduce((s, r) => s + Number(r.cost), 0);
    const labour = (labourRes.data || []).reduce((s, r) => s + Number(r.casual_cost), 0);
    const overheads = (overheadRes.data || []).reduce((s, r) => s + Number(r.amount), 0);

    const totalIncome = milkSales + otherIncome;
    const totalExpenses = feed + vet + labour + overheads;

    setData({
      income: { milkSales, otherIncome, total: totalIncome },
      expenses: { feed, vet, labour, overheads, total: totalExpenses },
      netProfit: totalIncome - totalExpenses,
    });
    setLoading(false);
  }, [farm, month, year, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePrint = () => window.print();

  if (loading) return <DashboardSkeleton />;
  if (!data) return null;

  const profitPositive = data.netProfit >= 0;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 no-print">
        <select className="input select" style={{ width: 'auto' }} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <input type="number" className="input" style={{ width: '100px' }} value={year} onChange={(e) => setYear(Number(e.target.value))} min={2020} max={2030} />
        <button className="btn btn-secondary btn-sm" onClick={handlePrint}><Download className="w-4 h-4" /> Print / PDF</button>
      </div>

      {/* Report */}
      <div className="card">
        <div className="px-6 py-5 border-b" style={{ borderColor: '#E2E8E2', background: 'linear-gradient(135deg, #1B5E20, #2E7D32)' }}>
          <div className="flex items-center gap-3">
            <FileBarChart className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Monthly Income & Expense Summary
              </h2>
              <p className="text-sm" style={{ color: '#A5D6A7' }}>{MONTHS[month]} {year} • {farm?.name}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Income */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: '#388E3C' }}>Income</h3>
            <div className="space-y-2">
              <div className="flex justify-between py-2 px-3 rounded-lg" style={{ background: '#F8FAF8' }}>
                <span className="text-sm" style={{ color: '#4A5568' }}>Milk Sales</span>
                <span className="text-sm font-medium">{formatCurrency(data.income.milkSales, farm?.currency)}</span>
              </div>
              <div className="flex justify-between py-2 px-3 rounded-lg" style={{ background: '#F8FAF8' }}>
                <span className="text-sm" style={{ color: '#4A5568' }}>Other Income</span>
                <span className="text-sm font-medium">{formatCurrency(data.income.otherIncome, farm?.currency)}</span>
              </div>
              <div className="flex justify-between py-2 px-3 rounded-lg font-bold" style={{ background: '#E8F5E9', color: '#1B5E20' }}>
                <span>Total Income</span>
                <span>{formatCurrency(data.income.total, farm?.currency)}</span>
              </div>
            </div>
          </div>

          {/* Expenses */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: '#EF4444' }}>Expenses</h3>
            <div className="space-y-2">
              {[
                { label: 'Feed & Nutrition', value: data.expenses.feed },
                { label: 'Veterinary & Health', value: data.expenses.vet },
                { label: 'Labour & Staffing', value: data.expenses.labour },
                { label: 'Overheads', value: data.expenses.overheads },
              ].map((item) => (
                <div key={item.label} className="flex justify-between py-2 px-3 rounded-lg" style={{ background: '#F8FAF8' }}>
                  <span className="text-sm" style={{ color: '#4A5568' }}>{item.label}</span>
                  <span className="text-sm font-medium" style={{ color: '#EF4444' }}>{formatCurrency(item.value, farm?.currency)}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 px-3 rounded-lg font-bold" style={{ background: '#FEE2E2', color: '#991B1B' }}>
                <span>Total Expenses</span>
                <span>{formatCurrency(data.expenses.total, farm?.currency)}</span>
              </div>
            </div>
          </div>

          {/* Net Profit */}
          <div className="flex justify-between items-center py-4 px-4 rounded-xl" style={{ background: profitPositive ? 'linear-gradient(135deg, #1B5E20, #2E7D32)' : 'linear-gradient(135deg, #991B1B, #DC2626)', }}>
            <div className="flex items-center gap-2 text-white">
              {profitPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              <span className="font-bold text-lg">Net Profit</span>
            </div>
            <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {formatCurrency(data.netProfit, farm?.currency)}
            </span>
          </div>

          {/* Margin */}
          {data.income.total > 0 && (
            <p className="text-center text-sm" style={{ color: '#94A3B8' }}>
              Profit Margin: <span className="font-semibold" style={{ color: profitPositive ? '#388E3C' : '#EF4444' }}>
                {formatNumber((data.netProfit / data.income.total) * 100)}%
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

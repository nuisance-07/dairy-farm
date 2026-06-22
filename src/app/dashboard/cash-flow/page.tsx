'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/lib/utils';
import { MONTHS } from '@/lib/constants';
import { ArrowLeftRight, AlertTriangle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';

interface CashFlowMonth {
  month: string;
  cashIn: number;
  cashOut: number;
  net: number;
  runningBalance: number;
}

export default function CashFlowPage() {
  const { farm } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<CashFlowMonth[]>([]);

  const fetchData = useCallback(async () => {
    if (!farm) return;
    setLoading(true);

    const results: CashFlowMonth[] = [];
    let runningBalance = 0;

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

      const cashIn = (salesRes.data || []).reduce((s, r) => s + Number(r.total_revenue), 0) + (otherRes.data || []).reduce((s, r) => s + Number(r.amount), 0);
      const cashOut = (feedRes.data || []).reduce((s, r) => s + Number(r.cost), 0) + (vetRes.data || []).reduce((s, r) => s + Number(r.cost), 0) + (labourRes.data || []).reduce((s, r) => s + Number(r.casual_cost), 0) + (overheadRes.data || []).reduce((s, r) => s + Number(r.amount), 0);

      runningBalance += cashIn - cashOut;
      results.push({ month: MONTHS[m].slice(0, 3), cashIn, cashOut, net: cashIn - cashOut, runningBalance });
    }

    setData(results);
    setLoading(false);
  }, [farm, year, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <DashboardSkeleton />;

  const negativeMonths = data.filter((d) => d.runningBalance < 0);
  const currentBalance = data.length > 0 ? data[data.length - 1].runningBalance : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 no-print">
        <input type="number" className="input" style={{ width: '100px' }} value={year} onChange={(e) => setYear(Number(e.target.value))} min={2020} max={2030} />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#E8F5E9', color: '#388E3C' }}><TrendingUp className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{formatCurrency(data.reduce((s, d) => s + d.cashIn, 0), farm?.currency)}</p><p className="text-xs" style={{ color: '#94A3B8' }}>Total Cash In</p></div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#FEE2E2', color: '#EF4444' }}><ArrowLeftRight className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{formatCurrency(data.reduce((s, d) => s + d.cashOut, 0), farm?.currency)}</p><p className="text-xs" style={{ color: '#94A3B8' }}>Total Cash Out</p></div>
        </div>
        <div className="card p-4 flex items-center gap-4" style={{ background: currentBalance >= 0 ? 'linear-gradient(135deg, #1B5E20, #2E7D32)' : 'linear-gradient(135deg, #991B1B, #DC2626)', border: 'none' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}><ArrowLeftRight className="w-5 h-5 text-white" /></div>
          <div><p className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>{formatCurrency(currentBalance, farm?.currency)}</p><p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>Running Balance</p></div>
        </div>
      </div>

      {/* Negative balance alert */}
      {negativeMonths.length > 0 && (
        <div className="card p-4 flex items-center gap-3" style={{ borderLeft: '4px solid #EF4444', background: '#FEF2F2' }}>
          <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: '#EF4444' }} />
          <p className="text-sm" style={{ color: '#991B1B' }}>
            <strong>Warning:</strong> Cash balance goes negative in {negativeMonths.map((d) => d.month).join(', ')}. Consider reducing expenses or increasing sales.
          </p>
        </div>
      )}

      {/* Cash Flow Chart */}
      <div className="card p-5">
        <h3 className="text-base font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Cash Flow — {year}</h3>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8E2" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
            <Tooltip contentStyle={{ background: '#1B5E20', border: 'none', borderRadius: '8px', color: 'white', fontSize: '13px' }} formatter={(value: any) => formatCurrency(Number(value), farm?.currency)} />
            <Legend />
            <ReferenceLine y={0} stroke="#94A3B8" strokeDasharray="3 3" />
            <Bar dataKey="cashIn" fill="#388E3C" radius={[4, 4, 0, 0]} name="Cash In" />
            <Bar dataKey="cashOut" fill="#EF4444" radius={[4, 4, 0, 0]} name="Cash Out" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>Month</th><th className="text-right">Cash In</th><th className="text-right">Cash Out</th><th className="text-right">Net</th><th className="text-right">Running Balance</th></tr></thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.month}>
                <td className="font-medium">{d.month}</td>
                <td className="text-right" style={{ color: '#388E3C' }}>{formatCurrency(d.cashIn, farm?.currency)}</td>
                <td className="text-right" style={{ color: '#EF4444' }}>{formatCurrency(d.cashOut, farm?.currency)}</td>
                <td className="text-right font-semibold" style={{ color: d.net >= 0 ? '#388E3C' : '#EF4444' }}>{formatCurrency(d.net, farm?.currency)}</td>
                <td className="text-right font-bold" style={{ color: d.runningBalance >= 0 ? '#1B5E20' : '#991B1B' }}>{formatCurrency(d.runningBalance, farm?.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

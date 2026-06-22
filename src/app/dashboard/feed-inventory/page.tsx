'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { COMMON_FEED_TYPES, REORDER_THRESHOLD_KG } from '@/lib/constants';
import { formatCurrency, formatNumber, getToday, exportToCSV } from '@/lib/utils';
import { Package, AlertTriangle, Plus, Loader2, Download } from 'lucide-react';
import toast from 'react-hot-toast';

interface InventoryItem {
  feed_type: string;
  unit: string;
  total_purchased: number;
  total_used: number;
  current_stock: number;
  unit_cost: number;
  stock_value: number;
}

export default function FeedInventoryPage() {
  const { farm } = useAuth();
  const supabase = createClient();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [usageModal, setUsageModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ feed_type: '', quantity_used: '', unit: 'kg', animal_group: '', date: getToday() });

  const fetchInventory = useCallback(async () => {
    if (!farm) return;

    // Fetch purchases and usage, then compute inventory
    const [purchasesRes, usageRes] = await Promise.all([
      supabase.from('feed_purchases').select('feed_type, quantity, unit, cost').eq('farm_id', farm.id),
      supabase.from('feed_usage').select('feed_type, quantity_used').eq('farm_id', farm.id),
    ]);

    const purchases = purchasesRes.data || [];
    const usage = usageRes.data || [];

    // Aggregate purchases by feed_type
    const purchaseMap: Record<string, { quantity: number; cost: number; unit: string }> = {};
    purchases.forEach((p) => {
      if (!purchaseMap[p.feed_type]) purchaseMap[p.feed_type] = { quantity: 0, cost: 0, unit: p.unit };
      purchaseMap[p.feed_type].quantity += Number(p.quantity);
      purchaseMap[p.feed_type].cost += Number(p.cost);
    });

    // Aggregate usage by feed_type
    const usageMap: Record<string, number> = {};
    usage.forEach((u) => {
      usageMap[u.feed_type] = (usageMap[u.feed_type] || 0) + Number(u.quantity_used);
    });

    // Compute inventory
    const items: InventoryItem[] = Object.entries(purchaseMap).map(([feed_type, data]) => {
      const total_used = usageMap[feed_type] || 0;
      const current_stock = Math.max(data.quantity - total_used, 0);
      const unit_cost = data.quantity > 0 ? data.cost / data.quantity : 0;
      return {
        feed_type,
        unit: data.unit,
        total_purchased: data.quantity,
        total_used,
        current_stock,
        unit_cost,
        stock_value: current_stock * unit_cost,
      };
    });

    setInventory(items.sort((a, b) => a.feed_type.localeCompare(b.feed_type)));
    setLoading(false);
  }, [farm, supabase]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const handleLogUsage = async (e: React.FormEvent) => {
    e.preventDefault(); if (!farm) return; setSaving(true);
    try {
      const { error } = await supabase.from('feed_usage').insert({
        farm_id: farm.id,
        feed_type: form.feed_type,
        quantity_used: Number(form.quantity_used),
        unit: form.unit,
        animal_group: form.animal_group || null,
        date: form.date,
      });
      if (error) throw error;
      toast.success('Usage logged!');
      setUsageModal(false);
      fetchInventory();
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Failed'); } finally { setSaving(false); }
  };

  const totalStockValue = inventory.reduce((s, i) => s + i.stock_value, 0);
  const lowStockItems = inventory.filter((i) => i.current_stock < REORDER_THRESHOLD_KG);

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#E8F5E9', color: '#388E3C' }}><Package className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{inventory.length}</p><p className="text-xs" style={{ color: '#94A3B8' }}>Feed Types</p></div>
        </div>
        <div className="card p-4 flex items-center gap-4" style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', border: 'none' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}><Package className="w-5 h-5 text-white" /></div>
          <div><p className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>{formatCurrency(totalStockValue, farm?.currency)}</p><p className="text-xs" style={{ color: '#A5D6A7' }}>Stock Value</p></div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: lowStockItems.length > 0 ? '#FEE2E2' : '#E8F5E9', color: lowStockItems.length > 0 ? '#EF4444' : '#388E3C' }}><AlertTriangle className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: lowStockItems.length > 0 ? '#EF4444' : '#388E3C' }}>{lowStockItems.length}</p><p className="text-xs" style={{ color: '#94A3B8' }}>Reorder Alerts</p></div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="card p-4" style={{ borderLeft: '4px solid #EF4444', background: '#FEF2F2' }}>
          <h3 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: '#991B1B' }}><AlertTriangle className="w-4 h-4" /> Low Stock Alert</h3>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map((i) => (
              <span key={i.feed_type} className="badge badge-red">{i.feed_type}: {formatNumber(i.current_stock)} {i.unit} remaining</span>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1" />
        <button className="btn btn-secondary btn-sm" onClick={() => exportToCSV(inventory.map((i) => ({ FeedType: i.feed_type, Unit: i.unit, Purchased: i.total_purchased, Used: i.total_used, Stock: i.current_stock, UnitCost: i.unit_cost.toFixed(2), StockValue: i.stock_value.toFixed(2) })), 'feed_inventory')}><Download className="w-4 h-4" /> CSV</button>
        <button className="btn btn-primary" onClick={() => { setForm({ feed_type: '', quantity_used: '', unit: 'kg', animal_group: '', date: getToday() }); setUsageModal(true); }}><Plus className="w-4 h-4" /> Log Usage</button>
      </div>

      {/* Inventory Table */}
      {inventory.length === 0 ? (
        <EmptyState icon={<Package className="w-8 h-8" />} title="No Feed Inventory" description="Purchase feed from the Feed & Nutrition page to see inventory here." />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Feed Type</th><th className="text-right">Purchased</th><th className="text-right">Used</th><th className="text-right">Stock</th><th className="text-right">Unit Cost</th><th className="text-right">Stock Value</th><th>Status</th></tr></thead>
            <tbody>
              {inventory.map((i) => {
                const low = i.current_stock < REORDER_THRESHOLD_KG;
                return (
                  <tr key={i.feed_type}>
                    <td className="font-medium" style={{ color: '#1A1A2E' }}>{i.feed_type}</td>
                    <td className="text-right">{formatNumber(i.total_purchased)} {i.unit}</td>
                    <td className="text-right">{formatNumber(i.total_used)} {i.unit}</td>
                    <td className="text-right font-semibold" style={{ color: low ? '#EF4444' : '#388E3C' }}>{formatNumber(i.current_stock)} {i.unit}</td>
                    <td className="text-right">{formatCurrency(i.unit_cost, farm?.currency)}/{i.unit}</td>
                    <td className="text-right font-semibold">{formatCurrency(i.stock_value, farm?.currency)}</td>
                    <td>{low ? <span className="badge badge-red">Reorder</span> : <span className="badge badge-green">OK</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Usage Modal */}
      <Modal isOpen={usageModal} onClose={() => setUsageModal(false)} title="Log Feed Usage">
        <form onSubmit={handleLogUsage} className="space-y-4">
          <div><label className="label">Feed Type *</label><select className="input select" value={form.feed_type} onChange={(e) => setForm({ ...form, feed_type: e.target.value })} required><option value="">Select type</option>{COMMON_FEED_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}{inventory.filter((i) => !COMMON_FEED_TYPES.includes(i.feed_type as typeof COMMON_FEED_TYPES[number])).map((i) => <option key={i.feed_type} value={i.feed_type}>{i.feed_type}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Quantity Used *</label><input type="number" className="input" value={form.quantity_used} onChange={(e) => setForm({ ...form, quantity_used: e.target.value })} min={0} step={0.5} required /></div>
            <div><label className="label">Unit</label><select className="input select" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}><option value="kg">kg</option><option value="bags">bags</option><option value="bales">bales</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Animal Group</label><input className="input" value={form.animal_group} onChange={(e) => setForm({ ...form, animal_group: e.target.value })} placeholder="e.g. Milking cows" /></div>
            <div><label className="label">Date *</label><input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
          </div>
          <div className="flex justify-end gap-3 pt-2"><button type="button" className="btn btn-secondary" onClick={() => setUsageModal(false)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log Usage'}</button></div>
        </form>
      </Modal>
    </div>
  );
}

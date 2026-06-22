'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { formatDate, formatCurrency, getToday, formatNumber, exportToCSV } from '@/lib/utils';
import type { MilkSale } from '@/lib/types';
import { Plus, Edit2, Trash2, Loader2, ShoppingCart, Download, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MilkSalesPage() {
  const { farm } = useAuth();
  const supabase = createClient();
  const [sales, setSales] = useState<MilkSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editSale, setEditSale] = useState<MilkSale | null>(null);
  const [deleteSale, setDeleteSale] = useState<MilkSale | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ date: getToday(), quantity_litres: '', price_per_litre: '', buyer_name: '' });

  const fetchSales = useCallback(async () => {
    if (!farm) return;
    const { data } = await supabase.from('milk_sales').select('*').eq('farm_id', farm.id).order('date', { ascending: false });
    setSales(data || []);
    setLoading(false);
  }, [farm, supabase]);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  useEffect(() => {
    if (farm && !editSale) {
      setForm((f) => ({ ...f, price_per_litre: String(farm.milk_price_per_litre) }));
    }
  }, [farm, editSale]);

  const openAdd = () => { setEditSale(null); setForm({ date: getToday(), quantity_litres: '', price_per_litre: String(farm?.milk_price_per_litre || 50), buyer_name: '' }); setModalOpen(true); };
  const openEdit = (s: MilkSale) => { setEditSale(s); setForm({ date: s.date, quantity_litres: String(s.quantity_litres), price_per_litre: String(s.price_per_litre), buyer_name: s.buyer_name || '' }); setModalOpen(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farm) return;
    setSaving(true);
    try {
      const payload = { farm_id: farm.id, date: form.date, quantity_litres: Number(form.quantity_litres), price_per_litre: Number(form.price_per_litre), buyer_name: form.buyer_name || null };
      if (editSale) {
        const { error } = await supabase.from('milk_sales').update(payload).eq('id', editSale.id);
        if (error) throw error;
        toast.success('Sale updated!');
      } else {
        const { error } = await supabase.from('milk_sales').insert(payload);
        if (error) throw error;
        toast.success('Sale recorded!');
      }
      setModalOpen(false); fetchSales();
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Failed to save'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteSale) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('milk_sales').delete().eq('id', deleteSale.id);
      if (error) throw error;
      toast.success('Sale deleted'); setDeleteSale(null); fetchSales();
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Failed'); } finally { setDeleting(false); }
  };

  const filtered = sales.filter((s) => !search || s.buyer_name?.toLowerCase().includes(search.toLowerCase()) || s.date.includes(search));
  const totalLitres = filtered.reduce((s, r) => s + Number(r.quantity_litres), 0);
  const totalRevenue = filtered.reduce((s, r) => s + Number(r.total_revenue), 0);

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#E8F5E9', color: '#388E3C' }}><ShoppingCart className="w-5 h-5" /></div>
          <div>
            <p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{sales.length}</p>
            <p className="text-xs" style={{ color: '#94A3B8' }}>Total Sales</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#DBEAFE', color: '#3B82F6' }}><ShoppingCart className="w-5 h-5" /></div>
          <div>
            <p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{formatNumber(totalLitres)} L</p>
            <p className="text-xs" style={{ color: '#94A3B8' }}>Litres Sold</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4" style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', border: 'none' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}><ShoppingCart className="w-5 h-5 text-white" /></div>
          <div>
            <p className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>{formatCurrency(totalRevenue, farm?.currency)}</p>
            <p className="text-xs" style={{ color: '#A5D6A7' }}>Total Revenue</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94A3B8' }} />
          <input className="input" style={{ paddingLeft: '36px' }} placeholder="Search by buyer or date..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => exportToCSV(filtered.map((s) => ({ Date: s.date, Litres: s.quantity_litres, PricePerLitre: s.price_per_litre, Revenue: s.total_revenue, Buyer: s.buyer_name || '' })), 'milk_sales')}><Download className="w-4 h-4" /> CSV</button>
        <button className="btn btn-primary" onClick={openAdd}><Plus className="w-4 h-4" /> Record Sale</button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<ShoppingCart className="w-8 h-8" />} title="No Sales Yet" description="Record your first milk sale to start tracking revenue." action={<button className="btn btn-primary" onClick={openAdd}><Plus className="w-4 h-4" /> Record Sale</button>} />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Date</th><th>Litres</th><th>Price/L</th><th>Revenue</th><th>Buyer</th><th style={{ width: '80px' }}>Actions</th></tr></thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>{formatDate(s.date)}</td>
                  <td className="font-medium">{formatNumber(Number(s.quantity_litres))} L</td>
                  <td>{formatCurrency(Number(s.price_per_litre), farm?.currency)}</td>
                  <td className="font-semibold" style={{ color: '#388E3C' }}>{formatCurrency(Number(s.total_revenue), farm?.currency)}</td>
                  <td>{s.buyer_name || '—'}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(s)}><Edit2 className="w-3.5 h-3.5" /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" style={{ color: '#EF4444' }} onClick={() => setDeleteSale(s)}><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editSale ? 'Edit Sale' : 'Record Milk Sale'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Date *</label><input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} max={getToday()} required /></div>
            <div><label className="label">Buyer</label><input className="input" value={form.buyer_name} onChange={(e) => setForm({ ...form, buyer_name: e.target.value })} placeholder="e.g. Brookside" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Quantity (Litres) *</label><input type="number" className="input" value={form.quantity_litres} onChange={(e) => setForm({ ...form, quantity_litres: e.target.value })} min={0} step={0.5} required /></div>
            <div><label className="label">Price per Litre *</label><input type="number" className="input" value={form.price_per_litre} onChange={(e) => setForm({ ...form, price_per_litre: e.target.value })} min={0} step={0.5} required /></div>
          </div>
          {form.quantity_litres && form.price_per_litre && (
            <div className="p-3 rounded-lg" style={{ background: '#E8F5E9' }}>
              <p className="text-sm font-medium" style={{ color: '#1B5E20' }}>
                Revenue: {formatCurrency(Number(form.quantity_litres) * Number(form.price_per_litre), farm?.currency)}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editSale ? 'Save' : 'Record Sale'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteSale} onClose={() => setDeleteSale(null)} onConfirm={handleDelete} title="Delete Sale" message="Delete this milk sale record?" loading={deleting} />
    </div>
  );
}

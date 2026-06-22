'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { COMMON_FEED_TYPES } from '@/lib/constants';
import { formatDate, formatCurrency, getToday, exportToCSV } from '@/lib/utils';
import type { FeedPurchase } from '@/lib/types';
import { Plus, Edit2, Trash2, Loader2, Wheat, Download, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FeedExpensesPage() {
  const { farm } = useAuth();
  const supabase = createClient();
  const [records, setRecords] = useState<FeedPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<FeedPurchase | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<FeedPurchase | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ feed_type: '', quantity: '', unit: 'kg', cost: '', supplier: '', date: getToday() });

  const fetchRecords = useCallback(async () => {
    if (!farm) return;
    const { data } = await supabase.from('feed_purchases').select('*').eq('farm_id', farm.id).order('date', { ascending: false });
    setRecords(data || []);
    setLoading(false);
  }, [farm, supabase]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const openAdd = () => { setEditRecord(null); setForm({ feed_type: '', quantity: '', unit: 'kg', cost: '', supplier: '', date: getToday() }); setModalOpen(true); };
  const openEdit = (r: FeedPurchase) => { setEditRecord(r); setForm({ feed_type: r.feed_type, quantity: String(r.quantity), unit: r.unit, cost: String(r.cost), supplier: r.supplier || '', date: r.date }); setModalOpen(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); if (!farm) return; setSaving(true);
    try {
      const payload = { farm_id: farm.id, feed_type: form.feed_type, quantity: Number(form.quantity), unit: form.unit, cost: Number(form.cost), supplier: form.supplier || null, date: form.date };
      if (editRecord) { const { error } = await supabase.from('feed_purchases').update(payload).eq('id', editRecord.id); if (error) throw error; toast.success('Updated!'); }
      else { const { error } = await supabase.from('feed_purchases').insert(payload); if (error) throw error; toast.success('Purchase recorded!'); }
      setModalOpen(false); fetchRecords();
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Failed'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteRecord) return; setDeleting(true);
    try { const { error } = await supabase.from('feed_purchases').delete().eq('id', deleteRecord.id); if (error) throw error; toast.success('Deleted'); setDeleteRecord(null); fetchRecords(); }
    catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Failed'); } finally { setDeleting(false); }
  };

  const filtered = records.filter((r) => !search || r.feed_type.toLowerCase().includes(search.toLowerCase()) || r.supplier?.toLowerCase().includes(search.toLowerCase()));
  const totalCost = filtered.reduce((s, r) => s + Number(r.cost), 0);

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#FEF3C7', color: '#F59E0B' }}><Wheat className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{records.length}</p><p className="text-xs" style={{ color: '#94A3B8' }}>Purchases</p></div>
        </div>
        <div className="card p-4 flex items-center gap-4" style={{ background: 'linear-gradient(135deg, #92400E, #B45309)', border: 'none' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}><Wheat className="w-5 h-5 text-white" /></div>
          <div><p className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>{formatCurrency(totalCost, farm?.currency)}</p><p className="text-xs" style={{ color: '#FFE082' }}>Total Feed Cost</p></div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94A3B8' }} /><input className="input" style={{ paddingLeft: '36px' }} placeholder="Search feed type or supplier..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <button className="btn btn-secondary btn-sm" onClick={() => exportToCSV(filtered.map((r) => ({ Date: r.date, FeedType: r.feed_type, Quantity: r.quantity, Unit: r.unit, Cost: r.cost, Supplier: r.supplier || '' })), 'feed_purchases')}><Download className="w-4 h-4" /> CSV</button>
        <button className="btn btn-primary" onClick={openAdd}><Plus className="w-4 h-4" /> Add Purchase</button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Wheat className="w-8 h-8" />} title="No Feed Purchases" description="Record feed purchases to track nutrition costs." action={<button className="btn btn-primary" onClick={openAdd}><Plus className="w-4 h-4" /> Add Purchase</button>} />
      ) : (
        <div className="table-container"><table className="data-table"><thead><tr><th>Date</th><th>Feed Type</th><th>Quantity</th><th>Cost</th><th>Supplier</th><th style={{ width: '80px' }}>Actions</th></tr></thead>
          <tbody>{filtered.map((r) => (<tr key={r.id}><td>{formatDate(r.date)}</td><td className="font-medium" style={{ color: '#1A1A2E' }}>{r.feed_type}</td><td>{r.quantity} {r.unit}</td><td className="font-semibold" style={{ color: '#EF4444' }}>{formatCurrency(Number(r.cost), farm?.currency)}</td><td>{r.supplier || '—'}</td><td><div className="flex items-center gap-1"><button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(r)}><Edit2 className="w-3.5 h-3.5" /></button><button className="btn btn-ghost btn-icon btn-sm" style={{ color: '#EF4444' }} onClick={() => setDeleteRecord(r)}><Trash2 className="w-3.5 h-3.5" /></button></div></td></tr>))}</tbody>
        </table></div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editRecord ? 'Edit Purchase' : 'Record Feed Purchase'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Feed Type *</label><select className="input select" value={form.feed_type} onChange={(e) => setForm({ ...form, feed_type: e.target.value })} required><option value="">Select type</option>{COMMON_FEED_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}</select></div>
            <div><label className="label">Date *</label><input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} max={getToday()} required /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="label">Quantity *</label><input type="number" className="input" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} min={0} step={0.5} required /></div>
            <div><label className="label">Unit</label><select className="input select" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}><option value="kg">kg</option><option value="bags">bags</option><option value="bales">bales</option><option value="litres">litres</option></select></div>
            <div><label className="label">Cost *</label><input type="number" className="input" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} min={0} step={0.01} required /></div>
          </div>
          <div><label className="label">Supplier</label><input className="input" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="Supplier name" /></div>
          <div className="flex justify-end gap-3 pt-2"><button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editRecord ? 'Save' : 'Add Purchase'}</button></div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteRecord} onClose={() => setDeleteRecord(null)} onConfirm={handleDelete} title="Delete Purchase" message="Delete this feed purchase?" loading={deleting} />
    </div>
  );
}

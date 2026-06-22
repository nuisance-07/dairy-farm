'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { OVERHEAD_CATEGORIES } from '@/lib/constants';
import { formatDate, formatCurrency, getToday, exportToCSV } from '@/lib/utils';
import type { OverheadExpense } from '@/lib/types';
import { Plus, Edit2, Trash2, Loader2, Receipt, Download, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OverheadsPage() {
  const { farm } = useAuth();
  const supabase = createClient();
  const [records, setRecords] = useState<OverheadExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<OverheadExpense | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<OverheadExpense | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ category: 'Utilities' as string, amount: '', date: getToday(), description: '' });

  const fetchRecords = useCallback(async () => {
    if (!farm) return;
    const { data } = await supabase.from('overhead_expenses').select('*').eq('farm_id', farm.id).order('date', { ascending: false });
    setRecords(data || []);
    setLoading(false);
  }, [farm, supabase]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const openAdd = () => { setEditRecord(null); setForm({ category: 'Utilities', amount: '', date: getToday(), description: '' }); setModalOpen(true); };
  const openEdit = (r: OverheadExpense) => { setEditRecord(r); setForm({ category: r.category, amount: String(r.amount), date: r.date, description: r.description || '' }); setModalOpen(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); if (!farm) return; setSaving(true);
    try {
      const payload = { farm_id: farm.id, category: form.category, amount: Number(form.amount), date: form.date, description: form.description || null };
      if (editRecord) { const { error } = await supabase.from('overhead_expenses').update(payload).eq('id', editRecord.id); if (error) throw error; toast.success('Updated!'); }
      else { const { error } = await supabase.from('overhead_expenses').insert(payload); if (error) throw error; toast.success('Expense recorded!'); }
      setModalOpen(false); fetchRecords();
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Failed'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteRecord) return; setDeleting(true);
    try { const { error } = await supabase.from('overhead_expenses').delete().eq('id', deleteRecord.id); if (error) throw error; toast.success('Deleted'); setDeleteRecord(null); fetchRecords(); }
    catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Failed'); } finally { setDeleting(false); }
  };

  const filtered = records.filter((r) => !search || r.category.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase()));
  const total = filtered.reduce((s, r) => s + Number(r.amount), 0);

  const catBadge = (c: string) => {
    const map: Record<string, string> = { Utilities: 'badge-blue', Fuel: 'badge-yellow', Repairs: 'badge-red', 'Equipment Maintenance': 'badge-green', Transport: 'badge-gray', Other: 'badge-gray' };
    return map[c] || 'badge-gray';
  };

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div className="card p-4 flex items-center gap-4" style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', border: 'none' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}><Receipt className="w-5 h-5 text-white" /></div>
        <div><p className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>{formatCurrency(total, farm?.currency)}</p><p className="text-xs" style={{ color: '#C4B5FD' }}>Total Overhead Expenses</p></div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94A3B8' }} /><input className="input" style={{ paddingLeft: '36px' }} placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <button className="btn btn-secondary btn-sm" onClick={() => exportToCSV(filtered.map((r) => ({ Date: r.date, Category: r.category, Amount: r.amount, Description: r.description || '' })), 'overheads')}><Download className="w-4 h-4" /> CSV</button>
        <button className="btn btn-primary" onClick={openAdd}><Plus className="w-4 h-4" /> Add Expense</button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Receipt className="w-8 h-8" />} title="No Overheads" description="Record utility bills, fuel, repairs, and other overhead costs." action={<button className="btn btn-primary" onClick={openAdd}><Plus className="w-4 h-4" /> Add Expense</button>} />
      ) : (
        <div className="table-container"><table className="data-table"><thead><tr><th>Date</th><th>Category</th><th>Amount</th><th>Description</th><th style={{ width: '80px' }}>Actions</th></tr></thead>
          <tbody>{filtered.map((r) => (<tr key={r.id}><td>{formatDate(r.date)}</td><td><span className={`badge ${catBadge(r.category)}`}>{r.category}</span></td><td className="font-semibold" style={{ color: '#EF4444' }}>{formatCurrency(Number(r.amount), farm?.currency)}</td><td>{r.description || '—'}</td><td><div className="flex items-center gap-1"><button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(r)}><Edit2 className="w-3.5 h-3.5" /></button><button className="btn btn-ghost btn-icon btn-sm" style={{ color: '#EF4444' }} onClick={() => setDeleteRecord(r)}><Trash2 className="w-3.5 h-3.5" /></button></div></td></tr>))}</tbody>
        </table></div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editRecord ? 'Edit Expense' : 'Add Overhead Expense'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Category *</label><select className="input select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>{OVERHEAD_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
            <div><label className="label">Date *</label><input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} max={getToday()} required /></div>
          </div>
          <div><label className="label">Amount *</label><input type="number" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} min={0} step={0.01} required /></div>
          <div><label className="label">Description</label><textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2"><button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editRecord ? 'Save' : 'Add Expense'}</button></div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteRecord} onClose={() => setDeleteRecord(null)} onConfirm={handleDelete} title="Delete Expense" message="Delete this overhead expense?" loading={deleting} />
    </div>
  );
}

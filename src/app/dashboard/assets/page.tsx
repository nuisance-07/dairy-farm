'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { ASSET_CONDITIONS, ASSET_STATUSES } from '@/lib/constants';
import { formatDate, formatCurrency, getToday, calculateDepreciation, exportToCSV, formatNumber } from '@/lib/utils';
import type { Asset } from '@/lib/types';
import { Plus, Edit2, Trash2, Loader2, Tractor, Download, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AssetsPage() {
  const { farm } = useAuth();
  const supabase = createClient();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<Asset | null>(null);
  const [deleteAsset, setDeleteAsset] = useState<Asset | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ name: '', purchase_date: getToday(), purchase_cost: '', useful_life_years: '5', condition: 'Good' as string, status: 'Active' as string, notes: '' });

  const fetchAssets = useCallback(async () => {
    if (!farm) return;
    const { data } = await supabase.from('assets').select('*').eq('farm_id', farm.id).order('name');
    setAssets(data || []);
    setLoading(false);
  }, [farm, supabase]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  const openAdd = () => { setEditAsset(null); setForm({ name: '', purchase_date: getToday(), purchase_cost: '', useful_life_years: '5', condition: 'Good', status: 'Active', notes: '' }); setModalOpen(true); };
  const openEdit = (a: Asset) => { setEditAsset(a); setForm({ name: a.name, purchase_date: a.purchase_date || '', purchase_cost: String(a.purchase_cost), useful_life_years: String(a.useful_life_years), condition: a.condition, status: a.status, notes: a.notes || '' }); setModalOpen(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); if (!farm) return; setSaving(true);
    try {
      const payload = { farm_id: farm.id, name: form.name, purchase_date: form.purchase_date || null, purchase_cost: Number(form.purchase_cost) || 0, useful_life_years: Number(form.useful_life_years) || 5, condition: form.condition, status: form.status, notes: form.notes || null };
      if (editAsset) { const { error } = await supabase.from('assets').update(payload).eq('id', editAsset.id); if (error) throw error; toast.success('Updated!'); }
      else { const { error } = await supabase.from('assets').insert(payload); if (error) throw error; toast.success('Asset added!'); }
      setModalOpen(false); fetchAssets();
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Failed'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteAsset) return; setDeleting(true);
    try { const { error } = await supabase.from('assets').delete().eq('id', deleteAsset.id); if (error) throw error; toast.success('Deleted'); setDeleteAsset(null); fetchAssets(); }
    catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Failed'); } finally { setDeleting(false); }
  };

  const filtered = assets.filter((a) => !search || a.name.toLowerCase().includes(search.toLowerCase()));
  const totalPurchaseCost = assets.reduce((s, a) => s + Number(a.purchase_cost), 0);
  const totalCurrentValue = assets.reduce((s, a) => {
    if (!a.purchase_date) return s + Number(a.purchase_cost);
    return s + calculateDepreciation(Number(a.purchase_cost), a.useful_life_years, a.purchase_date).currentValue;
  }, 0);

  const statusBadge = (s: string) => ({ Active: 'badge-green', 'Under Repair': 'badge-yellow', Disposed: 'badge-red' }[s] || 'badge-gray');
  const condBadge = (c: string) => ({ Good: 'badge-green', Fair: 'badge-yellow', Poor: 'badge-red' }[c] || 'badge-gray');

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#E8F5E9', color: '#388E3C' }}><Tractor className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{assets.length}</p><p className="text-xs" style={{ color: '#94A3B8' }}>Total Assets</p></div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#DBEAFE', color: '#3B82F6' }}><Tractor className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{formatCurrency(totalPurchaseCost, farm?.currency)}</p><p className="text-xs" style={{ color: '#94A3B8' }}>Purchase Cost</p></div>
        </div>
        <div className="card p-4 flex items-center gap-4" style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', border: 'none' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}><Tractor className="w-5 h-5 text-white" /></div>
          <div><p className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>{formatCurrency(totalCurrentValue, farm?.currency)}</p><p className="text-xs" style={{ color: '#A5D6A7' }}>Current Value</p></div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94A3B8' }} /><input className="input" style={{ paddingLeft: '36px' }} placeholder="Search assets..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <button className="btn btn-secondary btn-sm" onClick={() => exportToCSV(filtered.map((a) => { const dep = a.purchase_date ? calculateDepreciation(Number(a.purchase_cost), a.useful_life_years, a.purchase_date) : null; return { Name: a.name, PurchaseDate: a.purchase_date || '', PurchaseCost: a.purchase_cost, UsefulLife: a.useful_life_years, CurrentValue: dep ? dep.currentValue.toFixed(2) : a.purchase_cost, Condition: a.condition, Status: a.status }; }), 'assets')}><Download className="w-4 h-4" /> CSV</button>
        <button className="btn btn-primary" onClick={openAdd}><Plus className="w-4 h-4" /> Add Asset</button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Tractor className="w-8 h-8" />} title="No Assets" description="Register your farm equipment and assets." action={<button className="btn btn-primary" onClick={openAdd}><Plus className="w-4 h-4" /> Add Asset</button>} />
      ) : (
        <div className="table-container"><table className="data-table"><thead><tr><th>Name</th><th>Purchase Date</th><th>Cost</th><th>Current Value</th><th>Condition</th><th>Status</th><th style={{ width: '80px' }}>Actions</th></tr></thead>
          <tbody>{filtered.map((a) => {
            const dep = a.purchase_date ? calculateDepreciation(Number(a.purchase_cost), a.useful_life_years, a.purchase_date) : null;
            return (
              <tr key={a.id}><td className="font-medium" style={{ color: '#1A1A2E' }}>{a.name}</td><td>{a.purchase_date ? formatDate(a.purchase_date) : '—'}</td><td>{formatCurrency(Number(a.purchase_cost), farm?.currency)}</td><td>
                <div>
                  <span className="font-semibold" style={{ color: '#388E3C' }}>{formatCurrency(dep ? dep.currentValue : Number(a.purchase_cost), farm?.currency)}</span>
                  {dep && <div className="w-full h-1.5 rounded-full mt-1" style={{ background: '#E2E8E2' }}><div className="h-full rounded-full" style={{ width: `${dep.percentRemaining}%`, background: dep.percentRemaining > 50 ? '#22C55E' : dep.percentRemaining > 20 ? '#F59E0B' : '#EF4444' }} /></div>}
                  {dep && <span className="text-xs" style={{ color: '#94A3B8' }}>{formatNumber(dep.percentRemaining)}% remaining</span>}
                </div>
              </td><td><span className={`badge ${condBadge(a.condition)}`}>{a.condition}</span></td><td><span className={`badge ${statusBadge(a.status)}`}>{a.status}</span></td><td><div className="flex items-center gap-1"><button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(a)}><Edit2 className="w-3.5 h-3.5" /></button><button className="btn btn-ghost btn-icon btn-sm" style={{ color: '#EF4444' }} onClick={() => setDeleteAsset(a)}><Trash2 className="w-3.5 h-3.5" /></button></div></td></tr>);
          })}</tbody>
        </table></div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editAsset ? 'Edit Asset' : 'Add Asset'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="label">Asset Name *</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Milking Machine" required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Purchase Date</label><input type="date" className="input" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} /></div>
            <div><label className="label">Purchase Cost</label><input type="number" className="input" value={form.purchase_cost} onChange={(e) => setForm({ ...form, purchase_cost: e.target.value })} min={0} /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="label">Useful Life (yrs)</label><input type="number" className="input" value={form.useful_life_years} onChange={(e) => setForm({ ...form, useful_life_years: e.target.value })} min={1} /></div>
            <div><label className="label">Condition</label><select className="input select" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>{ASSET_CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
            <div><label className="label">Status</label><select className="input select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{ASSET_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <div><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2"><button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editAsset ? 'Save' : 'Add Asset'}</button></div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteAsset} onClose={() => setDeleteAsset(null)} onConfirm={handleDelete} title="Delete Asset" message={`Delete "${deleteAsset?.name}"?`} loading={deleting} />
    </div>
  );
}

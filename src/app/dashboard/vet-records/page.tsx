'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { VET_TYPES } from '@/lib/constants';
import { formatDate, formatCurrency, getToday, exportToCSV } from '@/lib/utils';
import type { VetRecord, Animal } from '@/lib/types';
import { Plus, Edit2, Trash2, Loader2, Stethoscope, Download, Search, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VetRecordsPage() {
  const { farm } = useAuth();
  const supabase = createClient();
  const [records, setRecords] = useState<VetRecord[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<VetRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<VetRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ animal_id: '', date: getToday(), type: 'Treatment' as string, description: '', cost: '', vet_name: '', next_due_date: '' });

  const fetchData = useCallback(async () => {
    if (!farm) return;
    const [recordsRes, animalsRes] = await Promise.all([
      supabase.from('vet_records').select('*, animals(tag, name)').eq('farm_id', farm.id).order('date', { ascending: false }),
      supabase.from('animals').select('*').eq('farm_id', farm.id).in('status', ['Active', 'Dry']),
    ]);
    setRecords(recordsRes.data || []);
    setAnimals(animalsRes.data || []);
    setLoading(false);
  }, [farm, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => { setEditRecord(null); setForm({ animal_id: '', date: getToday(), type: 'Treatment', description: '', cost: '', vet_name: '', next_due_date: '' }); setModalOpen(true); };
  const openEdit = (r: VetRecord) => { setEditRecord(r); setForm({ animal_id: r.animal_id, date: r.date, type: r.type, description: r.description || '', cost: String(r.cost), vet_name: r.vet_name || '', next_due_date: r.next_due_date || '' }); setModalOpen(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); if (!farm) return; setSaving(true);
    try {
      const payload = { farm_id: farm.id, animal_id: form.animal_id, date: form.date, type: form.type, description: form.description || null, cost: Number(form.cost) || 0, vet_name: form.vet_name || null, next_due_date: form.next_due_date || null };
      if (editRecord) { const { error } = await supabase.from('vet_records').update(payload).eq('id', editRecord.id); if (error) throw error; toast.success('Updated!'); }
      else { const { error } = await supabase.from('vet_records').insert(payload); if (error) throw error; toast.success('Record added!'); }
      setModalOpen(false); fetchData();
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Failed'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteRecord) return; setDeleting(true);
    try { const { error } = await supabase.from('vet_records').delete().eq('id', deleteRecord.id); if (error) throw error; toast.success('Deleted'); setDeleteRecord(null); fetchData(); }
    catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Failed'); } finally { setDeleting(false); }
  };

  const filtered = records.filter((r) => {
    const animal = r.animal as unknown as { tag: string; name: string | null } | undefined;
    return !search || animal?.tag?.toLowerCase().includes(search.toLowerCase()) || r.type.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase());
  });
  const totalCost = filtered.reduce((s, r) => s + Number(r.cost), 0);

  // Upcoming reminders
  const today = new Date().toISOString().split('T')[0];
  const upcoming = records.filter((r) => r.next_due_date && r.next_due_date >= today).sort((a, b) => (a.next_due_date || '').localeCompare(b.next_due_date || '')).slice(0, 5);

  const typeBadge = (t: string) => {
    const map: Record<string, string> = { Vaccination: 'badge-green', Treatment: 'badge-red', Deworming: 'badge-yellow', 'Pregnancy Check': 'badge-blue', Other: 'badge-gray' };
    return map[t] || 'badge-gray';
  };

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#E8F5E9', color: '#388E3C' }}><Stethoscope className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{records.length}</p><p className="text-xs" style={{ color: '#94A3B8' }}>Total Records</p></div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#FEE2E2', color: '#EF4444' }}><Stethoscope className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{formatCurrency(totalCost, farm?.currency)}</p><p className="text-xs" style={{ color: '#94A3B8' }}>Total Vet Costs</p></div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#DBEAFE', color: '#3B82F6' }}><Calendar className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{upcoming.length}</p><p className="text-xs" style={{ color: '#94A3B8' }}>Upcoming Reminders</p></div>
        </div>
      </div>

      {/* Upcoming Reminders */}
      {upcoming.length > 0 && (
        <div className="card p-4" style={{ borderLeft: '4px solid #3B82F6' }}>
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#1E40AF' }}><Calendar className="w-4 h-4" /> Upcoming Treatments / Vaccinations</h3>
          <div className="space-y-2">
            {upcoming.map((r) => {
              const animal = r.animal as unknown as { tag: string; name: string | null } | undefined;
              return (
                <div key={r.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg text-sm" style={{ background: '#F0F9FF' }}>
                  <span><span className="font-medium">{animal?.tag || '?'}</span> — {r.type}: {r.description || 'N/A'}</span>
                  <span className="badge badge-blue">{formatDate(r.next_due_date!)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94A3B8' }} /><input className="input" style={{ paddingLeft: '36px' }} placeholder="Search by animal, type..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <button className="btn btn-secondary btn-sm" onClick={() => exportToCSV(filtered.map((r) => { const a = r.animal as unknown as { tag: string } | undefined; return { Date: r.date, Animal: a?.tag || '', Type: r.type, Description: r.description || '', Cost: r.cost, Vet: r.vet_name || '', NextDue: r.next_due_date || '' }; }), 'vet_records')}><Download className="w-4 h-4" /> CSV</button>
        <button className="btn btn-primary" onClick={openAdd}><Plus className="w-4 h-4" /> Add Record</button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Stethoscope className="w-8 h-8" />} title="No Vet Records" description="Log vaccinations, treatments, and health checks for your animals." action={<button className="btn btn-primary" onClick={openAdd}><Plus className="w-4 h-4" /> Add Record</button>} />
      ) : (
        <div className="table-container"><table className="data-table"><thead><tr><th>Date</th><th>Animal</th><th>Type</th><th>Description</th><th>Cost</th><th className="hide-mobile">Vet</th><th style={{ width: '80px' }}>Actions</th></tr></thead>
          <tbody>{filtered.map((r) => { const animal = r.animal as unknown as { tag: string; name: string | null } | undefined; return (
            <tr key={r.id}><td>{formatDate(r.date)}</td><td className="font-medium" style={{ color: '#1A1A2E' }}>{animal?.tag || '—'}</td><td><span className={`badge ${typeBadge(r.type)}`}>{r.type}</span></td><td>{r.description || '—'}</td><td className="font-semibold" style={{ color: '#EF4444' }}>{formatCurrency(Number(r.cost), farm?.currency)}</td><td className="hide-mobile">{r.vet_name || '—'}</td><td><div className="flex items-center gap-1"><button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(r)}><Edit2 className="w-3.5 h-3.5" /></button><button className="btn btn-ghost btn-icon btn-sm" style={{ color: '#EF4444' }} onClick={() => setDeleteRecord(r)}><Trash2 className="w-3.5 h-3.5" /></button></div></td></tr>); })}</tbody>
        </table></div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editRecord ? 'Edit Record' : 'Add Health Record'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Animal *</label><select className="input select" value={form.animal_id} onChange={(e) => setForm({ ...form, animal_id: e.target.value })} required><option value="">Select animal</option>{animals.map((a) => <option key={a.id} value={a.id}>{a.tag} {a.name ? `— ${a.name}` : ''}</option>)}</select></div>
            <div><label className="label">Date *</label><input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Type *</label><select className="input select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required>{VET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label className="label">Cost</label><input type="number" className="input" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} min={0} step={0.01} /></div>
          </div>
          <div><label className="label">Description</label><textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Details..." /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Vet Name</label><input className="input" value={form.vet_name} onChange={(e) => setForm({ ...form, vet_name: e.target.value })} /></div>
            <div><label className="label">Next Due Date</label><input type="date" className="input" value={form.next_due_date} onChange={(e) => setForm({ ...form, next_due_date: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-3 pt-2"><button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editRecord ? 'Save' : 'Add Record'}</button></div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteRecord} onClose={() => setDeleteRecord(null)} onConfirm={handleDelete} title="Delete Record" message="Delete this vet record?" loading={deleting} />
    </div>
  );
}

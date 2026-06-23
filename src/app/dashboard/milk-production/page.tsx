'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { formatDate, getToday, formatNumber, exportToCSV } from '@/lib/utils';
import type { Animal, MilkProduction } from '@/lib/types';
import { Plus, Search, Edit2, Trash2, Loader2, Milk, Download, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MilkProductionPage() {
  const { farm } = useAuth();
  const supabase = createClient();
  const [records, setRecords] = useState<MilkProduction[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState(getToday());
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<MilkProduction | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<MilkProduction | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({ animal_id: '', date: getToday(), session: 'AM' as string, litres: '' });

  const getSessionOptions = (count: number) => {
    if (count === 1) return ['AM'];
    if (count === 2) return ['AM', 'PM'];
    if (count === 3) return ['AM', 'PM', 'Evening'];
    return Array.from({ length: count }, (_, i) => `Session ${i + 1}`);
  };

  const sessionOptions = farm ? getSessionOptions(farm.milking_sessions_per_day) : ['AM'];

  const fetchData = useCallback(async () => {
    if (!farm) return;
    const [recordsRes, animalsRes] = await Promise.all([
      supabase.from('milk_production').select('*, animals(tag, name)').eq('farm_id', farm.id).order('date', { ascending: false }).order('session').limit(200),
      supabase.from('animals').select('*').eq('farm_id', farm.id).eq('status', 'Active').eq('sex', 'Female'),
    ]);
    setRecords(recordsRes.data || []);
    setAnimals(animalsRes.data || []);
    setLoading(false);
  }, [farm, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => {
    setEditRecord(null);
    setForm({ animal_id: '', date: getToday(), session: 'AM', litres: '' });
    setModalOpen(true);
  };

  const openEdit = (r: MilkProduction) => {
    setEditRecord(r);
    setForm({ animal_id: r.animal_id, date: r.date, session: r.session, litres: String(r.litres) });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farm) return;
    setSaving(true);
    try {
      const payload = {
        farm_id: farm.id,
        animal_id: form.animal_id,
        date: form.date,
        session: form.session,
        litres: Number(form.litres),
      };
      if (editRecord) {
        const { error } = await supabase.from('milk_production').update(payload).eq('id', editRecord.id);
        if (error) throw error;
        toast.success('Record updated!');
      } else {
        const { error } = await supabase.from('milk_production').insert(payload);
        if (error) throw error;
        toast.success('Production recorded!');
      }
      setModalOpen(false);
      fetchData();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to save';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteRecord) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('milk_production').delete().eq('id', deleteRecord.id);
      if (error) throw error;
      toast.success('Record deleted');
      setDeleteRecord(null);
      fetchData();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to delete';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = records.filter((r) => {
    const animal = r.animal as unknown as { tag: string; name: string | null } | undefined;
    const matchesSearch = !search || animal?.tag?.toLowerCase().includes(search.toLowerCase()) || animal?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesDate = !dateFilter || r.date === dateFilter;
    return matchesSearch && matchesDate;
  });

  // Daily total
  const dailyTotal = filtered.reduce((s, r) => s + Number(r.litres), 0);

  // Flag below average
  const avgPerRecord = records.length > 0 ? records.reduce((s, r) => s + Number(r.litres), 0) / records.length : 0;

  if (loading) return <TableSkeleton rows={8} />;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#E8F5E9', color: '#388E3C' }}>
            <Milk className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1A1A2E' }}>{formatNumber(dailyTotal)} L</p>
            <p className="text-xs" style={{ color: '#94A3B8' }}>Total for {dateFilter ? formatDate(dateFilter) : 'all dates'}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#DBEAFE', color: '#3B82F6' }}>
            <Milk className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1A1A2E' }}>{filtered.length}</p>
            <p className="text-xs" style={{ color: '#94A3B8' }}>Records</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#FEF3C7', color: '#F59E0B' }}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1A1A2E' }}>
              {filtered.filter((r) => Number(r.litres) < avgPerRecord * 0.7).length}
            </p>
            <p className="text-xs" style={{ color: '#94A3B8' }}>Below Average</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94A3B8' }} />
          <input className="input" style={{ paddingLeft: '36px' }} placeholder="Search by animal tag..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <input type="date" className="input" style={{ width: 'auto' }} value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        <button className="btn btn-secondary btn-sm" onClick={() => setDateFilter('')}>All Dates</button>
        <button className="btn btn-secondary btn-sm" onClick={() => exportToCSV(filtered.map((r) => {
          const a = r.animal as unknown as { tag: string; name: string | null } | undefined;
          return { Date: r.date, Animal: a?.tag || '', Name: a?.name || '', Session: r.session, Litres: r.litres };
        }), 'milk_production')}><Download className="w-4 h-4" /> CSV</button>
        <button className="btn btn-primary" onClick={openAdd}><Plus className="w-4 h-4" /> Record Milk</button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState icon={<Milk className="w-8 h-8" />} title="No Production Records" description="Start recording daily milk production for each cow." action={<button className="btn btn-primary" onClick={openAdd}><Plus className="w-4 h-4" /> Record Milk</button>} />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>Date</th><th>Animal</th><th>Session</th><th>Litres</th><th>Performance</th><th style={{ width: '80px' }}>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const animal = r.animal as unknown as { tag: string; name: string | null } | undefined;
                const belowAvg = Number(r.litres) < avgPerRecord * 0.7;
                return (
                  <tr key={r.id}>
                    <td>{formatDate(r.date)}</td>
                    <td className="font-medium" style={{ color: '#1A1A2E' }}>{animal?.tag || '—'} {animal?.name ? `(${animal.name})` : ''}</td>
                    <td><span className="badge badge-blue">{r.session}</span></td>
                    <td className="font-semibold" style={{ color: '#388E3C' }}>{formatNumber(Number(r.litres))} L</td>
                    <td>{belowAvg ? <span className="badge badge-red"><AlertTriangle className="w-3 h-3" /> Low</span> : <span className="badge badge-green">Normal</span>}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(r)}><Edit2 className="w-3.5 h-3.5" /></button>
                        <button className="btn btn-ghost btn-icon btn-sm" style={{ color: '#EF4444' }} onClick={() => setDeleteRecord(r)}><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editRecord ? 'Edit Record' : 'Record Milk Production'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Animal *</label>
            <select className="input select" value={form.animal_id} onChange={(e) => setForm({ ...form, animal_id: e.target.value })} required>
              <option value="">Select animal</option>
              {animals.map((a) => <option key={a.id} value={a.id}>{a.tag} {a.name ? `— ${a.name}` : ''}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date *</label>
              <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} max={getToday()} required />
            </div>
            <div>
              <label className="label">Session *</label>
              <select className="input select" value={form.session} onChange={(e) => setForm({ ...form, session: e.target.value })} required>
                {sessionOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Litres Produced *</label>
            <input type="number" className="input" value={form.litres} onChange={(e) => setForm({ ...form, litres: e.target.value })} min={0} step={0.1} placeholder="e.g. 5.5" required />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editRecord ? 'Save' : 'Record'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteRecord} onClose={() => setDeleteRecord(null)} onConfirm={handleDelete} title="Delete Record" message="Are you sure you want to delete this milk production record?" loading={deleting} />
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { ANIMAL_STATUSES, ANIMAL_SEXES, COMMON_BREEDS } from '@/lib/constants';
import { calculateAge, formatDate, getToday, exportToCSV } from '@/lib/utils';
import type { Animal } from '@/lib/types';
import {
  Plus, Search, Edit2, Trash2, Loader2, Beef, Download,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function HerdPage() {
  const { farm } = useAuth();
  const supabase = createClient();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [breedFilter, setBreedFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editAnimal, setEditAnimal] = useState<Animal | null>(null);
  const [deleteAnimal, setDeleteAnimal] = useState<Animal | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    tag: '', name: '', breed: '', date_of_birth: '', sex: 'Female' as string, status: 'Active' as string, notes: '',
  });

  const fetchAnimals = useCallback(async () => {
    if (!farm) return;
    const { data } = await supabase
      .from('animals')
      .select('*')
      .eq('farm_id', farm.id)
      .order('created_at', { ascending: false });
    setAnimals(data || []);
    setLoading(false);
  }, [farm, supabase]);

  useEffect(() => { fetchAnimals(); }, [fetchAnimals]);

  const openAdd = () => {
    setEditAnimal(null);
    setForm({ tag: '', name: '', breed: '', date_of_birth: '', sex: 'Female', status: 'Active', notes: '' });
    setModalOpen(true);
  };

  const openEdit = (animal: Animal) => {
    setEditAnimal(animal);
    setForm({
      tag: animal.tag,
      name: animal.name || '',
      breed: animal.breed || '',
      date_of_birth: animal.date_of_birth || '',
      sex: animal.sex,
      status: animal.status,
      notes: animal.notes || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farm) return;
    setSaving(true);

    try {
      const payload = {
        farm_id: farm.id,
        tag: form.tag,
        name: form.name || null,
        breed: form.breed || null,
        date_of_birth: form.date_of_birth || null,
        sex: form.sex,
        status: form.status,
        notes: form.notes || null,
      };

      if (editAnimal) {
        const { error } = await supabase.from('animals').update(payload).eq('id', editAnimal.id);
        if (error) throw error;
        toast.success('Animal updated!');
      } else {
        const { error } = await supabase.from('animals').insert(payload);
        if (error) throw error;
        toast.success('Animal added!');
      }

      setModalOpen(false);
      fetchAnimals();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to save';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteAnimal) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('animals').delete().eq('id', deleteAnimal.id);
      if (error) throw error;
      toast.success('Animal removed');
      setDeleteAnimal(null);
      fetchAnimals();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to delete';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  // Filter animals
  const filtered = animals.filter((a) => {
    const matchesSearch =
      a.tag.toLowerCase().includes(search.toLowerCase()) ||
      (a.name && a.name.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = !statusFilter || a.status === statusFilter;
    const matchesBreed = !breedFilter || a.breed === breedFilter;
    return matchesSearch && matchesStatus && matchesBreed;
  });

  // Stats
  const totalHerd = animals.length;
  const activeMilking = animals.filter((a) => a.status === 'Active' && a.sex === 'Female').length;
  const dryCows = animals.filter((a) => a.status === 'Dry').length;

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      Active: 'badge-green', Dry: 'badge-yellow', Sold: 'badge-blue', Dead: 'badge-red',
    };
    return map[status] || 'badge-gray';
  };

  if (loading) return <TableSkeleton rows={8} />;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Herd Size', value: totalHerd, color: '#1B5E20' },
          { label: 'Active Milking Cows', value: activeMilking, color: '#388E3C' },
          { label: 'Dry Cows', value: dryCows, color: '#F9A825' },
        ].map((s) => (
          <div key={s.label} className="card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15`, color: s.color }}>
              <Beef className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1A1A2E' }}>{s.value}</p>
              <p className="text-xs" style={{ color: '#94A3B8' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94A3B8' }} />
          <input
            className="input"
            style={{ paddingLeft: '36px' }}
            placeholder="Search by tag or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" style={{ color: '#94A3B8' }} />
          <select className="input select" style={{ width: 'auto', minWidth: '120px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            {ANIMAL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="input select" style={{ width: 'auto', minWidth: '120px' }} value={breedFilter} onChange={(e) => setBreedFilter(e.target.value)}>
            <option value="">All Breeds</option>
            {COMMON_BREEDS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => exportToCSV(filtered.map((a) => ({
            Tag: a.tag, Name: a.name || '', Breed: a.breed || '', DOB: a.date_of_birth || '',
            Age: a.date_of_birth ? calculateAge(a.date_of_birth) : '', Sex: a.sex, Status: a.status,
          })), 'herd_register')}
        >
          <Download className="w-4 h-4" /> CSV
        </button>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus className="w-4 h-4" /> Add Animal
        </button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Beef className="w-8 h-8" />}
          title={animals.length === 0 ? 'No Animals Yet' : 'No Results'}
          description={animals.length === 0 ? 'Add your first animal to start tracking your herd.' : 'Try adjusting your search or filters.'}
          action={animals.length === 0 ? <button className="btn btn-primary" onClick={openAdd}><Plus className="w-4 h-4" /> Add Animal</button> : undefined}
        />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tag</th>
                <th>Name</th>
                <th>Breed</th>
                <th className="hide-mobile">DOB</th>
                <th className="hide-mobile">Age</th>
                <th>Sex</th>
                <th>Status</th>
                <th style={{ width: '80px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((animal) => (
                <tr key={animal.id}>
                  <td className="font-medium" style={{ color: '#1A1A2E' }}>{animal.tag}</td>
                  <td>{animal.name || '—'}</td>
                  <td>{animal.breed || '—'}</td>
                  <td className="hide-mobile">{animal.date_of_birth ? formatDate(animal.date_of_birth) : '—'}</td>
                  <td className="hide-mobile">{animal.date_of_birth ? calculateAge(animal.date_of_birth) : '—'}</td>
                  <td>{animal.sex}</td>
                  <td><span className={`badge ${statusBadge(animal.status)}`}>{animal.status}</span></td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(animal)}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button className="btn btn-ghost btn-icon btn-sm" style={{ color: '#EF4444' }} onClick={() => setDeleteAnimal(animal)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editAnimal ? 'Edit Animal' : 'Add Animal'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tag / ID *</label>
              <input className="input" value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="e.g. C-001" required />
            </div>
            <div>
              <label className="label">Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Daisy" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Breed</label>
              <select className="input select" value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })}>
                <option value="">Select breed</option>
                {COMMON_BREEDS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Date of Birth</label>
              <input type="date" className="input" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} max={getToday()} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Sex</label>
              <select className="input select" value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })}>
                {ANIMAL_SEXES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {ANIMAL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any additional notes..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editAnimal ? 'Save Changes' : 'Add Animal'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteAnimal}
        onClose={() => setDeleteAnimal(null)}
        onConfirm={handleDelete}
        title="Delete Animal"
        message={`Are you sure you want to delete "${deleteAnimal?.tag}"? This will also remove all related milk production and vet records.`}
        loading={deleting}
      />
    </div>
  );
}

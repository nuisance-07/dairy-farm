'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { WAGE_TYPES, STAFF_STATUSES } from '@/lib/constants';
import { formatDate, formatCurrency, getToday, exportToCSV } from '@/lib/utils';
import type { Staff, LabourLog } from '@/lib/types';
import { Plus, Edit2, Trash2, Loader2, Users, Download, Search, UserPlus, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LabourPage() {
  const { farm } = useAuth();
  const supabase = createClient();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [logs, setLogs] = useState<LabourLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'staff' | 'logs'>('staff');
  const [search, setSearch] = useState('');
  const [staffModal, setStaffModal] = useState(false);
  const [logModal, setLogModal] = useState(false);
  const [editStaff, setEditStaff] = useState<Staff | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'staff' | 'log'; id: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [staffForm, setStaffForm] = useState({ name: '', role: '', wage_type: 'Monthly' as string, wage_amount: '', contact: '', status: 'Active' as string });
  const [logForm, setLogForm] = useState({ staff_id: '', date: getToday(), hours_worked: '', is_casual: false, casual_name: '', casual_cost: '', notes: '' });

  const fetchData = useCallback(async () => {
    if (!farm) return;
    const [staffRes, logsRes] = await Promise.all([
      supabase.from('staff').select('*').eq('farm_id', farm.id).order('name'),
      supabase.from('labour_logs').select('*, staff(name, role)').eq('farm_id', farm.id).order('date', { ascending: false }).limit(200),
    ]);
    setStaff(staffRes.data || []);
    setLogs(logsRes.data || []);
    setLoading(false);
  }, [farm, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Staff CRUD
  const openAddStaff = () => { setEditStaff(null); setStaffForm({ name: '', role: '', wage_type: 'Monthly', wage_amount: '', contact: '', status: 'Active' }); setStaffModal(true); };
  const openEditStaff = (s: Staff) => { setEditStaff(s); setStaffForm({ name: s.name, role: s.role || '', wage_type: s.wage_type, wage_amount: String(s.wage_amount), contact: s.contact || '', status: s.status }); setStaffModal(true); };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault(); if (!farm) return; setSaving(true);
    try {
      const payload = { farm_id: farm.id, name: staffForm.name, role: staffForm.role || null, wage_type: staffForm.wage_type, wage_amount: Number(staffForm.wage_amount) || 0, contact: staffForm.contact || null, status: staffForm.status };
      if (editStaff) { const { error } = await supabase.from('staff').update(payload).eq('id', editStaff.id); if (error) throw error; toast.success('Updated!'); }
      else { const { error } = await supabase.from('staff').insert(payload); if (error) throw error; toast.success('Staff added!'); }
      setStaffModal(false); fetchData();
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Failed'); } finally { setSaving(false); }
  };

  // Log CRUD
  const openAddLog = () => { setLogForm({ staff_id: '', date: getToday(), hours_worked: '', is_casual: false, casual_name: '', casual_cost: '', notes: '' }); setLogModal(true); };

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault(); if (!farm) return; setSaving(true);
    try {
      const payload = { farm_id: farm.id, staff_id: logForm.is_casual ? null : logForm.staff_id || null, date: logForm.date, hours_worked: Number(logForm.hours_worked) || null, is_casual: logForm.is_casual, casual_name: logForm.is_casual ? logForm.casual_name || null : null, casual_cost: Number(logForm.casual_cost) || 0, notes: logForm.notes || null };
      const { error } = await supabase.from('labour_logs').insert(payload);
      if (error) throw error;
      toast.success('Log recorded!'); setLogModal(false); fetchData();
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Failed'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return; setDeleting(true);
    try {
      const table = deleteTarget.type === 'staff' ? 'staff' : 'labour_logs';
      const { error } = await supabase.from(table).delete().eq('id', deleteTarget.id);
      if (error) throw error;
      toast.success('Deleted'); setDeleteTarget(null); fetchData();
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Failed'); } finally { setDeleting(false); }
  };

  const totalPayroll = staff.filter((s) => s.status === 'Active').reduce((sum, s) => sum + Number(s.wage_amount), 0);
  const totalCasual = logs.filter((l) => l.is_casual).reduce((sum, l) => sum + Number(l.casual_cost), 0);

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#E8F5E9', color: '#388E3C' }}><Users className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{staff.filter((s) => s.status === 'Active').length}</p><p className="text-xs" style={{ color: '#94A3B8' }}>Active Staff</p></div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#DBEAFE', color: '#3B82F6' }}><Users className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{formatCurrency(totalPayroll, farm?.currency)}</p><p className="text-xs" style={{ color: '#94A3B8' }}>Monthly Payroll</p></div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#FEF3C7', color: '#F59E0B' }}><Clock className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{formatCurrency(totalCasual, farm?.currency)}</p><p className="text-xs" style={{ color: '#94A3B8' }}>Casual Labour Cost</p></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: '#E8F5E9' }}>
        {(['staff', 'logs'] as const).map((t) => (
          <button key={t} className="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all" style={{ background: tab === t ? '#FFFFFF' : 'transparent', color: tab === t ? '#1B5E20' : '#4A5568', boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }} onClick={() => setTab(t)}>
            {t === 'staff' ? 'Staff List' : 'Work Logs'}
          </button>
        ))}
      </div>

      {tab === 'staff' ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px] relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94A3B8' }} /><input className="input" style={{ paddingLeft: '36px' }} placeholder="Search staff..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            <button className="btn btn-secondary btn-sm" onClick={() => exportToCSV(staff.map((s) => ({ Name: s.name, Role: s.role || '', WageType: s.wage_type, WageAmount: s.wage_amount, Contact: s.contact || '', Status: s.status })), 'staff')}><Download className="w-4 h-4" /> CSV</button>
            <button className="btn btn-primary" onClick={openAddStaff}><UserPlus className="w-4 h-4" /> Add Staff</button>
          </div>
          {staff.length === 0 ? (
            <EmptyState icon={<Users className="w-8 h-8" />} title="No Staff" description="Add your farm workers." action={<button className="btn btn-primary" onClick={openAddStaff}><UserPlus className="w-4 h-4" /> Add Staff</button>} />
          ) : (
            <div className="table-container"><table className="data-table"><thead><tr><th>Name</th><th>Role</th><th>Wage Type</th><th>Wage</th><th>Contact</th><th>Status</th><th style={{ width: '80px' }}>Actions</th></tr></thead>
              <tbody>{staff.filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase())).map((s) => (
                <tr key={s.id}><td className="font-medium" style={{ color: '#1A1A2E' }}>{s.name}</td><td>{s.role || '—'}</td><td><span className="badge badge-blue">{s.wage_type}</span></td><td className="font-semibold">{formatCurrency(Number(s.wage_amount), farm?.currency)}</td><td>{s.contact || '—'}</td><td><span className={`badge ${s.status === 'Active' ? 'badge-green' : 'badge-gray'}`}>{s.status}</span></td><td><div className="flex items-center gap-1"><button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEditStaff(s)}><Edit2 className="w-3.5 h-3.5" /></button><button className="btn btn-ghost btn-icon btn-sm" style={{ color: '#EF4444' }} onClick={() => setDeleteTarget({ type: 'staff', id: s.id })}><Trash2 className="w-3.5 h-3.5" /></button></div></td></tr>))}</tbody>
            </table></div>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn btn-secondary btn-sm" onClick={() => exportToCSV(logs.map((l) => { const s = l.staff as unknown as { name: string } | undefined; return { Date: l.date, Staff: l.is_casual ? l.casual_name || 'Casual' : s?.name || '', Hours: l.hours_worked || '', IsCasual: l.is_casual, CasualCost: l.casual_cost, Notes: l.notes || '' }; }), 'labour_logs')}><Download className="w-4 h-4" /> CSV</button>
            <button className="btn btn-primary" onClick={openAddLog}><Plus className="w-4 h-4" /> Log Work</button>
          </div>
          {logs.length === 0 ? (
            <EmptyState icon={<Clock className="w-8 h-8" />} title="No Work Logs" description="Record daily work attendance." action={<button className="btn btn-primary" onClick={openAddLog}><Plus className="w-4 h-4" /> Log Work</button>} />
          ) : (
            <div className="table-container"><table className="data-table"><thead><tr><th>Date</th><th>Worker</th><th>Hours</th><th>Casual?</th><th>Cost</th><th>Notes</th><th style={{ width: '50px' }}></th></tr></thead>
              <tbody>{logs.map((l) => { const s = l.staff as unknown as { name: string } | undefined; return (
                <tr key={l.id}><td>{formatDate(l.date)}</td><td className="font-medium" style={{ color: '#1A1A2E' }}>{l.is_casual ? l.casual_name || 'Casual' : s?.name || '—'}</td><td>{l.hours_worked || '—'}</td><td>{l.is_casual ? <span className="badge badge-yellow">Yes</span> : <span className="badge badge-green">No</span>}</td><td className="font-semibold" style={{ color: l.is_casual ? '#EF4444' : '#94A3B8' }}>{l.is_casual ? formatCurrency(Number(l.casual_cost), farm?.currency) : '—'}</td><td>{l.notes || '—'}</td><td><button className="btn btn-ghost btn-icon btn-sm" style={{ color: '#EF4444' }} onClick={() => setDeleteTarget({ type: 'log', id: l.id })}><Trash2 className="w-3.5 h-3.5" /></button></td></tr>); })}</tbody>
            </table></div>
          )}
        </>
      )}

      {/* Staff Modal */}
      <Modal isOpen={staffModal} onClose={() => setStaffModal(false)} title={editStaff ? 'Edit Staff' : 'Add Staff'}>
        <form onSubmit={handleSaveStaff} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Name *</label><input className="input" value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} required /></div>
            <div><label className="label">Role</label><input className="input" value={staffForm.role} onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })} placeholder="e.g. Milker" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Wage Type</label><select className="input select" value={staffForm.wage_type} onChange={(e) => setStaffForm({ ...staffForm, wage_type: e.target.value })}>{WAGE_TYPES.map((w) => <option key={w} value={w}>{w}</option>)}</select></div>
            <div><label className="label">Wage Amount</label><input type="number" className="input" value={staffForm.wage_amount} onChange={(e) => setStaffForm({ ...staffForm, wage_amount: e.target.value })} min={0} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Contact</label><input className="input" value={staffForm.contact} onChange={(e) => setStaffForm({ ...staffForm, contact: e.target.value })} /></div>
            <div><label className="label">Status</label><select className="input select" value={staffForm.status} onChange={(e) => setStaffForm({ ...staffForm, status: e.target.value })}>{STAFF_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <div className="flex justify-end gap-3 pt-2"><button type="button" className="btn btn-secondary" onClick={() => setStaffModal(false)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editStaff ? 'Save' : 'Add Staff'}</button></div>
        </form>
      </Modal>

      {/* Log Modal */}
      <Modal isOpen={logModal} onClose={() => setLogModal(false)} title="Log Work">
        <form onSubmit={handleSaveLog} className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={logForm.is_casual} onChange={(e) => setLogForm({ ...logForm, is_casual: e.target.checked })} className="rounded" /><span className="text-sm font-medium">Casual Worker</span></label>
          </div>
          {logForm.is_casual ? (
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Worker Name</label><input className="input" value={logForm.casual_name} onChange={(e) => setLogForm({ ...logForm, casual_name: e.target.value })} /></div>
              <div><label className="label">Daily Cost</label><input type="number" className="input" value={logForm.casual_cost} onChange={(e) => setLogForm({ ...logForm, casual_cost: e.target.value })} min={0} /></div>
            </div>
          ) : (
            <div><label className="label">Staff Member</label><select className="input select" value={logForm.staff_id} onChange={(e) => setLogForm({ ...logForm, staff_id: e.target.value })}><option value="">Select staff</option>{staff.filter((s) => s.status === 'Active').map((s) => <option key={s.id} value={s.id}>{s.name} — {s.role || 'N/A'}</option>)}</select></div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Date *</label><input type="date" className="input" value={logForm.date} onChange={(e) => setLogForm({ ...logForm, date: e.target.value })} required /></div>
            <div><label className="label">Hours Worked</label><input type="number" className="input" value={logForm.hours_worked} onChange={(e) => setLogForm({ ...logForm, hours_worked: e.target.value })} min={0} max={24} step={0.5} /></div>
          </div>
          <div><label className="label">Notes</label><textarea className="input" rows={2} value={logForm.notes} onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2"><button type="button" className="btn btn-secondary" onClick={() => setLogModal(false)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log Work'}</button></div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete" message="Are you sure you want to delete this record?" loading={deleting} />
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CURRENCIES, MONTHS } from '@/lib/constants';
import { Settings, Save, Loader2, MapPin, DollarSign, Target } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FarmSetupPage() {
  const { user, farm, refreshFarm } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    location: '',
    currency: 'KES',
    milk_price_per_litre: 50,
    milking_sessions_per_day: 2,
    target_milk_per_cow: 15,
    financial_year_start: 1,
  });

  useEffect(() => {
    if (farm) {
      setForm({
        name: farm.name,
        location: farm.location || '',
        currency: farm.currency,
        milk_price_per_litre: farm.milk_price_per_litre,
        milking_sessions_per_day: farm.milking_sessions_per_day,
        target_milk_per_cow: farm.target_milk_per_cow,
        financial_year_start: farm.financial_year_start,
      });
    }
  }, [farm]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      if (farm) {
        // Update existing farm
        const { error } = await supabase
          .from('farms')
          .update({
            ...form,
            milk_price_per_litre: Number(form.milk_price_per_litre),
            milking_sessions_per_day: Number(form.milking_sessions_per_day),
            target_milk_per_cow: Number(form.target_milk_per_cow),
            financial_year_start: Number(form.financial_year_start),
          })
          .eq('id', farm.id);

        if (error) throw error;
        toast.success('Farm settings updated!');
      } else {
        // Create new farm
        const { error } = await supabase.from('farms').insert({
          user_id: user.id,
          ...form,
          milk_price_per_litre: Number(form.milk_price_per_litre),
          milking_sessions_per_day: Number(form.milking_sessions_per_day),
          target_milk_per_cow: Number(form.target_milk_per_cow),
          financial_year_start: Number(form.financial_year_start),
        });

        if (error) throw error;
        toast.success('Farm created successfully!');
      }

      await refreshFarm();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        {/* Header */}
        <div className="px-6 py-5 border-b" style={{ borderColor: '#E2E8E2' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#E8F5E9', color: '#388E3C' }}>
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1A1A2E' }}>
                {farm ? 'Farm Settings' : 'Set Up Your Farm'}
              </h2>
              <p className="text-sm" style={{ color: '#94A3B8' }}>
                {farm ? 'Update your farm details and assumptions' : 'Configure your farm to get started'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* Farm Info Section */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide mb-4 flex items-center gap-2" style={{ color: '#388E3C' }}>
              <MapPin className="w-4 h-4" /> Farm Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Farm Name *</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Green Valley Farm"
                  required
                />
              </div>
              <div>
                <label className="label">Location</label>
                <input
                  className="input"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Kiambu, Kenya"
                />
              </div>
            </div>
          </div>

          <hr style={{ borderColor: '#E2E8E2' }} />

          {/* Financial Settings */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide mb-4 flex items-center gap-2" style={{ color: '#388E3C' }}>
              <DollarSign className="w-4 h-4" /> Financial Settings
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Currency</label>
                <select
                  className="input select"
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Milk Price per Litre</label>
                <input
                  type="number"
                  className="input"
                  value={form.milk_price_per_litre}
                  onChange={(e) => setForm({ ...form, milk_price_per_litre: Number(e.target.value) })}
                  min={0}
                  step={0.5}
                />
              </div>
              <div>
                <label className="label">Financial Year Start</label>
                <select
                  className="input select"
                  value={form.financial_year_start}
                  onChange={(e) => setForm({ ...form, financial_year_start: Number(e.target.value) })}
                >
                  {MONTHS.map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <hr style={{ borderColor: '#E2E8E2' }} />

          {/* Production Settings */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide mb-4 flex items-center gap-2" style={{ color: '#388E3C' }}>
              <Target className="w-4 h-4" /> Production Assumptions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Milking Sessions per Day</label>
                <select
                  className="input select"
                  value={form.milking_sessions_per_day}
                  onChange={(e) => setForm({ ...form, milking_sessions_per_day: Number(e.target.value) })}
                >
                  <option value={1}>1 (AM only)</option>
                  <option value={2}>2 (AM & PM)</option>
                  <option value={3}>3 (AM, PM & Evening)</option>
                </select>
              </div>
              <div>
                <label className="label">Target Milk per Cow (L/day)</label>
                <input
                  type="number"
                  className="input"
                  value={form.target_milk_per_cow}
                  onChange={(e) => setForm({ ...form, target_milk_per_cow: Number(e.target.value) })}
                  min={0}
                  step={0.5}
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {farm ? 'Save Changes' : 'Create Farm'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

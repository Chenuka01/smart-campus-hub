import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { facilityApi, bookingApi } from '@/lib/api';
import type { Facility } from '@/lib/types';
import { ArrowLeft, CalendarDays, Building2, Users } from 'lucide-react';
import LiquidGlassCard from '@/components/LiquidGlassCard';
import NeuButton from '@/components/NeuButton';
import { itemVariants, errorShakeVariants } from '@/lib/animations';

export default function BookingFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedFacilityId = searchParams.get('facilityId');
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [shakeKey, setShakeKey] = useState(0);
  const [form, setForm] = useState({
    facilityId: preselectedFacilityId || '',
    date: '',
    startTime: '',
    endTime: '',
    purpose: '',
    expectedAttendees: 1,
  });

  useEffect(() => {
    facilityApi.getAll().then(res => {
      setFacilities(res.data.filter((f: Facility) => f.status === 'ACTIVE'));
    }).finally(() => setLoading(false));
  }, []);

  const selectedFacility = facilities.find(f => f.id === form.facilityId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await bookingApi.create(form);
      navigate('/bookings');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to create booking. There may be a scheduling conflict.');
      setShakeKey(k => k + 1);
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
    </div>
  );

  return (
    <motion.div variants={itemVariants} initial="hidden" animate="visible" className="max-w-2xl mx-auto pb-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 mb-6 transition-colors font-medium">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <LiquidGlassCard depth={3}>
        {/* Form header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0" style={{ boxShadow: '0 0 16px rgba(59,130,246,0.4)' }}>
            <CalendarDays className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">New Booking</h1>
            <p className="text-sm text-slate-400 mt-0.5">Reserve a facility or equipment</p>
          </div>
        </div>

        {/* Error */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div key={shakeKey} variants={errorShakeVariants} initial="idle" animate="shake"
              className="mb-6 p-4 rounded-xl text-sm text-rose-300 font-medium"
              style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)' }}>
              ⚠️ {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Facility */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Facility *</label>
            <select value={form.facilityId} onChange={e => setForm({ ...form, facilityId: e.target.value })}
              className="glass-select w-full px-4 py-3 rounded-xl text-sm" required>
              <option value="">Select a facility</option>
              {facilities.map(f => <option key={f.id} value={f.id}>{f.name} ({f.type.replace(/_/g, ' ')}) – {f.location}</option>)}
            </select>
          </div>

          {/* Selected facility preview */}
          <AnimatePresence>
            {selectedFacility && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="p-4 rounded-xl" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-violet-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-white">{selectedFacility.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-3">
                      <span>{selectedFacility.location}</span>
                      {selectedFacility.capacity > 0 && <span className="flex items-center gap-1"><Users className="w-3 h-3" />Capacity: {selectedFacility.capacity}</span>}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Date *</label>
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="glass-input w-full px-4 py-3 rounded-xl text-sm" required />
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Start Time *</label>
              <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })}
                className="glass-input w-full px-4 py-3 rounded-xl text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">End Time *</label>
              <input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })}
                className="glass-input w-full px-4 py-3 rounded-xl text-sm" required />
            </div>
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Purpose *</label>
            <textarea value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })}
              rows={3} className="glass-input w-full px-4 py-3 rounded-xl text-sm resize-none"
              placeholder="Describe the purpose of this booking…" required />
          </div>

          {/* Attendees */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Expected Attendees</label>
            <input type="number" value={form.expectedAttendees}
              onChange={e => setForm({ ...form, expectedAttendees: parseInt(e.target.value) || 1 })}
              min="1" className="glass-input w-full px-4 py-3 rounded-xl text-sm" />
          </div>

          <div className="flex gap-3 pt-2">
            <NeuButton type="submit" loading={saving} variant="primary" fullWidth icon={<CalendarDays className="w-4 h-4" />} iconPosition="left">
              Submit Booking
            </NeuButton>
            <NeuButton type="button" onClick={() => navigate(-1)} variant="ghost">Cancel</NeuButton>
          </div>
        </form>
      </LiquidGlassCard>
    </motion.div>
  );
}

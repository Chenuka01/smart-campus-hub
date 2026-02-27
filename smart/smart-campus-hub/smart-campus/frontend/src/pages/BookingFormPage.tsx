import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { facilityApi, bookingApi } from '@/lib/api';
import type { Facility } from '@/lib/types';
import { ArrowLeft, CalendarDays, Building2 } from 'lucide-react';

export default function BookingFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedFacilityId = searchParams.get('facilityId');

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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
      const activeFacilities = res.data.filter((f: Facility) => f.status === 'ACTIVE');
      setFacilities(activeFacilities);
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
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
            <CalendarDays className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">New Booking</h1>
            <p className="text-sm text-slate-500">Reserve a facility or equipment</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Facility *</label>
            <select value={form.facilityId} onChange={e => setForm({ ...form, facilityId: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500" required>
              <option value="">Select a facility</option>
              {facilities.map(f => (
                <option key={f.id} value={f.id}>{f.name} ({f.type.replace(/_/g, ' ')}) - {f.location}</option>
              ))}
            </select>
          </div>

          {selectedFacility && (
            <div className="p-4 bg-violet-50 border border-violet-200 rounded-xl">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-violet-600" />
                <div>
                  <p className="font-semibold text-violet-900">{selectedFacility.name}</p>
                  <p className="text-sm text-violet-700">
                    {selectedFacility.location} | Capacity: {selectedFacility.capacity}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Date *</label>
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Start Time *</label>
              <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">End Time *</label>
              <input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Purpose *</label>
            <textarea value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })}
              rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="Describe the purpose of this booking..." required />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Expected Attendees</label>
            <input type="number" value={form.expectedAttendees} onChange={e => setForm({ ...form, expectedAttendees: parseInt(e.target.value) || 1 })}
              min="1" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={saving}
              className="flex-1 py-3 gradient-primary text-white font-semibold rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> :
                <><CalendarDays className="w-4 h-4" /> Submit Booking</>}
            </button>
            <button type="button" onClick={() => navigate(-1)}
              className="px-6 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-all">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

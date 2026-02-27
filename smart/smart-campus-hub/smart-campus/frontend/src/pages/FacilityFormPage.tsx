import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { facilityApi } from '@/lib/api';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';

const facilityTypes = [
  'LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'AUDITORIUM',
  'PROJECTOR', 'CAMERA', 'LAPTOP', 'WHITEBOARD', 'OTHER_EQUIPMENT'
];

export default function FacilityFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newAmenity, setNewAmenity] = useState('');

  const [form, setForm] = useState({
    name: '', type: 'LECTURE_HALL', capacity: 0, location: '',
    building: '', floor: '', description: '', status: 'ACTIVE',
    amenities: [] as string[],
  });

  useEffect(() => {
    if (id) {
      setLoading(true);
      facilityApi.getById(id).then(res => {
        const f = res.data;
        setForm({
          name: f.name, type: f.type, capacity: f.capacity, location: f.location,
          building: f.building || '', floor: f.floor || '', description: f.description || '',
          status: f.status, amenities: f.amenities || [],
        });
      }).finally(() => setLoading(false));
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...form,
        availabilityWindows: [
          { dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '18:00' },
          { dayOfWeek: 'TUESDAY', startTime: '08:00', endTime: '18:00' },
          { dayOfWeek: 'WEDNESDAY', startTime: '08:00', endTime: '18:00' },
          { dayOfWeek: 'THURSDAY', startTime: '08:00', endTime: '18:00' },
          { dayOfWeek: 'FRIDAY', startTime: '08:00', endTime: '18:00' },
        ],
      };
      if (isEdit) {
        await facilityApi.update(id!, data);
      } else {
        await facilityApi.create(data);
      }
      navigate('/facilities');
    } catch {
      alert('Failed to save facility');
    } finally {
      setSaving(false);
    }
  };

  const addAmenity = () => {
    if (newAmenity.trim() && !form.amenities.includes(newAmenity.trim())) {
      setForm({ ...form, amenities: [...form.amenities, newAmenity.trim()] });
      setNewAmenity('');
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
        <h1 className="text-2xl font-bold text-slate-900 mb-6">
          {isEdit ? 'Edit Facility' : 'Add New Facility'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Name *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Type *</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500">
                {facilityTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Capacity</label>
              <input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500" min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Location *</label>
              <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Building</label>
              <input type="text" value={form.building} onChange={e => setForm({ ...form, building: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Floor</label>
              <input type="text" value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500">
                <option value="ACTIVE">Active</option>
                <option value="OUT_OF_SERVICE">Out of Service</option>
                <option value="UNDER_MAINTENANCE">Under Maintenance</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Amenities</label>
              <div className="flex gap-2 mb-2">
                <input type="text" value={newAmenity} onChange={e => setNewAmenity(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                  placeholder="Add amenity..." className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm" />
                <button type="button" onClick={addAmenity}
                  className="px-3 py-2 bg-violet-50 text-violet-600 rounded-xl hover:bg-violet-100 transition-all">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.amenities.map(a => (
                  <span key={a} className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-lg">
                    {a}
                    <button type="button" onClick={() => setForm({ ...form, amenities: form.amenities.filter(x => x !== a) })}>
                      <X className="w-3 h-3 text-slate-400 hover:text-slate-600" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={saving}
              className="flex-1 py-3 gradient-primary text-white font-semibold rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> :
                <><Save className="w-4 h-4" /> {isEdit ? 'Update' : 'Create'} Facility</>}
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

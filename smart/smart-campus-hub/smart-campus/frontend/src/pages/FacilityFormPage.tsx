import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { facilityApi } from '@/lib/api';
import { ArrowLeft, Save, Plus, X, Building2 } from 'lucide-react';
import LiquidGlassCard from '@/components/LiquidGlassCard';
import NeuButton from '@/components/NeuButton';
import { itemVariants } from '@/lib/animations';

const facilityTypes = ['LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'AUDITORIUM', 'PROJECTOR', 'CAMERA', 'LAPTOP', 'WHITEBOARD', 'OTHER_EQUIPMENT'];

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
      if (isEdit) await facilityApi.update(id!, data); else await facilityApi.create(data);
      navigate('/facilities');
    } catch { alert('Failed to save facility'); } finally { setSaving(false); }
  };

  const addAmenity = () => {
    if (newAmenity.trim() && !form.amenities.includes(newAmenity.trim())) {
      setForm({ ...form, amenities: [...form.amenities, newAmenity.trim()] });
      setNewAmenity('');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
    </div>
  );

  return (
    <motion.div variants={itemVariants} initial="hidden" animate="visible" className="max-w-2xl mx-auto pb-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 mb-6 transition-colors font-medium">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <LiquidGlassCard depth={3}>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center flex-shrink-0"
            style={{ boxShadow: '0 0 16px rgba(139,92,246,0.4)' }}>
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{isEdit ? 'Edit Facility' : 'Add New Facility'}</h1>
            <p className="text-sm text-slate-400 mt-0.5">{isEdit ? 'Update facility information' : 'Create a new campus resource'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-300 mb-2">Name *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="glass-input w-full px-4 py-3 rounded-xl text-sm" placeholder="e.g. Engineering Lab A" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Type *</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                className="glass-select w-full px-4 py-3 rounded-xl text-sm">
                {facilityTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Capacity</label>
              <input type="number" value={form.capacity} min="0"
                onChange={e => setForm({ ...form, capacity: parseInt(e.target.value) || 0 })}
                className="glass-input w-full px-4 py-3 rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Location *</label>
              <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                className="glass-input w-full px-4 py-3 rounded-xl text-sm" placeholder="e.g. Block A" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Building</label>
              <input type="text" value={form.building} onChange={e => setForm({ ...form, building: e.target.value })}
                className="glass-input w-full px-4 py-3 rounded-xl text-sm" placeholder="Building name" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Floor</label>
              <input type="text" value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })}
                className="glass-input w-full px-4 py-3 rounded-xl text-sm" placeholder="e.g. 2nd Floor" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                className="glass-select w-full px-4 py-3 rounded-xl text-sm">
                <option value="ACTIVE">Active</option>
                <option value="OUT_OF_SERVICE">Out of Service</option>
                <option value="UNDER_MAINTENANCE">Under Maintenance</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-300 mb-2">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                rows={3} className="glass-input w-full px-4 py-3 rounded-xl text-sm resize-none"
                placeholder="Brief description of this facility…" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-300 mb-2">Amenities</label>
              <div className="flex gap-2 mb-3">
                <input type="text" value={newAmenity} onChange={e => setNewAmenity(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                  placeholder="Add amenity and press Enter…"
                  className="glass-input flex-1 px-4 py-2.5 rounded-xl text-sm" />
                <motion.button type="button" onClick={addAmenity}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="p-2.5 rounded-xl text-violet-400 hover:text-violet-300 transition-colors"
                  style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}>
                  <Plus className="w-4 h-4" />
                </motion.button>
              </div>
              {form.amenities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.amenities.map(a => (
                    <motion.span key={a} layout initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-xl text-slate-300"
                      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {a}
                      <button type="button" onClick={() => setForm({ ...form, amenities: form.amenities.filter(x => x !== a) })}
                        className="text-slate-500 hover:text-rose-400 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </motion.span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <NeuButton type="submit" loading={saving} variant="primary" fullWidth icon={<Save className="w-4 h-4" />} iconPosition="left">
              {isEdit ? 'Update' : 'Create'} Facility
            </NeuButton>
            <NeuButton type="button" onClick={() => navigate(-1)} variant="ghost">Cancel</NeuButton>
          </div>
        </form>
      </LiquidGlassCard>
    </motion.div>
  );
}

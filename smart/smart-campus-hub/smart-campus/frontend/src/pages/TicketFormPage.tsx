import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { facilityApi, ticketApi } from '@/lib/api';
import type { Facility } from '@/lib/types';
import { ArrowLeft, Ticket, AlertTriangle } from 'lucide-react';
import LiquidGlassCard from '@/components/LiquidGlassCard';
import NeuButton from '@/components/NeuButton';
import { itemVariants, errorShakeVariants } from '@/lib/animations';

const categories = ['Electrical', 'Plumbing', 'HVAC', 'IT Equipment', 'Furniture', 'Cleaning', 'Safety', 'Other'];

const priorityColors: Record<string, { bg: string; border: string; text: string }> = {
  LOW: { bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)', text: 'text-slate-400' },
  MEDIUM: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', text: 'text-amber-400' },
  HIGH: { bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)', text: 'text-orange-400' },
  CRITICAL: { bg: 'rgba(244,63,94,0.12)', border: 'rgba(244,63,94,0.3)', text: 'text-rose-400' },
};

export default function TicketFormPage() {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [shakeKey, setShakeKey] = useState(0);
  const [form, setForm] = useState({
    title: '', facilityId: '', location: '', category: 'IT Equipment',
    description: '', priority: 'MEDIUM', contactEmail: '', contactPhone: '',
  });

  useEffect(() => {
    facilityApi.getAll().then(res => setFacilities(res.data)).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await ticketApi.create(form);
      navigate('/tickets');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to create ticket');
      setShakeKey(k => k + 1);
    } finally { setSaving(false); }
  };

  const pc = priorityColors[form.priority] || priorityColors.MEDIUM;

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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0" style={{ boxShadow: '0 0 16px rgba(245,158,11,0.4)' }}>
            <Ticket className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Report an Issue</h1>
            <p className="text-sm text-slate-400 mt-0.5">Create a maintenance ticket</p>
          </div>
        </div>

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
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Title *</label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="glass-input w-full px-4 py-3 rounded-xl text-sm"
              placeholder="Brief description of the issue" required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Related Facility</label>
              <select value={form.facilityId} onChange={e => setForm({ ...form, facilityId: e.target.value })}
                className="glass-select w-full px-4 py-3 rounded-xl text-sm">
                <option value="">Select facility (optional)</option>
                {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Location *</label>
              <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                className="glass-input w-full px-4 py-3 rounded-xl text-sm"
                placeholder="e.g. Block A, Room 101" required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Category *</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="glass-select w-full px-4 py-3 rounded-xl text-sm">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Priority *</label>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                className="glass-select w-full px-4 py-3 rounded-xl text-sm">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          {/* Priority indicator */}
          <motion.div
            layout
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold"
            style={{ background: pc.bg, border: `1px solid ${pc.border}` }}
          >
            {(form.priority === 'CRITICAL' || form.priority === 'HIGH') && (
              <AlertTriangle className={`w-4 h-4 ${pc.text} ${form.priority === 'CRITICAL' ? 'animate-pulse-glow' : ''}`} />
            )}
            <span className={pc.text}>
              {form.priority === 'CRITICAL' ? '🔴 Critical – Immediate attention required'
              : form.priority === 'HIGH' ? '🟠 High – Resolve as soon as possible'
              : form.priority === 'MEDIUM' ? '🟡 Medium – Standard priority'
              : '⚪ Low – Non-urgent issue'}
            </span>
          </motion.div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Description *</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={4} className="glass-input w-full px-4 py-3 rounded-xl text-sm resize-none"
              placeholder="Describe the issue in detail…" required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Contact Email</label>
              <input type="email" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })}
                className="glass-input w-full px-4 py-3 rounded-xl text-sm"
                placeholder="your@email.com" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Contact Phone</label>
              <input type="tel" value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })}
                className="glass-input w-full px-4 py-3 rounded-xl text-sm"
                placeholder="+94 77 123 4567" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <NeuButton type="submit" loading={saving} variant="primary" fullWidth icon={<Ticket className="w-4 h-4" />} iconPosition="left">
              Submit Ticket
            </NeuButton>
            <NeuButton type="button" onClick={() => navigate(-1)} variant="ghost">Cancel</NeuButton>
          </div>
        </form>
      </LiquidGlassCard>
    </motion.div>
  );
}

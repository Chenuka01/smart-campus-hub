import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { facilityApi } from '@/lib/api';
import type { Facility } from '@/lib/types';
import {
  Building2, Search, Filter, Plus, MapPin, Users,
  Monitor, Camera, Laptop, FlaskConical, Presentation, X, BarChart3, Heart
} from 'lucide-react';
import LiquidGlassCard from '@/components/LiquidGlassCard';
import NeuButton from '@/components/NeuButton';
import { containerVariants, itemVariants } from '@/lib/animations';

const typeIcons: Record<string, typeof Building2> = {
  LECTURE_HALL: Presentation,
  LAB: FlaskConical,
  MEETING_ROOM: Monitor,
  AUDITORIUM: Building2,
  PROJECTOR: Monitor,
  CAMERA: Camera,
  LAPTOP: Laptop,
  OTHER_EQUIPMENT: Building2,
};

const typeColors: Record<string, { gradient: string; glow: string }> = {
  LECTURE_HALL: { gradient: 'from-violet-500 to-indigo-500', glow: 'rgba(139,92,246,0.4)' },
  LAB: { gradient: 'from-emerald-500 to-teal-500', glow: 'rgba(16,185,129,0.4)' },
  MEETING_ROOM: { gradient: 'from-blue-500 to-cyan-500', glow: 'rgba(59,130,246,0.4)' },
  AUDITORIUM: { gradient: 'from-purple-500 to-fuchsia-500', glow: 'rgba(168,85,247,0.4)' },
  PROJECTOR: { gradient: 'from-amber-500 to-orange-500', glow: 'rgba(245,158,11,0.4)' },
  CAMERA: { gradient: 'from-rose-500 to-pink-500', glow: 'rgba(244,63,94,0.4)' },
  LAPTOP: { gradient: 'from-slate-500 to-slate-600', glow: 'rgba(100,116,139,0.4)' },
  OTHER_EQUIPMENT: { gradient: 'from-indigo-500 to-blue-500', glow: 'rgba(99,102,241,0.4)' },
};

export default function FacilitiesPage() {
  const { isAdmin, isManager } = useAuth();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchFacilities(); }, []);

  const fetchFacilities = async () => {
    try {
      const res = await facilityApi.getAll();
      setFacilities(res.data);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const types = [...new Set(facilities.map(f => f.type))];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
        <p className="text-sm text-slate-500 animate-pulse">Loading facilities…</p>
      </div>
    );
  }

  const canManage = isAdmin || isManager;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 pb-8">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Resource <span className="text-gradient">Categories</span></h1>
          <p className="text-slate-400 text-sm mt-1">Browse campus resources by type</p>
        </div>
        <div className="flex items-center gap-3">
          {!canManage && (
            <Link to="/facilities/favorites">
              <NeuButton variant="secondary" size="md" icon={<Heart className="w-4 h-4 fill-rose-500/20 text-rose-500" />} iconPosition="left">
                My Favorites
              </NeuButton>
            </Link>
          )}
          {canManage && (
            <Link to="/facilities/analytics">
              <NeuButton variant="secondary" size="md" icon={<BarChart3 className="w-4 h-4" />} iconPosition="left">
                Usage Analytics
              </NeuButton>
            </Link>
          )}
          {canManage && (
            <Link to="/facilities/new">
              <NeuButton variant="primary" size="md" icon={<Plus className="w-4 h-4" />} iconPosition="left">
                Add Facility
              </NeuButton>
            </Link>
          )}
        </div>
      </motion.div>

      {/* Facilities Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4">
        {types.map((type, index) => {
          const typeFacilities = facilities.filter(f => f.type === type);
          const activeCount = typeFacilities.filter(f => f.status === 'ACTIVE').length;
          const Icon = typeIcons[type] || Building2;
          const tc = typeColors[type] || { gradient: 'from-slate-500 to-slate-600', glow: 'rgba(100,116,139,0.4)' };

          return (
            <motion.div
              key={type}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.05, type: 'spring', stiffness: 120, damping: 18 }}
              whileHover={{ y: -5 }}
              className="h-full"
            >
              <Link to={`/facilities/type/${type}`} className="block h-full cursor-pointer">
                <LiquidGlassCard glow={tc.glow} depth={2} className="overflow-hidden h-full flex flex-col p-8 transition-shadow hover:shadow-[0_0_30px_rgba(var(--glow-color),0.3)]">
                  <div className="flex flex-col items-center justify-center text-center gap-5">
                    <div
                      className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${tc.gradient} flex items-center justify-center shadow-lg relative overflow-hidden`}
                    >
                      <div className="absolute inset-0 bg-white/10" style={{ transform: 'skewX(-20deg) translateX(-150%)' }} />
                      <Icon className="w-10 h-10 text-white relative z-10" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white capitalize mb-2">
                        {type.replace(/_/g, ' ').toLowerCase()}s
                      </h3>
                      <div className="flex items-center justify-center gap-3 text-xs font-medium">
                        <span className="px-2 py-1 rounded-md bg-slate-800/50 text-slate-300 border border-white/5">
                          {typeFacilities.length} Total
                        </span>
                        <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {activeCount} Active
                        </span>
                      </div>
                    </div>
                  </div>
                </LiquidGlassCard>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {types.length === 0 && (
        <div className="text-center py-20">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400 font-semibold">No resource categories found</p>
        </div>
      )}
    </motion.div>
  );
}

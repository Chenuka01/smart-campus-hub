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
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { fetchFacilities(); }, []);

  const fetchFacilities = async () => {
    try {
      const res = await facilityApi.getAll();
      setFacilities(res.data);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const filtered = facilities.filter(f => {
    const matchesSearch = !search || f.type.toLowerCase().replace(/_/g, ' ').includes(search.toLowerCase());
    return matchesSearch;
  });

  const uniqueTypes = [...new Set(filtered.map(f => f.type))];

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
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Facilities <span className="text-gradient">&amp; Assets</span></h1>
          <p className="text-slate-400 text-sm mt-1">Browse and manage campus resources</p>
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

      {/* Search Bar (Only searching by Type now) */}
      <motion.div variants={itemVariants}>
        <LiquidGlassCard className="overflow-visible" depth={1}>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by facility type (e.g. Lecture Hall, Lab)..."
                className="glass-input w-full pl-11 pr-4 py-3 rounded-xl text-sm"
              />
            </div>
          </div>
        </LiquidGlassCard>
      </motion.div>

      {/* Facility Types Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {uniqueTypes.map((type, index) => {
          const Icon = typeIcons[type] || Building2;
          const tc = typeColors[type] || { gradient: 'from-slate-500 to-slate-600', glow: 'rgba(100,116,139,0.4)' };
          const typeFacilities = facilities.filter(f => f.type === type);
          const totalCount = typeFacilities.length;
          const activeCount = typeFacilities.filter(f => f.status === 'ACTIVE').length;
          
          return (
            <motion.div
              key={type}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link to={`/facilities/type/${type}`} className="block h-full">
                <LiquidGlassCard glow={tc.glow} depth={1} className="hover:scale-[1.02] transition-transform duration-300 h-full cursor-pointer group rounded-[2.5rem]">
                  <div className="flex flex-col items-center text-center p-8">
                    <div 
                      className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${tc.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:shadow-[0_0_20px_-5px_CurrentColor] transition-all`}
                    >
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4 group-hover:text-violet-400 transition-colors">
                      {type.replace(/_/g, ' ')}s
                    </h3>
                    
                    <div className="flex items-center gap-2 mt-2">
                       <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-1.5 min-w-[70px] justify-center">
                          <span className="text-xs font-bold text-white/90">{totalCount}</span>
                          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Total</span>
                       </div>
                       <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 min-w-[70px] justify-center">
                          <span className="text-xs font-bold text-emerald-400">{activeCount}</span>
                          <span className="text-[10px] uppercase tracking-wider text-emerald-500/70 font-bold">Active</span>
                       </div>
                    </div>
                  </div>
                </LiquidGlassCard>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {uniqueTypes.length === 0 && (
        <div className="text-center py-20">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400 font-semibold">No facility types found</p>
        </div>
      )}
    </motion.div>
  );
}

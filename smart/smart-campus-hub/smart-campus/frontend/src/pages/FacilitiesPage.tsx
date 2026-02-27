import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { facilityApi } from '@/lib/api';
import type { Facility } from '@/lib/types';
import {
  Building2, Search, Filter, Plus, MapPin, Users,
  Monitor, Camera, Laptop, FlaskConical, Presentation, X
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
  const { isAdmin } = useAuth();
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
    const matchesSearch = !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.location.toLowerCase().includes(search.toLowerCase());
    const matchesType = !filterType || f.type === filterType;
    const matchesStatus = !filterStatus || f.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });
  const types = [...new Set(facilities.map(f => f.type))];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
        <p className="text-sm text-slate-500 animate-pulse">Loading facilities…</p>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 pb-8">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Facilities <span className="text-gradient">&amp; Assets</span></h1>
          <p className="text-slate-400 text-sm mt-1">Browse and manage campus resources</p>
        </div>
        {isAdmin && (
          <Link to="/facilities/new">
            <NeuButton variant="primary" size="md" icon={<Plus className="w-4 h-4" />} iconPosition="left">
              Add Facility
            </NeuButton>
          </Link>
        )}
      </motion.div>

      {/* Search & Filters */}
      <motion.div variants={itemVariants}>
        <LiquidGlassCard className="overflow-visible" depth={1}>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or location…"
                className="glass-input w-full pl-11 pr-4 py-3 rounded-xl text-sm"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: showFilters || filterType || filterStatus ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${showFilters || filterType || filterStatus ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: showFilters || filterType || filterStatus ? '#a78bfa' : '#94a3b8',
              }}
            >
              <Filter className="w-4 h-4" />
              Filters
              {(filterType || filterStatus) && (
                <span className="w-5 h-5 bg-violet-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {(filterType ? 1 : 0) + (filterStatus ? 1 : 0)}
                </span>
              )}
            </motion.button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="flex flex-wrap gap-3 mt-4 pt-4"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
              >
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="glass-select px-4 py-2.5 rounded-xl text-sm font-medium"
                >
                  <option value="">All Types</option>
                  {types.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="glass-select px-4 py-2.5 rounded-xl text-sm font-medium"
                >
                  <option value="">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="OUT_OF_SERVICE">Out of Service</option>
                  <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                </select>
                {(filterType || filterStatus) && (
                  <motion.button
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                    onClick={() => { setFilterType(''); setFilterStatus(''); }}
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm text-rose-400 hover:text-rose-300 rounded-xl transition-colors"
                    style={{ background: 'rgba(244,63,94,0.08)' }}
                  >
                    <X className="w-3.5 h-3.5" /> Clear
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </LiquidGlassCard>
      </motion.div>

      {/* Facilities Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((facility, index) => {
          const Icon = typeIcons[facility.type] || Building2;
          const tc = typeColors[facility.type] || { gradient: 'from-slate-500 to-slate-600', glow: 'rgba(100,116,139,0.4)' };
          return (
            <motion.div
              key={facility.id}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.05, type: 'spring', stiffness: 120, damping: 18 }}
            >
              <LiquidGlassCard glow={tc.glow} depth={2} className="overflow-hidden h-full flex flex-col">
                {/* Card visual header */}
                <div
                  className={`relative h-32 -mx-6 -mt-6 mb-5 bg-gradient-to-br ${tc.gradient} overflow-hidden`}
                  style={{ margin: '-1.5rem -1.5rem 1.25rem' }}
                >
                  <div className="absolute inset-0 bg-black/15" />
                  {/* Glass shimmer */}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%)' }} />
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-full backdrop-blur-sm ${
                        facility.status === 'ACTIVE'
                          ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/30'
                          : 'bg-rose-500/25 text-rose-200 border border-rose-400/30'
                      }`}
                    >
                      {facility.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-4 flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center"
                      style={{ border: '1px solid rgba(255,255,255,0.2)' }}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white leading-tight">{facility.name}</h3>
                      <p className="text-xs text-white/70 font-medium">{facility.type.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="flex flex-col flex-1">
                  <p className="text-sm text-slate-400 line-clamp-2 mb-4 leading-relaxed">{facility.description}</p>
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{facility.location}</span>
                    </div>
                    {facility.capacity > 0 && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Users className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Capacity: {facility.capacity}</span>
                      </div>
                    )}
                  </div>

                  {facility.amenities?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {facility.amenities.slice(0, 4).map(amenity => (
                        <span key={amenity} className="px-2 py-0.5 text-[10px] font-medium rounded-md text-slate-400" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          {amenity}
                        </span>
                      ))}
                      {facility.amenities.length > 4 && (
                        <span className="px-2 py-0.5 text-[10px] font-medium rounded-md text-slate-500" style={{ background: 'rgba(255,255,255,0.04)' }}>
                          +{facility.amenities.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 mt-auto">
                    <Link to={`/bookings/new?facilityId=${facility.id}`} className="flex-1">
                      <NeuButton variant="primary" size="sm" fullWidth>Book Now</NeuButton>
                    </Link>
                    {isAdmin && (
                      <Link to={`/facilities/edit/${facility.id}`}>
                        <NeuButton variant="secondary" size="sm">Edit</NeuButton>
                      </Link>
                    )}
                  </div>
                </div>
              </LiquidGlassCard>
            </motion.div>
          );
        })}
      </motion.div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400 font-semibold">No facilities found</p>
          <p className="text-sm text-slate-600 mt-1">Try adjusting your search or filters</p>
        </div>
      )}
    </motion.div>
  );
}

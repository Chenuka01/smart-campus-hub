import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { facilityApi } from '@/lib/api';
import type { Facility } from '@/lib/types';
import {
  Building2, MapPin, Users, ArrowLeft, Heart,
  Monitor, Camera, Laptop, FlaskConical, Presentation, Plus, Search, Filter, X, Trash2
} from 'lucide-react';
import LiquidGlassCard from '@/components/LiquidGlassCard';
import NeuButton from '@/components/NeuButton';
import { containerVariants, itemVariants } from '@/lib/animations';
import { useFavorites } from '@/lib/useFavorites';

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

export default function FacilityTypeDetailsPage() {
  const { type } = useParams<{ type: string }>();
  const { isAdmin, isManager } = useAuth();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const { toggleFavorite, isFavorite } = useFavorites();

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [capacityFilter, setCapacityFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  // Delete state
  const [facilityToDelete, setFacilityToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (type) {
      fetchFacilities();
    }
  }, [type]);

  const fetchFacilities = async () => {
    try {
      const res = await facilityApi.getAll();
      const filtered = res.data.filter((f: Facility) => f.type === type);
      setFacilities(filtered);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!facilityToDelete) return;
    setIsDeleting(true);
    try {
      await facilityApi.delete(facilityToDelete);
      // dynamically update list
      setFacilities(facilities.filter((f) => f.id !== facilityToDelete));
      setFacilityToDelete(null);
    } catch (err) {
      console.error('Failed to delete resource', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const locations = useMemo(() => [...new Set(facilities.map(f => f.location).filter(Boolean))], [facilities]);

  const filteredFacilities = useMemo(() => {
    return facilities.filter(f => {
      // Name or Location Search
      const matchesSearch = 
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        f.location?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Capacity Filter
      let matchesCapacity = true;
      if (capacityFilter === '10+') matchesCapacity = f.capacity >= 10;
      else if (capacityFilter === '20+') matchesCapacity = f.capacity >= 20;
      else if (capacityFilter === '50+') matchesCapacity = f.capacity >= 50;
      else if (capacityFilter === '100+') matchesCapacity = f.capacity >= 100;

      // Location Filter
      const matchesLocation = locationFilter ? f.location === locationFilter : true;

      return matchesSearch && matchesCapacity && matchesLocation;
    });
  }, [facilities, searchQuery, capacityFilter, locationFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setCapacityFilter('');
    setLocationFilter('');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
        <p className="text-sm text-slate-500 animate-pulse">Loading {type?.replace(/_/g, ' ')}s...</p>
      </div>
    );
  }

  const canManage = isAdmin || isManager;
  const Icon = typeIcons[type || ''] || Building2;
  const tc = typeColors[type || ''] || { gradient: 'from-slate-500 to-slate-600', glow: 'rgba(100,116,139,0.4)' };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 pb-8">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/facilities">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight capitalize">
              {type?.replace(/_/g, ' ')} <span className="text-gradient">Resources</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">Browse available {type?.replace(/_/g, ' ').toLowerCase()}s</p>
          </div>
        </div>
        {canManage && (
          <Link to={`/facilities/new?type=${type}`}>
            <NeuButton variant="primary" size="md" icon={<Plus className="w-4 h-4" />} iconPosition="left">
              Add {type?.replace(/_/g, ' ')}
            </NeuButton>
          </Link>
        )}
      </motion.div>

      {/* Search & Filters */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-white placeholder-slate-400"
          />
        </div>
        <div className="flex gap-3">
          <NeuButton
            variant={showFilters ? 'primary' : 'secondary'}
            size="sm"
            icon={<Filter className="w-4 h-4" />}
            onClick={() => setShowFilters(!showFilters)}
            className="h-full"
          >
            Filters
          </NeuButton>
          {(searchQuery || capacityFilter || locationFilter) && (
            <NeuButton
              variant="secondary"
              size="sm"
              icon={<X className="w-4 h-4" />}
              onClick={clearFilters}
              className="h-full bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
            >
              Clear
            </NeuButton>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <LiquidGlassCard depth={1} className="p-4 flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Capacity</label>
                <select
                  value={capacityFilter}
                  onChange={(e) => setCapacityFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-white"
                >
                  <option value="">Any Capacity</option>
                  <option value="10+">10+ People</option>
                  <option value="20+">20+ People</option>
                  <option value="50+">50+ People</option>
                  <option value="100+">100+ People</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Location</label>
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-white"
                >
                  <option value="">All Locations</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
            </LiquidGlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Facilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFacilities.map((facility, index) => (
          <motion.div
            key={facility.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <LiquidGlassCard glow={tc.glow} depth={2} className="overflow-hidden h-full flex flex-col">
              {/* Card visual header */}
              <div
                className={`relative h-24 -mx-6 -mt-6 mb-5 bg-gradient-to-br ${tc.gradient} overflow-hidden`}
                style={{ margin: '-1.5rem -1.5rem 1.25rem' }}
              >
                <div className="absolute inset-0 bg-black/15" />
                <div className="absolute top-3 right-3 flex gap-2">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full backdrop-blur-sm flex items-center ${
                      facility.status === 'ACTIVE'
                        ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/30'
                        : 'bg-rose-500/25 text-rose-200 border border-rose-400/30'
                    }`}
                  >
                    {facility.status.replace(/_/g, ' ')}
                  </span>
                  {!canManage && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleFavorite(facility.id)}
                      className="p-1.5 rounded-full bg-black/20 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <Heart 
                        className={`w-4 h-4 transition-colors ${isFavorite(facility.id) ? 'fill-rose-500 text-rose-500' : 'text-white'}`} 
                      />
                    </motion.button>
                  )}
                </div>
                <div className="absolute bottom-3 left-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white leading-tight">{facility.name}</h3>
                </div>
              </div>

              {/* Body */}
              <div className="flex flex-col flex-1 px-1">
                <p className="text-sm text-slate-400 line-clamp-2 mb-4 leading-relaxed">{facility.description}</p>
                <div className="space-y-2 mb-4">
                  {facility.location && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{facility.location}</span>
                    </div>
                  )}
                  {facility.capacity > 0 && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Users className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Capacity: {facility.capacity}</span>
                    </div>
                  )}
                </div>

                {facility.amenities?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {facility.amenities.map(amenity => (
                      <span key={amenity} className="px-2 py-0.5 text-[10px] font-medium rounded-md text-slate-400 bg-white/5 border border-white/5">
                        {amenity}
                      </span>
                    ))}
                  </div>
                )}

                {/* Status Indicator */}
                {facility.status !== 'ACTIVE' && (
                  <div className="mb-4">
                    <span className={`w-full inline-flex items-center justify-center px-2.5 py-2 rounded-xl text-xs font-bold border ${
                      facility.status === 'UNDER_MAINTENANCE' 
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]' 
                        : 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]'
                    }`}>
                      {facility.status === 'UNDER_MAINTENANCE' ? '🔧 Under Maintenance' : '❌ Out of Service'}
                    </span>
                  </div>
                )}

                <div className="flex gap-2 mt-auto pt-2">
                  {facility.status === 'ACTIVE' && !canManage && (
                    <Link to={`/bookings/new?facilityId=${facility.id}`} className="flex-1">
                      <NeuButton variant="primary" size="sm" fullWidth>Book Now</NeuButton>
                    </Link>
                  )}
                  {facility.status === 'ACTIVE' && canManage && (
                    <Link to={`/bookings/new?facilityId=${facility.id}`} className="flex-1">
                      <NeuButton variant="primary" size="sm" fullWidth>Book</NeuButton>
                    </Link>
                  )}
                  {canManage && (
                    <div className="flex gap-2 flex-1 md:flex-none">
                      <Link to={`/facilities/edit/${facility.id}`}>
                        <NeuButton variant="secondary" size="sm">Edit</NeuButton>
                      </Link>
                      <NeuButton 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => setFacilityToDelete(facility.id)}
                        className="bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20 flex-1 md:flex-none px-3"
                      >
                        <Trash2 className="w-4 h-4" />
                      </NeuButton>
                    </div>
                  )}
                </div>
              </div>
            </LiquidGlassCard>
          </motion.div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {facilityToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm p-6 rounded-2xl bg-slate-900 border border-white/10 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-2">Delete Resource</h3>
              <p className="text-sm text-slate-400 mb-6">
                Are you sure you want to permanently delete this resource? This action cannot be undone.
              </p>
              
              <div className="flex justify-end gap-3">
                <NeuButton
                  variant="secondary"
                  size="sm"
                  onClick={() => setFacilityToDelete(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </NeuButton>
                <NeuButton
                  variant="primary"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-rose-500 hover:bg-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                </NeuButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {filteredFacilities.length === 0 && (
        <div className="text-center py-20">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400 font-semibold mb-2">No {type?.replace(/_/g, ' ')}s found</p>
          {(searchQuery || capacityFilter || locationFilter) && (
            <NeuButton
              variant="secondary"
              size="sm"
              onClick={clearFilters}
              className="mx-auto"
            >
              Clear Filters
            </NeuButton>
          )}
        </div>
      )}
    </motion.div>
  );
}

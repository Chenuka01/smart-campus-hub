import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { facilityApi } from '@/lib/api';
import type { Facility } from '@/lib/types';
import {
  Building2, MapPin, Users, ArrowLeft, Heart,
  Monitor, Camera, Laptop, FlaskConical, Presentation, Plus
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
          <Link to="/facilities/new">
            <NeuButton variant="primary" size="md" icon={<Plus className="w-4 h-4" />} iconPosition="left">
              Add {type?.replace(/_/g, ' ')}
            </NeuButton>
          </Link>
        )}
      </motion.div>

      {/* Facilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {facilities.map((facility, index) => (
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
                    {facility.amenities.map(amenity => (
                      <span key={amenity} className="px-2 py-0.5 text-[10px] font-medium rounded-md text-slate-400 bg-white/5 border border-white/5">
                        {amenity}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 mt-auto pt-2">
                  <Link to={`/bookings/new?facilityId=${facility.id}`} className="flex-1">
                    <NeuButton variant="primary" size="sm" fullWidth>Book Now</NeuButton>
                  </Link>
                  {canManage && (
                    <Link to={`/facilities/edit/${facility.id}`}>
                      <NeuButton variant="secondary" size="sm">Edit</NeuButton>
                    </Link>
                  )}
                </div>
              </div>
            </LiquidGlassCard>
          </motion.div>
        ))}
      </div>

      {facilities.length === 0 && (
        <div className="text-center py-20">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400 font-semibold">No {type?.replace(/_/g, ' ')}s found</p>
        </div>
      )}
    </motion.div>
  );
}

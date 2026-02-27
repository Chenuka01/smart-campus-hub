import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { facilityApi } from '@/lib/api';
import type { Facility } from '@/lib/types';
import {
  Building2, Search, Filter, Plus, MapPin, Users, Wifi,
  Monitor, Camera, Laptop, FlaskConical, Presentation, X
} from 'lucide-react';

const typeIcons: Record<string, typeof Building2> = {
  LECTURE_HALL: Presentation,
  LAB: FlaskConical,
  MEETING_ROOM: Monitor,
  AUDITORIUM: Building2,
  PROJECTOR: Monitor,
  CAMERA: Camera,
  LAPTOP: Laptop,
  WHITEBOARD: Presentation,
  OTHER_EQUIPMENT: Wifi,
};

const typeColors: Record<string, string> = {
  LECTURE_HALL: 'from-violet-500 to-indigo-500',
  LAB: 'from-emerald-500 to-teal-500',
  MEETING_ROOM: 'from-blue-500 to-cyan-500',
  AUDITORIUM: 'from-purple-500 to-fuchsia-500',
  PROJECTOR: 'from-amber-500 to-orange-500',
  CAMERA: 'from-rose-500 to-pink-500',
  LAPTOP: 'from-slate-500 to-slate-600',
  OTHER_EQUIPMENT: 'from-indigo-500 to-blue-500',
};

export default function FacilitiesPage() {
  const { isAdmin } = useAuth();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      const res = await facilityApi.getAll();
      setFacilities(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const filtered = facilities.filter(f => {
    const matchesSearch = !search || 
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.location.toLowerCase().includes(search.toLowerCase());
    const matchesType = !filterType || f.type === filterType;
    const matchesStatus = !filterStatus || f.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const types = [...new Set(facilities.map(f => f.type))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Facilities & Assets</h1>
          <p className="text-slate-500 text-sm mt-1">Browse and manage campus resources</p>
        </div>
        {isAdmin && (
          <Link
            to="/facilities/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 gradient-primary text-white font-medium rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Facility
          </Link>
        )}
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search facilities by name or location..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
              showFilters || filterType || filterStatus
                ? 'bg-violet-50 border-violet-200 text-violet-700'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Filter className="w-4 h-4" /> Filters
            {(filterType || filterStatus) && (
              <span className="w-5 h-5 bg-violet-600 text-white text-xs rounded-full flex items-center justify-center">
                {(filterType ? 1 : 0) + (filterStatus ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-3"
          >
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">All Types</option>
              {types.map(t => (
                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="OUT_OF_SERVICE">Out of Service</option>
              <option value="UNDER_MAINTENANCE">Under Maintenance</option>
            </select>
            {(filterType || filterStatus) && (
              <button
                onClick={() => { setFilterType(''); setFilterStatus(''); }}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg"
              >
                <X className="w-4 h-4" /> Clear
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Facilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((facility, index) => {
          const Icon = typeIcons[facility.type] || Building2;
          const gradient = typeColors[facility.type] || 'from-slate-500 to-slate-600';
          return (
            <motion.div
              key={facility.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden card-hover group"
            >
              {/* Card Header */}
              <div className={`h-32 bg-gradient-to-br ${gradient} relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full backdrop-blur-sm ${
                    facility.status === 'ACTIVE'
                      ? 'bg-emerald-500/20 text-white border border-emerald-400/30'
                      : 'bg-rose-500/20 text-white border border-rose-400/30'
                  }`}>
                    {facility.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{facility.name}</h3>
                    <p className="text-sm text-white/80">{facility.type.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5">
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">{facility.description}</p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{facility.location}</span>
                  </div>
                  {facility.capacity > 0 && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span>Capacity: {facility.capacity}</span>
                    </div>
                  )}
                </div>

                {facility.amenities?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {facility.amenities.slice(0, 4).map(amenity => (
                      <span key={amenity} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-md">
                        {amenity}
                      </span>
                    ))}
                    {facility.amenities.length > 4 && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-md">
                        +{facility.amenities.length - 4}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Link
                    to={`/bookings/new?facilityId=${facility.id}`}
                    className="flex-1 px-4 py-2.5 gradient-primary text-white text-sm font-medium rounded-xl text-center shadow-sm hover:shadow-md transition-all"
                  >
                    Book Now
                  </Link>
                  {isAdmin && (
                    <Link
                      to={`/facilities/edit/${facility.id}`}
                      className="px-4 py-2.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200 transition-all"
                    >
                      Edit
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No facilities found</p>
          <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}

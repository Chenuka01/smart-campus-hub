import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { facilityApi } from '@/lib/api';
import { ArrowLeft, Save, Plus, X, Building2, AlertCircle } from 'lucide-react';
import LiquidGlassCard from '@/components/LiquidGlassCard';
import NeuButton from '@/components/NeuButton';
import { itemVariants } from '@/lib/animations';

const facilityTypes = ['LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'AUDITORIUM', 'PROJECTOR', 'CAMERA', 'LAPTOP', 'WHITEBOARD', 'OTHER_EQUIPMENT'];

export default function FacilityFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') || 'LECTURE_HALL';
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Base configuration
  const [resourceType, setResourceType] = useState(initialType);
  const [status, setStatus] = useState('ACTIVE');
  
  // Initialize dynamic fields based on initialType
  const getInitialDynFields = (type: string) => {
      if (type === 'LECTURE_HALL') return { name: '', capacity: 0, location: '', hasProjector: false, hasAC: false };
      if (type === 'LAB') return { name: '', capacity: 0, software: '', location: '' };
      if (type === 'CAMERA') return { name: '', resolution: '', batteryLife: '' };
      if (type === 'PROJECTOR') return { name: '', resolution: '', wirelessSupport: false, portType: '' };
      if (type === 'MEETING_ROOM') return { name: '', capacity: 0, videoConferencing: false, whiteboard: false, location: '' };
      if (type === 'AUDITORIUM') return { name: '', capacity: 0, stageAvailable: false, soundSystem: false, seatingType: 'Fixed', location: '' };
      return {};
  };

  // Dynamic fields
  const [dynFields, setDynFields] = useState<any>(getInitialDynFields(initialType));
  
  // Generic fields fallback
  const [genericFields, setGenericFields] = useState({
    name: '', capacity: 0, location: '', building: '', floor: '', description: '', amenities: [] as string[]
  });
  const [newAmenity, setNewAmenity] = useState('');

  useEffect(() => {
    if (id) {
      setLoading(true);
      facilityApi.getById(id).then(res => {
        const f = res.data;
        setResourceType(f.type);
        setStatus(f.status);
        
        let newDyn: any = { location: f.location || '' };
        
        const type = f.type;
        if (type === 'LECTURE_HALL') {
            newDyn.name = f.name;
            newDyn.capacity = f.capacity;
            newDyn.hasProjector = f.amenities?.includes('Projector');
            newDyn.hasAC = f.amenities?.includes('Air Conditioning');
        } else if (type === 'LAB') {
            newDyn.name = f.name;
            newDyn.capacity = f.capacity;
            const sw = f.amenities?.find((a: string) => a.startsWith('Software: '));
            newDyn.software = sw ? sw.replace('Software: ', '') : '';
        } else if (type === 'CAMERA') {
            newDyn.name = f.name;
            const resMatch = f.description?.match(/Resolution:\s*(.*?)(?:\s*\||$)/);
            const batMatch = f.description?.match(/Battery Life:\s*(.*?)(?:\s*\||$)/);
            newDyn.resolution = resMatch ? resMatch[1] : '';
            newDyn.batteryLife = batMatch ? batMatch[1] : '';
        } else if (type === 'PROJECTOR') {
            newDyn.name = f.name;
            const resMatch = f.description?.match(/Resolution:\s*(.*?)(?:\s*\||$)/);
            const portMatch = f.description?.match(/Port Type:\s*(.*?)(?:\s*\||$)/);
            newDyn.resolution = resMatch ? resMatch[1] : '';
            newDyn.portType = portMatch ? portMatch[1] : '';
            newDyn.wirelessSupport = f.amenities?.includes('Wireless Support');
        } else if (type === 'MEETING_ROOM') {
            newDyn.name = f.name;
            newDyn.capacity = f.capacity;
            newDyn.videoConferencing = f.amenities?.includes('Video Conferencing');
            newDyn.whiteboard = f.amenities?.includes('Whiteboard');
        } else if (type === 'AUDITORIUM') {
            newDyn.name = f.name;
            newDyn.capacity = f.capacity;
            newDyn.stageAvailable = f.amenities?.includes('Stage Available');
            newDyn.soundSystem = f.amenities?.includes('Sound System');
            const seatMatch = f.description?.match(/Seating Type:\s*(.*?)(?:\s*\||$)/);
            newDyn.seatingType = seatMatch ? seatMatch[1] : 'Fixed';
        }
        
        setDynFields(newDyn);
        setGenericFields({
          name: f.name, capacity: f.capacity, location: f.location || '',
          building: f.building || '', floor: f.floor || '', description: f.description || '',
          amenities: f.amenities || [],
        });
      }).finally(() => setLoading(false));
    }
  }, [id]);

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newType = e.target.value;
      setResourceType(newType);
      
      // Reset dynamic fields on type switch
      if (newType === 'LECTURE_HALL') setDynFields({ name: '', capacity: 0, location: '', hasProjector: false, hasAC: false });
      else if (newType === 'LAB') setDynFields({ name: '', capacity: 0, software: '', location: '' });
      else if (newType === 'CAMERA') setDynFields({ name: '', resolution: '', batteryLife: '' });
      else if (newType === 'PROJECTOR') setDynFields({ name: '', resolution: '', wirelessSupport: false, portType: '' });
      else if (newType === 'MEETING_ROOM') setDynFields({ name: '', capacity: 0, videoConferencing: false, whiteboard: false, location: '' });
      else if (newType === 'AUDITORIUM') setDynFields({ name: '', capacity: 0, stageAvailable: false, soundSystem: false, seatingType: 'Fixed', location: '' });
      else setDynFields({});
  };

  const updateDyn = (key: string, val: any) => setDynFields((prev: any) => ({ ...prev, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    
    // Strict Validation
    let isValid = true;
    
    const isStringEmpty = (val: any) => !val || (typeof val === 'string' && val.trim() === '');
    const isNumInvalid = (val: any) => !val || (typeof val === 'number' && val <= 0);

    if (resourceType === 'LECTURE_HALL') {
        if (isStringEmpty(dynFields.name) || isNumInvalid(dynFields.capacity) || isStringEmpty(dynFields.location)) isValid = false;
    } else if (resourceType === 'LAB') {
        if (isStringEmpty(dynFields.name) || isNumInvalid(dynFields.capacity) || isStringEmpty(dynFields.location) || isStringEmpty(dynFields.software)) isValid = false;
    } else if (resourceType === 'CAMERA') {
        if (isStringEmpty(dynFields.name) || isStringEmpty(dynFields.resolution) || isStringEmpty(dynFields.batteryLife)) isValid = false;
    } else if (resourceType === 'PROJECTOR') {
        if (isStringEmpty(dynFields.name) || isStringEmpty(dynFields.resolution) || isStringEmpty(dynFields.portType)) isValid = false;
    } else if (resourceType === 'MEETING_ROOM') {
        if (isStringEmpty(dynFields.name) || isNumInvalid(dynFields.capacity) || isStringEmpty(dynFields.location)) isValid = false;
    } else if (resourceType === 'AUDITORIUM') {
        if (isStringEmpty(dynFields.name) || isNumInvalid(dynFields.capacity) || isStringEmpty(dynFields.location) || isStringEmpty(dynFields.seatingType)) isValid = false;
    } else {
        if (isStringEmpty(genericFields.name) || isNumInvalid(genericFields.capacity) || isStringEmpty(genericFields.location) || isStringEmpty(genericFields.building) || isStringEmpty(genericFields.floor) || isStringEmpty(genericFields.description)) isValid = false;
    }

    if (!isValid) {
        setErrorMsg('All fields are required. Please fill completely before saving.');
        return;
    }

    setSaving(true);
    try {
      let payload = {
          type: resourceType,
          status: status,
          name: '', capacity: 0, location: '', building: '', floor: '', description: '',
          amenities: [] as string[],
          availabilityWindows: [
            { dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '18:00' },
            { dayOfWeek: 'TUESDAY', startTime: '08:00', endTime: '18:00' },
            { dayOfWeek: 'WEDNESDAY', startTime: '08:00', endTime: '18:00' },
            { dayOfWeek: 'THURSDAY', startTime: '08:00', endTime: '18:00' },
            { dayOfWeek: 'FRIDAY', startTime: '08:00', endTime: '18:00' }
          ]
      };
      
      const parts: string[] = [];

      if (resourceType === 'LECTURE_HALL') {
          payload.name = dynFields.name;
          payload.capacity = dynFields.capacity || 0;
          payload.location = dynFields.location;
          if (dynFields.hasProjector) payload.amenities.push('Projector');
          if (dynFields.hasAC) payload.amenities.push('Air Conditioning');
      } else if (resourceType === 'LAB') {
          payload.name = dynFields.name;
          payload.capacity = dynFields.capacity || 0;
          payload.location = dynFields.location;
          if (dynFields.software) payload.amenities.push(`Software: ${dynFields.software}`);
      } else if (resourceType === 'CAMERA') {
          payload.name = dynFields.name;
          if (dynFields.resolution) parts.push(`Resolution: ${dynFields.resolution}`);
          if (dynFields.batteryLife) parts.push(`Battery Life: ${dynFields.batteryLife}`);
      } else if (resourceType === 'PROJECTOR') {
          payload.name = dynFields.name;
          if (dynFields.resolution) parts.push(`Resolution: ${dynFields.resolution}`);
          if (dynFields.portType) parts.push(`Port Type: ${dynFields.portType}`);
          if (dynFields.wirelessSupport) payload.amenities.push('Wireless Support');
      } else if (resourceType === 'MEETING_ROOM') {
          payload.name = dynFields.name;
          payload.capacity = dynFields.capacity || 0;
          payload.location = dynFields.location || '';
          if (dynFields.videoConferencing) payload.amenities.push('Video Conferencing');
          if (dynFields.whiteboard) payload.amenities.push('Whiteboard');
      } else if (resourceType === 'AUDITORIUM') {
          payload.name = dynFields.name;
          payload.capacity = dynFields.capacity || 0;
          payload.location = dynFields.location;
          if (dynFields.stageAvailable) payload.amenities.push('Stage Available');
          if (dynFields.soundSystem) payload.amenities.push('Sound System');
          if (dynFields.seatingType) parts.push(`Seating Type: ${dynFields.seatingType}`);
      } else {
          payload.name = genericFields.name;
          payload.capacity = genericFields.capacity || 0;
          payload.location = genericFields.location;
          payload.building = genericFields.building;
          payload.floor = genericFields.floor;
          payload.description = genericFields.description;
          payload.amenities = [...genericFields.amenities];
      }
      
      if (parts.length > 0) payload.description = parts.join(' | ');

      if (isEdit) await facilityApi.update(id!, payload); else await facilityApi.create(payload);
      navigate('/facilities');
    } catch { alert('Failed to save facility'); } finally { setSaving(false); }
  };
  
  const addAmenity = () => {
    if (newAmenity.trim() && !genericFields.amenities.includes(newAmenity.trim())) {
      setGenericFields({ ...genericFields, amenities: [...genericFields.amenities, newAmenity.trim()] });
      setNewAmenity('');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
    </div>
  );

  const formattedType = resourceType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

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
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{isEdit ? `Edit ${formattedType}` : `Add New ${formattedType}`}</h1>
            <p className="text-sm text-slate-400 mt-0.5">{isEdit ? 'Update facility information' : `Create a new campus ${formattedType.toLowerCase()}`}</p>
          </div>
        </div>

        {errorMsg && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start flex-col">
                <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-400" />
                    <span className="text-sm font-medium text-rose-300">{errorMsg}</span>
                </div>
            </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-5">
            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl mb-2">
                <label className="block text-sm font-semibold text-slate-300 mb-2">Resource Type *</label>
                <select value={resourceType} onChange={handleTypeChange}
                  className="glass-select w-full px-4 py-3 rounded-xl text-sm font-medium">
                  {facilityTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Status</label>
                      <select value={status} onChange={e => setStatus(e.target.value)}
                        className="glass-select w-full px-4 py-3 rounded-xl text-sm">
                        <option value="ACTIVE">Active</option>
                        <option value="OUT_OF_SERVICE">Out of Service</option>
                        <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                      </select>
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
            <motion.div key={resourceType} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {resourceType === 'LECTURE_HALL' && (
                  <>
                      <div className="sm:col-span-2">
                          <label className="block text-sm font-semibold text-slate-300 mb-2">Hall Name *</label>
                          <input type="text" value={dynFields.name || ''} onChange={e => updateDyn('name', e.target.value)}
                            className="glass-input w-full px-4 py-3 rounded-xl text-sm" placeholder="e.g. Main Lecture Hall" required />
                      </div>
                      <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-2">Capacity *</label>
                          <input type="number" value={dynFields.capacity || 0} onChange={e => updateDyn('capacity', parseInt(e.target.value) || 0)}
                            className="glass-input w-full px-4 py-3 rounded-xl text-sm" min="1" required />
                      </div>
                      <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-2">Location *</label>
                          <input type="text" value={dynFields.location || ''} onChange={e => updateDyn('location', e.target.value)}
                            className="glass-input w-full px-4 py-3 rounded-xl text-sm" placeholder="e.g. Block A, 1st Floor" required />
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                          <input type="checkbox" id="p" checked={dynFields.hasProjector || false} onChange={e => updateDyn('hasProjector', e.target.checked)} className="w-4 h-4 rounded border-white/20 bg-white/5" />
                          <label htmlFor="p" className="text-sm font-medium text-slate-300">Has Projector</label>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                          <input type="checkbox" id="ac" checked={dynFields.hasAC || false} onChange={e => updateDyn('hasAC', e.target.checked)} className="w-4 h-4 rounded border-white/20 bg-white/5" />
                          <label htmlFor="ac" className="text-sm font-medium text-slate-300">Has AC</label>
                      </div>
                  </>
              )}

              {resourceType === 'LAB' && (
                  <>
                      <div className="sm:col-span-2">
                          <label className="block text-sm font-semibold text-slate-300 mb-2">Lab Name *</label>
                          <input type="text" value={dynFields.name || ''} onChange={e => updateDyn('name', e.target.value)}
                            className="glass-input w-full px-4 py-3 rounded-xl text-sm" placeholder="e.g. AI &amp; Robotics Lab" required />
                      </div>
                      <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-2">Number of Computers *</label>
                          <input type="number" value={dynFields.capacity || 0} onChange={e => updateDyn('capacity', parseInt(e.target.value) || 0)}
                            className="glass-input w-full px-4 py-3 rounded-xl text-sm" min="1" required />
                      </div>
                      <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-2">Location *</label>
                          <input type="text" value={dynFields.location || ''} onChange={e => updateDyn('location', e.target.value)}
                            className="glass-input w-full px-4 py-3 rounded-xl text-sm" placeholder="e.g. IT Faculty, Ground Floor" required />
                      </div>
                      <div className="sm:col-span-2">
                          <label className="block text-sm font-semibold text-slate-300 mb-2">Software Available *</label>
                          <input type="text" value={dynFields.software || ''} onChange={e => updateDyn('software', e.target.value)}
                            className="glass-input w-full px-4 py-3 rounded-xl text-sm" placeholder="e.g. AutoCAD, MATLAB, Python" required />
                      </div>
                  </>
              )}

              {resourceType === 'CAMERA' && (
                  <>
                      <div className="sm:col-span-2">
                          <label className="block text-sm font-semibold text-slate-300 mb-2">Camera Model *</label>
                          <input type="text" value={dynFields.name || ''} onChange={e => updateDyn('name', e.target.value)}
                            className="glass-input w-full px-4 py-3 rounded-xl text-sm" placeholder="e.g. Sony A7 III" required />
                      </div>
                      <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-2">Resolution *</label>
                          <input type="text" value={dynFields.resolution || ''} onChange={e => updateDyn('resolution', e.target.value)}
                            className="glass-input w-full px-4 py-3 rounded-xl text-sm" placeholder="e.g. 4K, 1080p" required />
                      </div>
                      <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-2">Battery Life *</label>
                          <input type="text" value={dynFields.batteryLife || ''} onChange={e => updateDyn('batteryLife', e.target.value)}
                            className="glass-input w-full px-4 py-3 rounded-xl text-sm" placeholder="e.g. 4 Hours" required />
                      </div>
                  </>
              )}

              {resourceType === 'PROJECTOR' && (
                  <>
                      <div className="sm:col-span-2">
                          <label className="block text-sm font-semibold text-slate-300 mb-2">Projector Model *</label>
                          <input type="text" value={dynFields.name || ''} onChange={e => updateDyn('name', e.target.value)}
                            className="glass-input w-full px-4 py-3 rounded-xl text-sm" placeholder="e.g. Epson EB-118" required />
                      </div>
                      <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-2">Resolution *</label>
                          <input type="text" value={dynFields.resolution || ''} onChange={e => updateDyn('resolution', e.target.value)}
                            className="glass-input w-full px-4 py-3 rounded-xl text-sm" placeholder="e.g. 1080p" required />
                      </div>
                      <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-2">Port Type *</label>
                          <input type="text" value={dynFields.portType || ''} onChange={e => updateDyn('portType', e.target.value)}
                            className="glass-input w-full px-4 py-3 rounded-xl text-sm" placeholder="e.g. HDMI, VGA, USB-C" required />
                      </div>
                      <div className="sm:col-span-2 flex items-center gap-3 mt-2">
                          <input type="checkbox" id="ws" checked={dynFields.wirelessSupport || false} onChange={e => updateDyn('wirelessSupport', e.target.checked)} className="w-4 h-4 rounded border-white/20 bg-white/5" />
                          <label htmlFor="ws" className="text-sm font-medium text-slate-300">Supports Wireless Casting</label>
                      </div>
                  </>
              )}

              {resourceType === 'MEETING_ROOM' && (
                  <>
                      <div className="sm:col-span-2">
                          <label className="block text-sm font-semibold text-slate-300 mb-2">Room Name *</label>
                          <input type="text" value={dynFields.name || ''} onChange={e => updateDyn('name', e.target.value)}
                            className="glass-input w-full px-4 py-3 rounded-xl text-sm" placeholder="e.g. Exec Meeting Room 1" required />
                      </div>
                      <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-2">Capacity *</label>
                          <input type="number" value={dynFields.capacity || 0} onChange={e => updateDyn('capacity', parseInt(e.target.value) || 0)}
                            className="glass-input w-full px-4 py-3 rounded-xl text-sm" min="1" required />
                      </div>
                      <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-2">Location *</label>
                          <input type="text" value={dynFields.location || ''} onChange={e => updateDyn('location', e.target.value)}
                            className="glass-input w-full px-4 py-3 rounded-xl text-sm" placeholder="e.g. Admin Block" required />
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                          <input type="checkbox" id="vc" checked={dynFields.videoConferencing || false} onChange={e => updateDyn('videoConferencing', e.target.checked)} className="w-4 h-4 rounded border-white/20 bg-white/5" />
                          <label htmlFor="vc" className="text-sm font-medium text-slate-300">Video Conferencing Setup</label>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                          <input type="checkbox" id="wb" checked={dynFields.whiteboard || false} onChange={e => updateDyn('whiteboard', e.target.checked)} className="w-4 h-4 rounded border-white/20 bg-white/5" />
                          <label htmlFor="wb" className="text-sm font-medium text-slate-300">Whiteboard Available</label>
                      </div>
                  </>
              )}

              {resourceType === 'AUDITORIUM' && (
                  <>
                      <div className="sm:col-span-2">
                          <label className="block text-sm font-semibold text-slate-300 mb-2">Auditorium Name *</label>
                          <input type="text" value={dynFields.name || ''} onChange={e => updateDyn('name', e.target.value)}
                            className="glass-input w-full px-4 py-3 rounded-xl text-sm" placeholder="e.g. Main Campus Auditorium" required />
                      </div>
                      <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-2">Capacity *</label>
                          <input type="number" value={dynFields.capacity || 0} onChange={e => updateDyn('capacity', parseInt(e.target.value) || 0)}
                            className="glass-input w-full px-4 py-3 rounded-xl text-sm" min="1" required />
                      </div>
                      <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-2">Location *</label>
                          <input type="text" value={dynFields.location || ''} onChange={e => updateDyn('location', e.target.value)}
                            className="glass-input w-full px-4 py-3 rounded-xl text-sm" placeholder="e.g. Center Wing" required />
                      </div>
                      <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-2">Seating Type</label>
                          <select value={dynFields.seatingType || 'Fixed'} onChange={e => updateDyn('seatingType', e.target.value)}
                              className="glass-select w-full px-4 py-3 rounded-xl text-sm">
                              <option value="Fixed">Fixed Seats</option>
                              <option value="Movable">Movable Seats</option>
                          </select>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                          <input type="checkbox" id="stg" checked={dynFields.stageAvailable || false} onChange={e => updateDyn('stageAvailable', e.target.checked)} className="w-4 h-4 rounded border-white/20 bg-white/5" />
                          <label htmlFor="stg" className="text-sm font-medium text-slate-300">Stage Available</label>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                          <input type="checkbox" id="snd" checked={dynFields.soundSystem || false} onChange={e => updateDyn('soundSystem', e.target.checked)} className="w-4 h-4 rounded border-white/20 bg-white/5" />
                          <label htmlFor="snd" className="text-sm font-medium text-slate-300">Sound System</label>
                      </div>
                  </>
              )}

              {/* Generic fallback for other types */}
              {!['LECTURE_HALL', 'LAB', 'CAMERA', 'PROJECTOR', 'MEETING_ROOM', 'AUDITORIUM'].includes(resourceType) && (
                  <>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-semibold text-slate-300 mb-2">Name *</label>
                        <input type="text" value={genericFields.name} onChange={e => setGenericFields({ ...genericFields, name: e.target.value })}
                          className="glass-input w-full px-4 py-3 rounded-xl text-sm" placeholder="e.g. Unknown Resource" required />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">Capacity *</label>
                        <input type="number" value={genericFields.capacity} onChange={e => setGenericFields({ ...genericFields, capacity: parseInt(e.target.value) || 0 })}
                          className="glass-input w-full px-4 py-3 rounded-xl text-sm" min="1" required />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">Location *</label>
                        <input type="text" value={genericFields.location} onChange={e => setGenericFields({ ...genericFields, location: e.target.value })}
                          className="glass-input w-full px-4 py-3 rounded-xl text-sm" placeholder="e.g. Block A" required />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">Building *</label>
                        <input type="text" value={genericFields.building} onChange={e => setGenericFields({ ...genericFields, building: e.target.value })}
                          className="glass-input w-full px-4 py-3 rounded-xl text-sm" placeholder="e.g. IT Faculty" required />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">Floor *</label>
                        <input type="text" value={genericFields.floor} onChange={e => setGenericFields({ ...genericFields, floor: e.target.value })}
                          className="glass-input w-full px-4 py-3 rounded-xl text-sm" placeholder="e.g. 5th Floor" required />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-semibold text-slate-300 mb-2">Description *</label>
                        <textarea value={genericFields.description} onChange={e => setGenericFields({ ...genericFields, description: e.target.value })}
                          rows={3} className="glass-input w-full px-4 py-3 rounded-xl text-sm resize-none" required />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-semibold text-slate-300 mb-2">Amenities</label>
                        <div className="flex gap-2 mb-3">
                          <input type="text" value={newAmenity} onChange={e => setNewAmenity(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                            placeholder="Add amenity and press Enter…"
                            className="glass-input flex-1 px-4 py-2.5 rounded-xl text-sm" />
                          <button type="button" onClick={addAmenity}
                            className="p-2.5 rounded-xl text-violet-400 border border-violet-500/25 transition-colors">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        {genericFields.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {genericFields.amenities.map(a => (
                              <span key={a} className="inline-flex items-center gap-1.5 px-3 py-1 text-sm bg-white/5 border border-white/10 rounded-xl">
                                {a}
                                <button type="button" onClick={() => setGenericFields({ ...genericFields, amenities: genericFields.amenities.filter(x => x !== a) })}>
                                  <X className="w-3 h-3 text-slate-400 hover:text-rose-400" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                  </>
              )}
            </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex gap-3 pt-2 mt-6">
            <NeuButton type="submit" loading={saving} variant="primary" fullWidth icon={<Save className="w-4 h-4" />} iconPosition="left">
              {isEdit ? 'Update' : 'Create'} {formattedType}
            </NeuButton>
            <NeuButton type="button" onClick={() => navigate(-1)} variant="ghost">Cancel</NeuButton>
          </div>
        </form>
      </LiquidGlassCard>
    </motion.div>
  );
}

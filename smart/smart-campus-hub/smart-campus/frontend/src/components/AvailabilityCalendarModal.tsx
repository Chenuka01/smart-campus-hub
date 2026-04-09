import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info, Edit2, Check } from 'lucide-react';
import { bookingApi } from '@/lib/api';
import type { Booking } from '@/lib/types';

interface AvailabilityCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  facilityId: string;
  facilityName: string;
  initialDate: string;
  onSelectSlot: (date: string, startTime: string, endTime: string) => void;
}

export default function AvailabilityCalendarModal({
  isOpen,
  onClose,
  facilityId,
  facilityName,
  initialDate,
  onSelectSlot,
}: AvailabilityCalendarModalProps) {
  const [currentDate, setCurrentDate] = useState(new Date(initialDate || new Date().toISOString().split('T')[0]));
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Editable dynamic slots
  const [customSlots, setCustomSlots] = useState<{id: string, startMins: number, endMins: number, isAdjusted: boolean, bookingStatus?: string}[]>([]);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ start: '', end: '' });
  const [editError, setEditError] = useState<string | null>(null);

  const timesToMinutes = (timeString: string) => {
    const [h, m] = timeString.split(':').map(Number);
    return h * 60 + m;
  };

  const formatTimeMinutes = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const initializeSlots = useCallback((currentBookings: Booking[], date: Date) => {
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const defaultDayStart = 510; // 8:30 AM
    const defaultDayEnd = isWeekend ? 1230 : 1050; // 8:30 PM : 5:30 PM
    
    const formattedDateString = date.toISOString().split('T')[0];
    const dayBookings = currentBookings
      .filter(b => b.date === formattedDateString && b.status !== 'CANCELLED' && b.status !== 'REJECTED')
      .sort((a, b) => timesToMinutes(a.startTime) - timesToMinutes(b.startTime));

    let curr = defaultDayStart;

    // Handle early bookings overriding the start
    if (dayBookings.length > 0) {
       const earliest = timesToMinutes(dayBookings[0].startTime);
       if (earliest < curr) {
         curr = earliest;
       }
    }

    const slots: {id: string, startMins: number, endMins: number, isAdjusted: boolean, bookingStatus?: string}[] = [];

    for (const b of dayBookings) {
      const bStart = timesToMinutes(b.startTime);
      const bEnd = timesToMinutes(b.endTime);

      if (bStart < curr) {
         slots.push({ 
           id: Math.random().toString(36).substring(7), 
           startMins: bStart, 
           endMins: bEnd, 
           isAdjusted: false, 
           bookingStatus: b.status 
         });
         curr = Math.max(curr, bEnd);
      } else {
         // Fill gap before the booking with up to 1-hour slots
         while (curr < bStart) {
           const next = Math.min(curr + 60, bStart);
           slots.push({ id: Math.random().toString(36).substring(7), startMins: curr, endMins: next, isAdjusted: false });
           curr = next;
         }
         
         slots.push({ 
           id: Math.random().toString(36).substring(7), 
           startMins: bStart, 
           endMins: bEnd, 
           isAdjusted: false, 
           bookingStatus: b.status 
         });
         
         curr = Math.max(curr, bEnd);
      }
    }

    while (curr < defaultDayEnd) {
      const next = Math.min(curr + 60, defaultDayEnd);
      slots.push({ id: Math.random().toString(36).substring(7), startMins: curr, endMins: next, isAdjusted: false });
      curr = next;
    }

    slots.sort((a, b) => a.startMins !== b.startMins ? a.startMins - b.startMins : a.endMins - b.endMins);

    setCustomSlots(slots);
    setEditingSlotId(null);
    setEditError(null);
  }, []);

  const fetchBookings = useCallback(async () => {
    if (!facilityId) return;
    setLoading(true);
    try {
      const res = await bookingApi.getByFacility(facilityId);
      // Ensure we only process bookings that aren't cancelled or rejected
      const activeBookings = (res.data || []).filter((b: Booking) => 
        b.status !== 'CANCELLED' && b.status !== 'REJECTED'
      );
      setBookings(activeBookings);
    } catch (error) {
      console.error('Failed to fetch facility bookings', error);
    } finally {
      setLoading(false);
    }
  }, [facilityId]);

  // When opened, reset to provided initialDate
  useEffect(() => {
    if (isOpen) {
      if (initialDate) {
        setCurrentDate(new Date(initialDate));
      }
      fetchBookings();
    }
  }, [isOpen, initialDate, fetchBookings]);

  // Re-initialize calendar rows per day when in day mode
  useEffect(() => {
    if (isOpen && viewMode === 'day') {
      initializeSlots(bookings, currentDate);
    }
  }, [currentDate, bookings, isOpen, viewMode, initializeSlots]);

  const handlePrevDay = () => {
    const d = new Date(currentDate);
    if (viewMode === 'day') d.setDate(d.getDate() - 1);
    else if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const handleNextDay = () => {
    const d = new Date(currentDate);
    if (viewMode === 'day') d.setDate(d.getDate() + 1);
    else if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const formattedDateString = currentDate.toISOString().split('T')[0];
  const getDateDisplay = () => {
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } else if (viewMode === 'week') {
      const start = new Date(currentDate);
      start.setDate(currentDate.getDate() - currentDate.getDay() + (currentDate.getDay() === 0 ? -6 : 1));
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }
  };
  const dateDisplay = getDateDisplay();

  const getBookingsForCurrentDate = () => {
    return bookings.filter(b => b.date === formattedDateString);
  };

  const handleSaveEdit = (idx: number) => {
    const newStart = timesToMinutes(editForm.start);
    const newEnd = timesToMinutes(editForm.end);
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
    const dayStart = 510;
    const dayEnd = isWeekend ? 1230 : 1050;

    if (newStart >= newEnd) {
      setEditError("End time must be later than start time.");
      return;
    }
    if (newStart < dayStart || newEnd > dayEnd) {
      setEditError(isWeekend ? "Weekend bookings are allowed only from 08:30 AM to 08:30 PM." : "Weekday bookings are allowed only from 08:30 AM to 05:30 PM.");
      return;
    }
    
    // Cannot backtrack prior to previous slot ending
    if (idx > 0 && newStart < customSlots[idx-1].endMins) {
      setEditError(`Start time must not overlap with the previous slot (which ends at ${formatTimeMinutes(customSlots[idx-1].endMins)}).`);
      return;
    }

    // Checking database overlaps
    const dayBookings = getBookingsForCurrentDate();
    let hasOverlap = false;

    for (const b of dayBookings) {
      if (b.status === 'CANCELLED' || b.status === 'REJECTED') continue;
      const bStart = timesToMinutes(b.startTime);
      const bEnd = timesToMinutes(b.endTime);
      
      // If there's an overlap mathematically
      if (newStart < bEnd && newEnd > bStart) {
        hasOverlap = true;
        break;
      }
    }
    
    if (hasOverlap) {
      setEditError("This time range conflicts with an existing booking or pending reservation.");
      return;
    }

    // Apply the edit
    const newSlots = [...customSlots];
    newSlots[idx] = { ...newSlots[idx], startMins: newStart, endMins: newEnd, isAdjusted: true };

    // Recalculate following slots, leaving a maximum of 1-hour durations extending forward
    let curr = newEnd;
    const following = [];
    while (curr < dayEnd) {
      const next = Math.min(curr + 60, dayEnd);
      following.push({ 
        id: Math.random().toString(36).substring(7), 
        startMins: curr, 
        endMins: next, 
        isAdjusted: true 
      });
      curr = next;
    }

    setCustomSlots([...newSlots.slice(0, idx + 1), ...following]);
    setEditingSlotId(null);
    setEditError(null);
  };

  const getSlotStatus = (slot: { startMins: number, endMins: number, bookingStatus?: string }) => {
    let isPending = false;
    let isBooked = false;

    if (slot.bookingStatus) {
       if (slot.bookingStatus === 'APPROVED') isBooked = true;
       if (slot.bookingStatus === 'PENDING') isPending = true;
    } else {
      const dayBookings = getBookingsForCurrentDate();
      for (const b of dayBookings) {
        if (b.status === 'CANCELLED' || b.status === 'REJECTED') continue;
        const bStart = timesToMinutes(b.startTime);
        const bEnd = timesToMinutes(b.endTime);
        
        if (slot.startMins < bEnd && slot.endMins > bStart) {
          if (b.status === 'APPROVED') {
            return { status: 'booked', details: b };
          }
          if (b.status === 'PENDING') {
            isPending = true; 
          }
        }
      }
    }
    
    // Also check past time
    const now = new Date();
    if (formattedDateString === now.toISOString().split('T')[0]) {
      const currentMins = now.getHours() * 60 + now.getMinutes();
      if (slot.startMins < currentMins) {
        return { status: 'past', details: null };
      }
    } else if (currentDate < now && formattedDateString !== now.toISOString().split('T')[0]) {
      return { status: 'past', details: null };
    }

    if (isBooked) return { status: 'booked', details: null };
    if (isPending) return { status: 'pending', details: { status: 'PENDING' } };
    return { status: 'available', details: null };
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + (currentDate.getDay() === 0 ? -6 : 1));
    startOfWeek.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(d.getDate() + i);
        days.push(d);
    }

    return (
      <div className="flex overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-3 min-w-full">
          {days.map(day => {
            const dayStr = day.toISOString().split('T')[0];
            const dayBookings = bookings.filter(b => b.date === dayStr && b.status !== 'CANCELLED' && b.status !== 'REJECTED');
            
            return (
              <div key={dayStr} className="flex-1 min-w-[150px] bg-slate-800/30 rounded-xl border border-slate-700/50 p-3 flex flex-col">
                <div className="text-center mb-3 pb-3 border-b border-slate-700/50 cursor-pointer hover:bg-slate-700/50 rounded transition-colors"
                     onClick={() => { setCurrentDate(day); setViewMode('day'); }}>
                  <div className="text-xs text-slate-400 font-semibold uppercase">{day.toLocaleDateString(undefined, { weekday: 'short' })}</div>
                  <div className={`text-lg font-bold ${dayStr === formattedDateString ? 'text-blue-400' : 'text-white'}`}>{day.getDate()}</div>
                </div>
                <div className="space-y-2 flex-1">
                  {dayBookings.length === 0 ? (
                    <div className="text-xs text-slate-500 text-center py-4">No bookings</div>
                  ) : (
                    dayBookings.sort((a,b) => timesToMinutes(a.startTime) - timesToMinutes(b.startTime)).map(b => (
                      <div key={b.id} className={`p-2 rounded-lg border text-xs cursor-pointer hover:opacity-80 transition-opacity ${
                        b.status === 'APPROVED' ? 'bg-rose-500/10 border-rose-500/30' : 'bg-amber-500/10 border-amber-500/30'
                      }`} title={b.purpose}>
                        <div className={`font-semibold mb-1 ${b.status === 'APPROVED' ? 'text-rose-400' : 'text-amber-400'}`}>
                          {b.startTime} - {b.endTime}
                        </div>
                        <div className="text-slate-300 truncate opacity-80">{b.purpose || b.status}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay() + (startDate.getDay() === 0 ? -6 : 1));
    
    const endDate = new Date(endOfMonth);
    if (endDate.getDay() !== 0) {
      endDate.setDate(endDate.getDate() + (7 - endDate.getDay()));
    }

    const weeks = [];
    const curr = new Date(startDate);
    while (curr <= endDate) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        week.push(new Date(curr));
        curr.setDate(curr.getDate() + 1);
      }
      weeks.push(week);
    }

    return (
      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-2 sm:p-4 overflow-x-auto">
        <div className="min-w-[400px]">
          <div className="grid grid-cols-7 mb-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <div key={d} className="text-center text-[10px] sm:text-xs font-semibold text-slate-400 pb-2">{d}</div>
            ))}
          </div>
          <div className="space-y-1">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="grid grid-cols-7 gap-1">
                {week.map((day, dIdx) => {
                  const dayStr = day.toISOString().split('T')[0];
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  const isToday = dayStr === new Date().toISOString().split('T')[0];
                  const isSelected = dayStr === formattedDateString;
                  
                  const dayBookings = bookings.filter(b => b.date === dayStr && b.status !== 'CANCELLED' && b.status !== 'REJECTED');
                  const approvedCount = dayBookings.filter(b => b.status === 'APPROVED').length;
                  const pendingCount = dayBookings.filter(b => b.status === 'PENDING').length;
                  const isPast = day < new Date(new Date().setHours(0,0,0,0));

                  return (
                    <div key={dIdx} 
                         onClick={() => { setCurrentDate(day); setViewMode('day'); }}
                         className={`min-h-[60px] sm:min-h-[80px] p-1.5 sm:p-2 rounded-lg border transition-all cursor-pointer flex flex-col ${
                           !isCurrentMonth ? 'opacity-40 bg-slate-900 border-transparent' :
                           isSelected ? 'bg-blue-500/10 border-blue-500/50' : 
                           isToday ? 'bg-slate-800 border-emerald-500/30' :
                           'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700 hover:border-slate-500'
                         }`}>
                      <div className={`text-xs font-bold flex justify-between items-start sm:items-center ${isToday ? 'text-emerald-400' : 'text-slate-300'}`}>
                        <span>{day.getDate()}</span>
                        {isToday && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 hidden sm:block"></span>}
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-end gap-1 mt-auto">
                        {!isPast && approvedCount === 0 && pendingCount === 0 && (
                          <div className="w-2 h-2 rounded-full bg-emerald-500/50 self-end" title="Available"></div>
                        )}
                        {approvedCount > 0 && (
                          <div className="text-[9px] sm:text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1 py-0.5 rounded truncate">
                            {approvedCount} <span className="hidden sm:inline">Booked</span>
                          </div>
                        )}
                        {pendingCount > 0 && (
                          <div className="text-[9px] sm:text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 py-0.5 rounded truncate">
                            {pendingCount} <span className="hidden sm:inline">Pending</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          style={{ maxHeight: '90vh' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-800/50">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-400" />
                Availability Calendar
              </h2>
              <p className="text-sm text-slate-400 mt-1">{facilityName || 'Select a facility first'}</p>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {/* Control Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
              <div className="flex p-1 bg-slate-800/50 rounded-lg border border-slate-700/50 w-full sm:w-auto">
                {(['day', 'week', 'month'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium capitalize tracking-wide transition-all ${viewMode === mode ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between">
                <button onClick={handlePrevDay} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="text-center min-w-[150px]">
                  <h3 className="text-base sm:text-lg font-semibold text-white">{dateDisplay}</h3>
                </div>
                <button onClick={handleNextDay} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mb-6 text-sm font-medium">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                <span className="text-slate-300">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
                <span className="text-slate-300">Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></span>
                <span className="text-slate-300">Booked</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-700"></span>
                <span className="text-slate-500">Past</span>
              </div>
            </div>

            {/* Calendar Slots */}
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
              </div>
            ) : viewMode === 'day' ? (
              <div className="space-y-3">
                {customSlots.map((slot, idx) => {
                  const { status } = getSlotStatus(slot);
                  const startStr = formatTimeMinutes(slot.startMins);
                  const endStr = formatTimeMinutes(slot.endMins);

                  // Editing state ui
                  if (editingSlotId === slot.id) {
                    return (
                      <motion.div key={slot.id} className="relative p-4 rounded-xl border bg-slate-800/80 border-blue-500/50 shadow-[0_0_12px_rgba(59,130,246,0.15)] flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-blue-300">Editing Time Range</span>
                          <div className="flex gap-2">
                             <button
                               onClick={(e) => { e.stopPropagation(); handleSaveEdit(idx); }}
                               className="p-1 px-3 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-semibold tracking-wider flex items-center gap-1 shadow-sm transition-colors"
                             >
                               <Check className="w-3.5 h-3.5"/> Save
                             </button>
                             <button 
                               onClick={(e) => { e.stopPropagation(); setEditingSlotId(null); setEditError(null); }}
                               className="p-1 px-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs font-semibold tracking-wider flex items-center gap-1 transition-colors"
                             >
                               <X className="w-3.5 h-3.5"/> Cancel
                             </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Start Time</label>
                            <input 
                               type="time" value={editForm.start} 
                               onChange={e => setEditForm({...editForm, start: e.target.value})} 
                               className="bg-slate-950 border border-slate-700/50 focus:border-blue-500/50 rounded-lg px-3 py-2 text-white text-sm w-full outline-none transition-colors" 
                            />
                          </div>
                          <div>
                             <label className="block text-xs font-medium text-slate-400 mb-1">End Time</label>
                             <input 
                               type="time" value={editForm.end} 
                               onChange={e => setEditForm({...editForm, end: e.target.value})} 
                               className="bg-slate-950 border border-slate-700/50 focus:border-blue-500/50 rounded-lg px-3 py-2 text-white text-sm w-full outline-none transition-colors" 
                             />
                          </div>
                        </div>

                        <AnimatePresence>
                          {editError && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-xs text-rose-400 font-medium bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg mt-1">
                              ⚠️ {editError}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  }
                  
                  let bgClass = '';
                  let borderClass = '';
                  let textClass = 'text-white';
                  let isClickable = false;

                  if (status === 'available') {
                    bgClass = 'bg-emerald-500/10 hover:bg-emerald-500/20';
                    borderClass = 'border-emerald-500/30 hover:border-emerald-500/50';
                    isClickable = true;
                  } else if (status === 'pending') {
                    bgClass = 'bg-amber-500/10 cursor-not-allowed';
                    borderClass = 'border-amber-500/30';
                  } else if (status === 'booked') {
                    bgClass = 'bg-rose-500/10 cursor-not-allowed';
                    borderClass = 'border-rose-500/30';
                  } else { // past
                    bgClass = 'bg-slate-800/50 cursor-not-allowed opacity-50';
                    borderClass = 'border-slate-700/50';
                    textClass = 'text-slate-500';
                  }

                  return (
                    <motion.div
                      key={slot.id}
                      layout
                      whileHover={isClickable ? { scale: 1.01 } : {}}
                      whileTap={isClickable ? { scale: 0.99 } : {}}
                      onClick={() => {
                        if (isClickable) {
                          onSelectSlot(formattedDateString, startStr, endStr);
                          onClose();
                        }
                      }}
                      className={`relative flex items-center justify-between p-4 rounded-xl border transition-all ${bgClass} ${borderClass}`}
                    >
                      <div className={`font-semibold flex items-center gap-3 ${textClass}`}>
                        <span>{startStr} - {endStr}</span>
                        {slot.isAdjusted && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            Adjusted
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {status === 'available' && (
                          <>
                            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Free</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingSlotId(slot.id);
                                setEditForm({ start: startStr, end: endStr });
                                setEditError(null);
                              }}
                              className="ml-2 p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors flex items-center gap-1.5"
                              title="Edit Slot Time"
                            >
                              <Edit2 className="w-3.5 h-3.5" /> <span className="text-[10px] uppercase font-bold tracking-wider hidden sm:block">Edit</span>
                            </button>
                          </>
                        )}
                        {status === 'pending' && (
                          <span className="text-xs font-bold text-amber-400 border border-amber-400/30 bg-amber-400/10 px-2 py-1 rounded">Pending</span>
                        )}
                        {status === 'booked' && (
                          <span className="text-xs font-bold text-rose-400 border border-rose-400/30 bg-rose-400/10 px-2 py-1 rounded">Booked</span>
                        )}
                        {status === 'past' && (
                          <span className="text-xs font-medium text-slate-500">Unavailable</span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : viewMode === 'week' ? (
              renderWeekView()
            ) : (
              renderMonthView()
            )}
            
            {/* Smart Suggestion Context */}
            <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
               <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
               <p className="text-sm text-blue-200/80">
                 Click on any green <strong className="text-emerald-400">Available</strong> block to automatically select it for your booking. Please note that pending bookings may be approved by admins at any time.
               </p>
            </div>
            
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

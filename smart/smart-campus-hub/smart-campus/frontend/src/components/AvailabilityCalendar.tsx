import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlertTriangle, Clock, Check, Edit2 } from 'lucide-react';
import { format, addDays, parseISO, startOfDay, isBefore, isSameDay, subDays, startOfWeek, endOfWeek, subWeeks, addWeeks, startOfMonth, endOfMonth, subMonths, addMonths, eachDayOfInterval, isSameMonth, parse } from 'date-fns';
import { bookingApi } from '@/lib/api';
import type { Booking, Facility } from '@/lib/types';

interface AvailabilityCalendarProps {
  facility: Facility;
  initialDate?: string;
  onSelectSlot: (date: string, startTime: string, endTime: string) => void;
  onClose: () => void;
}

export default function AvailabilityCalendar({ facility, initialDate, onSelectSlot, onClose }: AvailabilityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => initialDate ? parse(initialDate, 'yyyy-MM-dd', new Date()) : new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [warningMsg, setWarningMsg] = useState('');
  const [draftSlot, setDraftSlot] = useState<{ startM: number, endM: number, originalDateStr: string } | null>(null);

  useEffect(() => {
    setDraftSlot(null); // Clear draft when date changes
  }, [currentDate, viewMode]);

  useEffect(() => {
    if (warningMsg) {
      const t = setTimeout(() => setWarningMsg(''), 4000);
      return () => clearTimeout(t);
    }
  }, [warningMsg]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    bookingApi.getByFacility(facility.id).then(res => {
      if (!mounted) return;
      const validBookings = res.data.filter((b: Booking) => b.status !== 'CANCELLED' && b.status !== 'REJECTED');
      setBookings(validBookings);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, [facility.id, currentDate]); // Reload on mount, but data is full. Keeping it simple.

  const handlePrev = () => {
    if (viewMode === 'day') setCurrentDate(d => subDays(d, 1));
    else if (viewMode === 'week') setCurrentDate(d => subWeeks(d, 1));
    else if (viewMode === 'month') setCurrentDate(d => subMonths(d, 1));
  };
  const handleNext = () => {
    if (viewMode === 'day') setCurrentDate(d => addDays(d, 1));
    else if (viewMode === 'week') setCurrentDate(d => addWeeks(d, 1));
    else if (viewMode === 'month') setCurrentDate(d => addMonths(d, 1));
  };

  const timeToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
  const dayStartM = 8 * 60 + 30; // 8:30 AM
  const dayEndM = isWeekend ? 20 * 60 + 30 : 17 * 60 + 30; // 8:30 PM weekend, 5:30 PM weekday

  const isOverlap = (startM: number, endM: number) => {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const existing = bookings.filter(b => b.date === dateStr && timeToMinutes(b.startTime) < dayEndM && timeToMinutes(b.endTime) > dayStartM);
    for (const b of existing) {
      if (b.status === 'CANCELLED' || b.status === 'REJECTED') continue;
      const bStart = Math.max(dayStartM, timeToMinutes(b.startTime));
      const bEnd = Math.min(dayEndM, timeToMinutes(b.endTime));
      // Overlap condition
      if (Math.max(startM, bStart) < Math.min(endM, bEnd)) return true;
    }
    return false;
  };

  const handleSlotClick = (date: Date, startM: number, endM: number, status: string) => {
    
    if (status === 'past') return;
    if (status === 'booked' || status === 'pending') {
      setWarningMsg('This time slot is already booked. Please select another available slot.');
      return;
    }
    
    if (status === 'available') {
      setDraftSlot({ startM, endM, originalDateStr: format(date, 'yyyy-MM-dd') });
    }
  };

  const formatTimeInput = (m: number) => {
    const h = Math.floor(m / 60);
    const min = m % 60;
    return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
  };

  const handleDraftSelect = () => {
    if (draftSlot) {
      const startStr = formatTimeInput(draftSlot.startM);
      const endStr = formatTimeInput(draftSlot.endM);
      onSelectSlot(draftSlot.originalDateStr, startStr, endStr);
      onClose();
    }
  };

  const updateDraftTime = (type: 'start' | 'end', valStr: string) => {
    if (!draftSlot || !valStr) return;
    const newM = timeToMinutes(valStr);
    
    const newStartM = type === 'start' ? newM : draftSlot.startM;
    const newEndM = type === 'end' ? newM : draftSlot.endM;

    if (newStartM >= newEndM) {
      setWarningMsg('End time must be after start time.');
      return;
    }
    if (newStartM < dayStartM || newEndM > dayEndM) {
      setWarningMsg('Selected time is outside facility operating hours.');
      return;
    }
    if (isOverlap(newStartM, newEndM)) {
      setWarningMsg('Selected time overlaps with an existing booking.');
      return;
    }

    setDraftSlot({ ...draftSlot, startM: newStartM, endM: newEndM });
  };

  // Generate slots for the day dynamically based on existing bookings
  const generateSlots = () => {
    const defaultDuration = 60; // 1 hour slots by default
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    
    // Get today's bookings and sort by start time
    const todaysBookings = bookings
      .filter(b => b.date === dateStr && timeToMinutes(b.startTime) < dayEndM && timeToMinutes(b.endTime) > dayStartM)
      .map(b => ({
        startM: Math.max(dayStartM, timeToMinutes(b.startTime)),
        endM: Math.min(dayEndM, timeToMinutes(b.endTime)),
        status: b.status === 'PENDING' ? 'pending' : 'booked',
        label: b.status === 'PENDING' ? 'Pending' : 'Booked'
      }));

    if (draftSlot && draftSlot.originalDateStr === dateStr) {
      todaysBookings.push({
        startM: draftSlot.startM,
        endM: draftSlot.endM,
        status: 'draft',
        label: 'EDITING'
      });
    }

    todaysBookings.sort((a, b) => a.startM - b.startM);

    const generatedSlots = [];
    let currentM = dayStartM;

    for (const booking of todaysBookings) {
      if (booking.startM > currentM) {
        // Space before the booking
        let freeStartM = currentM;
        while (freeStartM + defaultDuration <= booking.startM) {
          generatedSlots.push(createSlotObj(freeStartM, freeStartM + defaultDuration, 'available', 'FREE'));
          freeStartM += defaultDuration;
        }
        // Remaining free space before booking
        if (freeStartM < booking.startM) {
          generatedSlots.push(createSlotObj(freeStartM, booking.startM, 'available', 'FREE'));
        }
      }
      
      // Add the exact booking slot
      // if previous overlapping fixed:
      if (booking.endM > currentM) {
        // ensure startM is at least currentM
        const actualStartM = Math.max(currentM, booking.startM);
        if (actualStartM < booking.endM) {
           generatedSlots.push(createSlotObj(actualStartM, booking.endM, booking.status, booking.label));
           currentM = booking.endM;
        }
      }
    }

    // Fill remaining day time
    while (currentM + defaultDuration <= dayEndM) {
      generatedSlots.push(createSlotObj(currentM, currentM + defaultDuration, 'available', 'FREE'));
      currentM += defaultDuration;
    }
    // Final remaining space
    if (currentM < dayEndM) {
      generatedSlots.push(createSlotObj(currentM, dayEndM, 'available', 'FREE'));
    }

    return generatedSlots;
  };

  const createSlotObj = (startM: number, endM: number, statusParam: string, labelParam = 'FREE') => {
    const startH = Math.floor(startM / 60);
    const startMin = startM % 60;
    const endH = Math.floor(endM / 60);
    const endMin = endM % 60;

    const timeStr = `${startH.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')} - ${endH.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
    
    // Verify against past constraints even if generated as 'available'
    const now = new Date();
    let finalStatus = statusParam;
    let finalLabel = labelParam;

    if (isBefore(currentDate, startOfDay(now)) || (isSameDay(currentDate, now) && timeToMinutes(format(now, 'HH:mm')) >= startM)) {
      finalStatus = 'past';
      finalLabel = '';
    }

    return { startM, endM, timeStr, status: finalStatus, label: finalLabel };
  };

  const renderDayView = () => {
    const slots = generateSlots();
    return (
            <div className="flex flex-col gap-3 pt-5">
              {slots.map((slot, i) => {
                let bgClass = '';
                let borderClass = '';
                let textClass = '';
                
                if (slot.status === 'draft') {
                  return (
                    <div key={i} className="flex flex-col gap-4 p-5 rounded-xl border border-slate-700/50 bg-[#0b0f19]">
                      <div className="flex items-center justify-between">
                        <span className="text-blue-500 font-extrabold uppercase text-[13px] flex items-center gap-2 whitespace-nowrap tracking-wide">
                          <Clock className="w-4 h-4" /> SET CUSTOM TIME
                        </span>
                        <button onClick={(e) => { e.stopPropagation(); setDraftSlot(null); }} className="text-slate-400 hover:text-white transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <input 
                            type="time" 
                            step="900"
                            value={formatTimeInput(slot.startM)} 
                            onChange={(e) => updateDraftTime('start', e.target.value)} 
                            className="bg-[#131724] border border-slate-600 text-white rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-bold text-[15px] w-full sm:w-auto [color-scheme:dark] cursor-pointer hover:bg-[#1a2033] transition-colors"
                          />
                          <span className="text-slate-500 font-medium">to</span>
                          <input 
                            type="time" 
                            step="900"
                            value={formatTimeInput(slot.endM)} 
                            onChange={(e) => updateDraftTime('end', e.target.value)} 
                            className="bg-[#131724] border border-slate-600 text-white rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-bold text-[15px] w-full sm:w-auto [color-scheme:dark] cursor-pointer hover:bg-[#1a2033] transition-colors"
                          />
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDraftSelect(); }}
                          className="text-white hover:text-blue-400 font-extrabold flex items-center gap-2 justify-center transition-colors w-full sm:w-auto sm:ml-auto text-[16px]"
                        >
                          <Check className="w-5 h-5" /> Save
                        </button>
                      </div>
                      <p className="text-[12px] text-slate-400">Available slots below will automatically adjust when you modify this time range.</p>
                    </div>
                  );
                }

                if (slot.status === 'available') {
                  bgClass = 'bg-[#0f2425] hover:bg-[#133031] cursor-pointer';
                  borderClass = 'border-emerald-800/60';
                  textClass = 'text-emerald-400 font-extrabold';
                } else if (slot.status === 'pending') {
                  bgClass = 'bg-[#291b10] cursor-not-allowed';
                  borderClass = 'border-amber-700/50';
                  textClass = 'text-amber-400 font-extrabold border border-amber-600/30 px-2 py-0.5 rounded text-xs';
                } else if (slot.status === 'booked') {
                  bgClass = 'bg-[#2e1515] cursor-not-allowed';
                  borderClass = 'border-rose-800/60';
                  textClass = 'text-rose-400 font-extrabold border border-rose-600/30 px-2 py-0.5 rounded text-xs';
                } else {
                  bgClass = 'bg-[#181d2c] cursor-not-allowed opacity-50';
                  borderClass = 'border-slate-800';
                  textClass = 'text-slate-500 font-extrabold';
                }

                return (
                  <div
                    key={i}
                    onClick={() => handleSlotClick(currentDate, slot.startM, slot.endM, slot.status)}
                    className={`flex items-center justify-between px-6 py-4 rounded-xl border ${bgClass} ${borderClass} transition-colors`}
                  >
                    <span className="text-[15px] font-extrabold text-white tracking-wide">
                      {slot.timeStr}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className={`uppercase tracking-widest ${textClass}`}>
                        {slot.label}
                      </span>
                      {slot.status === 'available' && (
                        <button 
                          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-bold transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> EDIT
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
    );
  };

  const renderWeekView = () => {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
    const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="min-w-[600px] h-full grid grid-cols-7 gap-2 pt-4 pb-2">
        {weekDays.map((d, index) => {
          const dateStr = format(d, 'yyyy-MM-dd');
          const dayBookings = bookings.filter(b => b.date === dateStr && b.status !== 'CANCELLED' && b.status !== 'REJECTED')
            .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
          const isToday = isSameDay(d, new Date());

          return (
            <div key={index} className="flex flex-col bg-[#161a29] border border-slate-800 rounded-xl overflow-hidden">
              <div className={`p-2 text-center border-b border-slate-800 ${isToday ? 'bg-blue-500/20 text-white' : 'bg-[#0f131f] text-slate-300'}`}>
                <div className="text-[10px] font-bold uppercase tracking-wider">{format(d, 'EEE')}</div>
                <div className={`text-lg font-black ${isToday ? 'text-blue-400' : 'text-slate-100'}`}>{format(d, 'd')}</div>
              </div>
              <div 
                className="flex-1 p-2 space-y-2 overflow-y-auto cursor-pointer hover:bg-slate-800/30 transition-colors"
                onClick={() => { setCurrentDate(d); setViewMode('day'); }}
              >
                {dayBookings.length > 0 ? (
                  dayBookings.map((b, i) => (
                    <div key={i} className={`p-1.5 rounded border text-[10px] sm:text-xs font-bold flex flex-col gap-0.5 ${b.status === 'PENDING' ? 'bg-[#291b10] border-amber-700/50 text-amber-400' : 'bg-[#2e1515] border-rose-800/60 text-rose-400'}`}>
                      <span>{b.startTime.slice(0, 5)} - {b.endTime.slice(0, 5)}</span>
                      <span className="truncate opacity-80">{b.status}</span>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-600 font-bold p-2 text-center">No bookings</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const monthDays = eachDayOfInterval({ start: startDate, end: endDate });
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
      <div className="flex flex-col h-full pt-4 pb-2">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekdays.map(wd => (
            <div key={wd} className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest">{wd}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2 flex-1 auto-rows-fr">
          {monthDays.map((d, index) => {
            const dateStr = format(d, 'yyyy-MM-dd');
            const dayBookings = bookings.filter(b => b.date === dateStr && b.status !== 'CANCELLED' && b.status !== 'REJECTED');
            const isCurrentMonth = isSameMonth(d, monthStart);
            const isToday = isSameDay(d, new Date());
            
            const pendingCount = dayBookings.filter(b => b.status === 'PENDING').length;
            const bookedCount = dayBookings.filter(b => b.status !== 'PENDING').length;

            return (
              <div 
                key={index}
                onClick={() => { setCurrentDate(d); setViewMode('day'); }}
                className={`p-1.5 sm:p-2 border rounded-xl flex flex-col cursor-pointer transition-colors ${isCurrentMonth ? 'bg-[#161a29] border-slate-700/50 hover:border-slate-500' : 'bg-[#0b0f19] border-transparent opacity-40'} ${isToday ? 'border-blue-500/70 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : ''}`}
              >
                <div className={`text-right text-xs sm:text-sm font-bold ${isToday ? 'text-blue-400' : 'text-slate-300'}`}>
                  {format(d, 'd')}
                </div>
                <div className="mt-auto pt-2 flex flex-col gap-1 items-end">
                  {dayBookings.length > 0 ? (
                    <div className="flex flex-wrap gap-1 items-center justify-end max-w-full">
                      {Array.from({ length: Math.min(pendingCount, 4) }).map((_, i) => (
                        <div key={`p-${i}`} className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]" />
                      ))}
                      {Array.from({ length: Math.min(bookedCount, 4) }).map((_, i) => (
                        <div key={`b-${i}`} className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.5)]" />
                      ))}
                      {(pendingCount + bookedCount) > 8 && <span className="text-[8px] text-slate-400 font-bold ml-0.5">+{pendingCount + bookedCount - 8}</span>}
                    </div>
                  ) : (
                    (isCurrentMonth && !isBefore(d, startOfDay(new Date()))) ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 opacity-40 shadow-[0_0_5px_rgba(16,185,129,0.3)]" />
                    ) : null
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getHeaderDateString = () => {
    if (viewMode === 'day') return format(currentDate, 'EEEE, MMMM d, yyyy');
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    }
    return format(currentDate, 'MMMM yyyy');
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-start justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="w-full max-w-2xl my-auto max-h-[100%] sm:max-h-[90vh] flex flex-col shadow-2xl relative border border-slate-700/50 bg-[#161a29]/95 rounded-2xl overflow-hidden backdrop-blur-md">
        {/* Header */}
        <div className="p-5 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2 tracking-wide">
              <CalendarIcon className="w-6 h-6 text-blue-400" />
              Availability Calendar
            </h2>
            <p className="text-[13px] text-slate-400 mt-1.5 font-medium">{facility.name} ({facility.location})</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-[#0b0f19] p-1 rounded-lg border border-slate-700/50 shrink-0">
              {(['day', 'week', 'month'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-1.5 rounded-md text-sm font-bold capitalize transition-colors ${viewMode === mode ? 'bg-blue-600 text-white shadow-md cursor-default' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 cursor-pointer'}`}
                >
                  {mode}
                </button>
              ))}
            </div>
            
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700 rounded-full transition-colors shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-slate-700/50 flex-shrink-0"></div>

        {/* Date Selector & Legend */}
        <div className="p-5 flex flex-col items-center bg-[#161a29] flex-shrink-0 border-b border-slate-700/50">
          <div className="flex items-center justify-between w-full max-w-md mb-4">
            <button onClick={handlePrev} className="w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[17px] font-extrabold text-white tracking-wide">
              {getHeaderDateString()}
            </span>
            <button onClick={handleNext} className="w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-6 mt-1 text-[13px] font-bold tracking-wide">
            <span className="flex items-center gap-2 text-slate-100"><span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span> Available</span>
            <span className="flex items-center gap-2 text-slate-100"><span className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"></span> Pending</span>
            <span className="flex items-center gap-2 text-slate-100"><span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]"></span> Booked</span>
            <span className="flex items-center gap-2 text-slate-100"><span className="w-3 h-3 rounded-full bg-slate-500"></span> Past</span>
          </div>
        </div>

        {/* Views */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden nice-scrollbar relative bg-[#131724]">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
            </div>
          ) : (
            <div className="h-full px-5 pb-5">
              {viewMode === 'day' && renderDayView()}
              {viewMode === 'week' && renderWeekView()}
              {viewMode === 'month' && renderMonthView()}
            </div>
          )}
        </div>

        {/* Warning Toast */}
        <AnimatePresence>
          {warningMsg && (
            <motion.div 
              initial={{ opacity: 0, y: 20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 20, x: '-50%' }}
              className="absolute bottom-6 left-1/2 z-[110] bg-rose-500 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 w-max max-w-[90%]"
            >
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-bold tracking-wide">{warningMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
}
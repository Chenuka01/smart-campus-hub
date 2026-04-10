import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { bookingApi } from '@/lib/api';
import type { Booking } from '@/lib/types';
import { CalendarDays, Plus, CheckCircle2, XCircle, Clock, Ban, X, AlertTriangle } from 'lucide-react';
import LiquidGlassCard from '@/components/LiquidGlassCard';
import NeuButton from '@/components/NeuButton';
import BookingTimer from '@/components/BookingTimer';
import { containerVariants, itemVariants, scrollRevealVariants } from '@/lib/animations';

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock; glassColor: string; glow: string }> = {
  PENDING: { label: 'Pending', color: 'text-amber-300', icon: Clock, glassColor: 'rgba(245,158,11,0.15)', glow: 'rgba(245,158,11,0.3)' },
  APPROVED: { label: 'Approved', color: 'text-emerald-300', icon: CheckCircle2, glassColor: 'rgba(16,185,129,0.15)', glow: 'rgba(16,185,129,0.3)' },
  REJECTED: { label: 'Rejected', color: 'text-rose-300', icon: XCircle, glassColor: 'rgba(244,63,94,0.15)', glow: 'rgba(244,63,94,0.3)' },
  CANCELLED: { label: 'Cancelled', color: 'text-slate-400', icon: Ban, glassColor: 'rgba(148,163,184,0.1)', glow: 'rgba(148,163,184,0.2)' },
};

export default function BookingsPage() {
  const { isAdmin, user } = useAuth();
  const { unreadCount } = useSocket();
  const isManager = user?.roles?.includes('MANAGER') || false;
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [actionModal, setActionModal] = useState<{ id: string; action: string } | null>(null);
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBookings = async () => {
    try {
      const res = (isAdmin || isManager) ? await bookingApi.getAll() : await bookingApi.getMy();
      setBookings(res.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchBookings(); }, [isAdmin, isManager, unreadCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRebook = (booking: Booking) => {
    navigate(`/bookings/new`, {
      state: {
        isRebooking: true,
        oldBooking: {
          id: booking.id,
          facilityId: booking.facilityId,
          facilityName: booking.facilityName,
          startTime: booking.startTime,
          endTime: booking.endTime,
          purpose: booking.purpose,
          expectedAttendees: booking.expectedAttendees,
          oldDate: booking.date
        }
      }
    });
  };

  const handleAction = async () => {
    if (!actionModal) return;

    if ((actionModal.action === 'reject' || actionModal.action === 'cancel') && !reason.trim()) {
      // The user wants a specific empty reason validation behavior shown on UI
      return; // Handled below in UI
    }

    setActionLoading(true);
    try {
      if (actionModal.action === 'approve') await bookingApi.approve(actionModal.id);
      else if (actionModal.action === 'reject') await bookingApi.reject(actionModal.id, reason);
      else if (actionModal.action === 'cancel') await bookingApi.cancel(actionModal.id, reason);
      setActionModal(null);
      setReason('');
      fetchBookings();
    } catch { alert('Action failed'); } finally { setActionLoading(false); }
  };

  const filtered = bookings.filter(b => !filter || b.status === filter).sort((a, b) => {
    const dateTimeA = new Date(`${a.date}T${a.startTime}`).getTime();
    const dateTimeB = new Date(`${b.date}T${b.startTime}`).getTime();
    
    // Handle invalid dates by putting them at the end
    if (isNaN(dateTimeA)) return 1;
    if (isNaN(dateTimeB)) return -1;
    
    return dateTimeA - dateTimeB; // Ascending (oldest -> newest)
  });
  
  const filterTabs = ['', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
        <p className="text-sm text-slate-500 animate-pulse">Loading bookings…</p>
      </div>
    );
  }

  return (
    <>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 pb-8">
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            <span className="text-gradient">Bookings</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {isAdmin ? 'Manage all facility bookings' : 'View and manage your bookings'}
          </p>
        </div>
        {!isAdmin && (
          <Link to="/bookings/new">
            <NeuButton variant="primary" size="md" icon={<Plus className="w-4 h-4" />} iconPosition="left">
              New Booking
            </NeuButton>
          </Link>
        )}
      </motion.div>

      {/* Status Filter Tabs */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
        {filterTabs.map(s => {
          const count = s ? bookings.filter(b => b.status === s).length : bookings.length;
          const cfg = s ? statusConfig[s] : null;
          return (
            <motion.button
              key={s}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setFilter(s)}
              className="px-4 py-2 text-sm font-semibold rounded-xl transition-all"
              style={filter === s ? {
                background: s ? statusConfig[s]?.glassColor : 'rgba(139,92,246,0.2)',
                border: `1px solid ${s ? statusConfig[s]?.glow : 'rgba(139,92,246,0.4)'}`,
                color: s ? statusConfig[s]?.color : '#a78bfa',
                boxShadow: s ? `0 0 12px ${statusConfig[s]?.glow}` : '0 0 12px rgba(139,92,246,0.2)',
              } : {
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: '#64748b',
              }}
            >
              {cfg && <cfg.icon className={`inline w-3.5 h-3.5 mr-1.5 ${cfg.color}`} />}
              {s || 'All'} <span className="opacity-60 ml-1">({count})</span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Bookings List */}
      <div className="space-y-3">
        {filtered.map((booking, i) => {
          const cfg = statusConfig[booking.status] || statusConfig.PENDING;
          const Icon = cfg.icon;
          const userCanManage = isAdmin || isManager;
          return (
            <motion.div
              key={booking.id}
              custom={i}
              variants={scrollRevealVariants}
              initial="hidden"
              animate="visible"
            >
              <LiquidGlassCard depth={2} className="overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: cfg.glassColor, border: `1px solid ${cfg.glow}`, boxShadow: `0 0 12px ${cfg.glow}` }}
                    >
                      <Icon className={`w-5 h-5 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white">{booking.facilityName}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" /> {booking.date}
                        </span>
                        <span>{booking.startTime} – {booking.endTime}</span>
                        {userCanManage && (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold text-slate-400" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            by {booking.userName}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{booking.purpose}</p>
                      
                      {booking.status === 'APPROVED' && (
                        <BookingTimer
                          date={booking.date}
                          startTime={booking.startTime}
                          endTime={booking.endTime}
                          status={booking.status}
                        />
                      )}

                      {booking.status === 'REJECTED' && (
                        <div className="mt-2.5 p-3.5 rounded-xl bg-[#2e1515]/80 border border-rose-800/40 shadow-[0_0_15px_rgba(244,63,94,0.05)]">
                          <p className="text-xs text-rose-400 flex items-start gap-2 font-medium leading-relaxed">
                            <XCircle className="w-4 h-4 shrink-0 mt-0.5" /> 
                            <span className="flex flex-col gap-1.5 flex-1">
                              <span><strong className="text-rose-300">Rejection Reason:</strong> {booking.rejectionReason || "No rejection reason provided."}</span>
                              {booking.updatedAt && (
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                  REJECTED ON: {new Date(booking.updatedAt).toLocaleString()}
                                </span>
                              )}
                            </span>
                          </p>
                        </div>
                      )}
                      
                      {booking.status === 'CANCELLED' && (
                        <div className="mt-2.5 p-3.5 rounded-xl bg-[#2e1515]/80 border border-rose-800/40">
                          <p className="text-xs text-rose-400 flex items-start gap-2 font-medium leading-relaxed">
                            <Ban className="w-4 h-4 shrink-0 mt-0.5" /> 
                            <span className="flex flex-col gap-1.5 flex-1">
                              <span><strong className="text-rose-300">Cancellation Reason:</strong> {booking.cancellationReason || "No cancellation reason provided."}</span>
                              {booking.canceledAt && (
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                  CANCELED AT: {new Date(booking.canceledAt).toLocaleString()}
                                </span>
                              )}
                              {userCanManage && booking.canceledBy && (
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                  CANCELED BY: {booking.canceledBy} ({booking.canceledByRole})
                                </span>
                              )}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    <span
                      className={`px-3 py-1.5 text-xs font-bold rounded-full ${cfg.color}`}
                      style={{ background: cfg.glassColor, border: `1px solid ${cfg.glow}` }}
                    >
                      {cfg.label}
                    </span>
                    {userCanManage && booking.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <NeuButton size="sm" variant="success" onClick={(e) => { e.stopPropagation(); setActionModal({ id: booking.id, action: 'approve' }); }}>Approve</NeuButton>
                        <NeuButton size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); setActionModal({ id: booking.id, action: 'reject' }); }}>Reject</NeuButton>
                      </div>
                    )}
                    {!isAdmin && !isManager && booking.userId === user?.id && (booking.status === 'PENDING' || booking.status === 'APPROVED') && (
                      <NeuButton size="sm" variant="secondary" onClick={() => setActionModal({ id: booking.id, action: 'cancel' })}>Cancel Booking</NeuButton>
                    )}
                    {!isAdmin && (booking.status === 'APPROVED' || booking.status === 'COMPLETED') && (
                      <NeuButton size="sm" variant="primary" onClick={() => handleRebook(booking)}>Rebook</NeuButton>
                    )}
                  </div>
                </div>
              </LiquidGlassCard>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 text-slate-700" />
          <p className="text-slate-400 font-semibold">No bookings found</p>
        </div>
      )}
      </motion.div>

      {/* Action Modal */}
      <AnimatePresence>
        {actionModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={() => setActionModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl p-6 relative"
              style={{
                background: 'rgba(20, 10, 50, 0.95)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
              }}
            >
              <button 
                onClick={() => setActionModal(null)}
                className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-xl font-bold text-white mb-5 capitalize">{actionModal.action} Booking</h3>
              {(actionModal.action === 'reject' || actionModal.action === 'cancel') && (
                <div className="mb-5">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {actionModal.action === 'cancel' ? 'Reason for Cancellation *' : 'Reason *'}
                  </label>
                  <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    rows={3}
                    className={`glass-input w-full px-4 py-3 rounded-xl text-sm resize-none ${(actionModal.action === 'cancel' || actionModal.action === 'reject') && !reason.trim() ? 'border-rose-500/50' : ''}`}
                    placeholder={`Reason for ${actionModal.action}…`}
                    required
                  />
                  {(actionModal.action === 'cancel' || actionModal.action === 'reject') && !reason.trim() && (
                    <p className="text-xs text-rose-400 mt-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Please provide a reason for {actionModal.action}.</p>
                  )}
                </div>
              )}
              {actionModal.action === 'approve' && (
                <p className="text-slate-400 text-sm mb-5">Are you sure you want to approve this booking?</p>
              )}
              <div className="flex">
                <NeuButton
                  onClick={handleAction}
                  disabled={(actionModal.action === 'reject' || actionModal.action === 'cancel') && !reason.trim()}
                  loading={actionLoading}
                  variant={actionModal.action === 'approve' ? 'success' : actionModal.action === 'reject' ? 'danger' : 'danger'}
                  fullWidth
                >
                  {actionModal.action === 'cancel' 
                    ? 'Confirm Cancellation' 
                    : actionModal.action === 'reject' 
                      ? 'Submit Rejection'
                      : 'Approve'
                  }
                </NeuButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

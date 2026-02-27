import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { bookingApi } from '@/lib/api';
import type { Booking } from '@/lib/types';
import {
  CalendarDays, Plus, CheckCircle2, XCircle, Clock,
  Ban, MessageSquare
} from 'lucide-react';

const statusConfig: Record<string, { color: string; icon: typeof Clock; bg: string }> = {
  PENDING: { color: 'text-amber-700', icon: Clock, bg: 'bg-amber-50 border-amber-200' },
  APPROVED: { color: 'text-emerald-700', icon: CheckCircle2, bg: 'bg-emerald-50 border-emerald-200' },
  REJECTED: { color: 'text-rose-700', icon: XCircle, bg: 'bg-rose-50 border-rose-200' },
  CANCELLED: { color: 'text-slate-600', icon: Ban, bg: 'bg-slate-50 border-slate-200' },
};

export default function BookingsPage() {
  const { isAdmin, user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [actionModal, setActionModal] = useState<{ id: string; action: string } | null>(null);
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [isAdmin]);

  const fetchBookings = async () => {
    try {
      const res = isAdmin ? await bookingApi.getAll() : await bookingApi.getMy();
      setBookings(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!actionModal) return;
    setActionLoading(true);
    try {
      if (actionModal.action === 'approve') {
        await bookingApi.approve(actionModal.id);
      } else if (actionModal.action === 'reject') {
        await bookingApi.reject(actionModal.id, reason);
      } else if (actionModal.action === 'cancel') {
        await bookingApi.cancel(actionModal.id, reason);
      }
      setActionModal(null);
      setReason('');
      fetchBookings();
    } catch {
      alert('Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = bookings.filter(b => !filter || b.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bookings</h1>
          <p className="text-slate-500 text-sm mt-1">
            {isAdmin ? 'Manage all facility bookings' : 'View and manage your bookings'}
          </p>
        </div>
        <Link to="/bookings/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 gradient-primary text-white font-medium rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all">
          <Plus className="w-4 h-4" /> New Booking
        </Link>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        {['', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
              filter === s
                ? 'gradient-primary text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}>
            {s || 'All'} {s && `(${bookings.filter(b => b.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filtered.map((booking, index) => {
          const config = statusConfig[booking.status] || statusConfig.PENDING;
          const Icon = config.icon;
          return (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-12 h-12 rounded-xl ${config.bg} border flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900">{booking.facilityName}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5" /> {booking.date}
                      </span>
                      <span>{booking.startTime} - {booking.endTime}</span>
                      {isAdmin && <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">by {booking.userName}</span>}
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{booking.purpose}</p>
                    {booking.rejectionReason && (
                      <p className="text-sm text-rose-600 mt-1 flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" /> {booking.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${config.bg} border ${config.color}`}>
                    {booking.status}
                  </span>
                  {isAdmin && booking.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button onClick={() => setActionModal({ id: booking.id, action: 'approve' })}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg hover:bg-emerald-100 transition-all border border-emerald-200">
                        Approve
                      </button>
                      <button onClick={() => setActionModal({ id: booking.id, action: 'reject' })}
                        className="px-3 py-1.5 bg-rose-50 text-rose-700 text-xs font-medium rounded-lg hover:bg-rose-100 transition-all border border-rose-200">
                        Reject
                      </button>
                    </div>
                  )}
                  {booking.userId === user?.id && (booking.status === 'PENDING' || booking.status === 'APPROVED') && (
                    <button onClick={() => setActionModal({ id: booking.id, action: 'cancel' })}
                      className="px-3 py-1.5 bg-slate-50 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-100 transition-all border border-slate-200">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No bookings found</p>
        </div>
      )}

      {/* Action Modal */}
      <AnimatePresence>
        {actionModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setActionModal(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-slate-900 mb-4 capitalize">{actionModal.action} Booking</h3>
              {(actionModal.action === 'reject' || actionModal.action === 'cancel') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Reason</label>
                  <textarea value={reason} onChange={e => setReason(e.target.value)}
                    rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder={`Reason for ${actionModal.action}...`} />
                </div>
              )}
              {actionModal.action === 'approve' && (
                <p className="text-slate-600 mb-4">Are you sure you want to approve this booking?</p>
              )}
              <div className="flex gap-3">
                <button onClick={handleAction} disabled={actionLoading}
                  className={`flex-1 py-2.5 font-medium rounded-xl text-white transition-all disabled:opacity-50 ${
                    actionModal.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' :
                    actionModal.action === 'reject' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-600 hover:bg-slate-700'
                  }`}>
                  {actionLoading ? 'Processing...' : `${actionModal.action.charAt(0).toUpperCase() + actionModal.action.slice(1)}`}
                </button>
                <button onClick={() => setActionModal(null)}
                  className="px-6 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-all">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

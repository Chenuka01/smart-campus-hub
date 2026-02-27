import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { ticketApi, authApi } from '@/lib/api';
import type { Ticket, User } from '@/lib/types';
import {
  Ticket as TicketIcon, Plus, AlertTriangle,
  Activity, User as UserIcon, ArrowRight
} from 'lucide-react';

const priorityConfig: Record<string, { color: string; bg: string }> = {
  CRITICAL: { color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
  HIGH: { color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  MEDIUM: { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  LOW: { color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
};

const statusConfig: Record<string, { color: string; bg: string }> = {
  OPEN: { color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  IN_PROGRESS: { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  RESOLVED: { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  CLOSED: { color: 'text-slate-600', bg: 'bg-slate-100 border-slate-200' },
  REJECTED: { color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
};

export default function TicketsPage() {
  const { isAdmin, isTechnician } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [assignModal, setAssignModal] = useState<string | null>(null);
  const [statusModal, setStatusModal] = useState<{ id: string; currentStatus: string } | null>(null);
  const [selectedTech, setSelectedTech] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchTickets();
    if (isAdmin) {
      authApi.getUsers().then(res => setUsers(res.data)).catch(() => {});
    }
  }, [isAdmin, isTechnician]);

  const fetchTickets = async () => {
    try {
      let res;
      if (isAdmin) {
        res = await ticketApi.getAll();
      } else if (isTechnician) {
        res = await ticketApi.getAssigned();
      } else {
        res = await ticketApi.getMy();
      }
      setTickets(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!assignModal || !selectedTech) return;
    setActionLoading(true);
    try {
      const tech = users.find(u => u.id === selectedTech);
      await ticketApi.assign(assignModal, selectedTech, tech?.name || 'Technician');
      setAssignModal(null);
      setSelectedTech('');
      fetchTickets();
    } catch {
      alert('Failed to assign ticket');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!statusModal || !newStatus) return;
    setActionLoading(true);
    try {
      await ticketApi.updateStatus(statusModal.id, newStatus, resolutionNotes, rejectionReason);
      setStatusModal(null);
      setNewStatus('');
      setResolutionNotes('');
      setRejectionReason('');
      fetchTickets();
    } catch {
      alert('Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = tickets.filter(t => !filter || t.status === filter);
  const technicians = users.filter(u => u.roles?.includes('TECHNICIAN') || u.roles?.includes('ADMIN'));

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
          <h1 className="text-2xl font-bold text-slate-900">Maintenance Tickets</h1>
          <p className="text-slate-500 text-sm mt-1">
            {isAdmin ? 'Manage all maintenance tickets' : isTechnician ? 'Your assigned tickets' : 'Report and track issues'}
          </p>
        </div>
        <Link to="/tickets/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 gradient-primary text-white font-medium rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all">
          <Plus className="w-4 h-4" /> New Ticket
        </Link>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        {['', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
              filter === s
                ? 'gradient-primary text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}>
            {s ? s.replace('_', ' ') : 'All'} {s && `(${tickets.filter(t => t.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {filtered.map((ticket, index) => {
          const pConfig = priorityConfig[ticket.priority] || priorityConfig.LOW;
          const sConfig = statusConfig[ticket.status] || statusConfig.OPEN;
          return (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-all"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-10 h-10 rounded-xl ${pConfig.bg} border flex items-center justify-center flex-shrink-0`}>
                      {ticket.priority === 'CRITICAL' || ticket.priority === 'HIGH' ?
                        <AlertTriangle className={`w-5 h-5 ${pConfig.color}`} /> :
                        <Activity className={`w-5 h-5 ${pConfig.color}`} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link to={`/tickets/${ticket.id}`} className="font-semibold text-slate-900 hover:text-violet-600 transition-colors">
                          {ticket.title}
                        </Link>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${pConfig.bg} ${pConfig.color}`}>
                          {ticket.priority}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${sConfig.bg} ${sConfig.color}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2">{ticket.description}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                        <span>{ticket.category}</span>
                        <span>{ticket.location}</span>
                        <span>by {ticket.reportedByName}</span>
                        {ticket.assignedToName && (
                          <span className="flex items-center gap-1 text-violet-600">
                            <UserIcon className="w-3 h-3" /> {ticket.assignedToName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link to={`/tickets/${ticket.id}`}
                      className="px-3 py-1.5 bg-slate-50 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-100 transition-all border border-slate-200 flex items-center gap-1">
                      View <ArrowRight className="w-3 h-3" />
                    </Link>
                    {isAdmin && !ticket.assignedTo && ticket.status === 'OPEN' && (
                      <button onClick={() => setAssignModal(ticket.id)}
                        className="px-3 py-1.5 bg-violet-50 text-violet-700 text-xs font-medium rounded-lg hover:bg-violet-100 transition-all border border-violet-200">
                        Assign
                      </button>
                    )}
                    {(isAdmin || isTechnician) && ['OPEN', 'IN_PROGRESS'].includes(ticket.status) && (
                      <button onClick={() => { setStatusModal({ id: ticket.id, currentStatus: ticket.status }); setNewStatus(''); }}
                        className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-lg hover:bg-amber-100 transition-all border border-amber-200">
                        Update
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <TicketIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No tickets found</p>
        </div>
      )}

      {/* Assign Modal */}
      <AnimatePresence>
        {assignModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setAssignModal(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-slate-900 mb-4">Assign Technician</h3>
              <select value={selectedTech} onChange={e => setSelectedTech(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 mb-4">
                <option value="">Select technician</option>
                {technicians.map(t => <option key={t.id} value={t.id}>{t.name} ({t.email})</option>)}
              </select>
              <div className="flex gap-3">
                <button onClick={handleAssign} disabled={!selectedTech || actionLoading}
                  className="flex-1 py-2.5 gradient-primary text-white font-medium rounded-xl disabled:opacity-50">
                  {actionLoading ? 'Assigning...' : 'Assign'}
                </button>
                <button onClick={() => setAssignModal(null)} className="px-6 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Update Modal */}
      <AnimatePresence>
        {statusModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setStatusModal(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-slate-900 mb-4">Update Ticket Status</h3>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 mb-4">
                <option value="">Select new status</option>
                {statusModal.currentStatus === 'OPEN' && <option value="IN_PROGRESS">In Progress</option>}
                {['OPEN', 'IN_PROGRESS'].includes(statusModal.currentStatus) && <option value="RESOLVED">Resolved</option>}
                {statusModal.currentStatus === 'RESOLVED' && <option value="CLOSED">Closed</option>}
                {isAdmin && <option value="REJECTED">Rejected</option>}
              </select>
              {newStatus === 'RESOLVED' && (
                <textarea value={resolutionNotes} onChange={e => setResolutionNotes(e.target.value)}
                  rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 mb-4"
                  placeholder="Resolution notes..." />
              )}
              {newStatus === 'REJECTED' && (
                <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                  rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 mb-4"
                  placeholder="Rejection reason..." />
              )}
              <div className="flex gap-3">
                <button onClick={handleStatusUpdate} disabled={!newStatus || actionLoading}
                  className="flex-1 py-2.5 gradient-primary text-white font-medium rounded-xl disabled:opacity-50">
                  {actionLoading ? 'Updating...' : 'Update Status'}
                </button>
                <button onClick={() => setStatusModal(null)} className="px-6 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl">
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

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { ticketApi, authApi } from '@/lib/api';
import type { Ticket, User } from '@/lib/types';
import { Ticket as TicketIcon, Plus, AlertTriangle, Activity, User as UserIcon, ArrowRight } from 'lucide-react';
import LiquidGlassCard from '@/components/LiquidGlassCard';
import NeuButton from '@/components/NeuButton';
import { containerVariants, itemVariants, scrollRevealVariants } from '@/lib/animations';

const priorityConfig: Record<string, { color: string; glow: string; glassColor: string; pulse: boolean }> = {
  CRITICAL: { color: 'text-rose-300', glow: 'rgba(244,63,94,0.5)', glassColor: 'rgba(244,63,94,0.15)', pulse: true },
  HIGH: { color: 'text-orange-300', glow: 'rgba(249,115,22,0.4)', glassColor: 'rgba(249,115,22,0.12)', pulse: true },
  MEDIUM: { color: 'text-amber-300', glow: 'rgba(245,158,11,0.3)', glassColor: 'rgba(245,158,11,0.1)', pulse: false },
  LOW: { color: 'text-slate-400', glow: 'rgba(148,163,184,0.2)', glassColor: 'rgba(148,163,184,0.08)', pulse: false },
};

const statusConfig: Record<string, { color: string; glassColor: string; glow: string }> = {
  OPEN: { color: 'text-blue-300', glassColor: 'rgba(59,130,246,0.15)', glow: 'rgba(59,130,246,0.3)' },
  IN_PROGRESS: { color: 'text-amber-300', glassColor: 'rgba(245,158,11,0.15)', glow: 'rgba(245,158,11,0.3)' },
  RESOLVED: { color: 'text-emerald-300', glassColor: 'rgba(16,185,129,0.15)', glow: 'rgba(16,185,129,0.3)' },
  CLOSED: { color: 'text-slate-400', glassColor: 'rgba(148,163,184,0.1)', glow: 'rgba(148,163,184,0.2)' },
  REJECTED: { color: 'text-rose-300', glassColor: 'rgba(244,63,94,0.15)', glow: 'rgba(244,63,94,0.3)' },
};

const glassModal = {
  background: 'rgba(20, 10, 50, 0.95)',
  backdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.1)',
  boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
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
    if (isAdmin) authApi.getUsers().then(res => setUsers(res.data)).catch(() => {});
  }, [isAdmin, isTechnician]);

  const fetchTickets = async () => {
    try {
      const res = isAdmin ? await ticketApi.getAll() : isTechnician ? await ticketApi.getAssigned() : await ticketApi.getMy();
      setTickets(res.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const handleAssign = async () => {
    if (!assignModal || !selectedTech) return;
    setActionLoading(true);
    try {
      const tech = users.find(u => u.id === selectedTech);
      await ticketApi.assign(assignModal, selectedTech, tech?.name || 'Technician');
      setAssignModal(null); setSelectedTech(''); fetchTickets();
    } catch { alert('Failed to assign'); } finally { setActionLoading(false); }
  };

  const handleStatusUpdate = async () => {
    if (!statusModal || !newStatus) return;
    setActionLoading(true);
    try {
      await ticketApi.updateStatus(statusModal.id, newStatus, resolutionNotes, rejectionReason);
      setStatusModal(null); setNewStatus(''); setResolutionNotes(''); setRejectionReason(''); fetchTickets();
    } catch { alert('Failed to update'); } finally { setActionLoading(false); }
  };

  const filtered = tickets.filter(t => !filter || t.status === filter);
  const technicians = users.filter(u => u.roles?.includes('TECHNICIAN') || u.roles?.includes('ADMIN'));
  const filterTabs = ['', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
        <p className="text-sm text-slate-500 animate-pulse">Loading tickets…</p>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 pb-8">
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Maintenance <span className="text-gradient">Tickets</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {isAdmin ? 'Manage all maintenance tickets' : isTechnician ? 'Your assigned tickets' : 'Report and track issues'}
          </p>
        </div>
        <Link to="/tickets/new">
          <NeuButton variant="primary" size="md" icon={<Plus className="w-4 h-4" />} iconPosition="left">
            New Ticket
          </NeuButton>
        </Link>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
        {filterTabs.map(s => {
          const count = s ? tickets.filter(t => t.status === s).length : tickets.length;
          const cfg = s ? statusConfig[s] : null;
          return (
            <motion.button
              key={s}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setFilter(s)}
              className="px-4 py-2 text-sm font-semibold rounded-xl transition-all"
              style={filter === s ? {
                background: cfg ? cfg.glassColor : 'rgba(139,92,246,0.2)',
                border: `1px solid ${cfg ? cfg.glow : 'rgba(139,92,246,0.4)'}`,
                color: cfg ? cfg.color.replace('text-', '#').replace('300', '4bf') : '#a78bfa',
                boxShadow: cfg ? `0 0 12px ${cfg.glow}` : '0 0 12px rgba(139,92,246,0.2)',
              } : {
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: '#64748b',
              }}
            >
              {s ? s.replace('_', ' ') : 'All'} <span className="opacity-50 ml-1">({count})</span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Tickets List */}
      <div className="space-y-3">
        {filtered.map((ticket, i) => {
          const pCfg = priorityConfig[ticket.priority] || priorityConfig.LOW;
          const sCfg = statusConfig[ticket.status] || statusConfig.OPEN;
          return (
            <motion.div key={ticket.id} custom={i} variants={scrollRevealVariants} initial="hidden" animate="visible">
              <LiquidGlassCard depth={2}>
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Priority icon with emotional glow */}
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${pCfg.pulse ? 'animate-pulse-glow' : ''}`}
                        style={{ background: pCfg.glassColor, border: `1px solid ${pCfg.glow}`, boxShadow: `0 0 12px ${pCfg.glow}` }}
                      >
                        {ticket.priority === 'CRITICAL' || ticket.priority === 'HIGH'
                          ? <AlertTriangle className={`w-4.5 h-4.5 ${pCfg.color}`} />
                          : <Activity className={`w-4.5 h-4.5 ${pCfg.color}`} />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Link to={`/tickets/${ticket.id}`} className="font-bold text-white hover:text-violet-300 transition-colors text-sm">
                            {ticket.title}
                          </Link>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full" style={{ background: pCfg.glassColor, border: `1px solid ${pCfg.glow}`, color: 'white' }}>
                            {ticket.priority}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full" style={{ background: sCfg.glassColor, border: `1px solid ${sCfg.glow}`, color: 'white' }}>
                            {ticket.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">{ticket.description}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500 font-medium">
                          <span>{ticket.category}</span>
                          <span>·</span>
                          <span>{ticket.location}</span>
                          <span>·</span>
                          <span>by {ticket.reportedByName}</span>
                          {ticket.assignedToName && (
                            <span className="flex items-center gap-1 text-violet-400">
                              <UserIcon className="w-3 h-3" /> {ticket.assignedToName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Link to={`/tickets/${ticket.id}`}>
                        <NeuButton size="sm" variant="secondary" icon={<ArrowRight className="w-3 h-3" />} iconPosition="right">
                          View
                        </NeuButton>
                      </Link>
                      {isAdmin && !ticket.assignedTo && ticket.status === 'OPEN' && (
                        <NeuButton size="sm" variant="ghost" onClick={() => setAssignModal(ticket.id)}>Assign</NeuButton>
                      )}
                      {(isAdmin || isTechnician) && ['OPEN', 'IN_PROGRESS'].includes(ticket.status) && (
                        <NeuButton size="sm" variant="ghost" onClick={() => { setStatusModal({ id: ticket.id, currentStatus: ticket.status }); setNewStatus(''); }}>
                          Update
                        </NeuButton>
                      )}
                    </div>
                  </div>
                </div>
              </LiquidGlassCard>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <TicketIcon className="w-12 h-12 mx-auto mb-3 text-slate-700" />
          <p className="text-slate-400 font-semibold">No tickets found</p>
        </div>
      )}

      {/* Assign Modal */}
      <AnimatePresence>
        {assignModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={() => setAssignModal(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              className="w-full max-w-md rounded-3xl p-6" style={glassModal}
              onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-white mb-5">Assign Technician</h3>
              <select value={selectedTech} onChange={e => setSelectedTech(e.target.value)} className="glass-select w-full px-4 py-3 rounded-xl text-sm mb-5">
                <option value="">Select technician</option>
                {technicians.map(t => <option key={t.id} value={t.id}>{t.name} ({t.email})</option>)}
              </select>
              <div className="flex gap-3">
                <NeuButton onClick={handleAssign} loading={actionLoading} disabled={!selectedTech} variant="primary" fullWidth>Assign</NeuButton>
                <NeuButton onClick={() => setAssignModal(null)} variant="ghost">Cancel</NeuButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Modal */}
      <AnimatePresence>
        {statusModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={() => setStatusModal(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              className="w-full max-w-md rounded-3xl p-6" style={glassModal}
              onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-white mb-5">Update Ticket Status</h3>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="glass-select w-full px-4 py-3 rounded-xl text-sm mb-5">
                <option value="">Select new status</option>
                {statusModal.currentStatus === 'OPEN' && <option value="IN_PROGRESS">In Progress</option>}
                {['OPEN', 'IN_PROGRESS'].includes(statusModal.currentStatus) && <option value="RESOLVED">Resolved</option>}
                {statusModal.currentStatus === 'RESOLVED' && <option value="CLOSED">Closed</option>}
                {isAdmin && <option value="REJECTED">Rejected</option>}
              </select>
              {newStatus === 'RESOLVED' && (
                <textarea value={resolutionNotes} onChange={e => setResolutionNotes(e.target.value)}
                  rows={3} className="glass-input w-full px-4 py-3 rounded-xl text-sm resize-none mb-5"
                  placeholder="Resolution notes…" />
              )}
              {newStatus === 'REJECTED' && (
                <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                  rows={3} className="glass-input w-full px-4 py-3 rounded-xl text-sm resize-none mb-5"
                  placeholder="Rejection reason…" />
              )}
              <div className="flex gap-3">
                <NeuButton onClick={handleStatusUpdate} loading={actionLoading} disabled={!newStatus} variant="primary" fullWidth>Update Status</NeuButton>
                <NeuButton onClick={() => setStatusModal(null)} variant="ghost">Cancel</NeuButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

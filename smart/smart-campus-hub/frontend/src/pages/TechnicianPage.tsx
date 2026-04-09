import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { ticketApi } from '@/lib/api';
import type { Ticket } from '@/lib/types';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Settings as Tool, 
  Hammer, 
  ClipboardList, 
  AlertTriangle,
  ExternalLink,
  X
} from 'lucide-react';
import LiquidGlassCard from '@/components/LiquidGlassCard';
import NeuButton from '@/components/NeuButton';
import { containerVariants, itemVariants } from '@/lib/animations';
import { Link } from 'react-router-dom';

const priorityConfig: Record<string, { color: string; glow: string; glassColor: string; bg: string }> = {
  CRITICAL: { color: 'text-rose-300', glow: 'rgba(244,63,94,0.5)', glassColor: 'rgba(244,63,94,0.15)', bg: 'bg-rose-500/20' },
  HIGH: { color: 'text-orange-300', glow: 'rgba(249,115,22,0.4)', glassColor: 'rgba(249,115,22,0.12)', bg: 'bg-orange-500/20' },
  MEDIUM: { color: 'text-amber-300', glow: 'rgba(245,158,11,0.3)', glassColor: 'rgba(245,158,11,0.1)', bg: 'bg-amber-500/20' },
  LOW: { color: 'text-slate-400', glow: 'rgba(148,163,184,0.2)', glassColor: 'rgba(148,163,184,0.08)', bg: 'bg-slate-500/10' },
};

const glassModal = {
  background: 'rgba(20, 10, 50, 0.95)',
  backdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.1)',
  boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
};

export default function TechnicianPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [view, setView] = useState<'assigned' | 'all'>('assigned');
  const [dateFilter, setDateFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0
  });

  const [rejectionReason, setRejectionReason] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [statusModal, setStatusModal] = useState<{ id: string; currentStatus: string } | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [assignedRes, allRes] = await Promise.all([
        ticketApi.getAssigned(),
        ticketApi.getAll()
      ]);
      
      const assignedTickets = assignedRes.data;
      const globalTickets = allRes.data;
      
      setTickets(assignedTickets);
      setAllTickets(globalTickets);
      
      setStats({
        total: assignedTickets.length,
        open: assignedTickets.filter((t: Ticket) => t.status === 'OPEN').length,
        inProgress: assignedTickets.filter((t: Ticket) => t.status === 'IN_PROGRESS').length,
        resolved: assignedTickets.filter((t: Ticket) => t.status === 'RESOLVED' || t.status === 'CLOSED').length
      });
    } catch (error) {
      console.error('Failed to fetch technician data', error);
    } finally {
      setLoading(false);
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
      fetchAllData();
    } catch (error) {
      alert('Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
        <p className="text-sm text-slate-500 font-medium animate-pulse">Loading assigned tasks...</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            Technician <span className="text-gradient-amber">Console</span>
          </h1>
          <p className="text-slate-400 mt-2">Managing maintenance operations for {user?.name}</p>
        </div>
        <div className="flex gap-2">
            <Link to="/tickets">
                <NeuButton variant="secondary" size="sm" icon={<ClipboardList className="w-4 h-4 text-amber-400" />}>
                    Ticketing System
                </NeuButton>
            </Link>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Assigned', value: stats.total, icon: ClipboardList, color: 'text-blue-400', glow: 'rgba(59,130,246,0.3)' },
          { label: 'Open', value: stats.open, icon: AlertCircle, color: 'text-rose-400', glow: 'rgba(244,63,94,0.3)' },
          { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'text-amber-400', glow: 'rgba(245,158,11,0.3)' },
          { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, color: 'text-emerald-400', glow: 'rgba(16,185,129,0.3)' },
        ].map((stat) => (
          <LiquidGlassCard key={stat.label} glow={stat.glow} depth={1}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{stat.label}</p>
                <p className="text-3xl font-black text-white mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl bg-white/5 border border-white/10 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </LiquidGlassCard>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Task List */}
        <div className="lg:col-span-2 space-y-4">
          <motion.div variants={itemVariants} className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Tool className="w-5 h-5 text-amber-400" />
              {view === 'assigned' ? 'Active Assignments' : 'Global Ticket Feed'}
            </h2>
            <div className="flex bg-slate-800/50 p-1 rounded-xl border border-white/5 backdrop-blur-md">
              <button 
                onClick={() => setView('assigned')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                  view === 'assigned' 
                    ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/30' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Assigned
              </button>
              <button 
                onClick={() => setView('all')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                  view === 'all' 
                    ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/30' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Global
              </button>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div variants={itemVariants} className="flex flex-wrap gap-4 items-center mb-6">
            <div className="flex-1 min-w-[200px]">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Filter by Date</label>
              <input 
                type="date" 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="glass-input w-full px-4 py-2 rounded-xl text-sm"
              />
            </div>
            <div className="w-full sm:w-48">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Priority</label>
              <select 
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="glass-select w-full px-4 py-2 rounded-xl text-sm"
              >
                <option value="">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div className="flex items-end h-full pt-5">
              {(dateFilter || priorityFilter) && (
                <button 
                  onClick={() => { setDateFilter(''); setPriorityFilter(''); }}
                  className="text-xs text-rose-400 hover:text-rose-300 font-bold transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </motion.div>

          {((view === 'assigned' ? tickets : allTickets)
            .filter(t => {
              const matchesDate = !dateFilter || t.createdAt.startsWith(dateFilter);
              const matchesPriority = !priorityFilter || t.priority === priorityFilter;
              const matchesVisibility = view === 'all' || (t.status !== 'RESOLVED' && t.status !== 'CLOSED');
              return matchesDate && matchesPriority && matchesVisibility;
            }).length === 0) ? (
            <LiquidGlassCard glow="rgba(255,255,255,0.05)">
              <div className="p-12 text-center text-slate-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No tickets found matching your criteria.</p>
              </div>
            </LiquidGlassCard>
          ) : (
            <div className="space-y-4">
              {(view === 'assigned' ? tickets : allTickets)
                .filter(t => {
                  const matchesDate = !dateFilter || t.createdAt.startsWith(dateFilter);
                  const matchesPriority = !priorityFilter || t.priority === priorityFilter;
                  const matchesVisibility = view === 'all' || (t.status !== 'RESOLVED' && t.status !== 'CLOSED');
                  return matchesDate && matchesPriority && matchesVisibility;
                })
                .map((ticket) => (
                  <motion.div key={ticket.id} variants={itemVariants}>
                    <LiquidGlassCard glow={priorityConfig[ticket.priority]?.glow || 'rgba(255,255,255,0.1)'}>
                      <div className="p-1 flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${priorityConfig[ticket.priority]?.bg} ${priorityConfig[ticket.priority]?.color}`}>
                              {ticket.priority}
                            </span>
                            <span className="text-slate-500 text-xs font-medium">#{ticket.id.slice(0, 8)}</span>
                          </div>
                          <h3 className="text-lg font-bold text-white mb-1">{ticket.title}</h3>
                          <p className="text-slate-400 text-sm line-clamp-2 mb-4">{ticket.description}</p>
                          
                          <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                              <span className="w-2 h-2 rounded-full bg-amber-400" />
                              {ticket.category || 'Maintenance'}
                            </div>
                            {ticket.assignedTo && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-400 italic">
                                👤 Assigned to: {ticket.assignedToName || 'Technician'}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col justify-between sm:items-end gap-3 min-w-[140px]">
                          <div className={`px-3 py-1 rounded-lg text-xs font-bold w-fit sm:w-auto ${
                             ticket.status === 'OPEN' ? 'bg-blue-500/10 text-blue-400' : 
                             ticket.status === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-400' :
                             'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {ticket.status}
                          </div>
                          
                          <div className="flex gap-2">
                            <Link to={`/tickets/${ticket.id}`} className="flex-1 sm:flex-none">
                              <NeuButton variant="secondary" size="sm" fullWidth>
                                Details
                              </NeuButton>
                            </Link>
                            {view === 'assigned' && (
                              ticket.status === 'OPEN' ? (
                                <NeuButton 
                                  variant="primary" 
                                  size="sm" 
                                  onClick={() => { setStatusModal({ id: ticket.id, currentStatus: ticket.status }); setNewStatus('IN_PROGRESS'); }}
                                  className="bg-amber-500 hover:bg-amber-600 border-amber-400/50"
                                >
                                  Start
                                </NeuButton>
                              ) : (
                                <NeuButton 
                                  variant="primary" 
                                  size="sm" 
                                  onClick={() => { setStatusModal({ id: ticket.id, currentStatus: ticket.status }); setNewStatus('RESOLVED'); }}
                                  className="bg-emerald-500 hover:bg-emerald-600 border-emerald-400/50"
                                >
                                  Resolve
                                </NeuButton>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </LiquidGlassCard>
                  </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <motion.div variants={itemVariants}>
            <LiquidGlassCard glow="rgba(139,92,246,0.2)">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                Urgent Notice
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                Critical priority tickets require immediate assessment. Please update status to "In Progress" once you arrive at the location.
              </p>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 underline">Safety First Protocols</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 underline">Equipment Checkout</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </div>
              </div>
            </LiquidGlassCard>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20">
                <Hammer className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Task Tips</h3>
              <ul className="space-y-3">
                {[
                  'Document issues with comments',
                  'Verify completion with user',
                  'Keep your inventory updated',
                  'Report safety hazards immediately'
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </div>

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
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold text-white">Update Status</h3>
                <button onClick={() => setStatusModal(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">New Status</label>
                  <select 
                    value={newStatus} 
                    onChange={e => setNewStatus(e.target.value)} 
                    className="glass-select w-full px-4 py-3 rounded-xl text-sm"
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>

                {(newStatus === 'RESOLVED' || newStatus === 'CLOSED') && (
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Resolution Notes</label>
                    <textarea 
                      value={resolutionNotes} 
                      onChange={e => setResolutionNotes(e.target.value)}
                      rows={4} 
                      className="glass-input w-full px-4 py-3 rounded-xl text-sm resize-none"
                      placeholder="Describe how the issue was resolved..." 
                    />
                  </div>
                )}

                <div className="pt-2 flex gap-3">
                  <NeuButton 
                    onClick={handleStatusUpdate} 
                    loading={actionLoading} 
                    disabled={!newStatus} 
                    variant="primary" 
                    fullWidth
                    className="bg-amber-500 hover:bg-amber-600 border-amber-400/50"
                  >
                    Confirm Update
                  </NeuButton>
                  <NeuButton onClick={() => setStatusModal(null)} variant="ghost">Cancel</NeuButton>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

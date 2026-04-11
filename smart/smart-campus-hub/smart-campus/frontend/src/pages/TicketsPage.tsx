import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { ticketApi, authApi } from '@/lib/api';
import type { Ticket, User } from '@/lib/types';
import { Ticket as TicketIcon, Plus, AlertTriangle, Activity, User as UserIcon, ArrowRight, Search, Calendar, MapPin, Tag, Trash2 } from 'lucide-react';
import LiquidGlassCard from '@/components/LiquidGlassCard';
import NeuButton from '@/components/NeuButton';
import { containerVariants, itemVariants, scrollRevealVariants } from '@/lib/animations';
import { getTicketSlaSummary } from '@/lib/ticketSla';

const priorityConfig: Record<string, { color: string; glow: string; glassColor: string; pulse: boolean }> = {
  CRITICAL: { color: 'text-rose-300', glow: 'rgba(244,63,94,0.5)', glassColor: 'rgba(244,63,94,0.15)', pulse: true },
  HIGH: { color: 'text-orange-300', glow: 'rgba(249,115,22,0.4)', glassColor: 'rgba(249,115,22,0.12)', pulse: true },
  MEDIUM: { color: 'text-amber-300', glow: 'rgba(245,158,11,0.3)', glassColor: 'rgba(245,158,11,0.1)', pulse: false },
  LOW: { color: 'text-slate-400', glow: 'rgba(148,163,184,0.2)', glassColor: 'rgba(148,163,184,0.08)', pulse: false },
};

const statusConfig: Record<string, { color: string; glassColor: string; glow: string }> = {
  OPEN: { color: 'text-blue-300', glassColor: 'rgba(59,130,246,0.1)', glow: 'rgba(59,130,246,0.2)' },
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
  const { user: currentUser, isAdmin, isTechnician, isManager, isSuperAdmin } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [assignedRoleFilter, setAssignedRoleFilter] = useState('');

  const [assignModal, setAssignModal] = useState<string | null>(null);
  const [statusModal, setStatusModal] = useState<{ id: string; currentStatus: string } | null>(null);
  const [selectedTech, setSelectedTech] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchTickets();
    if (isAdmin || isManager || isTechnician || isSuperAdmin) {
      authApi.getUsers().then(res => setUsers(res.data)).catch(() => {});
    }
  }, [isAdmin, isTechnician, isManager, isSuperAdmin]);

  const fetchTickets = async () => {
    try {
      const res = (isAdmin || isTechnician || isManager || isSuperAdmin) ? await ticketApi.getAll() : await ticketApi.getMy();
      // Ensure we sort by most recent or specific priority if needed
      setTickets(res.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const syncWorkflow = async (ticketId: string, targetStatus: string) => {
    // Helper to automate the workflow: OPEN -> IN_PROGRESS -> RESOLVED -> CLOSED
    try {
      await ticketApi.updateStatus(ticketId, targetStatus, "System workflow sync", "");
      fetchTickets();
    } catch (err: any) {
      console.warn(`Workflow sync issue: ${err.response?.data?.message || 'Unauthorized'}`);
    }
  };

  const unused = syncWorkflow; // Prevent build errors until used in bulk actions

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
    
    // Validation
    if ((newStatus === 'RESOLVED' || (newStatus === 'CLOSED' && statusModal.currentStatus === 'IN_PROGRESS')) && !resolutionNotes.trim()) {
      alert('Please provide resolution notes before completing work.');
      return;
    }
    if (newStatus === 'REJECTED' && !rejectionReason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }

    setActionLoading(true);
    try {
      await ticketApi.updateStatus(statusModal.id, newStatus, resolutionNotes, rejectionReason);
      setStatusModal(null); setNewStatus(''); setResolutionNotes(''); setRejectionReason(''); fetchTickets();
    } catch (err: any) { 
      alert(err.response?.data?.message || 'Failed to update status'); 
    } finally { setActionLoading(false); }
  };

  const filtered = tickets.filter(t => {
    const matchesStatus = !filter || t.status === filter;
    
    // Staff logic: If user is ONLY a technician/manager (and NOT an admin), they only see assigned tickets.
    // However, for the UI display, we check the actual role list from the user object.
    const userRoleList = currentUser?.roles || [];
    const isStrictStaff = (userRoleList.includes('TECHNICIAN') || userRoleList.includes('MANAGER')) && 
                         !(userRoleList.includes('ADMIN') || userRoleList.includes('SUPER_ADMIN'));
    
    const matchesAssignment = isStrictStaff ? t.assignedTo === currentUser?.id : true;
    const matchesSearch = !searchQuery || 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = !dateFilter || (t.createdAt && t.createdAt.startsWith(dateFilter));
    const matchesLocation = !locationFilter || (t.location && t.location.toLowerCase().includes(locationFilter.toLowerCase()));
    const matchesCategory = !categoryFilter || t.category === categoryFilter;

    const matchesRole = !assignedRoleFilter || (t.assignedToName && t.assignedToName.toLowerCase().includes(assignedRoleFilter.toLowerCase()));

    return matchesStatus && matchesAssignment && matchesSearch && matchesDate && matchesLocation && matchesCategory && matchesRole;
  });

  const technicians = users.filter(u => u.roles?.some(r => ['TECHNICIAN', 'ADMIN', 'SUPER_ADMIN', 'MANAGER'].includes(r)));
  const filterTabs = ['', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];
  const categories = Array.from(new Set(tickets.map(t => t.category))).filter(Boolean);

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
            {(isAdmin || isManager || isTechnician || isSuperAdmin) ? 'Manage and track campus tickets' : 'Report and track issues'}
          </p>
        </div>
        <Link to="/tickets/new">
          <NeuButton variant="primary" size="md" icon={<Plus className="w-4 h-4" />} iconPosition="left">
            New Ticket
          </NeuButton>
        </Link>
      </motion.div>

      <motion.div variants={itemVariants} className={`grid grid-cols-1 md:grid-cols-2 ${(isAdmin || isSuperAdmin) ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-3`}>
        <div className="relative group/search">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 transition-colors group-focus-within/search:text-violet-400" />
          <input
            type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search tickets..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-600 focus:border-violet-500/50 outline-none transition-all"
          />
        </div>
        {(isAdmin || isSuperAdmin) && (
          <div className="relative group/role">
            <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 transition-colors group-focus-within/role:text-violet-400" />
            <input
              type="text" value={assignedRoleFilter} onChange={e => setAssignedRoleFilter(e.target.value)}
              placeholder="Filter by staff name..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-600 focus:border-violet-500/50 outline-none transition-all"
            />
          </div>
        )}
        <div className="relative group/loc">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 transition-colors group-focus-within/loc:text-violet-400" />
          <input
            type="text" value={locationFilter} onChange={e => setLocationFilter(e.target.value)}
            placeholder="Filter by location..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-600 focus:border-violet-500/50 outline-none transition-all"
          />
        </div>
        <div className="relative group/date">
          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within/date:text-violet-400" />
          <input
            type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-violet-500/50 [color-scheme:dark]"
          />
        </div>
        <div className="relative group/cat">
          <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within/cat:text-violet-400" />
          <select 
            value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white appearance-none outline-none focus:border-violet-500/50"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
        {filterTabs.map(s => {
          const count = s ? tickets.filter(t => t.status === s).length : tickets.length;
          const cfg = (s && statusConfig[s]) ? statusConfig[s] : null;
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

      <div className="space-y-3">
        {filtered.map((ticket, i) => {
          const pCfg = priorityConfig[ticket.priority] || priorityConfig.LOW;
          const sCfg = statusConfig[ticket.status] || statusConfig.OPEN;
          const sla = getTicketSlaSummary(ticket);
          const dateStr = ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : '';
          
          return (
            <motion.div key={ticket.id} custom={i} variants={scrollRevealVariants} initial="hidden" animate="visible">
              <LiquidGlassCard depth={2}>
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
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
                          <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {ticket.category}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {ticket.location}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1 font-bold text-slate-300">
                             {dateStr}
                          </span>
                          <span>·</span>
                          <span className="text-slate-400">by {ticket.reportedByName}</span>
                          <span>·</span>
                          <span className={
                            sla.tone === 'bad' ? 'text-rose-400' :
                            sla.tone === 'good' ? 'text-emerald-400' :
                            sla.tone === 'warning' ? 'text-amber-400' : 'text-slate-500'
                          }>
                            SLA: {sla.label}
                          </span>
                          {(isAdmin || isSuperAdmin) && ticket.assignedTo && (
                            <span className="flex items-center gap-1 text-violet-400/80 bg-violet-400/5 px-2 py-0.5 rounded-lg border border-violet-400/10">
                              <UserIcon className="w-3 h-3" /> {ticket.assignedToName}
                            </span>
                          )}
                          {(ticket.reportedBy === currentUser?.id || isAdmin || isSuperAdmin) && (
                            <>
                              <span>·</span>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  if (confirm('Are you sure you want to delete this ticket?')) {
                                    try {
                                      await ticketApi.delete(ticket.id);
                                      setTickets(prev => prev.filter(t => t.id !== ticket.id));
                                    } catch { alert('Failed to delete ticket'); }
                                  }
                                }}
                                className="flex items-center gap-1 text-rose-400 hover:text-rose-300 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" /> Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0 min-w-[80px]">
                      <Link to={`/tickets/${ticket.id}`} className="w-full">
                        <NeuButton size="sm" variant="secondary" icon={<ArrowRight className="w-3 h-3" />} iconPosition="right" fullWidth>
                          View
                        </NeuButton>
                      </Link>
                      {(isAdmin || isManager || isTechnician || isSuperAdmin) && !ticket.assignedTo && ticket.status === 'OPEN' && (
                        <NeuButton size="sm" variant="ghost" onClick={() => setAssignModal(ticket.id)} fullWidth>Assign</NeuButton>
                      )}
                      {(isAdmin || isTechnician || isManager || isSuperAdmin) && ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'].includes(ticket.status) && (
                        <NeuButton size="sm" variant="ghost" onClick={() => { setStatusModal({ id: ticket.id, currentStatus: ticket.status }); setNewStatus(''); }} fullWidth>
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
                {technicians.map(tech => (
                  <option key={tech.id} value={tech.id}>{tech.name} ({tech.roles?.join(', ')})</option>
                ))}
              </select>
              <div className="flex gap-3">
                <NeuButton onClick={() => setAssignModal(null)} variant="ghost" className="flex-1">Cancel</NeuButton>
                <NeuButton onClick={handleAssign} variant="primary" className="flex-1" loading={actionLoading}>Confirm</NeuButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <h3 className="text-xl font-bold text-white mb-5">Update Status</h3>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="glass-select w-full px-4 py-3 rounded-xl text-sm mb-5">
                <option value="">Choose new status</option>
                {statusModal.currentStatus === 'OPEN' && (
                  <>
                    <option value="IN_PROGRESS">Accept & Start (IN PROGRESS)</option>
                    {(isAdmin || isSuperAdmin) && <option value="REJECTED">Reject Ticket</option>}
                    {(isAdmin || isSuperAdmin) && <option value="CLOSED">Direct Close</option>}
                  </>
                )}
                {statusModal.currentStatus === 'IN_PROGRESS' && (
                  <>
                    <option value="RESOLVED">Mark as Resolved (Complete Work)</option>
                    {(isAdmin || isSuperAdmin) && <option value="REJECTED">Reject/Cancel Ticket</option>}
                    {(isAdmin || isSuperAdmin) && <option value="CLOSED">Force Close</option>}
                  </>
                )}
                {statusModal.currentStatus === 'RESOLVED' && (
                  <>
                    <option value="CLOSED">Final Close (Verify & Archive)</option>
                    {(isAdmin || isSuperAdmin) && <option value="REJECTED">Reject/Undo Resolution</option>}
                  </>
                )}
                {statusModal.currentStatus === 'CLOSED' && (isAdmin || isSuperAdmin) && (
                  <>
                    <option value="OPEN">Re-open (Return to Queue)</option>
                    <option value="REJECTED">Mark as Rejected (Post-Close)</option>
                  </>
                )}
                {statusModal.currentStatus === 'REJECTED' && (
                  <>
                    <option value="OPEN">Re-open (Return to Queue)</option>
                    {(isAdmin || isSuperAdmin) && <option value="CLOSED">Archive/Close</option>}
                  </>
                )}
              </select>

              {(newStatus === 'RESOLVED' || (newStatus === 'CLOSED' && statusModal.currentStatus === 'IN_PROGRESS')) && (
                <div className="space-y-2 mb-5">
                  <label className="text-xs font-semibold text-slate-400 ml-1">Resolution Notes *</label>
                  <textarea
                    value={resolutionNotes} onChange={e => setResolutionNotes(e.target.value)}
                    placeholder="Describe the solution or work performed..."
                    className="glass-select w-full px-4 py-3 rounded-xl text-sm min-h-[100px]"
                    required
                  />
                </div>
              )}

              {newStatus === 'REJECTED' && (
                <div className="space-y-2 mb-5">
                  <label className="text-xs font-semibold text-slate-400 ml-1">Rejection Reason *</label>
                  <textarea
                    value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                    placeholder="Why is this ticket being rejected?"
                    className="glass-select w-full px-4 py-3 rounded-xl text-sm min-h-[100px]"
                    required
                  />
                </div>
              )}

              <div className="flex gap-3">
                <NeuButton onClick={() => setStatusModal(null)} variant="ghost" className="flex-1">Cancel</NeuButton>
                <NeuButton onClick={handleStatusUpdate} variant="primary" className="flex-1" loading={actionLoading}>Update</NeuButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  ExternalLink
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

export default function TechnicianPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0
  });

  useEffect(() => {
    fetchAssignedTickets();
  }, []);

  const fetchAssignedTickets = async () => {
    setLoading(true);
    try {
      const res = await ticketApi.getAssigned();
      const assignedTickets = res.data;
      setTickets(assignedTickets);
      
      setStats({
        total: assignedTickets.length,
        open: assignedTickets.filter((t: Ticket) => t.status === 'OPEN').length,
        inProgress: assignedTickets.filter((t: Ticket) => t.status === 'IN_PROGRESS').length,
        resolved: assignedTickets.filter((t: Ticket) => t.status === 'RESOLVED' || t.status === 'CLOSED').length
      });
    } catch (error) {
      console.error('Failed to fetch assigned tickets', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await ticketApi.updateStatus(id, newStatus, 'Updated via Technician Dashboard', '');
      fetchAssignedTickets();
    } catch (error) {
      alert('Failed to update status');
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
              Active Assignments
            </h2>
          </motion.div>

          {tickets.length === 0 ? (
            <LiquidGlassCard glow="rgba(255,255,255,0.05)">
              <div className="p-12 text-center text-slate-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No active assignments. You're all caught up!</p>
              </div>
            </LiquidGlassCard>
          ) : (
            <div className="space-y-4">
              {tickets.filter(t => t.status !== 'RESOLVED' && t.status !== 'CLOSED').map((ticket) => (
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
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                            {ticket.category || 'Maintenance'}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col justify-between sm:items-end gap-3 min-w-[140px]">
                        <div className={`px-3 py-1 rounded-lg text-xs font-bold ${
                           ticket.status === 'OPEN' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {ticket.status}
                        </div>
                        
                        <div className="flex gap-2">
                          <Link to={`/tickets/${ticket.id}`} className="flex-1 sm:flex-none">
                            <NeuButton variant="secondary" size="sm" fullWidth>
                              Details
                            </NeuButton>
                          </Link>
                          {ticket.status === 'OPEN' ? (
                            <NeuButton 
                              variant="primary" 
                              size="sm" 
                              onClick={() => handleStatusUpdate(ticket.id, 'IN_PROGRESS')}
                              className="bg-amber-500 hover:bg-amber-600 border-amber-400/50"
                            >
                              Start
                            </NeuButton>
                          ) : (
                            <NeuButton 
                              variant="primary" 
                              size="sm" 
                              onClick={() => handleStatusUpdate(ticket.id, 'RESOLVED')}
                              className="bg-emerald-500 hover:bg-emerald-600 border-emerald-400/50"
                            >
                              Resolve
                            </NeuButton>
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
    </motion.div>
  );
}

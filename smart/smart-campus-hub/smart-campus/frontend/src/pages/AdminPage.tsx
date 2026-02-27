import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { authApi, facilityApi, bookingApi, ticketApi } from '@/lib/api';
import type { User, Facility, Booking, Ticket } from '@/lib/types';
import { Shield, Users, Building2, CalendarDays, Ticket as TicketIcon, BarChart3, PieChart } from 'lucide-react';
import LiquidGlassCard from '@/components/LiquidGlassCard';
import NeuButton from '@/components/NeuButton';
import { containerVariants, itemVariants, statCounterVariants, fadeScaleVariants } from '@/lib/animations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell, Legend } from 'recharts';

const glassTooltipStyle = {
  backgroundColor: 'rgba(15,8,40,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: '#e2e8f0',
  fontSize: '12px',
};

export default function AdminPage() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [roleModal, setRoleModal] = useState<{ userId: string; currentRoles: string[] } | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    Promise.all([authApi.getUsers(), facilityApi.getAll(), bookingApi.getAll(), ticketApi.getAll()])
      .then(([ur, fr, br, tr]) => {
        setUsers(ur.data); setFacilities(fr.data); setBookings(br.data); setTickets(tr.data);
      }).catch(() => {}).finally(() => setLoading(false));
  }, [isAdmin]);

  const handleUpdateRoles = async () => {
    if (!roleModal) return;
    try {
      await authApi.updateUserRoles(roleModal.userId, selectedRoles);
      const res = await authApi.getUsers();
      setUsers(res.data); setRoleModal(null);
    } catch { alert('Failed to update roles'); }
  };

  if (!isAdmin) return (
    <div className="text-center py-20">
      <Shield className="w-12 h-12 mx-auto mb-3 text-slate-700" />
      <p className="text-slate-400 font-semibold">Admin access required</p>
    </div>
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
      <p className="text-sm text-slate-500 animate-pulse">Loading admin data…</p>
    </div>
  );

  const bookingStatusData = [
    { name: 'Pending', value: bookings.filter(b => b.status === 'PENDING').length, color: '#f59e0b' },
    { name: 'Approved', value: bookings.filter(b => b.status === 'APPROVED').length, color: '#10b981' },
    { name: 'Rejected', value: bookings.filter(b => b.status === 'REJECTED').length, color: '#f43f5e' },
    { name: 'Cancelled', value: bookings.filter(b => b.status === 'CANCELLED').length, color: '#64748b' },
  ].filter(d => d.value > 0);

  const ticketPriorityData = [
    { name: 'Critical', value: tickets.filter(t => t.priority === 'CRITICAL').length, color: '#f43f5e' },
    { name: 'High', value: tickets.filter(t => t.priority === 'HIGH').length, color: '#f97316' },
    { name: 'Medium', value: tickets.filter(t => t.priority === 'MEDIUM').length, color: '#f59e0b' },
    { name: 'Low', value: tickets.filter(t => t.priority === 'LOW').length, color: '#64748b' },
  ].filter(d => d.value > 0);

  const facilityTypeData = facilities.reduce((acc, f) => {
    const type = f.type.replace(/_/g, ' ');
    const existing = acc.find(a => a.name === type);
    if (existing) existing.value++; else acc.push({ name: type, value: 1 });
    return acc;
  }, [] as { name: string; value: number }[]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
  ];

  const overviewStats = [
    { label: 'Total Users', value: users.length, icon: Users, gradient: 'from-violet-500 to-indigo-500', glow: 'rgba(139,92,246,0.4)' },
    { label: 'Facilities', value: facilities.length, icon: Building2, gradient: 'from-blue-500 to-cyan-500', glow: 'rgba(59,130,246,0.4)' },
    { label: 'Bookings', value: bookings.length, icon: CalendarDays, gradient: 'from-emerald-500 to-teal-500', glow: 'rgba(16,185,129,0.4)' },
    { label: 'Tickets', value: tickets.length, icon: TicketIcon, gradient: 'from-amber-500 to-orange-500', glow: 'rgba(245,158,11,0.4)' },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 pb-8">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-end gap-4">
        <div
          className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center flex-shrink-0"
          style={{ boxShadow: '0 0 20px rgba(139,92,246,0.4)' }}
        >
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin <span className="text-gradient">Panel</span></h1>
          <p className="text-slate-400 text-sm mt-0.5">System overview and management</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants} className="flex gap-1 p-1 rounded-2xl" style={{ background: 'rgba(0,0,0,0.2)' }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 flex-1 justify-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={activeTab === tab.id ? {
                background: 'rgba(139,92,246,0.25)',
                color: '#a78bfa',
                boxShadow: '0 0 12px rgba(139,92,246,0.15)',
              } : { color: '#64748b' }}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </motion.button>
          );
        })}
      </motion.div>

      {/* Overview Tab */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div key="overview" variants={fadeScaleVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {overviewStats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div key={stat.label} custom={i} variants={statCounterVariants} initial="hidden" animate="visible">
                    <LiquidGlassCard glow={stat.glow} depth={2}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-2">{stat.label}</p>
                          <motion.p
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 + i * 0.06, type: 'spring', stiffness: 150 }}
                            className="text-4xl font-extrabold text-white leading-none"
                          >
                            {stat.value}
                          </motion.p>
                        </div>
                        <div
                          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}
                          style={{ boxShadow: `0 0 16px ${stat.glow}` }}
                        >
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </LiquidGlassCard>
                  </motion.div>
                );
              })}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <LiquidGlassCard depth={2}>
                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-5">Facility Types</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={facilityTypeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip contentStyle={glassTooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="value" fill="url(#barGradient)" radius={[6, 6, 0, 0]}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7} />
                        </linearGradient>
                      </defs>
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </LiquidGlassCard>

              <LiquidGlassCard depth={2}>
                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-5">Booking Status</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <RPieChart>
                    <Pie data={bookingStatusData} cx="50%" cy="50%" outerRadius={75} innerRadius={35} dataKey="value" paddingAngle={3}>
                      {bookingStatusData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="rgba(255,255,255,0.05)" strokeWidth={2} />)}
                    </Pie>
                    <Tooltip contentStyle={glassTooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                  </RPieChart>
                </ResponsiveContainer>
              </LiquidGlassCard>
            </div>
          </motion.div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <motion.div key="users" variants={fadeScaleVariants} initial="hidden" animate="visible" exit="exit">
            <LiquidGlassCard className="overflow-hidden" depth={2}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {['User', 'Email', 'Roles', 'Provider', 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => (
                      <motion.tr
                        key={u.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="transition-colors group"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                              style={{ boxShadow: '0 0 8px rgba(139,92,246,0.3)' }}
                            >
                              {u.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <span className="text-sm font-semibold text-white">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-400 font-medium">{u.email}</td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {(u.roles || []).map((role: string) => (
                              <span key={role}
                                className="px-2.5 py-0.5 text-[10px] font-bold rounded-full"
                                style={role === 'ADMIN'
                                  ? { background: 'rgba(139,92,246,0.2)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }
                                  : role === 'TECHNICIAN'
                                  ? { background: 'rgba(245,158,11,0.2)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }
                                  : { background: 'rgba(59,130,246,0.2)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' }
                                }
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-500 font-medium">
                          {(u as unknown as { provider?: string }).provider || 'LOCAL'}
                        </td>
                        <td className="px-4 py-4">
                          <NeuButton size="sm" variant="ghost"
                            onClick={() => { setRoleModal({ userId: u.id, currentRoles: u.roles || [] }); setSelectedRoles([...(u.roles || [])]); }}>
                            Edit Roles
                          </NeuButton>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </LiquidGlassCard>

            {/* Role Modal */}
            <AnimatePresence>
              {roleModal && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4"
                  style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
                  onClick={() => setRoleModal(null)}>
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                    className="w-full max-w-sm rounded-3xl p-6"
                    style={{ background: 'rgba(20,10,50,0.95)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}
                    onClick={e => e.stopPropagation()}
                  >
                    <h3 className="text-xl font-bold text-white mb-5">Edit User Roles</h3>
                    <div className="space-y-3 mb-6">
                      {['USER', 'ADMIN', 'TECHNICIAN', 'MANAGER'].map(role => {
                        const checked = selectedRoles.includes(role);
                        return (
                          <label key={role} className="flex items-center gap-3 cursor-pointer p-3 rounded-xl transition-colors"
                            style={{ background: checked ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${checked ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.06)'}` }}>
                            <input type="checkbox" checked={checked}
                              onChange={e => { if (e.target.checked) setSelectedRoles([...selectedRoles, role]); else setSelectedRoles(selectedRoles.filter(r => r !== role)); }}
                              className="w-4 h-4 rounded accent-violet-500" />
                            <span className={`text-sm font-semibold ${checked ? 'text-white' : 'text-slate-400'}`}>{role}</span>
                          </label>
                        );
                      })}
                    </div>
                    <div className="flex gap-3">
                      <NeuButton onClick={handleUpdateRoles} disabled={selectedRoles.length === 0} variant="primary" fullWidth>Update Roles</NeuButton>
                      <NeuButton onClick={() => setRoleModal(null)} variant="ghost">Cancel</NeuButton>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <motion.div key="analytics" variants={fadeScaleVariants} initial="hidden" animate="visible" exit="exit" className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <LiquidGlassCard depth={2}>
                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-5">Ticket Priority</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <RPieChart>
                    <Pie data={ticketPriorityData} cx="50%" cy="50%" outerRadius={75} innerRadius={35} dataKey="value" paddingAngle={3}>
                      {ticketPriorityData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="rgba(255,255,255,0.05)" strokeWidth={2} />)}
                    </Pie>
                    <Tooltip contentStyle={glassTooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                  </RPieChart>
                </ResponsiveContainer>
              </LiquidGlassCard>

              <LiquidGlassCard depth={2}>
                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-5">Quick Stats</h3>
                <div className="space-y-5">
                  {[
                    { label: 'Active Facilities', value: facilities.filter(f => f.status === 'ACTIVE').length, total: facilities.length, color: '#10b981', glow: 'rgba(16,185,129,0.4)' },
                    { label: 'Pending Bookings', value: bookings.filter(b => b.status === 'PENDING').length, total: bookings.length, color: '#f59e0b', glow: 'rgba(245,158,11,0.4)' },
                    { label: 'Open Tickets', value: tickets.filter(t => t.status === 'OPEN').length, total: tickets.length, color: '#3b82f6', glow: 'rgba(59,130,246,0.4)' },
                    { label: 'Critical Tickets', value: tickets.filter(t => t.priority === 'CRITICAL').length, total: tickets.length, color: '#f43f5e', glow: 'rgba(244,63,94,0.4)' },
                  ].map(stat => (
                    <div key={stat.label}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400 font-medium">{stat.label}</span>
                        <span className="font-bold text-white">{stat.value}<span className="text-slate-600">/{stat.total}</span></span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${stat.total > 0 ? (stat.value / stat.total) * 100 : 0}%` }}
                          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ background: `linear-gradient(90deg, ${stat.color}, ${stat.color}aa)`, boxShadow: `0 0 8px ${stat.glow}` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </LiquidGlassCard>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { authApi, facilityApi, bookingApi, ticketApi } from '@/lib/api';
import type { User, Facility, Booking, Ticket } from '@/lib/types';
import { Shield, Users, Building2, CalendarDays, Ticket as TicketIcon, BarChart3, PieChart, ShieldAlert, Trash2, Edit2, CheckCircle, AlertTriangle, X, Search, Filter, Calendar, ArrowRight } from 'lucide-react';
import LiquidGlassCard from '@/components/LiquidGlassCard';
import NeuButton from '@/components/NeuButton';
import { containerVariants, itemVariants, statCounterVariants, fadeScaleVariants } from '@/lib/animations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area } from 'recharts';

const glassTooltipStyle = {
  backgroundColor: 'rgba(15,8,40,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: '#e2e8f0',
  fontSize: '12px',
};

export default function AdminPage() {
  const { user: currentUser, isSuperAdmin, isAdmin, isManager } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [roleModal, setRoleModal] = useState<{ userId: string; currentRoles: string[] } | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketDateFilter, setTicketDateFilter] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('ALL');

  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');

  const [facilitySearch, setFacilitySearch] = useState('');
  const [facilityStatusFilter, setFacilityStatusFilter] = useState('ALL');

  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingDateFilter, setBookingDateFilter] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('ALL');

  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);

  const [actionModal, setActionModal] = useState<{ id: string; action: string } | null>(null);
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin && !isManager) return;
    Promise.all([authApi.getUsers(), facilityApi.getAll(), bookingApi.getAll(), ticketApi.getAll()])
      .then(([ur, fr, br, tr]) => {
        setUsers(ur.data); setFacilities(fr.data); setBookings(br.data); setTickets(tr.data);
      }).catch(() => {}).finally(() => setLoading(false));
  }, [isAdmin, isManager]);

  const handleUpdateRoles = async () => {
    if (!roleModal) return;
    try {
      await authApi.updateUserRoles(roleModal.userId, selectedRoles);
      const res = await authApi.getUsers();
      setUsers(res.data);
      setRoleModal(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update roles');
    }
  };

  const handleBookingAction = async () => {
    if (!actionModal) return;

    if (actionModal.action === 'reject' && !reason.trim()) {
      return;
    }

    setActionLoading(true);
    try {
      if (actionModal.action === 'approve') await bookingApi.approve(actionModal.id);
      else if (actionModal.action === 'reject') await bookingApi.reject(actionModal.id, reason);
      const res = await bookingApi.getAll();
      setBookings(res.data);
      setActionModal(null);
      setReason('');
    } catch {
      alert('Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkDelete = async (type: 'users' | 'facilities' | 'bookings' | 'tickets') => {
    let ids: string[] = [];
    if (type === 'users') ids = selectedUsers;
    else if (type === 'facilities') ids = selectedFacilities;
    else if (type === 'bookings') ids = selectedBookings;
    else if (type === 'tickets') ids = selectedTickets;

    if (ids.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${ids.length} ${type}? This action cannot be undone.`)) return;

    try {
      setLoading(true);
      if (type === 'users') {
        await Promise.allSettled(ids.map(id => authApi.deleteUser(id)));
        setUsers(users.filter(u => !ids.includes(u.id)));
        setSelectedUsers([]);
      } else if (type === 'facilities') {
        await Promise.allSettled(ids.map(id => facilityApi.delete(id)));
        setFacilities(facilities.filter(f => !ids.includes(f.id)));
        setSelectedFacilities([]);
      } else if (type === 'bookings') {
        await bookingApi.bulkDelete(ids);
        setBookings(bookings.filter(b => !ids.includes(b.id)));
        setSelectedBookings([]);
      } else if (type === 'tickets') {
        await Promise.allSettled(ids.map(id => ticketApi.delete(id)));
        setTickets(tickets.filter(t => !ids.includes(t.id)));
        setSelectedTickets([]);
      }
    } catch (err) {
      alert(`Bulk delete failed for some ${type}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTicket = async (id: string, techId: string, techName: string) => {
    try {
      // Optimistically update the UI to show the assignment immediately
      setTickets(prev => prev.map(t => 
        t.id === id ? { ...t, assignedTo: techId, assignedToName: techName, status: 'IN_PROGRESS' } : t
      ));
      setTicketAssignModal(null);
      
      await ticketApi.assign(id, techId, techName);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to assign ticket');
      // Revert if it fails
      refreshData('tickets');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
        alert("You cannot delete your own account.");
        return;
    }
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await authApi.deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  if (!isAdmin && !isManager) return (
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

  // Advanced Analytics Processing
  const bookingTrendData = bookings.reduce((acc, b) => {
    const date = b.date;
    const existing = acc.find(a => a.date === date);
    if (existing) existing.count++; else acc.push({ date, count: 1 });
    return acc;
  }, [] as { date: string; count: number }[]).sort((a,b) => a.date.localeCompare(b.date)).slice(-14);

  const ticketTrendData = tickets.reduce((acc, t) => {
    const date = t.createdAt.split('T')[0];
    const existing = acc.find(a => a.date === date);
    if (existing) existing.count++; else acc.push({ date, count: 1 });
    return acc;
  }, [] as { date: string; count: number }[]).sort((a,b) => a.date.localeCompare(b.date)).slice(-14);

  const facilityUtilizationData = facilities.map(f => {
    const facilityBookings = bookings.filter(b => b.facilityId === f.id && b.status === 'APPROVED').length;
    return { name: f.name, utilization: facilityBookings };
  }).sort((a,b) => b.utilization - a.utilization).slice(0, 5);

  const userEngagementData = users.map(u => {
    const userBookings = bookings.filter(b => b.userId === u.id).length;
    const userTickets = tickets.filter(t => t.userId === u.id).length;
    return { name: u.name, activities: userBookings + userTickets };
  }).sort((a,b) => b.activities - a.activities).slice(0, 5);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'facilities', label: 'Facilities', icon: Building2 },
    { id: 'bookings', label: 'Bookings', icon: CalendarDays },
    { id: 'tickets', label: 'Tickets', icon: TicketIcon },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
  ];

  const overviewStats = [
    { label: 'Total Users', value: users.length, icon: Users, gradient: 'from-violet-500 to-indigo-500', glow: 'rgba(139,92,246,0.4)' },
    { label: 'Facilities', value: facilities.length, icon: Building2, gradient: 'from-blue-500 to-cyan-500', glow: 'rgba(59,130,246,0.4)' },
    { label: 'Bookings', value: bookings.length, icon: CalendarDays, gradient: 'from-emerald-500 to-teal-500', glow: 'rgba(16,185,129,0.4)' },
    { label: 'Tickets', value: tickets.length, icon: TicketIcon, gradient: 'from-amber-500 to-orange-500', glow: 'rgba(245,158,11,0.4)' },
  ];

  return (
    <>
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
          if (tab.id === 'users' && !isSuperAdmin && !isAdmin) return null;
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
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip contentStyle={glassTooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="value" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
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
          <motion.div key="users" variants={fadeScaleVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
              <h3 className="text-lg font-bold text-white">Manage Users</h3>
              
              <div className="flex flex-wrap items-center gap-3">
                {selectedUsers.length > 0 && isSuperAdmin && (
                  <motion.button
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={() => handleBulkDelete('users')}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold hover:bg-rose-500/20 transition-all shadow-[0_4px_12px_rgba(244,63,94,0.1)]"
                  >
                    <Trash2 className="w-4 h-4" /> Delete ({selectedUsers.length})
                  </motion.button>
                )}
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="glass-input pl-9 pr-4 py-2 rounded-xl text-xs w-48 focus:w-64 transition-all"
                  />
                </div>

                {/* Role Filter */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="glass-select pl-9 pr-4 py-2 rounded-xl text-xs font-bold"
                  >
                    <option value="ALL">All Roles</option>
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                    <option value="TECHNICIAN">Technician</option>
                    <option value="MANAGER">Manager</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
              </div>
            </div>

            <LiquidGlassCard className="overflow-hidden" depth={2}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={users.length > 0 && users.every(u => selectedUsers.includes(u.id))}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedUsers(users.map(u => u.id));
                            else setSelectedUsers([]);
                          }}
                          className="w-4 h-4 rounded accent-violet-500 cursor-pointer"
                        />
                      </th>
                      {['User', 'Email', 'Roles', 'Provider', 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users
                      .filter(u => {
                        const matchesSearch = userSearch === '' || 
                          u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                          u.email.toLowerCase().includes(userSearch.toLowerCase());
                        const matchesRole = userRoleFilter === 'ALL' || (u.roles || []).includes(userRoleFilter);
                        return matchesSearch && matchesRole;
                      })
                      .map((u, i) => (
                      <motion.tr
                        key={u.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className={`transition-colors group ${selectedUsers.includes(u.id) ? 'bg-violet-500/5' : ''}`}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(u.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedUsers([...selectedUsers, u.id]);
                              else setSelectedUsers(selectedUsers.filter(id => id !== u.id));
                            }}
                            className="w-4 h-4 rounded accent-violet-500 cursor-pointer"
                          />
                        </td>
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
                                style={role === 'SUPER_ADMIN'
                                  ? { background: 'rgba(255,107,107,0.2)', color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.3)' }
                                  : role === 'ADMIN'
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
                          <div className="flex items-center gap-2">
                            {isSuperAdmin && (
                              <>
                                <button
                                  onClick={() => { setRoleModal({ userId: u.id, currentRoles: u.roles || [] }); setSelectedRoles([...(u.roles || [])]); }}
                                  className="p-2 rounded-lg text-amber-400 hover:bg-amber-400/10 transition-colors"
                                  title="Edit Roles"
                                >
                                  <ShieldAlert className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="p-2 rounded-lg text-rose-400 hover:bg-rose-400/10 transition-colors"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {!isSuperAdmin && (
                              <span className="text-xs text-slate-500 italic">No permissions</span>
                            )}
                          </div>
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
                      {['USER', 'ADMIN', 'TECHNICIAN', 'MANAGER', 'SUPER_ADMIN'].map(role => {
                        const checked = selectedRoles.includes(role);
                        return (
                          <label key={role} className="flex items-center gap-3 cursor-pointer p-3 rounded-xl transition-colors"
                            style={{ background: checked ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${checked ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.06)'}` }}>
                            <input type="checkbox" checked={checked}
                              onChange={e => { if (e.target.checked) setSelectedRoles([...selectedRoles, role]); else setSelectedRoles(selectedRoles.filter(r => r !== role)); }}
                              className="w-4 h-4 rounded accent-violet-500" />
                            <span className={`text-sm font-bold ${checked ? 'text-violet-300' : 'text-slate-400'}`}>{role}</span>
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

        {/* Facilities Tab */}
        {activeTab === 'facilities' && (
          <motion.div key="facilities" variants={fadeScaleVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
              <h3 className="text-lg font-bold text-white">Manage Facilities</h3>
              
              <div className="flex flex-wrap items-center gap-3">
                {selectedFacilities.length > 0 && (
                  <motion.button
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={() => handleBulkDelete('facilities')}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold hover:bg-rose-500/20 transition-all shadow-[0_4px_12px_rgba(244,63,94,0.1)]"
                  >
                    <Trash2 className="w-4 h-4" /> Delete ({selectedFacilities.length})
                  </motion.button>
                )}
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search facilities..."
                    value={facilitySearch}
                    onChange={(e) => setFacilitySearch(e.target.value)}
                    className="glass-input pl-9 pr-4 py-2 rounded-xl text-xs w-48 focus:w-64 transition-all"
                  />
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <select
                    value={facilityStatusFilter}
                    onChange={(e) => setFacilityStatusFilter(e.target.value)}
                    className="glass-select pl-9 pr-4 py-2 rounded-xl text-xs font-bold"
                  >
                    <option value="ALL">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                    <option value="OUT_OF_SERVICE">Out of Service</option>
                  </select>
                </div>
                
                <NeuButton size="sm" variant="primary" onClick={() => window.location.href='/admin/facility/new'}>
                  Add Facility
                </NeuButton>
              </div>
            </div>

            <LiquidGlassCard className="overflow-hidden" depth={2}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={facilities.length > 0 && facilities.every(f => selectedFacilities.includes(f.id))}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedFacilities(facilities.map(f => f.id));
                            else setSelectedFacilities([]);
                          }}
                          className="w-4 h-4 rounded accent-violet-500 cursor-pointer"
                        />
                      </th>
                      {['Name', 'Type', 'Status', 'Capacity', 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {facilities
                      .filter(f => {
                        const matchesSearch = facilitySearch === '' || 
                          f.name.toLowerCase().includes(facilitySearch.toLowerCase()) || 
                          f.type.toLowerCase().includes(facilitySearch.toLowerCase());
                        const matchesStatus = facilityStatusFilter === 'ALL' || f.status === facilityStatusFilter;
                        return matchesSearch && matchesStatus;
                      })
                      .map((f, i) => (
                      <motion.tr
                        key={f.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className={`transition-colors group ${selectedFacilities.includes(f.id) ? 'bg-violet-500/5' : ''}`}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedFacilities.includes(f.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedFacilities([...selectedFacilities, f.id]);
                              else setSelectedFacilities(selectedFacilities.filter(id => id !== f.id));
                            }}
                            className="w-4 h-4 rounded accent-violet-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-white">{f.name}</td>
                        <td className="px-4 py-4 text-xs text-slate-400 uppercase tracking-wider">{f.type.replace(/_/g, ' ')}</td>
                        <td className="px-4 py-4">
                          <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                            f.status === 'ACTIVE' 
                              ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' 
                              : 'bg-slate-400/10 text-slate-400 border-slate-400/20'
                          }`}>
                            {f.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-300 font-medium">{f.capacity} ppl</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                             <button 
                                onClick={() => window.location.href=`/admin/facility/edit/${f.id}`}
                                className="p-2 rounded-lg text-violet-400 hover:bg-violet-400/10 transition-colors"
                             >
                                <Edit2 className="w-4 h-4" />
                             </button>
                             <button 
                                onClick={async () => {
                                  if(confirm('Delete facility?')) {
                                    await facilityApi.delete(f.id);
                                    setFacilities(facilities.filter(x => x.id !== f.id));
                                  }
                                }}
                                className="p-2 rounded-lg text-rose-400 hover:bg-rose-400/10 transition-colors"
                             >
                                <Trash2 className="w-4 h-4" />
                             </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </LiquidGlassCard>
          </motion.div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <motion.div key="bookings" variants={fadeScaleVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
              <h3 className="text-lg font-bold text-white">Manage Bookings</h3>
              
              <div className="flex flex-wrap items-center gap-3">
                {selectedBookings.length > 0 && (
                  <motion.button
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={() => handleBulkDelete('bookings')}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold hover:bg-rose-500/20 transition-all shadow-[0_4px_12px_rgba(244,63,94,0.1)]"
                  >
                    <Trash2 className="w-4 h-4" /> Delete ({selectedBookings.length})
                  </motion.button>
                )}
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search bookings..."
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    className="glass-input pl-9 pr-4 py-2 rounded-xl text-xs w-48 focus:w-64 transition-all"
                  />
                </div>

                {/* Date Filter */}
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="date"
                    value={bookingDateFilter}
                    onChange={(e) => setBookingDateFilter(e.target.value)}
                    className="glass-input pl-9 pr-4 py-2 rounded-xl text-xs"
                  />
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <select
                    value={bookingStatusFilter}
                    onChange={(e) => setBookingStatusFilter(e.target.value)}
                    className="glass-select pl-9 pr-4 py-2 rounded-xl text-xs font-bold"
                  >
                    <option value="ALL">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            <LiquidGlassCard className="overflow-hidden" depth={2}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={bookings.length > 0 && bookings.every(b => selectedBookings.includes(b.id))}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedBookings(bookings.map(b => b.id));
                            else setSelectedBookings([]);
                          }}
                          className="w-4 h-4 rounded accent-violet-500 cursor-pointer"
                        />
                      </th>
                      {['User', 'Facility', 'Date', 'Time', 'Status', 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bookings
                      .filter(b => {
                        const matchesSearch = bookingSearch === '' || 
                          b.userName.toLowerCase().includes(bookingSearch.toLowerCase()) || 
                          b.facilityName.toLowerCase().includes(bookingSearch.toLowerCase()) ||
                          (b.purpose && b.purpose.toLowerCase().includes(bookingSearch.toLowerCase()));
                        const matchesDate = bookingDateFilter === '' || b.date === bookingDateFilter;
                        const matchesStatus = bookingStatusFilter === 'ALL' || b.status === bookingStatusFilter;
                        return matchesSearch && matchesDate && matchesStatus;
                      })
                      .map((b, i) => (
                      <motion.tr
                        key={b.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className={`transition-colors group ${selectedBookings.includes(b.id) ? 'bg-violet-500/5' : ''}`}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedBookings.includes(b.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedBookings([...selectedBookings, b.id]);
                              else setSelectedBookings(selectedBookings.filter(id => id !== b.id));
                            }}
                            className="w-4 h-4 rounded accent-violet-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-white">{b.userName}</td>
                        <td className="px-4 py-4 text-sm text-slate-300">{b.facilityName}</td>
                        <td className="px-4 py-4 text-sm text-slate-400">{b.date}</td>
                        <td className="px-4 py-4 text-xs text-slate-400 font-mono">{b.startTime.slice(0,5)} - {b.endTime.slice(0,5)}</td>
                        <td className="px-4 py-4">
                          <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                            b.status === 'APPROVED' ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' :
                            b.status === 'PENDING' ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' :
                            b.status === 'REJECTED' ? 'bg-rose-400/10 text-rose-400 border-rose-400/20' :
                            'bg-slate-400/10 text-slate-400 border-slate-400/20'
                          }`}>
                            {b.status}
                          </span>
                          {b.status === 'REJECTED' && b.rejectionReason && (
                            <p className="mt-2 text-[10px] text-rose-400 font-medium bg-rose-500/10 px-2 py-1 rounded">
                              Reason: {b.rejectionReason}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                             {b.status === 'PENDING' && (
                               <>
                                 <NeuButton size="sm" variant="success" onClick={() => setActionModal({ id: b.id, action: 'approve' })}>
                                   Approve
                                 </NeuButton>
                                 <NeuButton size="sm" variant="danger" onClick={() => setActionModal({ id: b.id, action: 'reject' })}>
                                   Reject
                                 </NeuButton>
                               </>
                             )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </LiquidGlassCard>
          </motion.div>
        )}

        {/* Tickets Tab */}
        {activeTab === 'tickets' && (
          <motion.div key="tickets" variants={fadeScaleVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
              <h3 className="text-lg font-bold text-white">Manage Tickets</h3>
              
              <div className="flex flex-wrap items-center gap-3">
                {selectedTickets.length > 0 && (
                  <motion.button
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={() => handleBulkDelete('tickets')}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold hover:bg-rose-500/20 transition-all shadow-[0_4px_12px_rgba(244,63,94,0.1)]"
                  >
                    <Trash2 className="w-4 h-4" /> Delete ({selectedTickets.length})
                  </motion.button>
                )}
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search tickets..."
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    className="glass-input pl-9 pr-4 py-2 rounded-xl text-xs w-48 focus:w-64 transition-all"
                  />
                </div>

                {/* Date Filter */}
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="date"
                    value={ticketDateFilter}
                    onChange={(e) => setTicketDateFilter(e.target.value)}
                    className="glass-input pl-9 pr-4 py-2 rounded-xl text-xs"
                  />
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <select
                    value={ticketStatusFilter}
                    onChange={(e) => setTicketStatusFilter(e.target.value)}
                    className="glass-select pl-9 pr-4 py-2 rounded-xl text-xs font-bold"
                  >
                    <option value="ALL">All Status</option>
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            <LiquidGlassCard className="overflow-hidden" depth={2}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={tickets.length > 0 && tickets.every(t => selectedTickets.includes(t.id))}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedTickets(tickets.map(t => t.id));
                            else setSelectedTickets([]);
                          }}
                          className="w-4 h-4 rounded accent-violet-500 cursor-pointer"
                        />
                      </th>
                      {['Ticket info', 'User/Reporter', 'Date', 'Priority', 'Status', 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tickets
                      .filter(t => {
                        const matchesSearch = ticketSearch === '' || 
                          t.title.toLowerCase().includes(ticketSearch.toLowerCase()) || 
                          t.description.toLowerCase().includes(ticketSearch.toLowerCase()) ||
                          t.id.slice(0,8).toLowerCase().includes(ticketSearch.toLowerCase());
                        
                        const matchesDate = ticketDateFilter === '' || t.createdAt.startsWith(ticketDateFilter);
                        const matchesStatus = ticketStatusFilter === 'ALL' || t.status === ticketStatusFilter;
                        
                        return matchesSearch && matchesDate && matchesStatus;
                      })
                      .map((t, i) => (
                      <motion.tr
                        key={t.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className={`transition-colors group cursor-pointer hover:bg-white/[0.02] ${selectedTickets.includes(t.id) ? 'bg-violet-500/5' : ''}`}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                        onClick={() => window.location.href=`/tickets/${t.id}`}
                      >
                        <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedTickets.includes(t.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedTickets([...selectedTickets, t.id]);
                              else setSelectedTickets(selectedTickets.filter(id => id !== t.id));
                            }}
                            className="w-4 h-4 rounded accent-violet-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-4 min-w-[200px]">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <TicketIcon className="w-4 h-4 text-violet-400" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white line-clamp-1">{t.title}</p>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-tighter">ID: {t.id.slice(0,8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-xs font-bold text-slate-300">{t.reportedByName || 'Student/Staff'}</p>
                          <p className="text-[10px] text-slate-500 truncate max-w-[120px]">{t.facilityId ? 'Building Resource' : 'Campus Issue'}</p>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-400 font-medium">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-wider ${
                            t.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' :
                            t.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                            t.priority === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-slate-500/20 text-slate-400'
                          }`}>
                            {t.priority}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                            t.status === 'OPEN' ? 'bg-blue-400/10 text-blue-400 border-blue-400/20' :
                            t.status === 'IN_PROGRESS' ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' :
                            t.status === 'RESOLVED' ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' :
                            t.status === 'REJECTED' ? 'bg-rose-400/10 text-rose-400 border-rose-400/20' :
                            'bg-slate-400/10 text-slate-400 border-slate-400/20'
                          }`}>
                            {t.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                             <button 
                                onClick={() => window.location.href=`/tickets/${t.id}`}
                                className="p-2 rounded-lg text-blue-400 hover:bg-blue-400/10 transition-colors"
                                title="Manage Ticket"
                             >
                                <ArrowRight className="w-4 h-4" />
                             </button>
                             <button 
                                onClick={async () => {
                                  if(confirm('Delete ticket permanently?')) {
                                    await ticketApi.delete(t.id);
                                    setTickets(tickets.filter(x => x.id !== t.id));
                                  }
                                }}
                                className="p-2 rounded-lg text-rose-400 hover:bg-rose-400/10 transition-colors"
                                title="Delete Permanently"
                             >
                                <Trash2 className="w-4 h-4" />
                             </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                    {tickets.filter(t => {
                        const matchesSearch = ticketSearch === '' || 
                          t.title.toLowerCase().includes(ticketSearch.toLowerCase()) || 
                          t.id.toLowerCase().includes(ticketSearch.toLowerCase());
                        const matchesDate = ticketDateFilter === '' || t.createdAt.startsWith(ticketDateFilter);
                        const matchesStatus = ticketStatusFilter === 'ALL' || t.status === ticketStatusFilter;
                        return matchesSearch && matchesDate && matchesStatus;
                      }).length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500 text-sm italic font-medium">
                          No tickets match your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </LiquidGlassCard>
          </motion.div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <motion.div key="analytics" variants={fadeScaleVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-white tracking-tight">Advanced System Analytics</h2>
              <div className="px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs font-bold text-violet-400 capitalize">
                Report Generated: {new Date().toLocaleDateString()}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Booking & Ticket Trends */}
              <LiquidGlassCard depth={2}>
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Booking & Incident Trends</h3>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]"></div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Bookings</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]"></div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Incidents</span>
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={bookingTrendData.map((d, i) => ({
                    date: d.date,
                    bookings: d.count,
                    tickets: ticketTrendData.find(t => t.date === d.date)?.count || 0
                  }))}>
                    <defs>
                      <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 9, fill: '#64748b' }} 
                      axisLine={false}
                      tickFormatter={(val) => val.split('-').slice(1).join('/')}
                    />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={glassTooltipStyle} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                    <Area type="monotone" dataKey="bookings" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorBookings)" />
                    <Area type="monotone" dataKey="tickets" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorTickets)" />
                  </AreaChart>
                </ResponsiveContainer>
              </LiquidGlassCard>

              {/* Facility Utilization */}
              <LiquidGlassCard depth={2}>
                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-8">Top Facility Utilization</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={facilityUtilizationData} layout="vertical" margin={{ left: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#e2e8f0', fontWeight: 'bold' }} axisLine={false} tickLine={false} width={120} />
                    <Tooltip contentStyle={glassTooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="utilization" radius={[0, 6, 6, 0]} barSize={20}>
                      {facilityUtilizationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#8b5cf6' : '#6366f1'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </LiquidGlassCard>

              {/* Status Distributions */}
              <LiquidGlassCard depth={2}>
                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-8 text-center">Ticket Priority Distribution</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <RPieChart>
                    <Pie data={ticketPriorityData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" paddingAngle={5}>
                      {ticketPriorityData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="rgba(255,255,255,0.05)" strokeWidth={2} />)}
                    </Pie>
                    <Tooltip contentStyle={glassTooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8', paddingTop: '20px' }} iconType="circle" />
                  </RPieChart>
                </ResponsiveContainer>
              </LiquidGlassCard>

              {/* Key Metrics Summary */}
              <LiquidGlassCard depth={2}>
                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-8">System Health & Engagement</h3>
                <div className="space-y-6">
                  {[
                    { label: 'Resource Availability', value: facilities.filter(f => f.status === 'ACTIVE').length, total: facilities.length, color: '#10b981', glow: 'rgba(16,185,129,0.4)', icon: Building2 },
                    { label: 'Booking Fulfillment', value: bookings.filter(b => b.status === 'APPROVED').length, total: bookings.length, color: '#f59e0b', glow: 'rgba(245,158,11,0.4)', icon: CalendarDays },
                    { label: 'Ticket Resolution Rate', value: tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length, total: tickets.length, color: '#3b82f6', glow: 'rgba(59,130,246,0.4)', icon: TicketIcon },
                    { label: 'Critical Incident Load', value: tickets.filter(t => t.priority === 'CRITICAL').length, total: tickets.filter(t => t.status === 'OPEN').length || 1, color: '#f43f5e', glow: 'rgba(244,63,94,0.4)', icon: AlertTriangle },
                  ].map(stat => {
                    const Icon = stat.icon;
                    return (
                      <div key={stat.label}>
                        <div className="flex justify-between items-center text-sm mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10">
                              <Icon className="w-4 h-4 text-slate-400" />
                            </div>
                            <span className="text-slate-300 font-bold text-xs uppercase tracking-wider">{stat.label}</span>
                          </div>
                          <span className="font-black text-white text-lg">
                            {Math.round((stat.value / (stat.total || 1)) * 100)}%
                            <span className="text-[10px] text-slate-500 ml-1 font-bold">({stat.value}/{stat.total})</span>
                          </span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden bg-white/5 border border-white/5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stat.total > 0 ? (stat.value / stat.total) * 100 : 0}%` }}
                            transition={{ duration: 1, ease: 'circOut' }}
                            className="h-full rounded-full"
                            style={{ 
                              background: `linear-gradient(90deg, ${stat.color}, ${stat.color}99)`, 
                              boxShadow: `0 0 12px ${stat.glow}` 
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </LiquidGlassCard>

              {/* User Engagement (Top Power Users) */}
              <div className="lg:col-span-2">
                <LiquidGlassCard depth={2}>
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                    <Users className="w-5 h-5 text-violet-400" />
                    Top System Contributors (Activity Rank)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {userEngagementData.map((user, idx) => (
                      <motion.div 
                        key={user.name}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center text-center relative overflow-hidden group"
                      >
                        <div className="absolute top-0 right-0 p-2 text-[10px] font-black text-white/10 group-hover:text-violet-500/20 transition-colors">#{idx + 1}</div>
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-black text-white text-lg mb-3 shadow-[0_8px_16px_rgba(139,92,246,0.3)]">
                          {user.name.charAt(0)}
                        </div>
                        <p className="text-sm font-bold text-white truncate w-full">{user.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-tighter">{user.activities} Total Interactions</p>
                      </motion.div>
                    ))}
                  </div>
                </LiquidGlassCard>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
                  onClick={handleBookingAction}
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

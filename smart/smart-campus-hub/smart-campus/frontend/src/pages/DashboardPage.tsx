import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { facilityApi, bookingApi, ticketApi, notificationApi } from '@/lib/api';
import type { Facility, Booking, Ticket } from '@/lib/types';
import { Building2, CalendarDays, Ticket as TicketIcon, Bell, AlertTriangle, ArrowRight, Activity, Sparkles, TrendingUp } from 'lucide-react';
import LiquidGlassCard from '@/components/LiquidGlassCard';
import { containerVariants, itemVariants, statCounterVariants } from '@/lib/animations';

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [facRes, notifRes] = await Promise.all([facilityApi.getAll(), notificationApi.getCount()]);
        setFacilities(facRes.data);
        setUnreadCount(notifRes.data.count);
        try {
          if (isAdmin) {
            const [bookRes, tickRes] = await Promise.all([bookingApi.getAll(), ticketApi.getAll()]);
            setBookings(bookRes.data);
            setTickets(tickRes.data);
          } else {
            const [bookRes, tickRes] = await Promise.all([bookingApi.getMy(), ticketApi.getMy()]);
            setBookings(bookRes.data);
            setTickets(tickRes.data);
          }
        } catch { /* ignore */ }
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin]);

  const pendingBookings = bookings.filter(b => b.status === 'PENDING').length;
  const openTickets = tickets.filter(t => t.status === 'OPEN').length;
  const inProgressTickets = tickets.filter(t => t.status === 'IN_PROGRESS').length;
  const activeFacilities = facilities.filter(f => f.status === 'ACTIVE').length;

  const stats = [
    {
      label: 'Facilities', value: facilities.length,
      sub: `${activeFacilities} active`, icon: Building2,
      gradient: 'from-violet-600 to-indigo-500',
      glow: 'rgba(139,92,246,0.4)', glowSoft: 'rgba(139,92,246,0.15)',
      trend: '+2 this month',
    },
    {
      label: 'Bookings', value: bookings.length,
      sub: `${pendingBookings} pending`, icon: CalendarDays,
      gradient: 'from-blue-500 to-cyan-500',
      glow: 'rgba(59,130,246,0.4)', glowSoft: 'rgba(59,130,246,0.15)',
      trend: '+5 this week',
    },
    {
      label: 'Tickets', value: tickets.length,
      sub: `${openTickets} open`, icon: TicketIcon,
      gradient: 'from-amber-500 to-orange-500',
      glow: 'rgba(245,158,11,0.4)', glowSoft: 'rgba(245,158,11,0.15)',
      trend: `${inProgressTickets} in progress`,
    },
    {
      label: 'Notifications', value: unreadCount,
      sub: 'unread', icon: Bell,
      gradient: 'from-rose-500 to-pink-500',
      glow: 'rgba(244,63,94,0.4)', glowSoft: 'rgba(244,63,94,0.15)',
      trend: 'Last 24h',
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
        <p className="text-sm text-slate-500 font-medium animate-pulse">Loading dashboard…</p>
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
      {/* ─── Header ─── */}
      <motion.div variants={itemVariants} className="pt-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},
            </p>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              {user?.name?.split(' ')[0]}{' '}
              <span className="text-gradient">Hub</span>
            </h1>
            <p className="text-slate-400 mt-2 text-base">Here's a glimpse of your smart campus today.</p>
          </div>
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="hidden sm:flex w-14 h-14 rounded-2xl gradient-primary items-center justify-center flex-shrink-0"
            style={{ boxShadow: '0 0 24px rgba(139,92,246,0.4)' }}
          >
            <TrendingUp className="w-6 h-6 text-white" />
          </motion.div>
        </div>
      </motion.div>

      {/* ─── Stats Grid ─── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              custom={i}
              variants={statCounterVariants}
              initial="hidden"
              animate="visible"
            >
              <LiquidGlassCard glow={stat.glow} depth={2}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-2">{stat.label}</p>
                    <motion.p
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + i * 0.08, type: 'spring', stiffness: 150 }}
                      className="text-4xl font-extrabold text-white leading-none"
                    >
                      {stat.value}
                    </motion.p>
                    <p className="text-xs text-slate-400 mt-2 font-medium">{stat.sub}</p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center flex-shrink-0`}
                    style={{ boxShadow: `0 0 16px ${stat.glow}` }}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div
                  className="mt-4 pt-3 flex items-center gap-1.5 text-xs font-medium text-slate-500"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <Activity className="w-3 h-3" />
                  {stat.trend}
                </div>
              </LiquidGlassCard>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ─── Activity Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <motion.div variants={itemVariants}>
          <LiquidGlassCard className="overflow-hidden" depth={2}>
            <div className="flex items-center justify-between pb-4 mb-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center"
                  style={{ boxShadow: '0 0 12px rgba(59,130,246,0.3)' }}
                >
                  <CalendarDays className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Recent Bookings</h3>
                  <p className="text-xs text-slate-500">{pendingBookings} pending approval</p>
                </div>
              </div>
              <Link
                to="/bookings"
                className="flex items-center gap-1 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-1">
              {bookings.slice(0, 5).map((booking, i) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                  style={{ '&:hover': { background: 'rgba(255,255,255,0.03)' } } as React.CSSProperties}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    booking.status === 'APPROVED' ? 'bg-emerald-400' :
                    booking.status === 'PENDING' ? 'bg-amber-400' :
                    booking.status === 'REJECTED' ? 'bg-rose-400' : 'bg-slate-500'
                  }`}
                  style={{ boxShadow: booking.status === 'APPROVED' ? '0 0 6px rgba(52,211,153,0.6)' : booking.status === 'PENDING' ? '0 0 6px rgba(251,191,36,0.6)' : '' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{booking.facilityName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{booking.date} · {booking.startTime}–{booking.endTime}</p>
                  </div>
                  <span
                    className="px-2.5 py-1 text-[10px] font-semibold rounded-full"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
                  >
                    {booking.status}
                  </span>
                </motion.div>
              ))}
              {bookings.length === 0 && (
                <div className="py-10 text-center">
                  <CalendarDays className="w-8 h-8 mx-auto mb-3 text-slate-600" />
                  <p className="text-sm text-slate-500">No bookings yet</p>
                </div>
              )}
            </div>
          </LiquidGlassCard>
        </motion.div>

        {/* Recent Tickets */}
        <motion.div variants={itemVariants}>
          <LiquidGlassCard className="overflow-hidden" depth={2}>
            <div className="flex items-center justify-between pb-4 mb-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center"
                  style={{ boxShadow: '0 0 12px rgba(245,158,11,0.3)' }}
                >
                  <TicketIcon className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Recent Tickets</h3>
                  <p className="text-xs text-slate-500">{openTickets} open · {inProgressTickets} in progress</p>
                </div>
              </div>
              <Link
                to="/tickets"
                className="flex items-center gap-1 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-1">
              {tickets.slice(0, 5).map((ticket, i) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    ticket.priority === 'CRITICAL' ? 'bg-rose-500/15 text-rose-400' :
                    ticket.priority === 'HIGH' ? 'bg-orange-500/15 text-orange-400' :
                    ticket.priority === 'MEDIUM' ? 'bg-amber-500/15 text-amber-400' : 'bg-slate-500/15 text-slate-400'
                  }`}>
                    {ticket.priority === 'CRITICAL' || ticket.priority === 'HIGH'
                      ? <AlertTriangle className="w-4 h-4" />
                      : <Activity className="w-4 h-4" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{ticket.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{ticket.category} · {ticket.location}</p>
                  </div>
                  <span
                    className="px-2.5 py-1 text-[10px] font-semibold rounded-full whitespace-nowrap"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
                  >
                    {ticket.status.replace('_', ' ')}
                  </span>
                </motion.div>
              ))}
              {tickets.length === 0 && (
                <div className="py-10 text-center">
                  <TicketIcon className="w-8 h-8 mx-auto mb-3 text-slate-600" />
                  <p className="text-sm text-slate-500">No tickets yet</p>
                </div>
              )}
            </div>
          </LiquidGlassCard>
        </motion.div>
      </div>

      {/* ─── Quick Actions ─── */}
      <motion.div variants={itemVariants}>
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { to: '/bookings/new', label: 'Book a Facility', desc: 'Reserve rooms & equipment', gradient: 'from-blue-500 to-cyan-500', glow: 'rgba(59,130,246,0.3)', icon: CalendarDays },
            { to: '/tickets/new', label: 'Report an Issue', desc: 'Create maintenance ticket', gradient: 'from-amber-500 to-orange-500', glow: 'rgba(245,158,11,0.3)', icon: TicketIcon },
            { to: '/facilities', label: 'Browse Facilities', desc: 'Explore campus resources', gradient: 'from-emerald-500 to-teal-500', glow: 'rgba(16,185,129,0.3)', icon: Building2 },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.to} to={action.to}>
                <motion.div
                  whileHover={{ scale: 1.03, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                  className="p-5 rounded-2xl flex items-center gap-4"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: `0 4px 24px rgba(0,0,0,0.3)`,
                  }}
                >
                  <motion.div
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center flex-shrink-0`}
                    style={{ boxShadow: `0 0 16px ${action.glow}` }}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </motion.div>
                  <div>
                    <p className="font-bold text-white text-sm leading-tight">{action.label}</p>
                    <p className="text-xs text-slate-500 mt-1">{action.desc}</p>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

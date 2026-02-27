import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { facilityApi, bookingApi, ticketApi, notificationApi } from '@/lib/api';
import type { Facility, Booking, Ticket } from '@/lib/types';
import {
  Building2, CalendarDays, Ticket as TicketIcon, Bell,
  AlertTriangle, ArrowRight, Activity
} from 'lucide-react';
import LiquidGlassCard from '@/components/LiquidGlassCard';

import {
  containerVariants,
  itemVariants,
  cardVariants,
} from '@/lib/animations';

const container = containerVariants;
const item = itemVariants;

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
        const [facRes, notifRes] = await Promise.all([
          facilityApi.getAll(),
          notificationApi.getCount(),
        ]);
        setFacilities(facRes.data);
        setUnreadCount(notifRes.data.count);

        try {
          if (isAdmin) {
            const [bookRes, tickRes] = await Promise.all([
              bookingApi.getAll(),
              ticketApi.getAll(),
            ]);
            setBookings(bookRes.data);
            setTickets(tickRes.data);
          } else {
            const [bookRes, tickRes] = await Promise.all([
              bookingApi.getMy(),
              ticketApi.getMy(),
            ]);
            setBookings(bookRes.data);
            setTickets(tickRes.data);
          }
        } catch {
          // user may not have access to all endpoints
        }
      } catch {
        // ignore errors
      } finally {
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
    { label: 'Total Facilities', value: facilities.length, sub: `${activeFacilities} active`, icon: Building2, color: 'from-violet-500 to-indigo-500' },
    { label: 'Bookings', value: bookings.length, sub: `${pendingBookings} pending`, icon: CalendarDays, color: 'from-blue-500 to-cyan-500' },
    { label: 'Tickets', value: tickets.length, sub: `${openTickets} open`, icon: TicketIcon, color: 'from-amber-500 to-orange-500' },
    { label: 'Notifications', value: unreadCount, sub: 'unread', icon: Bell, color: 'from-rose-500 to-pink-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 py-8">
      {/* Header */}
      <motion.div variants={item}>
        <h1 className="text-4xl font-bold text-white">
          Welcome back, <span className="text-gradient">{user?.name?.split(' ')[0]}</span>
        </h1>
        <p className="text-slate-300 mt-2 text-lg">Here's a glimpse of your smart campus.</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <LiquidGlassCard key={stat.label}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-300 font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{stat.sub}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </LiquidGlassCard>
          );
        })}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Bookings */}
        <motion.div variants={item}>
          <LiquidGlassCard className="overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Recent Bookings</h3>
                  <p className="text-xs text-slate-400">{pendingBookings} pending approval</p>
                </div>
              </div>
              <Link to="/bookings" className="text-sm text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-white/10">
              {bookings.slice(0, 5).map((booking) => (
                <div key={booking.id} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors">
                  <div className={`w-2 h-2 rounded-full ${
                    booking.status === 'APPROVED' ? 'bg-emerald-500' :
                    booking.status === 'PENDING' ? 'bg-amber-500' :
                    booking.status === 'REJECTED' ? 'bg-rose-500' : 'bg-slate-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{booking.facilityName}</p>
                    <p className="text-xs text-slate-400">{booking.date} {booking.startTime}-{booking.endTime}</p>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-white/10 text-slate-300">
                    {booking.status}
                  </span>
                </div>
              ))}
              {bookings.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No bookings yet</p>
                </div>
              )}
            </div>
          </LiquidGlassCard>
        </motion.div>

        {/* Recent Tickets */}
        <motion.div variants={item}>
          <LiquidGlassCard className="overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <TicketIcon className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Recent Tickets</h3>
                  <p className="text-xs text-slate-400">{openTickets} open, {inProgressTickets} in progress</p>
                </div>
              </div>
              <Link to="/tickets" className="text-sm text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-white/10">
              {tickets.slice(0, 5).map((ticket) => (
                <div key={ticket.id} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    ticket.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' :
                    ticket.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-300' :
                    ticket.priority === 'MEDIUM' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-500/20 text-slate-300'
                  }`}>
                    {ticket.priority === 'CRITICAL' || ticket.priority === 'HIGH' ?
                      <AlertTriangle className="w-4 h-4" /> :
                      <Activity className="w-4 h-4" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{ticket.title}</p>
                    <p className="text-xs text-slate-400">{ticket.category} - {ticket.location}</p>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-white/10 text-slate-300">
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
              {tickets.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  <TicketIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No tickets yet</p>
                </div>
              )}
            </div>
          </LiquidGlassCard>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={item}>
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to="/bookings/new">
            <LiquidGlassCard className="group flex items-center gap-4 p-5 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <CalendarDays className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white">Book a Facility</p>
                <p className="text-xs text-slate-400">Reserve rooms & equipment</p>
              </div>
            </LiquidGlassCard>
          </Link>
          <Link to="/tickets/new">
            <LiquidGlassCard className="group flex items-center gap-4 p-5 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <TicketIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white">Report an Issue</p>
                <p className="text-xs text-slate-400">Create maintenance ticket</p>
              </div>
            </LiquidGlassCard>
          </Link>
          <Link to="/facilities">
            <LiquidGlassCard className="group flex items-center gap-4 p-5 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white">Browse Facilities</p>
                <p className="text-xs text-slate-400">Explore campus resources</p>
              </div>
            </LiquidGlassCard>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

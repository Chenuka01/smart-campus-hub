import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Clock, CalendarCheck, 
  BarChart3, PieChart as PieChartIcon, Activity, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { facilityApi, bookingApi } from '@/lib/api';
import type { Facility, Booking } from '@/lib/types';
import LiquidGlassCard from '@/components/LiquidGlassCard';
import { containerVariants, itemVariants } from '@/lib/animations';

const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

export default function AnalyticsDashboardPage() {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [facRes, bookRes] = await Promise.all([
          facilityApi.getAll(),
          bookingApi.getAll()
        ]);
        setFacilities(facRes.data);
        setBookings(bookRes.data);
      } catch (error) {
        console.error('Failed to fetch analytics data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (!isAdmin && !isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-8 bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-400">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
        <p className="text-sm text-slate-500 font-medium animate-pulse">Loading analytics...</p>
      </div>
    );
  }

  // Calculate most/least used resources
  const usageMap: Record<string, number> = {};
  bookings.forEach(booking => {
    const name = booking.facilityName || 'Unknown';
    usageMap[name] = (usageMap[name] || 0) + 1;
  });

  const usageData = Object.entries(usageMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const mostUsed = usageData.slice(0, 5);
  const leastUsed = [...usageData].reverse().slice(0, 5);

  // Peak usage times (by hour)
  const hourMap: Record<number, number> = {};
  bookings.forEach(booking => {
    const date = new Date(booking.startTime);
    const hour = date.getHours();
    hourMap[hour] = (hourMap[hour] || 0) + 1;
  });

  const peakUsageData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    bookings: hourMap[i] || 0
  }));

  // Booking status distribution
  const statusMap: Record<string, number> = {};
  bookings.forEach(booking => {
    statusMap[booking.status] = (statusMap[booking.status] || 0) + 1;
  });

  const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 pb-8">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            Resource Usage <span className="text-gradient">Analytics</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Comprehensive overview of campus resource utilization</p>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <LiquidGlassCard depth={1} className="p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Bookings</p>
              <h3 className="text-3xl font-bold text-white mt-1">{bookings.length}</h3>
            </div>
            <div className="p-3 bg-violet-500/20 rounded-xl">
              <CalendarCheck className="w-5 h-5 text-violet-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-emerald-400 text-xs font-medium">
            <TrendingUp className="w-3 h-3 mr-1" />
            <span>+12% from last month</span>
          </div>
        </LiquidGlassCard>

        <LiquidGlassCard depth={1} className="p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Resources</p>
              <h3 className="text-3xl font-bold text-white mt-1">{facilities.length}</h3>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-slate-400 text-xs font-medium">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
            <span>{facilities.filter(f => f.status === 'ACTIVE').length} active resources</span>
          </div>
        </LiquidGlassCard>

        <LiquidGlassCard depth={1} className="p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Most Active Hour</p>
              <h3 className="text-3xl font-bold text-white mt-1">
                {peakUsageData.reduce((prev, current) => (prev.bookings > current.bookings) ? prev : current).hour}
              </h3>
            </div>
            <div className="p-3 bg-amber-500/20 rounded-xl">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-amber-400 text-xs font-medium">
            <span>Peak slot for bookings</span>
          </div>
        </LiquidGlassCard>

        <LiquidGlassCard depth={1} className="p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Completion Rate</p>
              <h3 className="text-3xl font-bold text-white mt-1">
                {bookings.length > 0 ? Math.round((bookings.filter(b => b.status === 'APPROVED').length / bookings.length) * 100) : 0}%
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/20 rounded-xl">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-emerald-400 text-xs font-medium">
            <span>High utilization efficiency</span>
          </div>
        </LiquidGlassCard>
      </motion.div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Used Resources Chart */}
        <motion.div variants={itemVariants}>
          <LiquidGlassCard depth={2} className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-500/20 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-violet-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Most Used Resources</h3>
              </div>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mostUsed} layout="vertical" margin={{ left: 40, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100} 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  />
                  <Bar dataKey="count" fill="url(#barGradient)" radius={[0, 4, 4, 0]} />
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#6366F1" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </LiquidGlassCard>
        </motion.div>

        {/* Peak Usage Times Chart */}
        <motion.div variants={itemVariants}>
          <LiquidGlassCard depth={2} className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Activity className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Peak Usage Times</h3>
              </div>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={peakUsageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="hour" 
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="bookings" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </LiquidGlassCard>
        </motion.div>

        {/* Booking Status Pie Chart */}
        <motion.div variants={itemVariants}>
          <LiquidGlassCard depth={2} className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <PieChartIcon className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Booking Status</h3>
              </div>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </LiquidGlassCard>
        </motion.div>

        {/* Least Used Resources */}
        <motion.div variants={itemVariants}>
          <LiquidGlassCard depth={2} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Least Used Resources</h3>
              </div>
            </div>
            <div className="space-y-4 mt-6">
              {leastUsed.length > 0 ? leastUsed.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xs">
                      {i + 1}
                    </div>
                    <span className="text-sm text-slate-200">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-400">{item.count} bookings</span>
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </div>
                </div>
              )) : (
                <p className="text-slate-500 text-center py-10">Not enough data</p>
              )}
            </div>
          </LiquidGlassCard>
        </motion.div>
      </div>
    </motion.div>
  );
}
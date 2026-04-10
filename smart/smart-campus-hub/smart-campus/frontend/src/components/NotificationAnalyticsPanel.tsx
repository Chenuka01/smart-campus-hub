import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BarChart3,
  BellRing,
  Clock3,
  Flame,
  Sparkles,
  TrendingUp,
  Users2,
} from 'lucide-react';
import type { NotificationAnalytics } from '@/lib/types';
import LiquidGlassCard from '@/components/LiquidGlassCard';

interface NotificationAnalyticsPanelProps {
  analytics: NotificationAnalytics | null;
  analyticsError: string | null;
}

const analyticsPalette = ['#fb7185', '#38bdf8', '#22c55e', '#f59e0b', '#8b5cf6', '#14b8a6'];

const glassTooltipStyle = {
  backgroundColor: 'rgba(15, 23, 42, 0.96)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '14px',
  color: '#e2e8f0',
  fontSize: '12px',
};

const shortHourLabel = (hour: number) => {
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}${hour < 12 ? 'a' : 'p'}`;
};

export default function NotificationAnalyticsPanel({
  analytics,
  analyticsError,
}: NotificationAnalyticsPanelProps) {
  const topUser = analytics?.mostActiveUsers[0];
  const topEvent = analytics?.mostTriggeredEvents[0];
  const averageDailyVolume = analytics?.recentVolume.length
    ? Math.round(analytics.recentVolume.reduce((sum, point) => sum + point.count, 0) / analytics.recentVolume.length)
    : 0;
  const hasAnalyticsData = (analytics?.totalNotifications ?? 0) > 0;

  const summaryCards = analytics ? [
    {
      label: 'Total Delivered',
      value: analytics.totalNotifications.toLocaleString(),
      detail: `${analytics.unreadNotifications} unread right now`,
      icon: BellRing,
      tint: 'from-rose-500 to-orange-400',
      glow: 'rgba(251,113,133,0.35)',
    },
    {
      label: 'Read Rate',
      value: `${analytics.readRate.toFixed(1)}%`,
      detail: 'Campus-wide notification consumption',
      icon: TrendingUp,
      tint: 'from-emerald-500 to-teal-400',
      glow: 'rgba(52,211,153,0.35)',
    },
    {
      label: 'Active Recipients',
      value: analytics.uniqueRecipients.toLocaleString(),
      detail: 'Unique users reached by alerts',
      icon: Users2,
      tint: 'from-sky-500 to-cyan-400',
      glow: 'rgba(56,189,248,0.35)',
    },
    {
      label: 'Peak Window',
      value: analytics.busiestHourLabel,
      detail: `${analytics.busiestHourCount} notifications in the busiest hour`,
      icon: Clock3,
      tint: 'from-violet-500 to-fuchsia-400',
      glow: 'rgba(168,85,247,0.35)',
    },
  ] : [];

  return (
    <div className="space-y-6">
      <LiquidGlassCard depth={3} className="overflow-hidden">
        <div className="relative p-6 lg:p-8">
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(circle at top left, rgba(251,113,133,0.16), transparent 34%),
                radial-gradient(circle at top right, rgba(56,189,248,0.14), transparent 34%),
                linear-gradient(135deg, rgba(15,23,42,0.92), rgba(30,41,59,0.76))
              `,
            }}
          />

          <div className="relative grid grid-cols-1 lg:grid-cols-[1.3fr_0.9fr] gap-6">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-200 border border-sky-400/20 bg-sky-500/10">
                <Sparkles className="w-3.5 h-3.5 text-sky-300" />
                Notification Dashboard
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Admin view for real-time notification behavior
                </h2>
                <p className="text-slate-300/85 text-sm mt-3 max-w-2xl leading-relaxed">
                  Track the users receiving the most alerts, the event types generating the most noise,
                  and the time windows when notification traffic peaks.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="px-4 py-3 rounded-2xl border border-white/10 bg-white/5">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400 font-semibold">Top User</p>
                  <p className="text-white font-bold mt-1">{topUser?.name || 'No activity yet'}</p>
                  <p className="text-xs text-slate-500 mt-1">{topUser ? `${topUser.count} notifications` : 'Waiting for data'}</p>
                </div>
                <div className="px-4 py-3 rounded-2xl border border-white/10 bg-white/5">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400 font-semibold">Top Event</p>
                  <p className="text-white font-bold mt-1">{topEvent?.label || 'No activity yet'}</p>
                  <p className="text-xs text-slate-500 mt-1">{topEvent ? `${topEvent.percentage.toFixed(1)}% of total traffic` : 'Waiting for data'}</p>
                </div>
                <div className="px-4 py-3 rounded-2xl border border-white/10 bg-white/5">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400 font-semibold">Busiest Hour</p>
                  <p className="text-white font-bold mt-1">{analytics?.busiestHourLabel || 'No activity'}</p>
                  <p className="text-xs text-slate-500 mt-1">{analytics ? `${analytics.busiestHourCount} notifications` : 'Waiting for data'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
              {[
                {
                  icon: Users2,
                  title: 'Most Active Users',
                  body: 'Find the recipients with the highest alert volume.',
                  accent: 'text-sky-300',
                },
                {
                  icon: Flame,
                  title: 'Most Triggered Events',
                  body: 'See which booking, ticket, comment, or system events dominate.',
                  accent: 'text-rose-300',
                },
                {
                  icon: Clock3,
                  title: 'Peak Notification Times',
                  body: 'Reveal the hours with the heaviest system pressure.',
                  accent: 'text-violet-300',
                },
              ].map((item) => (
                <div key={item.title} className="p-4 rounded-2xl border border-white/10 bg-black/15 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
                      <item.icon className={`w-5 h-5 ${item.accent}`} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{item.title}</p>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </LiquidGlassCard>

      {analyticsError && (
        <LiquidGlassCard className="p-4" depth={1}>
          <p className="text-sm text-amber-300">{analyticsError}</p>
        </LiquidGlassCard>
      )}

      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <LiquidGlassCard key={card.label} glow={card.glow} depth={2} className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{card.label}</p>
                    <p className="text-3xl font-extrabold text-white mt-2">{card.value}</p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.tint} flex items-center justify-center`}
                    style={{ boxShadow: `0 0 18px ${card.glow}` }}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-sm text-slate-400 mt-4">{card.detail}</p>
              </LiquidGlassCard>
            );
          })}
        </div>
      )}

      {!hasAnalyticsData && (
        <LiquidGlassCard depth={2} className="p-10 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl border border-violet-500/20 bg-violet-500/10 flex items-center justify-center mb-4">
            <BarChart3 className="w-7 h-7 text-violet-300" />
          </div>
          <p className="text-lg font-bold text-white">No notification analytics yet</p>
          <p className="text-sm text-slate-400 mt-2">
            Once booking, ticket, comment, and system alerts start flowing, this dashboard will light up with trends.
          </p>
        </LiquidGlassCard>
      )}

      {analytics && hasAnalyticsData && (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <LiquidGlassCard depth={2} className="p-6 xl:col-span-5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center">
                    <Users2 className="w-5 h-5 text-sky-300" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Most Active Users</h3>
                    <p className="text-xs text-slate-400 mt-1">Recipients with the highest notification load</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-white">{topUser?.name || 'N/A'}</p>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.mostActiveUsers} layout="vertical" margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
                    <defs>
                      <linearGradient id="activeUsersGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={110}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      tickFormatter={(value) => value.length > 14 ? `${value.slice(0, 14)}…` : value}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                      contentStyle={glassTooltipStyle}
                      formatter={(value: number) => [`${value} notifications`, 'Volume']}
                    />
                    <Bar dataKey="count" fill="url(#activeUsersGradient)" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </LiquidGlassCard>

            <LiquidGlassCard depth={2} className="p-6 xl:col-span-7">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-rose-300" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Most Triggered Events</h3>
                    <p className="text-xs text-slate-400 mt-1">Event types driving the most alert traffic</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-white">{topEvent?.label || 'N/A'}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-5 items-center">
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Tooltip
                        contentStyle={glassTooltipStyle}
                        formatter={(value: number) => [`${value} notifications`, 'Count']}
                      />
                      <Pie
                        data={analytics.mostTriggeredEvents}
                        dataKey="count"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={68}
                        outerRadius={102}
                        paddingAngle={4}
                      >
                        {analytics.mostTriggeredEvents.map((event, index) => (
                          <Cell key={event.type} fill={analyticsPalette[index % analyticsPalette.length]} />
                        ))}
                      </Pie>
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  {analytics.mostTriggeredEvents.map((event, index) => (
                    <div key={event.type} className="p-4 rounded-2xl border border-white/8 bg-white/4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: analyticsPalette[index % analyticsPalette.length] }} />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate">{event.label}</p>
                            <p className="text-xs mt-1 text-slate-400">{event.percentage.toFixed(1)}% of total notifications</p>
                          </div>
                        </div>
                        <p className="text-base font-extrabold text-white">{event.count}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </LiquidGlassCard>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <LiquidGlassCard depth={2} className="p-6 xl:col-span-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
                    <Clock3 className="w-5 h-5 text-violet-300" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Peak Notification Times</h3>
                    <p className="text-xs text-slate-400 mt-1">Hourly distribution of campus-wide alerts</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-white">{analytics.busiestHourLabel}</p>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.peakNotificationTimes}>
                    <defs>
                      <linearGradient id="notificationPeakGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.75} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                      dataKey="hour"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      tickFormatter={shortHourLabel}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={glassTooltipStyle}
                      formatter={(value: number) => [`${value} notifications`, 'Volume']}
                      labelFormatter={(value: number | string) => {
                        const point = analytics.peakNotificationTimes.find((item) => item.hour === Number(value));
                        return point?.label || `Hour ${value}`;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#a78bfa"
                      strokeWidth={3}
                      fill="url(#notificationPeakGradient)"
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </LiquidGlassCard>

            <LiquidGlassCard depth={2} className="p-6 xl:col-span-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">7-Day Pulse</h3>
                  <p className="text-xs text-slate-400 mt-1">Short-term delivery momentum</p>
                </div>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.recentVolume} margin={{ top: 8, right: 6, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="notificationVolumeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.5} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={glassTooltipStyle}
                      formatter={(value: number) => [`${value} notifications`, 'Volume']}
                    />
                    <Bar dataKey="count" fill="url(#notificationVolumeGradient)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-5 p-4 rounded-2xl border border-white/8 bg-white/4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 font-semibold">Weekly Signal</p>
                <p className="text-2xl font-extrabold text-white mt-2">{averageDailyVolume}</p>
                <p className="text-sm text-slate-400 mt-1">Average notifications per day over the last week</p>
              </div>
            </LiquidGlassCard>
          </div>
        </>
      )}
    </div>
  );
}

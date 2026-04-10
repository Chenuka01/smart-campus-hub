import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  CalendarClock,
  Check,
  CheckCheck,
  CheckCircle2,
  Info,
  Mail,
  MessageSquare,
  Moon,
  Save,
  Settings2,
  Sparkles,
  Ticket,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { notificationApi } from '@/lib/api';
import type { Notification, NotificationAnalytics } from '@/lib/types';
import LiquidGlassCard from '@/components/LiquidGlassCard';
import NeuButton from '@/components/NeuButton';
import NotificationAnalyticsPanel from '@/components/NotificationAnalyticsPanel';
import { containerVariants, fadeScaleVariants, itemVariants } from '@/lib/animations';

type NotificationView = 'analytics' | 'all' | 'unread' | 'preferences';

const typeIcons: Record<string, typeof Bell> = {
  BOOKING_APPROVED: CheckCircle2,
  BOOKING_REJECTED: XCircle,
  BOOKING_CANCELLED: XCircle,
  TICKET_CREATED: Ticket,
  TICKET_ASSIGNED: Ticket,
  TICKET_STATUS_CHANGED: Info,
  TICKET_RESOLVED: CheckCircle2,
  TICKET_CLOSED: CheckCircle2,
  TICKET_REJECTED: XCircle,
  COMMENT_ADDED: MessageSquare,
  SYSTEM: Bell,
};

const typeColors: Record<string, { glow: string; glassColor: string; textColor: string }> = {
  BOOKING_APPROVED: { glow: 'rgba(16,185,129,0.3)', glassColor: 'rgba(16,185,129,0.12)', textColor: 'text-emerald-400' },
  BOOKING_REJECTED: { glow: 'rgba(244,63,94,0.3)', glassColor: 'rgba(244,63,94,0.12)', textColor: 'text-rose-400' },
  BOOKING_CANCELLED: { glow: 'rgba(148,163,184,0.2)', glassColor: 'rgba(148,163,184,0.08)', textColor: 'text-slate-400' },
  TICKET_CREATED: { glow: 'rgba(59,130,246,0.3)', glassColor: 'rgba(59,130,246,0.12)', textColor: 'text-blue-400' },
  TICKET_ASSIGNED: { glow: 'rgba(139,92,246,0.3)', glassColor: 'rgba(139,92,246,0.12)', textColor: 'text-violet-400' },
  TICKET_STATUS_CHANGED: { glow: 'rgba(245,158,11,0.3)', glassColor: 'rgba(245,158,11,0.12)', textColor: 'text-amber-400' },
  TICKET_RESOLVED: { glow: 'rgba(16,185,129,0.3)', glassColor: 'rgba(16,185,129,0.12)', textColor: 'text-emerald-400' },
  TICKET_CLOSED: { glow: 'rgba(148,163,184,0.2)', glassColor: 'rgba(148,163,184,0.08)', textColor: 'text-slate-400' },
  TICKET_REJECTED: { glow: 'rgba(244,63,94,0.3)', glassColor: 'rgba(244,63,94,0.12)', textColor: 'text-rose-400' },
  COMMENT_ADDED: { glow: 'rgba(59,130,246,0.3)', glassColor: 'rgba(59,130,246,0.12)', textColor: 'text-blue-400' },
  SYSTEM: { glow: 'rgba(139,92,246,0.3)', glassColor: 'rgba(139,92,246,0.12)', textColor: 'text-violet-400' },
};

export default function NotificationsPage() {
  const { isAdmin } = useAuth();
  const canViewAnalytics = isAdmin;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [analytics, setAnalytics] = useState<NotificationAnalytics | null>(null);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<NotificationView>(canViewAnalytics ? 'analytics' : 'all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [prefs, setPrefs] = useState({
    bookingAlerts: true,
    ticketUpdates: true,
    comments: true,
    dndMode: false,
    dndStart: '22:00',
    dndEnd: '07:00',
    emailNotes: true,
  });

  useEffect(() => {
    if (!canViewAnalytics && view === 'analytics') {
      setView('all');
    }
  }, [canViewAnalytics, view]);

  useEffect(() => {
    let isMounted = true;

    const loadPageData = async () => {
      setLoading(true);

      const [notificationsResult, preferencesResult, analyticsResult] = await Promise.allSettled([
        notificationApi.getAll(),
        notificationApi.getPreferences(),
        canViewAnalytics ? notificationApi.getAnalytics() : Promise.resolve(null),
      ]);

      if (!isMounted) {
        return;
      }

      if (notificationsResult.status === 'fulfilled') {
        setNotifications(notificationsResult.value.data);
      }

      if (preferencesResult.status === 'fulfilled') {
        const data = preferencesResult.value.data;
        setPrefs((current) => ({
          ...current,
          emailNotes: data.email,
          dndMode: data.dndMode,
          dndStart: data.dndStart || '22:00',
          dndEnd: data.dndEnd || '07:00',
          bookingAlerts: data.bookingAlerts,
          ticketUpdates: data.ticketUpdates,
          comments: data.comments,
        }));
      }

      if (canViewAnalytics) {
        if (analyticsResult.status === 'fulfilled' && analyticsResult.value) {
          setAnalytics(analyticsResult.value.data);
          setAnalyticsError(null);
        } else {
          setAnalytics(null);
          setAnalyticsError('Analytics are temporarily unavailable.');
        }
      }

      setLoading(false);
    };

    loadPageData();

    return () => {
      isMounted = false;
    };
  }, [canViewAnalytics]);

  const refreshAnalytics = async () => {
    if (!canViewAnalytics) {
      return;
    }
    try {
      const res = await notificationApi.getAnalytics();
      setAnalytics(res.data);
      setAnalyticsError(null);
    } catch {
      setAnalyticsError('Analytics are temporarily unavailable.');
    }
  };

  const handleSavePreferences = async () => {
    try {
      await notificationApi.updatePreferences({
        email: prefs.emailNotes,
        dndMode: prefs.dndMode,
        dndStart: prefs.dndStart,
        dndEnd: prefs.dndEnd,
        bookingAlerts: prefs.bookingAlerts,
        ticketUpdates: prefs.ticketUpdates,
        comments: prefs.comments,
      });
      alert('Preferences saved successfully! Check your email inbox.');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Unknown error occurred';
      alert(`Failed to save preferences:\n\n${errorMessage}`);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((current) => current.map((notification) => (
        notification.id === id ? { ...notification, read: true } : notification
      )));
      void refreshAnalytics();
    } catch {
      // ignore
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
      void refreshAnalytics();
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationApi.delete(id);
      setNotifications((current) => current.filter((notification) => notification.id !== id));
      setSelectedIds((current) => current.filter((sid) => sid !== id));
      void refreshAnalytics();
    } catch {
      // ignore
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} notifications?`)) return;
    
    try {
      await Promise.all(selectedIds.map(id => notificationApi.delete(id)));
      setNotifications((current) => current.filter((n) => !selectedIds.includes(n.id)));
      setSelectedIds([]);
      void refreshAnalytics();
    } catch {
      alert('Failed to delete some notifications');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredNotifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNotifications.map(n => n.id));
    }
  };

  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const filteredNotifications = view === 'unread'
    ? notifications.filter((notification) => !notification.read)
    : notifications;

  const tabs = canViewAnalytics
    ? [
        { id: 'analytics' as const, label: 'Analytics' },
        { id: 'all' as const, label: `All (${notifications.length})` },
        { id: 'unread' as const, label: `Unread (${unreadCount})` },
        { id: 'preferences' as const, label: 'Preferences' },
      ]
    : [
        { id: 'all' as const, label: `All (${notifications.length})` },
        { id: 'unread' as const, label: `Unread (${unreadCount})` },
        { id: 'preferences' as const, label: 'Preferences' },
      ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
        <p className="text-sm text-slate-500 animate-pulse">Loading notifications...</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`space-y-6 pb-8 ${canViewAnalytics ? 'max-w-7xl mx-auto' : 'max-w-3xl mx-auto'}`}
    >
      <motion.div variants={itemVariants} className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
        <div>
          {canViewAnalytics && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-rose-200 border border-rose-400/20 bg-rose-500/10">
              <Sparkles className="w-3.5 h-3.5 text-rose-300" />
              Admin Intelligence
            </div>
          )}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {canViewAnalytics ? (
              <>Notification <span className="text-gradient">Intelligence</span></>
            ) : (
              <span className="text-gradient">Notifications</span>
            )}
          </h1>
          <p className="text-slate-400 text-sm mt-2 max-w-2xl">
            {view === 'analytics' && canViewAnalytics
              ? 'Advanced admin dashboard for user activity, event pressure, and the busiest notification windows.'
              : unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''} waiting in your inbox.`
              : 'You are all caught up. New alerts will appear here as campus events happen.'}
          </p>
        </div>

        {view !== 'preferences' && view !== 'analytics' && unreadCount > 0 && (
          <NeuButton
            variant="secondary"
            size="md"
            icon={<CheckCheck className="w-4 h-4" />}
            iconPosition="left"
            onClick={handleMarkAllAsRead}
          >
            Mark all read
          </NeuButton>
        )}
      </motion.div>

      <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setView(tab.id)}
            className="px-5 py-2.5 text-sm font-bold rounded-xl transition-all"
            style={view === tab.id ? {
              background: 'rgba(139,92,246,0.2)',
              border: '1px solid rgba(139,92,246,0.35)',
              color: '#c4b5fd',
              boxShadow: '0 0 12px rgba(139,92,246,0.18)',
            } : {
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              color: '#64748b',
            }}
          >
            {tab.label}
          </motion.button>
        ))}
      </motion.div>

      {view !== 'preferences' && view !== 'analytics' && filteredNotifications.length > 0 && (
        <motion.div variants={itemVariants} className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleSelectAll}
              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                selectedIds.length === filteredNotifications.length 
                ? 'bg-violet-500 border-violet-400' 
                : 'border-white/20 hover:border-violet-500/50'
              }`}
            >
              {selectedIds.length === filteredNotifications.length && <Check className="w-4 h-4 text-white" />}
              {selectedIds.length > 0 && selectedIds.length < filteredNotifications.length && (
                <div className="w-2.5 h-0.5 bg-violet-400 rounded-full" />
              )}
            </motion.button>
            <span className="text-sm font-bold text-slate-300">
              {selectedIds.length > 0 
                ? `${selectedIds.length} selected` 
                : 'Select All'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <AnimatePresence>
              {selectedIds.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-2"
                >
                  <NeuButton
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 className="w-4 h-4" />}
                    onClick={handleBulkDelete}
                    className="text-rose-400 border-rose-500/20 hover:bg-rose-500/10"
                  >
                    Delete Selected
                  </NeuButton>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {view === 'analytics' && canViewAnalytics && (
        <motion.div variants={itemVariants}>
          <NotificationAnalyticsPanel analytics={analytics} analyticsError={analyticsError} />
        </motion.div>
      )}

      {view === 'preferences' && (
        <motion.div variants={itemVariants}>
          <LiquidGlassCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                <Settings2 className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Notification Preferences</h2>
                <p className="text-sm text-slate-400">Customize how and when you receive alerts.</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Alert Types</h3>
                {[
                  {
                    key: 'bookingAlerts' as const,
                    title: 'Booking Alerts',
                    description: 'Updates on your booking requests and approvals',
                    icon: CalendarClock,
                    activeClass: 'bg-emerald-500',
                    textClass: 'text-emerald-400',
                  },
                  {
                    key: 'ticketUpdates' as const,
                    title: 'Ticket Updates',
                    description: 'Status changes and resolutions for support tickets',
                    icon: Ticket,
                    activeClass: 'bg-blue-500',
                    textClass: 'text-blue-400',
                  },
                  {
                    key: 'comments' as const,
                    title: 'Comments',
                    description: 'When someone comments on your bookings or tickets',
                    icon: MessageSquare,
                    activeClass: 'bg-amber-500',
                    textClass: 'text-amber-400',
                  },
                ].map((option) => (
                  <label key={option.key} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <option.icon className={`w-5 h-5 ${option.textClass}`} />
                      <div>
                        <p className="font-bold text-white">{option.title}</p>
                        <p className="text-xs text-slate-400">{option.description}</p>
                      </div>
                    </div>
                    <div className={`w-10 h-5 rounded-full p-1 transition-colors flex-shrink-0 ${prefs[option.key] ? option.activeClass : 'bg-white/20'}`}>
                      <div className={`w-3 h-3 bg-white rounded-full transition-transform ${prefs[option.key] ? 'translate-x-5' : ''}`} />
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={prefs[option.key]}
                      onChange={(event) => setPrefs({ ...prefs, [option.key]: event.target.checked })}
                    />
                  </label>
                ))}
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Do Not Disturb</h3>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <label className="flex items-center justify-between cursor-pointer mb-4">
                    <div className="flex items-center gap-4">
                      <Moon className="w-5 h-5 text-violet-400" />
                      <div>
                        <p className="font-bold text-white">DND Mode</p>
                        <p className="text-xs text-slate-400">Mute notifications during a specific time period</p>
                      </div>
                    </div>
                    <div className={`w-10 h-5 rounded-full p-1 transition-colors flex-shrink-0 ${prefs.dndMode ? 'bg-violet-500' : 'bg-white/20'}`}>
                      <div className={`w-3 h-3 bg-white rounded-full transition-transform ${prefs.dndMode ? 'translate-x-5' : ''}`} />
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={prefs.dndMode}
                      onChange={(event) => setPrefs({ ...prefs, dndMode: event.target.checked })}
                    />
                  </label>

                  <AnimatePresence>
                    {prefs.dndMode && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex gap-4 pt-4 border-t border-white/10"
                      >
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-slate-400 mb-1 block">From</label>
                          <input
                            type="time"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                            value={prefs.dndStart}
                            onChange={(event) => setPrefs({ ...prefs, dndStart: event.target.value })}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-slate-400 mb-1 block">To</label>
                          <input
                            type="time"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                            value={prefs.dndEnd}
                            onChange={(event) => setPrefs({ ...prefs, dndEnd: event.target.value })}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Delivery Channels</h3>
                <label className="flex max-w-xs flex-col items-center justify-center gap-2 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                  <Mail className={`w-6 h-6 ${prefs.emailNotes ? 'text-violet-400' : 'text-slate-500'}`} />
                  <p className={`font-bold text-sm ${prefs.emailNotes ? 'text-violet-300' : 'text-slate-400'}`}>Email</p>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={prefs.emailNotes}
                    onChange={(event) => setPrefs({ ...prefs, emailNotes: event.target.checked })}
                  />
                  <div className={`w-10 h-5 rounded-full p-1 transition-colors ${prefs.emailNotes ? 'bg-violet-500' : 'bg-white/20'}`}>
                    <div className={`w-3 h-3 bg-white rounded-full transition-transform ${prefs.emailNotes ? 'translate-x-5' : ''}`} />
                  </div>
                </label>
              </div>

              <div className="pt-4 flex justify-end">
                <NeuButton
                  variant="primary"
                  size="lg"
                  icon={<Save className="w-5 h-5" />}
                  iconPosition="left"
                  onClick={handleSavePreferences}
                >
                  Save Preferences
                </NeuButton>
              </div>
            </div>
          </LiquidGlassCard>
        </motion.div>
      )}

      {view !== 'preferences' && view !== 'analytics' && (
        <AnimatePresence mode="popLayout">
          {filteredNotifications.map((notification, index) => {
            const Icon = typeIcons[notification.type] || Bell;
            const cfg = typeColors[notification.type] || typeColors.SYSTEM;
            return (
              <motion.div
                key={notification.id}
                custom={index}
                variants={fadeScaleVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
              >
                <LiquidGlassCard
                  depth={notification.read ? 1 : 2}
                  glow={notification.read ? undefined : cfg.glow}
                  className={`overflow-hidden transition-all duration-300 ${
                    selectedIds.includes(notification.id) 
                      ? 'border-violet-500/50 bg-violet-500/5 ring-1 ring-violet-500/20' 
                      : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center gap-3">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleSelect(notification.id)}
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                          selectedIds.includes(notification.id) 
                            ? 'bg-violet-500 border-violet-400' 
                            : 'border-white/10 hover:border-violet-500/30'
                        }`}
                      >
                        {selectedIds.includes(notification.id) && <Check className="w-4 h-4 text-white" />}
                      </motion.button>
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: cfg.glassColor,
                          border: `1px solid ${cfg.glow}`,
                          boxShadow: !notification.read ? `0 0 12px ${cfg.glow}` : 'none',
                        }}
                      >
                        <Icon className={`w-5 h-5 ${cfg.textColor}`} />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className={`text-sm font-bold ${notification.read ? 'text-slate-300' : 'text-white'}`}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse-glow"
                            style={{ background: cfg.glow.replace('0.3', '0.9') }}
                          />
                        )}
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed">{notification.message}</p>
                      <p className="text-xs text-slate-600 mt-1.5 font-medium">{new Date(notification.createdAt).toLocaleString()}</p>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!notification.read && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="p-2 rounded-xl text-slate-500 hover:text-emerald-400 transition-colors"
                          style={{ background: 'rgba(255,255,255,0.04)' }}
                          title="Mark as read"
                          aria-label="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(notification.id)}
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-400 transition-colors"
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                        title="Delete"
                        aria-label="Delete notification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </LiquidGlassCard>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}

      {view !== 'preferences' && view !== 'analytics' && filteredNotifications.length === 0 && (
        <motion.div variants={itemVariants} className="text-center py-20">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center animate-breathing"
            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}
          >
            <Bell className="w-8 h-8 text-violet-500" />
          </div>
          <p className="text-slate-300 font-bold text-lg">
            {view === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </p>
          <p className="text-sm text-slate-600 mt-2">
            You will be notified about booking updates and ticket changes.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

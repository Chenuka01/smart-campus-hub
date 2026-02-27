import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationApi } from '@/lib/api';
import type { Notification } from '@/lib/types';
import { Bell, CheckCircle2, XCircle, Ticket, MessageSquare, Check, CheckCheck, Trash2, Info } from 'lucide-react';
import LiquidGlassCard from '@/components/LiquidGlassCard';
import NeuButton from '@/components/NeuButton';
import { containerVariants, itemVariants, fadeScaleVariants } from '@/lib/animations';

const typeIcons: Record<string, typeof Bell> = {
  BOOKING_APPROVED: CheckCircle2, BOOKING_REJECTED: XCircle, BOOKING_CANCELLED: XCircle,
  TICKET_CREATED: Ticket, TICKET_ASSIGNED: Ticket, TICKET_STATUS_CHANGED: Info,
  TICKET_RESOLVED: CheckCircle2, TICKET_CLOSED: CheckCircle2, TICKET_REJECTED: XCircle,
  COMMENT_ADDED: MessageSquare, SYSTEM: Bell,
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.getAll();
      setNotifications(res.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(n => n.map(notif => notif.id === id ? { ...notif, read: true } : notif));
    } catch { /* ignore */ }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(n => n.map(notif => ({ ...notif, read: true })));
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationApi.delete(id);
      setNotifications(n => n.filter(notif => notif.id !== id));
    } catch { /* ignore */ }
  };

  const filtered = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;
  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
        <p className="text-sm text-slate-500 animate-pulse">Loading notifications…</p>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 pb-8 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            <span className="text-gradient">Notifications</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {unreadCount > 0
              ? <span className="text-violet-400 font-semibold">{unreadCount} unread notification{unreadCount > 1 ? 's' : ''}</span>
              : 'You\'re all caught up! ✨'}
          </p>
        </div>
        {unreadCount > 0 && (
          <NeuButton variant="secondary" size="md" icon={<CheckCheck className="w-4 h-4" />} iconPosition="left" onClick={handleMarkAllAsRead}>
            Mark all read
          </NeuButton>
        )}
      </motion.div>

      {/* Filter Tabs */}
      <motion.div variants={itemVariants} className="flex gap-2">
        {(['all', 'unread'] as const).map(f => (
          <motion.button
            key={f}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setFilter(f)}
            className="px-5 py-2.5 text-sm font-bold rounded-xl transition-all"
            style={filter === f ? {
              background: 'rgba(139,92,246,0.2)',
              border: '1px solid rgba(139,92,246,0.4)',
              color: '#a78bfa',
              boxShadow: '0 0 12px rgba(139,92,246,0.2)',
            } : {
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              color: '#64748b',
            }}
          >
            {f === 'all' ? `All (${notifications.length})` : `Unread (${unreadCount})`}
          </motion.button>
        ))}
      </motion.div>

      {/* Notification List */}
      <AnimatePresence mode="popLayout">
        {filtered.map((notification, index) => {
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
                className="overflow-hidden"
              >
                {/* Unread indicator bar */}
                {!notification.read && (
                  <div
                    className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
                    style={{ background: `linear-gradient(to bottom, ${cfg.glow.replace('0.3', '0.8')}, ${cfg.glow.replace('0.3', '0.4')})` }}
                  />
                )}

                <div className="flex items-start gap-4">
                  {/* Icon */}
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

                  {/* Content */}
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
                    <p className="text-xs text-slate-600 mt-1.5 font-medium">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {/* Actions */}
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

      {filtered.length === 0 && (
        <motion.div variants={itemVariants} className="text-center py-20">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center animate-breathing"
            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}
          >
            <Bell className="w-8 h-8 text-violet-500" />
          </div>
          <p className="text-slate-300 font-bold text-lg">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </p>
          <p className="text-sm text-slate-600 mt-2">
            You'll be notified about booking updates and ticket changes
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

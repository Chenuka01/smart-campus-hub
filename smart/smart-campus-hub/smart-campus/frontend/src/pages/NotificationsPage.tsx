import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { notificationApi } from '@/lib/api';
import type { Notification } from '@/lib/types';
import {
  Bell, CheckCircle2, XCircle, Ticket, MessageSquare,
  Check, CheckCheck, Trash2, Info
} from 'lucide-react';

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

const typeColors: Record<string, string> = {
  BOOKING_APPROVED: 'bg-emerald-100 text-emerald-600',
  BOOKING_REJECTED: 'bg-rose-100 text-rose-600',
  BOOKING_CANCELLED: 'bg-slate-100 text-slate-600',
  TICKET_CREATED: 'bg-blue-100 text-blue-600',
  TICKET_ASSIGNED: 'bg-violet-100 text-violet-600',
  TICKET_STATUS_CHANGED: 'bg-amber-100 text-amber-600',
  TICKET_RESOLVED: 'bg-emerald-100 text-emerald-600',
  TICKET_CLOSED: 'bg-slate-100 text-slate-600',
  TICKET_REJECTED: 'bg-rose-100 text-rose-600',
  COMMENT_ADDED: 'bg-blue-100 text-blue-600',
  SYSTEM: 'bg-violet-100 text-violet-600',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.getAll();
      setNotifications(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch {
      // ignore
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationApi.delete(id);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch {
      // ignore
    }
  };

  const filtered = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500 text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllAsRead}
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-50 text-violet-700 font-medium rounded-xl hover:bg-violet-100 transition-all border border-violet-200">
            <CheckCheck className="w-4 h-4" /> Mark all as read
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'unread'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
              filter === f
                ? 'gradient-primary text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}>
            {f === 'all' ? `All (${notifications.length})` : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.map((notification, index) => {
          const Icon = typeIcons[notification.type] || Bell;
          const colorClass = typeColors[notification.type] || 'bg-slate-100 text-slate-600';
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`bg-white rounded-2xl shadow-sm border p-4 transition-all hover:shadow-md ${
                notification.read ? 'border-slate-100' : 'border-violet-200 bg-violet-50/30'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`text-sm font-semibold ${notification.read ? 'text-slate-700' : 'text-slate-900'}`}>
                      {notification.title}
                    </h3>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-violet-600 rounded-full flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-slate-600">{notification.message}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!notification.read && (
                    <button onClick={() => handleMarkAsRead(notification.id)}
                      className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all"
                      title="Mark as read">
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => handleDelete(notification.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            You'll be notified about booking updates and ticket changes
          </p>
        </div>
      )}
    </div>
  );
}

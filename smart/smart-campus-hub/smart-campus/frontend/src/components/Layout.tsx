import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { notificationApi } from '@/lib/api';
import { pageTransition } from '@/lib/animations';
import {
  LayoutDashboard, Building2, CalendarDays, Ticket, Bell, LogOut,
  Menu, X, ChevronDown, Shield, User, Wrench, Zap
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-violet-400', glow: 'rgba(139,92,246,0.3)' },
  { path: '/facilities', label: 'Facilities', icon: Building2, color: 'text-blue-400', glow: 'rgba(59,130,246,0.3)' },
  { path: '/bookings', label: 'Bookings', icon: CalendarDays, color: 'text-cyan-400', glow: 'rgba(34,211,238,0.3)' },
  { path: '/tickets', label: 'Tickets', icon: Ticket, color: 'text-amber-400', glow: 'rgba(245,158,11,0.3)' },
  { path: '/notifications', label: 'Notifications', icon: Bell, color: 'text-rose-400', glow: 'rgba(244,63,94,0.3)' },
];

export default function Layout({ children }: LayoutProps) {
  const { user, logout, isAdmin, isTechnician } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await notificationApi.getCount();
        setUnreadCount(res.data.count);
      } catch { /* ignore */ }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = () => {
    if (isAdmin) return { label: 'Admin', color: 'text-violet-300', bg: 'bg-violet-500/20 border-violet-500/30', icon: Shield };
    if (isTechnician) return { label: 'Technician', color: 'text-amber-300', bg: 'bg-amber-500/20 border-amber-500/30', icon: Wrench };
    return { label: 'User', color: 'text-blue-300', bg: 'bg-blue-500/20 border-blue-500/30', icon: User };
  };
  const roleBadge = getRoleBadge();

  return (
    <div className="min-h-screen">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ─── Sidebar ──────────────────────────────── */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64
          transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        `}
        style={{
          background: 'rgba(8, 4, 24, 0.7)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '4px 0 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* Sidebar inner glow */}
        <div
          className="absolute inset-y-0 right-0 w-[1px] pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, transparent, rgba(139,92,246,0.3), rgba(59,130,246,0.2), transparent)',
          }}
        />

        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <Link to="/dashboard" className="flex items-center gap-3 group" onClick={() => setSidebarOpen(false)}>
              <motion.div
                whileHover={{ scale: 1.08, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className="relative w-11 h-11 rounded-2xl gradient-primary flex items-center justify-center"
                style={{ boxShadow: '0 0 20px rgba(139,92,246,0.4), 0 4px 12px rgba(0,0,0,0.3)' }}
              >
                <Zap className="w-5 h-5 text-white" />
                {/* Top shine */}
                <span className="absolute top-1 left-2 right-2 h-px bg-white/30 rounded-full" />
              </motion.div>
              <div>
                <h1 className="text-base font-bold text-gradient tracking-tight leading-tight">SmartCampus</h1>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Operations Hub</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className="block relative"
                >
                  <motion.div
                    whileHover={{ x: 3 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className={`
                      relative flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium
                      transition-colors duration-200
                      ${isActive
                        ? 'text-white'
                        : 'text-slate-400 hover:text-slate-100'
                      }
                    `}
                    style={isActive ? {
                      background: 'rgba(255,255,255,0.07)',
                      boxShadow: `0 0 20px ${item.glow}, inset 0 1px 0 rgba(255,255,255,0.08)`,
                      border: '1px solid rgba(255,255,255,0.08)',
                    } : {}}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 rounded-2xl pointer-events-none"
                        style={{
                          background: `linear-gradient(135deg, ${item.glow.replace('0.3', '0.12')}, transparent)`,
                        }}
                      />
                    )}

                    {/* Active indicator bar */}
                    {isActive && (
                      <motion.div
                        layoutId="activeBar"
                        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
                        style={{ background: `linear-gradient(to bottom, ${item.glow.replace('0.3', '0.9')}, ${item.glow.replace('0.3', '0.5')})` }}
                      />
                    )}

                    <Icon
                      className={`w-4.5 h-4.5 transition-all flex-shrink-0 ${isActive ? item.color : 'text-slate-500'}`}
                      style={isActive ? { filter: `drop-shadow(0 0 6px ${item.glow})` } : {}}
                    />
                    <span className="font-medium">{item.label}</span>

                    {/* Notification badge */}
                    {item.path === '/notifications' && unreadCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white animate-pulse-glow"
                      >
                        {unreadCount}
                      </motion.span>
                    )}
                  </motion.div>
                </Link>
              );
            })}

            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setSidebarOpen(false)}
                className="block relative"
              >
                <motion.div
                  whileHover={{ x: 3 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className={`
                    relative flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium
                    transition-colors duration-200
                    ${location.pathname.startsWith('/admin')
                      ? 'text-white'
                      : 'text-slate-400 hover:text-slate-100'
                    }
                  `}
                  style={location.pathname.startsWith('/admin') ? {
                    background: 'rgba(255,255,255,0.07)',
                    boxShadow: '0 0 20px rgba(139,92,246,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  } : {}}
                >
                  {location.pathname.startsWith('/admin') && (
                    <motion.div
                      className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-violet-400"
                      layoutId="activeBar"
                    />
                  )}
                  <Shield className={`w-4.5 h-4.5 flex-shrink-0 ${location.pathname.startsWith('/admin') ? 'text-violet-400' : 'text-slate-500'}`} />
                  <span>Admin Panel</span>
                </motion.div>
              </Link>
            )}
          </nav>

          {/* User Profile */}
          <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ boxShadow: '0 0 12px rgba(139,92,246,0.3)' }}
                >
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold text-white truncate leading-tight">{user?.name}</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full border mt-0.5 ${roleBadge.bg} ${roleBadge.color}`}>
                    <roleBadge.icon className="w-2.5 h-2.5" />
                    {roleBadge.label}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
              </motion.button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl p-2"
                    style={{
                      background: 'rgba(15, 8, 35, 0.95)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
                    }}
                  >
                    <p className="px-3 py-2 text-xs text-slate-500 truncate font-medium">{user?.email}</p>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── Main Content ─────────────────────────── */}
      <div className="lg:ml-64">
        {/* Top Bar */}
        <header
          className="sticky top-0 z-30"
          style={{
            background: 'rgba(8, 4, 24, 0.6)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          {/* Shimmer line at bottom of header */}
          <div
            className="absolute bottom-0 left-0 right-0 h-px"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.3), rgba(59,130,246,0.2), transparent)',
            }}
          />
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)' }}
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait">
                {sidebarOpen
                  ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X className="w-5 h-5" /></motion.div>
                  : <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Menu className="w-5 h-5" /></motion.div>
                }
              </AnimatePresence>
            </button>

            <div className="flex items-center gap-3 ml-auto">
              <Link
                to="/notifications"
                className="relative p-2.5 rounded-xl transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
              >
                <Bell className="w-4.5 h-4.5 text-slate-300" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"
                    style={{ boxShadow: '0 0 6px rgba(244,63,94,0.6)' }}
                  />
                )}
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          <motion.div
            key={location.pathname}
            variants={pageTransition as never}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition.transition}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

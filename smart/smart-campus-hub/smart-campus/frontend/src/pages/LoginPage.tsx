import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Building2, Mail, Lock, User, Eye, EyeOff, ArrowRight, Sparkles, Zap, Shield, Wrench } from 'lucide-react';
import AnimatedBackground from '@/components/AnimatedBackground';
import NeuButton from '@/components/NeuButton';
import { celebrationVariants, errorShakeVariants } from '@/lib/animations';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 600);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Authentication failed. Please try again.');
      setShakeKey(k => k + 1);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (role: string) => {
    setError('');
    setLoading(true);
    try {
      const credentials: Record<string, { email: string; password: string }> = {
        admin: { email: 'admin@smartcampus.com', password: 'admin123' },
        technician: { email: 'tech@smartcampus.com', password: 'tech123' },
        user: { email: 'user@smartcampus.com', password: 'user123' },
      };
      const cred = credentials[role];
      await login(cred.email, cred.password);
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 600);
    } catch {
      setError('Quick login failed. Make sure the backend is running.');
      setShakeKey(k => k + 1);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Building2, label: 'Facility Booking', desc: 'Reserve rooms & equipment', color: 'text-blue-400' },
    { icon: Wrench, label: 'Incident Tracking', desc: 'Submit maintenance tickets', color: 'text-amber-400' },
    { icon: Bell, label: 'Smart Notifications', desc: 'Real-time campus alerts', color: 'text-rose-400' },
    { icon: Shield, label: 'Role-Based Access', desc: 'Admin, tech & user roles', color: 'text-violet-400' },
  ];

  function Bell({ className }: { className?: string }) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    );
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* ─── Left Branding ─────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden items-center">
        <AnimatedBackground intensity="full" />

        {/* gradient overlay for depth */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(109,40,217,0.15) 0%, rgba(79,70,229,0.1) 50%, rgba(37,99,235,0.1) 100%)',
          }}
        />

        {/* Separator glass edge */}
        <div
          className="absolute top-0 bottom-0 right-0 w-[1px]"
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(139,92,246,0.3), rgba(59,130,246,0.2), transparent)' }}
        />

        <div className="relative z-10 flex flex-col justify-center p-16 w-full">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
            className="flex items-center gap-4 mb-12"
          >
            <div
              className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center"
              style={{ boxShadow: '0 0 30px rgba(139,92,246,0.5), 0 8px 24px rgba(0,0,0,0.3)' }}
            >
              <Zap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">SmartCampus</h1>
              <p className="text-slate-400 text-sm font-medium">Operations Hub</p>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
          >
            <h2 className="text-5xl font-extrabold leading-[1.1] mb-6 tracking-tight text-white">
              Modernizing<br />
              <span className="text-gradient">Campus</span><br />
              Operations
            </h2>
            <p className="text-slate-300 text-lg leading-relaxed max-w-sm mb-10">
              Manage facility bookings, maintenance tickets, and campus resources all in one intelligent platform.
            </p>
          </motion.div>

          {/* Feature Cards */}
          <div className="grid grid-cols-2 gap-3">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.08, type: 'spring', stiffness: 120, damping: 18 }}
                  className="p-4 rounded-2xl"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <Icon className={`w-5 h-5 ${feature.color} mb-2`} />
                  <p className="text-white text-sm font-semibold leading-tight">{feature.label}</p>
                  <p className="text-slate-500 text-xs mt-1">{feature.desc}</p>
                </motion.div>
              );
            })}
          </div>

          {/* AI badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-violet-300"
            style={{
              background: 'rgba(139,92,246,0.1)',
              border: '1px solid rgba(139,92,246,0.2)',
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Powered by 2026 AI Design System
          </motion.div>
        </div>
      </div>

      {/* ─── Right Form ──────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        <AnimatedBackground intensity="subtle" />

        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:hidden flex items-center gap-3 mb-8 justify-center"
          >
            <div
              className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center"
              style={{ boxShadow: '0 0 20px rgba(139,92,246,0.4)' }}
            >
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gradient">SmartCampus Hub</h1>
          </motion.div>

          {/* Success Animation */}
          {success && (
            <motion.div
              variants={celebrationVariants}
              initial="hidden"
              animate="visible"
              className="absolute inset-0 flex items-center justify-center z-50"
            >
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{
                  background: 'radial-gradient(circle, rgba(16,185,129,0.2), transparent)',
                  border: '2px solid rgba(16,185,129,0.5)',
                  boxShadow: '0 0 40px rgba(16,185,129,0.3)',
                }}
              >
                <span className="text-4xl">✓</span>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: success ? 0.3 : 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl p-8"
            style={{
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 8px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            {/* Tab switcher */}
            <div
              className="flex rounded-xl p-1 mb-7"
              style={{ background: 'rgba(0,0,0,0.2)' }}
            >
              {[{ id: true, label: 'Sign In' }, { id: false, label: 'Sign Up' }].map(tab => (
                <button
                  key={tab.label}
                  onClick={() => { setIsLogin(tab.id); setError(''); }}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                    isLogin === tab.id
                      ? 'text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  style={isLogin === tab.id ? {
                    background: 'rgba(139,92,246,0.25)',
                    boxShadow: '0 0 12px rgba(139,92,246,0.2)',
                  } : {}}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <h2 className="text-2xl font-bold text-white mb-1">
              {isLogin ? 'Welcome back 👋' : 'Create account'}
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              {isLogin ? 'Sign in to your SmartCampus account' : 'Get started with SmartCampus today'}
            </p>

            {/* Error Message */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key={shakeKey}
                  variants={errorShakeVariants}
                  initial="idle"
                  animate="shake"
                  className="mb-5 p-4 rounded-xl text-sm text-rose-300 font-medium"
                  style={{
                    background: 'rgba(244,63,94,0.1)',
                    border: '1px solid rgba(244,63,94,0.25)',
                  }}
                >
                  ⚠️ {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence>
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="glass-input w-full pl-11 pr-4 py-3 rounded-xl text-sm"
                        placeholder="Enter your name"
                        required={!isLogin}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="glass-input w-full pl-11 pr-4 py-3 rounded-xl text-sm"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="glass-input w-full pl-11 pr-12 py-3 rounded-xl text-sm"
                    placeholder="Enter your password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <NeuButton
                type="submit"
                loading={loading}
                variant="primary"
                size="md"
                fullWidth
                icon={<ArrowRight className="w-4 h-4" />}
                iconPosition="right"
                className="mt-2"
              >
                {isLogin ? 'Sign In' : 'Create Account'}
              </NeuButton>
            </form>

            {/* Quick Demo Login */}
            <div className="mt-7 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-xs text-slate-500 text-center mb-4 font-medium">⚡ Quick Demo Login</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { role: 'admin', label: 'Admin', icon: Shield, color: 'rgba(139,92,246,0.2)', border: 'rgba(139,92,246,0.3)', text: 'text-violet-300' },
                  { role: 'technician', label: 'Tech', icon: Wrench, color: 'rgba(245,158,11,0.2)', border: 'rgba(245,158,11,0.3)', text: 'text-amber-300' },
                  { role: 'user', label: 'User', icon: User, color: 'rgba(59,130,246,0.2)', border: 'rgba(59,130,246,0.3)', text: 'text-blue-300' },
                ].map(({ role, label, icon: Icon, color, border, text }) => (
                  <motion.button
                    key={role}
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => quickLogin(role)}
                    disabled={loading}
                    className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-xs font-semibold ${text} transition-all disabled:opacity-50`}
                    style={{ background: color, border: `1px solid ${border}` }}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

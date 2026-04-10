import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { authApi } from '@/lib/api';
import { ArrowLeft, Mail, Lock, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import NeuButton from '@/components/NeuButton';

type Step = 'email' | 'otp' | 'password' | 'success';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleRequestOtp = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authApi.requestPasswordReset(email);
      setOtpSent(true);
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setError('Please enter the OTP');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authApi.verifyOtp(email, otp);
      setStep('password');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError('Please enter password in both fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authApi.resetPassword(email, otp, newPassword);
      setStep('success');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: 'linear-gradient(135deg, #000a28 0%, #1a0b3f 100%)' }}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md"
      >
        {/* Back Button */}
        <motion.button
          variants={itemVariants}
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 mb-8 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </motion.button>

        {/* Card */}
        <motion.div
          variants={itemVariants}
          className="rounded-3xl p-8"
          style={{
            background: 'rgba(20, 10, 50, 0.95)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', boxShadow: '0 0 16px rgba(139,92,246,0.4)' }}
            >
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Reset Password</h1>
              <p className="text-sm text-slate-400 mt-0.5">Recover access to your account</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* Email Step */}
            {step === 'email' && (
              <motion.div key="email" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-2">We'll send a one-time password (OTP) to this email</p>
                </div>

                {error && (
                  <motion.div className="flex items-center gap-2 p-3 rounded-lg bg-rose-400/10 border border-rose-400/20">
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <p className="text-sm text-rose-300 font-medium">{error}</p>
                  </motion.div>
                )}

                <NeuButton onClick={handleRequestOtp} loading={loading} variant="primary" fullWidth>
                  Send OTP
                </NeuButton>
              </motion.div>
            )}

            {/* OTP Step */}
            {step === 'otp' && (
              <motion.div key="otp" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Enter OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-4 py-3 text-center text-2xl tracking-widest font-mono bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
                  />
                  <p className="text-xs text-slate-400 mt-2">Check your email for the 6-digit OTP (expires in 5 minutes)</p>
                </div>

                {error && (
                  <motion.div className="flex items-center gap-2 p-3 rounded-lg bg-rose-400/10 border border-rose-400/20">
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <p className="text-sm text-rose-300 font-medium">{error}</p>
                  </motion.div>
                )}

                <NeuButton onClick={handleVerifyOtp} loading={loading} variant="primary" fullWidth>
                  Verify OTP
                </NeuButton>

                <button
                  onClick={() => {
                    setStep('email');
                    setOtp('');
                    setError('');
                  }}
                  className="w-full py-2 text-sm text-slate-400 hover:text-slate-300 transition-colors font-medium"
                >
                  Didn't receive OTP? Go back
                </button>
              </motion.div>
            )}

            {/* Password Step */}
            {step === 'password' && (
              <motion.div key="password" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
                  />
                  <p className="text-xs text-slate-400 mt-2">Must be at least 6 characters long</p>
                </div>

                {error && (
                  <motion.div className="flex items-center gap-2 p-3 rounded-lg bg-rose-400/10 border border-rose-400/20">
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <p className="text-sm text-rose-300 font-medium">{error}</p>
                  </motion.div>
                )}

                <NeuButton onClick={handleResetPassword} loading={loading} variant="primary" fullWidth>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </NeuButton>
              </motion.div>
            )}

            {/* Success Step */}
            {step === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="space-y-6 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }} className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center" style={{ boxShadow: '0 0 24px rgba(16,185,129,0.4)' }}>
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                </motion.div>

                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Password Reset Successful!</h2>
                  <p className="text-sm text-slate-400">Your password has been updated. You can now log in with your new password.</p>
                </div>

                <NeuButton onClick={() => navigate('/login')} variant="primary" fullWidth>
                  Back to Login
                </NeuButton>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

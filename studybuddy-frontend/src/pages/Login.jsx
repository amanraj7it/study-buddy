import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Sparkles,
  Lock,
  User,
  Mail,
  ArrowRight,
  Database,
  CheckCircle2,
  KeyRound,
  AlertCircle,
  X,
  RotateCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToast } from '../context/ToastContext';
import { api } from '../api/api';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState('email'); // 'email' | 'otp'
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const { login, seedDemo } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!username.trim()) errs.username = 'Username or email is required';
    if (!password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      await login(username.trim(), password);
      const formattedName = username.trim().charAt(0).toUpperCase() + username.trim().slice(1);
      toast.success(`Welcome back, ${formattedName}!`);
      navigate('/dashboard');
    } catch (err) {
      setErrors({ form: err.message || 'Invalid username or password' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    setErrors({});
    try {
      await seedDemo();
      toast.success('Demo environment loaded successfully!');
      navigate('/dashboard');
    } catch (err) {
      setErrors({ form: err.message || 'Could not seed demo account' });
    } finally {
      setIsSeeding(false);
    }
  };

  // Forgot password step 1: Request OTP
  const handleRequestResetOtp = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError('Please enter your registered email address');
      return;
    }

    setForgotLoading(true);
    setForgotError('');

    try {
      await api.auth.forgotPassword({ email: forgotEmail.trim().toLowerCase() });
      toast.info(`Reset code sent to ${forgotEmail.trim()}`);
      setForgotStep('otp');
    } catch (err) {
      setForgotError(err.message || 'Failed to send reset code');
    } finally {
      setForgotLoading(false);
    }
  };

  // Forgot password step 2: Verify OTP & set new password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!forgotOtp.trim() || forgotOtp.trim().length !== 6) {
      setForgotError('Please enter the 6-digit OTP code');
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      setForgotError('New password must be at least 4 characters');
      return;
    }

    setForgotLoading(true);
    setForgotError('');

    try {
      await api.auth.resetPassword({
        email: forgotEmail.trim().toLowerCase(),
        otp: forgotOtp.trim(),
        new_password: newPassword,
      });
      toast.success('Password reset successfully! Please sign in with your new password.');
      setShowForgotModal(false);
      setForgotStep('email');
      setForgotEmail('');
      setForgotOtp('');
      setNewPassword('');
    } catch (err) {
      setForgotError(err.message || 'Failed to reset password');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09070F] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#8B5CF6]/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-[#6D28D9]/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-md"
      >
        {/* Brand Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] text-white shadow-xl shadow-[#8B5CF6]/25 mb-4 ring-1 ring-[#A78BFA]/30">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-[#F5F3F7]">
            StudyBuddy
          </h1>
          <p className="text-xs sm:text-sm text-[#8F889D] mt-1">
            Focus, organize, and accelerate your academic journey
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-[#11101A] border border-[#292332] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-[#F5F3F7] mb-1">Sign In</h2>
          <p className="text-xs text-[#8F889D] mb-6">
            Enter your credentials to access your study hub.
          </p>

          {errors.form && (
            <div className="p-3.5 rounded-xl bg-[#F87171]/15 border border-[#F87171]/30 text-[#F87171] text-xs mb-5 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Username or Email"
              icon={User}
              placeholder="e.g. demo or alex@gmail.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={errors.username}
              autoComplete="username"
              required
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-[#ACA5B8]">Password</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(true);
                    setForgotStep('email');
                    setForgotError('');
                  }}
                  className="text-xs text-[#A78BFA] hover:text-[#C4B5FD] transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <Input
                type="password"
                icon={Lock}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                autoComplete="current-password"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Seed Demo Action */}
          <div className="mt-6 pt-5 border-t border-[#1F1A28]">
            <button
              type="button"
              onClick={handleSeedDemo}
              disabled={isSeeding}
              className="w-full py-2.5 px-4 rounded-xl bg-[#171421] hover:bg-[#1F1A28] border border-[#8B5CF6]/30 hover:border-[#8B5CF6] text-xs font-semibold text-[#A78BFA] flex items-center justify-center gap-2 transition-all cursor-pointer group shadow-sm disabled:opacity-50"
            >
              <Database className="w-4 h-4 text-[#8B5CF6] group-hover:scale-110 transition-transform" />
              <span>{isSeeding ? 'Seeding Demo Data...' : '⚡ Seed Demo Data & Auto Login'}</span>
            </button>
            <p className="text-[11px] text-[#645E73] text-center mt-2">
              Populates sample subjects, calculus tasks, notes, and study schedules.
            </p>
          </div>

          {/* Footer Link */}
          <div className="mt-6 text-center text-xs text-[#8F889D]">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-[#A78BFA] hover:text-white font-medium hover:underline transition-colors"
            >
              Create an account
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ================= FORGOT PASSWORD MODAL ================= */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#11101A] border border-[#292332] rounded-3xl p-6 sm:p-7 shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="absolute top-5 right-5 text-[#8F889D] hover:text-[#F5F3F7] p-1 rounded-lg hover:bg-[#1F1A28] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[#A78BFA]">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#F5F3F7]">Reset Password</h3>
                  <p className="text-xs text-[#8F889D]">
                    {forgotStep === 'email' ? 'Enter email to receive reset code' : 'Verify code and set new password'}
                  </p>
                </div>
              </div>

              {forgotError && (
                <div className="p-3 rounded-xl bg-[#F87171]/15 border border-[#F87171]/30 text-[#F87171] text-xs mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{forgotError}</span>
                </div>
              )}

              {forgotStep === 'email' ? (
                <form onSubmit={handleRequestResetOtp} className="space-y-4">
                  <Input
                    label="Registered Gmail Address"
                    type="email"
                    icon={Mail}
                    placeholder="e.g. yourname@gmail.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full"
                    isLoading={forgotLoading}
                  >
                    <span>Send Reset OTP Code</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <p className="text-xs text-[#ACA5B8]">
                    We sent a 6-digit code to <strong className="text-[#A78BFA]">{forgotEmail}</strong>
                  </p>
                  <Input
                    label="6-Digit OTP Code"
                    icon={KeyRound}
                    placeholder="e.g. 123456"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                  />
                  <Input
                    label="New Password (min 4 chars)"
                    type="password"
                    icon={Lock}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      onClick={() => setForgotStep('email')}
                      className="w-1/3"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      className="w-2/3"
                      isLoading={forgotLoading}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      <span>Set Password</span>
                    </Button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

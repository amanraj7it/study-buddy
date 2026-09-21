import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Sparkles,
  Lock,
  User,
  Mail,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Pencil,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToast } from '../context/ToastContext';

export function Register() {
  // Step state: 'form' | 'otp'
  const [step, setStep] = useState('form');

  // Form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // OTP state
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [devModeNotice, setDevModeNotice] = useState(false);

  // Common state
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const otpInputRefs = useRef([]);
  const { sendRegistrationOtp, verifyRegistrationOtp, resendRegistrationOtp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Handle countdown for resend button
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus first OTP digit input when entering OTP step
  useEffect(() => {
    if (step === 'otp' && otpInputRefs.current[0]) {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  const validateEmail = (val) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(val);
  };

  const validateForm = () => {
    const errs = {};
    if (!username.trim()) {
      errs.username = 'Username is required';
    } else if (username.trim().length < 3) {
      errs.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(username.trim())) {
      errs.username = 'Username can only contain letters, numbers, and underscores';
    }

    if (!email.trim()) {
      errs.email = 'Email is required for verification';
    } else if (!validateEmail(email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 4) {
      errs.password = 'Password must be at least 4 characters';
    }

    if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 1: Request OTP and validate fields
  const handleInitiateRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const res = await sendRegistrationOtp(
        username.trim(),
        email.trim().toLowerCase(),
        password
      );
      setDevModeNotice(!!res.dev_mode);
      setResendCooldown(30);
      setStep('otp');
      toast.info(`Verification code sent to ${email.trim()}`);
    } catch (err) {
      setErrors({ form: err.message || 'Failed to initiate registration' });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Handle OTP input changes
  const handleOtpDigitChange = (index, value) => {
    // Only accept numeric inputs
    const cleanVal = value.replace(/\D/g, '');

    if (!cleanVal) {
      const updated = [...otpDigits];
      updated[index] = '';
      setOtpDigits(updated);
      return;
    }

    const digit = cleanVal.slice(-1);
    const updated = [...otpDigits];
    updated[index] = digit;
    setOtpDigits(updated);

    // Auto move focus to next input
    if (index < 5 && otpInputRefs.current[index + 1]) {
      otpInputRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0 && otpInputRefs.current[index - 1]) {
        otpInputRefs.current[index - 1].focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    const numbersOnly = pastedData.replace(/\D/g, '').slice(0, 6);
    if (!numbersOnly) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = numbersOnly[i] || '';
    }
    setOtpDigits(newDigits);

    const focusIdx = Math.min(numbersOnly.length, 5);
    otpInputRefs.current[focusIdx]?.focus();
  };

  // Step 2: Verify OTP and save account to database
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length !== 6) {
      setErrors({ otp: 'Please enter the complete 6-digit code' });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await verifyRegistrationOtp(email.trim().toLowerCase(), enteredOtp);
      toast.success(`Welcome to StudyBuddy, ${username}! Account created.`);
      navigate('/dashboard');
    } catch (err) {
      setErrors({ otp: err.message || 'Invalid or expired verification code' });
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    setErrors({});

    try {
      await resendRegistrationOtp(email.trim().toLowerCase());
      setResendCooldown(30);
      toast.success('A fresh verification code has been sent!');
      setOtpDigits(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } catch (err) {
      setErrors({ otp: err.message || 'Could not resend code' });
    } finally {
      setIsResending(false);
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
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] text-white shadow-xl shadow-[#8B5CF6]/25 mb-4 ring-1 ring-[#A78BFA]/30">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-[#F5F3F7]">
            StudyBuddy
          </h1>
          <p className="text-xs sm:text-sm text-[#8F889D] mt-1">
            Create your verified account to start organizing your studies
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-[#11101A] border border-[#292332] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <AnimatePresence mode="wait">
            {step === 'form' ? (
              /* ================= STEP 1: INITIAL REGISTRATION FORM ================= */
              <motion.div
                key="step-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-lg font-semibold text-[#F5F3F7]">Create Account</h2>
                  <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/30">
                    Step 1 of 2
                  </span>
                </div>
                <p className="text-xs text-[#8F889D] mb-5">
                  Enter your details. We'll send an OTP to verify your email.
                </p>

                {errors.form && (
                  <div className="p-3.5 rounded-xl bg-[#F87171]/15 border border-[#F87171]/30 text-[#F87171] text-xs mb-5 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{errors.form}</span>
                  </div>
                )}

                <form onSubmit={handleInitiateRegister} className="space-y-4">
                  <Input
                    label="Username"
                    icon={User}
                    placeholder="e.g. alex_study"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    error={errors.username}
                    autoComplete="username"
                    required
                  />

                  <Input
                    label="Email Address"
                    type="email"
                    icon={Mail}
                    placeholder="e.g. alex@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={errors.email}
                    autoComplete="email"
                    required
                  />

                  <Input
                    label="Password (min 4 chars)"
                    type="password"
                    icon={Lock}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={errors.password}
                    autoComplete="new-password"
                    required
                  />

                  <Input
                    label="Confirm Password"
                    type="password"
                    icon={Lock}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={errors.confirmPassword}
                    autoComplete="new-password"
                    required
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full mt-2"
                    isLoading={isLoading}
                  >
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </form>

                {/* Footer Link */}
                <div className="mt-6 text-center text-xs text-[#8F889D] pt-4 border-t border-[#1F1A28]">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="text-[#A78BFA] hover:text-white font-medium hover:underline transition-colors"
                  >
                    Sign In
                  </Link>
                </div>
              </motion.div>
            ) : (
              /* ================= STEP 2: OTP VERIFICATION ================= */
              <motion.div
                key="step-otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('form');
                      setErrors({});
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-[#8F889D] hover:text-[#F5F3F7] transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to edit details</span>
                  </button>
                  <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/30">
                    Step 2 of 2
                  </span>
                </div>

                <div className="text-center mb-5">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#A78BFA] mb-3 shadow-inner">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <h2 className="text-lg font-semibold text-[#F5F3F7]">Enter Verification Code</h2>
                  <p className="text-xs text-[#8F889D] mt-1">
                    We sent a 6-digit OTP code to{' '}
                    <span className="text-[#A78BFA] font-medium break-all">{email}</span>
                  </p>
                </div>

                {devModeNotice && (
                  <div className="p-3 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/25 text-[#C4B5FD] text-[11px] mb-4 leading-relaxed">
                    💡 <strong>SMTP Note:</strong> Live email sending is active. If test environment SMTP credentials are empty in <code>.env</code>, check your backend terminal for the logged OTP code!
                  </div>
                )}

                {errors.otp && (
                  <div className="p-3.5 rounded-xl bg-[#F87171]/15 border border-[#F87171]/30 text-[#F87171] text-xs mb-4 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{errors.otp}</span>
                  </div>
                )}

                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  {/* 6 OTP Digit Inputs */}
                  <div className="flex justify-between gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpInputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-mono font-bold rounded-xl bg-[#171421] border text-[#F5F3F7] transition-all outline-none ${
                          digit
                            ? 'border-[#8B5CF6] shadow-[0_0_12px_rgba(139,92,246,0.3)]'
                            : 'border-[#292332] focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]'
                        }`}
                        autoComplete="one-time-code"
                      />
                    ))}
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full"
                    isLoading={isLoading}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    <span>Verify & Create Account</span>
                  </Button>
                </form>

                {/* Resend Code Section */}
                <div className="mt-5 pt-4 border-t border-[#1F1A28] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                  <span className="text-[#8F889D]">Didn't receive the code?</span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || isResending}
                    className="text-[#A78BFA] hover:text-white font-medium disabled:text-[#645E73] disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                    {resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : isResending
                      ? 'Sending...'
                      : 'Resend Code'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

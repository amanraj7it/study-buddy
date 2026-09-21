import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Check,
  Sparkles,
  HeartHandshake,
  Zap,
  CreditCard,
  QrCode,
  School,
  Lock,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { api } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fireMiniBurst } from '../utils/confetti';

export function Subscription() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [currentTier, setCurrentTier] = useState(user?.tier || 'free');
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const res = await api.subscription.getStatus();
      if (res.success) {
        setCurrentTier(res.data.current_tier);
        setTiers(res.data.tiers);
      }
    } catch (e) {
      console.warn('Subscription status fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleMockUpgrade = async () => {
    setIsProcessing(true);
    try {
      // Simulate 1s realistic payment gateway processing
      await new Promise((resolve) => setTimeout(resolve, 800));
      const res = await api.subscription.upgrade();
      if (res.success) {
        setCurrentTier('supporter');
        setShowCheckoutModal(false);
        fireMiniBurst();
        toast.success('Congratulations! Upgraded to Supporter Tier 🎉');
        window.dispatchEvent(new CustomEvent('studybuddy:data-changed'));
      }
    } catch (err) {
      toast.error('Could not complete upgrade');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#8B5CF6]/20 via-[#10B981]/20 to-[#11101A] border border-[#8B5CF6]/30 p-6 md:p-8 text-center space-y-3">
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/30 uppercase tracking-wider inline-block">
          Freemium + Low-Cost Sustainability
        </span>
        <h1 className="text-2xl md:text-4xl font-display font-bold text-[#F5F3F7]">
          Quality After-School Support for Every Child
        </h1>
        <p className="text-xs md:text-sm text-[#8F889D] max-w-2xl mx-auto leading-relaxed">
          Education Chest is built on a mission to eliminate tuition inequality.
          All foundational learning features are <span className="text-[#34D399] font-bold">100% Free Forever</span>.
          Our low-cost supporter tier helps fund access for underprivileged schools.
        </p>
      </div>

      {/* Plan Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Tier 1: 100% Free Community Tier */}
        <div className="p-6 rounded-2xl bg-[#11101A] border-2 border-[#10B981]/50 space-y-6 relative flex flex-col justify-between shadow-xl">
          <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full text-[10px] font-bold bg-[#10B981] text-black uppercase tracking-wider shadow-md">
            Core Social Impact
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold text-[#10B981] uppercase tracking-wider">
                Community Tier
              </span>
              <h2 className="text-2xl font-bold text-[#F5F3F7] mt-1">100% Free Forever</h2>
              <p className="text-xs text-[#8F889D] mt-1">
                Because after-school learning guidance should never depend on family income.
              </p>
            </div>

            <div className="pt-2 border-t border-[#292332] space-y-2.5">
              {[
                'Unlimited AI Step-by-Step Homework Solvers',
                'Join & Create Free Peer Study Circles',
                'Personal Doubt Journal with Mastery Tracking',
                'Adaptive Exam & Weak-Topic Timetable Planner',
                'Multilingual Parent Dashboard & 1-Click WhatsApp Sharing',
                'Offline-Tolerant Local Storage Cache',
                'Earn Badges & Peer Tutor Reputation'
              ].map((feat, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs text-[#F5F3F7]">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            disabled
            className="w-full py-2.5 rounded-xl bg-[#171421] text-[#10B981] border border-[#10B981]/30 font-semibold text-xs text-center cursor-default"
          >
            ✓ Active Forever (Free Tier)
          </button>
        </div>

        {/* Tier 2: Supporter / School Sponsor Tier */}
        <div className="p-6 rounded-2xl bg-[#11101A] border-2 border-[#8B5CF6]/50 space-y-6 relative flex flex-col justify-between shadow-xl">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold text-[#8B5CF6] uppercase tracking-wider">
                Supporter / School Sponsor Tier
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <h2 className="text-2xl font-bold text-[#F5F3F7]">₹99</h2>
                <span className="text-xs text-[#8F889D]">/ month (~$1.20)</span>
              </div>
              <p className="text-xs text-[#8F889D] mt-1">
                Sponsor a child's learning or unlock deep AI voice mentoring and offline PDF exports.
              </p>
            </div>

            <div className="pt-2 border-t border-[#292332] space-y-2.5">
              {[
                'Everything included in Free Community Tier',
                '1-on-1 Interactive AI Voice Homework Companion',
                'Offline Full-Pack PDF Doubt Journal & Flashcard Export',
                'School & NGO Batch Progress Verification Reports',
                'Supporter Badge on Community Leaderboard'
              ].map((feat, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs text-[#F5F3F7]">
                  <Sparkles className="w-4 h-4 text-[#8B5CF6] shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {currentTier === 'supporter' ? (
            <button
              disabled
              className="w-full py-2.5 rounded-xl bg-[#8B5CF6]/20 text-[#C4B5FD] border border-[#8B5CF6]/40 font-semibold text-xs text-center cursor-default"
            >
              ⭐ You are an Education Chest Supporter!
            </button>
          ) : (
            <button
              onClick={() => setShowCheckoutModal(true)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] hover:from-[#7C3AED] hover:to-[#5B21B6] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#8B5CF6]/20 transition-all cursor-pointer"
            >
              <span>Upgrade to Supporter (Demo Checkout)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* DEMO CHECKOUT MODAL */}
      <AnimatePresence>
        {showCheckoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#11101A] border border-[#292332] rounded-2xl p-6 space-y-5 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#F5F3F7]">
                    Mock Demo Checkout
                  </h3>
                  <p className="text-xs text-[#8F889D]">
                    Zero real payment needed for hackathon evaluation
                  </p>
                </div>
                <button
                  onClick={() => setShowCheckoutModal(false)}
                  className="p-1 text-[#8F889D] hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Amount Box */}
              <div className="p-4 rounded-xl bg-[#171421] border border-[#292332] flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#F5F3F7]">
                    Supporter / Sponsor Tier
                  </p>
                  <p className="text-[10px] text-[#8F889D]">Monthly contribution</p>
                </div>
                <span className="text-base font-bold text-[#34D399]">₹99 / mo</span>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-[#8F889D]">
                  Select Mock Payment Option
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'upi', label: 'UPI / QR', icon: QrCode },
                    { id: 'card', label: 'Debit Card', icon: CreditCard },
                    { id: 'school', label: 'NGO Sponsor', icon: School }
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-semibold cursor-pointer transition-all ${
                          paymentMethod === m.id
                            ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#C4B5FD]'
                            : 'bg-[#171421] border-[#292332] text-[#8F889D]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Security Badge */}
              <div className="flex items-center gap-2 text-[11px] text-[#645E73]">
                <Lock className="w-3.5 h-3.5" />
                <span>Simulated secure transaction for judges.</span>
              </div>

              {/* Complete Payment Button */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleMockUpgrade}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#10B981]/20 cursor-pointer disabled:opacity-50 transition-all"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Authorizing Mock Transaction...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Complete Demo Subscription</span>
                  </>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

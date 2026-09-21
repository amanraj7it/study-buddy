import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  HeartHandshake,
  Share2,
  Copy,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Smartphone,
  Globe,
  ExternalLink,
  MessageCircle,
  HelpCircle,
  Check
} from 'lucide-react';
import { api } from '../api/api';
import { useToast } from '../context/ToastContext';
import { fireMiniBurst } from '../utils/confetti';

export function ParentDashboard() {
  const { toast } = useToast();
  const [selectedLang, setSelectedLang] = useState('hi'); // Default Hindi for vernacular demo
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadReport(selectedLang);
  }, [selectedLang]);

  const loadReport = async (lang) => {
    setLoading(true);
    try {
      const res = await api.parentReport.get(lang);
      if (res.success) {
        setReportData(res.data);
      }
    } catch (err) {
      console.warn('Parent report fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopySMS = () => {
    if (!reportData?.report_text?.whatsapp_text) return;
    navigator.clipboard.writeText(reportData.report_text.whatsapp_text);
    setCopied(true);
    fireMiniBurst();
    toast.success('SMS / WhatsApp summary copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    if (!reportData?.whatsapp_url) return;
    window.open(reportData.whatsapp_url, '_blank');
  };

  const text = reportData?.report_text || {};

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#EC4899]/20 via-[#8B5CF6]/20 to-[#11101A] border border-[#EC4899]/30 p-6 md:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EC4899]/20 text-[#F472B6] border border-[#EC4899]/30 uppercase tracking-wider">
                Education Chest • Parent Connect
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#8B5CF6]/20 text-[#C4B5FD] border border-[#8B5CF6]/30">
                🌐 Vernacular & WhatsApp Ready
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-[#F5F3F7]">
              Parent Dashboard & Weekly Progress Report
            </h1>
            <p className="text-sm text-[#8F889D] max-w-2xl mt-1">
              Many parents cannot help with homework due to language barriers or lack of higher education.
              Education Chest translates your child's weekly consistency and growth into clear, non-intimidating
              reports in their own mother tongue.
            </p>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center gap-1.5 bg-[#171421] p-1.5 rounded-xl border border-[#292332] self-start md:self-auto">
            <Globe className="w-4 h-4 text-[#EC4899] ml-1 mr-0.5" />
            {(reportData?.available_languages || [
              { code: 'en', label: 'English' },
              { code: 'hi', label: 'हिंदी (Hindi)' },
              { code: 'mr', label: 'मराठी (Marathi)' },
              { code: 'es', label: 'Español' }
            ]).map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelectedLang(lang.code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  selectedLang === lang.code
                    ? 'bg-[#EC4899] text-white shadow-md shadow-[#EC4899]/20'
                    : 'text-[#8F889D] hover:text-[#F5F3F7]'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-[#8F889D]">
          Loading personalized weekly report...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Visual Report Card */}
          <div className="lg:col-span-8 space-y-5">
            <div className="p-6 rounded-2xl bg-[#11101A] border border-[#292332] space-y-6">
              {/* Title & Headline */}
              <div className="space-y-2 border-b border-[#292332] pb-4">
                <span className="text-xs font-mono text-[#F472B6]">
                  {text.title || 'Weekly Progress Report'}
                </span>
                <h2 className="text-xl font-display font-bold text-[#F5F3F7]">
                  {text.headline || 'Your child is making great progress!'}
                </h2>
              </div>

              {/* Big 4 Stat Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-[#171421] border border-[#292332] space-y-1">
                  <div className="flex items-center gap-1.5 text-[#8F889D] text-xs">
                    <Clock className="w-3.5 h-3.5 text-[#8B5CF6]" />
                    <span>{text.hours_label || 'Hours'}</span>
                  </div>
                  <p className="text-xl font-bold text-[#F5F3F7]">
                    {reportData?.study_hours || 0}h
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#171421] border border-[#292332] space-y-1">
                  <div className="flex items-center gap-1.5 text-[#8F889D] text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>{text.tasks_label || 'Tasks'}</span>
                  </div>
                  <p className="text-xl font-bold text-[#F5F3F7]">
                    {reportData?.completed_tasks || 0}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#171421] border border-[#292332] space-y-1">
                  <div className="flex items-center gap-1.5 text-[#8F889D] text-xs">
                    <HelpCircle className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>{text.doubts_label || 'Doubts'}</span>
                  </div>
                  <p className="text-xl font-bold text-[#F5F3F7]">
                    {reportData?.doubts_solved || 0}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#171421] border border-[#292332] space-y-1">
                  <div className="flex items-center gap-1.5 text-[#8F889D] text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-[#EC4899]" />
                    <span>{text.streak_label || 'Consistency'}</span>
                  </div>
                  <p className="text-xl font-bold text-[#F5F3F7]">
                    {reportData?.active_streak_days || 5} Days
                  </p>
                </div>
              </div>

              {/* Greatest Improvement Win Box */}
              <div className="p-4 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#34D399]">
                  <Sparkles className="w-4 h-4 text-[#10B981]" />
                  <span>{text.win_label || 'Key Achievement'}</span>
                </div>
                <p className="text-xs text-[#A7F3D0] leading-relaxed">
                  {text.win_text}
                </p>
              </div>

              {/* Weak Topics Needing Extra Support */}
              <div className="p-4 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#FBBF24]">
                  <AlertCircle className="w-4 h-4 text-[#F59E0B]" />
                  <span>{text.weak_label || 'Focus Areas for Extra Support'}</span>
                </div>
                <div className="space-y-1.5">
                  {(reportData?.weak_topics || []).map((t, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-[#FDE68A] bg-[#11101A]/60 p-2 rounded-lg border border-[#F59E0B]/20"
                    >
                      • {t}
                    </div>
                  ))}
                </div>
              </div>

              {/* Gentle Encouragement Tip for Parents */}
              <div className="p-4 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-[#C4B5FD]">
                  <HeartHandshake className="w-4 h-4 text-[#8B5CF6]" />
                  <span>Empowering Parents Without Homework Stress</span>
                </div>
                <p className="text-xs text-[#D8B4FE] leading-relaxed italic">
                  "{text.encouragement}"
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: WhatsApp / SMS Share Card Preview */}
          <div className="lg:col-span-4 space-y-5">
            <div className="p-5 rounded-2xl bg-[#11101A] border border-[#292332] space-y-4 sticky top-4">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#10B981]" />
                <h3 className="text-sm font-semibold text-[#F5F3F7]">
                  Instant WhatsApp & SMS Share
                </h3>
              </div>
              <p className="text-xs text-[#8F889D]">
                No app installation required for parents. Send them this summary directly on WhatsApp or SMS with 1 click:
              </p>

              {/* WhatsApp Message Preview Box */}
              <div className="p-4 rounded-2xl bg-[#064E3B]/25 border border-[#10B981]/30 text-xs font-sans text-[#D1FAE5] space-y-2 relative shadow-inner">
                <div className="flex items-center gap-1.5 text-[10px] text-[#34D399] font-mono">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Message Preview</span>
                </div>
                <pre className="font-sans whitespace-pre-wrap text-xs text-[#A7F3D0] leading-relaxed">
                  {text.whatsapp_text}
                </pre>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleOpenWhatsApp}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Share via WhatsApp</span>
                </button>

                <button
                  onClick={handleCopySMS}
                  className="w-full py-2 px-4 rounded-xl bg-[#171421] hover:bg-[#1F1A28] border border-[#292332] text-[#F5F3F7] text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#10B981]" />
                      <span className="text-[#10B981]">Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#8F889D]" />
                      <span>Copy SMS Text</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  BookOpen,
  Sparkles,
  Camera,
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Search,
  Filter,
  Trash2,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  WifiOff,
  Lightbulb,
  ArrowRight,
  GraduationCap
} from 'lucide-react';
import { api } from '../api/api';
import { useToast } from '../context/ToastContext';
import { offlineStorage } from '../utils/offlineStorage';
import { fireMiniBurst } from '../utils/confetti';

const SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'History',
  'Computer Science',
  'General Studies'
];

const SAMPLE_QUESTIONS = [
  {
    label: '📐 Solve: 3x + 5 = 20',
    subject: 'Mathematics',
    question: 'Solve for x step by step: 3x + 5 = 20. Explain the balancing method.'
  },
  {
    label: '🌌 Why is the sky blue?',
    subject: 'Physics',
    question: 'Why is the sky blue during the day and red at sunset? Explain Rayleigh scattering simply.'
  },
  {
    label: '⚡ Newton\'s Third Law',
    subject: 'Physics',
    question: 'State Newton\'s Third Law of Motion and give 2 real-life examples showing action and reaction pairs.'
  },
  {
    label: '🧪 Balance: C₃H₈ + O₂',
    subject: 'Chemistry',
    question: 'Balance the combustion reaction equation: C₃H₈ + O₂ → CO₂ + H₂O with step-by-step atom counting.'
  }
];

export function DoubtSolver() {
  const [activeTab, setActiveTab] = useState('ask'); // 'ask' | 'journal'
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [questionText, setQuestionText] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [isSolving, setIsSolving] = useState(false);
  const [currentSolution, setCurrentSolution] = useState(null);

  // Journal state
  const [journalDoubts, setJournalDoubts] = useState([]);
  const [journalLoading, setJournalLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDoubtId, setExpandedDoubtId] = useState(null);
  const [isOffline, setIsOffline] = useState(!offlineStorage.isOnline());

  const fileInputRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'journal') {
      loadJournal();
    }
  }, [activeTab, filterStatus, filterSubject]);

  const loadJournal = async () => {
    setJournalLoading(true);
    try {
      if (!navigator.onLine) {
        // Load from local storage cache
        const cached = offlineStorage.getCachedDoubts();
        setJournalDoubts(cached);
        return;
      }

      const res = await api.doubts.getAll({
        status: filterStatus !== 'all' ? filterStatus : undefined,
        subject: filterSubject !== 'all' ? filterSubject : undefined,
        search: searchQuery.trim() || undefined
      });
      if (res.success) {
        setJournalDoubts(res.data);
        offlineStorage.cacheDoubts(res.data);
      }
    } catch (err) {
      console.warn('Backend fetch failed, falling back to local storage', err);
      const cached = offlineStorage.getCachedDoubts();
      setJournalDoubts(cached);
    } finally {
      setJournalLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      toast.error('Image is too large. Please select a photo under 4MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
      toast.info('Homework photo attached! Ready to solve.');
    };
    reader.readAsDataURL(file);
  };

  const handleApplySample = (sample) => {
    setSelectedSubject(sample.subject);
    setQuestionText(sample.question);
    toast.info(`Loaded sample question for ${sample.subject}`);
  };

  const handleSolve = async () => {
    if (!questionText.trim() && !imagePreview) {
      toast.error('Please type a homework question or upload a photo.');
      return;
    }

    setIsSolving(true);
    setCurrentSolution(null);

    try {
      const res = await api.doubts.solve({
        question_text: questionText.trim(),
        subject: selectedSubject,
        image_base64: imagePreview,
        save_to_journal: true
      });

      if (res.success) {
        setCurrentSolution(res.data);
        fireMiniBurst();
        toast.success('Doubt solved step-by-step & saved to Doubt Journal!');
        // Update local cache if saved
        if (res.data.saved_doubt) {
          const cached = offlineStorage.getCachedDoubts();
          offlineStorage.cacheDoubts([res.data.saved_doubt, ...cached]);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Could not solve doubt. Please retry.');
    } finally {
      setIsSolving(false);
    }
  };

  const handleStatusToggle = async (doubtId, currentStatus) => {
    const nextStatus = currentStatus === 'mastered' ? 'needs_revision' : 'mastered';
    try {
      await api.doubts.updateStatus(doubtId, nextStatus);
      setJournalDoubts((prev) =>
        prev.map((d) => (d.id === doubtId ? { ...d, status: nextStatus } : d))
      );
      if (nextStatus === 'mastered') {
        fireMiniBurst();
        toast.success('Marked as Mastered! 🎉 Great progress!');
      } else {
        toast.info('Flagged for extra revision.');
      }
    } catch (err) {
      toast.error('Could not update status.');
    }
  };

  const handleDeleteDoubt = async (doubtId) => {
    try {
      await api.doubts.delete(doubtId);
      setJournalDoubts((prev) => prev.filter((d) => d.id !== doubtId));
      toast.info('Doubt removed from journal.');
    } catch (err) {
      toast.error('Could not delete doubt.');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#8B5CF6]/20 via-[#6D28D9]/20 to-[#11101A] border border-[#8B5CF6]/30 p-6 md:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#8B5CF6]/30 text-[#C4B5FD] border border-[#8B5CF6]/40 uppercase tracking-wider">
                Education Chest • Free After-School AI Tutor
              </span>
              {isOffline && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F59E0B]/20 text-[#FBBF24] border border-[#F59E0B]/30">
                  <WifiOff className="w-3 h-3" /> Offline Ready
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-[#F5F3F7]">
              Ask a Doubt & Personal Doubt Journal
            </h1>
            <p className="text-sm text-[#8F889D] max-w-2xl mt-1">
              No costly tuition needed. Upload a photo or type any homework question to get compassionate,
              step-by-step guidance—and save it to your revision journal.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('ask')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                activeTab === 'ask'
                  ? 'bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/30'
                  : 'bg-[#171421] text-[#8F889D] hover:text-white border border-[#292332]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask a Doubt</span>
            </button>
            <button
              onClick={() => setActiveTab('journal')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                activeTab === 'journal'
                  ? 'bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/30'
                  : 'bg-[#171421] text-[#8F889D] hover:text-white border border-[#292332]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Doubt Journal</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: ASK A DOUBT */}
      {activeTab === 'ask' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Input Form */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-[#11101A] border border-[#292332] rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-[#F5F3F7] flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#8B5CF6]" />
                <span>Describe Your Question</span>
              </h2>

              {/* Subject Selector */}
              <div>
                <label className="block text-xs font-medium text-[#8F889D] mb-1.5">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full bg-[#171421] border border-[#292332] rounded-xl px-3 py-2 text-xs text-[#F5F3F7] focus:outline-none focus:border-[#8B5CF6]"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Question Text Area */}
              <div>
                <label className="block text-xs font-medium text-[#8F889D] mb-1.5">
                  Type your question or problem statement
                </label>
                <textarea
                  rows={4}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="e.g. Solve 3x + 5 = 20, or Explain why the focal length of a concave lens is negative..."
                  className="w-full bg-[#171421] border border-[#292332] rounded-xl p-3 text-xs text-[#F5F3F7] placeholder-[#645E73] focus:outline-none focus:border-[#8B5CF6] resize-none"
                />
              </div>

              {/* Photo Upload Attachment */}
              <div>
                <label className="block text-xs font-medium text-[#8F889D] mb-1.5">
                  Or upload a photo of your textbook / notebook
                </label>

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {!imagePreview ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-[#292332] hover:border-[#8B5CF6]/50 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-xs text-[#8F889D] hover:text-[#C4B5FD] transition-all cursor-pointer bg-[#171421]/50"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/20 flex items-center justify-center text-[#8B5CF6]">
                      <Camera className="w-4 h-4" />
                    </div>
                    <span>Click to snap or upload homework photo</span>
                    <span className="text-[10px] text-[#645E73]">JPG, PNG, WEBP up to 4MB</span>
                  </button>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-[#8B5CF6]/40 bg-[#171421] p-2">
                    <img
                      src={imagePreview}
                      alt="Homework snippet"
                      className="w-full h-32 object-contain rounded-lg bg-[#09070F]"
                    />
                    <button
                      type="button"
                      onClick={() => setImagePreview(null)}
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-[#09070F]/80 text-[#F87171] hover:bg-[#F87171] hover:text-white transition-all cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Sample Prompts */}
              <div>
                <label className="block text-[11px] font-semibold text-[#645E73] uppercase tracking-wider mb-2">
                  ⚡ 1-Click Demo Samples (For Judges)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SAMPLE_QUESTIONS.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplySample(s)}
                      className="text-left p-2 rounded-xl bg-[#171421] hover:bg-[#8B5CF6]/15 border border-[#292332] hover:border-[#8B5CF6]/30 text-[11px] text-[#C4B5FD] truncate transition-all cursor-pointer"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Solve Button */}
              <button
                type="button"
                disabled={isSolving}
                onClick={handleSolve}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] hover:from-[#7C3AED] hover:to-[#5B21B6] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#8B5CF6]/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSolving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing & Breaking Down Steps...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Solve Step-by-Step with AI Tutor</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Solution Viewer */}
          <div className="lg:col-span-7">
            {currentSolution ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#11101A] border border-[#8B5CF6]/40 rounded-2xl p-6 space-y-6 shadow-xl"
              >
                {/* Solution Header */}
                <div className="flex items-start justify-between gap-4 border-b border-[#292332] pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/30 uppercase tracking-wider">
                        Verified Step-by-Step Solution
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/30 capitalize">
                        {currentSolution.difficulty || 'Medium'}
                      </span>
                    </div>
                    <h3 className="text-lg font-display font-bold text-[#F5F3F7]">
                      {currentSolution.title}
                    </h3>
                  </div>

                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-[#171421] text-[#8F889D] border border-[#292332]">
                    Saved to Journal
                  </span>
                </div>

                {/* Steps List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-[#8F889D] uppercase tracking-wider">
                    Step-by-Step Breakdown:
                  </h4>
                  {(currentSolution.steps || []).map((step, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-[#171421] border border-[#292332] space-y-1.5 relative pl-12"
                    >
                      <div className="absolute left-3.5 top-4 w-6 h-6 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-xs font-bold text-[#C4B5FD]">
                        {step.step_number || idx + 1}
                      </div>
                      <h5 className="text-xs font-semibold text-[#F5F3F7]">
                        {step.heading}
                      </h5>
                      <p className="text-xs text-[#8F889D] leading-relaxed whitespace-pre-line">
                        {step.explanation}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Why This Works (Conceptual Intuition) */}
                {currentSolution.concept_summary && (
                  <div className="p-4 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#C4B5FD]">
                      <Lightbulb className="w-4 h-4 text-[#F59E0B]" />
                      <span>Why This Works (Core Intuition)</span>
                    </div>
                    <p className="text-xs text-[#D8B4FE] leading-relaxed">
                      {currentSolution.concept_summary}
                    </p>
                  </div>
                )}

                {/* Active Recall Practice Question */}
                {currentSolution.practice_question && (
                  <div className="p-4 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#34D399]">
                      <GraduationCap className="w-4 h-4 text-[#10B981]" />
                      <span>Try a Similar Question (Active Recall)</span>
                    </div>
                    <p className="text-xs text-[#A7F3D0] leading-relaxed">
                      {currentSolution.practice_question}
                    </p>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="h-full min-h-[380px] rounded-2xl bg-[#11101A] border border-[#292332] flex flex-col items-center justify-center p-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 flex items-center justify-center text-[#8B5CF6]">
                  <BrainCircuit className="w-7 h-7" />
                </div>
                <h3 className="text-base font-semibold text-[#F5F3F7]">
                  Ready to Solve Your Doubts
                </h3>
                <p className="text-xs text-[#8F889D] max-w-sm">
                  Select a subject, type your problem or snap a photo of your textbook, and click
                  "Solve Step-by-Step" to receive a clear, student-friendly explanation.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PERSONAL DOUBT JOURNAL */}
      {activeTab === 'journal' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-[#11101A] border border-[#292332] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md bg-[#171421] border border-[#292332] rounded-xl px-3 py-2 text-xs">
              <Search className="w-3.5 h-3.5 text-[#8F889D]" />
              <input
                type="text"
                placeholder="Search doubt questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadJournal()}
                className="bg-transparent text-xs text-[#F5F3F7] placeholder-[#645E73] focus:outline-none w-full"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Status Filter */}
              <div className="flex items-center bg-[#171421] border border-[#292332] rounded-xl p-0.5 text-xs">
                {['all', 'needs_revision', 'mastered'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-2.5 py-1 rounded-lg capitalize cursor-pointer transition-all ${
                      filterStatus === st
                        ? 'bg-[#8B5CF6] text-white font-semibold'
                        : 'text-[#8F889D] hover:text-[#F5F3F7]'
                    }`}
                  >
                    {st === 'all' ? 'All Doubts' : st.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* Subject Filter */}
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="bg-[#171421] border border-[#292332] rounded-xl px-2.5 py-1.5 text-xs text-[#F5F3F7] focus:outline-none"
              >
                <option value="all">All Subjects</option>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Doubt List */}
          {journalLoading ? (
            <div className="p-12 text-center text-xs text-[#8F889D]">
              Loading your Doubt Journal...
            </div>
          ) : journalDoubts.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#11101A] border border-[#292332] space-y-2">
              <BookOpen className="w-8 h-8 text-[#8B5CF6] mx-auto" />
              <h4 className="text-sm font-semibold text-[#F5F3F7]">Your Journal is Empty</h4>
              <p className="text-xs text-[#8F889D] max-w-sm mx-auto">
                Solved homework questions automatically save here so you can review weak topics
                before exams. Ask your first doubt above!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {journalDoubts.map((doubt) => {
                const isExpanded = expandedDoubtId === doubt.id;
                const isMastered = doubt.status === 'mastered';

                return (
                  <div
                    key={doubt.id}
                    className="p-5 rounded-2xl bg-[#11101A] border border-[#292332] hover:border-[#8B5CF6]/30 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/30">
                            {doubt.subject_name || 'General'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                              isMastered
                                ? 'bg-[#10B981]/15 text-[#34D399] border-[#10B981]/30'
                                : 'bg-[#F59E0B]/15 text-[#FBBF24] border-[#F59E0B]/30'
                            }`}
                          >
                            {isMastered ? '✓ Mastered' : '⚡ Needs Revision'}
                          </span>
                          <span className="text-[10px] text-[#645E73]">
                            {new Date(doubt.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-[#F5F3F7]">
                          {doubt.title}
                        </h4>
                        <p className="text-xs text-[#8F889D] line-clamp-2">
                          {doubt.question_text}
                        </p>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleStatusToggle(doubt.id, doubt.status)}
                          title={isMastered ? 'Mark for Revision' : 'Mark as Mastered'}
                          className={`p-2 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-all border ${
                            isMastered
                              ? 'bg-[#10B981]/15 text-[#34D399] border-[#10B981]/30 hover:bg-[#10B981]/25'
                              : 'bg-[#171421] text-[#8F889D] border-[#292332] hover:text-[#34D399]'
                          }`}
                        >
                          <BookmarkCheck className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">
                            {isMastered ? 'Mastered' : 'Mark Mastered'}
                          </span>
                        </button>

                        <button
                          onClick={() => setExpandedDoubtId(isExpanded ? null : doubt.id)}
                          className="p-2 rounded-xl bg-[#171421] text-[#8F889D] hover:text-white border border-[#292332] cursor-pointer"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() => handleDeleteDoubt(doubt.id)}
                          title="Delete from journal"
                          className="p-2 rounded-xl bg-[#171421] text-[#8F889D] hover:text-[#F87171] border border-[#292332] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Steps View */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pt-3 border-t border-[#292332] space-y-3 overflow-hidden"
                        >
                          <div className="space-y-2">
                            {(doubt.steps || []).map((step, idx) => (
                              <div
                                key={idx}
                                className="p-3 rounded-xl bg-[#171421] text-xs space-y-1"
                              >
                                <span className="font-semibold text-[#C4B5FD]">
                                  Step {step.step_number || idx + 1}: {step.heading}
                                </span>
                                <p className="text-[#8F889D] whitespace-pre-line">
                                  {step.explanation}
                                </p>
                              </div>
                            ))}
                          </div>

                          {doubt.concept_summary && (
                            <div className="p-3 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-xs text-[#D8B4FE]">
                              💡 <span className="font-semibold">Intuition:</span>{' '}
                              {doubt.concept_summary}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

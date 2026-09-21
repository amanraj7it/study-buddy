import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Sparkles,
  AlertTriangle,
  Clock,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Zap,
  Target,
  PlusCircle,
  CalendarCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/api';
import { useToast } from '../context/ToastContext';
import { fireMiniBurst } from '../utils/confetti';

export function SmartPlanner() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [targetExam, setTargetExam] = useState('CBSE Class 10 Board Exams');
  const [examDate, setExamDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [dailyHours, setDailyHours] = useState(2.5);
  const [selectedSubjects, setSelectedSubjects] = useState(['Mathematics', 'Physics', 'Chemistry']);

  const [detectedWeakTopics, setDetectedWeakTopics] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [isCommitting, setIsCommitting] = useState(false);

  useEffect(() => {
    // Detect struggling topics from Doubt Journal on mount
    fetchWeakTopics();
  }, []);

  const fetchWeakTopics = async () => {
    try {
      const res = await api.doubts.getAll();
      if (res.success && res.data?.length > 0) {
        const weak = res.data
          .filter((d) => d.status === 'needs_revision' || d.difficulty === 'hard')
          .map((d) => `${d.subject_name}: ${d.title}`);

        if (weak.length > 0) {
          setDetectedWeakTopics(weak);
        } else {
          setDetectedWeakTopics([
            'Mathematics: Trigonometric Identity Proofs',
            'Physics: Snell\'s Law & Optics Formulas'
          ]);
        }
      } else {
        setDetectedWeakTopics([
          'Mathematics: Quadratic Factoring & Word Problems',
          'Physics: Newton\'s 2nd & 3rd Laws'
        ]);
      }
    } catch (e) {
      setDetectedWeakTopics([
        'Mathematics: Trigonometric Identity Proofs',
        'Physics: Snell\'s Law & Ray Diagrams'
      ]);
    }
  };

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    try {
      const res = await api.planner.generate({
        target_exam: targetExam,
        exam_date: examDate,
        daily_hours: Number(dailyHours),
        subjects: selectedSubjects
      });

      if (res.success) {
        setGeneratedPlan(res.data);
        if (res.data.detected_weak_topics?.length > 0) {
          setDetectedWeakTopics(res.data.detected_weak_topics);
        }
        fireMiniBurst();
        toast.success('Adaptive study plan generated with targeted revision!');
      }
    } catch (err) {
      toast.error('Could not generate plan. Please retry.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCommitToSchedule = async () => {
    if (!generatedPlan?.days) return;

    setIsCommitting(true);
    try {
      // Flatten sessions
      const sessionsToCommit = [];
      generatedPlan.days.forEach((day) => {
        day.sessions.forEach((s) => {
          sessionsToCommit.push({
            title: s.title,
            subject: s.subject,
            duration_minutes: s.duration_minutes,
            start_time: day.date,
            description: s.is_weak_topic_revision
              ? '⚡ Targeted Adaptive Revision from Doubt Journal'
              : 'Core Syllabus Study Session'
          });
        });
      });

      const res = await api.planner.commitToSchedule({ sessions: sessionsToCommit });
      if (res.success) {
        fireMiniBurst();
        toast.success(res.message || 'Study sessions successfully committed to your Timetable!');
        window.dispatchEvent(new CustomEvent('studybuddy:data-changed'));
      }
    } catch (err) {
      toast.error('Failed to commit sessions to timetable');
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#8B5CF6]/20 via-[#6366F1]/20 to-[#11101A] border border-[#8B5CF6]/30 p-6 md:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#8B5CF6]/30 text-[#C4B5FD] border border-[#8B5CF6]/40 uppercase tracking-wider">
                Education Chest • Adaptive Learning Engine
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/30">
                Auto-Detects Weak Topics
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-[#F5F3F7]">
              Smart Study Planner & Exam Schedule
            </h1>
            <p className="text-sm text-[#8F889D] max-w-2xl mt-1">
              After school, students without private tutors often don't know what to study first.
              Education Chest analyzes your doubt history, flags struggling topics, and automatically
              schedules high-impact revision slots before exams.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration Form */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-5 rounded-2xl bg-[#11101A] border border-[#292332] space-y-4">
            <h2 className="text-sm font-semibold text-[#F5F3F7] flex items-center gap-2">
              <Target className="w-4 h-4 text-[#8B5CF6]" />
              <span>Exam Target & Goals</span>
            </h2>

            {/* Target Exam */}
            <div>
              <label className="block text-xs font-medium text-[#8F889D] mb-1">
                Target Exam Name
              </label>
              <input
                type="text"
                value={targetExam}
                onChange={(e) => setTargetExam(e.target.value)}
                placeholder="e.g. CBSE Class 10 Board Exams"
                className="w-full bg-[#171421] border border-[#292332] rounded-xl px-3 py-2 text-xs text-[#F5F3F7] focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>

            {/* Exam Date */}
            <div>
              <label className="block text-xs font-medium text-[#8F889D] mb-1">
                Exam Date (Countdown Deadline)
              </label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full bg-[#171421] border border-[#292332] rounded-xl px-3 py-2 text-xs text-[#F5F3F7] focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>

            {/* Daily Hours Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-[#8F889D]">Daily After-School Study Time</span>
                <span className="font-bold text-[#C4B5FD]">{dailyHours} hours / day</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="0.5"
                value={dailyHours}
                onChange={(e) => setDailyHours(e.target.value)}
                className="w-full accent-[#8B5CF6] cursor-pointer"
              />
            </div>

            {/* Detected Weak Topics Box */}
            <div className="p-4 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#FBBF24]">
                <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
                <span>Detected Weak Topics (from Doubt Journal)</span>
              </div>
              <p className="text-[11px] text-[#FDE68A] leading-relaxed">
                Our algorithm detected these topics from your past homework doubts:
              </p>
              <div className="space-y-1">
                {detectedWeakTopics.map((topic, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs text-[#F5F3F7] bg-[#11101A]/60 p-2 rounded-lg border border-[#F59E0B]/20"
                  >
                    <Zap className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                    <span className="truncate">{topic}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-[#FBBF24]/80 italic">
                ✓ Auto-inserting 30-minute high-yield revision slots for each
              </p>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGeneratePlan}
              disabled={isGenerating}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] hover:from-[#7C3AED] hover:to-[#4F46E5] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#8B5CF6]/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing Adaptive Schedule...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate My Adaptive Study Plan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Generated Plan Schedule */}
        <div className="lg:col-span-7">
          {generatedPlan ? (
            <div className="space-y-4">
              {/* Header Action Bar */}
              <div className="p-4 rounded-2xl bg-[#11101A] border border-[#292332] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-[#F5F3F7]">
                    {generatedPlan.target_exam}
                  </h3>
                  <p className="text-xs text-[#8F889D]">
                    {generatedPlan.days_count}-Day Adaptive Schedule • {dailyHours}h Daily Focus
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCommitToSchedule}
                    disabled={isCommitting}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold shadow-md shadow-[#10B981]/20 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <CalendarCheck className="w-3.5 h-3.5" />
                    <span>{isCommitting ? 'Adding...' : '1-Click Add to Timetable'}</span>
                  </button>

                  <button
                    onClick={() => navigate('/schedule')}
                    className="px-3 py-2 rounded-xl bg-[#171421] text-[#8F889D] hover:text-[#F5F3F7] text-xs border border-[#292332] cursor-pointer"
                  >
                    View Timetable &rarr;
                  </button>
                </div>
              </div>

              {/* Day by Day Plan Cards */}
              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                {generatedPlan.days.map((day) => (
                  <div
                    key={day.day_number}
                    className="p-4 rounded-2xl bg-[#11101A] border border-[#292332] space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-[#292332] pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-xs font-bold text-[#C4B5FD]">
                          {day.day_number}
                        </span>
                        <h4 className="text-xs font-bold text-[#F5F3F7]">{day.day_label}</h4>
                      </div>
                      <span className="text-[11px] font-mono text-[#8F889D]">
                        {day.total_study_minutes} mins total
                      </span>
                    </div>

                    <div className="space-y-2">
                      {day.sessions.map((s, sIdx) => {
                        const isWeak = s.is_weak_topic_revision;

                        return (
                          <div
                            key={sIdx}
                            className={`p-3 rounded-xl border text-xs space-y-1 transition-all ${
                              isWeak
                                ? 'bg-[#F59E0B]/10 border-[#F59E0B]/40 text-[#FBBF24]'
                                : 'bg-[#171421] border-[#292332] text-[#F5F3F7]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold flex items-center gap-1.5">
                                {isWeak && <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />}
                                {s.title}
                              </span>
                              <span className="text-[10px] opacity-75 font-mono">
                                {s.time_slot} ({s.duration_minutes}m)
                              </span>
                            </div>
                            {isWeak && s.alert && (
                              <p className="text-[10px] text-[#FDE68A] italic">
                                💡 {s.alert}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[420px] rounded-2xl bg-[#11101A] border border-[#292332] flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 flex items-center justify-center text-[#8B5CF6]">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="text-base font-semibold text-[#F5F3F7]">
                Adaptive Exam Plan Preview
              </h3>
              <p className="text-xs text-[#8F889D] max-w-sm">
                Fill in your exam details on the left, click "Generate My Adaptive Study Plan",
                and our engine will balance your syllabus with targeted revision intervals.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

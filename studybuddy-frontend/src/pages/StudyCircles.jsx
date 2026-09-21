import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  MessageSquare,
  HelpCircle,
  Trophy,
  Plus,
  Send,
  ThumbsUp,
  Award,
  BookOpen,
  ArrowLeft,
  Search,
  Sparkles,
  CheckCircle,
  Flame,
  ShieldCheck,
  Star
} from 'lucide-react';
import { api } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fireMiniBurst } from '../utils/confetti';

const GRADE_LEVELS = [
  'All Grades',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12',
  'College'
];

export function StudyCircles() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState('All Grades');
  const [activeCircle, setActiveCircle] = useState(null);
  const [activeCircleData, setActiveCircleData] = useState(null);
  const [circleTab, setCircleTab] = useState('chat'); // 'chat' | 'doubts' | 'leaderboard'

  // Chat input
  const [chatMessage, setChatMessage] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const chatEndRef = useRef(null);

  // Post doubt modal / form
  const [newDoubtTitle, setNewDoubtTitle] = useState('');
  const [newDoubtText, setNewDoubtText] = useState('');
  const [isPostingDoubt, setIsPostingDoubt] = useState(false);

  // Peer answer input per doubt
  const [answeringDoubtId, setAnsweringDoubtId] = useState(null);
  const [answerText, setAnswerText] = useState('');

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState([]);

  // Create circle modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCircleName, setNewCircleName] = useState('');
  const [newCircleGrade, setNewCircleGrade] = useState('Grade 10');
  const [newCircleSubject, setNewCircleSubject] = useState('Mathematics');
  const [newCircleDesc, setNewCircleDesc] = useState('');

  useEffect(() => {
    loadCircles();
    loadLeaderboard();
  }, [selectedGrade]);

  useEffect(() => {
    if (activeCircle) {
      loadCircleDetails(activeCircle.id);
    }
  }, [activeCircle]);

  useEffect(() => {
    if (circleTab === 'chat' && activeCircleData?.messages) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeCircleData?.messages, circleTab]);

  const loadCircles = async () => {
    setLoading(true);
    try {
      const res = await api.circles.getAll({
        grade: selectedGrade !== 'All Grades' ? selectedGrade : undefined
      });
      if (res.success) {
        setCircles(res.data);
      }
    } catch (err) {
      console.warn('Circles error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const res = await api.circles.getLeaderboard();
      if (res.success) {
        setLeaderboard(res.data);
      }
    } catch (err) {
      console.warn('Leaderboard error:', err);
    }
  };

  const loadCircleDetails = async (circleId) => {
    try {
      const res = await api.circles.getById(circleId);
      if (res.success) {
        setActiveCircleData(res.data);
      }
    } catch (err) {
      toast.error('Could not load circle details');
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!chatMessage.trim() || !activeCircle) return;

    const text = chatMessage.trim();
    setChatMessage('');
    setIsSendingMsg(true);

    try {
      const res = await api.circles.sendMessage(activeCircle.id, text);
      if (res.success) {
        setActiveCircleData((prev) => ({
          ...prev,
          messages: [...(prev?.messages || []), res.data]
        }));
      }
    } catch (err) {
      toast.error('Could not send message');
    } finally {
      setIsSendingMsg(false);
    }
  };

  const handlePostDoubt = async (e) => {
    e?.preventDefault();
    if (!newDoubtTitle.trim() || !newDoubtText.trim() || !activeCircle) return;

    setIsPostingDoubt(true);
    try {
      const res = await api.circles.postDoubt(activeCircle.id, {
        title: newDoubtTitle.trim(),
        question_text: newDoubtText.trim()
      });
      if (res.success) {
        toast.success('Doubt shared with your study circle!');
        setNewDoubtTitle('');
        setNewDoubtText('');
        loadCircleDetails(activeCircle.id);
      }
    } catch (err) {
      toast.error('Could not post doubt');
    } finally {
      setIsPostingDoubt(false);
    }
  };

  const handleAnswerSubmit = async (doubtId) => {
    if (!answerText.trim()) return;

    try {
      const res = await api.circles.answerDoubt(doubtId, answerText.trim());
      if (res.success) {
        fireMiniBurst();
        toast.success(res.message || 'Answer submitted! +10 Points earned! 🎉');
        setAnswerText('');
        setAnsweringDoubtId(null);
        loadCircleDetails(activeCircle.id);
        loadLeaderboard();
      }
    } catch (err) {
      toast.error('Could not submit answer');
    }
  };

  const handleUpvote = async (answerId) => {
    try {
      const res = await api.circles.upvoteAnswer(answerId);
      if (res.success) {
        fireMiniBurst();
        toast.success(res.message || 'Helpful answer upvoted! Author earned +15 Points ⭐');
        loadCircleDetails(activeCircle.id);
        loadLeaderboard();
      }
    } catch (err) {
      toast.error('Could not upvote');
    }
  };

  const handleCreateCircle = async (e) => {
    e?.preventDefault();
    if (!newCircleName.trim()) return;

    try {
      const res = await api.circles.create({
        name: newCircleName.trim(),
        grade_level: newCircleGrade,
        subject_name: newCircleSubject,
        description: newCircleDesc.trim()
      });
      if (res.success) {
        toast.success('New Peer Study Circle created!');
        setShowCreateModal(false);
        setNewCircleName('');
        setNewCircleDesc('');
        loadCircles();
        setActiveCircle(res.data);
      }
    } catch (err) {
      toast.error('Failed to create circle');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#10B981]/20 via-[#8B5CF6]/20 to-[#11101A] border border-[#10B981]/30 p-6 md:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/30 uppercase tracking-wider">
                Education Chest • Collaborative Peer Circles
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#8B5CF6]/20 text-[#C4B5FD] border border-[#8B5CF6]/30">
                ⭐ Peer-to-Peer Help • Zero Cost
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-[#F5F3F7]">
              Peer Study Circles & Shared Doubt Board
            </h1>
            <p className="text-sm text-[#8F889D] max-w-2xl mt-1">
              Connect with classmates in free study rooms. Ask homework questions on the shared board,
              help fellow students, and earn reputation points and badges!
            </p>
          </div>

          {!activeCircle && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-semibold text-xs shadow-lg shadow-[#10B981]/20 hover:scale-105 transition-all cursor-pointer self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create Free Circle</span>
            </button>
          )}
        </div>
      </div>

      {/* Main View: Circles Explorer vs Inside Circle Room */}
      {!activeCircle ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Circles List */}
          <div className="lg:col-span-8 space-y-4">
            {/* Grade Level Filter Pill Row */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {GRADE_LEVELS.map((grade) => (
                <button
                  key={grade}
                  onClick={() => setSelectedGrade(grade)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                    selectedGrade === grade
                      ? 'bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/20'
                      : 'bg-[#11101A] text-[#8F889D] hover:text-[#F5F3F7] border border-[#292332]'
                  }`}
                >
                  {grade}
                </button>
              ))}
            </div>

            {/* Circles Cards Grid */}
            {loading ? (
              <div className="p-12 text-center text-xs text-[#8F889D]">
                Loading study circles...
              </div>
            ) : circles.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-[#11101A] border border-[#292332] space-y-2">
                <Users className="w-8 h-8 text-[#8B5CF6] mx-auto" />
                <h4 className="text-sm font-semibold text-[#F5F3F7]">No circles found</h4>
                <p className="text-xs text-[#8F889D]">
                  Be the first to create a study circle for {selectedGrade}!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {circles.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setActiveCircle(c)}
                    className="p-5 rounded-2xl bg-[#11101A] border border-[#292332] hover:border-[#8B5CF6]/50 hover:bg-[#151221] transition-all cursor-pointer group space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#C4B5FD] font-bold text-sm">
                        {c.subject_name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/25">
                        {c.grade_level}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-[#F5F3F7] group-hover:text-[#A78BFA] transition-colors">
                        {c.name}
                      </h3>
                      <p className="text-xs text-[#8F889D] line-clamp-2 mt-1">
                        {c.description || 'Collaborative study and homework solving circle.'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#292332]/60 flex items-center justify-between text-[11px] text-[#8F889D]">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#8B5CF6]" />
                        {c.member_count} Students
                      </span>
                      <span className="flex items-center gap-1.5 text-[#34D399]">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Join Room &rarr;
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Community Leaderboard */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-5 rounded-2xl bg-[#11101A] border border-[#292332] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#F59E0B]" />
                  <h3 className="text-sm font-semibold text-[#F5F3F7]">
                    Top Peer Tutors
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-md border border-[#10B981]/20">
                  +15 pts / Help
                </span>
              </div>

              <div className="space-y-2.5">
                {leaderboard.map((student, idx) => (
                  <div
                    key={student.id}
                    className="p-2.5 rounded-xl bg-[#171421] border border-[#292332] flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          idx === 0
                            ? 'bg-[#F59E0B] text-black shadow-sm'
                            : idx === 1
                            ? 'bg-[#94A3B8] text-black'
                            : idx === 2
                            ? 'bg-[#B45309] text-white'
                            : 'bg-[#11101A] text-[#8F889D] border border-[#292332]'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#F5F3F7] truncate">
                          {student.username}
                        </p>
                        <p className="text-[10px] text-[#A78BFA] truncate">
                          {student.badge || 'Study Buddy'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-[#F5F3F7]">
                        {student.reputation_points}
                      </span>
                      <span className="text-[10px] text-[#8F889D] block">pts</span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-[#645E73] text-center leading-relaxed">
                ✨ Students earn points by posting verified solutions to classmates' homework doubts.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* INSIDE ACTIVE CIRCLE ROOM */
        <div className="space-y-4">
          {/* Room Header & Navigation */}
          <div className="p-4 rounded-2xl bg-[#11101A] border border-[#292332] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveCircle(null)}
                className="p-2 rounded-xl bg-[#171421] text-[#8F889D] hover:text-[#F5F3F7] border border-[#292332] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#F5F3F7]">
                    {activeCircle.name}
                  </h2>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#8B5CF6]/20 text-[#C4B5FD] border border-[#8B5CF6]/30">
                    {activeCircle.grade_level}
                  </span>
                </div>
                <p className="text-xs text-[#8F889D]">
                  Subject: {activeCircle.subject_name} • Free Peer Collaboration Room
                </p>
              </div>
            </div>

            {/* Sub-tab Switcher */}
            <div className="flex items-center gap-1 bg-[#171421] p-1 rounded-xl border border-[#292332]">
              <button
                onClick={() => setCircleTab('chat')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                  circleTab === 'chat'
                    ? 'bg-[#8B5CF6] text-white'
                    : 'text-[#8F889D] hover:text-[#F5F3F7]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Group Chat</span>
              </button>
              <button
                onClick={() => setCircleTab('doubts')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                  circleTab === 'doubts'
                    ? 'bg-[#8B5CF6] text-white'
                    : 'text-[#8F889D] hover:text-[#F5F3F7]'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Shared Doubt Board</span>
              </button>
            </div>
          </div>

          {/* ROOM TAB 1: GROUP CHAT */}
          {circleTab === 'chat' && (
            <div className="h-[460px] rounded-2xl bg-[#11101A] border border-[#292332] flex flex-col overflow-hidden">
              {/* Messages Stream */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {activeCircleData?.messages?.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-xs text-[#8F889D] space-y-2">
                    <MessageSquare className="w-8 h-8 text-[#8B5CF6]" />
                    <p>No messages yet in this study room. Say hello to your peers!</p>
                  </div>
                ) : (
                  activeCircleData?.messages?.map((msg) => {
                    const isMe = msg.username === user?.username || msg.username === 'demo';

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-[#645E73]">
                          <span className="font-semibold text-[#A78BFA]">{msg.username}</span>
                          <span>•</span>
                          <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div
                          className={`max-w-md p-3 rounded-2xl text-xs leading-relaxed ${
                            isMe
                              ? 'bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] text-white rounded-tr-none'
                              : 'bg-[#171421] text-[#F5F3F7] border border-[#292332] rounded-tl-none'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Message Input Box */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 bg-[#171421] border-t border-[#292332] flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type a message or question to your study circle..."
                  className="flex-1 bg-[#11101A] border border-[#292332] rounded-xl px-3 py-2 text-xs text-[#F5F3F7] placeholder-[#645E73] focus:outline-none focus:border-[#8B5CF6]"
                />
                <button
                  type="submit"
                  disabled={isSendingMsg || !chatMessage.trim()}
                  className="p-2.5 rounded-xl bg-[#8B5CF6] text-white hover:bg-[#7C3AED] disabled:opacity-40 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* ROOM TAB 2: SHARED DOUBT BOARD */}
          {circleTab === 'doubts' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Doubts List */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#F5F3F7]">
                    Classmates' Homework Doubts
                  </h3>
                  <span className="text-xs text-[#8F889D]">
                    {activeCircleData?.shared_doubts?.length || 0} Questions
                  </span>
                </div>

                {activeCircleData?.shared_doubts?.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-[#11101A] border border-[#292332] text-center text-xs text-[#8F889D]">
                    No shared doubts in this room yet. Post one using the form on the right!
                  </div>
                ) : (
                  activeCircleData?.shared_doubts?.map((doubt) => (
                    <div
                      key={doubt.id}
                      className="p-5 rounded-2xl bg-[#11101A] border border-[#292332] space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-[#A78BFA] font-mono">
                            Asked by {doubt.username}
                          </span>
                          <h4 className="text-sm font-semibold text-[#F5F3F7]">
                            {doubt.title}
                          </h4>
                        </div>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#10B981]/20 text-[#34D399]">
                          {doubt.answers?.length || 0} Answers
                        </span>
                      </div>

                      <p className="text-xs text-[#8F889D] whitespace-pre-line bg-[#171421] p-3 rounded-xl border border-[#292332]">
                        {doubt.question_text}
                      </p>

                      {/* Peer Answers */}
                      <div className="space-y-2 pt-2 border-t border-[#292332]">
                        <h5 className="text-[11px] font-semibold text-[#645E73] uppercase tracking-wider">
                          Peer Solutions:
                        </h5>
                        {(doubt.answers || []).map((ans) => (
                          <div
                            key={ans.id}
                            className="p-3 rounded-xl bg-[#171421] border border-[#292332] space-y-2"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-[#C4B5FD] flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                                {ans.username}
                              </span>

                              <button
                                onClick={() => handleUpvote(ans.id)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/30 text-[#C4B5FD] text-[11px] font-bold border border-[#8B5CF6]/30 cursor-pointer transition-all"
                              >
                                <ThumbsUp className="w-3 h-3" />
                                <span>{ans.upvotes || 0} Helpful (+15 pts)</span>
                              </button>
                            </div>
                            <p className="text-xs text-[#D8B4FE] whitespace-pre-line">
                              {ans.answer_text}
                            </p>
                          </div>
                        ))}

                        {/* Answer Input Toggle */}
                        {answeringDoubtId === doubt.id ? (
                          <div className="space-y-2 pt-2">
                            <textarea
                              rows={3}
                              value={answerText}
                              onChange={(e) => setAnswerText(e.target.value)}
                              placeholder="Write a clear step-by-step answer to help your classmate..."
                              className="w-full bg-[#171421] border border-[#292332] rounded-xl p-3 text-xs text-[#F5F3F7] focus:outline-none focus:border-[#8B5CF6]"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleAnswerSubmit(doubt.id)}
                                className="px-3 py-1.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-xs cursor-pointer shadow-md"
                              >
                                Submit Answer (+10 Points)
                              </button>
                              <button
                                onClick={() => setAnsweringDoubtId(null)}
                                className="px-3 py-1.5 rounded-xl bg-[#171421] text-[#8F889D] text-xs cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setAnsweringDoubtId(doubt.id);
                              setAnswerText('');
                            }}
                            className="text-xs font-semibold text-[#8B5CF6] hover:text-[#A78BFA] cursor-pointer pt-1"
                          >
                            + Write a Peer Solution (Earn Reputation)
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Right: Post a Question Form */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-5 rounded-2xl bg-[#11101A] border border-[#292332] space-y-3 sticky top-4">
                  <h3 className="text-sm font-semibold text-[#F5F3F7] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
                    <span>Post Question to Circle</span>
                  </h3>
                  <p className="text-xs text-[#8F889D]">
                    Stuck on a problem after school? Ask your circle members for a free explanation.
                  </p>

                  <form onSubmit={handlePostDoubt} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-[#8F889D] mb-1">
                        Topic / Question Title
                      </label>
                      <input
                        type="text"
                        value={newDoubtTitle}
                        onChange={(e) => setNewDoubtTitle(e.target.value)}
                        placeholder="e.g. Chapter 4 Exercise 2 Question 6"
                        className="w-full bg-[#171421] border border-[#292332] rounded-xl px-3 py-2 text-xs text-[#F5F3F7] focus:outline-none focus:border-[#8B5CF6]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#8F889D] mb-1">
                        Explain what you're struggling with
                      </label>
                      <textarea
                        rows={4}
                        value={newDoubtText}
                        onChange={(e) => setNewDoubtText(e.target.value)}
                        placeholder="Paste the problem statement and which step confuses you..."
                        className="w-full bg-[#171421] border border-[#292332] rounded-xl p-3 text-xs text-[#F5F3F7] focus:outline-none focus:border-[#8B5CF6] resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isPostingDoubt || !newDoubtTitle.trim() || !newDoubtText.trim()}
                      className="w-full py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-semibold cursor-pointer disabled:opacity-50 transition-all shadow-md"
                    >
                      {isPostingDoubt ? 'Posting...' : 'Post to Shared Doubt Board'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE CIRCLE MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#11101A] border border-[#292332] rounded-2xl p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#F5F3F7]">
                  Create Free Peer Study Circle
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 text-[#8F889D] hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateCircle} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#8F889D] mb-1">
                    Circle Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newCircleName}
                    onChange={(e) => setNewCircleName(e.target.value)}
                    placeholder="e.g. Class 10 Board Exam Physics Sprint"
                    className="w-full bg-[#171421] border border-[#292332] rounded-xl px-3 py-2 text-xs text-[#F5F3F7] focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#8F889D] mb-1">
                      Grade Level
                    </label>
                    <select
                      value={newCircleGrade}
                      onChange={(e) => setNewCircleGrade(e.target.value)}
                      className="w-full bg-[#171421] border border-[#292332] rounded-xl px-2.5 py-2 text-xs text-[#F5F3F7] focus:outline-none"
                    >
                      {GRADE_LEVELS.filter((g) => g !== 'All Grades').map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#8F889D] mb-1">
                      Subject
                    </label>
                    <select
                      value={newCircleSubject}
                      onChange={(e) => setNewCircleSubject(e.target.value)}
                      className="w-full bg-[#171421] border border-[#292332] rounded-xl px-2.5 py-2 text-xs text-[#F5F3F7] focus:outline-none"
                    >
                      <option value="Mathematics">Mathematics</option>
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Biology">Biology</option>
                      <option value="English">English</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#8F889D] mb-1">
                    Circle Mission / Description
                  </label>
                  <textarea
                    rows={3}
                    value={newCircleDesc}
                    onChange={(e) => setNewCircleDesc(e.target.value)}
                    placeholder="Describe what your study group will focus on..."
                    className="w-full bg-[#171421] border border-[#292332] rounded-xl p-3 text-xs text-[#F5F3F7] focus:outline-none focus:border-[#8B5CF6] resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl bg-[#171421] text-xs text-[#8F889D] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold cursor-pointer shadow-md"
                  >
                    Launch Free Circle
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

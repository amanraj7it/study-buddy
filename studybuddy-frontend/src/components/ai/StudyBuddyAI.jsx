import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Bot,
  X,
  Send,
  HelpCircle,
  Layers,
  Calendar,
  Zap,
  Flame,
  CheckCircle2,
  XCircle,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { api } from '../../api/api';
import { useToast } from '../../context/ToastContext';
import { fireMiniBurst } from '../../utils/confetti';

export function StudyBuddyAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: "👋 Hi! I'm **Buddy AI**, your study copilot. Pick a quick tool below or ask me any question about your subjects!",
      type: 'chat',
    },
  ]);

  // Quiz active state
  const [selectedAnswers, setSelectedAnswers] = useState({});
  // Flashcard flip states
  const [flippedCards, setFlippedCards] = useState({});

  const messagesEndRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (customPrompt = null, mode = 'chat') => {
    const text = customPrompt || inputMessage;
    if (!text.trim() && mode === 'chat') return;

    const userMsgId = Date.now().toString();
    if (!customPrompt) {
      setMessages((prev) => [
        ...prev,
        { id: userMsgId, sender: 'user', text: text.trim(), type: 'chat' },
      ]);
      setInputMessage('');
    }

    setIsLoading(true);

    try {
      const res = await api.ai.studyAssistant({
        mode,
        topic: text,
        message: text,
      });

      if (res.success) {
        const aiMsgId = (Date.now() + 1).toString();
        if (res.type === 'quiz') {
          setMessages((prev) => [
            ...prev,
            {
              id: aiMsgId,
              sender: 'ai',
              title: res.title,
              quiz: res.quiz,
              type: 'quiz',
            },
          ]);
        } else if (res.type === 'flashcards') {
          setMessages((prev) => [
            ...prev,
            {
              id: aiMsgId,
              sender: 'ai',
              title: res.title,
              cards: res.cards,
              type: 'flashcards',
            },
          ]);
        } else if (res.type === 'plan') {
          setMessages((prev) => [
            ...prev,
            {
              id: aiMsgId,
              sender: 'ai',
              title: res.plan.title,
              plan: res.plan,
              type: 'plan',
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: aiMsgId,
              sender: 'ai',
              text: res.response,
              type: 'chat',
            },
          ]);
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'ai',
          text: `⚠️ ${err.message || 'Could not connect to AI service'}`,
          type: 'chat',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizOptionSelect = (msgId, qIdx, optIdx, correctIdx) => {
    const key = `${msgId}_${qIdx}`;
    if (selectedAnswers[key] !== undefined) return; // already answered

    setSelectedAnswers((prev) => ({
      ...prev,
      [key]: optIdx,
    }));

    if (optIdx === correctIdx) {
      fireMiniBurst(0.8, 0.6);
      toast.success('🎯 Correct answer!');
    } else {
      toast.error('❌ Not quite, check the explanation below!');
    }
  };

  const toggleCardFlip = (cardKey) => {
    setFlippedCards((prev) => ({
      ...prev,
      [cardKey]: !prev[cardKey],
    }));
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] text-white shadow-2xl shadow-[#8B5CF6]/40 border border-[#A78BFA]/30 cursor-pointer group"
      >
        <div className="relative">
          <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#34D399] rounded-full ring-2 ring-[#09070F] animate-pulse" />
        </div>
        <span className="text-sm font-semibold tracking-tight">Buddy AI</span>
      </motion.button>

      {/* Main AI Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-22 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] h-[560px] bg-[#11101A] border border-[#292332] rounded-3xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="p-4 bg-[#171421] border-b border-[#292332] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center text-white shadow-md shadow-[#8B5CF6]/30">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-[#F5F3F7]">Buddy AI Copilot</h3>
                    <span className="w-2 h-2 rounded-full bg-[#34D399]" />
                  </div>
                  <p className="text-[11px] text-[#8F889D]">Instant study summaries & quizzes</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-[#8F889D] hover:text-white rounded-lg hover:bg-[#231D2D] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Action Chips */}
            <div className="px-3 py-2 bg-[#0E0D15] border-b border-[#1F1A28] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                onClick={() => handleSend('Calculus & Physics', 'quiz')}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-full bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/25 border border-[#8B5CF6]/30 text-[#C4B5FD] text-[11px] font-medium flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3 h-3 text-[#A78BFA]" />
                <span>Quiz Me</span>
              </button>
              <button
                onClick={() => handleSend('Key Formulas', 'flashcards')}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-full bg-[#3B82F6]/15 hover:bg-[#3B82F6]/25 border border-[#3B82F6]/30 text-[#93C5FD] text-[11px] font-medium flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
              >
                <Layers className="w-3 h-3 text-[#60A5FA]" />
                <span>Flashcards</span>
              </button>
              <button
                onClick={() => handleSend('Calculus Exam', 'plan')}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-full bg-[#10B981]/15 hover:bg-[#10B981]/25 border border-[#10B981]/30 text-[#6EE7B7] text-[11px] font-medium flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
              >
                <Calendar className="w-3 h-3 text-[#34D399]" />
                <span>3-Day Plan</span>
              </button>
              <button
                onClick={() => handleSend('Integration by Parts', 'explain')}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-full bg-[#F59E0B]/15 hover:bg-[#F59E0B]/25 border border-[#F59E0B]/30 text-[#FCD34D] text-[11px] font-medium flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
              >
                <Zap className="w-3 h-3 text-[#FBBF24]" />
                <span>ELI5</span>
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#8B5CF6] text-white rounded-br-none shadow-md'
                        : 'bg-[#171421] border border-[#292332] text-[#E2DFE8] rounded-bl-none shadow-sm'
                    }`}
                  >
                    {/* Chat Text */}
                    {msg.type === 'chat' && (
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    )}

                    {/* Interactive Quiz Message */}
                    {msg.type === 'quiz' && (
                      <div className="space-y-3">
                        <div className="font-bold text-[#A78BFA] flex items-center gap-1.5 pb-1 border-b border-[#292332]">
                          <HelpCircle className="w-4 h-4" />
                          <span>{msg.title}</span>
                        </div>
                        {msg.quiz?.map((q, qIdx) => {
                          const answerKey = `${msg.id}_${qIdx}`;
                          const answered = selectedAnswers[answerKey] !== undefined;
                          const chosen = selectedAnswers[answerKey];

                          return (
                            <div key={qIdx} className="p-2.5 rounded-xl bg-[#0F0E17] border border-[#221D2C] space-y-2">
                              <p className="font-medium text-[#F5F3F7]">
                                {qIdx + 1}. {q.question}
                              </p>
                              <div className="space-y-1.5">
                                {q.options.map((opt, optIdx) => {
                                  let btnClass = 'bg-[#171421] border-[#292332] text-[#ACA5B8] hover:border-[#8B5CF6] hover:text-[#F5F3F7]';
                                  if (answered) {
                                    if (optIdx === q.answer_idx) {
                                      btnClass = 'bg-[#10B981]/20 border-[#10B981] text-[#34D399] font-semibold';
                                    } else if (chosen === optIdx) {
                                      btnClass = 'bg-[#EF4444]/20 border-[#EF4444] text-[#F87171]';
                                    } else {
                                      btnClass = 'bg-[#171421] border-[#1F1A28] opacity-50';
                                    }
                                  }

                                  return (
                                    <button
                                      key={optIdx}
                                      disabled={answered}
                                      onClick={() => handleQuizOptionSelect(msg.id, qIdx, optIdx, q.answer_idx)}
                                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] border transition-all cursor-pointer ${btnClass}`}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>
                              {answered && (
                                <p className="text-[10px] text-[#A78BFA] pt-1 border-t border-[#1F1A28]">
                                  💡 {q.explanation}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Interactive Flashcards */}
                    {msg.type === 'flashcards' && (
                      <div className="space-y-2.5">
                        <div className="font-bold text-[#60A5FA] flex items-center gap-1.5 pb-1 border-b border-[#292332]">
                          <Layers className="w-4 h-4" />
                          <span>{msg.title} (Click to Flip)</span>
                        </div>
                        <div className="space-y-2">
                          {msg.cards?.map((card, cIdx) => {
                            const cardKey = `${msg.id}_card_${cIdx}`;
                            const isFlipped = !!flippedCards[cardKey];

                            return (
                              <div
                                key={cIdx}
                                onClick={() => toggleCardFlip(cardKey)}
                                className="p-3 rounded-xl bg-[#0F0E17] border border-[#221D2C] cursor-pointer hover:border-[#3B82F6]/50 transition-all text-center select-none"
                              >
                                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#3B82F6]/20 text-[#60A5FA] inline-block mb-1.5">
                                  {isFlipped ? '✨ Answer' : '❓ Question'}
                                </span>
                                <p className="text-[11px] text-[#F5F3F7]">
                                  {isFlipped ? card.back : card.front}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Study Plan */}
                    {msg.type === 'plan' && (
                      <div className="space-y-3">
                        <div className="font-bold text-[#34D399] flex items-center gap-1.5 pb-1 border-b border-[#292332]">
                          <Calendar className="w-4 h-4" />
                          <span>{msg.title}</span>
                        </div>
                        {msg.plan?.days?.map((d, dIdx) => (
                          <div key={dIdx} className="p-2.5 rounded-xl bg-[#0F0E17] border border-[#221D2C] space-y-1.5">
                            <h4 className="font-semibold text-[#34D399] text-[11px]">{d.day}</h4>
                            <ul className="space-y-1">
                              {d.tasks.map((t, tIdx) => (
                                <li key={tIdx} className="text-[11px] text-[#ACA5B8] flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
                                  <span>{t}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="px-4 py-2.5 rounded-2xl bg-[#171421] border border-[#292332] rounded-bl-none flex items-center gap-1.5 text-xs text-[#A78BFA]">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Buddy AI is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 bg-[#171421] border-t border-[#292332] flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask Buddy AI or type a topic..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#0E0D15] border border-[#292332] focus:border-[#8B5CF6] text-xs text-[#F5F3F7] placeholder-[#645E73] outline-none transition-all"
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="p-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 text-white transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

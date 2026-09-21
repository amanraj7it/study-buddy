import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Layers,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Sparkles,
  CheckCircle2,
  ThumbsUp,
  Brain,
} from 'lucide-react';
import { fireCelebrationBurst, fireMiniBurst } from '../../utils/confetti';

export function FlashcardModal({ isOpen, onClose, noteTitle, noteContent }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cards, setCards] = useState([]);
  const [masteredCards, setMasteredCards] = useState(new Set());
  const [isFinished, setIsFinished] = useState(false);

  // Generate cards from note content or fallback to smart prompts
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setIsFlipped(false);
      setIsFinished(false);
      setMasteredCards(new Set());

      // Parse lines/bullet points if available or create smart study cards
      const generated = [
        {
          front: `What is the core topic of "${noteTitle}"?`,
          back: noteContent ? noteContent.slice(0, 180) + (noteContent.length > 180 ? '...' : '') : 'Mastery of foundational subject principles.',
        },
        {
          front: 'What is the most effective active recall strategy for this note?',
          back: 'Feynman Technique: Explain it without jargon to test comprehension, then review formula derivations.',
        },
        {
          front: `How does "${noteTitle}" connect to exam problem solving?`,
          back: 'Focus on boundary conditions, core theorems, and typical trap answers designed by examiners.',
        },
        {
          front: 'Key Summary Takeaway',
          back: 'Review this card in 24 hours to reinforce memory consolidation according to spaced repetition curves.',
        },
      ];
      setCards(generated);
    }
  }, [isOpen, noteTitle, noteContent]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, cards.length, isFlipped]);

  if (!isOpen || cards.length === 0) return null;

  const currentCard = cards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
      fireCelebrationBurst();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const markMastered = () => {
    const nextSet = new Set(masteredCards);
    nextSet.add(currentIndex);
    setMasteredCards(nextSet);
    fireMiniBurst(0.5, 0.5);
    handleNext();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-[#11101A] border border-[#292332] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#8B5CF6]/15 rounded-full blur-[100px] pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-5 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#A78BFA]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F5F3F7]">Flashcard Practice</h3>
              <p className="text-[11px] text-[#8F889D] truncate max-w-[200px] sm:max-w-xs">{noteTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8F889D] hover:text-[#F5F3F7] hover:bg-[#1F1A28] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isFinished ? (
          <>
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-[11px] text-[#8F889D] mb-1.5">
                <span>Card {currentIndex + 1} of {cards.length}</span>
                <span className="text-[#34D399] font-medium">{masteredCards.size} mastered</span>
              </div>
              <div className="w-full h-1.5 bg-[#171421] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#34D399] transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
                />
              </div>
            </div>

            {/* 3D Flip Flashcard */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full h-64 rounded-2xl bg-gradient-to-br from-[#171421] to-[#0E0D15] border border-[#292332] hover:border-[#8B5CF6]/60 p-6 flex flex-col justify-between cursor-pointer select-none transition-all shadow-xl hover:shadow-[#8B5CF6]/10 relative group"
            >
              <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
                <span className={`px-2 py-0.5 rounded-full ${isFlipped ? 'bg-[#34D399]/20 text-[#34D399]' : 'bg-[#8B5CF6]/20 text-[#A78BFA]'}`}>
                  {isFlipped ? '✨ Answer / Explanation' : '❓ Question'}
                </span>
                <span className="text-[#645E73] group-hover:text-[#8F889D] flex items-center gap-1">
                  <RotateCw className="w-3 h-3" /> Click or Space to Flip
                </span>
              </div>

              <div className="flex items-center justify-center my-auto px-2">
                <p className="text-base sm:text-lg font-medium text-[#F5F3F7] text-center leading-relaxed">
                  {isFlipped ? currentCard.back : currentCard.front}
                </p>
              </div>

              <div className="text-center text-[11px] text-[#645E73]">
                {isFlipped ? '💡 Click to review question' : '👆 Click card to reveal answer'}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 mt-6">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-3.5 py-2 rounded-xl bg-[#171421] hover:bg-[#1F1A28] border border-[#292332] text-xs font-medium text-[#8F889D] hover:text-[#F5F3F7] disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>

              <button
                onClick={markMastered}
                className="px-4 py-2 rounded-xl bg-[#10B981]/15 hover:bg-[#10B981]/25 border border-[#10B981]/30 text-xs font-semibold text-[#34D399] flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mastered</span>
              </button>

              <button
                onClick={handleNext}
                className="px-3.5 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-xs font-semibold text-white flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>{currentIndex === cards.length - 1 ? 'Finish' : 'Next'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          /* Finished State */
          <div className="text-center py-6 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#34D399]/15 border border-[#34D399]/30 text-[#34D399] shadow-lg shadow-[#34D399]/20">
              <Brain className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-[#F5F3F7]">Session Complete!</h3>
            <p className="text-xs text-[#8F889D] max-w-sm mx-auto">
              You reviewed {cards.length} cards and mastered {masteredCards.size}. Consistent daily review builds permanent retention!
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => {
                  setCurrentIndex(0);
                  setIsFlipped(false);
                  setIsFinished(false);
                }}
                className="px-4 py-2 rounded-xl bg-[#171421] border border-[#292332] text-xs font-medium text-[#F5F3F7] hover:bg-[#1F1A28] cursor-pointer"
              >
                Restart Deck
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-xs font-semibold text-white cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

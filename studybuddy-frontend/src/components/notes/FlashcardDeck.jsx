import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Layers,
  X,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { fireCelebration } from '../../utils/confetti';

export function FlashcardDeck({ isOpen, onClose, note }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState(new Set());

  // Parse note content into flashcards (looks for 'Q:'/'A:', ':' or bullet lines)
  const parseFlashcards = () => {
    if (!note || !note.content) return [];
    const lines = note.content.split('\n').map((l) => l.trim()).filter(Boolean);
    const cards = [];

    let currentCard = null;
    for (let line of lines) {
      if (line.includes(' - ') || line.includes(': ')) {
        const parts = line.includes(' - ') ? line.split(' - ') : line.split(': ');
        cards.push({
          front: parts[0].replace(/^[-*•\d.)\s]+/, '').trim(),
          back: parts.slice(1).join(': ').trim(),
        });
      } else if (line.toLowerCase().startsWith('q:')) {
        currentCard = { front: line.substring(2).trim(), back: '' };
      } else if (line.toLowerCase().startsWith('a:') && currentCard) {
        currentCard.back = line.substring(2).trim();
        cards.push(currentCard);
        currentCard = null;
      } else if (line.length > 5) {
        cards.push({
          front: `Key Concept / Term: ${line.substring(0, 35)}...`,
          back: line,
        });
      }
    }

    if (cards.length === 0 && note) {
      cards.push({
        front: note.title,
        back: note.content,
      });
    }

    return cards;
  };

  const cards = parseFlashcards();
  const currentCard = cards[currentIndex] || { front: 'No content', back: 'Empty' };

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleMarkMastered = () => {
    const newMastered = new Set(masteredCards);
    newMastered.add(currentIndex);
    setMasteredCards(newMastered);

    if (newMastered.size === cards.length) {
      fireCelebration();
    }
    handleNext();
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setMasteredCards(new Set());
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-xl"
      title={`Flashcard Deck: ${note?.title || 'Study Deck'}`}
      description="Click card to flip between Question / Term and Answer."
    >
      <div className="space-y-6">
        {/* Progress header */}
        <div className="flex items-center justify-between text-xs text-[#8F889D] border-b border-[#1F1A28] pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#8B5CF6]" />
            <span>
              Card {currentIndex + 1} of {cards.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#34D399]" />
            <span>{masteredCards.size} Mastered</span>
          </div>
        </div>

        {/* 3D Flip Flashcard Container */}
        <div className="perspective-1000 min-h-[220px] flex items-center justify-center">
          <motion.div
            onClick={() => setIsFlipped(!isFlipped)}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="w-full min-h-[220px] bg-[#171421] border border-[#292332] hover:border-[#8B5CF6]/50 rounded-2xl p-6 flex flex-col justify-between cursor-pointer select-none shadow-2xl relative"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Front Side */}
            <div
              className={`flex flex-col items-center justify-center text-center my-auto transition-opacity duration-200 ${
                isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
            >
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8B5CF6] mb-3 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" /> Front / Question
              </span>
              <p className="text-base sm:text-lg font-semibold text-[#F5F3F7]">
                {currentCard.front}
              </p>
              <span className="text-[11px] text-[#645E73] mt-4">
                (Click to reveal answer)
              </span>
            </div>

            {/* Back Side */}
            <div
              className={`absolute inset-0 p-6 flex flex-col items-center justify-center text-center my-auto transition-opacity duration-200 ${
                isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              style={{ transform: 'rotateY(180deg)' }}
            >
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#34D399] mb-3 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Back / Answer
              </span>
              <p className="text-sm sm:text-base text-[#F5F3F7] leading-relaxed whitespace-pre-line">
                {currentCard.back}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            icon={ChevronLeft}
          >
            Prev
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              icon={RotateCcw}
            >
              Reset
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={handleMarkMastered}
              icon={CheckCircle}
            >
              Mastered
            </Button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleNext}
            disabled={currentIndex >= cards.length - 1}
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </Modal>
  );
}

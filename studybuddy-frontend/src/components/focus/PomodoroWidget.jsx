import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  CloudRain,
  Radio,
  Minimize2,
  Maximize2,
  CheckCircle,
  Sparkles,
  Clock,
} from 'lucide-react';
import { soundManager } from '../../utils/audioUtils';
import { fireMiniBurst } from '../../utils/confetti';
import { useToast } from '../../context/ToastContext';
import { api } from '../../api/api';

const MODES = {
  pomodoro: { label: 'Pomodoro', duration: 25 * 60, color: '#8B5CF6' },
  shortBreak: { label: 'Short Break', duration: 5 * 60, color: '#34D399' },
  longBreak: { label: 'Long Break', duration: 15 * 60, color: '#60A5FA' },
};

export function PomodoroWidget({ isCompact = false, onSessionCompleted }) {
  const { toast } = useToast();
  const [mode, setMode] = useState('pomodoro');
  const [timeLeft, setTimeLeft] = useState(MODES.pomodoro.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);
  const [ambientType, setAmbientType] = useState('rain');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);

  const timerRef = useRef(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRunning, mode]);

  const handleTimerComplete = async () => {
    setIsRunning(false);
    soundManager.playChime();
    fireMiniBurst(0.5, 0.4);

    if (mode === 'pomodoro') {
      const newCount = completedPomodoros + 1;
      setCompletedPomodoros(newCount);
      toast.success('🎉 Focus session completed! Take a well-deserved break.');

      // Auto log 25 mins (0.42 hrs) of study time to the backend if needed
      try {
        if (onSessionCompleted) {
          onSessionCompleted(25);
        }
      } catch (e) {
        console.error("Session log error:", e);
      }

      // Recommend next mode
      if (newCount % 4 === 0) {
        setMode('longBreak');
        setTimeLeft(MODES.longBreak.duration);
      } else {
        setMode('shortBreak');
        setTimeLeft(MODES.shortBreak.duration);
      }
    } else {
      toast.info('Break finished! Ready to focus again?');
      setMode('pomodoro');
      setTimeLeft(MODES.pomodoro.duration);
    }
  };

  const switchMode = (newMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(MODES[newMode].duration);
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
    if (!isRunning && isAmbientPlaying) {
      soundManager.startAmbient(ambientType, 0.15);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(MODES[mode].duration);
  };

  const toggleAmbient = () => {
    if (isAmbientPlaying) {
      soundManager.stopAmbient();
      setIsAmbientPlaying(false);
    } else {
      soundManager.startAmbient(ambientType, 0.15);
      setIsAmbientPlaying(true);
    }
  };

  const changeAmbientType = (type) => {
    setAmbientType(type);
    if (isAmbientPlaying) {
      soundManager.startAmbient(type, 0.15);
    }
  };

  const formatMinutes = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const totalDuration = MODES[mode].duration;
  const progressPercent = ((totalDuration - timeLeft) / totalDuration) * 100;

  return (
    <div className="bg-[#11101A] border border-[#292332] rounded-2xl p-5 shadow-xl relative overflow-hidden">
      {/* Glow background accent */}
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-500"
        style={{ backgroundColor: MODES[mode].color }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: MODES[mode].color }}
          />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8F889D]">
            Focus Pomodoro
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleAmbient}
            title={isAmbientPlaying ? 'Mute ambient sound' : 'Play ambient study sound'}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              isAmbientPlaying
                ? 'bg-[#8B5CF6]/20 border-[#8B5CF6]/40 text-[#A78BFA]'
                : 'bg-[#171421] border-[#292332] text-[#8F889D] hover:text-[#F5F3F7]'
            }`}
          >
            {isAmbientPlaying ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Mode selectors */}
      <div className="grid grid-cols-3 gap-1 bg-[#171421] p-1 rounded-xl border border-[#292332] mb-5">
        {Object.entries(MODES).map(([key, item]) => (
          <button
            key={key}
            onClick={() => switchMode(key)}
            className={`text-xs py-1.5 font-medium rounded-lg transition-all ${
              mode === key
                ? 'bg-[#8B5CF6] text-white shadow-sm'
                : 'text-[#8F889D] hover:text-[#F5F3F7]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Timer Display */}
      <div className="text-center my-4">
        <div className="font-mono text-5xl font-bold tracking-tight text-[#F5F3F7]">
          {formatMinutes(timeLeft)}
        </div>
        <p className="text-xs text-[#8F889D] mt-2">
          {isRunning ? 'Stay focused on your task...' : 'Ready to begin session'}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#1F1A28] h-1.5 rounded-full overflow-hidden mb-5">
        <motion.div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${progressPercent}%`,
            backgroundColor: MODES[mode].color,
          }}
        />
      </div>

      {/* Action Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={resetTimer}
          className="p-2.5 rounded-xl bg-[#171421] border border-[#292332] text-[#8F889D] hover:text-[#F5F3F7] hover:border-[#3D354B] transition-colors"
          title="Reset timer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={toggleTimer}
          className="px-6 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-[#8B5CF6]/25 transition-all active:scale-95"
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4" /> Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4" /> Start Focus
            </>
          )}
        </button>
      </div>

      {/* Ambient Sound Selector */}
      {isAmbientPlaying && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 pt-3 border-t border-[#1F1A28] flex items-center justify-between text-xs"
        >
          <span className="text-[#8F889D]">Ambient Sound:</span>
          <div className="flex gap-2">
            <button
              onClick={() => changeAmbientType('rain')}
              className={`px-2 py-0.5 rounded-md flex items-center gap-1 ${
                ambientType === 'rain'
                  ? 'bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/40'
                  : 'text-[#8F889D] hover:text-[#F5F3F7]'
              }`}
            >
              <CloudRain className="w-3 h-3" /> Rain
            </button>
            <button
              onClick={() => changeAmbientType('white')}
              className={`px-2 py-0.5 rounded-md flex items-center gap-1 ${
                ambientType === 'white'
                  ? 'bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/40'
                  : 'text-[#8F889D] hover:text-[#F5F3F7]'
              }`}
            >
              <Radio className="w-3 h-3" /> White Noise
            </button>
          </div>
        </motion.div>
      )}

      {/* Session Counter */}
      {completedPomodoros > 0 && (
        <div className="mt-4 pt-3 border-t border-[#1F1A28] flex items-center justify-center gap-1.5 text-xs text-[#34D399]">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>{completedPomodoros} session{completedPomodoros > 1 ? 's' : ''} completed today</span>
        </div>
      )}
    </div>
  );
}

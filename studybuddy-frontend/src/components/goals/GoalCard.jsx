import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  Clock,
  Calendar,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Trophy,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { ProgressRing, ProgressBar } from '../ui/Progress';
import { formatDate, isOverdue } from '../../utils/dateUtils';
import { fireCelebration } from '../../utils/confetti';

export function GoalCard({
  goal,
  onEdit,
  onDelete,
  onAddHours,
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const isCompleted = goal.status === 'completed' || (goal.completed_hours >= goal.target_hours && goal.target_hours > 0);
  const percent = goal.progress_percent ?? (goal.target_hours > 0 ? Math.round((goal.completed_hours / goal.target_hours) * 100) : 0);
  const overdue = !isCompleted && goal.deadline && isOverdue(goal.deadline);

  const handleQuickAdd = async (hours) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      const newCompleted = (goal.completed_hours || 0) + hours;
      if (newCompleted >= goal.target_hours) {
        fireCelebration();
      }
      await onAddHours(goal.id, newCompleted);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`group relative bg-[#11101A] border rounded-2xl p-5 shadow-xl transition-all duration-200 flex flex-col justify-between ${
        isCompleted
          ? 'border-[#34D399]/40 bg-gradient-to-b from-[#11101A] to-[#11101A]/90'
          : 'border-[#292332] hover:border-[#8B5CF6]/50'
      }`}
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-base text-[#F5F3F7] leading-tight">
                {goal.title}
              </h3>
              {goal.subject_name && (
                <Badge variant="primary" size="xs">
                  {goal.subject_name}
                </Badge>
              )}
              {isCompleted ? (
                <Badge variant="completed" size="xs">
                  Achieved
                </Badge>
              ) : (
                <Badge variant="active" size="xs">
                  Active Goal
                </Badge>
              )}
            </div>

            {goal.deadline && (
              <div
                className={`flex items-center gap-1.5 text-xs font-medium mt-1.5 ${
                  overdue ? 'text-[#F87171]' : 'text-[#8F889D]'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {overdue ? 'Deadline Passed: ' : 'Target Deadline: '}
                  {formatDate(goal.deadline)}
                </span>
              </div>
            )}
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={() => onEdit(goal)}
              title="Edit goal"
              className="p-1.5 rounded-lg text-[#8F889D] hover:text-[#F5F3F7] hover:bg-[#171421] transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(goal)}
              title="Delete goal"
              className="p-1.5 rounded-lg text-[#8F889D] hover:text-[#F87171] hover:bg-[#171421] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress Display */}
        <div className="flex items-center justify-between gap-4 my-4 bg-[#171421] p-4 rounded-xl border border-[#292332]">
          <div>
            <div className="text-2xl font-bold font-mono text-[#F5F3F7]">
              {goal.completed_hours || 0}{' '}
              <span className="text-sm font-normal text-[#8F889D]">
                / {goal.target_hours} hrs
              </span>
            </div>
            <p className="text-xs text-[#8F889D] mt-1">
              {isCompleted ? 'Goal Completed!' : `${Math.max(0, (goal.target_hours - (goal.completed_hours || 0)).toFixed(1))} hrs remaining`}
            </p>
          </div>

          <ProgressRing
            value={goal.completed_hours || 0}
            max={goal.target_hours || 1}
            size={68}
            strokeWidth={5}
            color={isCompleted ? '#34D399' : '#8B5CF6'}
          >
            {isCompleted ? (
              <Trophy className="w-5 h-5 text-[#34D399]" />
            ) : (
              <span className="text-xs font-bold font-mono text-[#F5F3F7]">
                {Math.round(percent)}%
              </span>
            )}
          </ProgressRing>
        </div>
      </div>

      {/* Footer Quick Log Actions */}
      <div className="pt-2 border-t border-[#1F1A28] flex items-center justify-between gap-2">
        <span className="text-[11px] text-[#8F889D]">Quick Log:</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleQuickAdd(0.5)}
            disabled={isUpdating}
            className="px-2.5 py-1 rounded-lg bg-[#171421] hover:bg-[#8B5CF6]/20 border border-[#292332] hover:border-[#8B5CF6]/40 text-xs font-medium text-[#A78BFA] transition-all disabled:opacity-50 cursor-pointer"
          >
            +30m
          </button>
          <button
            onClick={() => handleQuickAdd(1)}
            disabled={isUpdating}
            className="px-2.5 py-1 rounded-lg bg-[#171421] hover:bg-[#8B5CF6]/20 border border-[#292332] hover:border-[#8B5CF6]/40 text-xs font-medium text-[#A78BFA] transition-all disabled:opacity-50 cursor-pointer"
          >
            +1h
          </button>
          <button
            onClick={() => handleQuickAdd(2)}
            disabled={isUpdating}
            className="px-2.5 py-1 rounded-lg bg-[#171421] hover:bg-[#8B5CF6]/20 border border-[#292332] hover:border-[#8B5CF6]/40 text-xs font-medium text-[#A78BFA] transition-all disabled:opacity-50 cursor-pointer"
          >
            +2h
          </button>
        </div>
      </div>
    </motion.div>
  );
}

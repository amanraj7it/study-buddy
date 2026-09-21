import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Calendar,
  Clock,
  MoreVertical,
  Edit2,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { formatDate, isOverdue, formatRelativeTime } from '../../utils/dateUtils';
import { fireMiniBurst } from '../../utils/confetti';

export function TaskCard({
  task,
  onToggle,
  onEdit,
  onDelete,
}) {
  const [isToggling, setIsToggling] = useState(false);
  const isCompleted = task.status === 'completed';
  const overdue = !isCompleted && task.due_date && isOverdue(task.due_date);

  const handleToggle = async (e) => {
    e.stopPropagation();
    if (isToggling) return;
    setIsToggling(true);
    if (!isCompleted) {
      fireMiniBurst(e.clientX / window.innerWidth, e.clientY / window.innerHeight);
    }
    try {
      await onToggle(task.id);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`group relative flex items-start justify-between gap-3 p-4 rounded-2xl border transition-all duration-200 ${
        isCompleted
          ? 'bg-[#11101A]/40 border-[#1F1A28] opacity-75'
          : 'bg-[#11101A] border-[#292332] hover:border-[#3D354B] hover:shadow-lg hover:shadow-black/40'
      }`}
    >
      <div className="flex items-start gap-3.5 min-w-0 flex-1">
        {/* Toggle Checkbox */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={isToggling}
          aria-label={isCompleted ? "Mark task as incomplete" : "Mark task as completed"}
          className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center transition-all shrink-0 cursor-pointer ${
            isCompleted
              ? 'bg-[#34D399] text-[#09070F] shadow-sm'
              : 'border-2 border-[#3D354B] hover:border-[#8B5CF6] text-transparent hover:text-[#8B5CF6]/30'
          }`}
        >
          <Check className={`w-3.5 h-3.5 stroke-[3] ${isCompleted ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`} />
        </button>

        {/* Task Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4
              className={`text-sm font-semibold text-[#F5F3F7] leading-snug break-words ${
                isCompleted ? 'line-through text-[#8F889D]' : ''
              }`}
            >
              {task.title}
            </h4>
            {task.subject_name && (
              <Badge variant="primary" size="xs">
                {task.subject_name}
              </Badge>
            )}
            <Badge variant={task.priority} size="xs">
              {task.priority}
            </Badge>
            {task.status === 'in_progress' && (
              <Badge variant="in_progress" size="xs">
                in progress
              </Badge>
            )}
          </div>

          {task.description && (
            <p className={`text-xs text-[#8F889D] line-clamp-2 mt-1 mb-2 ${isCompleted ? 'line-through' : ''}`}>
              {task.description}
            </p>
          )}

          {/* Meta Info (Due date, Overdue indicator) */}
          <div className="flex items-center gap-3 text-[11px] text-[#8F889D] mt-2 flex-wrap">
            {task.due_date && (
              <div
                className={`flex items-center gap-1.5 font-medium ${
                  overdue ? 'text-[#F87171]' : 'text-[#8F889D]'
                }`}
              >
                {overdue ? (
                  <AlertCircle className="w-3.5 h-3.5" />
                ) : (
                  <Calendar className="w-3.5 h-3.5" />
                )}
                <span>
                  {overdue ? 'Overdue: ' : 'Due: '}
                  {formatDate(task.due_date)} ({formatRelativeTime(task.due_date)})
                </span>
              </div>
            )}
            {task.completed_at && (
              <div className="flex items-center gap-1 text-[#34D399]">
                <Clock className="w-3 h-3" />
                <span>Completed {formatRelativeTime(task.completed_at)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => onEdit(task)}
          title="Edit task"
          className="p-1.5 rounded-lg text-[#8F889D] hover:text-[#F5F3F7] hover:bg-[#171421] transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(task)}
          title="Delete task"
          className="p-1.5 rounded-lg text-[#8F889D] hover:text-[#F87171] hover:bg-[#171421] transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

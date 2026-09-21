import React from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Repeat,
  Edit2,
  Trash2,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { formatTime, formatDate } from '../../utils/dateUtils';

export function ScheduleEvent({
  event,
  onEdit,
  onDelete,
  compact = false,
}) {
  const subjectColor = event.subject_color || '#8B5CF6';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`group relative bg-[#11101A] border border-[#292332] hover:border-[#8B5CF6]/50 rounded-2xl p-4 transition-all duration-200 shadow-md ${
        compact ? 'p-3' : 'p-4'
      }`}
    >
      <div
        className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full"
        style={{ backgroundColor: subjectColor }}
      />

      <div className="pl-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4 className="font-semibold text-sm text-[#F5F3F7] leading-snug">
                {event.title}
              </h4>
              {event.subject_name && (
                <Badge color={subjectColor} size="xs">
                  {event.subject_name}
                </Badge>
              )}
              {event.is_recurring && (
                <span className="inline-flex items-center gap-1 text-[10px] text-[#A78BFA] bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 px-1.5 py-0.5 rounded">
                  <Repeat className="w-2.5 h-2.5" />
                  {event.recurrence_rule || 'Recurring'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-[#8F889D] mt-1 flex-wrap">
              <div className="flex items-center gap-1">
                <CalendarIcon className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span>{formatDate(event.start_time)}</span>
              </div>
              <div className="flex items-center gap-1 font-mono text-[#F5F3F7]">
                <Clock className="w-3 h-3 text-[#34D399]" />
                <span>
                  {formatTime(event.start_time)} – {formatTime(event.end_time)}
                </span>
              </div>
            </div>

            {event.description && (
              <p className="text-xs text-[#8F889D] mt-2 line-clamp-2">
                {event.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={() => onEdit(event)}
              title="Edit event"
              className="p-1.5 rounded-lg text-[#8F889D] hover:text-[#F5F3F7] hover:bg-[#171421] transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(event)}
              title="Delete event"
              className="p-1.5 rounded-lg text-[#8F889D] hover:text-[#F87171] hover:bg-[#171421] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

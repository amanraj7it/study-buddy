import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen,
  CheckSquare,
  FileText,
  MoreVertical,
  Edit2,
  Trash2,
  ArrowUpRight,
} from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';

export function SubjectCard({
  subject,
  onEdit,
  onDelete,
}) {
  const navigate = useNavigate();
  const color = subject.color || '#3B82F6';

  const handleClick = (e) => {
    // If click was on edit/delete action button, don't navigate
    if (e.target.closest('button')) return;
    navigate(`/subjects/${subject.id}`);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      onClick={handleClick}
      className="group relative bg-[#11101A] border border-[#292332] hover:border-[#8B5CF6]/50 rounded-2xl p-5 shadow-lg shadow-black/20 hover:shadow-[#8B5CF6]/5 transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden"
    >
      {/* Top Color Accent Line */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5"
        style={{ backgroundColor: color }}
      />

      <div>
        {/* Header with icon and action buttons */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
              style={{
                backgroundColor: `${color}1A`,
                borderColor: `${color}4D`,
                color: color,
              }}
            >
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-[#F5F3F7] group-hover:text-[#A78BFA] transition-colors leading-tight">
                {subject.name}
              </h3>
              <p className="text-[10px] text-[#8F889D]">
                Added {formatDate(subject.created_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(subject);
              }}
              title="Edit subject"
              className="p-1.5 rounded-lg text-[#8F889D] hover:text-[#F5F3F7] hover:bg-[#171421] transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(subject);
              }}
              title="Delete subject"
              className="p-1.5 rounded-lg text-[#8F889D] hover:text-[#F87171] hover:bg-[#171421] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Description */}
        {subject.description ? (
          <p className="text-xs text-[#8F889D] line-clamp-2 mb-4 leading-relaxed">
            {subject.description}
          </p>
        ) : (
          <p className="text-xs text-[#645E73] italic mb-4">No description provided.</p>
        )}
      </div>

      {/* Footer Metrics */}
      <div className="flex items-center justify-between pt-3 border-t border-[#1F1A28] text-xs text-[#8F889D]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <CheckSquare className="w-3.5 h-3.5 text-[#A78BFA]" />
            <span>{subject.task_count ?? 0} tasks</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-[#34D399]" />
            <span>{subject.note_count ?? 0} notes</span>
          </div>
        </div>

        <div className="flex items-center text-[#A78BFA] opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5">
          <ArrowUpRight className="w-4 h-4" />
        </div>
      </div>
    </motion.div>
  );
}

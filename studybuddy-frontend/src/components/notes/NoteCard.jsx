import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  Tag,
  Clock,
  Edit2,
  Trash2,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { formatDate, formatRelativeTime } from '../../utils/dateUtils';

export function NoteCard({
  note,
  onEdit,
  onDelete,
  onStudyFlashcards,
}) {
  const navigate = useNavigate();

  const tagList = note.tags
    ? note.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const handleClick = (e) => {
    if (e.target.closest('button')) return;
    navigate(`/notes/${note.id}`);
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
      className="group relative bg-[#11101A] border border-[#292332] hover:border-[#8B5CF6]/50 rounded-2xl p-5 shadow-lg shadow-black/20 hover:shadow-[#8B5CF6]/5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-base text-[#F5F3F7] group-hover:text-[#A78BFA] transition-colors line-clamp-1">
              {note.title}
            </h3>
            {note.subject_name && (
              <Badge variant="primary" size="xs">
                {note.subject_name}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            {onStudyFlashcards && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStudyFlashcards(note);
                }}
                title="Practice Flashcards"
                className="p-1.5 rounded-lg text-[#8F889D] hover:text-[#A78BFA] hover:bg-[#171421] transition-colors"
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(note);
              }}
              title="Edit note"
              className="p-1.5 rounded-lg text-[#8F889D] hover:text-[#F5F3F7] hover:bg-[#171421] transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(note);
              }}
              title="Delete note"
              className="p-1.5 rounded-lg text-[#8F889D] hover:text-[#F87171] hover:bg-[#171421] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content Snippet */}
        <p className="text-xs text-[#8F889D] line-clamp-3 mb-4 leading-relaxed font-normal whitespace-pre-line">
          {note.content || 'Empty note content...'}
        </p>

        {/* Tags */}
        {tagList.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            {tagList.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#171421] border border-[#292332] text-[10px] text-[#8F889D]"
              >
                <Tag className="w-2.5 h-2.5 text-[#8B5CF6]" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-[#1F1A28] text-[11px] text-[#645E73]">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-[#8F889D]" />
          <span>Updated {formatRelativeTime(note.updated_at || note.created_at)}</span>
        </div>
        <ArrowUpRight className="w-3.5 h-3.5 text-[#A78BFA] opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </motion.div>
  );
}

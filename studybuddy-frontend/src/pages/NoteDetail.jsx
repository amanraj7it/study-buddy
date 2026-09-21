import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  ArrowLeft,
  Save,
  Trash2,
  Layers,
  Tag,
  Clock,
  BookOpen,
  Eye,
  Edit3,
} from 'lucide-react';
import { api } from '../api/api';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { FlashcardDeck } from '../components/notes/FlashcardDeck';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Skeleton } from '../components/ui/Skeleton';
import { formatDate, formatRelativeTime } from '../utils/dateUtils';

export function NoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [note, setNote] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [activeTab, setActiveTab] = useState('write'); // 'write' | 'preview'
  const [isSaving, setIsSaving] = useState(false);

  // Modals
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isFlashcardOpen, setIsFlashcardOpen] = useState(false);

  // Load subjects
  useEffect(() => {
    api.subjects.getAll()
      .then((res) => {
        if (res.success) setSubjects(res.data || []);
      })
      .catch((err) => console.warn('Could not load subjects', err));
  }, []);

  const fetchNote = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.notes.getById(id);
      if (res.success && res.data) {
        setNote(res.data);
        setTitle(res.data.title || '');
        setContent(res.data.content || '');
        setTags(res.data.tags || '');
        setSubjectId(res.data.subject_id ? String(res.data.subject_id) : '');
      } else {
        toast.error('Note not found');
        navigate('/notes');
      }
    } catch (err) {
      toast.error(err.message || 'Error loading note');
      navigate('/notes');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    fetchNote();
  }, [fetchNote]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      toast.error('Note title is required');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: title.trim(),
        content: content.trim() || null,
        tags: tags.trim() || null,
        subject_id: subjectId ? parseInt(subjectId, 10) : null,
      };

      const res = await api.notes.update(id, payload);
      if (res.success) {
        setNote(res.data);
        toast.success('Note saved successfully');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await api.notes.delete(id);
      if (res.success) {
        toast.success('Note deleted');
        navigate('/notes');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete note');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!note) return null;

  const tagList = tags
    ? tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#292332]">
        <button
          onClick={() => navigate('/notes')}
          className="inline-flex items-center gap-2 text-xs font-medium text-[#8F889D] hover:text-[#F5F3F7] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to all notes</span>
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFlashcardOpen(true)}
            icon={Layers}
          >
            Study Flashcards
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsDeleteOpen(true)}
            icon={Trash2}
          >
            Delete
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={isSaving}
            icon={Save}
          >
            Save Note
          </Button>
        </div>
      </div>

      {/* Title & Metadata Strip */}
      <div className="bg-[#11101A] border border-[#292332] rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note Title..."
              className="w-full bg-transparent text-xl sm:text-2xl font-bold font-display text-[#F5F3F7] focus:outline-none placeholder-[#645E73]"
            />
          </div>
          <div>
            <Select
              label="Subject"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              <option value="">No Subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <Input
          label="Tags (comma-separated)"
          placeholder="e.g. formulas, exam1, midterm"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          icon={Tag}
        />

        <div className="flex items-center gap-4 text-xs text-[#8F889D] pt-2 border-t border-[#1F1A28]">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Updated {formatRelativeTime(note.updated_at || note.created_at)}</span>
          </div>
          {note.subject_name && (
            <Badge variant="primary" size="xs">
              {note.subject_name}
            </Badge>
          )}
        </div>
      </div>

      {/* Editor & Markdown Preview Canvas */}
      <div className="bg-[#11101A] border border-[#292332] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1F1A28] pb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8F889D]">
            Note Content
          </span>
          <div className="flex items-center gap-1 bg-[#171421] p-1 rounded-xl border border-[#292332]">
            <button
              onClick={() => setActiveTab('write')}
              className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'write'
                  ? 'bg-[#8B5CF6] text-white'
                  : 'text-[#8F889D] hover:text-[#F5F3F7]'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" /> Write
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'preview'
                  ? 'bg-[#8B5CF6] text-white'
                  : 'text-[#8F889D] hover:text-[#F5F3F7]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
          </div>
        </div>

        {activeTab === 'write' ? (
          <textarea
            rows={16}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your notes here... Support markdown-style notes, formula notes, definitions, or Q&A flashcards..."
            className="w-full bg-[#0E0D16] border border-[#292332] focus:border-[#8B5CF6] text-[#F5F3F7] placeholder-[#645E73] text-sm rounded-xl p-4 focus:outline-none transition-colors font-mono leading-relaxed resize-y"
          />
        ) : (
          <div className="min-h-[380px] bg-[#0E0D16] border border-[#292332] rounded-xl p-6 text-sm text-[#F5F3F7] whitespace-pre-line leading-relaxed">
            {content || <span className="text-[#645E73] italic">No content to preview...</span>}
          </div>
        )}
      </div>

      {/* Flashcards Deck Dialog */}
      {isFlashcardOpen && (
        <FlashcardDeck
          isOpen={true}
          note={{ title, content }}
          onClose={() => setIsFlashcardOpen(false)}
        />
      )}

      {/* Delete Confirmation */}
      {isDeleteOpen && (
        <ConfirmDialog
          isOpen={true}
          title="Delete Note"
          message={`Are you sure you want to delete "${note.title}"? This cannot be undone.`}
          confirmLabel="Delete Note"
          isLoading={isDeleting}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

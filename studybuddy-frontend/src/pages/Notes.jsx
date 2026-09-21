import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Layers,
  Sparkles,
  Tag,
  X,
} from 'lucide-react';
import { api } from '../api/api';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { NoteCard } from '../components/notes/NoteCard';
import { NoteEditor } from '../components/notes/NoteEditor';
import { FlashcardDeck } from '../components/notes/FlashcardDeck';
import { EmptyState } from '../components/ui/EmptyState';
import { CardSkeleton } from '../components/ui/Skeleton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export function Notes() {
  const { toast } = useToast();
  const [notes, setNotes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [subjectId, setSubjectId] = useState('all');
  const [selectedTag, setSelectedTag] = useState('');

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [flashcardNote, setFlashcardNote] = useState(null);

  // Fetch subjects
  useEffect(() => {
    api.subjects.getAll()
      .then((res) => {
        if (res.success) setSubjects(res.data || []);
      })
      .catch((err) => console.warn('Could not load subjects', err));
  }, []);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (subjectId !== 'all') params.subject_id = subjectId;

      const res = await api.notes.getAll(params);
      if (res.success) {
        setNotes(res.data || []);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [search, subjectId, toast]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Extract all unique tags
  const allTags = Array.from(
    new Set(
      notes
        .flatMap((n) => (n.tags ? n.tags.split(',') : []))
        .map((t) => t.trim())
        .filter(Boolean)
    )
  );

  // Filter notes by selected tag in memory
  const filteredNotes = selectedTag
    ? notes.filter((n) =>
        n.tags && n.tags.toLowerCase().includes(selectedTag.toLowerCase())
      )
    : notes;

  const handleDelete = async () => {
    if (!noteToDelete) return;
    setIsDeleting(true);
    try {
      const res = await api.notes.delete(noteToDelete.id);
      if (res.success) {
        toast.success('Note deleted');
        setNotes((prev) => prev.filter((n) => n.id !== noteToDelete.id));
        setNoteToDelete(null);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete note');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Study Notes & Knowledge Base"
        description="Summaries, equations, lecture takeaways, and interactive flashcard decks."
      >
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditingNote(null);
            setIsEditorOpen(true);
          }}
          icon={Plus}
        >
          New Note
        </Button>
      </PageHeader>

      {/* Search & Subject Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8F889D] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes by title or content..."
            className="w-full bg-[#11101A] border border-[#292332] text-[#F5F3F7] placeholder-[#645E73] text-xs sm:text-sm rounded-xl pl-9 pr-3.5 py-2 focus:outline-none focus:border-[#8B5CF6] transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8F889D] hover:text-[#F5F3F7]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          className="bg-[#11101A] border border-[#292332] text-[#F5F3F7] text-xs sm:text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-[#8B5CF6]"
        >
          <option value="all">All Subjects</option>
          {subjects.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tag Pills Filter */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedTag('')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              !selectedTag
                ? 'bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/40'
                : 'text-[#8F889D] hover:text-[#F5F3F7] bg-[#171421] border border-[#292332]'
            }`}
          >
            All Tags
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag === selectedTag ? '' : tag)}
              className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                selectedTag === tag
                  ? 'bg-[#8B5CF6] text-white shadow-sm'
                  : 'text-[#8F889D] hover:text-[#F5F3F7] bg-[#171421] border border-[#292332]'
              }`}
            >
              <Tag className="w-2.5 h-2.5" />
              <span>{tag}</span>
            </button>
          ))}
        </div>
      )}

      {/* Notes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filteredNotes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No notes found"
          description={
            search || subjectId !== 'all' || selectedTag
              ? 'Try modifying your search query or removing active tag filters.'
              : 'Create lecture notes, formula sheets, or study summaries.'
          }
          actionLabel="Create First Note"
          onAction={() => {
            setEditingNote(null);
            setIsEditorOpen(true);
          }}
          actionIcon={Plus}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={(n) => {
                  setEditingNote(n);
                  setIsEditorOpen(true);
                }}
                onDelete={(n) => setNoteToDelete(n)}
                onStudyFlashcards={(n) => setFlashcardNote(n)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Note Editor Modal */}
      {isEditorOpen && (
        <NoteEditor
          isOpen={true}
          note={editingNote}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingNote(null);
          }}
          onSuccess={() => {
            setIsEditorOpen(false);
            setEditingNote(null);
            toast.success(editingNote ? 'Note updated' : 'Note created');
            fetchNotes();
          }}
        />
      )}

      {/* Flashcards Modal */}
      {flashcardNote && (
        <FlashcardDeck
          isOpen={true}
          note={flashcardNote}
          onClose={() => setFlashcardNote(null)}
        />
      )}

      {/* Delete Confirmation */}
      {noteToDelete && (
        <ConfirmDialog
          isOpen={true}
          title="Delete Study Note"
          message={`Are you sure you want to delete "${noteToDelete.title}"? This cannot be undone.`}
          confirmLabel="Delete Note"
          isLoading={isDeleting}
          onClose={() => setNoteToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  CheckSquare,
  FileText,
  Target,
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api } from '../api/api';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { TaskCard } from '../components/tasks/TaskCard';
import { NoteCard } from '../components/notes/NoteCard';
import { GoalCard } from '../components/goals/GoalCard';
import { TaskForm } from '../components/tasks/TaskForm';
import { NoteEditor } from '../components/notes/NoteEditor';
import { GoalForm } from '../components/goals/GoalForm';
import { SubjectForm } from '../components/subjects/SubjectForm';
import { FlashcardDeck } from '../components/notes/FlashcardDeck';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton, CardSkeleton } from '../components/ui/Skeleton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { formatDate } from '../../src/utils/dateUtils';

export function SubjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' | 'notes' | 'goals'

  // Modals
  const [isEditSubjectOpen, setIsEditSubjectOpen] = useState(false);
  const [isDeleteSubjectOpen, setIsDeleteSubjectOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sub-resource modals
  const [activeModal, setActiveModal] = useState(null); // 'task' | 'note' | 'goal'
  const [editingItem, setEditingItem] = useState(null);
  const [flashcardNote, setFlashcardNote] = useState(null);

  const fetchSubject = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.subjects.getById(id);
      if (res.success && res.data) {
        setSubject(res.data);
      } else {
        toast.error('Subject not found');
        navigate('/subjects');
      }
    } catch (err) {
      toast.error(err.message || 'Error loading subject');
      navigate('/subjects');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    fetchSubject();
  }, [fetchSubject]);

  const handleDeleteSubject = async () => {
    setIsDeleting(true);
    try {
      const res = await api.subjects.delete(id);
      if (res.success) {
        toast.success('Subject deleted');
        navigate('/subjects');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete subject');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleTask = async (taskId) => {
    try {
      const res = await api.tasks.toggle(taskId);
      if (res.success) {
        toast.success(res.data.status === 'completed' ? 'Task completed!' : 'Task marked pending');
        fetchSubject();
      }
    } catch (err) {
      toast.error(err.message || 'Could not toggle task');
    }
  };

  const handleAddGoalHours = async (goalId, newHours) => {
    try {
      const res = await api.goals.update(goalId, { completed_hours: newHours });
      if (res.success) {
        toast.success('Study hours updated');
        fetchSubject();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update goal');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 w-full" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (!subject) return null;

  const color = subject.color || '#8B5CF6';
  const tasks = subject.tasks || [];
  const notes = subject.notes || [];
  const goals = subject.goals || [];

  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/subjects')}
        className="inline-flex items-center gap-2 text-xs font-medium text-[#8F889D] hover:text-[#F5F3F7] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to all subjects</span>
      </button>

      {/* Subject Header Banner */}
      <div className="relative bg-[#11101A] border border-[#292332] rounded-3xl p-6 sm:p-8 shadow-xl overflow-hidden">
        <div
          className="absolute top-0 left-0 right-0 h-2"
          style={{ backgroundColor: color }}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-lg"
              style={{
                backgroundColor: `${color}20`,
                borderColor: `${color}60`,
                color: color,
              }}
            >
              <BookOpen className="w-7 h-7" />
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold font-display text-[#F5F3F7]">
                  {subject.name}
                </h1>
                <Badge color={color}>Active Course</Badge>
              </div>
              <p className="text-xs sm:text-sm text-[#8F889D] mt-1 max-w-2xl">
                {subject.description || 'No course syllabus description provided.'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsEditSubjectOpen(true)}
              icon={Edit2}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsDeleteSubjectOpen(true)}
              icon={Trash2}
            >
              Delete
            </Button>
          </div>
        </div>

        {/* Progress Stats Strip */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-[#1F1A28]">
          <div className="text-center sm:text-left">
            <span className="text-[11px] uppercase tracking-wider text-[#8F889D] font-medium">
              Tasks
            </span>
            <p className="text-lg sm:text-xl font-bold font-mono text-[#F5F3F7]">
              {completedTasks} / {tasks.length}
            </p>
          </div>
          <div className="text-center sm:text-left">
            <span className="text-[11px] uppercase tracking-wider text-[#8F889D] font-medium">
              Notes
            </span>
            <p className="text-lg sm:text-xl font-bold font-mono text-[#F5F3F7]">
              {notes.length}
            </p>
          </div>
          <div className="text-center sm:text-left">
            <span className="text-[11px] uppercase tracking-wider text-[#8F889D] font-medium">
              Task Progress
            </span>
            <p className="text-lg sm:text-xl font-bold font-mono text-[#34D399]">
              {taskCompletionRate}%
            </p>
          </div>
        </div>
      </div>

      {/* Tabs & Tab Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#292332] pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'tasks'
                ? 'bg-[#8B5CF6] text-white shadow-md'
                : 'text-[#8F889D] hover:text-[#F5F3F7] hover:bg-[#171421]'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Tasks ({tasks.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'notes'
                ? 'bg-[#8B5CF6] text-white shadow-md'
                : 'text-[#8F889D] hover:text-[#F5F3F7] hover:bg-[#171421]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Notes ({notes.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'goals'
                ? 'bg-[#8B5CF6] text-white shadow-md'
                : 'text-[#8F889D] hover:text-[#F5F3F7] hover:bg-[#171421]'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Goals ({goals.length})</span>
          </button>
        </div>

        {/* Tab Specific Quick Add */}
        {activeTab === 'tasks' && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingItem(null);
              setActiveModal('task');
            }}
            icon={Plus}
          >
            Add Task
          </Button>
        )}
        {activeTab === 'notes' && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingItem(null);
              setActiveModal('note');
            }}
            icon={Plus}
          >
            Add Note
          </Button>
        )}
        {activeTab === 'goals' && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingItem(null);
              setActiveModal('goal');
            }}
            icon={Plus}
          >
            Set Goal
          </Button>
        )}
      </div>

      {/* Tab Panels */}
      {activeTab === 'tasks' && (
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="No tasks in this subject"
              description={`Add homework, problem sets, or readings for ${subject.name}.`}
              actionLabel="Add Subject Task"
              onAction={() => {
                setEditingItem(null);
                setActiveModal('task');
              }}
              actionIcon={Plus}
            />
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={handleToggleTask}
                onEdit={(t) => {
                  setEditingItem(t);
                  setActiveModal('task');
                }}
                onDelete={async (t) => {
                  await api.tasks.delete(t.id);
                  toast.success('Task deleted');
                  fetchSubject();
                }}
              />
            ))
          )}
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {notes.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                icon={FileText}
                title="No study notes yet"
                description={`Capture lecture summaries and formulas for ${subject.name}.`}
                actionLabel="Create Subject Note"
                onAction={() => {
                  setEditingItem(null);
                  setActiveModal('note');
                }}
                actionIcon={Plus}
              />
            </div>
          ) : (
            notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={(n) => {
                  setEditingItem(n);
                  setActiveModal('note');
                }}
                onDelete={async (n) => {
                  await api.notes.delete(n.id);
                  toast.success('Note deleted');
                  fetchSubject();
                }}
                onStudyFlashcards={(n) => setFlashcardNote(n)}
              />
            ))
          )}
        </div>
      )}

      {activeTab === 'goals' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {goals.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                icon={Target}
                title="No study goals set"
                description={`Set target hours and mastery milestones for ${subject.name}.`}
                actionLabel="Create Subject Goal"
                onAction={() => {
                  setEditingItem(null);
                  setActiveModal('goal');
                }}
                actionIcon={Plus}
              />
            </div>
          ) : (
            goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={(g) => {
                  setEditingItem(g);
                  setActiveModal('goal');
                }}
                onDelete={async (g) => {
                  await api.goals.delete(g.id);
                  toast.success('Goal deleted');
                  fetchSubject();
                }}
                onAddHours={handleAddGoalHours}
              />
            ))
          )}
        </div>
      )}

      {/* Edit Subject Modal */}
      {isEditSubjectOpen && (
        <SubjectForm
          isOpen={true}
          subject={subject}
          onClose={() => setIsEditSubjectOpen(false)}
          onSuccess={() => {
            setIsEditSubjectOpen(false);
            toast.success('Subject updated');
            fetchSubject();
          }}
        />
      )}

      {/* Delete Subject Dialog */}
      {isDeleteSubjectOpen && (
        <ConfirmDialog
          isOpen={true}
          title="Delete Subject"
          message={`Are you sure you want to delete "${subject.name}" and all associated materials? This action cannot be undone.`}
          confirmLabel="Delete Subject"
          isLoading={isDeleting}
          onClose={() => setIsDeleteSubjectOpen(false)}
          onConfirm={handleDeleteSubject}
        />
      )}

      {/* Task Modal */}
      {activeModal === 'task' && (
        <TaskForm
          isOpen={true}
          task={editingItem}
          initialSubjectId={subject.id}
          onClose={() => {
            setActiveModal(null);
            setEditingItem(null);
          }}
          onSuccess={() => {
            setActiveModal(null);
            setEditingItem(null);
            toast.success(editingItem ? 'Task updated' : 'Task created');
            fetchSubject();
          }}
        />
      )}

      {/* Note Modal */}
      {activeModal === 'note' && (
        <NoteEditor
          isOpen={true}
          note={editingItem}
          initialSubjectId={subject.id}
          onClose={() => {
            setActiveModal(null);
            setEditingItem(null);
          }}
          onSuccess={() => {
            setActiveModal(null);
            setEditingItem(null);
            toast.success(editingItem ? 'Note updated' : 'Note created');
            fetchSubject();
          }}
        />
      )}

      {/* Goal Modal */}
      {activeModal === 'goal' && (
        <GoalForm
          isOpen={true}
          goal={editingItem}
          initialSubjectId={subject.id}
          onClose={() => {
            setActiveModal(null);
            setEditingItem(null);
          }}
          onSuccess={() => {
            setActiveModal(null);
            setEditingItem(null);
            toast.success(editingItem ? 'Goal updated' : 'Goal created');
            fetchSubject();
          }}
        />
      )}

      {/* Flashcard Study Deck */}
      {flashcardNote && (
        <FlashcardDeck
          isOpen={true}
          note={flashcardNote}
          onClose={() => setFlashcardNote(null)}
        />
      )}
    </div>
  );
}

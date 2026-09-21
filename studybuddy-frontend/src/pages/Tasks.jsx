import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
} from 'lucide-react';
import { api } from '../api/api';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskForm } from '../components/tasks/TaskForm';
import { TaskFilters } from '../components/tasks/TaskFilters';
import { EmptyState } from '../components/ui/EmptyState';
import { CardSkeleton } from '../components/ui/Skeleton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export function Tasks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [priority, setPriority] = useState(searchParams.get('priority') || 'all');
  const [subjectId, setSubjectId] = useState(searchParams.get('subject_id') || 'all');

  // Modals & Confirmation
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load Subjects
  useEffect(() => {
    api.subjects.getAll()
      .then((res) => {
        if (res.success) setSubjects(res.data || []);
      })
      .catch((err) => console.warn('Failed to load subjects for filter', err));
  }, []);

  // Fetch Tasks with query parameters
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (status !== 'all') params.status = status;
      if (priority !== 'all') params.priority = priority;
      if (subjectId !== 'all') params.subject_id = subjectId;

      const res = await api.tasks.getAll(params);
      if (res.success) {
        setTasks(res.data || []);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [search, status, priority, subjectId, toast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Sync state with search params
  const handleClearFilters = () => {
    setSearch('');
    setStatus('all');
    setPriority('all');
    setSubjectId('all');
  };

  // Toggle completion with optimistic update
  const handleToggle = async (taskId) => {
    // Optimistic toggle
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const newStatus = t.status === 'completed' ? 'pending' : 'completed';
          return {
            ...t,
            status: newStatus,
            completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
          };
        }
        return t;
      })
    );

    try {
      const res = await api.tasks.toggle(taskId);
      if (res.success) {
        // Reconcile with server response
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? res.data : t))
        );
        toast.success(res.data.status === 'completed' ? 'Task completed!' : 'Task marked pending');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to toggle task');
      fetchTasks(); // Rollback on error
    }
  };

  const handleDelete = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    try {
      const res = await api.tasks.delete(taskToDelete.id);
      if (res.success) {
        toast.success('Task deleted');
        setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
        setTaskToDelete(null);
      }
    } catch (err) {
      toast.error(err.message || 'Could not delete task');
    } finally {
      setIsDeleting(false);
    }
  };

  const pendingCount = tasks.filter((t) => t.status !== 'completed').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks & Assignments"
        description="Manage study checklists, problem sets, and course assignments."
      >
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditingTask(null);
            setIsFormOpen(true);
          }}
          icon={Plus}
        >
          New Task
        </Button>
      </PageHeader>

      {/* Filter Toolbar */}
      <TaskFilters
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        priority={priority}
        onPriorityChange={setPriority}
        subjectId={subjectId}
        onSubjectChange={setSubjectId}
        subjects={subjects}
        onClearFilters={handleClearFilters}
      />

      {/* Task List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks match your criteria"
          description={
            search || status !== 'all' || priority !== 'all' || subjectId !== 'all'
              ? 'Try adjusting your filters or search terms.'
              : 'Add your first task to start tracking your study agenda.'
          }
          actionLabel="Create New Task"
          onAction={() => {
            setEditingTask(null);
            setIsFormOpen(true);
          }}
          actionIcon={Plus}
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={handleToggle}
                onEdit={(t) => {
                  setEditingTask(t);
                  setIsFormOpen(true);
                }}
                onDelete={(t) => setTaskToDelete(t)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isFormOpen && (
        <TaskForm
          isOpen={true}
          task={editingTask}
          onClose={() => {
            setIsFormOpen(false);
            setEditingTask(null);
          }}
          onSuccess={() => {
            setIsFormOpen(false);
            setEditingTask(null);
            toast.success(editingTask ? 'Task updated' : 'Task created');
            fetchTasks();
          }}
        />
      )}

      {/* Delete Confirmation */}
      {taskToDelete && (
        <ConfirmDialog
          isOpen={true}
          title="Delete Task"
          message={`Are you sure you want to delete "${taskToDelete.title}"? This cannot be undone.`}
          confirmLabel="Delete Task"
          isLoading={isDeleting}
          onClose={() => setTaskToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

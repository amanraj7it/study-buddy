import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Plus,
  Trophy,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { api } from '../api/api';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { GoalCard } from '../components/goals/GoalCard';
import { GoalForm } from '../components/goals/GoalForm';
import { EmptyState } from '../components/ui/EmptyState';
import { CardSkeleton } from '../components/ui/Skeleton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { fireCelebration } from '../utils/confetti';

export function Goals() {
  const { toast } = useToast();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [goalToDelete, setGoalToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.goals.getAll();
      if (res.success) {
        setGoals(res.data || []);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleAddHours = async (goalId, newCompleted) => {
    try {
      const res = await api.goals.update(goalId, { completed_hours: newCompleted });
      if (res.success) {
        toast.success('Study time logged!');
        fetchGoals();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update goal');
    }
  };

  const handleDelete = async () => {
    if (!goalToDelete) return;
    setIsDeleting(true);
    try {
      const res = await api.goals.delete(goalToDelete.id);
      if (res.success) {
        toast.success('Goal deleted');
        setGoals((prev) => prev.filter((g) => g.id !== goalToDelete.id));
        setGoalToDelete(null);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete goal');
    } finally {
      setIsDeleting(false);
    }
  };

  const totalTargetHours = goals.reduce((acc, g) => acc + (g.target_hours || 0), 0);
  const totalCompletedHours = goals.reduce((acc, g) => acc + (g.completed_hours || 0), 0);
  const completedGoals = goals.filter((g) => g.status === 'completed' || (g.completed_hours >= g.target_hours && g.target_hours > 0)).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Study Goals & Milestones"
        description="Set target study hours, track subject milestones, and build consistent habits."
      >
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditingGoal(null);
            setIsFormOpen(true);
          }}
          icon={Plus}
        >
          New Goal
        </Button>
      </PageHeader>

      {/* Goal Summary Statistics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#11101A] border border-[#292332] p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[#8B5CF6]">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[#8F889D]">Total Goals</p>
            <p className="text-xl font-bold font-mono text-[#F5F3F7]">
              {goals.length} Active / {completedGoals} Achieved
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#34D399]/15 border border-[#34D399]/30 flex items-center justify-center text-[#34D399]">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[#8F889D]">Study Hours Completed</p>
            <p className="text-xl font-bold font-mono text-[#F5F3F7]">
              {totalCompletedHours.toFixed(1)} / {totalTargetHours.toFixed(1)} hrs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FBBF24]/15 border border-[#FBBF24]/30 flex items-center justify-center text-[#FBBF24]">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[#8F889D]">Overall Progress</p>
            <p className="text-xl font-bold font-mono text-[#34D399]">
              {totalTargetHours > 0 ? Math.round((totalCompletedHours / totalTargetHours) * 100) : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Goal Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No study goals created"
          description="Set hour goals for exam preparation, courses, or personal study milestones."
          actionLabel="Create First Goal"
          onAction={() => {
            setEditingGoal(null);
            setIsFormOpen(true);
          }}
          actionIcon={Plus}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={(g) => {
                  setEditingGoal(g);
                  setIsFormOpen(true);
                }}
                onDelete={(g) => setGoalToDelete(g)}
                onAddHours={handleAddHours}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create / Edit Goal Modal */}
      {isFormOpen && (
        <GoalForm
          isOpen={true}
          goal={editingGoal}
          onClose={() => {
            setIsFormOpen(false);
            setEditingGoal(null);
          }}
          onSuccess={() => {
            setIsFormOpen(false);
            setEditingGoal(null);
            toast.success(editingGoal ? 'Goal updated' : 'Goal created');
            fetchGoals();
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {goalToDelete && (
        <ConfirmDialog
          isOpen={true}
          title="Delete Study Goal"
          message={`Are you sure you want to delete "${goalToDelete.title}"?`}
          confirmLabel="Delete Goal"
          isLoading={isDeleting}
          onClose={() => setGoalToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  FileText,
  Calendar,
  Target,
  Clock,
  TrendingUp,
  Plus,
  ArrowRight,
  Sparkles,
  Flame,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { api } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { ProgressRing, ProgressBar } from '../components/ui/Progress';
import { Skeleton, CardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { TaskCard } from '../components/tasks/TaskCard';
import { ScheduleEvent } from '../components/schedule/ScheduleEvent';
import { PomodoroWidget } from '../components/focus/PomodoroWidget';
import { TaskForm } from '../components/tasks/TaskForm';
import { NoteEditor } from '../components/notes/NoteEditor';
import { ScheduleForm } from '../components/schedule/ScheduleForm';
import { GoalForm } from '../components/goals/GoalForm';

export function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [activeModal, setActiveModal] = useState(null); // 'task' | 'note' | 'schedule' | 'goal'
  const [editingTask, setEditingTask] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setError(null);
      const res = await api.dashboard.get();
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error || 'Failed to load dashboard data');
      }
    } catch (err) {
      setError(err.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();

    const handleDataChanged = () => {
      fetchDashboard();
    };

    window.addEventListener('studybuddy:data-changed', handleDataChanged);
    return () => {
      window.removeEventListener('studybuddy:data-changed', handleDataChanged);
    };
  }, [fetchDashboard]);

  const handleToggleTask = async (taskId) => {
    try {
      const res = await api.tasks.toggle(taskId);
      if (res.success) {
        toast.success(res.data.status === 'completed' ? 'Task completed! 🎯' : 'Task marked pending');
        fetchDashboard();
      }
    } catch (err) {
      toast.error(err.message || 'Could not toggle task');
    }
  };

  const handleTaskDelete = async (task) => {
    try {
      const res = await api.tasks.delete(task.id);
      if (res.success) {
        toast.success('Task removed');
        fetchDashboard();
      }
    } catch (err) {
      toast.error(err.message || 'Could not delete task');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-[#171421] rounded-xl w-1/3 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-[#11101A] border border-[#F87171]/40 rounded-2xl">
        <AlertCircle className="w-10 h-10 text-[#F87171] mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-[#F5F3F7]">Failed to load dashboard</h3>
        <p className="text-sm text-[#8F889D] mt-1 mb-4">{error}</p>
        <Button onClick={fetchDashboard} variant="primary" size="sm">
          Try Again
        </Button>
      </div>
    );
  }

  const stats = data?.stats || {
    total_subjects: 0,
    total_tasks: 0,
    pending_tasks: 0,
    completed_tasks: 0,
    completion_rate: 0,
    total_notes: 0,
    weekly_study_hours: 0,
  };

  const upcomingEvents = data?.upcoming_events || [];
  const recentTasks = data?.recent_tasks || [];

  const kpis = [
    {
      title: 'Total Subjects',
      value: stats.total_subjects,
      icon: BookOpen,
      color: '#8B5CF6',
      link: '/subjects',
    },
    {
      title: 'Total Tasks',
      value: stats.total_tasks,
      icon: CheckSquare,
      color: '#60A5FA',
      link: '/tasks',
    },
    {
      title: 'Pending Tasks',
      value: stats.pending_tasks,
      icon: Clock,
      color: '#FBBF24',
      link: '/tasks?status=pending',
    },
    {
      title: 'Completion Rate',
      value: `${stats.completion_rate}%`,
      icon: TrendingUp,
      color: '#34D399',
      link: '/tasks',
    },
    {
      title: 'Total Notes',
      value: stats.total_notes,
      icon: FileText,
      color: '#A78BFA',
      link: '/notes',
    },
    {
      title: 'Study Hours',
      value: `${stats.weekly_study_hours}h`,
      icon: Flame,
      color: '#EC4899',
      link: '/goals',
    },
  ];

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = user?.username
    ? user.username.charAt(0).toUpperCase() + user.username.slice(1)
    : 'Scholar';

  return (
    <div className="space-y-8">
      {/* Header with Greeting & Today's Focus */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-[#171421] via-[#11101A] to-[#171421] border border-[#292332] p-6 rounded-3xl relative overflow-hidden shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-[#A78BFA] text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#A78BFA]" /> Academic Focus Hub
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#F5F3F7] tracking-tight">
            {getTimeGreeting()},{' '}
            <span className="bg-gradient-to-r from-[#A78BFA] via-[#C4B5FD] to-[#F5F3F7] bg-clip-text text-transparent">
              {displayName}
            </span>{' '}
            ✨
          </h1>
          <p className="text-xs sm:text-sm text-[#8F889D] mt-1">
            You have <span className="text-[#FBBF24] font-semibold">{stats.pending_tasks} pending task{stats.pending_tasks !== 1 ? 's' : ''}</span> and <span className="text-[#34D399] font-semibold">{upcomingEvents.length} upcoming study session{upcomingEvents.length !== 1 ? 's' : ''}</span> scheduled.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap relative z-10">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setActiveModal('task')}
            icon={Plus}
          >
            Add Task
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveModal('note')}
            icon={FileText}
          >
            Add Note
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveModal('schedule')}
            icon={Calendar}
          >
            Schedule
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveModal('goal')}
            icon={Target}
          >
            New Goal
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.05 }}
            >
              <Link
                to={kpi.link}
                className="group block p-4 rounded-2xl bg-[#11101A] border border-[#292332] hover:border-[#8B5CF6]/50 hover:bg-[#171421] transition-all duration-200 shadow-lg shadow-black/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center border"
                    style={{
                      backgroundColor: `${kpi.color}1A`,
                      borderColor: `${kpi.color}4D`,
                      color: kpi.color,
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#645E73] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-[#F5F3F7] tracking-tight">
                  {kpi.value}
                </div>
                <p className="text-[11px] font-medium text-[#8F889D] truncate mt-0.5">
                  {kpi.title}
                </p>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Main Dashboard Layout (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Recent Tasks & Upcoming Schedule) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Tasks Panel */}
          <div className="bg-[#11101A] border border-[#292332] rounded-3xl p-5 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1F1A28]">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-[#8B5CF6]" />
                <h3 className="font-display font-semibold text-base text-[#F5F3F7]">
                  Recent Tasks & Deadlines
                </h3>
              </div>
              <Link
                to="/tasks"
                className="text-xs font-semibold text-[#A78BFA] hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>View All Tasks</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentTasks.length === 0 ? (
              <EmptyState
                icon={CheckSquare}
                title="No tasks yet"
                description="Keep your assignments organized. Add your first task to get started."
                actionLabel="Create Task"
                onAction={() => setActiveModal('task')}
              />
            ) : (
              <div className="space-y-3">
                {recentTasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    onToggle={handleToggleTask}
                    onEdit={(task) => {
                      setEditingTask(task);
                      setActiveModal('task');
                    }}
                    onDelete={handleTaskDelete}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Schedule Panel */}
          <div className="bg-[#11101A] border border-[#292332] rounded-3xl p-5 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1F1A28]">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#34D399]" />
                <h3 className="font-display font-semibold text-base text-[#F5F3F7]">
                  Upcoming Study Sessions
                </h3>
              </div>
              <Link
                to="/schedule"
                className="text-xs font-semibold text-[#A78BFA] hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>Open Planner</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {upcomingEvents.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No upcoming sessions"
                description="Schedule your study sessions, lecture reviews, and exam prep."
                actionLabel="Schedule Session"
                onAction={() => setActiveModal('schedule')}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {upcomingEvents.map((ev) => (
                  <ScheduleEvent
                    key={ev.id}
                    event={ev}
                    compact
                    onEdit={() => navigate('/schedule')}
                    onDelete={() => navigate('/schedule')}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Focus Pomodoro + Productivity Summary) */}
        <div className="space-y-6">
          {/* Integrated Pomodoro Focus Widget */}
          <PomodoroWidget
            onSessionCompleted={() => {
              fetchDashboard();
            }}
          />

          {/* Productivity Velocity Ring */}
          <div className="bg-[#11101A] border border-[#292332] rounded-3xl p-5 sm:p-6 shadow-xl text-center">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8F889D]">
                Completion Velocity
              </span>
              <span className="text-xs font-mono text-[#34D399]">
                {stats.completed_tasks} / {stats.total_tasks} Done
              </span>
            </div>

            <div className="my-5 flex justify-center">
              <ProgressRing
                value={stats.completed_tasks}
                max={stats.total_tasks || 1}
                size={110}
                strokeWidth={8}
                color="#8B5CF6"
              >
                <span className="text-xl font-bold font-mono text-[#F5F3F7]">
                  {stats.completion_rate}%
                </span>
                <span className="text-[10px] text-[#8F889D]">Tasks Done</span>
              </ProgressRing>
            </div>

            <p className="text-xs text-[#8F889D] leading-relaxed">
              {stats.completion_rate >= 80
                ? '🔥 Outstanding productivity! You are on track to crush your deadlines.'
                : stats.completion_rate >= 50
                ? '⚡ Great momentum! Complete a few more tasks to boost your score.'
                : '🌱 Good start! Check off your pending tasks to build momentum.'}
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {activeModal === 'task' && (
        <TaskForm
          isOpen={true}
          task={editingTask}
          onClose={() => {
            setActiveModal(null);
            setEditingTask(null);
          }}
          onSuccess={() => {
            setActiveModal(null);
            setEditingTask(null);
            toast.success(editingTask ? 'Task updated' : 'Task created');
            fetchDashboard();
          }}
        />
      )}

      {activeModal === 'note' && (
        <NoteEditor
          isOpen={true}
          onClose={() => setActiveModal(null)}
          onSuccess={() => {
            setActiveModal(null);
            toast.success('Study note saved');
            fetchDashboard();
          }}
        />
      )}

      {activeModal === 'schedule' && (
        <ScheduleForm
          isOpen={true}
          onClose={() => setActiveModal(null)}
          onSuccess={() => {
            setActiveModal(null);
            toast.success('Study session scheduled');
            fetchDashboard();
          }}
        />
      )}

      {activeModal === 'goal' && (
        <GoalForm
          isOpen={true}
          onClose={() => setActiveModal(null)}
          onSuccess={() => {
            setActiveModal(null);
            toast.success('Study goal created');
            fetchDashboard();
          }}
        />
      )}
    </div>
  );
}

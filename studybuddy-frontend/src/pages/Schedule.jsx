import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  LayoutGrid,
  List,
  Sparkles,
} from 'lucide-react';
import { api } from '../api/api';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { WeekCalendar } from '../components/schedule/WeekCalendar';
import { DayAgenda } from '../components/schedule/DayAgenda';
import { ScheduleEvent } from '../components/schedule/ScheduleEvent';
import { ScheduleForm } from '../components/schedule/ScheduleForm';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { getStartOfWeek, getWeekDays, formatDate } from '../utils/dateUtils';

export function Schedule() {
  const { toast } = useToast();
  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'agenda'

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedDateForEvent, setSelectedDateForEvent] = useState(null);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const weekDays = getWeekDays(currentWeekStart);

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const start_date = weekDays[0].toISOString().split('T')[0];
      const end_date = weekDays[6].toISOString().split('T')[0];

      const res = await api.schedule.getAll({ start_date, end_date });
      if (res.success) {
        setEvents(res.data || []);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  }, [currentWeekStart, toast]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const handlePrevWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const handleToday = () => {
    setCurrentWeekStart(getStartOfWeek(new Date()));
  };

  const handleDelete = async () => {
    if (!eventToDelete) return;
    setIsDeleting(true);
    try {
      const res = await api.schedule.delete(eventToDelete.id);
      if (res.success) {
        toast.success('Study session deleted');
        setEvents((prev) => prev.filter((e) => e.id !== eventToDelete.id));
        setEventToDelete(null);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete session');
    } finally {
      setIsDeleting(false);
    }
  };

  const startMonthStr = weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endMonthStr = weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Study Schedule & Calendar"
        description="Plan revision blocks, classes, exams, and recurring study sessions."
      >
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditingEvent(null);
            setSelectedDateForEvent(null);
            setIsFormOpen(true);
          }}
          icon={Plus}
        >
          Schedule Session
        </Button>
      </PageHeader>

      {/* Navigation and View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#11101A] border border-[#292332] p-4 rounded-2xl shadow-lg">
        {/* Date Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleToday}>
            Today
          </Button>
          <div className="flex items-center gap-1 bg-[#171421] p-1 rounded-xl border border-[#292332]">
            <button
              onClick={handlePrevWeek}
              className="p-1 rounded-lg text-[#8F889D] hover:text-[#F5F3F7] transition-colors"
              title="Previous week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextWeek}
              className="p-1 rounded-lg text-[#8F889D] hover:text-[#F5F3F7] transition-colors"
              title="Next week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <span className="text-sm font-semibold text-[#F5F3F7] ml-2">
            {startMonthStr} – {endMonthStr}
          </span>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-[#171421] p-1 rounded-xl border border-[#292332] self-start sm:self-auto">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              viewMode === 'calendar'
                ? 'bg-[#8B5CF6] text-white'
                : 'text-[#8F889D] hover:text-[#F5F3F7]'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Week Grid</span>
          </button>
          <button
            onClick={() => setViewMode('agenda')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              viewMode === 'agenda'
                ? 'bg-[#8B5CF6] text-white'
                : 'text-[#8F889D] hover:text-[#F5F3F7]'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Agenda</span>
          </button>
        </div>
      </div>

      {/* Main Schedule Content */}
      {loading ? (
        <Skeleton className="h-[480px] w-full" />
      ) : (
        <>
          {/* Desktop Week Grid View */}
          <div className={viewMode === 'calendar' ? 'hidden md:block' : 'hidden'}>
            <WeekCalendar
              days={weekDays}
              events={events}
              onSelectEvent={(e) => {
                setEditingEvent(e);
                setIsFormOpen(true);
              }}
              onAddEventForDate={(date) => {
                setSelectedDateForEvent(date);
                setEditingEvent(null);
                setIsFormOpen(true);
              }}
            />
          </div>

          {/* Mobile or Agenda View */}
          <div className={viewMode === 'agenda' ? 'block' : 'md:hidden block'}>
            <DayAgenda
              days={weekDays}
              events={events}
              onSelectEvent={(e) => {
                setEditingEvent(e);
                setIsFormOpen(true);
              }}
              onEditEvent={(e) => {
                setEditingEvent(e);
                setIsFormOpen(true);
              }}
              onDeleteEvent={(e) => setEventToDelete(e)}
              onAddEventForDate={(date) => {
                setSelectedDateForEvent(date);
                setEditingEvent(null);
                setIsFormOpen(true);
              }}
            />
          </div>
        </>
      )}

      {/* Schedule Form Modal */}
      {isFormOpen && (
        <ScheduleForm
          isOpen={true}
          event={editingEvent}
          initialDate={selectedDateForEvent}
          onClose={() => {
            setIsFormOpen(false);
            setEditingEvent(null);
            setSelectedDateForEvent(null);
          }}
          onSuccess={() => {
            setIsFormOpen(false);
            setEditingEvent(null);
            setSelectedDateForEvent(null);
            toast.success(editingEvent ? 'Session updated' : 'Session scheduled');
            fetchSchedule();
          }}
        />
      )}

      {/* Delete Confirmation */}
      {eventToDelete && (
        <ConfirmDialog
          isOpen={true}
          title="Delete Study Session"
          message={`Are you sure you want to delete "${eventToDelete.title}"?`}
          confirmLabel="Delete Session"
          isLoading={isDeleting}
          onClose={() => setEventToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar as CalendarIcon, Repeat, Plus } from 'lucide-react';
import { formatDate, formatTime, isToday } from '../../utils/dateUtils';
import { ScheduleEvent } from './ScheduleEvent';
import { Button } from '../ui/Button';

export function DayAgenda({
  days = [],
  events = [],
  onSelectEvent,
  onEditEvent,
  onDeleteEvent,
  onAddEventForDate,
}) {
  return (
    <div className="space-y-6">
      {days.map((day, idx) => {
        const dayEvents = events.filter((e) => {
          if (!e.start_time) return false;
          const eventDate = new Date(e.start_time);
          return (
            eventDate.getDate() === day.getDate() &&
            eventDate.getMonth() === day.getMonth() &&
            eventDate.getFullYear() === day.getFullYear()
          );
        });

        const currentIsToday = isToday(day);

        return (
          <div key={idx} className="space-y-3">
            {/* Day Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#292332]">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                    currentIsToday
                      ? 'bg-[#8B5CF6] text-white'
                      : 'bg-[#171421] text-[#8F889D] border border-[#292332]'
                  }`}
                >
                  {day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                {currentIsToday && (
                  <span className="text-xs font-semibold text-[#A78BFA]">Today</span>
                )}
              </div>

              <Button
                variant="ghost"
                size="xs"
                onClick={() => onAddEventForDate(day)}
                icon={Plus}
              >
                Add Session
              </Button>
            </div>

            {/* Day Events */}
            {dayEvents.length === 0 ? (
              <p className="text-xs text-[#645E73] italic py-2 pl-2">
                No study sessions planned for this day.
              </p>
            ) : (
              <div className="space-y-2.5">
                {dayEvents.map((event) => (
                  <ScheduleEvent
                    key={event.id}
                    event={event}
                    onEdit={() => onEditEvent(event)}
                    onDelete={() => onDeleteEvent(event)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

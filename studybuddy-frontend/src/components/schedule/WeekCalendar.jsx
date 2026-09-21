import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Clock } from 'lucide-react';
import { formatDate, formatTime, isToday } from '../../utils/dateUtils';
import { Badge } from '../ui/Badge';

export function WeekCalendar({
  days = [],
  events = [],
  onSelectEvent,
  onAddEventForDate,
}) {
  const getEventsForDay = (dateObj) => {
    return events.filter((e) => {
      if (!e.start_time) return false;
      const eventDate = new Date(e.start_time);
      return (
        eventDate.getDate() === dateObj.getDate() &&
        eventDate.getMonth() === dateObj.getMonth() &&
        eventDate.getFullYear() === dateObj.getFullYear()
      );
    });
  };

  return (
    <div className="bg-[#11101A] border border-[#292332] rounded-2xl overflow-hidden shadow-xl">
      {/* Calendar Grid Header & Days */}
      <div className="grid grid-cols-7 divide-x divide-[#292332] border-b border-[#292332] bg-[#0E0D16]">
        {days.map((day, idx) => {
          const currentIsToday = isToday(day);
          return (
            <div
              key={idx}
              className={`p-3 text-center transition-colors ${
                currentIsToday ? 'bg-[#8B5CF6]/10' : ''
              }`}
            >
              <p className="text-[11px] font-semibold text-[#8F889D] uppercase tracking-wider">
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </p>
              <div
                className={`inline-flex items-center justify-center w-7 h-7 mt-1 rounded-full text-sm font-bold ${
                  currentIsToday
                    ? 'bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/30'
                    : 'text-[#F5F3F7]'
                }`}
              >
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Calendar Grid Columns */}
      <div className="grid grid-cols-7 divide-x divide-[#292332] min-h-[420px]">
        {days.map((day, idx) => {
          const dayEvents = getEventsForDay(day);
          const currentIsToday = isToday(day);

          return (
            <div
              key={idx}
              className={`p-2 flex flex-col justify-between group/col transition-colors min-h-[350px] ${
                currentIsToday ? 'bg-[#8B5CF6]/5' : 'hover:bg-[#171421]/40'
              }`}
            >
              <div className="space-y-2">
                {dayEvents.length === 0 ? (
                  <div className="h-16 flex items-center justify-center text-[11px] text-[#645E73] italic">
                    No sessions
                  </div>
                ) : (
                  dayEvents.map((ev) => {
                    const color = ev.subject_color || '#8B5CF6';
                    return (
                      <motion.div
                        key={ev.id}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => onSelectEvent(ev)}
                        className="p-2 rounded-xl text-left border transition-all cursor-pointer shadow-sm relative overflow-hidden"
                        style={{
                          backgroundColor: `${color}1A`,
                          borderColor: `${color}4D`,
                        }}
                      >
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1"
                          style={{ backgroundColor: color }}
                        />
                        <p className="text-xs font-semibold text-[#F5F3F7] truncate pl-1">
                          {ev.title}
                        </p>
                        <div className="flex items-center gap-1 text-[10px] text-[#8F889D] mt-1 pl-1">
                          <Clock className="w-2.5 h-2.5 text-[#34D399]" />
                          <span>{formatTime(ev.start_time)}</span>
                        </div>
                        {ev.subject_name && (
                          <span
                            className="inline-block text-[9px] font-medium px-1.5 py-0.2 rounded mt-1 ml-1"
                            style={{ backgroundColor: `${color}33`, color: color }}
                          >
                            {ev.subject_name}
                          </span>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Add event on this date button */}
              <button
                onClick={() => onAddEventForDate(day)}
                className="w-full mt-2 py-1.5 rounded-lg border border-dashed border-[#292332] text-[11px] text-[#645E73] hover:text-[#A78BFA] hover:border-[#8B5CF6]/40 hover:bg-[#171421] transition-all flex items-center justify-center gap-1 opacity-0 group-hover/col:opacity-100"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

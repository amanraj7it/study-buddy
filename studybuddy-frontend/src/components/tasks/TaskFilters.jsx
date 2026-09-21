import React from 'react';
import { Search, Filter, X } from 'lucide-react';

export function TaskFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  subjectId,
  onSubjectChange,
  subjects = [],
  onClearFilters,
}) {
  const hasActiveFilters = search || status !== 'all' || priority !== 'all' || subjectId !== 'all';

  const statusTabs = [
    { value: 'all', label: 'All Tasks' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ];

  return (
    <div className="space-y-3 mb-6">
      {/* Top Search and Selects Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8F889D] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks by title..."
            className="w-full bg-[#11101A] border border-[#292332] text-[#F5F3F7] placeholder-[#645E73] text-xs sm:text-sm rounded-xl pl-9 pr-3.5 py-2 focus:outline-none focus:border-[#8B5CF6] transition-colors"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8F889D] hover:text-[#F5F3F7]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2">
          <select
            value={priority}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="bg-[#11101A] border border-[#292332] text-[#F5F3F7] text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-[#8B5CF6]"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          {/* Subject Filter */}
          <select
            value={subjectId}
            onChange={(e) => onSubjectChange(e.target.value)}
            className="bg-[#11101A] border border-[#292332] text-[#F5F3F7] text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-[#8B5CF6]"
          >
            <option value="all">All Subjects</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-xs text-[#8F889D] hover:text-[#F87171] px-2 py-2 flex items-center gap-1 transition-colors whitespace-nowrap"
            >
              <X className="w-3.5 h-3.5" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Status Segmented Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-[#292332]/40">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onStatusChange(tab.value)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              status === tab.value
                ? 'bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/40 shadow-sm'
                : 'text-[#8F889D] hover:text-[#F5F3F7] hover:bg-[#171421]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

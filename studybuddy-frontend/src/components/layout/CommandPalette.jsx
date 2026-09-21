import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  CheckSquare,
  BookOpen,
  FileText,
  Calendar,
  Target,
  Settings,
  LayoutDashboard,
  Plus,
  ArrowRight,
  HelpCircle,
  Users,
  BrainCircuit,
  HeartHandshake,
  Trophy,
  Coins,
} from 'lucide-react';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';

export function CommandPalette({ isOpen, onClose, onQuickAction }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useKeyboardShortcut('k', () => {
    if (isOpen) onClose();
    else if (onQuickAction) onQuickAction('open_command');
  }, { ctrl: true, meta: true });

  useEffect(() => {
    if (isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  const navItems = [
    { title: 'Ask a Doubt (AI Tutor & Journal)', path: '/doubts', icon: HelpCircle, section: 'Education Chest' },
    { title: 'Peer Study Circles & Rooms', path: '/circles', icon: Users, section: 'Education Chest' },
    { title: 'Smart Study Planner (Adaptive)', path: '/smart-planner', icon: BrainCircuit, section: 'Education Chest' },
    { title: 'Parent Dashboard (WhatsApp Reports)', path: '/parent-report', icon: HeartHandshake, section: 'Education Chest' },
    { title: 'Hackathon Pitch & Impact Deck', path: '/pitch-analytics', icon: Trophy, section: 'Education Chest' },
    { title: 'Pricing & Freemium Community Access', path: '/pricing', icon: Coins, section: 'Education Chest' },
    { title: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, section: 'Navigation' },
    { title: 'Tasks & Assignments', path: '/tasks', icon: CheckSquare, section: 'Navigation' },
    { title: 'Subjects & Courses', path: '/subjects', icon: BookOpen, section: 'Navigation' },
    { title: 'Study Notes & Markdown', path: '/notes', icon: FileText, section: 'Navigation' },
    { title: 'Schedule & Calendar', path: '/schedule', icon: Calendar, section: 'Navigation' },
    { title: 'Study Goals & Targets', path: '/goals', icon: Target, section: 'Navigation' },
    { title: 'Settings & Profile', path: '/settings', icon: Settings, section: 'Navigation' },
  ];

  const actionItems = [
    { title: 'Ask a Homework Doubt (AI Tutor)', path: '/doubts', icon: HelpCircle, section: 'Education Chest' },
    { title: 'Join / Browse Study Circles', path: '/circles', icon: Users, section: 'Education Chest' },
    { title: 'Generate Adaptive Study Plan', path: '/smart-planner', icon: BrainCircuit, section: 'Education Chest' },
    { title: 'Create New Task', action: 'create_task', icon: Plus, section: 'Quick Actions' },
    { title: 'Create New Subject', action: 'create_subject', icon: Plus, section: 'Quick Actions' },
    { title: 'Create New Study Note', action: 'create_note', icon: Plus, section: 'Quick Actions' },
    { title: 'Schedule Study Session', action: 'create_schedule', icon: Plus, section: 'Quick Actions' },
    { title: 'Create Study Goal', action: 'create_goal', icon: Plus, section: 'Quick Actions' },
  ];

  const allItems = [...actionItems, ...navItems];

  const filtered = allItems.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (item) => {
    onClose();
    if (item.path) {
      navigate(item.path);
    } else if (item.action && onQuickAction) {
      onQuickAction(item.action);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#09070F]/80 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-xl bg-[#11101A] border border-[#292332] rounded-2xl shadow-2xl z-10 overflow-hidden"
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-4 py-3.5 border-b border-[#292332] gap-3">
              <Search className="w-5 h-5 text-[#8F889D]" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command, search pages or trigger actions..."
                className="w-full bg-transparent text-[#F5F3F7] placeholder-[#645E73] text-sm focus:outline-none"
              />
              <kbd className="px-2 py-0.5 text-[10px] font-mono bg-[#171421] border border-[#292332] text-[#8F889D] rounded-md">
                ESC
              </kbd>
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto p-2 divide-y divide-[#1F1A28]/50">
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#8F889D]">
                  No matching commands or pages found.
                </div>
              ) : (
                filtered.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect(item)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm text-[#F5F3F7] hover:bg-[#171421] hover:text-[#A78BFA] transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-[#171421] border border-[#292332] text-[#8B5CF6] group-hover:border-[#8B5CF6]/40 transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-xs sm:text-sm">{item.title}</p>
                          <span className="text-[10px] text-[#8F889D] uppercase tracking-wider">
                            {item.section}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#645E73] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-[#0E0D16] border-t border-[#292332] flex items-center justify-between text-[11px] text-[#8F889D]">
              <span>Navigate with arrow keys or click</span>
              <div className="flex items-center gap-1.5">
                <span>Press</span>
                <kbd className="px-1.5 py-0.5 font-mono bg-[#171421] border border-[#292332] text-[#8F889D] rounded">
                  Ctrl+K
                </kbd>
                <span>anywhere</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

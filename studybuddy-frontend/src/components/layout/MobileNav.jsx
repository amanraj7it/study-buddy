import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  FileText,
  Calendar,
  Target,
  Settings,
  Menu,
  X,
  LogOut,
  GraduationCap,
  Command,
  Plus,
  HelpCircle,
  Users,
  BrainCircuit,
  HeartHandshake,
  Trophy,
  Coins
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { name: 'Ask a Doubt', path: '/doubts', icon: HelpCircle },
  { name: 'Study Circles', path: '/circles', icon: Users },
  { name: 'Smart Planner', path: '/smart-planner', icon: BrainCircuit },
  { name: 'Parent Report', path: '/parent-report', icon: HeartHandshake },
  { name: 'Pitch & Impact', path: '/pitch-analytics', icon: Trophy },
  { name: 'Community Pricing', path: '/pricing', icon: Coins },
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Tasks', path: '/tasks', icon: CheckSquare },
  { name: 'Subjects', path: '/subjects', icon: BookOpen },
  { name: 'Notes', path: '/notes', icon: FileText },
  { name: 'Schedule', path: '/schedule', icon: Calendar },
  { name: 'Goals', path: '/goals', icon: Target },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const BOTTOM_NAV_ITEMS = [
  { name: 'Home', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Doubts', path: '/doubts', icon: HelpCircle },
  { name: 'Circles', path: '/circles', icon: Users },
  { name: 'Planner', path: '/smart-planner', icon: BrainCircuit },
  { name: 'Parent', path: '/parent-report', icon: HeartHandshake },
];

export function MobileNav({ onOpenCommand, onQuickAdd }) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-30 bg-[#11101A]/90 backdrop-blur-md border-b border-[#292332] px-4 py-3 flex items-center justify-between">
        <NavLink to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center text-white shadow-md shadow-[#8B5CF6]/20">
            <GraduationCap className="w-4 h-4" />
          </div>
          <span className="font-display font-bold text-base text-[#F5F3F7]">
            StudyBuddy
          </span>
        </NavLink>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCommand}
            aria-label="Open search command palette"
            className="p-2 rounded-xl bg-[#171421] border border-[#292332] text-[#8F889D] hover:text-[#F5F3F7]"
          >
            <Command className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-xl bg-[#171421] border border-[#292332] text-[#8F889D] hover:text-[#F5F3F7]"
          >
            {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Slide-out Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="md:hidden fixed inset-0 z-40">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-[#09070F]/80 backdrop-blur-sm"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative w-4/5 max-w-xs h-full bg-[#11101A] border-r border-[#292332] flex flex-col justify-between p-5 z-10"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#292332]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#8B5CF6] flex items-center justify-center text-white">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <span className="font-display font-bold text-base text-[#F5F3F7]">
                      StudyBuddy
                    </span>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-lg text-[#8F889D]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Nav items */}
                <nav className="mt-4 space-y-1">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-[#8B5CF6]/15 text-[#A78BFA] border border-[#8B5CF6]/30 font-semibold'
                            : 'text-[#8F889D] hover:text-[#F5F3F7] hover:bg-[#171421]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </NavLink>
                    );
                  })}
                </nav>
              </div>

              {/* Drawer footer */}
              <div className="pt-4 border-t border-[#292332]">
                <div className="flex items-center justify-between p-2 rounded-xl bg-[#171421] border border-[#292332]">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#F5F3F7] truncate">{user?.username}</p>
                    <p className="text-[10px] text-[#8F889D] truncate">{user?.email || 'Logged in'}</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      logout();
                    }}
                    className="p-1.5 rounded-lg text-[#F87171] hover:bg-[#1F1A28]"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#11101A]/95 backdrop-blur-md border-t border-[#292332] px-2 py-1.5 flex items-center justify-around">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
                isActive ? 'text-[#A78BFA]' : 'text-[#8F889D]'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}

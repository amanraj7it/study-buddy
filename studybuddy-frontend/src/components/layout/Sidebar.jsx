import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  FileText,
  Calendar,
  Target,
  Settings,
  LogOut,
  Sparkles,
  Command,
  PlusCircle,
  GraduationCap,
  HelpCircle,
  Users,
  BrainCircuit,
  HeartHandshake,
  Trophy,
  Coins,
  Award
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const EDUCATION_CHEST_ITEMS = [
  { name: 'Ask a Doubt', path: '/doubts', icon: HelpCircle, badge: 'AI Tutor' },
  { name: 'Study Circles', path: '/circles', icon: Users, badge: 'Peer Help' },
  { name: 'Smart Planner', path: '/smart-planner', icon: BrainCircuit, badge: 'Adaptive' },
  { name: 'Parent Report', path: '/parent-report', icon: HeartHandshake, badge: 'WhatsApp' },
  { name: 'Pitch & Impact', path: '/pitch-analytics', icon: Trophy, badge: 'Judges' },
  { name: 'Pricing & Access', path: '/pricing', icon: Coins, badge: 'Free' },
];

const HUB_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Tasks', path: '/tasks', icon: CheckSquare },
  { name: 'Subjects', path: '/subjects', icon: BookOpen },
  { name: 'Notes', path: '/notes', icon: FileText },
  { name: 'Schedule', path: '/schedule', icon: Calendar },
  { name: 'Goals', path: '/goals', icon: Target },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export function Sidebar({ onOpenCommand, onQuickAdd }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#11101A] border-r border-[#292332] h-screen sticky top-0 shrink-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#292332] flex items-center justify-between">
        <NavLink to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center text-white shadow-lg shadow-[#8B5CF6]/20 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-lg tracking-tight text-[#F5F3F7] group-hover:text-[#A78BFA] transition-colors">
                StudyBuddy
              </span>
            </div>
            <p className="text-[10px] text-[#10B981] font-semibold tracking-wide">
              Education Chest Edition
            </p>
          </div>
        </NavLink>
      </div>

      {/* Quick Search Shortcut */}
      <div className="px-4 pt-3 pb-1">
        <button
          onClick={onOpenCommand}
          className="w-full flex items-center justify-between px-3 py-2 bg-[#171421] hover:bg-[#1F1A28] border border-[#292332] hover:border-[#8B5CF6]/40 rounded-xl text-xs text-[#8F889D] hover:text-[#F5F3F7] transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Command className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span>Search or jump to...</span>
          </div>
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 bg-[#11101A] border border-[#292332] rounded text-[#8F889D]">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto">
        {/* Education Chest Pillar Links */}
        <div>
          <div className="text-[10px] font-bold text-[#A78BFA] uppercase tracking-wider px-3 py-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#A78BFA]" />
            <span>Education Chest</span>
          </div>
          <div className="space-y-0.5 mt-1">
            {EDUCATION_CHEST_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-[#8B5CF6]/15 text-[#C4B5FD] border border-[#8B5CF6]/30 font-semibold'
                      : 'text-[#8F889D] hover:text-[#F5F3F7] hover:bg-[#171421]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-3.5 h-3.5 transition-colors ${
                        isActive ? 'text-[#A78BFA]' : 'text-[#8F889D] group-hover:text-[#F5F3F7]'
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                        isActive
                          ? 'bg-[#8B5CF6]/30 text-white'
                          : 'bg-[#171421] text-[#645E73] group-hover:text-[#A78BFA]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Traditional Study Management Links */}
        <div>
          <div className="text-[10px] font-semibold text-[#645E73] uppercase tracking-wider px-3 py-1.5">
            Productivity Hub
          </div>
          <div className="space-y-0.5 mt-1">
            {HUB_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-[#8B5CF6]/15 text-[#A78BFA] border border-[#8B5CF6]/30 font-semibold'
                      : 'text-[#8F889D] hover:text-[#F5F3F7] hover:bg-[#171421]'
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 transition-colors ${
                      isActive ? 'text-[#A78BFA]' : 'text-[#8F889D] group-hover:text-[#F5F3F7]'
                    }`}
                  />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      {/* User Footer Profile & Gamification Badge */}
      <div className="p-3 border-t border-[#292332] bg-[#0E0D16] space-y-2">
        <div className="flex items-center justify-between p-2 rounded-xl bg-[#11101A] border border-[#292332]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-xs font-bold text-[#A78BFA] uppercase shrink-0">
              {user?.username ? user.username.substring(0, 2) : 'SB'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-[#F5F3F7] truncate">
                  {user?.username || 'Student'}
                </p>
                <span className="text-[9px] px-1 py-0.2 rounded font-bold bg-[#10B981]/20 text-[#34D399]">
                  {user?.tier === 'supporter' ? 'Supporter' : 'Free'}
                </span>
              </div>
              <p className="text-[10px] text-[#A78BFA] truncate flex items-center gap-1">
                <Award className="w-3 h-3 text-[#F59E0B]" />
                <span>{user?.badge || 'Study Buddy'} ({user?.reputation_points || 45} pts)</span>
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 rounded-lg text-[#8F889D] hover:text-[#F87171] hover:bg-[#171421] transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

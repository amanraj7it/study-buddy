import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { CommandPalette } from './CommandPalette';
import { TaskForm } from '../tasks/TaskForm';
import { SubjectForm } from '../subjects/SubjectForm';
import { ScheduleForm } from '../schedule/ScheduleForm';
import { GoalForm } from '../goals/GoalForm';
import { StudyBuddyAI } from '../ai/StudyBuddyAI';
import { useToast } from '../../context/ToastContext';
import { api } from '../../api/api';

export function AppShell() {
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'task', 'subject', 'schedule', 'goal'
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleQuickAction = (action) => {
    if (action === 'open_command') {
      setIsCommandOpen(true);
    } else if (action === 'create_task') {
      setActiveModal('task');
    } else if (action === 'create_subject') {
      setActiveModal('subject');
    } else if (action === 'create_note') {
      navigate('/notes');
    } else if (action === 'create_schedule') {
      setActiveModal('schedule');
    } else if (action === 'create_goal') {
      setActiveModal('goal');
    }
  };

  return (
    <div className="min-h-screen bg-[#09070F] text-[#F5F3F7] flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <Sidebar
        onOpenCommand={() => setIsCommandOpen(true)}
        onQuickAdd={() => setActiveModal('task')}
      />

      {/* Mobile Top and Bottom Navigation */}
      <MobileNav
        onOpenCommand={() => setIsCommandOpen(true)}
        onQuickAdd={() => setActiveModal('task')}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 max-w-full pb-20 md:pb-8 overflow-y-auto min-h-screen">
        <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>

      {/* Global AI Study Copilot */}
      <StudyBuddyAI />

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onQuickAction={handleQuickAction}
      />

      {/* Global Quick Action Modals */}
      {activeModal === 'task' && (
        <TaskForm
          isOpen={true}
          onClose={() => setActiveModal(null)}
          onSuccess={() => {
            setActiveModal(null);
            toast.success('Task created successfully');
            window.dispatchEvent(new CustomEvent('studybuddy:data-changed'));
          }}
        />
      )}

      {activeModal === 'subject' && (
        <SubjectForm
          isOpen={true}
          onClose={() => setActiveModal(null)}
          onSuccess={() => {
            setActiveModal(null);
            toast.success('Subject created successfully');
            window.dispatchEvent(new CustomEvent('studybuddy:data-changed'));
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
            window.dispatchEvent(new CustomEvent('studybuddy:data-changed'));
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
            window.dispatchEvent(new CustomEvent('studybuddy:data-changed'));
          }}
        />
      )}
    </div>
  );
}

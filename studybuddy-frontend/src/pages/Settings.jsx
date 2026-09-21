import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  User,
  Mail,
  Shield,
  Server,
  Database,
  Download,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { api } from '../api/api';

export function Settings() {
  const { user, logout, seedDemo } = useAuth();
  const { toast } = useToast();

  const [apiStatus, setApiStatus] = useState('checking'); // 'connected' | 'disconnected' | 'checking'
  const [isSeeding, setIsSeeding] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Check API health
  useEffect(() => {
    api.dashboard.get()
      .then((res) => {
        if (res.success) setApiStatus('connected');
        else setApiStatus('disconnected');
      })
      .catch(() => setApiStatus('disconnected'));
  }, []);

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    try {
      await seedDemo();
      toast.success('Demo data seeded successfully!');
    } catch (err) {
      toast.error(err.message || 'Seeding failed');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const [subjectsRes, tasksRes, notesRes, scheduleRes, goalsRes] = await Promise.all([
        api.subjects.getAll(),
        api.tasks.getAll(),
        api.notes.getAll(),
        api.schedule.getAll(),
        api.goals.getAll(),
      ]);

      const backup = {
        exported_at: new Date().toISOString(),
        user: user?.username,
        subjects: subjectsRes.data || [],
        tasks: tasksRes.data || [],
        notes: notesRes.data || [],
        schedule: scheduleRes.data || [],
        goals: goalsRes.data || [],
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `studybuddy_backup_${user?.username || 'user'}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Workspace exported successfully!');
    } catch (err) {
      toast.error('Failed to export workspace data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Settings & System Hub"
        description="Manage your account profile, API connection, and workspace diagnostics."
      />

      {/* User Profile Card */}
      <div className="bg-[#11101A] border border-[#292332] rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-[#1F1A28]">
          <User className="w-5 h-5 text-[#8B5CF6]" />
          <h3 className="font-semibold text-base text-[#F5F3F7]">
            Account Information
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#171421] p-4 rounded-2xl border border-[#292332]">
            <span className="text-xs text-[#8F889D] block mb-1">Username</span>
            <p className="font-semibold text-sm text-[#F5F3F7]">{user?.username || 'Student'}</p>
          </div>

          <div className="bg-[#171421] p-4 rounded-2xl border border-[#292332]">
            <span className="text-xs text-[#8F889D] block mb-1">Email Address</span>
            <p className="font-semibold text-sm text-[#F5F3F7]">
              {user?.email || 'No email attached'}
            </p>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <p className="text-xs text-[#8F889D]">
            Signed in with JWT session token.
          </p>
          <Button variant="danger" size="sm" onClick={logout} icon={LogOut}>
            Sign Out
          </Button>
        </div>
      </div>

      {/* API Connection & Health */}
      <div className="bg-[#11101A] border border-[#292332] rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-[#1F1A28]">
          <Server className="w-5 h-5 text-[#34D399]" />
          <h3 className="font-semibold text-base text-[#F5F3F7]">
            Backend Server Status
          </h3>
        </div>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#171421] border border-[#292332]">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                apiStatus === 'connected'
                  ? 'bg-[#34D399] shadow-lg shadow-[#34D399]/50 animate-pulse'
                  : apiStatus === 'checking'
                  ? 'bg-[#FBBF24] animate-pulse'
                  : 'bg-[#F87171]'
              }`}
            />
            <div>
              <p className="font-semibold text-sm text-[#F5F3F7]">
                {apiStatus === 'connected'
                  ? 'Flask API Connected (http://localhost:5000)'
                  : apiStatus === 'checking'
                  ? 'Checking connection...'
                  : 'Backend Disconnected (localhost:5000)'}
              </p>
              <p className="text-xs text-[#8F889D] mt-0.5">
                Target endpoint: http://localhost:5000/api
              </p>
            </div>
          </div>

          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
              apiStatus === 'connected'
                ? 'bg-[#34D399]/15 border-[#34D399]/40 text-[#34D399]'
                : 'bg-[#F87171]/15 border-[#F87171]/40 text-[#F87171]'
            }`}
          >
            {apiStatus === 'connected' ? 'Healthy' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Workspace Data Tools & Demo Seeder */}
      <div className="bg-[#11101A] border border-[#292332] rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-[#1F1A28]">
          <Database className="w-5 h-5 text-[#A78BFA]" />
          <h3 className="font-semibold text-base text-[#F5F3F7]">
            Data Management & Backups
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#171421] p-5 rounded-2xl border border-[#292332] flex flex-col justify-between">
            <div>
              <h4 className="font-semibold text-sm text-[#F5F3F7] mb-1">
                Export Workspace
              </h4>
              <p className="text-xs text-[#8F889D] mb-4">
                Download a complete JSON archive of your tasks, notes, syllabus subjects, and study goals.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportData}
              isLoading={isExporting}
              icon={Download}
            >
              Export JSON Backup
            </Button>
          </div>

          <div className="bg-[#171421] p-5 rounded-2xl border border-[#292332] flex flex-col justify-between">
            <div>
              <h4 className="font-semibold text-sm text-[#F5F3F7] mb-1">
                Seed Demo Data
              </h4>
              <p className="text-xs text-[#8F889D] mb-4">
                Initialize the database with demo courses (Math, Physics, History), tasks, notes, and study schedules.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSeedDemo}
              isLoading={isSeeding}
              icon={Sparkles}
            >
              Seed Sample Data
            </Button>
          </div>
        </div>
      </div>

      {/* App Info Footer */}
      <div className="p-4 rounded-2xl bg-[#0E0D16] border border-[#292332] flex items-center justify-between text-xs text-[#8F889D]">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[#8B5CF6]" />
          <span>StudyBuddy Student Platform v1.0.0 (Production Build)</span>
        </div>
        <span>React 19 • Tailwind CSS • Framer Motion</span>
      </div>
    </div>
  );
}

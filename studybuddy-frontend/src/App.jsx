import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppShell } from './components/layout/AppShell';

// Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Tasks } from './pages/Tasks';
import { Subjects } from './pages/Subjects';
import { SubjectDetail } from './pages/SubjectDetail';
import { Notes } from './pages/Notes';
import { NoteDetail } from './pages/NoteDetail';
import { Schedule } from './pages/Schedule';
import { Goals } from './pages/Goals';
import { Settings } from './pages/Settings';
import { DoubtSolver } from './pages/DoubtSolver';
import { StudyCircles } from './pages/StudyCircles';
import { SmartPlanner } from './pages/SmartPlanner';
import { ParentDashboard } from './pages/ParentDashboard';
import { Subscription } from './pages/Subscription';
import { PitchAnalytics } from './pages/PitchAnalytics';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09070F] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#8F889D] font-mono">Loading StudyBuddy...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Public Route (redirects to dashboard if already logged in)
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />

            {/* Protected Application Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/doubts" element={<DoubtSolver />} />
              <Route path="/circles" element={<StudyCircles />} />
              <Route path="/smart-planner" element={<SmartPlanner />} />
              <Route path="/parent-report" element={<ParentDashboard />} />
              <Route path="/pitch-analytics" element={<PitchAnalytics />} />
              <Route path="/pricing" element={<Subscription />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/subjects" element={<Subjects />} />
              <Route path="/subjects/:id" element={<SubjectDetail />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/notes/:id" element={<NoteDetail />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Default Catch-all & Root Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;

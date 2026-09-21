import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Sparkles } from 'lucide-react';
import { api } from '../api/api';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { SubjectCard } from '../components/subjects/SubjectCard';
import { SubjectForm } from '../components/subjects/SubjectForm';
import { EmptyState } from '../components/ui/EmptyState';
import { CardSkeleton } from '../components/ui/Skeleton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export function Subjects() {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.subjects.getAll();
      if (res.success) {
        setSubjects(res.data || []);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handleDelete = async () => {
    if (!subjectToDelete) return;
    setIsDeleting(true);
    try {
      const res = await api.subjects.delete(subjectToDelete.id);
      if (res.success) {
        toast.success('Subject deleted');
        setSubjects((prev) => prev.filter((s) => s.id !== subjectToDelete.id));
        setSubjectToDelete(null);
      }
    } catch (err) {
      toast.error(err.message || 'Could not delete subject');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subjects & Courses"
        description="Organize your curriculum, assignments, notes, and study goals."
      >
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditingSubject(null);
            setIsFormOpen(true);
          }}
          icon={Plus}
        >
          New Subject
        </Button>
      </PageHeader>

      {/* Grid of Subjects */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No subjects registered"
          description="Create your first subject (e.g. Mathematics, Physics, History) to group your study materials."
          actionLabel="Create Subject"
          onAction={() => {
            setEditingSubject(null);
            setIsFormOpen(true);
          }}
          actionIcon={Plus}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {subjects.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                onEdit={(s) => {
                  setEditingSubject(s);
                  setIsFormOpen(true);
                }}
                onDelete={(s) => setSubjectToDelete(s)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isFormOpen && (
        <SubjectForm
          isOpen={true}
          subject={editingSubject}
          onClose={() => {
            setIsFormOpen(false);
            setEditingSubject(null);
          }}
          onSuccess={() => {
            setIsFormOpen(false);
            setEditingSubject(null);
            toast.success(editingSubject ? 'Subject updated' : 'Subject created');
            fetchSubjects();
          }}
        />
      )}

      {/* Delete Confirmation */}
      {subjectToDelete && (
        <ConfirmDialog
          isOpen={true}
          title="Delete Subject"
          message={`Are you sure you want to delete "${subjectToDelete.name}"? Tasks and notes linked to this subject will also be deleted.`}
          confirmLabel="Delete Subject"
          isLoading={isDeleting}
          onClose={() => setSubjectToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

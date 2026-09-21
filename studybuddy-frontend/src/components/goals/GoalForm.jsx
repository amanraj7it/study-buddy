import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input, Select } from '../ui/Input';
import { Button } from '../ui/Button';
import { api } from '../../api/api';
import { formatDateTimeInput, toISODatetimeString } from '../../utils/dateUtils';
import { useToast } from '../../context/ToastContext';

export function GoalForm({
  isOpen,
  onClose,
  goal = null,
  initialSubjectId = null,
  onSuccess,
}) {
  const { toast } = useToast();
  const isEditing = !!goal;

  const [title, setTitle] = useState('');
  const [targetHours, setTargetHours] = useState('10');
  const [completedHours, setCompletedHours] = useState('0');
  const [subjectId, setSubjectId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState('active');

  const [subjects, setSubjects] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    api.subjects.getAll()
      .then((res) => {
        if (mounted && res.success) {
          setSubjects(res.data || []);
        }
      })
      .catch((err) => console.warn("Could not load subjects:", err));

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (goal) {
      setTitle(goal.title || '');
      setTargetHours(String(goal.target_hours || '10'));
      setCompletedHours(String(goal.completed_hours || '0'));
      setSubjectId(goal.subject_id ? String(goal.subject_id) : '');
      setDeadline(goal.deadline ? formatDateTimeInput(goal.deadline) : '');
      setStatus(goal.status || 'active');
    } else {
      setTitle('');
      setTargetHours('10');
      setCompletedHours('0');
      setSubjectId(initialSubjectId ? String(initialSubjectId) : '');
      setDeadline('');
      setStatus('active');
    }
    setErrors({});
  }, [goal, initialSubjectId, isOpen]);

  const validate = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = 'Goal title is required';
    const target = parseFloat(targetHours);
    if (isNaN(target) || target <= 0) {
      newErrors.targetHours = 'Target hours must be greater than 0';
    }
    const completed = parseFloat(completedHours);
    if (isNaN(completed) || completed < 0) {
      newErrors.completedHours = 'Completed hours must be 0 or positive';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    const payload = {
      title: title.trim(),
      target_hours: parseFloat(targetHours),
      completed_hours: parseFloat(completedHours) || 0,
      subject_id: subjectId ? parseInt(subjectId, 10) : null,
      deadline: deadline ? toISODatetimeString(deadline) : null,
      status: parseFloat(completedHours) >= parseFloat(targetHours) ? 'completed' : status,
    };

    try {
      let res;
      if (isEditing) {
        res = await api.goals.update(goal.id, payload);
      } else {
        res = await api.goals.create(payload);
      }

      if (res.success) {
        if (onSuccess) onSuccess(res.data);
        onClose();
      } else {
        setErrors({ form: res.error || 'Failed to save goal' });
      }
    } catch (err) {
      setErrors({ form: err.message || 'Error occurred while saving goal' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Study Goal' : 'Set New Study Goal'}
      description={isEditing ? 'Update target hours and milestone deadline.' : 'Set study hour targets for your courses or exam prep.'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="p-3 rounded-xl bg-[#F87171]/15 border border-[#F87171]/30 text-[#F87171] text-xs">
            {errors.form}
          </div>
        )}

        <Input
          label="Goal Title"
          required
          placeholder="e.g., Master Data Structures & Algorithms, 20h Calculus Prep"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
          autoFocus
        />

        <Select
          label="Subject / Course"
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
        >
          <option value="">No Subject (General Habit)</option>
          {subjects.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.name}
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Target Hours"
            type="number"
            step="0.5"
            min="0.5"
            required
            value={targetHours}
            onChange={(e) => setTargetHours(e.target.value)}
            error={errors.targetHours}
          />
          <Input
            label="Completed Hours"
            type="number"
            step="0.5"
            min="0"
            value={completedHours}
            onChange={(e) => setCompletedHours(e.target.value)}
            error={errors.completedHours}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Target Deadline"
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />

          <Select
            label="Goal Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </Select>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1F1A28]">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Create Goal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

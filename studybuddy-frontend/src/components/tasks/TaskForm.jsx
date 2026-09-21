import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input, Select, Textarea } from '../ui/Input';
import { Button } from '../ui/Button';
import { api } from '../../api/api';
import { formatDateTimeInput, toISODatetimeString } from '../../utils/dateUtils';
import { useToast } from '../../context/ToastContext';

export function TaskForm({
  isOpen,
  onClose,
  task = null,
  initialSubjectId = null,
  onSuccess,
}) {
  const { toast } = useToast();
  const isEditing = !!task;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('pending');
  const [dueDate, setDueDate] = useState('');

  const [subjects, setSubjects] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Load subjects for the dropdown
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
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setSubjectId(task.subject_id ? String(task.subject_id) : '');
      setPriority(task.priority || 'medium');
      setStatus(task.status || 'pending');
      setDueDate(task.due_date ? formatDateTimeInput(task.due_date) : '');
    } else {
      setTitle('');
      setDescription('');
      setSubjectId(initialSubjectId ? String(initialSubjectId) : '');
      setPriority('medium');
      setStatus('pending');
      setDueDate('');
    }
    setErrors({});
  }, [task, initialSubjectId, isOpen]);

  const validate = () => {
    const newErrors = {};
    if (!title.trim()) {
      newErrors.title = 'Title is required';
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
      description: description.trim() || null,
      priority,
      status,
      subject_id: subjectId ? parseInt(subjectId, 10) : null,
      due_date: dueDate ? toISODatetimeString(dueDate) : null,
    };

    try {
      let res;
      if (isEditing) {
        res = await api.tasks.update(task.id, payload);
      } else {
        res = await api.tasks.create(payload);
      }

      if (res.success) {
        if (onSuccess) onSuccess(res.data);
        onClose();
      } else {
        setErrors({ form: res.error || 'Failed to save task' });
      }
    } catch (err) {
      setErrors({ form: err.message || 'Error occurred while saving task' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Task' : 'Create New Task'}
      description={isEditing ? 'Update task details, deadline, and priority.' : 'Add a new assignment or study task to your list.'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="p-3 rounded-xl bg-[#F87171]/15 border border-[#F87171]/30 text-[#F87171] text-xs">
            {errors.form}
          </div>
        )}

        <Input
          label="Task Title"
          required
          placeholder="e.g., Complete calculus problem set 4"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
          autoFocus
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Subject / Course"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
          >
            <option value="">No Subject (General)</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </Select>

          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </Select>

          <Input
            label="Due Date & Time"
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <Textarea
          label="Description / Details"
          placeholder="Additional notes, instructions, or chapter references..."
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1F1A28]">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input, Select, Textarea } from '../ui/Input';
import { Button } from '../ui/Button';
import { api } from '../../api/api';
import { formatDateTimeInput, toISODatetimeString } from '../../utils/dateUtils';
import { useToast } from '../../context/ToastContext';

export function ScheduleForm({
  isOpen,
  onClose,
  event = null,
  initialDate = null,
  initialSubjectId = null,
  onSuccess,
}) {
  const { toast } = useToast();
  const isEditing = !!event;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState('weekly');

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
    if (event) {
      setTitle(event.title || '');
      setDescription(event.description || '');
      setSubjectId(event.subject_id ? String(event.subject_id) : '');
      setStartTime(event.start_time ? formatDateTimeInput(event.start_time) : '');
      setEndTime(event.end_time ? formatDateTimeInput(event.end_time) : '');
      setIsRecurring(!!event.is_recurring);
      setRecurrenceRule(event.recurrence_rule || 'weekly');
    } else {
      setTitle('');
      setDescription('');
      setSubjectId(initialSubjectId ? String(initialSubjectId) : '');
      const now = initialDate ? new Date(initialDate) : new Date();
      // Default to next hour start
      const start = new Date(now);
      start.setMinutes(0, 0, 0);
      start.setHours(start.getHours() + 1);
      const end = new Date(start);
      end.setHours(end.getHours() + 2);

      setStartTime(formatDateTimeInput(start));
      setEndTime(formatDateTimeInput(end));
      setIsRecurring(false);
      setRecurrenceRule('weekly');
    }
    setErrors({});
  }, [event, initialDate, initialSubjectId, isOpen]);

  const validate = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!startTime) newErrors.startTime = 'Start time is required';
    if (!endTime) newErrors.endTime = 'End time is required';
    if (startTime && endTime) {
      const s = new Date(startTime).getTime();
      const e = new Date(endTime).getTime();
      if (e <= s) {
        newErrors.endTime = 'End time must be after start time';
      }
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
      start_time: toISODatetimeString(startTime),
      end_time: toISODatetimeString(endTime),
      subject_id: subjectId ? parseInt(subjectId, 10) : null,
      is_recurring: isRecurring,
      recurrence_rule: isRecurring ? recurrenceRule : null,
    };

    try {
      let res;
      if (isEditing) {
        res = await api.schedule.update(event.id, payload);
      } else {
        res = await api.schedule.create(payload);
      }

      if (res.success) {
        if (onSuccess) onSuccess(res.data);
        onClose();
      } else {
        setErrors({ form: res.error || 'Failed to save schedule event' });
      }
    } catch (err) {
      setErrors({ form: err.message || 'Error occurred while saving event' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Study Session' : 'Schedule Study Session'}
      description={isEditing ? 'Modify your study time block and subject details.' : 'Plan focused study blocks, review lectures, or group revisions.'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="p-3 rounded-xl bg-[#F87171]/15 border border-[#F87171]/30 text-[#F87171] text-xs">
            {errors.form}
          </div>
        )}

        <Input
          label="Session Title"
          required
          placeholder="e.g., Organic Chemistry Exam Revision"
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
          <option value="">No Subject (General Study)</option>
          {subjects.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.name}
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Start Time"
            type="datetime-local"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            error={errors.startTime}
          />
          <Input
            label="End Time"
            type="datetime-local"
            required
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            error={errors.endTime}
          />
        </div>

        {/* Recurrence Switch */}
        <div className="bg-[#171421] p-3.5 rounded-xl border border-[#292332] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-[#F5F3F7]">Recurring Study Session</span>
              <p className="text-[11px] text-[#8F889D]">Repeat this session on a schedule</p>
            </div>
            <input
              type="checkbox"
              id="is_recurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-4 h-4 rounded text-[#8B5CF6] focus:ring-[#8B5CF6] accent-[#8B5CF6]"
            />
          </div>

          {isRecurring && (
            <div className="pt-2 border-t border-[#292332]">
              <Select
                label="Recurrence Frequency"
                value={recurrenceRule}
                onChange={(e) => setRecurrenceRule(e.target.value)}
              >
                <option value="daily">Every Day (Daily)</option>
                <option value="weekly">Every Week (Weekly)</option>
                <option value="biweekly">Every 2 Weeks (Bi-weekly)</option>
              </Select>
            </div>
          )}
        </div>

        <Textarea
          label="Session Description / Objectives"
          placeholder="e.g., Read pages 140-165, solve 5 practice problems..."
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1F1A28]">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Schedule Session'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

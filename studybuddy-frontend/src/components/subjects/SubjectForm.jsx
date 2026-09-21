import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input, Textarea } from '../ui/Input';
import { Button } from '../ui/Button';
import { api } from '../../api/api';
import { useToast } from '../../context/ToastContext';

const COLOR_PRESETS = [
  { label: 'Purple', value: '#8B5CF6' },
  { label: 'Blue', value: '#3B82F6' },
  { label: 'Emerald', value: '#10B981' },
  { label: 'Amber', value: '#F59E0B' },
  { label: 'Rose', value: '#F43F5E' },
  { label: 'Cyan', value: '#06B6D4' },
  { label: 'Indigo', value: '#6366F1' },
  { label: 'Pink', value: '#EC4899' },
];

export function SubjectForm({
  isOpen,
  onClose,
  subject = null,
  onSuccess,
}) {
  const { toast } = useToast();
  const isEditing = !!subject;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#8B5CF6');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (subject) {
      setName(subject.name || '');
      setDescription(subject.description || '');
      setColor(subject.color || '#8B5CF6');
    } else {
      setName('');
      setDescription('');
      setColor('#8B5CF6');
    }
    setErrors({});
  }, [subject, isOpen]);

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) {
      newErrors.name = 'Subject name is required';
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
      name: name.trim(),
      description: description.trim() || null,
      color,
    };

    try {
      let res;
      if (isEditing) {
        res = await api.subjects.update(subject.id, payload);
      } else {
        res = await api.subjects.create(payload);
      }

      if (res.success) {
        if (onSuccess) onSuccess(res.data);
        onClose();
      } else {
        setErrors({ form: res.error || 'Failed to save subject' });
      }
    } catch (err) {
      setErrors({ form: err.message || 'Error occurred while saving subject' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Subject' : 'Add New Subject'}
      description={isEditing ? 'Update subject title, color code, and description.' : 'Organize your tasks, notes, schedules, and goals by course or topic.'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="p-3 rounded-xl bg-[#F87171]/15 border border-[#F87171]/30 text-[#F87171] text-xs">
            {errors.form}
          </div>
        )}

        <Input
          label="Subject Name"
          required
          placeholder="e.g., Organic Chemistry, Computer Networks"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          autoFocus
        />

        {/* Color Palette Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-[#8F889D]">
            Theme Color
          </label>
          <div className="flex items-center gap-2 flex-wrap bg-[#171421] p-3 rounded-xl border border-[#292332]">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setColor(preset.value)}
                className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${
                  color === preset.value
                    ? 'ring-2 ring-white scale-110 shadow-md'
                    : 'hover:scale-105 opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: preset.value }}
                title={preset.label}
              />
            ))}
            <div className="ml-auto flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-7 h-7 rounded-lg bg-transparent border-0 cursor-pointer p-0"
                title="Custom color picker"
              />
              <span className="font-mono text-xs text-[#8F889D]">{color}</span>
            </div>
          </div>
        </div>

        <Textarea
          label="Description / Syllabus notes"
          placeholder="e.g., MWF 10am lectures, midterm on Week 6, office hours in Room 302..."
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1F1A28]">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Create Subject'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

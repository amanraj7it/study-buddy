import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input, Select, Textarea } from '../ui/Input';
import { Button } from '../ui/Button';
import { api } from '../../api/api';
import { useToast } from '../../context/ToastContext';
import { Eye, Edit3, Tag, Sparkles } from 'lucide-react';

export function NoteEditor({
  isOpen,
  onClose,
  note = null,
  initialSubjectId = null,
  onSuccess,
}) {
  const { toast } = useToast();
  const isEditing = !!note;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [activeTab, setActiveTab] = useState('write'); // 'write' | 'preview'

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
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setTags(note.tags || '');
      setSubjectId(note.subject_id ? String(note.subject_id) : '');
    } else {
      setTitle('');
      setContent('');
      setTags('');
      setSubjectId(initialSubjectId ? String(initialSubjectId) : '');
    }
    setActiveTab('write');
    setErrors({});
  }, [note, initialSubjectId, isOpen]);

  const validate = () => {
    const newErrors = {};
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    const payload = {
      title: title.trim(),
      content: content.trim() || null,
      tags: tags.trim() || null,
      subject_id: subjectId ? parseInt(subjectId, 10) : null,
    };

    try {
      let res;
      if (isEditing) {
        res = await api.notes.update(note.id, payload);
      } else {
        res = await api.notes.create(payload);
      }

      if (res.success) {
        if (onSuccess) onSuccess(res.data);
        onClose();
      } else {
        setErrors({ form: res.error || 'Failed to save note' });
      }
    } catch (err) {
      setErrors({ form: err.message || 'Error occurred while saving note' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-2xl"
      title={isEditing ? 'Edit Study Note' : 'Create New Study Note'}
      description={isEditing ? 'Update lecture notes, markdown summaries, and course tags.' : 'Capture lecture notes, equations, summaries, and flashcard concepts.'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="p-3 rounded-xl bg-[#F87171]/15 border border-[#F87171]/30 text-[#F87171] text-xs">
            {errors.form}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Note Title"
              required
              placeholder="e.g., Chapter 4: Integration by Parts"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={errors.title}
              autoFocus
            />
          </div>
          <div>
            <Select
              label="Subject"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              <option value="">No Subject</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <Input
          label="Tags (comma-separated)"
          placeholder="e.g., calculus, exam1, formulas, lab"
          icon={Tag}
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          helperText="Separate multiple tags with commas for easy filtering and flashcard decks"
        />

        {/* Editor / Preview Tabs */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-[#8F889D]">
              Note Content
            </label>
            <div className="flex items-center gap-1 bg-[#171421] p-0.5 rounded-lg border border-[#292332]">
              <button
                type="button"
                onClick={() => setActiveTab('write')}
                className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 ${
                  activeTab === 'write'
                    ? 'bg-[#8B5CF6] text-white'
                    : 'text-[#8F889D] hover:text-[#F5F3F7]'
                }`}
              >
                <Edit3 className="w-3 h-3" /> Write
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 ${
                  activeTab === 'preview'
                    ? 'bg-[#8B5CF6] text-white'
                    : 'text-[#8F889D] hover:text-[#F5F3F7]'
                }`}
              >
                <Eye className="w-3 h-3" /> Preview
              </button>
            </div>
          </div>

          {activeTab === 'write' ? (
            <textarea
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your study notes, bullet points, key definitions, or summaries here...&#10;&#10;Tip: Use 'Q: question' and 'A: answer' or 'Term: Definition' to auto-generate flashcard decks!"
              className="w-full bg-[#11101A] border border-[#292332] focus:border-[#8B5CF6] text-[#F5F3F7] placeholder-[#645E73] text-sm rounded-xl p-3.5 focus:outline-none transition-colors font-mono leading-relaxed"
            />
          ) : (
            <div className="min-h-[200px] max-h-[300px] overflow-y-auto bg-[#171421] border border-[#292332] rounded-xl p-4 text-sm text-[#F5F3F7] whitespace-pre-line leading-relaxed">
              {content || <span className="text-[#645E73] italic">No content to preview...</span>}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1F1A28]">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Create Note'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

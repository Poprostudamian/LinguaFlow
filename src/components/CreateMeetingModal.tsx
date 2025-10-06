// src/components/CreateMeetingModal.tsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Users, 
  Video, 
  FileText,
  User,
  Check,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useStudents } from '../contexts/StudentsContext';
import { createMeeting, MeetingWithParticipants } from '../lib/meetingsAPI'; // ← IMPORT API

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMeetingCreated: (meeting: MeetingWithParticipants) => void;
}

interface MeetingFormData {
  title: string;
  description: string;
  meeting_url: string;
  scheduled_at: string;
  duration_minutes: number;
  selected_students: string[];
}

const DURATION_OPTIONS = [
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
];

export function CreateMeetingModal({ isOpen, onClose, onMeetingCreated }: CreateMeetingModalProps) {
  const { session } = useAuth();
  const { students, isLoading: studentsLoading } = useStudents();
  
  const [formData, setFormData] = useState<MeetingFormData>({
    title: '',
    description: '',
    meeting_url: '',
    scheduled_at: '',
    duration_minutes: 60,
    selected_students: []
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        description: '',
        meeting_url: '',
        scheduled_at: '',
        duration_minutes: 60,
        selected_students: []
      });
      setError(null);
      setSearchQuery('');
    }
  }, [isOpen]);

  // Set default date to tomorrow at 14:00
  useEffect(() => {
    if (isOpen && !formData.scheduled_at) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 0, 0, 0);
      
      setFormData(prev => ({
        ...prev,
        scheduled_at: tomorrow.toISOString().slice(0, 16)
      }));
    }
  }, [isOpen, formData.scheduled_at]);

  // Filter students based on search
  const filteredStudents = students.filter(student => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const fullName = `${student.student_first_name} ${student.student_last_name}`.toLowerCase();
    return fullName.includes(query) || student.student_email.toLowerCase().includes(query);
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStudentToggle = (studentId: string) => {
    setFormData(prev => ({
      ...prev,
      selected_students: prev.selected_students.includes(studentId)
        ? prev.selected_students.filter(id => id !== studentId)
        : [...prev.selected_students, studentId]
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.title.trim()) return 'Meeting title is required';
    if (!formData.meeting_url.trim()) return 'Meeting URL is required';
    if (!formData.scheduled_at) return 'Meeting date and time is required';
    if (formData.selected_students.length === 0) return 'Please select at least one student';
    
    // Check if meeting URL looks like a URL
    try {
      new URL(formData.meeting_url);
    } catch {
      return 'Please enter a valid meeting URL';
    }

    // Check if date is in the future
    const selectedDate = new Date(formData.scheduled_at);
    const now = new Date();
    if (selectedDate <= now) {
      return 'Meeting must be scheduled in the future';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!session.user?.id) {
      setError('You must be logged in to create a meeting');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log('📅 Creating meeting with API...');
      
      // ✅ PRAWDZIWE ZAPISYWANIE DO SUPABASE
      const newMeeting = await createMeeting(session.user.id, {
        title: formData.title,
        description: formData.description,
        meeting_url: formData.meeting_url,
        scheduled_at: new Date(formData.scheduled_at).toISOString(),
        duration_minutes: formData.duration_minutes,
        student_ids: formData.selected_students
      });

      console.log('✅ Meeting created successfully:', newMeeting.id);
      
      // Call the callback with the new meeting
      onMeetingCreated(newMeeting);
      
      // Close the modal
      onClose();
      
    } catch (err: any) {
      console.error('❌ Error creating meeting:', err);
      setError(err.message || 'Failed to create meeting. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create New Meeting
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            disabled={isSubmitting}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="flex items-start space-x-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Meeting Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Spanish Conversation Practice"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Optional description of what you'll cover in this meeting..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              disabled={isSubmitting}
            />
          </div>

          {/* Meeting URL */}
          <div>
            <label htmlFor="meeting_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Meeting URL *
            </label>
            <div className="relative">
              <Video className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="url"
                id="meeting_url"
                name="meeting_url"
                value={formData.meeting_url}
                onChange={handleInputChange}
                placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="scheduled_at" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date & Time *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="datetime-local"
                  id="scheduled_at"
                  name="scheduled_at"
                  value={formData.scheduled_at}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label htmlFor="duration_minutes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  id="duration_minutes"
                  name="duration_minutes"
                  value={formData.duration_minutes}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white appearance-none"
                  disabled={isSubmitting}
                >
                  {DURATION_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Students Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Students *
            </label>
            
            {/* Search */}
            <div className="relative mb-3">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students by name or email..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                disabled={isSubmitting}
              />
            </div>

            {/* Students List */}
            <div className="border border-gray-300 dark:border-gray-600 rounded-md max-h-60 overflow-y-auto">
              {studentsLoading ? (
                <div className="p-4 text-center text-gray-500">Loading students...</div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No students found</div>
              ) : (
                filteredStudents.map(student => (
                  <label
                    key={student.student_id}
                    className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={formData.selected_students.includes(student.student_id)}
                      onChange={() => handleStudentToggle(student.student_id)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      disabled={isSubmitting}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {student.student_first_name} {student.student_last_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {student.student_email}
                      </p>
                    </div>
                    {formData.selected_students.includes(student.student_id) && (
                      <Check className="h-5 w-5 text-purple-600" />
                    )}
                  </label>
                ))
              )}
            </div>

            {formData.selected_students.length > 0 && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {formData.selected_students.length} student{formData.selected_students.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Users className="h-4 w-4" />
                  <span>Create Meeting</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
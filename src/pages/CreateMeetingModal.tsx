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

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMeetingCreated: (meeting: any) => void; // callback po utworzeniu spotkania
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
        scheduled_at: tomorrow.toISOString().slice(0, 16) // Format for datetime-local input
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

    setIsSubmitting(true);
    setError(null);

    try {
      // Here you would call your API to create the meeting
      // For now, we'll simulate the API call with mock data
      
      const newMeeting = {
        id: Date.now().toString(), // Mock ID
        title: formData.title,
        description: formData.description,
        meeting_url: formData.meeting_url,
        scheduled_at: new Date(formData.scheduled_at).toISOString(),
        duration_minutes: formData.duration_minutes,
        status: 'scheduled',
        tutor_id: session.user?.id,
        participants: formData.selected_students.map(studentId => {
          const student = students.find(s => s.student_id === studentId);
          return {
            id: studentId,
            name: student ? `${student.student_first_name} ${student.student_last_name}` : 'Unknown',
            email: student?.student_email || '',
            status: 'invited'
          };
        })
      };

      console.log('Creating meeting:', newMeeting);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Call the callback with the new meeting
      onMeetingCreated(newMeeting);
      
      // Close the modal
      onClose();
      
    } catch (err: any) {
      console.error('Error creating meeting:', err);
      setError(err.message || 'Failed to create meeting. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Create New Meeting
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            disabled={isSubmitting}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800 dark:text-red-200 text-sm">{error}</span>
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

          {/* Date and Time + Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date and Time */}
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

            {/* Duration */}
            <div>
              <label htmlFor="duration_minutes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  id="duration_minutes"
                  name="duration_minutes"
                  value={formData.duration_minutes}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
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

          {/* Student Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Invite Students * ({formData.selected_students.length} selected)
            </label>
            
            {/* Search Students */}
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
                <div className="p-4 text-center text-gray-500">
                  Loading students...
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchQuery ? 'No students found matching your search.' : 'No students available.'}
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredStudents.map((student) => (
                    <label
                      key={student.student_id}
                      className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={formData.selected_students.includes(student.student_id)}
                          onChange={() => handleStudentToggle(student.student_id)}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          disabled={isSubmitting}
                        />
                        {formData.selected_students.includes(student.student_id) && (
                          <Check className="absolute inset-0 h-4 w-4 text-purple-600 pointer-events-none" />
                        )}
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {student.student_first_name} {student.student_last_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {student.student_email}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || formData.selected_students.length === 0}
              className="flex items-center space-x-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-md transition-colors"
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
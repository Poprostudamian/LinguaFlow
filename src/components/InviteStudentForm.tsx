// src/components/InviteStudentForm.tsx
import React, { useState } from 'react';
import { Mail, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { inviteStudent, InviteStudentData } from '../lib/supabase-students';

interface InviteStudentFormProps {
  onInviteSent: () => void;
}

export function InviteStudentForm({ onInviteSent }: InviteStudentFormProps) {
  const { session } = useAuth();
  const [formData, setFormData] = useState<InviteStudentData>({
    studentEmail: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session.user?.id) {
      setError('You must be logged in to send invitations');
      return;
    }

    if (!formData.studentEmail.trim()) {
      setError('Student email is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.studentEmail.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await inviteStudent(session.user.id, {
        studentEmail: formData.studentEmail.trim(),
        message: formData.message.trim() || undefined
      });

      setSuccess(`Invitation sent successfully to ${formData.studentEmail}!`);
      
      // Clear form
      setFormData({
        studentEmail: '',
        message: ''
      });

      // Call parent callback to refresh data
      onInviteSent();

    } catch (err: any) {
      console.error('Error sending invitation:', err);
      setError(err.message || 'Failed to send invitation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof InviteStudentData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear messages when user starts typing
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 flex items-center space-x-2">
          <Mail className="h-5 w-5 text-purple-600" />
          <span>Invite New Student</span>
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Send an invitation email to add a new student to your classes.
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
            <p className="text-green-600 dark:text-green-400 text-sm">{success}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Student Email Address *
          </label>
          <input
            type="email"
            value={formData.studentEmail}
            onChange={(e) => handleInputChange('studentEmail', e.target.value)}
            placeholder="student@example.com"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            required
            disabled={isSubmitting}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            The student will receive an email invitation to join your classes.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Personal Message (Optional)
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => handleInputChange('message', e.target.value)}
            placeholder="Hi! I'd like to invite you to join my language classes. Looking forward to working with you!"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none"
            disabled={isSubmitting}
            maxLength={500}
          />
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Add a personal touch to your invitation.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formData.message.length}/500
            </p>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
            What happens next?
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
            <li>• The student will receive an email invitation</li>
            <li>• They can accept or decline the invitation</li>
            <li>• Invitations expire after 7 days</li>
            <li>• You can track the status in the "Invitations" tab</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting || !formData.studentEmail.trim()}
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-all duration-200 hover:transform hover:scale-105 disabled:transform-none disabled:scale-100"
          >
            <Send className="h-4 w-4" />
            <span>{isSubmitting ? 'Sending...' : 'Send Invitation'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFormData({ studentEmail: '', message: '' });
              setError(null);
              setSuccess(null);
            }}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}
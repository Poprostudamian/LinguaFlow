// src/pages/TutorSchedulePage.tsx
import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Users,
  Video,
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CreateMeetingModal } from '../components/CreateMeetingModal';
import { 
  getTutorMeetings, 
  deleteMeeting, 
  MeetingWithParticipants 
} from '../lib/meetingsAPI';

export function TutorSchedulePage() {
  const { session } = useAuth();
  const [meetings, setMeetings] = useState<MeetingWithParticipants[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load meetings from database
  const loadMeetings = async () => {
    if (!session.user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('📅 Loading meetings from database...');
      const data = await getTutorMeetings(session.user.id);
      setMeetings(data);
      console.log('✅ Loaded', data.length, 'meetings');
    } catch (err: any) {
      console.error('❌ Error loading meetings:', err);
      setError(err.message || 'Failed to load meetings');
    } finally {
      setIsLoading(false);
    }
  };

  // Load meetings on component mount
  useEffect(() => {
    if (session.isAuthenticated && session.user?.id) {
      loadMeetings();
    }
  }, [session.isAuthenticated, session.user?.id]);

  // Filter meetings for current view
  const upcomingMeetings = meetings
    .filter(meeting => new Date(meeting.scheduled_at) > new Date())
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  const todaysMeetings = meetings.filter(meeting => {
    const meetingDate = new Date(meeting.scheduled_at).toDateString();
    const today = new Date().toDateString();
    return meetingDate === today;
  });

  const thisWeekMeetings = meetings.filter(meeting => {
    const meetingDate = new Date(meeting.scheduled_at);
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return meetingDate >= today && meetingDate <= weekFromNow;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'in_progress':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  // Handle meeting creation
  const handleMeetingCreated = (newMeeting: MeetingWithParticipants) => {
    setMeetings(prev => [...prev, newMeeting]);
    console.log('✅ Meeting added to list:', newMeeting.id);
  };

  // Handle meeting deletion
  const handleDeleteMeeting = async (meetingId: string) => {
    if (!window.confirm('Are you sure you want to delete this meeting?')) {
      return;
    }

    try {
      console.log('🗑️ Deleting meeting:', meetingId);
      await deleteMeeting(meetingId);
      setMeetings(prev => prev.filter(m => m.id !== meetingId));
      console.log('✅ Meeting deleted successfully');
    } catch (err: any) {
      console.error('❌ Error deleting meeting:', err);
      alert(err.message || 'Failed to delete meeting');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading meetings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Schedule
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your online meetings and sessions with students
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Create Meeting</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start space-x-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={loadMeetings}
              className="text-sm text-red-700 dark:text-red-300 underline mt-1"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Today</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {todaysMeetings.length}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">This Week</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {thisWeekMeetings.length}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {upcomingMeetings.length}
          </p>
        </div>
      </div>

      {/* Meetings List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Upcoming Meetings
          </h2>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {upcomingMeetings.length > 0 ? (
            upcomingMeetings.map((meeting) => (
              <div key={meeting.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {meeting.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(meeting.status)}`}>
                        {meeting.status}
                      </span>
                    </div>
                    
                    {meeting.description && (
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {meeting.description}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(meeting.scheduled_at)}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatTime(meeting.scheduled_at)}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{meeting.duration} min</span>
                      </span>
                    </div>
                    
                    <div className="mt-2 flex items-center space-x-2">
                      {meeting.participants?.map((participant, index) => (
                        <span key={participant.id} className="text-sm text-gray-600 dark:text-gray-400">
                          {participant.name}{index < meeting.participants!.length - 1 ? ',' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => window.open(meeting.meeting_url, '_blank')}
                      className="flex items-center space-x-1 px-3 py-2 text-sm bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-300 rounded-md transition-colors"
                      title="Join meeting"
                    >
                      <Video className="h-4 w-4" />
                      <span>Join</span>
                    </button>
                    <button
                      onClick={() => console.log('Edit meeting:', meeting.id)}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Edit meeting"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMeeting(meeting.id)}
                      className="p-2 text-red-500 hover:text-red-700 dark:hover:text-red-300 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Delete meeting"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No upcoming meetings
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Create your first meeting to get started with online sessions.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>Create Meeting</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Meeting Modal */}
      <CreateMeetingModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onMeetingCreated={handleMeetingCreated}
      />
    </div>
  );
}

// Default export for compatibility
export default TutorSchedulePage;
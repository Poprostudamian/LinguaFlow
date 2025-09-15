import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Users,
  Video,
  Edit,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CreateMeetingModal } from '../components/CreateMeetingModal';

// Temporary mock data - będziemy to zastępować prawdziwymi danymi z API
const mockMeetings = [
  {
    id: '1',
    title: 'Spanish Conversation Practice',
    description: 'Weekly conversation practice with Maria',
    scheduled_at: '2025-01-20T14:00:00Z',
    duration_minutes: 60,
    meeting_url: 'https://zoom.us/j/123456789',
    status: 'scheduled',
    participants: [
      { id: 'student1', name: 'Anna Kowalska', email: 'anna@example.com', status: 'invited' }
    ]
  },
  {
    id: '2',
    title: 'Grammar Workshop',
    description: 'Advanced grammar concepts',
    scheduled_at: '2025-01-22T16:30:00Z',
    duration_minutes: 90,
    meeting_url: 'https://meet.google.com/abc-defg-hij',
    status: 'scheduled',
    participants: [
      { id: 'student2', name: 'Piotr Nowak', email: 'piotr@example.com', status: 'invited' },
      { id: 'student3', name: 'Maria Wiśniewska', email: 'maria@example.com', status: 'invited' }
    ]
  }
];

export function TutorSchedulePage() {
  const { session } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [meetings, setMeetings] = useState(mockMeetings);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

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

  // Handle new meeting creation
  const handleMeetingCreated = (newMeeting: any) => {
    setMeetings(prev => [...prev, newMeeting]);
    console.log('Meeting created:', newMeeting);
    // Here you could show a success notification
  };

  // Handle meeting deletion
  const handleDeleteMeeting = (meetingId: string) => {
    if (window.confirm('Are you sure you want to delete this meeting?')) {
      setMeetings(meetings.filter(m => m.id !== meetingId));
      // Here you would also call the API to delete the meeting
      console.log('Meeting deleted:', meetingId);
    }
  };

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
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Students</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {new Set(meetings.flatMap(m => m.participants.map(p => p.id))).size}
          </p>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Next Meeting Highlight */}
        {upcomingMeetings.length > 0 && (
          <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <h3 className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-2">
              Next Meeting
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                  {upcomingMeetings[0].title}
                </h4>
                <p className="text-purple-700 dark:text-purple-300">
                  {formatDate(upcomingMeetings[0].scheduled_at)} at {formatTime(upcomingMeetings[0].scheduled_at)}
                </p>
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  {upcomingMeetings[0].participants.length} participant(s)
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={upcomingMeetings[0].meeting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
                >
                  <Video className="h-4 w-4" />
                  <span>Join</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upcoming Meetings List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Upcoming Meetings ({upcomingMeetings.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {upcomingMeetings.length > 0 ? (
            upcomingMeetings.map((meeting) => (
              <div key={meeting.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {meeting.title}
                      </h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(meeting.status)}`}>
                        {meeting.status}
                      </span>
                    </div>
                    
                    {meeting.description && (
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {meeting.description}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(meeting.scheduled_at)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatTime(meeting.scheduled_at)} ({meeting.duration_minutes}min)</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{meeting.participants.length} participant(s)</span>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Participants:</span>
                        {meeting.participants.map((participant, index) => (
                          <span key={participant.id} className="text-sm text-gray-700 dark:text-gray-300">
                            {participant.name}{index < meeting.participants.length - 1 ? ',' : ''}
                          </span>
                        ))}
                      </div>
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
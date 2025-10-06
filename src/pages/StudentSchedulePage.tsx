// src/pages/StudentSchedulePage.tsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  Video,
  Users,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getStudentMeetings, 
  MeetingWithParticipants 
} from '../lib/meetingsAPI'; // ← IMPORT REAL API

export function StudentSchedulePage() {
  const { session } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [meetings, setMeetings] = useState<MeetingWithParticipants[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ ŁADOWANIE SPOTKAŃ Z BAZY DANYCH
  const loadMeetings = async () => {
    if (!session.user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('📅 [STUDENT] Loading meetings from database...');
      const data = await getStudentMeetings(session.user.id);
      setMeetings(data);
      console.log('✅ [STUDENT] Loaded', data.length, 'meetings');
    } catch (err: any) {
      console.error('❌ [STUDENT] Error loading meetings:', err);
      setError(err.message || 'Failed to load meetings');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ ZAŁADUJ SPOTKANIA PO MONTOWANIU KOMPONENTU
  useEffect(() => {
    if (session.isAuthenticated && session.user?.id) {
      loadMeetings();
    }
  }, [session.isAuthenticated, session.user?.id]);

  // Filter meetings
  const now = new Date();
  const upcomingMeetings = meetings
    .filter(meeting => new Date(meeting.scheduled_at) > now)
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  const todaysMeetings = meetings.filter(meeting => {
    const meetingDate = new Date(meeting.scheduled_at).toDateString();
    const today = new Date().toDateString();
    return meetingDate === today;
  });

  const thisWeekMeetings = meetings.filter(meeting => {
    const meetingDate = new Date(meeting.scheduled_at);
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return meetingDate >= now && meetingDate <= weekFromNow;
  });

  const pastMeetings = meetings
    .filter(meeting => new Date(meeting.scheduled_at) <= now)
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

  // Get unique tutors
  const uniqueTutors = new Set(meetings.map(m => `${m.tutor_first_name} ${m.tutor_last_name}`));

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

  const isToday = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0];
    const meetingDate = new Date(dateString).toISOString().split('T')[0];
    return meetingDate === today;
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

  // ✅ LOADING STATE
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Schedule
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View your upcoming lessons and manage your learning schedule
        </p>
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

      {/* Calendar Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
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

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <Calendar className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">This Week</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {thisWeekMeetings.length} meeting{thisWeekMeetings.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Next Meeting</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {upcomingMeetings.length > 0 ? formatTime(upcomingMeetings[0].scheduled_at) : 'None'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <User className="h-8 w-8 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Tutors</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {uniqueTutors.size}
              </p>
            </div>
          </div>
        </div>

        {/* Next Meeting Highlight */}
        {upcomingMeetings.length > 0 && (
          <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
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
                  with {upcomingMeetings[0].tutor_first_name} {upcomingMeetings[0].tutor_last_name}
                </p>
              </div>
              <button
                onClick={() => window.open(upcomingMeetings[0].meeting_url, '_blank')}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
              >
                <Video className="h-4 w-4" />
                <span>Join Meeting</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upcoming Meetings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Upcoming Meetings ({upcomingMeetings.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {upcomingMeetings.length > 0 ? (
            upcomingMeetings.map(meeting => (
              <div 
                key={meeting.id} 
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                  isToday(meeting.scheduled_at) ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        {meeting.title}
                      </h4>
                      {isToday(meeting.scheduled_at) && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 rounded-full">
                          Today
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(meeting.status)}`}>
                        {meeting.status}
                      </span>
                    </div>
                    
                    {meeting.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {meeting.description}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(meeting.scheduled_at)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatTime(meeting.scheduled_at)} ({meeting.duration_minutes} min)</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>
                          {meeting.tutor_first_name} {meeting.tutor_last_name}
                        </span>
                      </div>
                    </div>
                    
                    {meeting.participants.length > 1 && (
                      <div className="mt-2 flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {meeting.participants.length} participant{meeting.participants.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => window.open(meeting.meeting_url, '_blank')}
                    className="flex items-center space-x-2 px-4 py-2 text-sm bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-300 rounded-md transition-colors ml-4"
                  >
                    <Video className="h-4 w-4" />
                    <span>Join</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No upcoming meetings
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Your tutor hasn't scheduled any meetings yet. Check back later!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Past Meetings */}
      {pastMeetings.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Past Meetings ({pastMeetings.length})
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {pastMeetings.slice(0, 5).map(meeting => (
              <div key={meeting.id} className="p-4 opacity-75">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-base font-medium text-gray-700 dark:text-gray-300">
                        {meeting.title}
                      </h4>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(meeting.scheduled_at)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>
                          {meeting.tutor_first_name} {meeting.tutor_last_name}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {pastMeetings.length > 5 && (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  And {pastMeetings.length - 5} more past meeting{pastMeetings.length - 5 !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
// src/pages/StudentSchedulePage.tsx - MODERN VERSION WITH MULTIPLE VIEWS

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  Video,
  AlertCircle,
  Filter,
  Search,
  Grid3x3,
  List,
  CalendarDays,
  MapPin,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getStudentMeetings, 
  MeetingWithParticipants 
} from '../lib/meetingsAPI';

type ViewMode = 'month' | 'week' | 'day';
type FilterStatus = 'all' | 'scheduled' | 'completed' | 'cancelled';

export function StudentSchedulePage() {
  const { session } = useAuth();
  
  // State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [meetings, setMeetings] = useState<MeetingWithParticipants[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load meetings
  useEffect(() => {
    if (session?.user?.id) {
      loadMeetings();
    }
  }, [session?.user?.id]);

  const loadMeetings = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getStudentMeetings(session.user.id);
      setMeetings(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load meetings');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter meetings
  const filteredMeetings = meetings.filter(meeting => {
    // Status filter
    if (filterStatus !== 'all' && meeting.status !== filterStatus) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        meeting.title.toLowerCase().includes(query) ||
        meeting.description?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Calculate stats
  const now = new Date();
  const upcomingMeetings = filteredMeetings.filter(m => new Date(m.scheduled_at) > now);
  const todaysMeetings = filteredMeetings.filter(m => {
    const meetingDate = new Date(m.scheduled_at).toDateString();
    return meetingDate === now.toDateString();
  });
  const thisWeekMeetings = filteredMeetings.filter(m => {
    const meetingDate = new Date(m.scheduled_at);
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return meetingDate >= now && meetingDate <= weekFromNow;
  });

  // Navigation
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (viewMode) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Helper functions
  const formatDate = (date: Date) => {
    switch (viewMode) {
      case 'month':
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      case 'week':
        const weekStart = getWeekStart(date);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'day':
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
  };

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'scheduled':
        return {
          label: 'Scheduled',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
          icon: Calendar,
          borderColor: 'border-blue-300 dark:border-blue-600'
        };
      case 'in_progress':
        return {
          label: 'In Progress',
          color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
          icon: Video,
          borderColor: 'border-green-300 dark:border-green-600'
        };
      case 'completed':
        return {
          label: 'Completed',
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
          icon: CheckCircle,
          borderColor: 'border-gray-300 dark:border-gray-600'
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
          icon: XCircle,
          borderColor: 'border-red-300 dark:border-red-600'
        };
      default:
        return {
          label: 'Unknown',
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
          icon: AlertCircle,
          borderColor: 'border-gray-300 dark:border-gray-600'
        };
    }
  };

  // Meeting card component
  const MeetingCard = ({ meeting }: { meeting: MeetingWithParticipants }) => {
    const statusConfig = getStatusConfig(meeting.status);
    const StatusIcon = statusConfig.icon;
    const isUpcoming = new Date(meeting.scheduled_at) > now;
    const isPast = new Date(meeting.scheduled_at) <= now;

    return (
      <div className={`group bg-white dark:bg-gray-800 rounded-xl border-2 ${statusConfig.borderColor} p-4 hover:shadow-lg transition-all duration-300`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {meeting.title}
              </h3>
              <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                <StatusIcon className="h-3 w-3" />
                <span>{statusConfig.label}</span>
              </span>
            </div>
            
            {meeting.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {meeting.description}
              </p>
            )}
          </div>
        </div>

        {/* Time & Tutor Info */}
        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{formatTime(meeting.scheduled_at)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{meeting.duration_minutes} min</span>
          </div>
        </div>

        {/* Participants */}
        {meeting.participants && meeting.participants.length > 0 && (
          <div className="flex items-center space-x-2 mb-3">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {meeting.participants.length} participant{meeting.participants.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center space-x-2 pt-3 border-t border-gray-200 dark:border-gray-700">
          {isUpcoming && meeting.status === 'scheduled' && (
            <button
              onClick={() => window.open(meeting.meeting_url, '_blank')}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium rounded-lg transition-all duration-200"
            >
              <Video className="h-4 w-4" />
              <span>Join Meeting</span>
            </button>
          )}
          
          {isPast && meeting.status === 'completed' && (
            <div className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg">
              <CheckCircle className="h-4 w-4" />
              <span>Meeting Completed</span>
            </div>
          )}

          {meeting.status === 'cancelled' && (
            <div className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
              <XCircle className="h-4 w-4" />
              <span>Cancelled</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading your schedule...</p>
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
            Manage your upcoming lessons and meetings
          </p>
        </div>

        <button
          onClick={loadMeetings}
          className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="text-red-800 dark:text-red-200 font-medium">Error loading schedule</h3>
              <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
            </div>
          </div>
          <button
            onClick={loadMeetings}
            className="mt-3 px-3 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-md hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                Today
              </p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                {todaysMeetings.length}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {todaysMeetings.length === 1 ? 'meeting' : 'meetings'}
              </p>
            </div>
            <div className="bg-blue-200 dark:bg-blue-900/40 p-3 rounded-lg">
              <CalendarDays className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">
                This Week
              </p>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                {thisWeekMeetings.length}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                {thisWeekMeetings.length === 1 ? 'meeting' : 'meetings'}
              </p>
            </div>
            <div className="bg-purple-200 dark:bg-purple-900/40 p-3 rounded-lg">
              <Calendar className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                Upcoming
              </p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                {upcomingMeetings.length}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {upcomingMeetings.length === 1 ? 'meeting' : 'meetings'}
              </p>
            </div>
            <div className="bg-green-200 dark:bg-green-900/40 p-3 rounded-lg">
              <Clock className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Grid3x3 className="h-4 w-4" />
              <span>Month</span>
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <CalendarDays className="h-4 w-4" />
              <span>Week</span>
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'day'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <List className="h-4 w-4" />
              <span>Day</span>
            </button>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center space-x-4">
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Today
            </button>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateDate('prev')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              
              <h2 className="min-w-[200px] text-center text-lg font-semibold text-gray-900 dark:text-white">
                {formatDate(currentDate)}
              </h2>
              
              <button
                onClick={() => navigateDate('next')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content - Different views based on viewMode */}
      {viewMode === 'month' && (
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Calendar View
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Click on a day to see meeting details
            </p>
          </div>
          
          {/* Use CalendarGrid component here when you create it */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-center text-gray-500 dark:text-gray-400">
              Calendar grid view - integrate CalendarGrid component
            </p>
          </div>
        </div>
      )}

      {viewMode === 'week' && (
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Week Timeline
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Your schedule for the week
            </p>
          </div>
          
          {/* Use WeekTimeline component here when you create it */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-center text-gray-500 dark:text-gray-400">
              Week timeline view - integrate WeekTimeline component
            </p>
          </div>
        </div>
      )}

      {viewMode === 'day' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Today's Meetings
            </h2>
          </div>

          {filteredMeetings.length > 0 ? (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMeetings
                .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
                .map(meeting => (
                  <MeetingCard key={meeting.id} meeting={meeting} />
                ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="bg-gray-100 dark:bg-gray-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No meetings scheduled
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {filterStatus !== 'all' 
                    ? `No ${filterStatus} meetings found.`
                    : 'Your tutor hasn\'t scheduled any meetings yet. Check back later!'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
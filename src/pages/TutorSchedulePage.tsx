// src/pages/TutorSchedulePage.tsx - IMPROVED VERSION WITH CALENDAR

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
  ExternalLink,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  XCircle
} from 'lucide-react';

// Mock auth context
const useAuth = () => ({
  session: {
    user: { id: 'tutor-123', role: 'tutor' },
    isAuthenticated: true
  }
});

// Mock meeting data
interface MeetingWithParticipants {
  id: string;
  tutor_id: string;
  title: string;
  description?: string;
  meeting_url: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  participants: Array<{
    student_id: string;
    student_first_name: string;
    student_last_name: string;
    student_email: string;
  }>;
}

// Mock data generator
const generateMockMeetings = (): MeetingWithParticipants[] => {
  const now = new Date();
  const meetings: MeetingWithParticipants[] = [];
  
  // Today's meetings
  meetings.push({
    id: '1',
    tutor_id: 'tutor-123',
    title: 'English Conversation Practice',
    description: 'Focus on business English vocabulary',
    meeting_url: 'https://meet.google.com/abc-defg-hij',
    scheduled_at: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0).toISOString(),
    duration_minutes: 60,
    status: 'scheduled',
    created_at: now.toISOString(),
    participants: [
      { student_id: '1', student_first_name: 'John', student_last_name: 'Doe', student_email: 'john@example.com' }
    ]
  });

  // Tomorrow's meeting
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  meetings.push({
    id: '2',
    tutor_id: 'tutor-123',
    title: 'Grammar Workshop',
    description: 'Past perfect tense exercises',
    meeting_url: 'https://zoom.us/j/123456789',
    scheduled_at: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 10, 0).toISOString(),
    duration_minutes: 90,
    status: 'scheduled',
    created_at: now.toISOString(),
    participants: [
      { student_id: '2', student_first_name: 'Jane', student_last_name: 'Smith', student_email: 'jane@example.com' },
      { student_id: '3', student_first_name: 'Mike', student_last_name: 'Johnson', student_email: 'mike@example.com' }
    ]
  });

  // Next week's meeting
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  meetings.push({
    id: '3',
    tutor_id: 'tutor-123',
    title: 'Pronunciation Training',
    meeting_url: 'https://meet.google.com/xyz-uvwx-rst',
    scheduled_at: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 15, 30).toISOString(),
    duration_minutes: 45,
    status: 'scheduled',
    created_at: now.toISOString(),
    participants: [
      { student_id: '1', student_first_name: 'John', student_last_name: 'Doe', student_email: 'john@example.com' }
    ]
  });

  // Meeting in 2 weeks
  const twoWeeks = new Date(now);
  twoWeeks.setDate(twoWeeks.getDate() + 14);
  meetings.push({
    id: '4',
    tutor_id: 'tutor-123',
    title: 'Writing Skills Session',
    description: 'Essay structure and academic writing',
    meeting_url: 'https://zoom.us/j/987654321',
    scheduled_at: new Date(twoWeeks.getFullYear(), twoWeeks.getMonth(), twoWeeks.getDate(), 11, 0).toISOString(),
    duration_minutes: 120,
    status: 'scheduled',
    created_at: now.toISOString(),
    participants: [
      { student_id: '2', student_first_name: 'Jane', student_last_name: 'Smith', student_email: 'jane@example.com' }
    ]
  });

  return meetings;
};

// Mock modal component
const CreateMeetingModal = ({ isOpen, onClose, onMeetingCreated }: any) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Meeting</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XCircle className="h-6 w-6" />
          </button>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Modal functionality would be implemented here
        </p>
        <button
          onClick={onClose}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default function TutorSchedulePage() {
  const { session } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [meetings, setMeetings] = useState<MeetingWithParticipants[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load meetings (mock for this demo)
  useEffect(() => {
    setMeetings(generateMockMeetings());
  }, []);

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);

  // Generate calendar days
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Get meetings for a specific day
  const getMeetingsForDay = (day: number | null) => {
    if (!day) return [];
    
    const dateStr = new Date(year, month, day).toDateString();
    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.scheduled_at).toDateString();
      return meetingDate === dateStr;
    });
  };

  // Check if date is today
  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  // Check if date is selected
  const isSelected = (day: number | null) => {
    if (!day || !selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === month &&
      selectedDate.getFullYear() === year
    );
  };

  // Check if date has meetings
  const hasMeetings = (day: number | null) => {
    return getMeetingsForDay(day).length > 0;
  };

  // Navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Handle day click
  const handleDayClick = (day: number | null) => {
    if (!day) return;
    const date = new Date(year, month, day);
    setSelectedDate(date);
  };

  // Get selected day meetings
  const selectedDayMeetings = selectedDate ? getMeetingsForDay(selectedDate.getDate()) : [];

  // Format functions
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'scheduled':
        return {
          label: 'Scheduled',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
          icon: Calendar,
          dotColor: 'bg-blue-500'
        };
      case 'in_progress':
        return {
          label: 'In Progress',
          color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
          icon: Video,
          dotColor: 'bg-green-500'
        };
      case 'completed':
        return {
          label: 'Completed',
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
          icon: CheckCircle,
          dotColor: 'bg-gray-500'
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
          icon: XCircle,
          dotColor: 'bg-red-500'
        };
      default:
        return {
          label: 'Unknown',
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
          icon: AlertCircle,
          dotColor: 'bg-gray-500'
        };
    }
  };

  // Calculate stats
  const now = new Date();
  const upcomingMeetings = meetings.filter(m => new Date(m.scheduled_at) > now && m.status === 'scheduled');
  const todaysMeetings = meetings.filter(m => {
    const meetingDate = new Date(m.scheduled_at).toDateString();
    return meetingDate === now.toDateString();
  });
  const thisWeekMeetings = meetings.filter(m => {
    const meetingDate = new Date(m.scheduled_at);
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return meetingDate >= now && meetingDate <= weekFromNow;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Schedule
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your meetings and schedule new sessions
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMeetings(generateMockMeetings())}
              className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-sm"
            >
              <Plus className="h-5 w-5" />
              <span>Create Meeting</span>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                  Today's Meetings
                </p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                  {todaysMeetings.length}
                </p>
              </div>
              <div className="bg-blue-200 dark:bg-blue-900/40 p-3 rounded-lg">
                <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400" />
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
              </div>
              <div className="bg-purple-200 dark:bg-purple-900/40 p-3 rounded-lg">
                <Clock className="h-8 w-8 text-purple-600 dark:text-purple-400" />
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
              </div>
              <div className="bg-green-200 dark:bg-green-900/40 p-3 rounded-lg">
                <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Calendar Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={goToToday}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => navigateMonth('prev')}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button
                      onClick={() => navigateMonth('next')}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                    <span>Today</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>Has meetings</span>
                  </div>
                </div>
              </div>

              {/* Days of week header */}
              <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div
                    key={day}
                    className="p-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-400"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day, index) => {
                  const dayMeetings = getMeetingsForDay(day);
                  const today = isToday(day);
                  const selected = isSelected(day);
                  const meetings = hasMeetings(day);

                  return (
                    <div
                      key={index}
                      onClick={() => handleDayClick(day)}
                      className={`
                        relative min-h-[100px] p-3 border-b border-r border-gray-200 dark:border-gray-700
                        transition-all duration-200
                        ${day ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : 'bg-gray-50 dark:bg-gray-900'}
                        ${selected ? 'bg-purple-50 dark:bg-purple-900/30 ring-2 ring-purple-500 ring-inset' : ''}
                      `}
                    >
                      {day && (
                        <div className="space-y-2">
                          {/* Day number with indicators */}
                          <div className="flex items-center justify-between">
                            <span
                              className={`
                                text-sm font-medium flex items-center justify-center
                                ${today 
                                  ? 'bg-purple-600 text-white w-8 h-8 rounded-full' 
                                  : selected
                                  ? 'text-purple-600 dark:text-purple-400 font-bold'
                                  : 'text-gray-700 dark:text-gray-300'
                                }
                              `}
                            >
                              {day}
                            </span>
                            {meetings && !today && (
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            )}
                          </div>

                          {/* Meeting count indicator */}
                          {dayMeetings.length > 0 && (
                            <div className="space-y-1">
                              {dayMeetings.slice(0, 2).map((meeting, i) => (
                                <div
                                  key={i}
                                  className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded truncate"
                                >
                                  {formatTime(meeting.scheduled_at)}
                                </div>
                              ))}
                              {dayMeetings.length > 2 && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 pl-2">
                                  +{dayMeetings.length - 2} more
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selected Day Details / Upcoming Meetings */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden sticky top-6">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {selectedDate ? formatDate(selectedDate) : 'Select a Date'}
                </h3>
                {selectedDate && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {selectedDayMeetings.length} meeting{selectedDayMeetings.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              <div className="max-h-[600px] overflow-y-auto">
                {selectedDate ? (
                  selectedDayMeetings.length > 0 ? (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {selectedDayMeetings.map((meeting) => {
                        const statusConfig = getStatusConfig(meeting.status);
                        const StatusIcon = statusConfig.icon;

                        return (
                          <div key={meeting.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                                  {meeting.title}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {formatTime(meeting.scheduled_at)} • {meeting.duration_minutes}min
                                </p>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full flex items-center space-x-1 ${statusConfig.color}`}>
                                <StatusIcon className="h-3 w-3" />
                                <span>{statusConfig.label}</span>
                              </span>
                            </div>

                            {meeting.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {meeting.description}
                              </p>
                            )}

                            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                              <Users className="h-3 w-3" />
                              <span>{meeting.participants.length} student{meeting.participants.length !== 1 ? 's' : ''}</span>
                            </div>

                            <div className="flex items-center space-x-2">
                              <a
                                href={meeting.meeting_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center space-x-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                              >
                                <Video className="h-3 w-3" />
                                <span>Join</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                              <button className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                <Edit className="h-4 w-4" />
                              </button>
                              <button className="p-1.5 text-red-500 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">No meetings on this day</p>
                    </div>
                  )
                ) : (
                  <div className="p-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Upcoming Meetings</h4>
                    <div className="space-y-3">
                      {upcomingMeetings.slice(0, 5).map((meeting) => (
                        <div key={meeting.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <p className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                            {meeting.title}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {new Date(meeting.scheduled_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Meeting Modal */}
      <CreateMeetingModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onMeetingCreated={(meeting: MeetingWithParticipants) => {
          setMeetings(prev => [...prev, meeting]);
          setShowCreateModal(false);
        }}
      />
    </div>
  );
} 

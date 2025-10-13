// src/pages/StudentSchedulePage.tsx - Z PEŁNYMI TŁUMACZENIAMI

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Video,
  User,
  AlertCircle,
  RefreshCw,
  X,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext'; // ← DODANE
import { 
  getStudentMeetings, 
  MeetingWithParticipants 
} from '../lib/meetingsAPI';

export function StudentSchedulePage() {
  const { session } = useAuth();
  const { t } = useLanguage(); // ← DODANE
  
  // State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [meetings, setMeetings] = useState<MeetingWithParticipants[]>([]);
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
          label: t.studentSchedulePage.statusScheduled, // ← ZMIENIONE
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
          icon: Calendar,
          dotColor: 'bg-blue-500'
        };
      case 'in_progress':
        return {
          label: t.studentSchedulePage.statusInProgress, // ← ZMIENIONE
          color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
          icon: Video,
          dotColor: 'bg-green-500'
        };
      case 'completed':
        return {
          label: t.studentSchedulePage.statusCompleted, // ← ZMIENIONE
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
          icon: CheckCircle,
          dotColor: 'bg-gray-500'
        };
      case 'cancelled':
        return {
          label: t.studentSchedulePage.statusCancelled, // ← ZMIENIONE
          color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
          icon: XCircle,
          dotColor: 'bg-red-500'
        };
      default:
        return {
          label: t.studentSchedulePage.statusUnknown, // ← ZMIENIONE
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

  // Days of week labels (translated)
  const daysOfWeek = [
    t.studentSchedulePage.sunday,     // ← ZMIENIONE
    t.studentSchedulePage.monday,     // ← ZMIENIONE
    t.studentSchedulePage.tuesday,    // ← ZMIENIONE
    t.studentSchedulePage.wednesday,  // ← ZMIENIONE
    t.studentSchedulePage.thursday,   // ← ZMIENIONE
    t.studentSchedulePage.friday,     // ← ZMIENIONE
    t.studentSchedulePage.saturday    // ← ZMIENIONE
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {t.studentSchedulePage.loading} {/* ← ZMIENIONE */}
          </p>
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
            {t.studentSchedulePage.title} {/* ← ZMIENIONE */}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t.studentSchedulePage.description} {/* ← ZMIENIONE */}
          </p>
        </div>

        <button
          onClick={loadMeetings}
          className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
        >
          <RefreshCw className="h-4 w-4" />
          <span>{t.studentSchedulePage.refresh}</span> {/* ← ZMIENIONE */}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="text-red-800 dark:text-red-200 font-medium">
                {t.studentSchedulePage.errorLoading} {/* ← ZMIENIONE */}
              </h3>
              <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                {t.studentSchedulePage.todaysMeetings} {/* ← ZMIENIONE */}
              </p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                {todaysMeetings.length}
              </p>
            </div>
            <div className="bg-blue-200 dark:bg-blue-900/40 p-4 rounded-xl">
              <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">
                {t.studentSchedulePage.upcomingMeetings} {/* ← ZMIENIONE */}
              </p>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                {upcomingMeetings.length}
              </p>
            </div>
            <div className="bg-purple-200 dark:bg-purple-900/40 p-4 rounded-xl">
              <Clock className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Calendar and Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={t.studentSchedulePage.previousMonth} // ← ZMIENIONE
              >
                <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-1.5 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
              >
                {t.studentSchedulePage.today} {/* ← ZMIENIONE */}
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={t.studentSchedulePage.nextMonth} // ← ZMIENIONE
              >
                <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {daysOfWeek.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              const dayMeetings = getMeetingsForDay(day);
              const hasMultipleMeetings = dayMeetings.length > 1;
              
              return (
                <button
                  key={index}
                  onClick={() => handleDayClick(day)}
                  disabled={!day}
                  className={`
                    relative aspect-square p-2 rounded-lg transition-all duration-200
                    ${!day ? 'invisible' : ''}
                    ${isToday(day) ? 'ring-2 ring-purple-500 dark:ring-purple-400' : ''}
                    ${isSelected(day) ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-900 dark:text-purple-100' : ''}
                    ${!isSelected(day) && day ? 'hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
                    ${!isToday(day) && !isSelected(day) ? 'text-gray-700 dark:text-gray-300' : ''}
                  `}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <span className="text-sm font-medium">{day}</span>
                    {hasMeetings(day) && (
                      <div className="flex items-center space-x-0.5 mt-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          isSelected(day) ? 'bg-purple-600' : 'bg-blue-500'
                        }`} />
                        {hasMultipleMeetings && (
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            isSelected(day) ? 'bg-purple-600' : 'bg-blue-500'
                          }`} />
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Details Panel */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          {selectedDate ? (
            <>
              {/* Selected Day Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {t.studentSchedulePage.selectedDay} {/* ← ZMIENIONE */}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(selectedDate)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {selectedDayMeetings.length}{' '}
                      {selectedDayMeetings.length === 1 
                        ? t.studentSchedulePage.meetingsOnDay      // ← ZMIENIONE
                        : t.studentSchedulePage.meetingsOnDayPlural // ← ZMIENIONE
                      }
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="p-1 hover:bg-white/50 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Meetings List */}
              <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
                {selectedDayMeetings.length > 0 ? (
                  selectedDayMeetings.map((meeting) => {
                    const statusConfig = getStatusConfig(meeting.status);
                    const StatusIcon = statusConfig.icon;
                    const isUpcoming = new Date(meeting.scheduled_at) > now;

                    return (
                      <div key={meeting.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className="space-y-3">
                          {/* Meeting header */}
                          <div>
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {meeting.title}
                              </h4>
                              <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                                <StatusIcon className="h-3 w-3" />
                                <span>{statusConfig.label}</span>
                              </span>
                            </div>
                            
                            {meeting.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {meeting.description}
                              </p>
                            )}
                          </div>

                          {/* Time info */}
                          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                            <Clock className="h-4 w-4" />
                            <span>
                              {formatTime(meeting.scheduled_at)} ({meeting.duration_minutes} {t.studentSchedulePage.duration}) {/* ← ZMIENIONE */}
                            </span>
                          </div>

                          {/* Participants */}
                          {meeting.participants && meeting.participants.length > 0 && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                              <User className="h-4 w-4" />
                              <span>
                                {meeting.participants.length}{' '}
                                {meeting.participants.length === 1 
                                  ? t.studentSchedulePage.participant   // ← ZMIENIONE
                                  : t.studentSchedulePage.participants  // ← ZMIENIONE
                                }
                              </span>
                            </div>
                          )}

                          {/* Action button */}
                          {isUpcoming && meeting.status === 'scheduled' && (
                            <button
                              onClick={() => window.open(meeting.meeting_url, '_blank')}
                              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium rounded-lg transition-all duration-200"
                            >
                              <Video className="h-4 w-4" />
                              <span>{t.studentSchedulePage.joinMeeting}</span> {/* ← ZMIENIONE */}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      {t.studentSchedulePage.noMeetingsOnDay} {/* ← ZMIENIONE */}
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Upcoming Meetings */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t.studentSchedulePage.upcomingMeetingsTitle} {/* ← ZMIENIONE */}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {upcomingMeetings.length} {t.studentSchedulePage.scheduled} {/* ← ZMIENIONE */}
                </p>
              </div>

              <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
                {upcomingMeetings.length > 0 ? (
                  upcomingMeetings.map((meeting) => {
                    const statusConfig = getStatusConfig(meeting.status);
                    const StatusIcon = statusConfig.icon;

                    return (
                      <div key={meeting.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {meeting.title}
                              </h4>
                              <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                                <StatusIcon className="h-3 w-3" />
                                <span>{statusConfig.label}</span>
                              </span>
                            </div>
                            
                            {meeting.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {meeting.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(meeting.scheduled_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}{' '}
                              {t.studentSchedulePage.at} {formatTime(meeting.scheduled_at)} {/* ← ZMIENIONE */}
                            </span>
                          </div>

                          {meeting.status === 'scheduled' && (
                            <button
                              onClick={() => window.open(meeting.meeting_url, '_blank')}
                              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium rounded-lg transition-all duration-200"
                            >
                              <Video className="h-4 w-4" />
                              <span>{t.studentSchedulePage.joinMeeting}</span> {/* ← ZMIENIONE */}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.studentSchedulePage.noUpcomingMeetings} {/* ← ZMIENIONE */}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t.studentSchedulePage.noUpcomingDescription} {/* ← ZMIENIONE */}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
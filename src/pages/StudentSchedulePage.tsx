// src/pages/StudentSchedulePage.tsx - KOMPLETNY KALENDARZ WZOROWANY NA TUTORSCHEDULEPAGE

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Calendar, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Video,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  XCircle,
  User
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getStudentMeetings, 
  MeetingWithParticipants 
} from '../lib/meetingsAPI';

export function StudentSchedulePage() {
  const { session } = useAuth();
  const { t } = useLanguage();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [meetings, setMeetings] = useState<MeetingWithParticipants[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ LOAD MEETINGS FROM DATABASE
  const loadMeetings = async () => {
    if (!session.user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('📅 Loading student meetings from database...');
      const data = await getStudentMeetings(session.user.id);
      setMeetings(data);
      console.log('✅ Loaded', data.length, 'meetings for student');
    } catch (err: any) {
      console.error('❌ Error loading student meetings:', err);
      setError(err.message || t.studentSchedulePage.errorLoading);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session.isAuthenticated && session.user?.id) {
      loadMeetings();
    }
  }, [session.isAuthenticated, session.user?.id]);

  // ===== CALENDAR HELPERS =====
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

  const getMeetingsForDay = (day: number | null) => {
    if (!day) return [];
    const dateStr = new Date(year, month, day).toDateString();
    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.scheduled_at).toDateString();
      return meetingDate === dateStr;
    });
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const isSelected = (day: number | null) => {
    if (!day || !selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === month &&
      selectedDate.getFullYear() === year
    );
  };

  const hasMeetings = (day: number | null) => {
    return getMeetingsForDay(day).length > 0;
  };

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

  const handleDayClick = (day: number | null) => {
    if (!day) return;
    const date = new Date(year, month, day);
    setSelectedDate(date);
  };

  const selectedDayMeetings = selectedDate ? getMeetingsForDay(selectedDate.getDate()) : [];

  // ===== FORMAT FUNCTIONS =====
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date: Date) => {
    const dayNames = [
      t.studentSchedulePage.sundayFull || 'Sunday',
      t.studentSchedulePage.mondayFull || 'Monday',
      t.studentSchedulePage.tuesdayFull || 'Tuesday',
      t.studentSchedulePage.wednesdayFull || 'Wednesday',
      t.studentSchedulePage.thursdayFull || 'Thursday',
      t.studentSchedulePage.fridayFull || 'Friday',
      t.studentSchedulePage.saturdayFull || 'Saturday',
    ];
    
    const monthNames = [
      t.studentSchedulePage.january || 'January',
      t.studentSchedulePage.february || 'February',
      t.studentSchedulePage.march || 'March',
      t.studentSchedulePage.april || 'April',
      t.studentSchedulePage.may || 'May',
      t.studentSchedulePage.june || 'June',
      t.studentSchedulePage.july || 'July',
      t.studentSchedulePage.august || 'August',
      t.studentSchedulePage.september || 'September',
      t.studentSchedulePage.october || 'October',
      t.studentSchedulePage.november || 'November',
      t.studentSchedulePage.december || 'December',
    ];
    
    const dayOfWeek = dayNames[date.getDay()];
    const monthName = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    return `${dayOfWeek}, ${day} ${monthName} ${year}`;
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'scheduled':
        return {
          label: t.studentSchedulePage.statusScheduled,
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
          icon: Calendar,
          dotColor: 'bg-blue-500'
        };
      case 'in_progress':
        return {
          label: t.studentSchedulePage.statusInProgress,
          color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
          icon: Video,
          dotColor: 'bg-green-500'
        };
      case 'completed':
        return {
          label: t.studentSchedulePage.statusCompleted,
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
          icon: CheckCircle,
          dotColor: 'bg-gray-500'
        };
      case 'cancelled':
        return {
          label: t.studentSchedulePage.statusCancelled,
          color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
          icon: XCircle,
          dotColor: 'bg-red-500'
        };
      default:
        return {
          label: t.studentSchedulePage.statusUnknown,
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
          icon: AlertCircle,
          dotColor: 'bg-gray-500'
        };
    }
  };

  // ===== STATS =====
  const now = new Date();
  const upcomingMeetings = meetings.filter(m => 
    new Date(m.scheduled_at) > now && m.status === 'scheduled'
  );
  
  const todaysMeetings = meetings.filter(m => {
    const meetingDate = new Date(m.scheduled_at).toDateString();
    return meetingDate === now.toDateString();
  });
  
  const thisWeekMeetings = meetings.filter(m => {
    const meetingDate = new Date(m.scheduled_at);
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return meetingDate >= now && meetingDate <= weekFromNow;
  });

  // Days of week
  const daysOfWeek = [
    t.studentSchedulePage.sunday,
    t.studentSchedulePage.monday,
    t.studentSchedulePage.tuesday,
    t.studentSchedulePage.wednesday,
    t.studentSchedulePage.thursday,
    t.studentSchedulePage.friday,
    t.studentSchedulePage.saturday,
  ];

  // ===== LOADING =====
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-400 dark:text-gray-400">
            {t.studentSchedulePage.loading}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t.studentSchedulePage.title}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t.studentSchedulePage.description}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div>
              <h3 className="text-red-800 dark:text-red-300 font-medium">
                {t.studentSchedulePage.errorLoading}
              </h3>
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
            <button
              onClick={loadMeetings}
              className="ml-auto px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
            >
              {t.studentSchedulePage.refresh}
            </button>
          </div>
        </div>
      )}

      {/* Quick Stats - GRADIENT DESIGN LIKE DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                {t.studentSchedulePage.todaysMeetings}
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
                {t.studentSchedulePage.upcomingMeetings}
              </p>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                {upcomingMeetings.length}
              </p>
            </div>
            <div className="bg-purple-200 dark:bg-purple-900/40 p-3 rounded-lg">
              <Clock className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Section - SAME AS TUTOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Calendar Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <span>
                    {currentDate.toLocaleDateString('en-US', { month: 'long' })} {currentDate.getFullYear()}
                  </span>
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={goToToday}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {t.studentSchedulePage.today}
                  </button>
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={() => navigateMonth('next')}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                  <span>{t.studentSchedulePage.today}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>{t.studentSchedulePage.hasMeetings || "Ma spotkanie"}</span>
                </div>
              </div>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              {daysOfWeek.map(day => (
                <div
                  key={day}
                  className="p-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-400"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid - SAME AS TUTOR */}
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
                      relative min-h-[70px] p-2 border-b border-r border-gray-200 dark:border-gray-700
                      transition-all duration-200
                      ${day ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : 'bg-gray-50 dark:bg-gray-900'}
                      ${selected ? 'bg-purple-50 dark:bg-purple-900/30 ring-2 ring-purple-500 ring-inset' : ''}
                    `}
                  >
                    {day && (
                      <div className="space-y-1">
                        {/* Day number */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`
                              text-xs font-medium flex items-center justify-center
                              ${today 
                                ? 'bg-purple-600 text-white w-6 h-6 rounded-full' 
                                : selected
                                ? 'text-purple-600 font-bold'
                                : 'text-gray-700 dark:text-gray-300'
                              }
                            `}
                          >
                            {day}
                          </span>
                        </div>

                        {/* Meeting indicators */}
                        {meetings && (
                          <div className="flex flex-wrap gap-1">
                            {dayMeetings.slice(0, 3).map((meeting, idx) => {
                              const config = getStatusConfig(meeting.status);
                              return (
                                <div
                                  key={idx}
                                  className={`w-2 h-2 rounded-full ${config.dotColor}`}
                                  title={`${meeting.title} at ${formatTime(meeting.scheduled_at)}`}
                                />
                              );
                            })}
                            {dayMeetings.length > 3 && (
                              <div className="w-2 h-2 rounded-full bg-gray-400 text-xs" title={`+${dayMeetings.length - 3} more`} />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Selected Day Details */}
            {selectedDate && (
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatDate(selectedDate)}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedDayMeetings.length} {
                      selectedDayMeetings.length === 1 
                        ? t.studentSchedulePage.meetingsOnDay 
                        : t.studentSchedulePage.meetingsOnDayPlural
                    }
                  </p>
                </div>

                {selectedDayMeetings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t.studentSchedulePage.noMeetingsOnDay}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDayMeetings.map(meeting => {
                      const config = getStatusConfig(meeting.status);
                      const StatusIcon = config.icon;
                      const isUpcoming = new Date(meeting.scheduled_at) > now;

                      return (
                        <div
                          key={meeting.id}
                          className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  {meeting.title}
                                </h4>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {config.label}
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                                <span className="flex items-center space-x-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{formatTime(meeting.scheduled_at)}</span>
                                </span>
                                <span>{meeting.duration_minutes} {t.studentSchedulePage.duration}</span>
                                <span className="flex items-center space-x-1">
                                  <User className="h-4 w-4" />
                                  <span>
                                    {meeting.participants.length} {
                                      meeting.participants.length === 1 
                                        ? t.studentSchedulePage.participant 
                                        : t.studentSchedulePage.participants
                                    }
                                  </span>
                                </span>
                              </div>

                              {meeting.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                  {meeting.description}
                                </p>
                              )}

                              {/* Join Meeting Button - ONLY for students */}
                              {isUpcoming && meeting.status === 'scheduled' && meeting.meeting_url && (
                                <a
                                  href={meeting.meeting_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                                >
                                  <Video className="h-4 w-4" />
                                  <span>{t.studentSchedulePage.joinMeeting}</span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Meetings Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t.studentSchedulePage.upcomingMeetingsTitle}
            </h3>

            {upcomingMeetings.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {t.studentSchedulePage.noUpcomingMeetings}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {t.studentSchedulePage.noUpcomingDescription}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {upcomingMeetings.map(meeting => {
                  const config = getStatusConfig(meeting.status);
                  const StatusIcon = config.icon;
                  const meetingDate = new Date(meeting.scheduled_at);

                  return (
                    <div
                      key={meeting.id}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                              {meeting.title}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {meetingDate.toLocaleDateString()} {t.studentSchedulePage.at} {formatTime(meeting.scheduled_at)}
                            </p>
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color} ml-2`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {config.label}
                          </span>
                        </div>
                        
                        {meeting.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                            {meeting.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {meeting.duration_minutes} min • {meeting.participants.length} {
                              meeting.participants.length === 1 
                                ? t.studentSchedulePage.participant 
                                : t.studentSchedulePage.participants
                            }
                          </span>
                          {meeting.meeting_url && (
                            <a
                              href={meeting.meeting_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 flex items-center space-x-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span>{t.studentSchedulePage.joinMeeting}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
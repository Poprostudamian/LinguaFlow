// src/pages/TutorSchedulePage.tsx - TRANSLATED VERSION
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
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
import { useAuth } from '../contexts/AuthContext';
import { CreateMeetingModal } from '../components/CreateMeetingModal';
import { 
  getTutorMeetings, 
  deleteMeeting, 
  MeetingWithParticipants 
} from '../lib/meetingsAPI';

export function TutorSchedulePage() {
  const { session } = useAuth();
  const { t } = useLanguage(); // ✅ Hook do tłumaczeń
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [meetings, setMeetings] = useState<MeetingWithParticipants[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ LOAD MEETINGS FROM DATABASE
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
      setError(err.message || t.tutorSchedulePage.errorLoading);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ LOAD MEETINGS ON MOUNT
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

  const handleDayClick = (day: number | null) => {
    if (!day) return;
    const date = new Date(year, month, day);
    setSelectedDate(date);
  };

  const selectedDayMeetings = selectedDate ? getMeetingsForDay(selectedDate.getDate()) : [];

  // ===== FORMAT FUNCTIONS WITH TRANSLATIONS =====
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // ✅ Format date using translations
  const formatDate = (date: Date) => {
    const dayNames = [
      t.tutorSchedulePage.sundayFull,
      t.tutorSchedulePage.mondayFull,
      t.tutorSchedulePage.tuesdayFull,
      t.tutorSchedulePage.wednesdayFull,
      t.tutorSchedulePage.thursdayFull,
      t.tutorSchedulePage.fridayFull,
      t.tutorSchedulePage.saturdayFull,
    ];
    
    const monthNames = [
      t.tutorSchedulePage.january,
      t.tutorSchedulePage.february,
      t.tutorSchedulePage.march,
      t.tutorSchedulePage.april,
      t.tutorSchedulePage.may,
      t.tutorSchedulePage.june,
      t.tutorSchedulePage.july,
      t.tutorSchedulePage.august,
      t.tutorSchedulePage.september,
      t.tutorSchedulePage.october,
      t.tutorSchedulePage.november,
      t.tutorSchedulePage.december,
    ];
    
    const dayOfWeek = dayNames[date.getDay()];
    const monthName = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    // Format: "Monday, 14 October 2025" (EN) lub "Poniedziałek, 14 października 2025" (PL)
    return `${dayOfWeek}, ${day} ${monthName} ${year}`;
  };

  // ✅ Get status config with translations
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'scheduled':
        return {
          label: t.tutorSchedulePage.statusScheduled,
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
          icon: Calendar,
          dotColor: 'bg-blue-500'
        };
      case 'in_progress':
        return {
          label: t.tutorSchedulePage.statusInProgress,
          color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
          icon: Video,
          dotColor: 'bg-green-500'
        };
      case 'completed':
        return {
          label: t.tutorSchedulePage.statusCompleted,
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
          icon: CheckCircle,
          dotColor: 'bg-gray-500'
        };
      case 'cancelled':
        return {
          label: t.tutorSchedulePage.statusCancelled,
          color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
          icon: XCircle,
          dotColor: 'bg-red-500'
        };
      default:
        return {
          label: t.tutorSchedulePage.statusUnknown,
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
          icon: AlertCircle,
          dotColor: 'bg-gray-500'
        };
    }
  };

  // ===== STATS CALCULATIONS =====
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

  // ===== MEETING HANDLERS =====
  const handleMeetingCreated = (newMeeting: MeetingWithParticipants) => {
    setMeetings(prev => [...prev, newMeeting]);
    console.log('✅ Meeting added to list:', newMeeting.id);
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    // ✅ Use translation for confirm dialog
    if (!window.confirm(t.tutorSchedulePage.confirmDelete)) {
      return;
    }

    try {
      console.log('🗑️ Deleting meeting:', meetingId);
      await deleteMeeting(meetingId);
      setMeetings(prev => prev.filter(m => m.id !== meetingId));
      console.log('✅ Meeting deleted successfully');
    } catch (err: any) {
      console.error('❌ Error deleting meeting:', err);
      alert(err.message || t.tutorSchedulePage.errorDeleting);
    }
  };

  // ===== LOADING STATE =====
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t.tutorSchedulePage.loading}</p>
        </div>
      </div>
    );
  }

  // ===== MAIN RENDER =====
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t.tutorSchedulePage.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t.tutorSchedulePage.description}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadMeetings}
            className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
            <span>{t.tutorSchedulePage.refresh}</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-sm"
          >
            <Plus className="h-5 w-5" />
            <span>{t.tutorSchedulePage.createMeeting}</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start space-x-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              {error}
            </p>
            <button
              onClick={loadMeetings}
              className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline"
            >
              {t.tutorSchedulePage.refresh}
            </button>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today's Meetings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t.tutorSchedulePage.todaysMeetings}
            </h3>
            <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {todaysMeetings.length}
          </p>
        </div>

        {/* This Week */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t.tutorSchedulePage.thisWeekMeetings}
            </h3>
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {thisWeekMeetings.length}
          </p>
        </div>

        {/* Next 7 Days */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t.tutorSchedulePage.next7Days}
            </h3>
            <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {upcomingMeetings.length}
          </p>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label={t.tutorSchedulePage.previousMonth}
              >
                <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-1.5 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
              >
                {t.tutorSchedulePage.today}
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label={t.tutorSchedulePage.nextMonth}
              >
                <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day Headers */}
            {[
              t.tutorSchedulePage.sunday,
              t.tutorSchedulePage.monday,
              t.tutorSchedulePage.tuesday,
              t.tutorSchedulePage.wednesday,
              t.tutorSchedulePage.thursday,
              t.tutorSchedulePage.friday,
              t.tutorSchedulePage.saturday,
            ].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-gray-600 dark:text-gray-400 pb-2"
              >
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {calendarDays.map((day, index) => {
              const dayMeetings = getMeetingsForDay(day);
              const hasScheduled = hasMeetings(day);
              const isTodayCell = isToday(day);
              const isSelectedCell = isSelected(day);

              return (
                <button
                  key={index}
                  onClick={() => handleDayClick(day)}
                  disabled={!day}
                  className={`
                    aspect-square p-2 rounded-lg text-sm font-medium transition-all relative
                    ${!day ? 'invisible' : ''}
                    ${isTodayCell
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500'
                      : isSelectedCell
                      ? 'bg-purple-600 text-white'
                      : hasScheduled
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  {day}
                  {hasScheduled && (
                    <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-0.5">
                      {dayMeetings.slice(0, 3).map((_, i) => (
                        <span
                          key={i}
                          className={`w-1 h-1 rounded-full ${
                            isSelectedCell ? 'bg-white' : 'bg-purple-500'
                          }`}
                        />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {selectedDate ? formatDate(selectedDate) : t.tutorSchedulePage.selectedDay}
          </h3>

          {selectedDayMeetings.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedDayMeetings.length}{' '}
                {selectedDayMeetings.length === 1
                  ? t.tutorSchedulePage.meetingsOnDay
                  : t.tutorSchedulePage.meetingsOnDayPlural}
              </p>

              {selectedDayMeetings.map((meeting) => {
                const statusConfig = getStatusConfig(meeting.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <div
                    key={meeting.id}
                    className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <StatusIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatTime(meeting.scheduled_at)}
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>

                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      {meeting.title}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        {meeting.duration_minutes} {t.tutorSchedulePage.duration}
                      </span>
                      <span>
                        {meeting.participants.length}{' '}
                        {meeting.participants.length === 1
                          ? t.tutorSchedulePage.participant
                          : t.tutorSchedulePage.participants}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t.tutorSchedulePage.noMeetingsOnDay}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Meetings List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          {t.tutorSchedulePage.upcomingMeetingsTitle}
        </h2>

        {upcomingMeetings.length > 0 ? (
          <div className="space-y-4">
            {upcomingMeetings.map((meeting) => {
              const statusConfig = getStatusConfig(meeting.status);
              const StatusIcon = statusConfig.icon;
              const meetingDate = new Date(meeting.scheduled_at);

              return (
                <div
                  key={meeting.id}
                  className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
                >
                  {/* Status Icon */}
                  <div className={`p-2 rounded-lg ${statusConfig.color}`}>
                    <StatusIcon className="h-5 w-5" />
                  </div>

                  {/* Meeting Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {meeting.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(meetingDate)} {t.tutorSchedulePage.at} {formatTime(meeting.scheduled_at)}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>

                    {meeting.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {meeting.description}
                      </p>
                    )}

                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{meeting.duration_minutes} {t.tutorSchedulePage.duration}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>
                          {meeting.participants.length}{' '}
                          {meeting.participants.length === 1
                            ? t.tutorSchedulePage.participant
                            : t.tutorSchedulePage.participants}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    {meeting.meeting_link && (
                      <a
                        href={meeting.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                        title={t.tutorSchedulePage.joinMeeting}
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>{t.tutorSchedulePage.joinMeeting}</span>
                      </a>
                    )}
                    
                    <button
                      onClick={() => handleDeleteMeeting(meeting.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title={t.tutorSchedulePage.delete}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
              {t.tutorSchedulePage.noUpcomingMeetings}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {t.tutorSchedulePage.noUpcomingDescription}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>{t.tutorSchedulePage.createMeeting}</span>
            </button>
          </div>
        )}
      </div>

      {/* Create Meeting Modal */}
      {showCreateModal && (
        <CreateMeetingModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onMeetingCreated={handleMeetingCreated}
        />
      )}
    </div>
  );
}
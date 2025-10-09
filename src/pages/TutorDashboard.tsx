// src/pages/TutorDashboard.tsx - WITH CALENDAR INSTEAD OF CREATE LESSON FORM

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  Clock, 
  TrendingUp,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  X,
  Award,
  Activity,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Video,
  User
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useRealTutorData } from '../lib/studentStats';
import { getTutorMeetings, MeetingWithParticipants } from '../lib/meetingsAPI';

// ============================================================================
// TOAST NOTIFICATION COMPONENT
// ============================================================================
interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

function Toast({ message, type, onClose }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
  };

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-600" />,
    error: <AlertCircle className="h-5 w-5 text-red-600" />
  };

  return (
    <div className="fixed top-6 right-6 z-50 animate-slide-in-right max-w-md">
      <div className={`${colors[type]} border rounded-lg p-4 shadow-lg flex items-start space-x-3`}>
        {icons[type]}
        <div className="flex-1">
          <p className="font-medium">{message}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// KPI CARD COMPONENT
// ============================================================================
interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: 'purple' | 'blue' | 'green' | 'orange';
}

function KPICard({ title, value, icon: Icon, color }: KPICardProps) {
  const colors = {
    purple: 'from-purple-600 to-purple-700',
    blue: 'from-blue-600 to-blue-700',
    green: 'from-green-600 to-green-700',
    orange: 'from-orange-600 to-orange-700'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`bg-gradient-to-r ${colors[color]} p-3 rounded-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

// ============================================================================
// STUDENT CARD COMPONENT
// ============================================================================
interface StudentCardProps {
  student: {
    id: string;
    name: string;
    level: string;
    status: string;
    progress: number;
    lessonsCompleted: number;
    totalHours: number;
  };
}

function StudentCard({ student }: StudentCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200">
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
          {student.name.charAt(0)}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">{student.name}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{student.level}</p>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          student.status === 'active' 
            ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
        }`}>
          {student.status}
        </span>
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-300"
          style={{ width: `${student.progress}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-4 w-4 text-blue-500" />
          <span className="text-gray-600 dark:text-gray-400">{student.lessonsCompleted} lessons</span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-green-500" />
          <span className="text-gray-600 dark:text-gray-400">{student.totalHours}h</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN TUTOR DASHBOARD COMPONENT
// ============================================================================
export function TutorDashboard() {
  const { session } = useAuth();
  const { students, kpis, isLoading: studentsLoading, error: studentsError, refreshData } = useRealTutorData(session.user?.id);

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [meetings, setMeetings] = useState<MeetingWithParticipants[]>([]);
  const [meetingsLoading, setMeetingsLoading] = useState(true);
  const [meetingsError, setMeetingsError] = useState<string | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load meetings
  useEffect(() => {
    if (session?.user?.id) {
      loadMeetings();
    }
  }, [session?.user?.id]);

  const loadMeetings = async () => {
    if (!session?.user?.id) return;

    setMeetingsLoading(true);
    setMeetingsError(null);

    try {
      const data = await getTutorMeetings(session.user.id);
      setMeetings(data);
    } catch (err: any) {
      setMeetingsError(err.message || 'Failed to load meetings');
    } finally {
      setMeetingsLoading(false);
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
          label: 'Scheduled',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
          dotColor: 'bg-blue-500'
        };
      case 'in_progress':
        return {
          label: 'In Progress',
          color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
          dotColor: 'bg-green-500'
        };
      case 'completed':
        return {
          label: 'Completed',
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
          dotColor: 'bg-gray-500'
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
          dotColor: 'bg-red-500'
        };
      default:
        return {
          label: 'Unknown',
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
          dotColor: 'bg-gray-500'
        };
    }
  };

  // Loading state
  if (studentsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading dashboard...</span>
      </div>
    );
  }

  // Error state
  if (studentsError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <div>
            <h3 className="text-red-800 dark:text-red-200 font-medium">Database Error</h3>
            <p className="text-red-600 dark:text-red-300 text-sm">{studentsError}</p>
          </div>
        </div>
        <button
          onClick={refreshData}
          className="mt-3 px-3 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-md hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* CSS Animations */}
      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Tutor Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 flex items-center space-x-2">
            <Activity className="h-4 w-4 text-green-500" />
            <span>Live from your database</span>
          </p>
        </div>
        <button
          onClick={() => {
            refreshData();
            loadMeetings();
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard
          title="Total Students"
          value={kpis.totalStudents}
          icon={Users}
          color="purple"
        />
        <KPICard
          title="Active Students"
          value={kpis.activeStudents}
          icon={TrendingUp}
          color="blue"
        />
        <KPICard
          title="Teaching Hours"
          value={`${kpis.teachingHours}h`}
          icon={Clock}
          color="green"
        />
        <KPICard
          title="Completion Rate"
          value={`${kpis.completionRate}%`}
          icon={Award}
          color="orange"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Students Section */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                <Users className="h-5 w-5 text-purple-600" />
                <span>My Students ({students.length})</span>
              </h2>
            </div>

            {students.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No students yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {students.map(student => (
                  <StudentCard key={student.id} student={student} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Calendar Section */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Calendar Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                  <CalendarIcon className="h-5 w-5 text-purple-600" />
                  <span>{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={goToToday}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Today
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
                  <span>Today</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>Has meetings</span>
                </div>
              </div>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div
                  key={day}
                  className="p-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-400"
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
                                ? 'text-purple-600 dark:text-purple-400'
                                : 'text-gray-900 dark:text-gray-100'
                              }
                            `}
                          >
                            {day}
                          </span>
                          {meetings && (
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          )}
                        </div>

                        {/* Meeting dots */}
                        {dayMeetings.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {dayMeetings.slice(0, 2).map((meeting, i) => {
                              const config = getStatusConfig(meeting.status);
                              return (
                                <div
                                  key={i}
                                  className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`}
                                  title={meeting.title}
                                />
                              );
                            })}
                            {dayMeetings.length > 2 && (
                              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                +{dayMeetings.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Selected Date Meetings */}
            {selectedDate && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 max-h-[300px] overflow-y-auto">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  {formatDate(selectedDate)}
                </h3>

                {selectedDayMeetings.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No meetings scheduled
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedDayMeetings.map(meeting => {
                      const config = getStatusConfig(meeting.status);
                      return (
                        <div
                          key={meeting.id}
                          className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                                {meeting.title}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {formatTime(meeting.scheduled_at)} • {meeting.duration_minutes} min
                              </p>
                            </div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${config.color}`}>
                              {config.label}
                            </span>
                          </div>

                          {meeting.participants.length > 0 && (
                            <div className="flex items-center space-x-1 mt-2">
                              <User className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {meeting.participants.length} student{meeting.participants.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          )}

                          {meeting.meeting_url && (
                            <a
                              href={meeting.meeting_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center space-x-1 text-xs text-purple-600 dark:text-purple-400 hover:underline"
                            >
                              <Video className="h-3 w-3" />
                              <span>Join Meeting</span>
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
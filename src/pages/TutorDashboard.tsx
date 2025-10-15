// src/pages/TutorDashboard.tsx - PEŁNY Z KALENDARZEM I TŁUMACZENIAMI

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  Clock, 
  PlusCircle,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  User,
  Video
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { KPICard } from '../components/KPICard';
import { StudentCard } from '../components/StudentCard';
import { useRealTutorData } from '../lib/studentStats';
import { createLessonWithAssignments, CreateLessonInput } from '../lib/lessonManagement';
import { getTutorMeetings, MeetingWithParticipants } from '../lib/meetingsAPI';
import { PendingGradingsWidget, PendingGradingsCompact } from '../components/PendingGradingsWidget';

export function TutorDashboard() {
  const { session } = useAuth();
  const { t } = useLanguage();
  const { students, kpis, isLoading, error, refreshData } = useRealTutorData(session.user?.id);

  const [newLesson, setNewLesson] = useState({
    title: '',
    description: '',
    content: '',
    assignedStudentIds: [] as string[]
  });

  const [isCreatingLesson, setIsCreatingLesson] = useState(false);
  const [lessonError, setLessonError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [meetings, setMeetings] = useState<MeetingWithParticipants[]>([]);

  const getMonthName = (date: Date): string => {
    const monthIndex = date.getMonth(); // 0-11
    const monthNames = [
      t.months.january,
      t.months.february,
      t.months.march,
      t.months.april,
      t.months.may,
      t.months.june,
      t.months.july,
      t.months.august,
      t.months.september,
      t.months.october,
      t.months.november,
      t.months.december,
    ];
    return monthNames[monthIndex];
  };

  // Load meetings
  useEffect(() => {
    if (session?.user?.id) {
      loadMeetings();
    }
  }, [session?.user?.id]);

  const loadMeetings = async () => {
    if (!session?.user?.id) return;
    try {
      const data = await getTutorMeetings(session.user.id);
      setMeetings(data);
    } catch (err) {
      console.error('Error loading meetings:', err);
    }
  };

  const handleStudentToggle = (studentId: string) => {
    setNewLesson(prev => ({
      ...prev,
      assignedStudentIds: prev.assignedStudentIds.includes(studentId)
        ? prev.assignedStudentIds.filter(id => id !== studentId)
        : [...prev.assignedStudentIds, studentId]
    }));
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session.user?.id) return;

    setIsCreatingLesson(true);
    setLessonError(null);

    try {
      const lessonData: CreateLessonInput = {
        title: newLesson.title.trim(),
        description: newLesson.description.trim(),
        content: newLesson.content.trim(),
        assignedStudentIds: newLesson.assignedStudentIds,
        status: 'published'
      };

      await createLessonWithAssignments(session.user.id, lessonData);

      setNewLesson({
        title: '',
        description: '',
        content: '',
        assignedStudentIds: []
      });

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      await refreshData();

    } catch (error: any) {
      console.error('Error creating lesson:', error);
      setLessonError(error.message || 'Failed to create lesson');
    } finally {
      setIsCreatingLesson(false);
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

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }
  // Fill to complete 6 rows
  const remainingCells = 42 - calendarDays.length;
  for (let i = 0; i < remainingCells; i++) {
    calendarDays.push(null);
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

// format: "Poniedziałek, 14 października 2025"
const formatDate = (date: Date) => {
  const dayNames = [
    'Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'
  ]; 
  
  // Nazwy miesięcy w dopełniaczu (dla "14 października")
  const monthNamesGenitive = [
    'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
    'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'
  ];
  
  const dayOfWeek = dayNames[date.getDay()];
  const monthName = monthNamesGenitive[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  
  // Format polski: "Poniedziałek, 14 października 2025"
  return `${dayOfWeek}, ${day} ${monthName} ${year}`;
};

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'scheduled':
        return {
          label: t.studentSchedulePage?.statusScheduled || 'Scheduled',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
          dotColor: 'bg-blue-500'
        };
      case 'in_progress':
        return {
          label: t.studentSchedulePage?.statusInProgress || 'In Progress',
          color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
          dotColor: 'bg-green-500'
        };
      case 'completed':
        return {
          label: t.studentSchedulePage?.statusCompleted || 'Completed',
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
          dotColor: 'bg-gray-500'
        };
      case 'cancelled':
        return {
          label: t.studentSchedulePage?.statusCancelled || 'Cancelled',
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

  // Days of week labels
  const daysOfWeek = [
    t.tutorDashboard.sunday,
    t.tutorDashboard.monday,
    t.tutorDashboard.tuesday,
    t.tutorDashboard.wednesday,
    t.tutorDashboard.thursday,
    t.tutorDashboard.friday,
    t.tutorDashboard.saturday
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t.tutorDashboard.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t.tutorDashboard.loading}
          </p>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            {t.tutorDashboard.loadingStats}
          </span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t.tutorDashboard.title}
          </h1>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="text-red-800 dark:text-red-200 font-medium">
                {t.tutorDashboard.databaseError}
              </h3>
              <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
            </div>
          </div>
          <button
            onClick={refreshData}
            className="mt-3 px-3 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-md hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
          >
            {t.tutorDashboard.tryAgain}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t.tutorDashboard.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t.tutorDashboard.subtitle}
          </p>
        </div>
        <button
          onClick={refreshData}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>{t.tutorDashboard.refresh}</span>
        </button>
      </div>

      <PendingGradingsCompact />
      
      {/* Success notification */}
      {showSuccess && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800 dark:text-green-200 font-medium">
              {t.tutorDashboard.lessonCreatedSuccess}
            </span>
          </div>
        </div>
      )}
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard
          title={t.tutorDashboard.totalStudents}
          value={kpis.totalStudents}
          icon={Users}
          color="purple"
        />
        <KPICard
          title={t.tutorDashboard.activeStudents}
          value={kpis.activeStudents}
          icon={TrendingUp}
          color="blue"
        />
        <KPICard
          title={t.tutorDashboard.teachingHours}
          value={`${kpis.teachingHours}h`}
          icon={Clock}
          color="green"
        />
        <KPICard
          title={t.tutorDashboard.completionRate}
          value={`${kpis.completionRate}%`}
          icon={CheckCircle}
          color="orange"
        />
      </div>

      {/* Main Content Grid - Students & Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Student Roster */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {t.tutorDashboard.myStudents} ({students.length})
          </h2>
          
          {students.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">
                {t.tutorDashboard.noStudentsFound}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                {t.tutorDashboard.addStudentsHint}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {students.slice(0, 6).map((student) => (
                <div key={student.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{student.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{student.level}</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {student.progress}%
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span>{t.tutorDashboard.progress}</span>
                      <span>{student.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${student.progress}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{student.lessonsCompleted}/{student.totalLessons} {t.tutorDashboard.lessons}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{student.totalHours}{t.tutorDashboard.hours}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {students.length > 6 && (
                <div className="text-center pt-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {t.tutorDashboard.andMoreStudents.replace('{count}', String(students.length - 6))}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Calendar Section */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Calendar Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                  <CalendarIcon className="h-5 w-5 text-purple-600" />
                  <span>{getMonthName(currentDate)} {currentDate.getFullYear()}</span>
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={goToToday}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {t.tutorDashboard.today}
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
                  <span>{t.tutorDashboard.today}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>{t.tutorDashboard.hasMeetings}</span>
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
                    {t.tutorDashboard.noMeetingsScheduled}
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
                                {formatTime(meeting.scheduled_at)} • {meeting.duration_minutes} {t.tutorDashboard.minutes}
                              </p>
                            </div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${config.color}`}>
                              {config.label}
                            </span>
                          </div>

                          {meeting.participants && meeting.participants.length > 0 && (
                            <div className="flex items-center space-x-1 mt-2">
                              <User className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {meeting.participants.length} {meeting.participants.length !== 1 ? t.tutorDashboard.students : t.tutorDashboard.student}
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
                              <span>{t.tutorDashboard.joinMeeting}</span>
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
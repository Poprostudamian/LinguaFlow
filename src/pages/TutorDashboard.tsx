// 📁 Updated File: /src/pages/TutorDashboard.tsx
// ✅ UPDATED: Shows real progress percentages for each student

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
  Video,
  Award,
  Target,
  BarChart3
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
      t.months?.january || 'January',
      t.months?.february || 'February',
      t.months?.march || 'March',
      t.months?.april || 'April',
      t.months?.may || 'May',
      t.months?.june || 'June',
      t.months?.july || 'July',
      t.months?.august || 'August',
      t.months?.september || 'September',
      t.months?.october || 'October',
      t.months?.november || 'November',
      t.months?.december || 'December',
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
    
    if (!newLesson.title.trim() || !newLesson.content.trim()) {
      setLessonError('Title and content are required');
      return;
    }

    if (!session?.user?.id) {
      setLessonError('User session not found');
      return;
    }

    try {
      setIsCreatingLesson(true);
      setLessonError(null);

      const lessonData: CreateLessonInput = {
        title: newLesson.title.trim(),
        description: newLesson.description.trim() || null,
        content: newLesson.content.trim(),
        tutorId: session.user.id,
        assignedStudentIds: newLesson.assignedStudentIds,
        status: 'published'
      };

      await createLessonWithAssignments(lessonData);

      // Reset form
      setNewLesson({
        title: '',
        description: '',
        content: '',
        assignedStudentIds: []
      });

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);

      // Refresh data to show updated lesson counts
      refreshData();

    } catch (err: any) {
      console.error('Error creating lesson:', err);
      setLessonError(err.message || 'Failed to create lesson');
    } finally {
      setIsCreatingLesson(false);
    }
  };

  // Get today's meetings
  const todayMeetings = meetings.filter(meeting => {
    const meetingDate = new Date(meeting.start_time);
    const today = new Date();
    return meetingDate.toDateString() === today.toDateString();
  });

  // Get upcoming meetings (next 7 days)
  const upcomingMeetings = meetings.filter(meeting => {
    const meetingDate = new Date(meeting.start_time);
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return meetingDate >= today && meetingDate <= nextWeek;
  }).slice(0, 5);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'scheduled':
        return {
          label: 'Scheduled',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
          dotColor: 'bg-blue-500'
        };
      case 'completed':
        return {
          label: 'Completed',
          color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
          dotColor: 'bg-green-500'
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
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t.tutorDashboard?.title || 'Tutor Dashboard'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Loading dashboard data...
          </p>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            Loading stats...
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
            {t.tutorDashboard?.title || 'Tutor Dashboard'}
          </h1>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="text-red-800 dark:text-red-200 font-medium">Error</h3>
              <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
            </div>
          </div>
          <button
            onClick={refreshData}
            className="mt-3 px-3 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-md hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
          >
            Retry
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
            {t.tutorDashboard?.title || 'Tutor Dashboard'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t.tutorDashboard?.welcome || 'Welcome back'}, {session?.user?.first_name}! 👨‍🏫
          </p>
        </div>
        
        <button
          onClick={refreshData}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="Refresh data"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {/* Pending Gradings Alert */}
      <PendingGradingsCompact />
      
      {/* Success notification */}
      {showSuccess && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800 dark:text-green-200 font-medium">
              Lesson created successfully!
            </span>
          </div>
        </div>
      )}
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard
          title={t.tutorDashboard?.totalStudents || 'Total Students'}
          value={kpis.totalStudents}
          icon={Users}
          color="purple"
        />
        <KPICard
          title={t.tutorDashboard?.activeStudents || 'Active Students'}
          value={kpis.activeStudents}
          icon={TrendingUp}
          color="blue"
        />
        <KPICard
          title={t.tutorDashboard?.teachingHours || 'Teaching Hours'}
          value={`${kpis.teachingHours}h`}
          icon={Clock}
          color="green"
        />
        <KPICard
          title="Completion Rate"
          value={`${kpis.completionRate}%`}
          icon={CheckCircle}
          color="orange"
        />
      </div>

      {/* Main Content Grid - Students & Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Student Roster - ✅ UPDATED: Shows real progress data */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {t.tutorDashboard?.myStudents || 'My Students'} ({students.length})
          </h2>
          
          {students.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {t.tutorDashboard?.noStudents || 'No students yet'}
              </p>
              <button
                onClick={() => window.location.href = '/tutor/students'}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Invite Students
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {students.slice(0, 6).map((student) => (
                <div
                  key={student.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg dark:hover:shadow-gray-900/20 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {/* Student Header */}
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {student.first_name?.[0]}{student.last_name?.[0]}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {student.first_name} {student.last_name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Level: {student.level}
                          </p>
                        </div>
                      </div>

                      {/* ✅ UPDATED: Real Progress Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {student.completionRate}%
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Completion
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {student.averageScore}%
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Avg Score
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {student.completedLessons}/{student.totalLessons}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Lessons
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {student.totalHours}h
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Study Time
                          </div>
                        </div>
                      </div>

                      {/* ✅ UPDATED: Progress Bars */}
                      <div className="space-y-2">
                        {/* Completion Progress */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600 dark:text-gray-400 flex items-center">
                              <Target className="h-3 w-3 mr-1" />
                              Completion Rate
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {student.completionRate}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${student.completionRate}%` }}
                            />
                          </div>
                        </div>

                        {/* Average Score Progress */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600 dark:text-gray-400 flex items-center">
                              <Award className="h-3 w-3 mr-1" />
                              Average Score
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {student.averageScore}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                student.averageScore >= 80 
                                  ? 'bg-gradient-to-r from-purple-500 to-blue-500'
                                  : student.averageScore >= 60
                                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                  : 'bg-gradient-to-r from-red-500 to-pink-500'
                              }`}
                              style={{ width: `${student.averageScore}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center space-x-2 mt-4">
                        <button
                          onClick={() => window.location.href = `/tutor/students/${student.id}`}
                          className="flex-1 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-sm font-medium"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => {/* Handle message */}}
                          className="px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm"
                        >
                          Message
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* View All Students Button */}
              {students.length > 6 && (
                <div className="text-center pt-4">
                  <button
                    onClick={() => window.location.href = '/tutor/students'}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    View All {students.length} Students
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar - Today's Meetings */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Today's Meetings
              </h3>
              <CalendarIcon className="h-5 w-5 text-gray-400" />
            </div>

            {todayMeetings.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No meetings scheduled for today
              </p>
            ) : (
              <div className="space-y-3">
                {todayMeetings.slice(0, 4).map((meeting) => {
                  const statusConfig = getStatusConfig(meeting.status);
                  
                  return (
                    <div
                      key={meeting.id}
                      className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {meeting.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(meeting.start_time).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                      <Video className="h-4 w-4 text-gray-400" />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick Actions */}
            <div className="mt-6 space-y-2">
              <button
                onClick={() => window.location.href = '/tutor/schedule'}
                className="w-full px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm font-medium"
              >
                Schedule New Meeting
              </button>
              <button
                onClick={() => window.location.href = '/tutor/lessons'}
                className="w-full px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-sm font-medium"
              >
                Create New Lesson
              </button>
            </div>
          </div>

          {/* Teaching Statistics */}
          {students.length > 0 && (
            <div className="mt-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Teaching Statistics
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-purple-100">Avg Completion Rate:</span>
                  <span className="font-medium">
                    {Math.round(
                      students.reduce((sum, s) => sum + s.completionRate, 0) / students.length
                    )}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-100">Avg Score:</span>
                  <span className="font-medium">
                    {Math.round(
                      students.reduce((sum, s) => sum + s.averageScore, 0) / students.length
                    )}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-100">Total Lessons:</span>
                  <span className="font-medium">
                    {students.reduce((sum, s) => sum + s.totalLessons, 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-100">Total Study Hours:</span>
                  <span className="font-medium">
                    {students.reduce((sum, s) => sum + s.totalHours, 0)}h
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
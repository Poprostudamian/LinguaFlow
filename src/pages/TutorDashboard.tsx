// 📁 Updated File: /src/pages/TutorDashboard.tsx
// ✅ FIXED: Uses existing structure with consistent metrics from getTutorDashboardDataV2

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
  Target
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { KPICard } from '../components/KPICard';
import { StudentCard } from '../components/StudentCard';
import { getTutorDashboardDataV2, getTutorStudentsWithMetrics } from '../lib/supabase'; // ✅ UPDATED: Use V2 functions
import { createLessonWithAssignments, CreateLessonInput } from '../lib/lessonManagement';
import { getTutorMeetings, MeetingWithParticipants } from '../lib/meetingsAPI';
import { PendingGradingsWidget, PendingGradingsCompact } from '../components/PendingGradingsWidget';

interface TutorKPIs {
  totalStudents: number;
  activeStudents: number;
  teachingHours: number;
  completionRate: number;
}

interface StudentWithMetrics {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  // Metrics from getStudentMetrics
  progress: number;
  averageScore: number;
  completionRate: number;
  totalHours: number;
  lessonsCompleted: number;
  totalLessons: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  lastActivity: string | null;
}

export function TutorDashboard() {
  const { session } = useAuth();
  const { t } = useLanguage();

  // State
  const [kpis, setKpis] = useState<TutorKPIs>({
    totalStudents: 0,
    activeStudents: 0,
    teachingHours: 0,
    completionRate: 0
  });
  const [students, setStudents] = useState<StudentWithMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // ✅ UPDATED: Load data using V2 functions
  useEffect(() => {
    if (session?.user?.id) {
      loadDashboardData();
      loadMeetings();
    }
  }, [session?.user?.id]);

  const loadDashboardData = async () => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // ✅ UPDATED: Use V2 functions with consistent metrics
      const [dashboardData, studentsWithMetrics] = await Promise.all([
        getTutorDashboardDataV2(session.user.id),
        getTutorStudentsWithMetrics(session.user.id)
      ]);

      setKpis(dashboardData.kpis);
      setStudents(studentsWithMetrics);

    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

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
      loadDashboardData();

    } catch (err: any) {
      console.error('Error creating lesson:', err);
      setLessonError(err.message || 'Failed to create lesson');
    } finally {
      setIsCreatingLesson(false);
    }
  };

  const refreshData = () => {
    loadDashboardData();
    loadMeetings();
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
          label: t.studentSchedulePage?.statusScheduled || 'Scheduled',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
          dotColor: 'bg-blue-500'
        };
      case 'completed':
        return {
          label: t.studentSchedulePage?.statusCompleted || 'Completed',
          color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
          dotColor: 'bg-green-500'
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
              <h3 className="text-red-800 dark:text-red-200 font-medium">{t.common.error}</h3>
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
            {t.tutorDashboard.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t.tutorDashboard.welcome}, {session?.user?.first_name}! 👨‍🏫
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
              {t.tutorDashboard.lessonCreatedSuccess}
            </span>
          </div>
        </div>
      )}
      
      {/* ✅ UPDATED: KPI Cards with consistent metrics */}
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
          title="Completion Rate"
          value={`${kpis.completionRate}%`}
          icon={CheckCircle}
          color="orange"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Students Section - ✅ UPDATED: Shows consistent metrics */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t.tutorDashboard.myStudents} ({students.length})
              </h2>
              <button
                onClick={() => window.location.href = '/tutor/students'}
                className="text-purple-600 dark:text-purple-400 hover:underline text-sm font-medium"
              >
                View All
              </button>
            </div>
            
            {students.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {t.tutorDashboard.noStudents}
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
                {students.slice(0, 5).map((student) => (
                  <div
                    key={student.student_id}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {student.first_name} {student.last_name}
                          </h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            student.level === 'Advanced' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : student.level === 'Intermediate'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                          }`}>
                            {student.level}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                          {student.email}
                        </p>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Progress:</span>
                            <span className="ml-2 font-medium text-gray-900 dark:text-white">
                              {student.progress}%
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Score:</span>
                            <span className="ml-2 font-medium text-gray-900 dark:text-white">
                              {student.averageScore}%
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Lessons:</span>
                            <span className="ml-2 font-medium text-gray-900 dark:text-white">
                              {student.lessonsCompleted}/{student.totalLessons}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Hours:</span>
                            <span className="ml-2 font-medium text-gray-900 dark:text-white">
                              {student.totalHours}h
                            </span>
                          </div>
                        </div>

                        {/* Progress bar for completion rate */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-500 dark:text-gray-400">Completion Rate</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {student.completionRate}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div
                              className="bg-purple-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${student.completionRate}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          
          {/* Quick Stats Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Teaching Overview
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Total Students</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {kpis.totalStudents}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Active Students</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {kpis.activeStudents}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Completion Rate</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {kpis.completionRate}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Teaching Hours</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {kpis.teachingHours}h
                </span>
              </div>
            </div>
          </div>

          {/* Today's Meetings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Today's Meetings
              </h3>
              <CalendarIcon className="h-5 w-5 text-gray-400" />
            </div>

            {todayMeetings.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t.tutorDashboard.noMeetings}
              </p>
            ) : (
              <div className="space-y-3">
                {todayMeetings.slice(0, 3).map((meeting) => {
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
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/tutor/lessons'}
                className="w-full flex items-center space-x-3 px-4 py-3 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
              >
                <BookOpen className="h-5 w-5" />
                <span className="font-medium">Create New Lesson</span>
              </button>
              
              <button
                onClick={() => window.location.href = '/tutor/students'}
                className="w-full flex items-center space-x-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                <Users className="h-5 w-5" />
                <span className="font-medium">Manage Students</span>
              </button>
              
              <button
                onClick={() => window.location.href = '/tutor/grading'}
                className="w-full flex items-center space-x-3 px-4 py-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
              >
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Grade Assignments</span>
              </button>
              
              <button
                onClick={() => window.location.href = '/tutor/schedule'}
                className="w-full flex items-center space-x-3 px-4 py-3 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
              >
                <CalendarIcon className="h-5 w-5" />
                <span className="font-medium">Schedule Meeting</span>
              </button>
            </div>
          </div>

          {/* Student Performance Insight */}
          {students.length > 0 && (
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
              <h3 className="font-semibold mb-4">Performance Insights</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-purple-100">Average Score:</span>
                  <span className="font-medium">
                    {Math.round(
                      students.reduce((sum, s) => sum + s.averageScore, 0) / 
                      students.length
                    )}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-100">Average Progress:</span>
                  <span className="font-medium">
                    {Math.round(
                      students.reduce((sum, s) => sum + s.progress, 0) / 
                      students.length
                    )}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-100">Completion Rate:</span>
                  <span className="font-medium">
                    {Math.round(
                      students.reduce((sum, s) => sum + s.completionRate, 0) / 
                      students.length
                    )}%
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
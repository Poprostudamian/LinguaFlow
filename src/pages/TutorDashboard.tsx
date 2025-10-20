// 📁 Updated File: /src/pages/TutorDashboard.tsx  
// ✅ FIXED: Uses consistent metrics from getTutorDashboardDataV2

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  BookOpen,
  Calendar,
  MessageSquare,
  RefreshCw,
  AlertCircle,
  Plus,
  GraduationCap,
  Award
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getTutorDashboardDataV2, getTutorStudentsWithMetrics } from '../lib/supabase'; // ✅ UPDATED: Use V2 functions
import { KPICard } from '../components/KPICard';
import { ActionButton } from '../components/ActionButton';
import { PendingGradingsCompact } from '../components/PendingGradingsCompact';

interface TutorDashboardData {
  kpis: {
    totalStudents: number;
    activeStudents: number;
    teachingHours: number;
    completionRate: number;
  };
  students: any[];
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
  const navigate = useNavigate();
  const { session } = useAuth();
  const { t } = useLanguage();
  
  const [dashboardData, setDashboardData] = useState<TutorDashboardData | null>(null);
  const [studentsWithMetrics, setStudentsWithMetrics] = useState<StudentWithMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      loadDashboardData();
    }
  }, [session?.user?.id]);

  const loadDashboardData = async () => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // ✅ UPDATED: Use V2 functions with consistent metrics
      const [dashboardDataResult, studentsWithMetricsResult] = await Promise.all([
        getTutorDashboardDataV2(session.user.id),
        getTutorStudentsWithMetrics(session.user.id)
      ]);

      setDashboardData(dashboardDataResult);
      setStudentsWithMetrics(studentsWithMetricsResult);

    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600 dark:text-gray-300">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
          <div className="flex items-center space-x-2 mb-4">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h3 className="font-medium text-red-800 dark:text-red-200">Error</h3>
          </div>
          <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
          <ActionButton
            onClick={loadDashboardData}
            variant="primary"
            size="sm"
            icon={RefreshCw}
          >
            Retry
          </ActionButton>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { kpis } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t.tutorDashboard.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {t.tutorDashboard.welcome}! Monitor your students' progress and manage your lessons.
            </p>
          </div>
          
          <div className="mt-4 lg:mt-0 flex space-x-3">
            <ActionButton
              onClick={() => navigate('/lessons/create')}
              variant="primary"
              icon={Plus}
            >
              Create Lesson
            </ActionButton>
            <ActionButton
              onClick={() => navigate('/students')}
              variant="secondary"
              icon={Users}
            >
              Manage Students
            </ActionButton>
          </div>
        </div>

        {/* Pending Gradings Alert */}
        <PendingGradingsCompact />
        
        {/* Success notification */}
        {showSuccess && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-800 dark:text-green-200 font-medium">
                Dashboard data updated successfully
              </span>
            </div>
          </div>
        )}
        
        {/* ✅ UPDATED: KPI Cards with consistent metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <KPICard
            title={t.tutorDashboard.totalStudents}
            value={kpis.totalStudents}
            icon={Users}
            color="purple"
            description="Students under your guidance"
          />
          <KPICard
            title={t.tutorDashboard.activeStudents}
            value={kpis.activeStudents}
            icon={TrendingUp}
            color="blue"
            description="Students with active lessons"
          />
          <KPICard
            title={t.tutorDashboard.teachingHours}
            value={`${kpis.teachingHours}h`}
            icon={Clock}
            color="green"
            description="Total teaching time logged"
          />
          <KPICard
            title="Completion Rate"
            value={`${kpis.completionRate}%`}
            icon={CheckCircle}
            color="orange"
            description="Overall lesson completion rate"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Student Roster - ✅ UPDATED: Shows consistent metrics */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t.tutorDashboard.myStudents} ({studentsWithMetrics.length})
                </h2>
                <ActionButton
                  onClick={() => navigate('/students')}
                  variant="ghost"
                  size="sm"
                >
                  View All
                </ActionButton>
              </div>
              
              {studentsWithMetrics.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {t.tutorDashboard.noStudents}
                  </p>
                  <ActionButton
                    onClick={() => navigate('/students')}
                    variant="primary"
                    size="sm"
                    icon={Plus}
                  >
                    Invite Students
                  </ActionButton>
                </div>
              ) : (
                <div className="space-y-4">
                  {studentsWithMetrics.slice(0, 5).map((student) => (
                    <div
                      key={student.student_id}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      onClick={() => navigate(`/students/${student.student_id}`)}
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
                                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
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
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Teaching Overview
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="h-4 w-4 text-blue-600" />
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
                    <Award className="h-4 w-4 text-purple-600" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">Completion Rate</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {kpis.completionRate}%
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">Teaching Hours</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {kpis.teachingHours}h
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              
              <div className="space-y-3">
                <ActionButton
                  onClick={() => navigate('/lessons/create')}
                  variant="primary"
                  size="sm"
                  icon={BookOpen}
                  className="w-full justify-start"
                >
                  Create New Lesson
                </ActionButton>
                
                <ActionButton
                  onClick={() => navigate('/students')}
                  variant="secondary"
                  size="sm"
                  icon={Users}
                  className="w-full justify-start"
                >
                  Manage Students
                </ActionButton>
                
                <ActionButton
                  onClick={() => navigate('/grading')}
                  variant="secondary"
                  size="sm"
                  icon={CheckCircle}
                  className="w-full justify-start"
                >
                  Grade Assignments
                </ActionButton>
                
                <ActionButton
                  onClick={() => navigate('/meetings')}
                  variant="secondary"
                  size="sm"
                  icon={Calendar}
                  className="w-full justify-start"
                >
                  Schedule Meeting
                </ActionButton>
              </div>
            </div>

            {/* Student Performance Insight */}
            {studentsWithMetrics.length > 0 && (
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
                <h3 className="font-semibold mb-4">Performance Insights</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-100">Average Score:</span>
                    <span className="font-medium">
                      {Math.round(
                        studentsWithMetrics.reduce((sum, s) => sum + s.averageScore, 0) / 
                        studentsWithMetrics.length
                      )}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-100">Average Progress:</span>
                    <span className="font-medium">
                      {Math.round(
                        studentsWithMetrics.reduce((sum, s) => sum + s.progress, 0) / 
                        studentsWithMetrics.length
                      )}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-100">Completion Rate:</span>
                    <span className="font-medium">
                      {Math.round(
                        studentsWithMetrics.reduce((sum, s) => sum + s.completionRate, 0) / 
                        studentsWithMetrics.length
                      )}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
// src/pages/TutorAnalyticsPage.tsx
// 🎯 ANALYTICS & INSIGHTS DASHBOARD for Tutors
// ✅ ULTRA-SAFE MODE - Will never crash!

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import {
  TrendingUp,
  Users,
  BookOpen,
  Clock,
  Award,
  Activity,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Target,
  Zap,
  Brain,
  Star,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Download
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// ============================================================================
// TYPES
// ============================================================================

interface AnalyticsData {
  overview: {
    totalStudents: number;
    activeStudents: number;
    averageProgress: number;
    completionRate: number;
    totalLessonsAssigned: number;
    totalLessonsCompleted: number;
    averageScore: number;
    totalStudyHours: number;
  };
  progressOverTime: Array<{
    date: string;
    averageProgress: number;
    studentsActive: number;
  }>;
  performanceDistribution: Array<{
    range: string;
    count: number;
  }>;
  topPerformers: Array<{
    id: string;
    name: string;
    progress: number;
    score: number;
    lessonsCompleted: number;
  }>;
  recentActivity: Array<{
    id: string;
    studentName: string;
    action: string;
    lessonTitle: string;
    timestamp: string;
    score?: number;
  }>;
  weakAreas: Array<{
    lessonTitle: string;
    averageScore: number;
    completionRate: number;
    studentCount: number;
  }>;
  studentComparison: Array<{
    student: string;
    progress: number;
    lessons: number;
    hours: number;
    score: number;
  }>;
  trends: {
    progressTrend: 'up' | 'down' | 'stable';
    progressChange: number;
    activeTrend: 'up' | 'down' | 'stable';
    activeChange: number;
    completionTrend: 'up' | 'down' | 'stable';
    completionChange: number;
  };
}

type DateRange = '7d' | '30d' | '3m' | 'all';

// ============================================================================
// SAFE ANALYTICS LOADER - WITH COMPREHENSIVE ERROR HANDLING
// ============================================================================

const loadAnalyticsSafely = async (tutorId: string, days: number): Promise<AnalyticsData> => {
  console.log('🔍 [SAFE MODE] Starting analytics load...');
  console.log('   Tutor ID:', tutorId);
  console.log('   Days range:', days);

  try {
    // Dynamic import to avoid initial load errors
    const { getAllAnalytics } = await import('../lib/supabase-analytics');
    
    console.log('✅ [SAFE MODE] Successfully imported supabase-analytics');
    
    const data = await getAllAnalytics(tutorId, days);
    
    console.log('✅ [SAFE MODE] Data loaded successfully:', {
      hasOverview: !!data.overview,
      studentsCount: data.overview?.totalStudents || 0,
      progressPointsCount: data.progressOverTime?.length || 0,
      topPerformersCount: data.topPerformers?.length || 0
    });
    
    return data;
    
  } catch (error) {
    console.error('❌ [SAFE MODE] Error loading analytics:', error);
    console.error('   Error details:', {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack?.split('\n').slice(0, 3)
    });
    
    // Return safe default data
    return {
      overview: {
        totalStudents: 0,
        activeStudents: 0,
        averageProgress: 0,
        completionRate: 0,
        totalLessonsAssigned: 0,
        totalLessonsCompleted: 0,
        averageScore: 0,
        totalStudyHours: 0
      },
      progressOverTime: [],
      performanceDistribution: [],
      topPerformers: [],
      recentActivity: [],
      weakAreas: [],
      studentComparison: [],
      trends: {
        progressTrend: 'stable',
        progressChange: 0,
        activeTrend: 'stable',
        activeChange: 0,
        completionTrend: 'stable',
        completionChange: 0
      }
    };
  }
};

// ============================================================================
// COMPONENTS
// ============================================================================

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: 'purple' | 'blue' | 'green' | 'orange';
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
}

function MetricCard({ title, value, icon: Icon, color, trend, trendValue }: MetricCardProps) {
  const colorClasses = {
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        {trend && trendValue !== undefined && trendValue !== 0 && (
          <div className={`flex items-center space-x-1 text-sm font-medium ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {trend === 'up' ? <ArrowUp className="h-4 w-4" /> : trend === 'down' ? <ArrowDown className="h-4 w-4" /> : null}
            <span>{Math.abs(trendValue).toFixed(1)}%</span>
          </div>
        )}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 dark:bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-lg">
        <p className="text-gray-300 text-sm mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm font-medium">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TutorAnalyticsPage() {
  const { t } = useLanguage();
  const { session } = useAuth();
  
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});

  // Load analytics data - ULTRA-SAFE VERSION
  useEffect(() => {
    const loadAnalytics = async () => {
      console.log('🚀 [ANALYTICS] Starting load process...');
      console.log('   Session exists:', !!session);
      console.log('   User ID:', session?.user?.id);
      console.log('   User role:', session?.user?.role);
      console.log('   Date range:', dateRange);
      
      if (!session?.user?.id) {
        console.warn('⚠️ [ANALYTICS] No user ID, skipping load');
        setError('No user session found. Please log in.');
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      // Store debug info
      setDebugInfo({
        userId: session.user.id,
        userEmail: session.user.email,
        userRole: session.user.role,
        dateRange,
        timestamp: new Date().toISOString()
      });
      
      try {
        const daysMap = { '7d': 7, '30d': 30, '3m': 90, 'all': 365 };
        const days = daysMap[dateRange];
        
        console.log('📊 [ANALYTICS] Calling loadAnalyticsSafely with days:', days);
        
        const data = await loadAnalyticsSafely(session.user.id, days);
        
        console.log('✅ [ANALYTICS] Data loaded successfully!');
        console.log('   Total Students:', data.overview.totalStudents);
        console.log('   Active Students:', data.overview.activeStudents);
        console.log('   Progress Data Points:', data.progressOverTime.length);
        
        setAnalytics(data);
        setError(null);
        
      } catch (err) {
        console.error('❌ [ANALYTICS] Critical error in loadAnalytics:', err);
        setError(`Failed to load analytics: ${(err as Error).message}`);
        
        // Still set empty analytics so UI doesn't crash
        setAnalytics({
          overview: {
            totalStudents: 0,
            activeStudents: 0,
            averageProgress: 0,
            completionRate: 0,
            totalLessonsAssigned: 0,
            totalLessonsCompleted: 0,
            averageScore: 0,
            totalStudyHours: 0
          },
          progressOverTime: [],
          performanceDistribution: [],
          topPerformers: [],
          recentActivity: [],
          weakAreas: [],
          studentComparison: [],
          trends: {
            progressTrend: 'stable',
            progressChange: 0,
            activeTrend: 'stable',
            activeChange: 0,
            completionTrend: 'stable',
            completionChange: 0
          }
        });
      } finally {
        setIsLoading(false);
        console.log('🏁 [ANALYTICS] Load process complete');
      }
    };

    loadAnalytics();
  }, [dateRange, session?.user?.id]);

  // Refresh handler
  const handleRefresh = () => {
    console.log('🔄 [ANALYTICS] Manual refresh triggered');
    setAnalytics(null);
    const currentRange = dateRange;
    setDateRange('7d');
    setTimeout(() => setDateRange(currentRange), 100);
  };

  // Chart colors
  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

  // LOADING STATE
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            User: {session?.user?.email || 'Unknown'}
          </p>
        </div>
      </div>
    );
  }

  // ERROR STATE WITH DEBUG INFO
  if (error && !analytics) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="text-red-800 dark:text-red-200 font-medium">Error Loading Analytics</h3>
              <p className="text-red-600 dark:text-red-300 text-sm mt-1">{error}</p>
            </div>
          </div>
          
          {/* Debug Info */}
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer text-red-700 dark:text-red-300 font-medium mb-2">
              🔍 Debug Information (click to expand)
            </summary>
            <div className="bg-red-100 dark:bg-red-900/40 p-3 rounded mt-2 font-mono text-xs space-y-1">
              <p><strong>User ID:</strong> {debugInfo.userId || 'N/A'}</p>
              <p><strong>User Email:</strong> {debugInfo.userEmail || 'N/A'}</p>
              <p><strong>User Role:</strong> {debugInfo.userRole || 'N/A'}</p>
              <p><strong>Date Range:</strong> {debugInfo.dateRange || 'N/A'}</p>
              <p><strong>Timestamp:</strong> {debugInfo.timestamp || 'N/A'}</p>
              <p><strong>Session Valid:</strong> {!!session ? 'Yes' : 'No'}</p>
            </div>
          </details>

          <button
            onClick={handleRefresh}
            className="mt-4 flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Retry</span>
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">💡 Troubleshooting Steps:</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
            <li>Open browser console (F12) and check for errors</li>
            <li>Verify you have students and lessons in the database</li>
            <li>Try refreshing the page (Ctrl+Shift+R)</li>
            <li>Try a different date range filter</li>
            <li>Check your internet connection</li>
          </ol>
        </div>
      </div>
    );
  }

  // NO DATA STATE
  if (!analytics) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <AlertCircle className="h-6 w-6 text-yellow-600" />
          <div>
            <h3 className="text-yellow-800 dark:text-yellow-200 font-medium">No Analytics Data</h3>
            <p className="text-yellow-600 dark:text-yellow-300 text-sm mt-1">
              Analytics data is not available. This might be because you have no students or lessons yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // SUCCESS STATE - RENDER FULL DASHBOARD
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Analytics & Insights
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive overview of your students' progress and performance
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>

          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => {
              console.log('📅 Date range changed to:', e.target.value);
              setDateRange(e.target.value as DateRange);
            }}
            className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="3m">Last 3 months</option>
            <option value="all">All time</option>
          </select>

          {/* Export Button */}
          <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg">
            <Download className="h-4 w-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Show warning if error but analytics still loaded */}
      {error && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <p className="text-yellow-800 dark:text-yellow-200 text-sm">
              Some analytics data may be incomplete: {error}
            </p>
          </div>
        </div>
      )}

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Students"
          value={analytics.overview.totalStudents}
          icon={Users}
          color="purple"
          trend={analytics.trends.activeTrend}
          trendValue={analytics.trends.activeChange}
        />
        <MetricCard
          title="Average Progress"
          value={`${analytics.overview.averageProgress}%`}
          icon={TrendingUp}
          color="blue"
          trend={analytics.trends.progressTrend}
          trendValue={analytics.trends.progressChange}
        />
        <MetricCard
          title="Completion Rate"
          value={`${analytics.overview.completionRate}%`}
          icon={CheckCircle}
          color="green"
          trend={analytics.trends.completionTrend}
          trendValue={analytics.trends.completionChange}
        />
        <MetricCard
          title="Average Score"
          value={`${analytics.overview.averageScore}%`}
          icon={Award}
          color="orange"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Lessons Completed</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {analytics.overview.totalLessonsCompleted} / {analytics.overview.totalLessonsAssigned}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Students</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {analytics.overview.activeStudents} / {analytics.overview.totalStudents}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Clock className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Study Hours</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {analytics.overview.totalStudyHours}h
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Activity className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Engagement Rate</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {analytics.overview.totalStudents > 0 
                  ? Math.round((analytics.overview.activeStudents / analytics.overview.totalStudents) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Over Time Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <span>Progress Over Time</span>
          </h3>
          {analytics.progressOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.progressOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af' }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="averageProgress" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  name="Average Progress (%)"
                  dot={{ fill: '#8b5cf6', r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="studentsActive" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Active Students"
                  dot={{ fill: '#3b82f6', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
              No data available for selected time range
            </div>
          )}
        </div>

        {/* Performance Distribution Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <span>Performance Distribution</span>
          </h3>
          {analytics.performanceDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.performanceDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="range" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#3b82f6" name="Number of Students" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
              No performance data available
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performers */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <Star className="h-5 w-5 text-yellow-600" />
            <span>Top Performers</span>
          </h3>
          {analytics.topPerformers.length > 0 ? (
            <div className="space-y-3">
              {analytics.topPerformers.map((student, index) => (
                <div 
                  key={student.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-purple-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{student.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {student.lessonsCompleted} lessons completed
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">{student.progress}%</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Score: {student.score}%</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
              No student data available yet
            </div>
          )}
        </div>

        {/* Student Comparison Radar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <Target className="h-5 w-5 text-green-600" />
            <span>Top 5 vs Avg</span>
          </h3>
          {analytics.studentComparison.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={analytics.studentComparison}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="student" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <PolarRadiusAxis stroke="#9ca3af" />
                <Radar name="Progress" dataKey="progress" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
              Not enough data
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity & Weak Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <Activity className="h-5 w-5 text-purple-600" />
            <span>Recent Activity</span>
          </h3>
          {analytics.recentActivity.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {analytics.recentActivity.map((activity) => (
                <div 
                  key={activity.id}
                  className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.action === 'Completed' ? 'bg-green-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{activity.studentName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {activity.action} <span className="font-medium">{activity.lessonTitle}</span>
                    </p>
                    {activity.score !== undefined && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Score: {activity.score}%
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
              No recent activity
            </div>
          )}
        </div>

        {/* Weak Areas Analysis */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <Brain className="h-5 w-5 text-orange-600" />
            <span>Areas Needing Attention</span>
          </h3>
          {analytics.weakAreas.length > 0 ? (
            <div className="space-y-4">
              {analytics.weakAreas.map((area, index) => (
                <div 
                  key={index}
                  className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">{area.lessonTitle}</h4>
                    <span className="text-xs px-2 py-1 bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 rounded-full">
                      {area.studentCount} students
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Avg Score</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{area.averageScore}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-orange-500"
                          style={{ width: `${area.averageScore}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Completion</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{area.completionRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-blue-500"
                          style={{ width: `${area.completionRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
              No weak areas identified - great job!
            </div>
          )}
        </div>
      </div>

      {/* Recommendations Section */}
      {(analytics.weakAreas.length > 0 || 
        analytics.overview.activeStudents < analytics.overview.totalStudents ||
        analytics.topPerformers.length > 0) && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            <span>Recommendations</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analytics.weakAreas.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium text-gray-900 dark:text-white">Focus Area</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Consider creating supplementary materials for "{analytics.weakAreas[0].lessonTitle}" - students need extra support
                </p>
              </div>
            )}
            
            {analytics.overview.activeStudents < analytics.overview.totalStudents && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="h-5 w-5 text-green-600" />
                  <h4 className="font-medium text-gray-900 dark:text-white">Engagement</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {analytics.overview.totalStudents - analytics.overview.activeStudents} students haven't been active recently. Consider sending reminder messages
                </p>
              </div>
            )}
            
            {analytics.topPerformers.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Award className="h-5 w-5 text-purple-600" />
                  <h4 className="font-medium text-gray-900 dark:text-white">Recognition</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {analytics.topPerformers[0].name} has completed {analytics.topPerformers[0].lessonsCompleted} lessons with {analytics.topPerformers[0].score}% avg score - send congratulations!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Debug Console Log Button (for development) */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={() => {
            console.log('📊 Current Analytics State:', analytics);
            console.log('🔍 Debug Info:', debugInfo);
          }}
          className="fixed bottom-4 right-4 px-3 py-2 bg-gray-800 text-white rounded-lg text-xs opacity-50 hover:opacity-100 transition-opacity"
        >
          Log Debug Info
        </button>
      )}
    </div>
  );
}
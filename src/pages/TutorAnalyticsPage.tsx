// src/pages/TutorAnalyticsPage.tsx
// 🎯 ANALYTICS & INSIGHTS DASHBOARD for Tutors
// Complete analytics page with charts, trends, and recommendations

import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import {
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  Clock,
  Award,
  Activity,
  BarChart3,
  Calendar,
  Filter,
  Download,
  AlertCircle,
  CheckCircle,
  Target,
  Zap,
  Brain,
  Star,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
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
  ResponsiveContainer,
  Cell
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
// MOCK DATA (Replace with real Supabase queries)
// ============================================================================

const generateMockAnalytics = (): AnalyticsData => {
  return {
    overview: {
      totalStudents: 24,
      activeStudents: 18,
      averageProgress: 67,
      completionRate: 78,
      totalLessonsAssigned: 156,
      totalLessonsCompleted: 98,
      averageScore: 82,
      totalStudyHours: 342
    },
    progressOverTime: [
      { date: '2025-10-01', averageProgress: 45, studentsActive: 15 },
      { date: '2025-10-05', averageProgress: 52, studentsActive: 16 },
      { date: '2025-10-10', averageProgress: 58, studentsActive: 17 },
      { date: '2025-10-15', averageProgress: 63, studentsActive: 18 },
      { date: '2025-10-20', averageProgress: 65, studentsActive: 18 },
      { date: '2025-10-26', averageProgress: 67, studentsActive: 18 }
    ],
    performanceDistribution: [
      { range: '0-20%', count: 2 },
      { range: '21-40%', count: 3 },
      { range: '41-60%', count: 5 },
      { range: '61-80%', count: 8 },
      { range: '81-100%', count: 6 }
    ],
    topPerformers: [
      { id: '1', name: 'Anna Kowalska', progress: 95, score: 92, lessonsCompleted: 12 },
      { id: '2', name: 'Jan Nowak', progress: 88, score: 89, lessonsCompleted: 10 },
      { id: '3', name: 'Maria Wiśniewska', progress: 85, score: 87, lessonsCompleted: 11 },
      { id: '4', name: 'Piotr Wójcik', progress: 82, score: 85, lessonsCompleted: 9 },
      { id: '5', name: 'Katarzyna Lewandowska', progress: 80, score: 83, lessonsCompleted: 10 }
    ],
    recentActivity: [
      { id: '1', studentName: 'Anna Kowalska', action: 'Completed', lessonTitle: 'Advanced Grammar', timestamp: '2025-10-26T10:30:00', score: 95 },
      { id: '2', studentName: 'Jan Nowak', action: 'Started', lessonTitle: 'Business English', timestamp: '2025-10-26T09:15:00' },
      { id: '3', studentName: 'Maria Wiśniewska', action: 'Completed', lessonTitle: 'Conversational Practice', timestamp: '2025-10-25T16:20:00', score: 88 },
      { id: '4', studentName: 'Piotr Wójcik', action: 'Completed', lessonTitle: 'Vocabulary Building', timestamp: '2025-10-25T14:10:00', score: 82 },
      { id: '5', studentName: 'Katarzyna Lewandowska', action: 'Started', lessonTitle: 'Pronunciation Guide', timestamp: '2025-10-25T11:00:00' }
    ],
    weakAreas: [
      { lessonTitle: 'Advanced Tenses', averageScore: 65, completionRate: 45, studentCount: 8 },
      { lessonTitle: 'Idiomatic Expressions', averageScore: 68, completionRate: 52, studentCount: 10 },
      { lessonTitle: 'Business Correspondence', averageScore: 70, completionRate: 58, studentCount: 6 }
    ],
    studentComparison: [
      { student: 'Anna K.', progress: 95, lessons: 12, hours: 48, score: 92 },
      { student: 'Jan N.', progress: 88, lessons: 10, hours: 42, score: 89 },
      { student: 'Maria W.', progress: 85, lessons: 11, hours: 45, score: 87 },
      { student: 'Piotr W.', progress: 82, lessons: 9, hours: 38, score: 85 },
      { student: 'Avg', progress: 67, lessons: 6, hours: 28, score: 82 }
    ],
    trends: {
      progressTrend: 'up',
      progressChange: 12.5,
      activeTrend: 'up',
      activeChange: 8.3,
      completionTrend: 'down',
      completionChange: -3.2
    }
  };
};

// ============================================================================
// COMPONENTS
// ============================================================================

// Metric Card Component
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
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        {trend && trendValue !== undefined && (
          <div className={`flex items-center space-x-1 text-sm font-medium ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {trend === 'up' ? <ArrowUp className="h-4 w-4" /> : trend === 'down' ? <ArrowDown className="h-4 w-4" /> : null}
            <span>{Math.abs(trendValue)}%</span>
          </div>
        )}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TutorAnalyticsPage() {
  const { t } = useLanguage();
  const { session } = useAuth();
  
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  // Load analytics data
  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      try {
        // TODO: Replace with real Supabase query
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        const data = generateMockAnalytics();
        setAnalytics(data);
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [dateRange]);

  // Chart colors
  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <AlertCircle className="h-6 w-6 text-red-600" />
          <div>
            <h3 className="text-red-800 dark:text-red-200 font-medium">Error Loading Analytics</h3>
            <p className="text-red-600 dark:text-red-300 text-sm mt-1">Unable to load analytics data</p>
          </div>
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
            Analytics & Insights
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive overview of your students' progress and performance
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
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
                {Math.round((analytics.overview.activeStudents / analytics.overview.totalStudents) * 100)}%
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
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.progressOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af' }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: '#f3f4f6' }}
              />
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
        </div>

        {/* Performance Distribution Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <span>Performance Distribution</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.performanceDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="range" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
              <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="count" fill="#3b82f6" name="Number of Students" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
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
        </div>

        {/* Student Comparison Radar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <Target className="h-5 w-5 text-green-600" />
            <span>Top 5 vs Avg</span>
          </h3>
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
                  {activity.score && (
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
        </div>

        {/* Weak Areas Analysis */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <Brain className="h-5 w-5 text-orange-600" />
            <span>Areas Needing Attention</span>
          </h3>
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
        </div>
      </div>

      {/* Recommendations Section */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
          <Zap className="h-5 w-5 text-yellow-600" />
          <span>AI-Powered Recommendations</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium text-gray-900 dark:text-white">Focus Area</h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Consider creating supplementary materials for "Advanced Tenses" - multiple students struggling here
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="h-5 w-5 text-green-600" />
              <h4 className="font-medium text-gray-900 dark:text-white">Engagement</h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              6 students haven't been active in 7+ days. Consider sending reminder messages
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Award className="h-5 w-5 text-purple-600" />
              <h4 className="font-medium text-gray-900 dark:text-white">Recognition</h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Anna Kowalska has completed 12 lessons with 92% avg score - send congratulations!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
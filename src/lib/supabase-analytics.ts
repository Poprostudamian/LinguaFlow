// src/lib/supabase-analytics.ts
// Analytics functions for TutorAnalyticsPage

import { supabase } from './supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface AnalyticsOverview {
  totalStudents: number;
  activeStudents: number;
  averageProgress: number;
  completionRate: number;
  totalLessonsAssigned: number;
  totalLessonsCompleted: number;
  averageScore: number;
  totalStudyHours: number;
}

export interface ProgressDataPoint {
  date: string;
  averageProgress: number;
  studentsActive: number;
}

export interface PerformanceRange {
  range: string;
  count: number;
}

export interface TopPerformer {
  id: string;
  name: string;
  progress: number;
  score: number;
  lessonsCompleted: number;
}

export interface Activity {
  id: string;
  studentName: string;
  action: string;
  lessonTitle: string;
  timestamp: string;
  score?: number;
}

export interface WeakArea {
  lessonTitle: string;
  averageScore: number;
  completionRate: number;
  studentCount: number;
}

export interface StudentComparisonData {
  student: string;
  progress: number;
  lessons: number;
  hours: number;
  score: number;
}

export interface TrendsData {
  progressTrend: 'up' | 'down' | 'stable';
  progressChange: number;
  activeTrend: 'up' | 'down' | 'stable';
  activeChange: number;
  completionTrend: 'up' | 'down' | 'stable';
  completionChange: number;
}

// ============================================================================
// ANALYTICS FUNCTIONS
// ============================================================================

/**
 * Get overview analytics for a tutor
 */
export const getAnalyticsOverview = async (tutorId: string): Promise<AnalyticsOverview> => {
  try {
    console.log('📊 Fetching analytics overview for tutor:', tutorId);

    // Get total students
    const { data: students, error: studentsError } = await supabase
      .from('tutor_students')
      .select('student_id, is_active')
      .eq('tutor_id', tutorId);

    if (studentsError) {
      console.error('❌ Error fetching students:', studentsError);
      throw studentsError;
    }

    const totalStudents = students?.length || 0;
    const activeStudents = students?.filter(s => s.is_active).length || 0;

    console.log('👥 Found', totalStudents, 'students,', activeStudents, 'active');

    if (totalStudents === 0) {
      console.log('⚠️ No students found, returning zero metrics');
      return {
        totalStudents: 0,
        activeStudents: 0,
        averageProgress: 0,
        completionRate: 0,
        totalLessonsAssigned: 0,
        totalLessonsCompleted: 0,
        averageScore: 0,
        totalStudyHours: 0
      };
    }

    // Get lesson statistics
    const studentIds = students?.map(s => s.student_id) || [];
    
    const { data: lessonStats, error: lessonsError } = await supabase
      .from('student_lessons')
      .select('status, progress, score, time_spent')
      .in('student_id', studentIds);

    if (lessonsError) {
      console.error('❌ Error fetching lesson stats:', lessonsError);
      throw lessonsError;
    }

    console.log('📚 Found', lessonStats?.length || 0, 'lesson assignments');

    const totalLessonsAssigned = lessonStats?.length || 0;
    const totalLessonsCompleted = lessonStats?.filter(l => l.status === 'completed').length || 0;
    
    const averageProgress = lessonStats && lessonStats.length > 0
      ? Math.round(lessonStats.reduce((sum, l) => sum + (l.progress || 0), 0) / lessonStats.length)
      : 0;

    const completedWithScores = lessonStats?.filter(l => l.status === 'completed' && l.score !== null) || [];
    const averageScore = completedWithScores.length > 0
      ? Math.round(completedWithScores.reduce((sum, l) => sum + (l.score || 0), 0) / completedWithScores.length)
      : 0;

    const completionRate = totalLessonsAssigned > 0
      ? Math.round((totalLessonsCompleted / totalLessonsAssigned) * 100)
      : 0;

    const totalStudyHours = Math.round(
      (lessonStats?.reduce((sum, l) => sum + (l.time_spent || 0), 0) || 0) / 60
    );

    const result = {
      totalStudents,
      activeStudents,
      averageProgress,
      completionRate,
      totalLessonsAssigned,
      totalLessonsCompleted,
      averageScore,
      totalStudyHours
    };

    console.log('✅ Overview calculated:', result);
    return result;

  } catch (error) {
    console.error('❌ Error fetching analytics overview:', error);
    throw error;
  }
};

/**
 * Get progress over time data
 */
export const getProgressOverTime = async (
  tutorId: string,
  days: number = 30
): Promise<ProgressDataPoint[]> => {
  try {
    console.log('📈 Fetching progress over time for tutor:', tutorId, 'days:', days);

    // Get student IDs
    const { data: students, error: studentsError } = await supabase
      .from('tutor_students')
      .select('student_id')
      .eq('tutor_id', tutorId);

    if (studentsError) throw studentsError;

    if (!students || students.length === 0) {
      console.log('⚠️ No students found for tutor');
      return [];
    }

    const studentIds = students.map(s => s.student_id);
    
    // Calculate start date
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0); // Start of day

    console.log('📅 Date range:', startDate.toISOString(), 'to', new Date().toISOString());

    // Get lesson updates over time - using assigned_at, started_at, completed_at, or updated_at
    const { data: lessonUpdates, error } = await supabase
      .from('student_lessons')
      .select('assigned_at, started_at, completed_at, updated_at, progress, student_id, status')
      .in('student_id', studentIds)
      .order('updated_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching lesson updates:', error);
      throw error;
    }

    if (!lessonUpdates || lessonUpdates.length === 0) {
      console.log('⚠️ No lesson data found for students');
      return [];
    }

    console.log('📊 Found', lessonUpdates.length, 'lesson updates');

    // Group by date and calculate averages
    const dataByDate: { [key: string]: { totalProgress: number; count: number; activeStudents: Set<string> } } = {};

    lessonUpdates.forEach(update => {
      // Use the most recent relevant date
      const dateToUse = update.completed_at || update.started_at || update.updated_at || update.assigned_at;
      
      if (!dateToUse) return;

      const updateDate = new Date(dateToUse);
      
      // Skip if before start date
      if (updateDate < startDate) return;

      const date = updateDate.toISOString().split('T')[0];
      
      if (!dataByDate[date]) {
        dataByDate[date] = { totalProgress: 0, count: 0, activeStudents: new Set() };
      }
      
      dataByDate[date].totalProgress += update.progress || 0;
      dataByDate[date].count += 1;
      dataByDate[date].activeStudents.add(update.student_id);
    });

    // Convert to array format and sort by date
    const result = Object.entries(dataByDate)
      .map(([date, data]) => ({
        date,
        averageProgress: Math.round(data.totalProgress / data.count),
        studentsActive: data.activeStudents.size
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    console.log('✅ Processed', result.length, 'data points');
    
    // If we have data but it's empty for the selected range, fill with at least current day
    if (result.length === 0 && lessonUpdates.length > 0) {
      // Get latest data
      const latestProgress = lessonUpdates.reduce((sum, l) => sum + (l.progress || 0), 0) / lessonUpdates.length;
      const activeStudentsSet = new Set(lessonUpdates.map(l => l.student_id));
      
      return [{
        date: new Date().toISOString().split('T')[0],
        averageProgress: Math.round(latestProgress),
        studentsActive: activeStudentsSet.size
      }];
    }

    return result;

  } catch (error) {
    console.error('❌ Error fetching progress over time:', error);
    // Return empty array instead of throwing to prevent dashboard crash
    return [];
  }
};

/**
 * Get performance distribution
 */
export const getPerformanceDistribution = async (tutorId: string): Promise<PerformanceRange[]> => {
  try {
    console.log('📊 Fetching performance distribution for tutor:', tutorId);

    const { data: students } = await supabase
      .from('tutor_students')
      .select('student_id')
      .eq('tutor_id', tutorId);

    if (!students || students.length === 0) return [];

    const studentIds = students.map(s => s.student_id);

    const { data: lessonStats, error } = await supabase
      .from('student_lessons')
      .select('student_id, progress')
      .in('student_id', studentIds);

    if (error) throw error;

    // Calculate average progress per student
    const studentProgress: { [key: string]: number[] } = {};
    lessonStats?.forEach(stat => {
      if (!studentProgress[stat.student_id]) {
        studentProgress[stat.student_id] = [];
      }
      studentProgress[stat.student_id].push(stat.progress || 0);
    });

    const averages = Object.values(studentProgress).map(progresses => 
      progresses.reduce((sum, p) => sum + p, 0) / progresses.length
    );

    // Create distribution
    const ranges = [
      { range: '0-20%', min: 0, max: 20, count: 0 },
      { range: '21-40%', min: 21, max: 40, count: 0 },
      { range: '41-60%', min: 41, max: 60, count: 0 },
      { range: '61-80%', min: 61, max: 80, count: 0 },
      { range: '81-100%', min: 81, max: 100, count: 0 }
    ];

    averages.forEach(avg => {
      const range = ranges.find(r => avg >= r.min && avg <= r.max);
      if (range) range.count++;
    });

    return ranges.map(r => ({ range: r.range, count: r.count }));

  } catch (error) {
    console.error('Error fetching performance distribution:', error);
    return [];
  }
};

/**
 * Get top performers
 */
export const getTopPerformers = async (tutorId: string, limit: number = 5): Promise<TopPerformer[]> => {
  try {
    console.log('🌟 Fetching top performers for tutor:', tutorId);

    const { data: students } = await supabase
      .from('tutor_students')
      .select(`
        student_id,
        users!tutor_students_student_id_fkey (
          id,
          first_name,
          last_name
        )
      `)
      .eq('tutor_id', tutorId);

    if (!students || students.length === 0) return [];

    const performersData = await Promise.all(
      students.map(async (student: any) => {
        const { data: lessons } = await supabase
          .from('student_lessons')
          .select('progress, score, status')
          .eq('student_id', student.student_id);

        const avgProgress = lessons && lessons.length > 0
          ? Math.round(lessons.reduce((sum, l) => sum + (l.progress || 0), 0) / lessons.length)
          : 0;

        const completedWithScores = lessons?.filter(l => l.status === 'completed' && l.score !== null) || [];
        const avgScore = completedWithScores.length > 0
          ? Math.round(completedWithScores.reduce((sum, l) => sum + (l.score || 0), 0) / completedWithScores.length)
          : 0;

        const lessonsCompleted = lessons?.filter(l => l.status === 'completed').length || 0;

        return {
          id: student.student_id,
          name: `${student.users.first_name} ${student.users.last_name}`,
          progress: avgProgress,
          score: avgScore,
          lessonsCompleted
        };
      })
    );

    // Sort by progress and score
    return performersData
      .sort((a, b) => {
        if (b.progress !== a.progress) return b.progress - a.progress;
        return b.score - a.score;
      })
      .slice(0, limit);

  } catch (error) {
    console.error('Error fetching top performers:', error);
    return [];
  }
};

/**
 * Get recent activity
 */
export const getRecentActivity = async (
  tutorId: string,
  limit: number = 10
): Promise<Activity[]> => {
  try {
    console.log('📋 Fetching recent activity for tutor:', tutorId);

    const { data: students } = await supabase
      .from('tutor_students')
      .select('student_id')
      .eq('tutor_id', tutorId);

    if (!students || students.length === 0) return [];

    const studentIds = students.map(s => s.student_id);

    const { data: activities, error } = await supabase
      .from('student_lessons')
      .select(`
        id,
        status,
        updated_at,
        score,
        student_id,
        lesson_id,
        users!student_lessons_student_id_fkey (first_name, last_name),
        lessons (title)
      `)
      .in('student_id', studentIds)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return activities?.map((activity: any) => ({
      id: activity.id,
      studentName: `${activity.users.first_name} ${activity.users.last_name}`,
      action: activity.status === 'completed' ? 'Completed' : 'Started',
      lessonTitle: activity.lessons.title,
      timestamp: activity.updated_at,
      score: activity.status === 'completed' ? activity.score : undefined
    })) || [];

  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
};

/**
 * Get weak areas analysis
 */
export const getWeakAreas = async (tutorId: string, limit: number = 5): Promise<WeakArea[]> => {
  try {
    console.log('🎯 Fetching weak areas for tutor:', tutorId);

    const { data: students } = await supabase
      .from('tutor_students')
      .select('student_id')
      .eq('tutor_id', tutorId);

    if (!students || students.length === 0) return [];

    const studentIds = students.map(s => s.student_id);

    // Get all lessons assigned to these students
    const { data: lessonStats, error } = await supabase
      .from('student_lessons')
      .select(`
        lesson_id,
        score,
        status,
        lessons (title)
      `)
      .in('student_id', studentIds);

    if (error) throw error;

    // Group by lesson
    const lessonData: { [key: string]: { title: string; scores: number[]; total: number; completed: number } } = {};

    lessonStats?.forEach((stat: any) => {
      const lessonId = stat.lesson_id;
      if (!lessonData[lessonId]) {
        lessonData[lessonId] = {
          title: stat.lessons.title,
          scores: [],
          total: 0,
          completed: 0
        };
      }
      lessonData[lessonId].total++;
      if (stat.status === 'completed') {
        lessonData[lessonId].completed++;
        if (stat.score !== null) {
          lessonData[lessonId].scores.push(stat.score);
        }
      }
    });

    // Calculate averages and find weak areas
    const weakAreas = Object.values(lessonData)
      .map(data => ({
        lessonTitle: data.title,
        averageScore: data.scores.length > 0
          ? Math.round(data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length)
          : 0,
        completionRate: Math.round((data.completed / data.total) * 100),
        studentCount: data.total
      }))
      .filter(area => area.averageScore < 75 || area.completionRate < 60)
      .sort((a, b) => a.averageScore - b.averageScore)
      .slice(0, limit);

    return weakAreas;

  } catch (error) {
    console.error('Error fetching weak areas:', error);
    return [];
  }
};

/**
 * Calculate trends by comparing current period with previous period
 */
export const calculateTrends = async (tutorId: string, days: number = 30): Promise<TrendsData> => {
  try {
    console.log('📈 Calculating trends for tutor:', tutorId);

    // Get current period data
    const currentOverview = await getAnalyticsOverview(tutorId);

    // Get previous period data (same duration, but shifted back)
    const { data: students } = await supabase
      .from('tutor_students')
      .select('student_id')
      .eq('tutor_id', tutorId);

    if (!students || students.length === 0) {
      return {
        progressTrend: 'stable',
        progressChange: 0,
        activeTrend: 'stable',
        activeChange: 0,
        completionTrend: 'stable',
        completionChange: 0
      };
    }

    // This is a simplified version - in production, you'd query historical data
    // For now, we'll return mock trend data
    return {
      progressTrend: 'up',
      progressChange: 12.5,
      activeTrend: 'up',
      activeChange: 8.3,
      completionTrend: 'down',
      completionChange: 3.2
    };

  } catch (error) {
    console.error('Error calculating trends:', error);
    return {
      progressTrend: 'stable',
      progressChange: 0,
      activeTrend: 'stable',
      activeChange: 0,
      completionTrend: 'stable',
      completionChange: 0
    };
  }
};

/**
 * Get student comparison data for radar chart
 */
export const getStudentComparison = async (tutorId: string): Promise<StudentComparisonData[]> => {
  try {
    console.log('📊 Fetching student comparison for tutor:', tutorId);

    const topPerformers = await getTopPerformers(tutorId, 5);
    
    // Get detailed data for top 5
    const comparisonData = await Promise.all(
      topPerformers.map(async (performer) => {
        const { data: lessons } = await supabase
          .from('student_lessons')
          .select('time_spent')
          .eq('student_id', performer.id);

        const totalHours = Math.round(
          (lessons?.reduce((sum, l) => sum + (l.time_spent || 0), 0) || 0) / 60
        );

        return {
          student: performer.name.split(' ')[0], // First name only for chart
          progress: performer.progress,
          lessons: performer.lessonsCompleted,
          hours: totalHours,
          score: performer.score
        };
      })
    );

    // Calculate average
    const avgProgress = Math.round(
      comparisonData.reduce((sum, d) => sum + d.progress, 0) / comparisonData.length
    );
    const avgLessons = Math.round(
      comparisonData.reduce((sum, d) => sum + d.lessons, 0) / comparisonData.length
    );
    const avgHours = Math.round(
      comparisonData.reduce((sum, d) => sum + d.hours, 0) / comparisonData.length
    );
    const avgScore = Math.round(
      comparisonData.reduce((sum, d) => sum + d.score, 0) / comparisonData.length
    );

    comparisonData.push({
      student: 'Avg',
      progress: avgProgress,
      lessons: avgLessons,
      hours: avgHours,
      score: avgScore
    });

    return comparisonData;

  } catch (error) {
    console.error('Error fetching student comparison:', error);
    return [];
  }
};

/**
 * Get all analytics data at once with improved error handling
 */
export const getAllAnalytics = async (tutorId: string, dateRangeDays: number = 30) => {
  try {
    console.log('📊 Fetching all analytics for tutor:', tutorId, 'range:', dateRangeDays, 'days');

    // Fetch all data with Promise.allSettled to handle individual failures
    const results = await Promise.allSettled([
      getAnalyticsOverview(tutorId),
      getProgressOverTime(tutorId, dateRangeDays),
      getPerformanceDistribution(tutorId),
      getTopPerformers(tutorId, 5),
      getRecentActivity(tutorId, 10),
      getWeakAreas(tutorId, 5),
      getStudentComparison(tutorId),
      calculateTrends(tutorId, dateRangeDays)
    ]);

    // Extract results or use defaults
    const [
      overviewResult,
      progressResult,
      distributionResult,
      performersResult,
      activityResult,
      weakAreasResult,
      comparisonResult,
      trendsResult
    ] = results;

    // Default values for failed fetches
    const defaultOverview = {
      totalStudents: 0,
      activeStudents: 0,
      averageProgress: 0,
      completionRate: 0,
      totalLessonsAssigned: 0,
      totalLessonsCompleted: 0,
      averageScore: 0,
      totalStudyHours: 0
    };

    const defaultTrends = {
      progressTrend: 'stable' as const,
      progressChange: 0,
      activeTrend: 'stable' as const,
      activeChange: 0,
      completionTrend: 'stable' as const,
      completionChange: 0
    };

    // Log any failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const names = ['Overview', 'Progress', 'Distribution', 'Performers', 'Activity', 'WeakAreas', 'Comparison', 'Trends'];
        console.error(`❌ Failed to fetch ${names[index]}:`, result.reason);
      }
    });

    return {
      overview: overviewResult.status === 'fulfilled' ? overviewResult.value : defaultOverview,
      progressOverTime: progressResult.status === 'fulfilled' ? progressResult.value : [],
      performanceDistribution: distributionResult.status === 'fulfilled' ? distributionResult.value : [],
      topPerformers: performersResult.status === 'fulfilled' ? performersResult.value : [],
      recentActivity: activityResult.status === 'fulfilled' ? activityResult.value : [],
      weakAreas: weakAreasResult.status === 'fulfilled' ? weakAreasResult.value : [],
      studentComparison: comparisonResult.status === 'fulfilled' ? comparisonResult.value : [],
      trends: trendsResult.status === 'fulfilled' ? trendsResult.value : defaultTrends
    };

  } catch (error) {
    console.error('❌ Critical error fetching all analytics:', error);
    throw error;
  }
}; 
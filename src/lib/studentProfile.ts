// src/lib/studentProfile.ts

import { supabase } from './supabase';

interface LessonHistory {
  id: string;
  title: string;
  completedAt: string;
  score: number;
  timeSpent: number;
  status: 'completed' | 'in_progress' | 'assigned';
}

interface StudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  level: string;
  progress: number;
  lessonsCompleted: number;
  totalLessons: number;
  totalHours: number;
  joinedDate: string;
  lastActive?: string;
  lessonHistory: LessonHistory[];
}

/**
 * Fetch detailed student profile with lesson history
 */
export async function getStudentDetailedProfile(studentId: string): Promise<StudentProfile> {
  try {
    // Fetch student basic info
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, avatar_url, level, created_at')
      .eq('id', studentId)
      .single();

    if (userError) throw userError;
    if (!userData) throw new Error('Student not found');

    // Fetch student lessons with lesson details
    const { data: lessonsData, error: lessonsError } = await supabase
      .from('student_lessons')
      .select(`
        id,
        status,
        score,
        time_spent,
        completed_at,
        started_at,
        progress,
        lesson:lessons (
          id,
          title
        )
      `)
      .eq('student_id', studentId)
      .order('completed_at', { ascending: false, nullsFirst: false });

    if (lessonsError) throw lessonsError;

    // Calculate statistics
    const completedLessons = lessonsData?.filter(l => l.status === 'completed') || [];
    const totalHours = Math.round((lessonsData?.reduce((acc, l) => acc + (l.time_spent || 0), 0) || 0) / 60);
    
    // Calculate average progress
    const totalProgress = lessonsData?.reduce((acc, l) => acc + (l.progress || 0), 0) || 0;
    const avgProgress = lessonsData && lessonsData.length > 0 
      ? Math.round(totalProgress / lessonsData.length) 
      : 0;

    // Get last active date (most recent lesson activity)
    const lastActive = lessonsData && lessonsData.length > 0
      ? lessonsData[0].completed_at || lessonsData[0].started_at || null
      : null;

    // Format lesson history (limit to last 20)
    const lessonHistory: LessonHistory[] = (lessonsData || [])
      .slice(0, 20)
      .map(lesson => ({
        id: lesson.id,
        title: (lesson.lesson as any)?.title || 'Untitled Lesson',
        completedAt: lesson.completed_at || lesson.started_at || new Date().toISOString(),
        score: lesson.score || 0,
        timeSpent: lesson.time_spent || 0,
        status: lesson.status as 'completed' | 'in_progress' | 'assigned'
      }));

    // Count total lessons assigned to student
    const totalLessons = lessonsData?.length || 0;

    return {
      id: userData.id,
      firstName: userData.first_name,
      lastName: userData.last_name,
      email: userData.email,
      avatarUrl: userData.avatar_url,
      level: userData.level || 'Beginner',
      progress: avgProgress,
      lessonsCompleted: completedLessons.length,
      totalLessons,
      totalHours,
      joinedDate: userData.created_at,
      lastActive: lastActive || undefined,
      lessonHistory
    };
  } catch (error) {
    console.error('Error fetching student profile:', error);
    throw error;
  }
}
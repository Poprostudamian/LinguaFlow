// src/lib/studentAPI.ts - API dla studenta używające tego samego podejścia co tutor
import { supabase } from './supabase';
import { getStudentStats } from './supabase'; // Używamy istniejącego API

export interface StudentLessonWithDetails {
  id: string;
  student_id: string;
  lesson_id: string;
  assigned_at: string;
  started_at: string | null;
  completed_at: string | null;
  status: 'assigned' | 'in_progress' | 'completed';
  score: number | null;
  time_spent: number;
  progress: number;
  updated_at: string;
  lesson: {
    id: string;
    title: string;
    description: string | null;
    content: string;
    created_at: string;
    tutor_id: string;
    tutor: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

export interface StudentKPIs {
  totalLessons: number;
  completedLessons: number;
  inProgressLessons: number;
  assignedLessons: number;
  averageScore: number;
  totalStudyTime: number; // w minutach
  averageProgress: number;
}

/**
 * Pobierz lekcje studenta - UŻYWAJĄC TEGO SAMEGO PODEJŚCIA CO W TUTOR DASHBOARD
 */
export async function getStudentLessonsReal(studentId: string): Promise<StudentLessonWithDetails[]> {
  try {
    console.log('🔍 [STUDENT API] Loading lessons for:', studentId);

    // KROK 1: Pobierz wszystkie przypisania studenta (tak jak w tutorze)
    const { data: studentLessons, error: assignmentsError } = await supabase
      .from('student_lessons')
      .select('*')
      .eq('student_id', studentId)
      .order('assigned_at', { ascending: false });

    if (assignmentsError) {
      console.error('❌ [STUDENT API] Error fetching assignments:', assignmentsError);
      throw assignmentsError;
    }

    console.log('✅ [STUDENT API] Found', studentLessons?.length || 0, 'assignments');

    if (!studentLessons || studentLessons.length === 0) {
      return [];
    }

    // KROK 2: Pobierz szczegóły lekcji (bez JOIN - tak jak w tutorze)
    const lessonIds = studentLessons.map(assignment => assignment.lesson_id);
    
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .in('id', lessonIds);

    if (lessonsError) {
      console.error('❌ [STUDENT API] Error fetching lessons:', lessonsError);
      throw lessonsError;
    }

    console.log('✅ [STUDENT API] Found', lessons?.length || 0, 'lessons');

    // KROK 3: Pobierz dane tutorów (bez JOIN)
    const tutorIds = lessons?.map(lesson => lesson.tutor_id) || [];
    const uniqueTutorIds = [...new Set(tutorIds)];
    
    const { data: tutors, error: tutorsError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .in('id', uniqueTutorIds);

    if (tutorsError) {
      console.error('❌ [STUDENT API] Error fetching tutors:', tutorsError);
      throw tutorsError;
    }

    console.log('✅ [STUDENT API] Found', tutors?.length || 0, 'tutors');

    // KROK 4: Połącz wszystkie dane (tak jak w tutorze)
    const result: StudentLessonWithDetails[] = studentLessons.map(assignment => {
      const lesson = lessons?.find(l => l.id === assignment.lesson_id);
      const tutor = tutors?.find(t => t.id === lesson?.tutor_id);

      return {
        id: assignment.id,
        student_id: assignment.student_id,
        lesson_id: assignment.lesson_id,
        assigned_at: assignment.assigned_at,
        started_at: assignment.started_at,
        completed_at: assignment.completed_at,
        status: assignment.status,
        score: assignment.score,
        time_spent: assignment.time_spent || 0,
        progress: assignment.progress || 0,
        updated_at: assignment.updated_at,
        lesson: {
          id: lesson?.id || assignment.lesson_id,
          title: lesson?.title || 'Unknown Lesson',
          description: lesson?.description,
          content: lesson?.content || '',
          created_at: lesson?.created_at || assignment.assigned_at,
          tutor_id: lesson?.tutor_id || 'unknown',
          tutor: {
            first_name: tutor?.first_name || 'Unknown',
            last_name: tutor?.last_name || 'Tutor',
            email: tutor?.email || ''
          }
        }
      };
    });

    console.log('✅ [STUDENT API] Successfully transformed', result.length, 'lessons');
    return result;

  } catch (error) {
    console.error('💥 [STUDENT API] Complete failure:', error);
    throw error;
  }
}

/**
 * Pobierz statystyki studenta - UŻYWAJĄC ISTNIEJĄCEGO API
 */
export async function getStudentKPIsReal(studentId: string): Promise<StudentKPIs> {
  try {
    console.log('📊 [STUDENT API] Calculating KPIs for:', studentId);

    // Użyj istniejącego API z supabase.ts
    const stats = await getStudentStats(studentId);
    
    console.log('📈 [STUDENT API] Raw stats:', stats);

    // Przekształć na format potrzebny dla UI
    const kpis: StudentKPIs = {
      totalLessons: stats.total_lessons,
      completedLessons: stats.completed_lessons,
      inProgressLessons: stats.in_progress_lessons,
      assignedLessons: stats.total_lessons - stats.completed_lessons - stats.in_progress_lessons,
      averageScore: 0, // Obliczamy poniżej
      totalStudyTime: stats.total_study_time_minutes,
      averageProgress: stats.average_progress
    };

    // Oblicz średni score z ukończonych lekcji
    if (stats.completed_lessons > 0) {
      const { data: completedLessons } = await supabase
        .from('student_lessons')
        .select('score')
        .eq('student_id', studentId)
        .eq('status', 'completed')
        .not('score', 'is', null);

      if (completedLessons && completedLessons.length > 0) {
        const totalScore = completedLessons.reduce((sum, lesson) => sum + (lesson.score || 0), 0);
        kpis.averageScore = Math.round(totalScore / completedLessons.length);
      }
    }

    console.log('✅ [STUDENT API] Final KPIs:', kpis);
    return kpis;

  } catch (error) {
    console.error('💥 [STUDENT API] Error calculating KPIs:', error);
    throw error;
  }
}

/**
 * Hook dla studenta - UŻYWAJĄCY TEGO SAMEGO PODEJŚCIA CO TUTOR
 */
import React from 'react';

export function useStudentData(studentId: string | undefined) {
  const [lessons, setLessons] = React.useState<StudentLessonWithDetails[]>([]);
  const [kpis, setKpis] = React.useState<StudentKPIs>({
    totalLessons: 0,
    completedLessons: 0,
    inProgressLessons: 0,
    assignedLessons: 0,
    averageScore: 0,
    totalStudyTime: 0,
    averageProgress: 0
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    if (!studentId) {
      console.log('⚠️ [STUDENT HOOK] No studentId provided');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 [STUDENT HOOK] Loading data for:', studentId);

      // TYMCZASOWO: Użyj debug wersji żeby zobaczyć co się dzieje
      const { getStudentLessonsRealWithDebug } = await import('../lib/debugUnknownData');
      const lessonsData = await getStudentLessonsRealWithDebug(studentId);
      const kpisData = await getStudentKPIsReal(studentId);

      console.log('✅ [STUDENT HOOK] Data loaded successfully');
      setLessons(lessonsData);
      setKpis(kpisData);

    } catch (err: any) {
      console.error('💥 [STUDENT HOOK] Error loading data:', err);
      setError(err.message || 'Failed to load student data');
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    lessons,
    kpis,
    isLoading,
    error,
    refreshData: loadData
  };
}
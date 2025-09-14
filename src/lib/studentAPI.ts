// src/lib/studentAPI.ts - NAPRAWIONA WERSJA z prawidłową obsługą błędów
import React from 'react';
import { supabase } from './supabase';
import { getStudentStats } from './supabase';

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
  totalStudyTime: number;
  averageProgress: number;
}

/**
 * NAPRAWIONA wersja - pobiera lekcje studenta z prawidłową obsługą błędów
 */
export async function getStudentLessonsRobust(studentId: string): Promise<StudentLessonWithDetails[]> {
  try {
    console.log('🔍 [ROBUST API] Loading lessons for:', studentId);

    // KROK 1: Pobierz wszystkie przypisania studenta
    const { data: studentLessons, error: assignmentsError } = await supabase
      .from('student_lessons')
      .select('*')
      .eq('student_id', studentId)
      .order('assigned_at', { ascending: false });

    if (assignmentsError) {
      console.error('❌ [ROBUST API] Error fetching assignments:', assignmentsError);
      throw assignmentsError;
    }

    console.log('✅ [ROBUST API] Found', studentLessons?.length || 0, 'assignments');

    if (!studentLessons || studentLessons.length === 0) {
      console.log('ℹ️ [ROBUST API] No assignments found');
      return [];
    }

    // KROK 2: Pobierz szczegóły lekcji (BEZ .single() - może nie być)
    const lessonIds = studentLessons.map(assignment => assignment.lesson_id);
    console.log('🔍 [ROBUST API] Looking for lesson IDs:', lessonIds);
    
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .in('id', lessonIds);

    // NIE rzucaj błędu jeśli nie ma lekcji - to normalne w przypadku orphaned assignments
    if (lessonsError && lessonsError.code !== 'PGRST116') {
      console.error('❌ [ROBUST API] Error fetching lessons:', lessonsError);
      throw lessonsError;
    }

    console.log('✅ [ROBUST API] Found', lessons?.length || 0, 'lessons out of', lessonIds.length, 'requested');
    
    // DEBUG: Pokaż szczegóły znalezionych lekcji
    if (lessons && lessons.length > 0) {
      console.log('📚 [DEBUG] Lessons found:');
      lessons.forEach(lesson => {
        console.log(`  - ID: ${lesson.id}, Title: "${lesson.title}", Tutor: ${lesson.tutor_id}`);
      });
    }

    // KROK 3: Pobierz dane tutorów (tylko dla znalezionych lekcji)
    const tutorIds = lessons?.map(lesson => lesson.tutor_id) || [];
    const uniqueTutorIds = [...new Set(tutorIds)];
    
    let tutors: any[] = [];
    if (uniqueTutorIds.length > 0) {
      console.log('🔍 [ROBUST API] Looking for tutor IDs:', uniqueTutorIds);
      
      const { data: tutorsData, error: tutorsError } = await supabase
        .from('users')
        .select('id, first_name, last_name, email')
        .in('id', uniqueTutorIds);

      if (tutorsError && tutorsError.code !== 'PGRST116') {
        console.error('❌ [ROBUST API] Error fetching tutors:', tutorsError);
        throw tutorsError;
      }

      tutors = tutorsData || [];
      console.log('✅ [ROBUST API] Found', tutors.length, 'tutors');
      
      // DEBUG: Pokaż szczegóły znalezionych tutorów
      if (tutors.length > 0) {
        console.log('👨‍🏫 [DEBUG] Tutors found:');
        tutors.forEach(tutor => {
          console.log(`  - ID: ${tutor.id}, Name: "${tutor.first_name} ${tutor.last_name}"`);
        });
      }
    }

    // KROK 4: Połącz dane - TYLKO dla assignments które mają lekcje
    const validLessons: StudentLessonWithDetails[] = [];
    const invalidAssignments: any[] = [];

    for (const assignment of studentLessons) {
      const lesson = lessons?.find(l => l.id === assignment.lesson_id);
      
      console.log(`🔍 [DEBUG] Processing assignment ${assignment.id}:`);
      console.log(`  - Looking for lesson ID: ${assignment.lesson_id}`);
      console.log(`  - Lesson found: ${!!lesson ? 'YES' : 'NO'}`);
      
      if (lesson) {
        // Lekcja istnieje - znajdź tutora
        const tutor = tutors.find(t => t.id === lesson.tutor_id);
        
        console.log(`  - Lesson title: "${lesson.title}"`);
        console.log(`  - Looking for tutor ID: ${lesson.tutor_id}`);
        console.log(`  - Tutor found: ${!!tutor ? 'YES' : 'NO'}`);
        if (tutor) {
          console.log(`  - Tutor name: "${tutor.first_name} ${tutor.last_name}"`);
        }
        
        validLessons.push({
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
            id: lesson.id,
            title: lesson.title,
            description: lesson.description,
            content: lesson.content || '',
            created_at: lesson.created_at,
            tutor_id: lesson.tutor_id,
            tutor: {
              first_name: tutor?.first_name || 'Unknown',
              last_name: tutor?.last_name || 'Tutor',
              email: tutor?.email || ''
            }
          }
        });
        
        console.log(`  ✅ RESULT: "${lesson.title}" by ${tutor?.first_name || 'Unknown'} ${tutor?.last_name || 'Tutor'}`);
      } else {
        // Lekcja nie istnieje - dodaj do invalid
        invalidAssignments.push(assignment);
        console.log(`  ❌ INVALID: Assignment references non-existent lesson`);
      }
    }

    // Pokaż wyniki
    console.log('✅ [ROBUST API] FINAL RESULTS:');
    console.log(`  - Valid lessons: ${validLessons.length}`);
    console.log(`  - Invalid assignments (orphaned): ${invalidAssignments.length}`);
    
    if (validLessons.length > 0) {
      console.log('📚 Valid lessons:');
      validLessons.forEach((lesson, index) => {
        console.log(`  ${index + 1}. "${lesson.lesson.title}" by ${lesson.lesson.tutor.first_name} ${lesson.lesson.tutor.last_name}`);
      });
    }
    
    if (invalidAssignments.length > 0) {
      console.warn('⚠️ [ROBUST API] Found orphaned assignments:', invalidAssignments.map(a => a.lesson_id));
      console.warn('💡 These assignments reference lessons that no longer exist');
      console.warn('💡 Consider running cleanup to remove orphaned assignments');
    }

    return validLessons;

  } catch (error) {
    console.error('💥 [ROBUST API] Complete failure:', error);
    throw error;
  }
}

/**
 * Pobierz statystyki studenta - używając istniejącego API
 */
export async function getStudentKPIsRobust(studentId: string): Promise<StudentKPIs> {
  try {
    console.log('📊 [ROBUST API] Calculating KPIs for:', studentId);

    // Użyj istniejącego API z supabase.ts
    const stats = await getStudentStats(studentId);
    
    console.log('📈 [ROBUST API] Raw stats:', stats);

    // Przekształć na format potrzebny dla UI
    const kpis: StudentKPIs = {
      totalLessons: stats.total_lessons,
      completedLessons: stats.completed_lessons,
      inProgressLessons: stats.in_progress_lessons,
      assignedLessons: stats.total_lessons - stats.completed_lessons - stats.in_progress_lessons,
      averageScore: 0,
      totalStudyTime: stats.total_study_time_minutes,
      averageProgress: stats.average_progress
    };

    // Oblicz średni score z ukończonych lekcji (tylko dla valid lessons)
    if (stats.completed_lessons > 0) {
      try {
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
      } catch (scoreError) {
        console.warn('⚠️ Could not calculate average score:', scoreError);
      }
    }

    console.log('✅ [ROBUST API] Final KPIs:', kpis);
    return kpis;

  } catch (error) {
    console.error('💥 [ROBUST API] Error calculating KPIs:', error);
    // Return zero stats instead of throwing
    return {
      totalLessons: 0,
      completedLessons: 0,
      inProgressLessons: 0,
      assignedLessons: 0,
      averageScore: 0,
      totalStudyTime: 0,
      averageProgress: 0
    };
  }
}

/**
 * Hook dla studenta - NAPRAWIONA WERSJA
 */
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

      // Użyj naprawionej wersji API
      const [lessonsData, kpisData] = await Promise.all([
        getStudentLessonsRobust(studentId),
        getStudentKPIsRobust(studentId)
      ]);

      console.log('✅ [STUDENT HOOK] Data loaded successfully:');
      console.log('  - Lessons:', lessonsData.length);
      console.log('  - KPIs:', kpisData);

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
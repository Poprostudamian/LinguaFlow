// src/lib/studentAPI.ts - ENHANCED VERSION of your working code
import React from 'react';
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
 * Pobierz lekcje studenta - ENHANCED VERSION z dodatkowym debugowaniem
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

    // DEBUG: Pokaż wszystkie assignment IDs
    if (studentLessons && studentLessons.length > 0) {
      console.log('📋 [DEBUG] Assignment details:');
      studentLessons.forEach((assignment, index) => {
        console.log(`  ${index + 1}. Assignment ID: ${assignment.id}`);
        console.log(`     - Lesson ID: ${assignment.lesson_id}`);
        console.log(`     - Status: ${assignment.status}`);
        console.log(`     - Assigned: ${assignment.assigned_at}`);
      });
    }

    if (!studentLessons || studentLessons.length === 0) {
      return [];
    }

    // KROK 2: Pobierz szczegóły lekcji (bez JOIN - tak jak w tutorze)
    const lessonIds = studentLessons.map(assignment => assignment.lesson_id);
    console.log('🔍 [STUDENT API] Looking for lesson IDs:', lessonIds);
    
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .in('id', lessonIds);

    if (lessonsError) {
      console.error('❌ [STUDENT API] Error fetching lessons:', lessonsError);
      throw lessonsError;
    }

    console.log('✅ [STUDENT API] Found', lessons?.length || 0, 'lessons');

    // DEBUG: Pokaż które lekcje zostały znalezione
    if (lessons && lessons.length > 0) {
      console.log('📚 [DEBUG] Lessons found in database:');
      lessons.forEach((lesson, index) => {
        console.log(`  ${index + 1}. Lesson ID: ${lesson.id}`);
        console.log(`     - Title: "${lesson.title}"`);
        console.log(`     - Tutor ID: ${lesson.tutor_id}`);
        console.log(`     - Status: ${lesson.status}`);
        console.log(`     - Published: ${lesson.is_published}`);
      });
    } else {
      console.warn('⚠️ [DEBUG] NO LESSONS FOUND IN DATABASE!');
      console.warn('💡 This means all assignments are "orphaned" - they reference deleted lessons');
    }

    // DEBUG: Pokaż które lesson IDs nie zostały znalezione
    const foundLessonIds = lessons?.map(l => l.id) || [];
    const missingLessonIds = lessonIds.filter(id => !foundLessonIds.includes(id));
    if (missingLessonIds.length > 0) {
      console.warn('🚨 [DEBUG] MISSING LESSON IDs:', missingLessonIds);
      console.warn('💡 These lesson IDs exist in student_lessons but NOT in lessons table');
      
      // DODATKOWE DEBUGGING: Sprawdź czy są w ogóle jakiekolwiek lekcje w systemie
      console.log('🔍 [DEBUG] Checking if ANY lessons exist in the system...');
      const { data: allLessons, count: totalLessonsCount } = await supabase
        .from('lessons')
        .select('id, title, tutor_id, status, is_published', { count: 'exact' });
        
      console.log('📊 [DEBUG] Total lessons in system:', totalLessonsCount);
      if (allLessons && allLessons.length > 0) {
        console.log('📚 [DEBUG] Sample lessons in system:');
        allLessons.slice(0, 5).forEach((lesson, index) => {
          console.log(`  ${index + 1}. ID: ${lesson.id}`);
          console.log(`     Title: "${lesson.title}"`);
          console.log(`     Tutor: ${lesson.tutor_id}`);
          console.log(`     Status: ${lesson.status} | Published: ${lesson.is_published}`);
        });
        
        // Sprawdź czy są lekcje dla tego studenta od jego tutorów
        console.log('🔍 [DEBUG] Looking for lessons from student\'s tutors...');
        const { data: studentTutors } = await supabase
          .from('tutor_students')
          .select('tutor_id')
          .eq('student_id', studentId);
          
        if (studentTutors && studentTutors.length > 0) {
          const tutorIds = studentTutors.map(rel => rel.tutor_id);
          console.log('👨‍🏫 [DEBUG] Student\'s tutors:', tutorIds);
          
          const { data: tutorLessons } = await supabase
            .from('lessons')
            .select('id, title, tutor_id')
            .in('tutor_id', tutorIds);
            
          console.log('📖 [DEBUG] Available lessons from student\'s tutors:');
          if (tutorLessons && tutorLessons.length > 0) {
            tutorLessons.forEach((lesson, index) => {
              console.log(`  ${index + 1}. "${lesson.title}" (ID: ${lesson.id})`);
            });
            console.log('💡 [SUGGESTION] These lessons could be assigned to the student!');
          } else {
            console.log('  ❌ No lessons found from student\'s tutors');
          }
        }
      } else {
        console.log('❌ [DEBUG] NO LESSONS EXIST in the entire system!');
        console.log('💡 [SUGGESTION] The tutor needs to create lessons first');
      }
    }

    // KROK 3: Pobierz dane tutorów (bez JOIN)
    const tutorIds = lessons?.map(lesson => lesson.tutor_id) || [];
    const uniqueTutorIds = [...new Set(tutorIds)];
    
    let tutors: any[] = [];
    if (uniqueTutorIds.length > 0) {
      console.log('🔍 [STUDENT API] Looking for tutor IDs:', uniqueTutorIds);
      
      const { data: tutorsData, error: tutorsError } = await supabase
        .from('users')
        .select('id, first_name, last_name, email')
        .in('id', uniqueTutorIds);

      if (tutorsError) {
        console.error('❌ [STUDENT API] Error fetching tutors:', tutorsError);
        throw tutorsError;
      }

      tutors = tutorsData || [];
      console.log('✅ [STUDENT API] Found', tutors?.length || 0, 'tutors');

      // DEBUG: Pokaż znalezionych tutorów
      if (tutors && tutors.length > 0) {
        console.log('👨‍🏫 [DEBUG] Tutors found in database:');
        tutors.forEach((tutor, index) => {
          console.log(`  ${index + 1}. Tutor ID: ${tutor.id}`);
          console.log(`     - Name: "${tutor.first_name} ${tutor.last_name}"`);
          console.log(`     - Email: ${tutor.email}`);
        });
      }
    } else {
      console.log('ℹ️ [STUDENT API] No tutors to fetch (no lessons found)');
    }

    // KROK 4: Połącz wszystkie dane (tak jak w tutorze) z debugowaniem
    console.log('🔗 [DEBUG] Starting data mapping...');
    const result: StudentLessonWithDetails[] = studentLessons.map((assignment, index) => {
      const lesson = lessons?.find(l => l.id === assignment.lesson_id);
      const tutor = tutors?.find(t => t.id === lesson?.tutor_id);

      console.log(`🔍 [DEBUG] Mapping assignment ${index + 1}:`);
      console.log(`  - Assignment lesson_id: ${assignment.lesson_id}`);
      console.log(`  - Found lesson: ${lesson ? 'YES' : 'NO'}`);
      if (lesson) {
        console.log(`  - Lesson title: "${lesson.title}"`);
        console.log(`  - Lesson tutor_id: ${lesson.tutor_id}`);
        console.log(`  - Found tutor: ${tutor ? 'YES' : 'NO'}`);
        if (tutor) {
          console.log(`  - Tutor name: "${tutor.first_name} ${tutor.last_name}"`);
        }
      }

      const mappedLesson = {
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

      console.log(`  ➡️ FINAL RESULT: "${mappedLesson.lesson.title}" by ${mappedLesson.lesson.tutor.first_name} ${mappedLesson.lesson.tutor.last_name}`);
      return mappedLesson;
    });

    console.log('✅ [STUDENT API] Successfully transformed', result.length, 'lessons');

    // FINAL SUMMARY
    console.log('📊 [DEBUG] FINAL SUMMARY:');
    console.log(`  - Total assignments: ${studentLessons.length}`);
    console.log(`  - Lessons found: ${lessons?.length || 0}`);
    console.log(`  - Tutors found: ${tutors.length}`);
    console.log(`  - Valid lessons: ${result.filter(r => r.lesson.title !== 'Unknown Lesson').length}`);
    console.log(`  - Unknown lessons: ${result.filter(r => r.lesson.title === 'Unknown Lesson').length}`);

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

      // Równoległe ładowanie danych (tak jak w tutorze)
      const [lessonsData, kpisData] = await Promise.all([
        getStudentLessonsReal(studentId),
        getStudentKPIsReal(studentId)
      ]);

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
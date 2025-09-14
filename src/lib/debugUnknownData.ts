// src/lib/debugUnknownData.ts - Debug dla "Unknown" problemów
import { supabase } from './supabase';

export async function debugUnknownDataProblem(studentId: string) {
  console.log('🔍 DEBUG: Investigating "Unknown" data problem for student:', studentId);

  try {
    // 1. Pobierz przypisania studenta
    const { data: assignments, error: assignmentsError } = await supabase
      .from('student_lessons')
      .select('*')
      .eq('student_id', studentId);

    console.log('📋 Student assignments:', assignments);
    if (assignmentsError) console.error('❌ Assignments error:', assignmentsError);

    if (!assignments || assignments.length === 0) {
      console.log('❌ No assignments found!');
      return;
    }

    // 2. Sprawdź każde przypisanie osobno
    for (const assignment of assignments) {
      console.log(`\n🔍 Checking assignment ${assignment.id}:`);
      console.log('  - lesson_id:', assignment.lesson_id);
      console.log('  - status:', assignment.status);

      // 3. Sprawdź czy lekcja istnieje
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', assignment.lesson_id)
        .single();

      if (lessonError) {
        console.error('❌ Lesson not found:', lessonError);
        console.log('💡 This explains "Unknown Lesson"');
      } else {
        console.log('✅ Lesson found:', lesson);
        console.log('  - title:', lesson.title);
        console.log('  - tutor_id:', lesson.tutor_id);

        // 4. Sprawdź czy tutor istnieje
        const { data: tutor, error: tutorError } = await supabase
          .from('users')
          .select('id, first_name, last_name, email, role')
          .eq('id', lesson.tutor_id)
          .single();

        if (tutorError) {
          console.error('❌ Tutor not found:', tutorError);
          console.log('💡 This explains "Unknown Tutor"');
        } else {
          console.log('✅ Tutor found:', tutor);
          console.log('  - name:', tutor.first_name, tutor.last_name);
          console.log('  - role:', tutor.role);
        }
      }
    }

    // 5. Sprawdź czy w ogóle są lekcje w systemie
    const { data: allLessons, count: lessonsCount } = await supabase
      .from('lessons')
      .select('id, title, tutor_id', { count: 'exact' });

    console.log('\n📚 All lessons in system:', lessonsCount);
    console.log('Sample lessons:', allLessons?.slice(0, 3));

    // 6. Sprawdź czy są tutorzy w systemie
    const { data: allTutors, count: tutorsCount } = await supabase
      .from('users')
      .select('id, first_name, last_name, role', { count: 'exact' })
      .eq('role', 'tutor');

    console.log('\n👨‍🏫 All tutors in system:', tutorsCount);
    console.log('Sample tutors:', allTutors?.slice(0, 3));

    // 7. Sprawdź relacje
    const lessonIds = assignments.map(a => a.lesson_id);
    const { data: orphanedAssignments } = await supabase
      .from('student_lessons')
      .select('lesson_id')
      .in('lesson_id', lessonIds)
      .not('lesson_id', 'in', `(${allLessons?.map(l => `'${l.id}'`).join(',') || ''})`);

    if (orphanedAssignments && orphanedAssignments.length > 0) {
      console.log('🚨 PROBLEM FOUND: Orphaned assignments (lessons that don\'t exist):');
      console.log(orphanedAssignments);
    }

    return {
      assignments,
      allLessons,
      allTutors,
      orphanedAssignments
    };

  } catch (error) {
    console.error('💥 Debug error:', error);
    throw error;
  }
}

// Dodaj to do StudentAPI żeby lepiej debugować
export async function getStudentLessonsRealWithDebug(studentId: string) {
  console.log('🔍 [DEBUG MODE] Loading lessons for:', studentId);

  // Najpierw uruchom debug
  await debugUnknownDataProblem(studentId);

  try {
    // KROK 1: Pobierz wszystkie przypisania studenta
    const { data: studentLessons, error: assignmentsError } = await supabase
      .from('student_lessons')
      .select('*')
      .eq('student_id', studentId)
      .order('assigned_at', { ascending: false });

    if (assignmentsError) {
      console.error('❌ [DEBUG] Error fetching assignments:', assignmentsError);
      throw assignmentsError;
    }

    console.log('✅ [DEBUG] Found', studentLessons?.length || 0, 'assignments');

    if (!studentLessons || studentLessons.length === 0) {
      return [];
    }

    // KROK 2: Pobierz szczegóły lekcji
    const lessonIds = studentLessons.map(assignment => assignment.lesson_id);
    console.log('🔍 [DEBUG] Looking for lesson IDs:', lessonIds);
    
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .in('id', lessonIds);

    if (lessonsError) {
      console.error('❌ [DEBUG] Error fetching lessons:', lessonsError);
    }

    console.log('✅ [DEBUG] Found lessons:', lessons?.length || 0, 'out of', lessonIds.length);
    
    // Sprawdź które lekcje nie zostały znalezione
    const foundLessonIds = lessons?.map(l => l.id) || [];
    const missingLessonIds = lessonIds.filter(id => !foundLessonIds.includes(id));
    if (missingLessonIds.length > 0) {
      console.error('🚨 [DEBUG] MISSING LESSONS:', missingLessonIds);
    }

    // KROK 3: Pobierz dane tutorów
    const tutorIds = lessons?.map(lesson => lesson.tutor_id) || [];
    const uniqueTutorIds = [...new Set(tutorIds)];
    console.log('🔍 [DEBUG] Looking for tutor IDs:', uniqueTutorIds);
    
    const { data: tutors, error: tutorsError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .in('id', uniqueTutorIds);

    if (tutorsError) {
      console.error('❌ [DEBUG] Error fetching tutors:', tutorsError);
    }

    console.log('✅ [DEBUG] Found tutors:', tutors?.length || 0, 'out of', uniqueTutorIds.length);

    // Sprawdź które tutorzy nie zostali znalezieni
    const foundTutorIds = tutors?.map(t => t.id) || [];
    const missingTutorIds = uniqueTutorIds.filter(id => !foundTutorIds.includes(id));
    if (missingTutorIds.length > 0) {
      console.error('🚨 [DEBUG] MISSING TUTORS:', missingTutorIds);
    }

    // KROK 4: Połącz dane z szczegółowym logowaniem
    const result = studentLessons.map(assignment => {
      const lesson = lessons?.find(l => l.id === assignment.lesson_id);
      const tutor = tutors?.find(t => t.id === lesson?.tutor_id);

      // Debug dla każdego przypisania
      console.log(`\n🔍 [DEBUG] Processing assignment ${assignment.id}:`);
      console.log('  - lesson_id:', assignment.lesson_id);
      console.log('  - lesson found:', !!lesson);
      console.log('  - lesson title:', lesson?.title || 'MISSING');
      console.log('  - tutor_id:', lesson?.tutor_id || 'MISSING');
      console.log('  - tutor found:', !!tutor);
      console.log('  - tutor name:', tutor ? `${tutor.first_name} ${tutor.last_name}` : 'MISSING');

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
          title: lesson?.title || '❌ MISSING LESSON DATA ❌',
          description: lesson?.description,
          content: lesson?.content || '',
          created_at: lesson?.created_at || assignment.assigned_at,
          tutor_id: lesson?.tutor_id || 'unknown',
          tutor: {
            first_name: tutor?.first_name || '❌ MISSING',
            last_name: tutor?.last_name || 'TUTOR DATA ❌',
            email: tutor?.email || ''
          }
        }
      };
    });

    console.log('✅ [DEBUG] Final result:', result.length, 'lessons processed');
    return result;

  } catch (error) {
    console.error('💥 [DEBUG] Complete failure:', error);
    throw error;
  }
}
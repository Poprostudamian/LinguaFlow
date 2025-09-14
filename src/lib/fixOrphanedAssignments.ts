// src/lib/fixOrphanedAssignments.ts - Napraw nieprawidłowe przypisania
import { supabase } from './supabase';

/**
 * Usuń orphaned assignments - przypisania do nieistniejących lekcji
 */
export async function cleanupOrphanedAssignments(studentId: string) {
  try {
    console.log('🧹 Starting cleanup of orphaned assignments for student:', studentId);

    // 1. Pobierz wszystkie przypisania studenta
    const { data: studentAssignments, error: assignmentsError } = await supabase
      .from('student_lessons')
      .select('id, lesson_id, assigned_at')
      .eq('student_id', studentId);

    if (assignmentsError) throw assignmentsError;

    console.log('📋 Found', studentAssignments?.length || 0, 'assignments');

    if (!studentAssignments || studentAssignments.length === 0) {
      console.log('✅ No assignments to check');
      return { removedCount: 0, keptCount: 0 };
    }

    // 2. Sprawdź które lekcje rzeczywiście istnieją
    const lessonIds = studentAssignments.map(a => a.lesson_id);
    const { data: existingLessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id')
      .in('id', lessonIds);

    if (lessonsError) throw lessonsError;

    const existingLessonIds = existingLessons?.map(l => l.id) || [];
    console.log('✅ Found', existingLessonIds.length, 'existing lessons out of', lessonIds.length);

    // 3. Znajdź orphaned assignments
    const orphanedAssignments = studentAssignments.filter(
      assignment => !existingLessonIds.includes(assignment.lesson_id)
    );

    console.log('🚨 Found', orphanedAssignments.length, 'orphaned assignments');

    if (orphanedAssignments.length === 0) {
      console.log('✅ No orphaned assignments to remove');
      return { removedCount: 0, keptCount: studentAssignments.length };
    }

    // 4. Usuń orphaned assignments
    console.log('🗑️ Removing orphaned assignments:');
    orphanedAssignments.forEach(assignment => {
      console.log(`  - Assignment ${assignment.id} -> Lesson ${assignment.lesson_id} (assigned ${assignment.assigned_at})`);
    });

    const orphanedIds = orphanedAssignments.map(a => a.id);
    const { error: deleteError } = await supabase
      .from('student_lessons')
      .delete()
      .in('id', orphanedIds);

    if (deleteError) throw deleteError;

    const removedCount = orphanedAssignments.length;
    const keptCount = studentAssignments.length - removedCount;

    console.log('✅ Cleanup completed:');
    console.log(`  - Removed: ${removedCount} orphaned assignments`);
    console.log(`  - Kept: ${keptCount} valid assignments`);

    return { removedCount, keptCount };

  } catch (error) {
    console.error('💥 Error during cleanup:', error);
    throw error;
  }
}

/**
 * Alternatywnie: Stwórz testowe lekcje dla orphaned assignments
 */
export async function createMissingLessons(studentId: string) {
  try {
    console.log('🔧 Creating missing lessons for student:', studentId);

    // 1. Znajdź missing lesson IDs
    const { data: studentAssignments } = await supabase
      .from('student_lessons')
      .select('lesson_id, assigned_at, status')
      .eq('student_id', studentId);

    if (!studentAssignments || studentAssignments.length === 0) {
      console.log('No assignments found');
      return;
    }

    const lessonIds = studentAssignments.map(a => a.lesson_id);
    const { data: existingLessons } = await supabase
      .from('lessons')
      .select('id')
      .in('id', lessonIds);

    const existingLessonIds = existingLessons?.map(l => l.id) || [];
    const missingLessonIds = lessonIds.filter(id => !existingLessonIds.includes(id));

    console.log('🚨 Missing lesson IDs:', missingLessonIds);

    if (missingLessonIds.length === 0) {
      console.log('✅ No missing lessons to create');
      return;
    }

    // 2. Znajdź pierwszego dostępnego tutora
    const { data: tutors } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .eq('role', 'tutor')
      .limit(1);

    if (!tutors || tutors.length === 0) {
      throw new Error('No tutors found to assign missing lessons');
    }

    const tutor = tutors[0];
    console.log('👨‍🏫 Using tutor:', tutor.first_name, tutor.last_name);

    // 3. Stwórz missing lessons
    const lessonsToCreate = missingLessonIds.map((lessonId, index) => ({
      id: lessonId, // Użyj oryginalnego ID
      tutor_id: tutor.id,
      title: `Recovered Lesson ${index + 1}`,
      description: `This lesson was automatically recovered from orphaned assignment.`,
      content: `Welcome to your recovered lesson! This lesson was recreated because the original was missing.`,
      status: 'published',
      is_published: true
    }));

    const { data: createdLessons, error: createError } = await supabase
      .from('lessons')
      .insert(lessonsToCreate)
      .select();

    if (createError) throw createError;

    console.log('✅ Created', createdLessons?.length || 0, 'missing lessons');
    console.log('Lessons created:', createdLessons?.map(l => ({ id: l.id, title: l.title })));

    return createdLessons;

  } catch (error) {
    console.error('💥 Error creating missing lessons:', error);
    throw error;
  }
}

/**
 * Kompletne rozwiązanie problemu
 */
export async function fixStudentLessonsIssue(studentId: string, method: 'cleanup' | 'recreate' = 'cleanup') {
  try {
    console.log(`🔧 Fixing student lessons issue using method: ${method}`);

    if (method === 'cleanup') {
      // Metoda 1: Usuń orphaned assignments
      const result = await cleanupOrphanedAssignments(studentId);
      console.log('🧹 Cleanup result:', result);
      return result;
    } else {
      // Metoda 2: Stwórz missing lessons
      const result = await createMissingLessons(studentId);
      console.log('🔧 Recreation result:', result);
      return result;
    }

  } catch (error) {
    console.error('💥 Error fixing student lessons issue:', error);
    throw error;
  }
}
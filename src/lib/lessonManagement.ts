// src/lib/lessonManagement.ts - API do zarządzania lekcjami

import { supabase } from './supabase';

export interface LessonWithStats {
  id: string;
  title: string;
  description: string;
  content: string;
  status: 'draft' | 'published';
  is_published: boolean;
  created_at: string;
  updated_at: string;
  tutor_id: string;
  assignedCount: number;
  completedCount: number;
  assignedStudents: string[];
}

export interface CreateLessonInput {
  title: string;
  description?: string;
  content: string;
  assignedStudentIds: string[];
  status?: 'draft' | 'published';
}

// Pobierz wszystkie lekcje tutora z statystykami
export async function getTutorLessonsWithStats(tutorId: string): Promise<LessonWithStats[]> {
  try {
    // Pobierz lekcje tutora
   const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .eq('tutor_id', tutorId)
      .order('updated_at', { ascending: false });

    if (lessonsError) throw lessonsError;

    if (!lessons || lessons.length === 0) {
      return [];
    }

    // Dla każdej lekcji pobierz statystyki przypisań
    const lessonsWithStats = await Promise.all(
      lessons.map(async (lesson) => {
        const { data: assignments } = await supabase
          .from('student_lessons')
          .select('student_id, status')
          .eq('lesson_id', lesson.id);

        const assignedCount = assignments?.length || 0;
        const completedCount = assignments?.filter(a => a.status === 'completed').length || 0;
        const assignedStudents = assignments?.map(a => a.student_id) || [];

        return {
          id: lesson.id,
          title: lesson.title,
          description: lesson.description || '',
          content: lesson.content || '',
          status: lesson.status as 'draft' | 'published',
          is_published: lesson.is_published || false,
          created_at: lesson.created_at,
          updated_at: lesson.updated_at,
          tutor_id: lesson.tutor_id,
          assignedCount,
          completedCount,
          assignedStudents
        };
      })
    );

    return lessonsWithStats;
  } catch (error) {
    console.error('Error fetching tutor lessons:', error);
    throw error;
  }
}

// Utwórz nową lekcję i przypisz ją studentom
export async function createLessonWithAssignments(
  tutorId: string, 
  lessonData: CreateLessonInput
): Promise<string> {
  try {
    // Rozpocznij transakcję
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .insert({
        tutor_id: tutorId,
        title: lessonData.title,
        description: lessonData.description,
        content: lessonData.content,
        status: lessonData.status || 'published',
        is_published: (lessonData.status || 'published') === 'published'
      })
      .select()
      .single();

    if (lessonError) throw lessonError;

    const lessonId = lesson.id;

    // Przypisz lekcję do wybranych studentów
    if (lessonData.assignedStudentIds.length > 0) {
      const assignments = lessonData.assignedStudentIds.map(studentId => ({
        lesson_id: lessonId,
        student_id: studentId,
        status: 'assigned' as const,
        progress: 0,
        score: null,
        time_spent: 0
      }));

      const { error: assignmentError } = await supabase
        .from('student_lessons')
        .insert(assignments);

      if (assignmentError) throw assignmentError;
    }

    console.log(`Created lesson ${lessonId} and assigned to ${lessonData.assignedStudentIds.length} students`);
    return lessonId;
  } catch (error) {
    console.error('Error creating lesson with assignments:', error);
    throw error;
  }
}

// Zaktualizuj lekcję
export async function updateLesson(
  lessonId: string,
  updates: Partial<CreateLessonInput>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('lessons')
      .update({
        title: updates.title,
        description: updates.description,
        content: updates.content,
        status: updates.status,
        is_published: updates.status === 'published',
        updated_at: new Date().toISOString()
      })
      .eq('id', lessonId);

    if (error) throw error;

    // Jeśli zmieniono przypisania studentów
    if (updates.assignedStudentIds !== undefined) {
      // Usuń stare przypisania
      await supabase
        .from('student_lessons')
        .delete()
        .eq('lesson_id', lessonId);

      // Dodaj nowe przypisania
      if (updates.assignedStudentIds.length > 0) {
        const assignments = updates.assignedStudentIds.map(studentId => ({
          lesson_id: lessonId,
          student_id: studentId,
          status: 'assigned' as const,
          progress: 0
        }));

        const { error: assignmentError } = await supabase
          .from('student_lessons')
          .insert(assignments);

        if (assignmentError) throw assignmentError;
      }
    }
  } catch (error) {
    console.error('Error updating lesson:', error);
    throw error;
  }
}

// Usuń lekcję i wszystkie jej przypisania
export async function deleteLesson(lessonId: string): Promise<void> {
  try {
    // Usuń najpierw przypisania (dzięki CASCADE powinno się usunąć automatycznie)
    const { error: assignmentError } = await supabase
      .from('student_lessons')
      .delete()
      .eq('lesson_id', lessonId);

    if (assignmentError) throw assignmentError;

    // Usuń lekcję
    const { error: lessonError } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId);

    if (lessonError) throw lessonError;

    console.log(`Deleted lesson ${lessonId} and all assignments`);
  } catch (error) {
    console.error('Error deleting lesson:', error);
    throw error;
  }
}

// Oznacz lekcję jako ukończoną przez studenta
export async function completeLesson(
  lessonId: string,
  studentId: string,
  score: number,
  timeSpent: number
): Promise<void> {
  try {
    const { error } = await supabase
      .from('student_lessons')
      .update({
        status: 'completed',
        score: score,
        progress: score, // progress = score
        time_spent: timeSpent,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('lesson_id', lessonId)
      .eq('student_id', studentId);

    if (error) throw error;

    console.log(`Student ${studentId} completed lesson ${lessonId} with score ${score}`);
  } catch (error) {
    console.error('Error completing lesson:', error);
    throw error;
  }
}

// Rozpocznij lekcję (zmień status na in_progress)
export async function startLesson(lessonId: string, studentId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('student_lessons')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('lesson_id', lessonId)
      .eq('student_id', studentId);

    if (error) throw error;

    console.log(`Student ${studentId} started lesson ${lessonId}`);
  } catch (error) {
    console.error('Error starting lesson:', error);
    throw error;
  }
}

// Pobierz lekcje przypisane do konkretnego studenta
export async function getStudentLessons(studentId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
  .from('student_lessons')
  .select(`
    *,
    lessons (
      id,
      title,
      description,
      content,
      created_at,
      tutor:tutor_id (
        id,
        first_name,
        last_name
      )
    )
  `)
  .eq('student_id', studentId)
  .order('assigned_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching student lessons:', error);
    throw error;
  }
}

// Symulacja ukończenia lekcji (dla testów)
export async function simulateRandomCompletions(tutorId: string): Promise<void> {
  try {
    // Pobierz wszystkie przypisania w statusie 'assigned' dla tego tutora
    const { data: assignments } = await supabase
      .from('student_lessons')
      .select(`
        lesson_id,
        student_id,
        lessons!inner (tutor_id)
      `)
      .eq('status', 'assigned')
      .eq('lessons.tutor_id', tutorId);

    if (!assignments || assignments.length === 0) {
      console.log('No assignments to simulate completion for');
      return;
    }

    // Losowo ukończ część przypisań
    const toComplete = assignments.slice(0, Math.floor(assignments.length / 2));

    await Promise.all(
      toComplete.map(async (assignment) => {
        const randomScore = 60 + Math.floor(Math.random() * 40); // 60-100
        const randomTime = 20 + Math.floor(Math.random() * 40); // 20-60 minut

        await completeLesson(
          assignment.lesson_id,
          assignment.student_id,
          randomScore,
          randomTime
        );
      })
    );

    console.log(`Simulated completion of ${toComplete.length} lessons`);
  } catch (error) {
    console.error('Error simulating completions:', error);
    throw error;
  }
}
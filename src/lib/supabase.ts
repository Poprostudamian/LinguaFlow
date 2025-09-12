// src/lib/supabase.ts - KOMPLETNIE NAPRAWIONY

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Authentication types
export interface AuthUser {
  id: string
  email: string
  role: 'student' | 'tutor'
  first_name?: string
  last_name?: string
  avatar_url?: string
}

export interface SignUpData {
  email: string
  password: string
  first_name: string
  last_name: string
  role: 'student' | 'tutor'
}

export interface SignInData {
  email: string
  password: string
}

// STEP 2 INTERFACES
export interface UserRelationship {
  id: string
  tutor_id: string
  student_id: string
  created_at: string
  updated_at: string
  is_active: boolean
  notes?: string
}

export interface RelationshipInvitation {
  id: string
  tutor_id: string
  student_email: string
  student_id?: string
  invitation_token: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  invited_at: string
  responded_at?: string
  expires_at: string
  message?: string
}

export interface TutorStudent {
  relationship_id: string
  tutor_id: string
  tutor_first_name: string
  tutor_last_name: string
  student_id: string
  student_first_name: string
  student_last_name: string
  student_email: string
  relationship_created: string
  notes?: string
  is_active: boolean
}

// Authentication helper functions
export const signUp = async (data: SignUpData) => {
  console.log('🔄 Starting signup process for:', data.email);
  
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        first_name: data.first_name,
        last_name: data.last_name,
        role: data.role,
      }
    }
  });

  if (authError) {
    console.error('❌ Auth signup failed:', authError);
    throw authError;
  }

  console.log('✅ Auth signup successful:', authData.user?.email);
  return authData;
}

export const signIn = async (data: SignInData) => {
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) throw error;
  return authData;
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  // Spróbuj pobrać dane z tabeli users
  const { data: userData, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (error || !userData) {
    console.log('⚠️ User not found in public.users, using auth data as fallback');
    
    // BACKUP: Spróbuj dodać użytkownika do public.users (teraz gdy jest zalogowany)
    if (!error || error.code === 'PGRST116') { // PGRST116 = not found
      try {
        console.log('🔄 Attempting to create user record...');
        
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email || '',
            password_hash: 'managed_by_supabase_auth',
            first_name: user.user_metadata?.first_name || 'User',
            last_name: user.user_metadata?.last_name || '',
            role: (user.user_metadata?.role as 'student' | 'tutor') || 'student'
          });

        if (!insertError) {
          console.log('✅ Successfully created user record');
          
          const { data: newUserData } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();
            
          if (newUserData) {
            return {
              id: newUserData.id,
              email: newUserData.email,
              role: newUserData.role,
              first_name: newUserData.first_name,
              last_name: newUserData.last_name,
              avatar_url: newUserData.avatar_url,
            };
          }
        } else {
          console.error('❌ Failed to create user record:', insertError);
        }
      } catch (backupError) {
        console.error('❌ Backup user creation failed:', backupError);
      }
    }
    
    // Fallback to auth user data
    return {
      id: user.id,
      email: user.email || '',
      role: (user.user_metadata?.role as 'student' | 'tutor') || 'student',
      first_name: user.user_metadata?.first_name,
      last_name: user.user_metadata?.last_name,
      avatar_url: user.user_metadata?.avatar_url,
    }
  }

  return {
    id: userData.id,
    email: userData.email,
    role: userData.role,
    first_name: userData.first_name,
    last_name: userData.last_name,
    avatar_url: userData.avatar_url,
  }
}

// STEP 2 FUNCTIONS

// Get all students for a tutor
export const getTutorStudents = async () => {
  console.log('🔍 Getting tutor students...');
  
  // Krok 1: Pobierz relacje
  const { data: relationships, error: relError } = await supabase
    .from('user_relationships')
    .select('id, tutor_id, student_id, created_at, status, is_active, notes')
    .eq('status', 'accepted')
    .eq('is_active', true);

  if (relError) {
    console.error('❌ Error getting relationships:', relError);
    throw relError;
  }

  console.log('Relationships:', relationships);

  if (!relationships || relationships.length === 0) {
    return [];
  }

  // Krok 2: Pobierz dane studentów
  const studentIds = relationships.map(r => r.student_id);
  
  const { data: students, error: studentsError } = await supabase
    .from('users')
    .select('id, first_name, last_name, email')
    .in('id', studentIds);

  if (studentsError) {
    console.error('❌ Error getting students:', studentsError);
    throw studentsError;
  }

  console.log('Students:', students);

  // Krok 3: Połącz dane
  const transformedData = relationships.map(rel => {
    const student = students?.find(s => s.id === rel.student_id);
    console.log(`Matching student for ${rel.student_id}:`, student);
    
    return {
      relationship_id: rel.id,
      tutor_id: rel.tutor_id,
      tutor_first_name: '',
      tutor_last_name: '',
      student_id: rel.student_id,
      student_first_name: student?.first_name || 'Unknown',
      student_last_name: student?.last_name || 'Student',
      student_email: student?.email || '',
      relationship_created: rel.created_at,
      status: rel.status,
      notes: rel.notes,
      is_active: rel.is_active
    };
  });

  console.log('Final transformed data:', transformedData);
  return transformedData as TutorStudent[];
}

// Get all invitations sent by tutor
export const getTutorInvitations = async () => {
  console.log('🔍 Getting tutor invitations...');
  
  const { data, error } = await supabase
    .from('relationship_invitations')
    .select('*')
    .order('invited_at', { ascending: false });

  if (error) {
    console.error('❌ Error getting invitations:', error);
    throw error;
  }
  
  console.log('✅ Found', data?.length || 0, 'invitations');
  return data as RelationshipInvitation[];
}

// Send invitation to student by email
export const sendStudentInvitation = async (studentEmail: string, message?: string) => {
  console.log('📧 Sending invitation to:', studentEmail);
  
  const { data, error } = await supabase
    .from('relationship_invitations')
    .insert({
      student_email: studentEmail.toLowerCase().trim(),
      message: message?.trim() || null
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error sending invitation:', error);
    throw error;
  }
  
  console.log('✅ Invitation sent successfully');
  return data;
}

// Check if email is already a student
export const findStudentByEmail = async (email: string) => {
  console.log('🔍 Looking for student:', email);
  
  const { data, error } = await supabase
    .from('users')
    .select('id, first_name, last_name, email')
    .eq('email', email.toLowerCase().trim())
    .eq('role', 'student')
    .maybeSingle();

  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    console.error('❌ Error finding student:', error);
    throw error;
  }
  
  if (data) {
    console.log('✅ Found existing student:', data.first_name, data.last_name);
  } else {
    console.log('ℹ️ Student not found, they can register later');
  }
  
  return data;
}

// Get all tutors for a student
export const getStudentTutors = async () => {
  console.log('🔍 Getting student tutors...');
  
  const { data, error } = await supabase
    .from('user_relationships')
    .select(`
      id,
      tutor_id,
      created_at,
      notes,
      is_active,
      tutors:users!tutor_id (
        id,
        first_name,
        last_name,
        email,
        avatar_url
      )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error getting student tutors:', error);
    throw error;
  }
  
  console.log('✅ Found', data?.length || 0, 'tutors');
  return data;
}

// Lesson types
export interface Lesson {
  id: string;
  tutor_id: string;
  title: string;
  description: string | null;
  content: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  is_published: boolean;
}

export interface StudentLesson {
  id: string;
  student_id: string;
  lesson_id: string;
  assigned_at: string;
  completed_at: string | null;
  status: 'assigned' | 'in_progress' | 'completed';
  progress: number;
}

export interface LessonWithAssignments extends Lesson {
  assignedCount: number;
  completedCount: number;
  assignedStudents: string[];
  student_lessons: StudentLesson[];
}

export interface CreateLessonData {
  title: string;
  description?: string;
  content: string;
  assignedStudentIds: string[];
  status?: 'draft' | 'published';
}

export interface UpdateLessonData {
  title?: string;
  description?: string;
  content?: string;
  status?: 'draft' | 'published';
}

// Lesson API functions

/**
 * Get all lessons for a tutor with assignment information
 */
// ZAMIEŃ funkcję getTutorLessons w src/lib/supabase.ts na tę poprawioną wersję:

/**
 * Get all lessons for a tutor with assignment information - NAPRAWIONA WERSJA
 */
export const getTutorLessons = async (tutorId: string): Promise<LessonWithAssignments[]> => {
  try {
    console.log('🔍 Getting lessons for tutor:', tutorId);
    
    // KROK 1: Pobierz wszystkie lekcje tutora (bez JOIN)
    const { data: allLessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .eq('tutor_id', tutorId)
      .order('updated_at', { ascending: false });

    if (lessonsError) {
      console.error('❌ Error fetching lessons:', lessonsError);
      throw lessonsError;
    }

    console.log('✅ Found', allLessons?.length || 0, 'lessons');

    if (!allLessons || allLessons.length === 0) {
      return [];
    }

    // KROK 2: Pobierz przypisania dla tych lekcji
    const lessonIds = allLessons.map(lesson => lesson.id);
    
    const { data: assignments, error: assignmentsError } = await supabase
      .from('student_lessons')
      .select('lesson_id, student_id, status, completed_at, progress')
      .in('lesson_id', lessonIds);

    if (assignmentsError) {
      console.error('❌ Error fetching assignments:', assignmentsError);
      // Nie rzucamy błędu - lekcje mogą nie mieć przypisań
    }

    console.log('✅ Found', assignments?.length || 0, 'assignments');

    // KROK 3: Połącz dane
    const transformedLessons: LessonWithAssignments[] = allLessons.map(lesson => {
      const lessonAssignments = (assignments || []).filter(a => a.lesson_id === lesson.id);
      const assignedStudents = lessonAssignments.map(a => a.student_id);
      const completedCount = lessonAssignments.filter(a => a.status === 'completed').length;

      return {
        id: lesson.id,
        tutor_id: lesson.tutor_id,
        title: lesson.title,
        description: lesson.description,
        content: lesson.content,
        status: lesson.status,
        created_at: lesson.created_at,
        updated_at: lesson.updated_at,
        is_published: lesson.is_published,
        assignedCount: lessonAssignments.length,
        completedCount,
        assignedStudents,
        student_lessons: lessonAssignments
      };
    });

    console.log('✅ Transformed', transformedLessons.length, 'lessons');
    return transformedLessons;

  } catch (error) {
    console.error('❌ Error fetching tutor lessons:', error);
    throw error;
  }
};

/**
 * Create a new lesson and assign to students
 */
export const createLesson = async (tutorId: string, lessonData: CreateLessonData): Promise<Lesson> => {
  try {
    // Start a transaction by creating the lesson first
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .insert([{
        tutor_id: tutorId,
        title: lessonData.title,
        description: lessonData.description || null,
        content: lessonData.content,
        status: lessonData.status || 'published',
        is_published: (lessonData.status || 'published') === 'published'
      }])
      .select()
      .single();

    if (lessonError) throw lessonError;

    // If there are students to assign, create student_lessons records
    if (lessonData.assignedStudentIds.length > 0) {
      const studentLessonsData = lessonData.assignedStudentIds.map(studentId => ({
        lesson_id: lesson.id,
        student_id: studentId,
        status: 'assigned' as const,
        progress: 0
      }));

      const { error: assignmentError } = await supabase
        .from('student_lessons')
        .insert(studentLessonsData);

      if (assignmentError) {
        // If assignment fails, we might want to delete the lesson or handle it differently
        console.error('Error assigning lesson to students:', assignmentError);
        // For now, we'll continue and just log the error
        // In production, you might want to implement compensation logic
      }
    }

    return lesson;
  } catch (error) {
    console.error('Error creating lesson:', error);
    throw error;
  }
};

/**
 * Update an existing lesson
 */
export const updateLesson = async (lessonId: string, lessonData: UpdateLessonData): Promise<Lesson> => {
  try {
    const updateData: any = {
      ...lessonData,
      updated_at: new Date().toISOString()
    };

    // Update is_published based on status if status is provided
    if (lessonData.status) {
      updateData.is_published = lessonData.status === 'published';
    }

    const { data: lesson, error } = await supabase
      .from('lessons')
      .update(updateData)
      .eq('id', lessonId)
      .select()
      .single();

    if (error) throw error;
    return lesson;
  } catch (error) {
    console.error('Error updating lesson:', error);
    throw error;
  }
};

/**
 * Delete a lesson (and all its assignments)
 */
export const deleteLesson = async (lessonId: string): Promise<void> => {
  try {
    // First delete all student_lessons assignments
    const { error: assignmentsError } = await supabase
      .from('student_lessons')
      .delete()
      .eq('lesson_id', lessonId);

    if (assignmentsError) throw assignmentsError;

    // Then delete the lesson
    const { error: lessonError } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId);

    if (lessonError) throw lessonError;
  } catch (error) {
    console.error('Error deleting lesson:', error);
    throw error;
  }
};

/**
 * Assign lesson to additional students
 */
export const assignLessonToStudents = async (lessonId: string, studentIds: string[]) => {
  try {
    // 1. Najpierw sprawdź które studenci już są przypisani do tej lekcji
    const { data: existingAssignments, error: checkError } = await supabase
      .from('student_lessons')
      .select('student_id')
      .eq('lesson_id', lessonId)
      .in('student_id', studentIds)

    if (checkError) {
      console.error('Error checking existing assignments:', checkError)
      throw checkError
    }

    // 2. Odfiltruj studentów, którzy już są przypisani
    const existingStudentIds = existingAssignments?.map(row => row.student_id) || []
    const newStudentIds = studentIds.filter(id => !existingStudentIds.includes(id))

    // 3. Jeśli są nowi studenci do przypisania, dodaj ich
    if (newStudentIds.length > 0) {
      const assignmentsToCreate = newStudentIds.map(studentId => ({
        lesson_id: lessonId,
        student_id: studentId,
        assigned_at: new Date().toISOString(),
        status: 'assigned' as const
      }))

      const { data, error } = await supabase
        .from('student_lessons')
        .insert(assignmentsToCreate)
        .select()

      if (error) {
        console.error('Error assigning lesson to students:', error)
        throw error
      }

      return { 
        data, 
        newAssignments: newStudentIds.length, 
        skipped: existingStudentIds.length,
        assignedStudents: newStudentIds,
        skippedStudents: existingStudentIds
      }
    }

    return { 
      data: null, 
      newAssignments: 0, 
      skipped: existingStudentIds.length,
      assignedStudents: [],
      skippedStudents: existingStudentIds
    }
  } catch (error) {
    console.error('Error in assignLessonToStudents:', error)
    throw error
  }
};
/**
 * Remove lesson assignment from students
 */
export const unassignLessonFromStudents = async (lessonId: string, studentIds: string[]): Promise<void> => {
  try {
    const { error } = await supabase
      .from('student_lessons')
      .delete()
      .eq('lesson_id', lessonId)
      .in('student_id', studentIds);

    if (error) throw error;
  } catch (error) {
    console.error('Error unassigning lesson from students:', error);
    throw error;
  }
};

/**
 * Get lessons assigned to a student
 */
export const getStudentLessons = async (studentId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('student_lessons')
      .select(`
        *,
        lessons!inner(
          id,
          title,
          description,
          content,
          status,
          created_at,
          updated_at,
          tutor_id,
          users!lessons_tutor_id_fkey(
            first_name,
            last_name,
            email
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
};

/**
 * Update student's progress on a lesson
 */
export const updateStudentLessonProgress = async (
  studentId: string, 
  lessonId: string, 
  progress: number,
  status?: 'assigned' | 'in_progress' | 'completed'
): Promise<void> => {
  try {
    const updateData: any = {
      progress,
      updated_at: new Date().toISOString()
    };

    if (status) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
    }

    const { error } = await supabase
      .from('student_lessons')
      .update(updateData)
      .eq('student_id', studentId)
      .eq('lesson_id', lessonId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating student lesson progress:', error);
    throw error;
  }
};

export interface StudentStats {
  student_id: string;
  total_lessons: number;
  completed_lessons: number;
  in_progress_lessons: number;
  total_study_time_minutes: number;
  average_progress: number;
  last_activity: string | null;
}

/**
 * Get comprehensive stats for a student
 */
export const getStudentStats = async (studentId: string): Promise<StudentStats> => {
  try {
    // Get lesson assignments and progress
    const { data: studentLessons, error } = await supabase
      .from('student_lessons')
      .select(`
        lesson_id,
        status,
        progress,
        assigned_at,
        completed_at,
        updated_at
      `)
      .eq('student_id', studentId);

    if (error) throw error;

    const lessons = studentLessons || [];
    
    // Calculate stats
    const totalLessons = lessons.length;
    const completedLessons = lessons.filter(l => l.status === 'completed').length;
    const inProgressLessons = lessons.filter(l => l.status === 'in_progress').length;
    
    // Calculate average progress
    const averageProgress = totalLessons > 0 
      ? Math.round(lessons.reduce((sum, l) => sum + l.progress, 0) / totalLessons)
      : 0;

    // Calculate study time (estimate: 1% progress = 1 minute)
    const totalStudyTimeMinutes = lessons.reduce((sum, l) => sum + l.progress, 0);

    // Find last activity
    const lastActivity = lessons.length > 0 
      ? lessons
          .map(l => l.updated_at)
          .sort()
          .reverse()[0]
      : null;

    return {
      student_id: studentId,
      total_lessons: totalLessons,
      completed_lessons: completedLessons,
      in_progress_lessons: inProgressLessons,
      total_study_time_minutes: totalStudyTimeMinutes,
      average_progress: averageProgress,
      last_activity: lastActivity
    };

  } catch (error) {
    console.error('Error fetching student stats:', error);
    throw error;
  }
};

/**
 * Get stats for multiple students (for tutor dashboard)
 */
export const getStudentsStats = async (studentIds: string[]): Promise<StudentStats[]> => {
  if (studentIds.length === 0) return [];

  try {
    const statsPromises = studentIds.map(id => getStudentStats(id));
    const results = await Promise.all(statsPromises);
    return results;
  } catch (error) {
    console.error('Error fetching students stats:', error);
    throw error;
  }
};

// ===== DODAJ TO NA KOŃCU PLIKU src/lib/supabase.ts =====

// Export aliases for StudentsContext compatibility
export interface InviteStudentData {
  studentEmail: string;
  message?: string;
}

/**
 * Alias for sendStudentInvitation to match StudentsContext expectations
 */
export const inviteStudent = async (tutorId: string, inviteData: InviteStudentData) => {
  return sendStudentInvitation(inviteData.studentEmail, inviteData.message);
};

/**
 * Alias for getTutorStudentStats to match StudentsContext expectations
 */
export const getTutorStudentStats = async (tutorId: string) => {
  try {
    // Get total students count
    const { count: totalStudents, error: studentsError } = await supabase
      .from('user_relationships')
      .select('*', { count: 'exact', head: true })
      .eq('tutor_id', tutorId)
      .eq('status', 'accepted')
      .eq('is_active', true);

    if (studentsError) throw studentsError;

    // Get active students (those who logged in recently)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: activeStudents, error: activeError } = await supabase
      .from('user_relationships')
      .select(`
        student:users!student_id (
          last_login
        )
      `, { count: 'exact', head: true })
      .eq('tutor_id', tutorId)
      .eq('status', 'accepted')
      .eq('is_active', true)
      .gte('student.last_login', thirtyDaysAgo);

    if (activeError) throw activeError;

    // Get pending invitations count
    const { count: pendingInvitations, error: invitationsError } = await supabase
      .from('relationship_invitations')
      .select('*', { count: 'exact', head: true })
      .eq('tutor_id', tutorId)
      .eq('status', 'pending')
      .gte('expires_at', new Date().toISOString());

    if (invitationsError) throw invitationsError;

    return {
      totalStudents: totalStudents || 0,
      activeStudents: activeStudents || 0,
      pendingInvitations: pendingInvitations || 0
    };
  } catch (error) {
    console.error('Error fetching student stats:', error);
    return {
      totalStudents: 0,
      activeStudents: 0,
      pendingInvitations: 0
    };
  }
};

/**
 * Search students wrapper for StudentsContext
 */
export const searchTutorStudents = async (tutorId: string, searchTerm: string): Promise<TutorStudent[]> => {
  // For now, just return all students - you can enhance this later with actual search
  const allStudents = await getTutorStudents();
  
  if (!searchTerm.trim()) {
    return allStudents;
  }
  
  const lowerQuery = searchTerm.toLowerCase();
  return allStudents.filter(student => {
    const fullName = `${student.student_first_name} ${student.student_last_name}`.toLowerCase();
    const email = student.student_email.toLowerCase();
    return fullName.includes(lowerQuery) || email.includes(lowerQuery);
  });
};

// ===== DODAJ TO DO src/lib/supabase.ts =====

// Typy ćwiczeń
export interface ExerciseType {
  id: string;
  name: 'multiple_choice' | 'flashcard' | 'text_answer';
  display_name: string;
  description?: string;
}

export interface LessonExercise {
  id: string;
  lesson_id: string;
  exercise_type: 'multiple_choice' | 'flashcard' | 'text_answer';
  title: string;
  question: string;
  correct_answer?: string;
  options?: string[]; // dla ABCD
  explanation?: string;
  order_number: number;
  points: number;
  created_at: string;
}

// Rozszerz CreateLessonData
export interface CreateLessonData {
  title: string;
  description?: string;
  content: string;
  assignedStudentIds: string[];
  status?: 'draft' | 'published';
  exercises?: {
    type: 'multiple_choice' | 'flashcard' | 'text_answer';
    title: string;
    question: string;
    correct_answer?: string;
    options?: string[]; // dla ABCD
    explanation?: string;
    points?: number;
  }[];
}

// Funkcja do tworzenia ćwiczeń
export const createLessonExercises = async (lessonId: string, exercises: any[]) => {
  if (exercises.length === 0) return;

  const exercisesData = exercises.map((exercise, index) => ({
    lesson_id: lessonId,
    exercise_type: exercise.type,
    title: exercise.title,
    question: exercise.question,
    correct_answer: exercise.correct_answer,
    options: exercise.options ? JSON.stringify(exercise.options) : null,
    explanation: exercise.explanation,
    order_number: index + 1,
    points: exercise.points || 1
  }));

  const { error } = await supabase
    .from('lesson_exercises')
    .insert(exercisesData);

  if (error) throw error;
};

// Funkcja do pobierania ćwiczeń lekcji
export const getLessonExercises = async (lessonId: string): Promise<LessonExercise[]> => {
  const { data, error } = await supabase
    .from('lesson_exercises')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('order_number');

  if (error) {
    console.error('Error fetching lesson exercises:', error);
    throw error;
  }

  return (data || []).map(exercise => ({
    ...exercise,
    options: exercise.options ? JSON.parse(exercise.options) : null
  }));
};
// Dodaj te interfejsy i funkcje do swojego pliku src/lib/supabase.ts

// Messages interfaces (dodaj po istniejących interfejsach)
export interface Conversation {
  id: string
  tutor_id: string
  student_id: string
  created_at: string
  updated_at: string
  last_message_at: string
  tutor_last_read_at: string
  student_last_read_at: string
  is_active: boolean
  tutor?: AuthUser
  student?: AuthUser
  last_message?: Message
  unread_count?: number
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  message_type: 'text' | 'system'
  created_at: string
  updated_at: string
  is_edited: boolean
  sender?: AuthUser
}

export interface ConversationWithMessages {
  conversation: Conversation
  messages: Message[]
}

// Messages functions (dodaj na końcu pliku)

/**
 * Get all conversations for current user (tutor or student)
 */
export const getUserConversations = async (): Promise<Conversation[]> => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) throw new Error('User not authenticated')

    console.log('🔍 Getting conversations for user:', currentUser.email, 'role:', currentUser.role)

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        tutor:users!conversations_tutor_id_fkey(id, email, first_name, last_name, avatar_url, role),
        student:users!conversations_student_id_fkey(id, email, first_name, last_name, avatar_url, role),
        messages(id, content, created_at, sender_id)
      `)
      .order('last_message_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching conversations:', error)
      throw error
    }

    console.log('✅ Found', data?.length || 0, 'conversations')

    // Process conversations to add unread count and last message
    const processedConversations: Conversation[] = (data || []).map(conv => {
      // Get the most recent message
      const lastMessage = conv.messages && conv.messages.length > 0 
        ? conv.messages[conv.messages.length - 1] 
        : undefined

      // Calculate unread count based on user role
      const lastReadAt = currentUser.role === 'tutor' 
        ? conv.tutor_last_read_at 
        : conv.student_last_read_at

      return {
        id: conv.id,
        tutor_id: conv.tutor_id,
        student_id: conv.student_id,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        last_message_at: conv.last_message_at,
        tutor_last_read_at: conv.tutor_last_read_at,
        student_last_read_at: conv.student_last_read_at,
        is_active: conv.is_active,
        tutor: conv.tutor,
        student: conv.student,
        last_message: lastMessage,
        unread_count: 0 // TODO: Calculate actual unread count
      }
    })

    return processedConversations
  } catch (error) {
    console.error('❌ Error in getUserConversations:', error)
    throw error
  }
}

/**
 * Get conversation with messages by conversation ID
 */
export const getConversationWithMessages = async (
  conversationId: string,
  limit: number = 50
): Promise<ConversationWithMessages> => {
  try {
    console.log('🔍 Getting conversation with messages:', conversationId)

    // Get conversation details
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select(`
        *,
        tutor:users!conversations_tutor_id_fkey(id, email, first_name, last_name, avatar_url, role),
        student:users!conversations_student_id_fkey(id, email, first_name, last_name, avatar_url, role)
      `)
      .eq('id', conversationId)
      .single()

    if (convError) {
      console.error('❌ Error fetching conversation:', convError)
      throw convError
    }

    // Get messages for this conversation
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users(id, email, first_name, last_name, avatar_url, role)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (messagesError) {
      console.error('❌ Error fetching messages:', messagesError)
      throw messagesError
    }

    console.log('✅ Found conversation with', messages?.length || 0, 'messages')

    return {
      conversation,
      messages: messages || []
    }
  } catch (error) {
    console.error('❌ Error in getConversationWithMessages:', error)
    throw error
  }
}

/**
 * Create or get conversation between current user and another user
 */
export const createOrGetConversation = async (otherUserId: string): Promise<string> => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) throw new Error('User not authenticated')

    console.log('🔍 Creating/getting conversation between', currentUser.email, 'and user', otherUserId)

    // Determine who is tutor and who is student
    let tutorId: string, studentId: string

    if (currentUser.role === 'tutor') {
      tutorId = currentUser.id
      studentId = otherUserId
    } else {
      tutorId = otherUserId
      studentId = currentUser.id
    }

    // Use the database function to create or get conversation
    const { data: conversationId, error } = await supabase.rpc('get_or_create_conversation', {
      p_tutor_id: tutorId,
      p_student_id: studentId
    })

    if (error) {
      console.error('❌ Error creating/getting conversation:', error)
      throw error
    }

    console.log('✅ Conversation ID:', conversationId)
    return conversationId
  } catch (error) {
    console.error('❌ Error in createOrGetConversation:', error)
    throw error
  }
}

/**
 * Send a message in a conversation
 */
export const sendMessage = async (
  conversationId: string,
  content: string,
  messageType: 'text' | 'system' = 'text'
): Promise<Message> => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) throw new Error('User not authenticated')

    console.log('📤 Sending message to conversation:', conversationId)

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: currentUser.id,
        content: content.trim(),
        message_type: messageType
      })
      .select(`
        *,
        sender:users(id, email, first_name, last_name, avatar_url, role)
      `)
      .single()

    if (error) {
      console.error('❌ Error sending message:', error)
      throw error
    }

    console.log('✅ Message sent successfully')
    return data
  } catch (error) {
    console.error('❌ Error in sendMessage:', error)
    throw error
  }
}

/**
 * Mark conversation as read for current user
 */
export const markConversationAsRead = async (conversationId: string): Promise<void> => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) throw new Error('User not authenticated')

    console.log('📖 Marking conversation as read:', conversationId)

    const updateField = currentUser.role === 'tutor' 
      ? 'tutor_last_read_at' 
      : 'student_last_read_at'

    const { error } = await supabase
      .from('conversations')
      .update({ [updateField]: new Date().toISOString() })
      .eq('id', conversationId)

    if (error) {
      console.error('❌ Error marking conversation as read:', error)
      throw error
    }

    console.log('✅ Conversation marked as read')
  } catch (error) {
    console.error('❌ Error in markConversationAsRead:', error)
    throw error
  }
}

/**
 * Get users available for new conversation (based on relationships)
 */
export const getAvailableUsersForChat = async (): Promise<AuthUser[]> => {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) throw new Error('User not authenticated')

    console.log('🔍 Getting available users for chat for:', currentUser.email, 'role:', currentUser.role)

    if (currentUser.role === 'tutor') {
      // Tutor can chat with their students
      const students = await getTutorStudents()
      return students.map(student => ({
        id: student.student_id,
        email: student.student_email,
        role: 'student' as const,
        first_name: student.student_first_name,
        last_name: student.student_last_name
      }))
    } else {
      // Student can chat with their tutors
      const { data, error } = await supabase
        .from('user_relationships')
        .select(`
          tutor_id,
          tutor:users!user_relationships_tutor_id_fkey(id, email, first_name, last_name, avatar_url, role)
        `)
        .eq('student_id', currentUser.id)
        .eq('is_active', true)

      if (error) {
        console.error('❌ Error fetching tutors:', error)
        throw error
      }

      return (data || []).map(rel => rel.tutor).filter(Boolean)
    }
  } catch (error) {
    console.error('❌ Error in getAvailableUsersForChat:', error)
    throw error
  }
}

/**
 * Subscribe to new messages in a conversation (real-time)
 */
export const subscribeToConversationMessages = (
  conversationId: string,
  onNewMessage: (message: Message) => void
) => {
  console.log('🔔 Subscribing to messages for conversation:', conversationId)

  return supabase
    .channel(`conversation:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      async (payload) => {
        console.log('🔔 New message received:', payload.new)
        
        // Fetch complete message data with sender info
        const { data: message, error } = await supabase
          .from('messages')
          .select(`
            *,
            sender:users(id, email, first_name, last_name, avatar_url, role)
          `)
          .eq('id', payload.new.id)
          .single()

        if (!error && message) {
          onNewMessage(message)
        }
      }
    )
    .subscribe()
}

/**
 * Subscribe to conversation list updates (real-time)
 */
export const subscribeToConversationUpdates = (
  onConversationUpdate: () => void
) => {
  console.log('🔔 Subscribing to conversation updates')

  return supabase
    .channel('conversations-updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations'
      },
      () => {
        console.log('🔔 Conversation list updated')
        onConversationUpdate()
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      },
      () => {
        console.log('🔔 New message - updating conversation list')
        onConversationUpdate()
      }
    )
    .subscribe()
}
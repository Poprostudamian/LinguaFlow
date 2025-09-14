// src/lib/supabase.ts

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface StudentLesson {
  lesson_id: string;
  student_id: string;
  status: 'assigned' | 'in_progress' | 'completed';
  progress: number;
  assigned_at: string;
  completed_at?: string | null;
  updated_at: string;
  title: string;
  description?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration_minutes: number;
  content?: string | null;
  exercises?: any[];
  tutor_id: string;
  lesson_created_at?: string | null;
  lesson_updated_at?: string | null;
}

export interface StudentStats {
  student_id: string;
  total_lessons: number;
  completed_lessons: number;
  in_progress_lessons: number;
  total_study_time_minutes: number;
  average_progress: number;
  last_activity: string | null;
}

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
  // Relationship data
  relationship_id: string;
  tutor_id: string;
  tutor_first_name: string;
  tutor_last_name: string;
  student_id: string;
  
  // Student data
  student_email: string;
  student_first_name: string;
  student_last_name: string;
  student_is_active: boolean;
  relationship_created: string;
  
  // Progress data (computed from student_lessons)
  level: string;
  progress: number;
  lessonsCompleted: number;
  totalHours: number;
  totalLessonsAssigned: number;
  averageScore?: number;
  lastActivity?: string;
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
export const getTutorStudents = async (): Promise<TutorStudent[]> => {
  console.log('🔍 Getting tutor students with progress data...');
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('Not authenticated');
  }

  // Pobierz relacje z danymi studentów
  const { data: relationships, error: relError } = await supabase
    .from('user_relationships')
    .select(`
      id,
      tutor_id,
      student_id,
      created_at,
      status,
      is_active,
      notes,
      student:users!student_id (
        id,
        email,
        first_name,
        last_name,
        is_active
      ),
      tutor:users!tutor_id (
        first_name,
        last_name
      )
    `)
    .eq('tutor_id', user.id)
    .eq('status', 'accepted')
    .eq('is_active', true);

  if (relError) {
    console.error('❌ Error getting relationships:', relError);
    throw relError;
  }

  if (!relationships || relationships.length === 0) {
    console.log('ℹ️ No students found for tutor');
    return [];
  }

  console.log('✅ Found', relationships.length, 'student relationships');

  // Pobierz dane o lekcjach dla każdego studenta
  const studentsWithProgress: TutorStudent[] = await Promise.all(
    relationships.map(async (rel) => {
      const studentId = rel.student_id;
      
      // Pobierz dane o przypisanych lekcjach studenta
      const { data: studentLessons, error: lessonsError } = await supabase
        .from('student_lessons')
        .select(`
          id,
          lesson_id,
          status,
          progress,
          assigned_at,
          completed_at,
          lessons:lessons!lesson_id (
            title,
            created_at
          )
        `)
        .eq('student_id', studentId);

      if (lessonsError) {
        console.warn('⚠️ Error getting lessons for student', studentId, lessonsError);
      }

      // Oblicz statystyki postępów
      const lessons = studentLessons || [];
      const totalLessonsAssigned = lessons.length;
      const completedLessons = lessons.filter(l => l.status === 'completed');
      const lessonsCompleted = completedLessons.length;
      
      // Oblicz średni postęp
      const totalProgress = lessons.reduce((sum, lesson) => sum + (lesson.progress || 0), 0);
      const averageProgress = totalLessonsAssigned > 0 ? Math.round(totalProgress / totalLessonsAssigned) : 0;
      
      // Oszacuj całkowite godziny (zakładając 1 godzinę na lekcję)
      const totalHours = lessonsCompleted;
      
      // Określ poziom na podstawie liczby ukończonych lekcji
      let level = 'Beginner';
      if (lessonsCompleted >= 10) {
        level = 'Advanced';
      } else if (lessonsCompleted >= 5) {
        level = 'Intermediate';
      }

      // Znajdź ostatnią aktywność
      const lastActivity = lessons
        .filter(l => l.completed_at)
        .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())[0]?.completed_at;

      return {
        // Relationship data
        relationship_id: rel.id,
        tutor_id: rel.tutor_id,
        tutor_first_name: rel.tutor.first_name || '',
        tutor_last_name: rel.tutor.last_name || '',
        student_id: rel.student_id,
        
        // Student data
        student_email: rel.student.email,
        student_first_name: rel.student.first_name || '',
        student_last_name: rel.student.last_name || '',
        student_is_active: rel.student.is_active ?? true,
        relationship_created: rel.created_at,
        
        // Progress data (computed from student_lessons)
        level,
        progress: averageProgress,
        lessonsCompleted,
        totalHours,
        totalLessonsAssigned,
        lastActivity
      };
    })
  );

  console.log('✅ Loaded progress data for', studentsWithProgress.length, 'students');
  return studentsWithProgress;
};

// Get all invitations sent by tutor
export const getTutorInvitations = async (): Promise<RelationshipInvitation[]> => {
  console.log('🔍 Getting tutor invitations...');
  
  // ✅ DODAJ: Pobierz aktualnego użytkownika
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('Not authenticated');
  }
  
  // ✅ POPRAW: Dodaj filter na tutor_id
  const { data, error } = await supabase
    .from('relationship_invitations')
    .select('*')
    .eq('tutor_id', user.id) // ✅ DODAJ: Filter tylko zaproszenia tego tutora
    .order('invited_at', { ascending: false });

  if (error) {
    console.error('❌ Error getting invitations:', error);
    throw error;
  }
  
  console.log('✅ Found', data?.length || 0, 'invitations for tutor');
  return data as RelationshipInvitation[];
};

// Send invitation to student by email
export const sendStudentInvitation = async (studentEmail: string, message?: string) => {
  console.log('📧 Sending invitation to:', studentEmail);
  
  // ✅ DODAJ: Pobierz aktualnego użytkownika aby uzyskać tutor_id
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('❌ User not authenticated:', userError);
    throw new Error('Not authenticated');
  }

  // ✅ DODAJ: Sprawdź czy użytkownik to tutor
  const { data: userData, error: roleError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (roleError) {
    console.error('❌ Error checking user role:', roleError);
    throw new Error('Unable to verify user permissions');
  }

  if (userData?.role !== 'tutor') {
    console.error('❌ User is not a tutor:', userData?.role);
    throw new Error('Only tutors can send invitations');
  }

  // ✅ SPRAWDŹ: Czy zaproszenie już istnieje dla tego tutora i studenta
  const { data: existingInvitation } = await supabase
    .from('relationship_invitations')
    .select('id, status, expires_at')
    .eq('tutor_id', user.id)  // ✅ DODAJ tutor_id filter
    .eq('student_email', studentEmail.toLowerCase().trim())
    .eq('status', 'pending')
    .maybeSingle();

  if (existingInvitation) {
    // Check if invitation is still valid
    const expiresAt = new Date(existingInvitation.expires_at);
    const now = new Date();
    
    if (expiresAt > now) {
      throw new Error('Active invitation already exists for this email address');
    }
  }

  // ✅ NAPRAW: INSERT z poprawnym tutor_id
  const { data, error } = await supabase
    .from('relationship_invitations')
    .insert({
      tutor_id: user.id, // ✅ DODAJ: Kluczowe pole wymagane przez RLS policy
      student_email: studentEmail.toLowerCase().trim(),
      message: message?.trim() || null
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error sending invitation:', error);
    
    // Provide more helpful error messages
    if (error.message?.includes('row-level security')) {
      throw new Error('Permission denied: Unable to send invitation');
    } else if (error.message?.includes('duplicate')) {
      throw new Error('An invitation to this email already exists');
    } else {
      throw new Error(`Failed to send invitation: ${error.message}`);
    }
  }
  
  console.log('✅ Invitation sent successfully:', data.id);
  return data;
};

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
 * Complete a lesson with score
 */
export const completeStudentLesson = async (
  studentId: string,
  lessonId: string,
  score: number,
  timeSpent?: number
): Promise<void> => {
  try {
    console.log('🎯 Completing lesson:', lessonId, 'with score:', score);
    
    // Sprawdź sesję
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || session.user.id !== studentId) {
      throw new Error('Not authenticated or invalid student ID');
    }
    
    const { error } = await supabase
      .from('student_lessons')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        score: Math.max(0, Math.min(100, score)),
        progress: 100,
        time_spent: timeSpent || 0,
        updated_at: new Date().toISOString()
      })
      .eq('student_id', studentId)
      .eq('lesson_id', lessonId);

    if (error) {
      console.error('❌ Error completing lesson:', error);
      throw new Error(`Failed to complete lesson: ${error.message}`);
    }

    console.log('✅ Lesson completed successfully');
  } catch (error) {
    console.error('❌ Error in completeStudentLesson:', error);
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
 * Get detailed information about a specific lesson for a student
 */
export const getLessonDetails = async (lessonId: string, studentId: string): Promise<any> => {
  try {
    console.log('🔍 Getting lesson details for:', { lessonId, studentId });

    // Pobierz informacje o lekcji wraz z przypisaniem studenta
    const { data, error } = await supabase
      .from('student_lessons')
      .select(`
        id,
        student_id,
        lesson_id,
        assigned_at,
        started_at,
        completed_at,
        status,
        score,
        time_spent,
        progress,
        lessons!inner (
          id,
          title,
          description,
          content,
          status,
          created_at,
          updated_at,
          tutor_id,
          users!lessons_tutor_id_fkey (
            id,
            first_name,
            last_name,
            email
          )
        )
      `)
      .eq('lesson_id', lessonId)
      .eq('student_id', studentId)
      .single();

    if (error) {
      console.error('❌ Error fetching lesson details:', error);
      throw error;
    }

    if (!data) {
      console.log('ℹ️ Lesson not found or not assigned to student');
      return null;
    }

    // Formatuj dane dla komponentu
    const formattedData = {
      id: data.lessons.id,
      title: data.lessons.title,
      description: data.lessons.description,
      content: data.lessons.content,
      created_at: data.lessons.created_at,
      tutor: {
        first_name: data.lessons.users.first_name,
        last_name: data.lessons.users.last_name,
        email: data.lessons.users.email
      },
      student_lesson: {
        status: data.status,
        progress: data.progress,
        score: data.score,
        time_spent: data.time_spent,
        started_at: data.started_at,
        completed_at: data.completed_at
      }
    };

    console.log('✅ Lesson details retrieved successfully');
    return formattedData;

  } catch (error) {
    console.error('Error getting lesson details:', error);
    throw error;
  }
};

/**
 * Get lessons assigned to a student
 */
export const getStudentLessons = async (studentId: string): Promise<any[]> => {
  try {
    console.log('🔍 Getting lessons for student:', studentId);
    
    // Sprawdź sesję
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || session.user.id !== studentId) {
      throw new Error('Not authenticated');
    }

    // Pobierz przypisania lekcji
    const { data: assignments, error: assignmentsError } = await supabase
      .from('student_lessons')
      .select('*')
      .eq('student_id', studentId)
      .order('assigned_at', { ascending: false });

    if (assignmentsError) {
      console.error('❌ Error fetching assignments:', assignmentsError);
      throw new Error(`Failed to fetch assignments: ${assignmentsError.message}`);
    }

    console.log('✅ Found', assignments?.length || 0, 'assignments');

    if (!assignments || assignments.length === 0) {
      return [];
    }

    // Pobierz lekcje
    const lessonIds = assignments.map(a => a.lesson_id);
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .in('id', lessonIds);

    if (lessonsError) {
      console.error('❌ Error fetching lessons:', lessonsError);
    }

    // Pobierz tutorów
    const tutorIds = lessons ? [...new Set(lessons.map(l => l.tutor_id))] : [];
    let tutors: any[] = [];
    
    if (tutorIds.length > 0) {
      const { data: tutorData, error: tutorError } = await supabase
        .from('users')
        .select('id, first_name, last_name, email')
        .in('id', tutorIds);

      if (!tutorError) {
        tutors = tutorData || [];
      }
    }

    // Połącz dane
    const result = assignments.map(assignment => {
      const lesson = lessons?.find(l => l.id === assignment.lesson_id);
      const tutor = lesson ? tutors.find(t => t.id === lesson.tutor_id) : null;

      return {
        // Assignment fields
        id: assignment.id,
        student_id: assignment.student_id,
        lesson_id: assignment.lesson_id,
        assigned_at: assignment.assigned_at,
        started_at: assignment.started_at,
        completed_at: assignment.completed_at,
        status: assignment.status || 'assigned',
        score: assignment.score,
        time_spent: assignment.time_spent || 0,
        progress: assignment.progress || 0,
        updated_at: assignment.updated_at,

        // Lesson fields
        lessons: {
          id: lesson?.id || assignment.lesson_id,
          title: lesson?.title || 'Unknown Lesson',
          description: lesson?.description || '',
          content: lesson?.content || '',
          status: lesson?.status || 'published',
          created_at: lesson?.created_at || assignment.assigned_at,
          updated_at: lesson?.updated_at || assignment.updated_at,
          tutor_id: lesson?.tutor_id || '',

          // Tutor fields
          users: {
            first_name: tutor?.first_name || 'Unknown',
            last_name: tutor?.last_name || 'Tutor',
            email: tutor?.email || ''
          }
        }
      };
    });

    console.log('✅ Prepared', result.length, 'enriched assignments');
    return result;

  } catch (error: any) {
    console.error('💥 Error in getStudentLessons:', error);
    throw error;
  }
};

/**
 * Uproszczona funkcja testowa - sprawdza tylko podstawowy dostęp
 */
// export const testStudentLessonsAccess = async (studentId: string) => {
//   try {
//     console.log('🧪 Testing basic access to student_lessons...');
    
//     const { data, error } = await supabase
//       .from('student_lessons')
//       .select('id, lesson_id, status')
//       .eq('student_id', studentId)
//       .limit(1);

//     if (error) {
//       console.error('❌ Access test failed:', error);
//       return false;
//     }

//     console.log('✅ Access test passed. Found', data?.length || 0, 'records');
//     return true;

//   } catch (error) {
//     console.error('💥 Access test exception:', error);
//     return false;
//   }
// };


/**
 * Start a lesson (update status to in_progress)
 */
export const startStudentLesson = async (studentId: string, lessonId: string): Promise<void> => {
  try {
    console.log('▶️ Starting lesson:', lessonId, 'for student:', studentId);
    
    // Sprawdź sesję
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || session.user.id !== studentId) {
      throw new Error('Not authenticated or invalid student ID');
    }
    
    const { error } = await supabase
      .from('student_lessons')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('student_id', studentId)
      .eq('lesson_id', lessonId);

    if (error) {
      console.error('❌ Error starting lesson:', error);
      throw new Error(`Failed to start lesson: ${error.message}`);
    }

    console.log('✅ Lesson started successfully');
  } catch (error) {
    console.error('❌ Error in startStudentLesson:', error);
    throw error;
  }
};

/**
 * Update lesson progress
 */
export const updateLessonProgress = async (
  studentId: string, 
  lessonId: string, 
  progress: number, 
  status?: 'assigned' | 'in_progress' | 'completed'
): Promise<void> => {
  try {
    console.log('📊 Updating progress:', lessonId, 'to', progress + '%');
    
    // Sprawdź sesję
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || session.user.id !== studentId) {
      throw new Error('Not authenticated or invalid student ID');
    }
    
    const updateData: any = {
      progress: Math.max(0, Math.min(100, progress)),
      updated_at: new Date().toISOString()
    };

    if (status) {
      updateData.status = status;
    }

    // If progress is 100%, mark as completed
    if (progress >= 100) {
      updateData.status = 'completed';
      updateData.completed_at = new Date().toISOString();
      updateData.score = progress; // Use progress as score for now
    }

    const { error } = await supabase
      .from('student_lessons')
      .update(updateData)
      .eq('student_id', studentId)
      .eq('lesson_id', lessonId);

    if (error) {
      console.error('❌ Error updating progress:', error);
      throw new Error(`Failed to update progress: ${error.message}`);
    }

    console.log('✅ Progress updated successfully');
  } catch (error) {
    console.error('❌ Error in updateLessonProgress:', error);
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
  // tutorId jest przekazywane ale nie używane - sendStudentInvitation pobiera to z auth
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
export const getLessonExercises = async (lessonId: string): Promise<any[]> => {
  try {
    console.log('🎯 Getting exercises for lesson:', lessonId);

    const { data, error } = await supabase
      .from('lesson_exercises')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('order_number', { ascending: true });

    if (error) {
      // Jeśli tabela nie istnieje, zwróć pustą tablicę
      if (error.code === '42P01') {
        console.log('ℹ️ lesson_exercises table does not exist yet');
        return [];
      }
      console.error('❌ Error fetching exercises:', error);
      throw error;
    }

    console.log('✅ Found', data?.length || 0, 'exercises');
    
    // Parsuj opcje JSON dla ćwiczeń ABCD
    const formattedExercises = (data || []).map(exercise => ({
      ...exercise,
      options: exercise.options ? JSON.parse(exercise.options) : null
    }));

    return formattedExercises;

  } catch (error) {
    console.error('Error getting lesson exercises:', error);
    // Zwróć pustą tablicę zamiast rzucać błąd
    return [];
  }
};

/**
 * Enhanced updateStudentLessonProgress with optional score and time
 */
export const updateStudentLessonProgress = async (
  studentId: string, 
  lessonId: string, 
  progress: number,
  status?: 'assigned' | 'in_progress' | 'completed',
  score?: number,
  timeSpent?: number
): Promise<void> => {
  try {
    console.log('📊 Updating student lesson progress:', { 
      studentId, 
      lessonId, 
      progress, 
      status, 
      score, 
      timeSpent 
    });

    const updateData: any = {
      progress: Math.min(Math.max(progress, 0), 100), // Clamp between 0-100
      updated_at: new Date().toISOString()
    };

    // Dodaj opcjonalne pola
    if (status) {
      updateData.status = status;
      
      // Automatyczne timestampy na podstawie statusu
      if (status === 'in_progress' && !updateData.started_at) {
        updateData.started_at = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
        updateData.progress = 100; // Force 100% na completed
      }
    }

    if (typeof score === 'number') {
      updateData.score = Math.min(Math.max(score, 0), 100); // Clamp between 0-100
    }

    if (typeof timeSpent === 'number') {
      updateData.time_spent = Math.max(timeSpent, 0); // Min 0 seconds
    }

    const { error } = await supabase
      .from('student_lessons')
      .update(updateData)
      .eq('lesson_id', lessonId)
      .eq('student_id', studentId);

    if (error) {
      console.error('❌ Error updating progress:', error);
      throw error;
    }

    console.log('✅ Student lesson progress updated successfully');

  } catch (error) {
    console.error('Error updating student lesson progress:', error);
    throw error;
  }
};

/**
 * Get student's exercise answers (for future implementation)
 */
export const saveStudentExerciseAnswers = async (
  studentId: string,
  lessonId: string,
  exerciseAnswers: Array<{
    exercise_id: string;
    answer: string;
    is_correct: boolean;
    time_spent: number;
  }>
): Promise<void> => {
  try {
    console.log('💾 Saving exercise answers:', { studentId, lessonId, count: exerciseAnswers.length });

    // Opcjonalnie: zapisz odpowiedzi w tabeli student_exercise_answers
    // Obecnie zapisujemy tylko końcowy wynik w student_lessons
    
    console.log('✅ Exercise answers processed');

  } catch (error) {
    console.error('Error saving exercise answers:', error);
    throw error;
  }
};

// ================================================================================
// MESSAGING SYSTEM
// ================================================================================

// Messaging types
export interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  last_message: string | null;
  unread_count?: number;
  student?: AuthUser;
  tutor?: AuthUser;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  sender?: AuthUser;
}

// Get all conversations for current user
export const getUserConversations = async (): Promise<Conversation[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  console.log('🔍 Getting conversations for user:', user.id);

  const { data: conversations, error } = await supabase
    .from('conversations')
    .select(`
      *,
      participant1:users!participant1_id(id, first_name, last_name, email, avatar_url),
      participant2:users!participant2_id(id, first_name, last_name, email, avatar_url)
    `)
    .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
    .order('last_message_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching conversations:', error);
    throw error;
  }

  console.log('✅ Found', conversations?.length || 0, 'conversations');

  // Transform data to include other user info
  const transformedConversations = conversations?.map(conv => {
    const otherUser = conv.participant1_id === user.id ? conv.participant2 : conv.participant1;
    
    return {
      ...conv,
      student: user.user_metadata?.role === 'tutor' ? otherUser : undefined,
      tutor: user.user_metadata?.role === 'student' ? otherUser : undefined,
      unread_count: 0 // TODO: Implement proper unread count
    };
  }) || [];

  return transformedConversations;
};

// Get conversation with messages
export const getConversationWithMessages = async (conversationId: string): Promise<{ conversation: Conversation; messages: Message[] }> => {
  console.log('📨 Getting conversation messages:', conversationId);

  const [conversationResult, messagesResult] = await Promise.all([
    supabase
      .from('conversations')
      .select(`
        *,
        participant1:users!participant1_id(id, first_name, last_name, email, avatar_url),
        participant2:users!participant2_id(id, first_name, last_name, email, avatar_url)
      `)
      .eq('id', conversationId)
      .single(),
    
    supabase
      .from('messages')
      .select(`
        *,
        sender:users!sender_id(id, first_name, last_name, email, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
  ]);

  if (conversationResult.error) {
    console.error('❌ Error fetching conversation:', conversationResult.error);
    throw conversationResult.error;
  }

  if (messagesResult.error) {
    console.error('❌ Error fetching messages:', messagesResult.error);
    throw messagesResult.error;
  }

  console.log('✅ Found', messagesResult.data?.length || 0, 'messages');

  return {
    conversation: conversationResult.data,
    messages: messagesResult.data || []
  };
};

// Send a message
export const sendMessage = async (conversationId: string, content: string): Promise<Message> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  console.log('📤 Sending message to conversation:', conversationId);

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: content.trim()
    })
    .select(`
      *,
      sender:users!sender_id(id, first_name, last_name, email, avatar_url)
    `)
    .single();

  if (error) {
    console.error('❌ Error sending message:', error);
    throw error;
  }

  console.log('✅ Message sent successfully');
  return message;
};

// Mark conversation as read
export const markConversationAsRead = async (conversationId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  console.log('👁️ Marking conversation as read:', conversationId);

  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', user.id)
    .is('read_at', null);

  if (error) {
    console.error('❌ Error marking conversation as read:', error);
    throw error;
  }

  console.log('✅ Conversation marked as read');
};

// Get available users for chat (students for tutors, tutors for students)
export const getAvailableUsersForChat = async (): Promise<AuthUser[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  console.log('👥 Getting available users for chat, current user role:', user.user_metadata?.role);

  if (user.user_metadata?.role === 'tutor') {
    // Tutors can chat with their students
    const tutorStudents = await getTutorStudents();
    return tutorStudents.map(student => ({
      id: student.student_id,
      email: student.student_email,
      role: 'student' as const,
      first_name: student.student_first_name,
      last_name: student.student_last_name
    }));
  } else {
    // Students can chat with their tutors
    const studentTutors = await getStudentTutors();
    return studentTutors?.map(rel => ({
      id: rel.tutors.id,
      email: rel.tutors.email,
      role: 'tutor' as const,
      first_name: rel.tutors.first_name,
      last_name: rel.tutors.last_name,
      avatar_url: rel.tutors.avatar_url
    })) || [];
  }
};

// Create or get existing conversation between two users
export const createOrGetConversation = async (otherUserId: string): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  console.log('🤝 Creating/getting conversation with user:', otherUserId);

  // Check if conversation already exists (in either direction)
  const { data: existingConversation, error: searchError } = await supabase
    .from('conversations')
    .select('id')
    .or(`and(participant1_id.eq.${user.id},participant2_id.eq.${otherUserId}),and(participant1_id.eq.${otherUserId},participant2_id.eq.${user.id})`)
    .maybeSingle();

  if (searchError && searchError.code !== 'PGRST116') {
    console.error('❌ Error searching for existing conversation:', searchError);
    throw searchError;
  }

  if (existingConversation) {
    console.log('✅ Found existing conversation:', existingConversation.id);
    return existingConversation.id;
  }

  // Create new conversation
  const { data: newConversation, error: createError } = await supabase
    .from('conversations')
    .insert({
      participant1_id: user.id,
      participant2_id: otherUserId,
      last_message_at: new Date().toISOString()
    })
    .select('id')
    .single();

  if (createError) {
    console.error('❌ Error creating conversation:', createError);
    throw createError;
  }

  console.log('✅ Created new conversation:', newConversation.id);
  return newConversation.id;
};

// Real-time subscriptions
export const subscribeToConversationMessages = (conversationId: string, onNewMessage: (message: Message) => void) => {
  console.log('🔴 Subscribing to messages for conversation:', conversationId);

  return supabase
    .channel(`conversation-${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      async (payload) => {
        console.log('📨 New message received:', payload.new);
        
        // Fetch complete message data with sender info
        const { data: messageWithSender, error } = await supabase
          .from('messages')
          .select(`
            *,
            sender:users!sender_id(id, first_name, last_name, email, avatar_url)
          `)
          .eq('id', payload.new.id)
          .single();

        if (!error && messageWithSender) {
          onNewMessage(messageWithSender);
        }
      }
    )
    .subscribe();
};

export const subscribeToConversationUpdates = (onUpdate: () => void) => {
  console.log('🔴 Subscribing to conversation updates');

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
        console.log('📝 Conversation updated');
        onUpdate();
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
        console.log('📨 New message in any conversation');
        onUpdate();
      }
    )
    .subscribe();
};

// Get real student statistics (lessons, progress, etc.)
export const getStudentRealStats = async (studentId: string) => {
  try {
    console.log('📊 Getting real stats for student:', studentId);

    // Get student lessons data
    const { data: lessons, error: lessonsError } = await supabase
      .from('student_lessons')
      .select('*')
      .eq('student_id', studentId);

    if (lessonsError) {
      console.log('⚠️ No student_lessons table or error:', lessonsError);
      // Return defaults if table doesn't exist yet
      return {
        level: 'Beginner',
        progress: 0,
        lessonsCompleted: 0,
        totalHours: 0
      };
    }

    const totalLessons = lessons?.length || 0;
    const completedLessons = lessons?.filter(l => l.status === 'completed').length || 0;
    
    // Calculate average progress
    const averageProgress = totalLessons > 0
      ? Math.round(lessons.reduce((sum, l) => sum + (l.progress || 0), 0) / totalLessons)
      : 0;

    // Calculate total study time (convert minutes to hours)
    const totalMinutes = lessons?.reduce((sum, l) => sum + (l.time_spent || 0), 0) || 0;
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

    // Determine level based on progress
    const level = averageProgress >= 80 ? 'Advanced' : 
                  averageProgress >= 50 ? 'Intermediate' : 'Beginner';

    const stats = {
      level,
      progress: averageProgress,
      lessonsCompleted: completedLessons,
      totalHours
    };

    console.log('📊 Real stats for', studentId, ':', stats);
    return stats;

  } catch (error) {
    console.error('❌ Error getting student stats:', error);
    
    // Return defaults on error
    return {
      level: 'Beginner',
      progress: 0,
      lessonsCompleted: 0,
      totalHours: 0
    };
  }
};

/**
 * Get tutor students with real statistics
 */
export const getTutorStudentsWithRealStats = async () => {
  try {
    console.log('🔄 Getting tutor students with real stats...');
    
    const students = await getTutorStudents();
    console.log('👥 Got', students.length, 'basic students');
    
    // Remove duplicates
    const uniqueStudents = students.filter((student, index, self) => 
      index === self.findIndex(s => s.student_id === student.student_id)
    );
    
    console.log('👥 After removing duplicates:', uniqueStudents.length, 'students');
    
    // Get real stats for each student
    const studentsWithStats = await Promise.all(
      uniqueStudents.map(async (student) => {
        const stats = await getStudentRealStats(student.student_id);
        return {
          ...student,
          ...stats
        };
      })
    );

    console.log('✅ Students with real stats:', studentsWithStats);
    return studentsWithStats;

  } catch (error) {
    console.error('❌ Error getting students with stats:', error);
    throw error;
  }
};

// Enhanced getTutorStudents with real statistics
export const getTutorStudentsWithStats = async (): Promise<any[]> => {
  console.log('🔄 Getting tutor students with stats...');
  
  const students = await getTutorStudents();
  console.log('👥 Got', students.length, 'basic students');
  
  // Remove duplicates based on student_id
  const uniqueStudents = students.filter((student, index, self) => 
    index === self.findIndex(s => s.student_id === student.student_id)
  );
  
  console.log('👥 After removing duplicates:', uniqueStudents.length, 'students');
  
  // Get stats for each unique student
  const studentsWithStats = await Promise.all(
    uniqueStudents.map(async (student) => {
      const stats = await getStudentRealStats(student.student_id);
      return {
        ...student,
        ...stats
      };
    })
  );

  console.log('✅ Students with stats:', studentsWithStats);
  return studentsWithStats;
};

// Get tutor teaching statistics  
export const getTutorTeachingStats = async (tutorId: string) => {
  try {
    console.log('📈 Getting tutor teaching stats for:', tutorId);
    
    // Get total students
    const { count: totalStudents } = await supabase
      .from('user_relationships')
      .select('*', { count: 'exact', head: true })
      .eq('tutor_id', tutorId)
      .eq('is_active', true);

    // Get total lessons created
    const { count: totalLessons } = await supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .eq('tutor_id', tutorId);

    console.log('📈 Basic stats - Students:', totalStudents, 'Lessons:', totalLessons);

    const stats = {
      totalStudents: totalStudents || 0,
      activeStudents: totalStudents || 0,
      pendingInvitations: 0, // Will be calculated separately
      totalLessons: totalLessons || 0,
      completedLessons: Math.floor((totalLessons || 0) * 0.6), // Estimate 60% completion
      completionRate: 60,
      teachingHours: Math.floor((totalLessons || 0) * 1.5) // Estimate 1.5h per lesson
    };

    console.log('✅ Tutor stats:', stats);
    return stats;
  } catch (error) {
    console.error('❌ Error getting tutor teaching stats:', error);
    return {
      totalStudents: 0,
      activeStudents: 0,
      pendingInvitations: 0,
      totalLessons: 0,
      completedLessons: 0,
      completionRate: 0,
      teachingHours: 0
    };
  }
};

export const debugGetAllInvitations = async () => {
  console.log('🐛 DEBUG: Checking all invitations in database...');
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('Not authenticated');
  }

  // Pobierz wszystkie zaproszenia dla tego tutora
  const { data, error } = await supabase
    .from('relationship_invitations')
    .select('*')
    .eq('tutor_id', user.id)
    .order('invited_at', { ascending: false });

  if (error) {
    console.error('❌ Error getting debug invitations:', error);
    throw error;
  }

  console.log('🐛 DEBUG RESULTS:');
  console.log('📊 Total invitations found:', data?.length || 0);
  
  data?.forEach((invitation, index) => {
    console.log(`\n📧 Invitation ${index + 1}:`);
    console.log('   ID:', invitation.id);
    console.log('   Email:', invitation.student_email);
    console.log('   Status:', invitation.status);
    console.log('   Created:', new Date(invitation.invited_at).toLocaleString());
    console.log('   Expires:', new Date(invitation.expires_at).toLocaleString());
    console.log('   Token:', invitation.invitation_token?.substring(0, 10) + '...');
    console.log('   Message:', invitation.message || 'No message');
  });

  return data;
};

// ✅ FUNKCJA DEBUG: Generuj link zaproszenia dla testów
export const generateInvitationLink = (invitation: RelationshipInvitation): string => {
  // W przyszłości można to podpiąć pod rzeczywisty system akceptacji zaproszeń
  const baseUrl = window.location.origin;
  return `${baseUrl}/accept-invitation?token=${invitation.invitation_token}`;
};

// ===== STUDENT DATA FUNCTIONS =====

export interface StudentKPIs {
  lessonsCompleted: number;
  studyStreak: number; 
  totalHours: number;
  totalLessonsAssigned: number;
  averageProgress: number;
  currentLevel: string;
}

export interface StudentUpcomingLesson {
  id: string;
  title: string;
  description?: string;
  tutor_name: string;
  assigned_at: string;
  status: 'assigned' | 'in_progress';
  progress: number;
  lesson_id: string;
}

export interface StudentStats {
  kpis: StudentKPIs;
  upcomingLessons: StudentUpcomingLesson[];
  recentActivity: string | null;
}

/**
 * Get comprehensive stats for current student
 */
export const getStudentDashboardData = async (): Promise<StudentStats> => {
  try {
    console.log('📊 Getting student dashboard data...');
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Not authenticated');
    }

    console.log('👤 Current student ID:', user.id);

    // 1. Get student's lesson assignments with lesson and tutor details
    const { data: studentLessons, error: lessonsError } = await supabase
      .from('student_lessons')
      .select(`
        id,
        lesson_id,
        status,
        progress,
        assigned_at,
        completed_at,
        updated_at,
        lessons:lessons!lesson_id (
          id,
          title,
          description,
          tutor_id,
          created_at,
          tutor:users!tutor_id (
            first_name,
            last_name
          )
        )
      `)
      .eq('student_id', user.id)
      .order('assigned_at', { ascending: false });

    if (lessonsError) {
      console.error('❌ Error fetching student lessons:', lessonsError);
      throw lessonsError;
    }

    console.log('📚 Student lessons found:', studentLessons?.length || 0);

    const lessons = studentLessons || [];

    // 2. Calculate KPIs
    const totalLessonsAssigned = lessons.length;
    const completedLessons = lessons.filter(l => l.status === 'completed');
    const lessonsCompleted = completedLessons.length;

    // Calculate total study time (estimate based on progress)
    const totalProgressPoints = lessons.reduce((sum, l) => sum + l.progress, 0);
    const totalHours = Math.round(totalProgressPoints / 100 * 1.5 * 10) / 10; // ~1.5 hours per 100% lesson

    // Calculate average progress
    const averageProgress = totalLessonsAssigned > 0 
      ? Math.round(lessons.reduce((sum, l) => sum + l.progress, 0) / totalLessonsAssigned)
      : 0;

    // Determine current level
    let currentLevel = 'Beginner';
    if (lessonsCompleted >= 20) {
      currentLevel = 'Advanced';
    } else if (lessonsCompleted >= 8) {
      currentLevel = 'Intermediate';  
    }

    // Calculate study streak (days with activity in last week)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentActivities = lessons.filter(l => 
      l.updated_at && new Date(l.updated_at) > oneWeekAgo
    );

    // Simple streak calculation - days with any lesson activity
    const activeDays = new Set(
      recentActivities.map(l => 
        new Date(l.updated_at).toDateString()
      )
    );
    const studyStreak = activeDays.size;

    // 3. Get upcoming lessons (assigned or in progress, not completed)
    const upcomingLessons: StudentUpcomingLesson[] = lessons
      .filter(l => l.status === 'assigned' || l.status === 'in_progress')
      .slice(0, 6) // Limit to 6 most recent
      .map(l => ({
        id: l.id,
        title: l.lessons.title,
        description: l.lessons.description || undefined,
        tutor_name: l.lessons.tutor 
          ? `${l.lessons.tutor.first_name} ${l.lessons.tutor.last_name}` 
          : 'Unknown Tutor',
        assigned_at: l.assigned_at,
        status: l.status as 'assigned' | 'in_progress',
        progress: l.progress,
        lesson_id: l.lesson_id
      }));

    // 4. Get most recent activity
    const recentActivity = lessons.length > 0 
      ? lessons
          .map(l => l.updated_at || l.assigned_at)
          .sort()
          .reverse()[0]
      : null;

    const kpis: StudentKPIs = {
      lessonsCompleted,
      studyStreak,
      totalHours,
      totalLessonsAssigned,
      averageProgress,
      currentLevel
    };

    console.log('✅ Student KPIs calculated:', kpis);
    console.log('📅 Upcoming lessons:', upcomingLessons.length);

    return {
      kpis,
      upcomingLessons,
      recentActivity
    };

  } catch (error) {
    console.error('❌ Error fetching student dashboard data:', error);
    throw error;
  }
};

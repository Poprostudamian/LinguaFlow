// src/lib/supabase.ts - OPTIMIZED COMPLETE VERSION (ALL FUNCTIONS PRESERVED)

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ===== CORE INTERFACES =====
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

// ===== RELATIONSHIP INTERFACES =====
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
  notes?: string;
  is_active?: boolean;
}

export interface InviteStudentData {
  studentEmail: string;
  message?: string;
}

// ===== LESSON INTERFACES =====
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
  score?: number | null;
  time_spent?: number;
  started_at?: string | null;
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
  exercises?: {
    type: 'multiple_choice' | 'flashcard' | 'text_answer';
    title: string;
    question: string;
    correct_answer?: string;
    options?: string[];
    explanation?: string;
    points?: number;
  }[];
}

export interface UpdateLessonData {
  title?: string;
  description?: string;
  content?: string;
  status?: 'draft' | 'published';
}

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
  options?: string[];
  explanation?: string;
  order_number: number;
  points: number;
  created_at: string;
}

// ===== STUDENT DASHBOARD INTERFACES =====
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

export interface StudentLessonStats {
  student_id: string;
  total_lessons: number;
  completed_lessons: number;
  in_progress_lessons: number;
  total_study_time_minutes: number;
  average_progress: number;
  last_activity: string | null;
}

// ===== MESSAGING INTERFACES =====
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
  participant1?: AuthUser;
  participant2?: AuthUser;
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

// ===== AUTHENTICATION FUNCTIONS =====
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

  // Try to get data from users table
  const { data: userData, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (error || !userData) {
    console.log('⚠️ User not found in public.users, using auth data as fallback');
    
    // Try to create user record if missing
    if (!error || error.code === 'PGRST116') {
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

// ===== TUTOR STUDENT MANAGEMENT =====
export const getTutorStudents = async (): Promise<TutorStudent[]> => {
  try {
    console.log('🔍 Getting tutor students with progress data...');
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Not authenticated');
    }

    // Get relationships with student details
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

    // Get progress data for each student
    const studentsWithProgress: TutorStudent[] = await Promise.all(
      relationships.map(async (rel) => {
        const studentId = rel.student_id;
        
        // Get student lessons data
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

        // Calculate progress statistics
        const lessons = studentLessons || [];
        const totalLessonsAssigned = lessons.length;
        const completedLessons = lessons.filter(l => l.status === 'completed');
        const lessonsCompleted = completedLessons.length;
        
        // Calculate average progress
        const totalProgress = lessons.reduce((sum, lesson) => sum + (lesson.progress || 0), 0);
        const averageProgress = totalLessonsAssigned > 0 ? Math.round(totalProgress / totalLessonsAssigned) : 0;
        
        // Estimate total hours (1 hour per lesson)
        const totalHours = lessonsCompleted;
        
        // Determine level based on completed lessons
        let level = 'Beginner';
        if (lessonsCompleted >= 10) {
          level = 'Advanced';
        } else if (lessonsCompleted >= 5) {
          level = 'Intermediate';
        }

        // Find last activity
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
          notes: rel.notes,
          is_active: rel.is_active,
          
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

  } catch (error) {
    console.error('❌ Error fetching tutor students:', error);
    throw error;
  }
};

export const getTutorInvitations = async (): Promise<RelationshipInvitation[]> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Not authenticated');
    }
    
    const { data, error } = await supabase
      .from('relationship_invitations')
      .select('*')
      .eq('tutor_id', user.id)
      .order('invited_at', { ascending: false });

    if (error) {
      console.error('❌ Error getting invitations:', error);
      throw error;
    }
    
    console.log('✅ Found', data?.length || 0, 'invitations for tutor');
    return data as RelationshipInvitation[];

  } catch (error) {
    console.error('❌ Error in getTutorInvitations:', error);
    throw error;
  }
};

export const sendStudentInvitation = async (studentEmail: string, message?: string) => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('Not authenticated');
  }

  // Check if user is tutor
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

  // Check for existing invitations
  const { data: existingInvitation } = await supabase
    .from('relationship_invitations')
    .select('id, status, expires_at')
    .eq('tutor_id', user.id)
    .eq('student_email', studentEmail.toLowerCase().trim())
    .eq('status', 'pending')
    .maybeSingle();

  if (existingInvitation) {
    const expiresAt = new Date(existingInvitation.expires_at);
    const now = new Date();
    
    if (expiresAt > now) {
      throw new Error('Active invitation already exists for this email address');
    }
  }

  const { data, error } = await supabase
    .from('relationship_invitations')
    .insert({
      tutor_id: user.id,
      student_email: studentEmail.toLowerCase().trim(),
      message: message?.trim() || null
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error sending invitation:', error);
    
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

export const inviteStudent = async (tutorId: string, inviteData: InviteStudentData) => {
  return sendStudentInvitation(inviteData.studentEmail, inviteData.message);
};

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

export const searchTutorStudents = async (tutorId: string, searchTerm: string): Promise<TutorStudent[]> => {
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

export const findStudentByEmail = async (email: string) => {
  try {
    console.log('🔍 Looking for student:', email);
    
    const { data, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .eq('email', email.toLowerCase().trim())
      .eq('role', 'student')
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Error finding student:', error);
      throw error;
    }
    
    if (data) {
      console.log('✅ Found existing student:', data.first_name, data.last_name);
    } else {
      console.log('ℹ️ Student not found, they can register later');
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error in findStudentByEmail:', error);
    throw error;
  }
};

// ===== STUDENT MANAGEMENT =====
export const getStudentTutors = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Not authenticated');
    }

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
      .eq('student_id', user.id)
      .eq('status', 'accepted')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error getting student tutors:', error);
      throw error;
    }
    
    console.log('✅ Found', data?.length || 0, 'tutors for student');
    return data;
  } catch (error) {
    console.error('❌ Error in getStudentTutors:', error);
    throw error;
  }
};

// ===== LESSON MANAGEMENT =====
export const getTutorLessons = async (tutorId: string): Promise<LessonWithAssignments[]> => {
  try {
    console.log('🔍 Getting lessons for tutor:', tutorId);
    
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

    const lessonIds = allLessons.map(lesson => lesson.id);
    
    const { data: assignments, error: assignmentsError } = await supabase
      .from('student_lessons')
      .select('lesson_id, student_id, status, completed_at, progress')
      .in('lesson_id', lessonIds);

    if (assignmentsError) {
      console.error('❌ Error fetching assignments:', assignmentsError);
    }

    console.log('✅ Found', assignments?.length || 0, 'assignments');

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

export const createLesson = async (tutorId: string, lessonData: CreateLessonData): Promise<Lesson> => {
  try {
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

    // Create student assignments
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
        console.error('Error assigning lesson to students:', assignmentError);
      }
    }

    // Create exercises if provided
    if (lessonData.exercises && lessonData.exercises.length > 0) {
      await createLessonExercises(lesson.id, lessonData.exercises);
    }

    return lesson;
  } catch (error) {
    console.error('Error creating lesson:', error);
    throw error;
  }
};

export const updateLesson = async (lessonId: string, lessonData: UpdateLessonData): Promise<Lesson> => {
  try {
    const updateData: any = {
      ...lessonData,
      updated_at: new Date().toISOString()
    };

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

export const deleteLesson = async (lessonId: string): Promise<void> => {
  try {
    // Delete assignments first
    const { error: assignmentsError } = await supabase
      .from('student_lessons')
      .delete()
      .eq('lesson_id', lessonId);

    if (assignmentsError) throw assignmentsError;

    // Delete exercises
    await supabase
      .from('lesson_exercises')
      .delete()
      .eq('lesson_id', lessonId);

    // Delete lesson
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

export const assignLessonToStudents = async (lessonId: string, studentIds: string[]) => {
  try {
    const { data: existingAssignments, error: checkError } = await supabase
      .from('student_lessons')
      .select('student_id')
      .eq('lesson_id', lessonId)
      .in('student_id', studentIds)

    if (checkError) {
      console.error('Error checking existing assignments:', checkError)
      throw checkError
    }

    const existingStudentIds = existingAssignments?.map(row => row.student_id) || []
    const newStudentIds = studentIds.filter(id => !existingStudentIds.includes(id))

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

// ===== STUDENT LESSONS =====
export const getStudentLessons = async (studentId: string): Promise<StudentUpcomingLesson[]> => {
  try {
    const { data, error } = await supabase
      .from('student_lessons')
      .select(`
        id,
        lesson_id,
        status,
        progress,
        assigned_at,
        lesson:lessons (
          id,
          title,
          description,
          tutor:users!tutor_id (
            first_name,
            last_name
          )
        )
      `)
      .eq('student_id', studentId)
      .in('status', ['assigned', 'in_progress'])
      .order('assigned_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(sl => ({
      id: sl.id,
      title: sl.lesson.title,
      description: sl.lesson.description || undefined,
      tutor_name: `${sl.lesson.tutor.first_name} ${sl.lesson.tutor.last_name}`,
      assigned_at: sl.assigned_at,
      status: sl.status as 'assigned' | 'in_progress',
      progress: sl.progress,
      lesson_id: sl.lesson_id
    }));
  } catch (error) {
    console.error('Error fetching student lessons:', error);
    throw error;
  }
};

export const getStudentStats = async (studentId: string): Promise<StudentStats> => {
  try {
    const { data: studentLessons, error } = await supabase
      .from('student_lessons')
      .select(`
        id,
        lesson_id,
        status,
        progress,
        completed_at,
        assigned_at,
        lesson:lessons (
          title,
          tutor:users!tutor_id (
            first_name,
            last_name
          )
        )
      `)
      .eq('student_id', studentId);

    if (error) throw error;

    const lessons = studentLessons || [];
    const totalLessonsAssigned = lessons.length;
    const completedLessons = lessons.filter(l => l.status === 'completed');
    const lessonsCompleted = completedLessons.length;
    
    // Calculate average progress
    const totalProgress = lessons.reduce((sum, lesson) => sum + (lesson.progress || 0), 0);
    const averageProgress = totalLessonsAssigned > 0 ? Math.round(totalProgress / totalLessonsAssigned) : 0;
    
    // Estimate total hours and streak
    const totalHours = Math.round(lessonsCompleted * 0.5); // 30 min per lesson
    const studyStreak = calculateStudyStreak(completedLessons);
    
    // Determine level
    let currentLevel = 'Beginner';
    if (lessonsCompleted >= 10) {
      currentLevel = 'Advanced';
    } else if (lessonsCompleted >= 5) {
      currentLevel = 'Intermediate';
    }

    // Get upcoming lessons
    const upcomingLessons = lessons
      .filter(l => l.status === 'assigned' || l.status === 'in_progress')
      .slice(0, 5)
      .map(sl => ({
        id: sl.id,
        title: sl.lesson.title,
        tutor_name: `${sl.lesson.tutor.first_name} ${sl.lesson.tutor.last_name}`,
        assigned_at: sl.assigned_at,
        status: sl.status as 'assigned' | 'in_progress',
        progress: sl.progress,
        lesson_id: sl.lesson_id
      }));

    // Find last activity
    const recentActivity = completedLessons.length > 0 
      ? completedLessons
          .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())[0]
          .completed_at
      : null;

    const kpis: StudentKPIs = {
      lessonsCompleted,
      studyStreak,
      totalHours,
      totalLessonsAssigned,
      averageProgress,
      currentLevel
    };

    return {
      kpis,
      upcomingLessons,
      recentActivity
    };

  } catch (error) {
    console.error('Error fetching student stats:', error);
    throw error;
  }
};

// Helper function to calculate study streak
const calculateStudyStreak = (completedLessons: any[]): number => {
  if (completedLessons.length === 0) return 0;
  
  const sortedLessons = completedLessons
    .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
  
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  for (const lesson of sortedLessons) {
    const lessonDate = new Date(lesson.completed_at);
    lessonDate.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((currentDate.getTime() - lessonDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === streak || (streak === 0 && daysDiff <= 1)) {
      streak++;
      currentDate = new Date(lessonDate);
    } else {
      break;
    }
  }
  
  return streak;
};

export const updateStudentLessonProgress = async (
  lessonId: string, 
  progress: number,
  status?: 'assigned' | 'in_progress' | 'completed'
): Promise<void> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Not authenticated');
    }

    const updateData: any = {
      progress: Math.max(0, Math.min(100, progress)),
      updated_at: new Date().toISOString()
    };

    if (status) {
      updateData.status = status;
      
      if (status === 'in_progress' && !updateData.started_at) {
        updateData.started_at = new Date().toISOString();
      }
      
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
        updateData.progress = 100;
      }
    }

    const { error } = await supabase
      .from('student_lessons')
      .update(updateData)
      .eq('lesson_id', lessonId)
      .eq('student_id', user.id);

    if (error) {
      console.error('Error updating lesson progress:', error);
      throw error;
    }

    console.log('✅ Lesson progress updated successfully');
  } catch (error) {
    console.error('Error updating student lesson progress:', error);
    throw error;
  }
};

export const startLesson = async (lessonId: string, studentId: string): Promise<void> => {
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
  } catch (error) {
    console.error('Error starting lesson:', error);
    throw error;
  }
};

export const completeLesson = async (
  lessonId: string,
  studentId: string,
  score: number,
  timeSpent: number
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('student_lessons')
      .update({
        status: 'completed',
        score: score,
        progress: score,
        time_spent: timeSpent,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('lesson_id', lessonId)
      .eq('student_id', studentId);

    if (error) throw error;
  } catch (error) {
    console.error('Error completing lesson:', error);
    throw error;
  }
};

// ===== EXERCISE MANAGEMENT =====
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

// ===== MESSAGING FUNCTIONS =====
export const getConversations = async (): Promise<Conversation[]> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Not authenticated');
    }

    console.log('💬 Getting conversations for user:', user.id);

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participant1:users!participant1_id(id, first_name, last_name, email, avatar_url),
        participant2:users!participant2_id(id, first_name, last_name, email, avatar_url)
      `)
      .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false, nullsLast: true });

    if (error) {
      console.error('❌ Error fetching conversations:', error);
      throw error;
    }

    // Get unread counts for each conversation
    const conversationsWithUnread = await Promise.all(
      (conversations || []).map(async (conv) => {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .neq('sender_id', user.id)
          .is('read_at', null);

        return {
          ...conv,
          unread_count: count || 0
        };
      })
    );

    console.log('✅ Found', conversationsWithUnread.length, 'conversations');
    return conversationsWithUnread;

  } catch (error) {
    console.error('❌ Error in getConversations:', error);
    throw error;
  }
};

export const getMessages = async (conversationId: string): Promise<Message[]> => {
  try {
    console.log('📨 Getting messages for conversation:', conversationId);

    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!sender_id(id, first_name, last_name, email, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching messages:', error);
      throw error;
    }

    console.log('✅ Found', messages?.length || 0, 'messages');
    return messages || [];

  } catch (error) {
    console.error('❌ Error in getMessages:', error);
    throw error;
  }
};

export const sendMessage = async (conversationId: string, content: string): Promise<Message> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Not authenticated');
    }

    if (!content.trim()) {
      throw new Error('Message content cannot be empty');
    }

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

    // Update conversation's last_message_at
    await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        last_message: content.trim()
      })
      .eq('id', conversationId);

    console.log('✅ Message sent successfully');
    return message;

  } catch (error) {
    console.error('❌ Error in sendMessage:', error);
    throw error;
  }
};

export const createOrGetConversation = async (otherUserId: string): Promise<string> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Not authenticated');
    }

    console.log('🤝 Creating/getting conversation with user:', otherUserId);

    // Check if conversation already exists
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

  } catch (error) {
    console.error('❌ Error in createOrGetConversation:', error);
    throw error;
  }
};

export const markConversationAsRead = async (conversationId: string): Promise<void> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Not authenticated');
    }

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
  } catch (error) {
    console.error('❌ Error in markConversationAsRead:', error);
    throw error;
  }
};

export const getAvailableUsersForChat = async (): Promise<AuthUser[]> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Not authenticated');
    }

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
  } catch (error) {
    console.error('❌ Error getting available users for chat:', error);
    throw error;
  }
};

export const getConversationWithMessages = async (conversationId: string) => {
  try {
    console.log('💬 Getting conversation with messages:', conversationId);
    
    // Get conversation details
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select(`
        *,
        participant1:users!participant1_id(id, first_name, last_name, email, avatar_url),
        participant2:users!participant2_id(id, first_name, last_name, email, avatar_url)
      `)
      .eq('id', conversationId)
      .single();

    if (convError) {
      console.error('❌ Error fetching conversation:', convError);
      throw convError;
    }

    // Get messages for this conversation
    const messages = await getMessages(conversationId);

    const result = {
      ...conversation,
      messages
    };

    console.log('✅ Retrieved conversation with', messages.length, 'messages');
    return result;

  } catch (error) {
    console.error('❌ Error in getConversationWithMessages:', error);
    throw error;
  }
};

// ===== REAL-TIME SUBSCRIPTIONS =====
export const subscribeToConversations = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel('conversations')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `or(participant1_id.eq.${userId},participant2_id.eq.${userId})`
      },
      callback
    )
    .subscribe();
};

export const subscribeToMessages = (conversationId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      callback
    )
    .subscribe();
};

export const subscribeToStudentLessons = (studentId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`student_lessons:${studentId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'student_lessons',
        filter: `student_id=eq.${studentId}`
      },
      callback
    )
    .subscribe();
};

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

// ===== STUDENT DASHBOARD DATA =====
export const getStudentDashboardData = async (): Promise<StudentStats> => {
  try {
    console.log('📊 Getting student dashboard data...');
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Not authenticated');
    }

    console.log('👤 Current student ID:', user.id);

    // Get student's lesson assignments with lesson and tutor details
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

    // Calculate KPIs
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

    // Get upcoming lessons (assigned or in progress, not completed) with safe null checks
    const upcomingLessons: StudentUpcomingLesson[] = lessons
      .filter(l => (l.status === 'assigned' || l.status === 'in_progress') && l.lessons)
      .slice(0, 6) // Limit to 6 most recent
      .map(l => ({
        id: l.id,
        title: l.lessons?.title || 'Unknown Lesson',
        description: l.lessons?.description || undefined,
        tutor_name: l.lessons?.tutor 
          ? `${l.lessons.tutor.first_name || ''} ${l.lessons.tutor.last_name || ''}`.trim()
          : 'Unknown Tutor',
        assigned_at: l.assigned_at,
        status: l.status as 'assigned' | 'in_progress',
        progress: l.progress,
        lesson_id: l.lesson_id
      }));

    // Get most recent activity
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

// ===== DEBUG AND UTILITY FUNCTIONS =====
export const debugGetAllInvitations = async () => {
  console.log('🐛 DEBUG: Checking all invitations in database...');
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('Not authenticated');
  }

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

export const generateInvitationLink = (invitation: RelationshipInvitation): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/accept-invitation?token=${invitation.invitation_token}`;
};

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

// ===== BACKWARD COMPATIBILITY ALIASES =====

// Authentication aliases
export const inviteStudentByEmail = sendStudentInvitation;
export const getStudentLessonStats = getStudentStats;

// Messaging function aliases for backward compatibility
export const getUserConversations = getConversations;
export const getConversationMessages = getMessages;
export const createConversation = createOrGetConversation;
export const sendMessageToConversation = sendMessage;
export const markMessagesAsRead = markConversationAsRead;

// Student/Tutor relationship aliases
export const getTutorStudentList = getTutorStudents;
export const getStudentTutorList = getStudentTutors;
export const inviteStudentToTutor = sendStudentInvitation;
export const getTutorInvitationList = getTutorInvitations;

// Lesson management aliases
export const getLessonsForTutor = getTutorLessons;
export const getLessonsForStudent = getStudentLessons;
export const assignStudentsToLesson = assignLessonToStudents;
export const removeStudentsFromLesson = unassignLessonFromStudents;

// Real-time subscription aliases (subscribeToConversationUpdates already defined above)
export const subscribeToMessageUpdates = subscribeToMessages;
export const subscribeToStudentLessonUpdates = subscribeToStudentLessons;

// Additional subscription aliases that might be needed
export const subscribeToUserConversations = subscribeToConversations;
export const subscribeToLessonProgress = subscribeToStudentLessons;
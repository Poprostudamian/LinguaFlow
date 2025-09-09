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
  
  const { data, error } = await supabase
    .from('tutor_students')
    .select('*')
    .order('relationship_created', { ascending: false });

  if (error) {
    console.error('❌ Error getting tutor students:', error);
    throw error;
  }
  
  console.log('✅ Found', data?.length || 0, 'students');
  return data as TutorStudent[];
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
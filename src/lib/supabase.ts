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

// Authentication helper functions
export const signUp = async (data: SignUpData) => {
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
  })

  if (authError) throw authError

  return authData
}

export const signIn = async (data: SignInData) => {
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })

  if (error) throw error

  return authData
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  // Get additional user data from our users table
  const { data: userData, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (error || !userData) {
    // Fallback to auth user data if users table query fails
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

// Dodaj te interfejsy i funkcje do istniejącego pliku src/lib/supabase.ts

// === INTERFACES FOR STEP 2 ===
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

// === INVITATION FUNCTIONS ===

// Send invitation to student by email
export const sendStudentInvitation = async (studentEmail: string, message?: string) => {
  const { data, error } = await supabase
    .from('relationship_invitations')
    .insert({
      student_email: studentEmail.toLowerCase().trim(),
      message: message?.trim() || null
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Get all invitations sent by tutor
export const getTutorInvitations = async () => {
  const { data, error } = await supabase
    .from('relationship_invitations')
    .select('*')
    .order('invited_at', { ascending: false })

  if (error) throw error
  return data as RelationshipInvitation[]
}

// Accept invitation (for students)
export const acceptInvitation = async (invitationId: string) => {
  const { data, error } = await supabase
    .from('relationship_invitations')
    .update({
      status: 'accepted',
      responded_at: new Date().toISOString()
    })
    .eq('id', invitationId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Decline invitation (for students)
export const declineInvitation = async (invitationId: string) => {
  const { data, error } = await supabase
    .from('relationship_invitations')
    .update({
      status: 'declined',
      responded_at: new Date().toISOString()
    })
    .eq('id', invitationId)
    .select()
    .single()

  if (error) throw error
  return data
}

// === RELATIONSHIP FUNCTIONS ===

// Get all students for a tutor
export const getTutorStudents = async () => {
  const { data, error } = await supabase
    .from('tutor_students')
    .select('*')
    .order('relationship_created', { ascending: false })

  if (error) throw error
  return data as TutorStudent[]
}

// Get all tutors for a student
export const getStudentTutors = async () => {
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
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Create direct relationship (for when both users exist)
export const createDirectRelationship = async (studentId: string, notes?: string) => {
  const { data, error } = await supabase
    .from('user_relationships')
    .insert({
      student_id: studentId,
      notes: notes?.trim() || null
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Update relationship notes
export const updateRelationshipNotes = async (relationshipId: string, notes: string) => {
  const { data, error } = await supabase
    .from('user_relationships')
    .update({
      notes: notes.trim() || null
    })
    .eq('id', relationshipId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Deactivate relationship (soft delete)
export const deactivateRelationship = async (relationshipId: string) => {
  const { data, error } = await supabase
    .from('user_relationships')
    .update({
      is_active: false
    })
    .eq('id', relationshipId)
    .select()
    .single()

  if (error) throw error
  return data
}

// === UTILITY FUNCTIONS ===

// Check if email is already a student
export const findStudentByEmail = async (email: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, first_name, last_name, email')
    .eq('email', email.toLowerCase().trim())
    .eq('role', 'student')
    .maybeSingle()

  if (error) throw error
  return data
}

// Expire old invitations (utility function)
export const expireOldInvitations = async () => {
  const { error } = await supabase.rpc('expire_old_invitations')
  if (error) throw error
}

// Get pending invitations for current user (student)
export const getMyPendingInvitations = async () => {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('relationship_invitations')
    .select(`
      *,
      tutor:users!tutor_id (
        first_name,
        last_name,
        email
      )
    `)
    .eq('student_email', user.email)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('invited_at', { ascending: false })

  if (error) throw error
  return data
}
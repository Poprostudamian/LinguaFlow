// DODAJ te interfejsy i funkcje do src/lib/supabase.ts

// === INTERFACES FOR STEP 2 === (dodaj po istniejących interfejsach)
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

// === FUNCTIONS FOR STEP 2 === (dodaj na końcu pliku)

// Get all students for a tutor
export const getTutorStudents = async () => {
  console.log('🔍 Getting tutor students...');
  
  const { data, error } = await supabase
    .from('tutor_students')
    .select('*')
    .order('relationship_created', { ascending: false })

  if (error) {
    console.error('❌ Error getting tutor students:', error);
    throw error;
  }
  
  console.log('✅ Found', data?.length || 0, 'students');
  return data as TutorStudent[]
}

// Get all invitations sent by tutor
export const getTutorInvitations = async () => {
  console.log('🔍 Getting tutor invitations...');
  
  const { data, error } = await supabase
    .from('relationship_invitations')
    .select('*')
    .order('invited_at', { ascending: false })

  if (error) {
    console.error('❌ Error getting invitations:', error);
    throw error;
  }
  
  console.log('✅ Found', data?.length || 0, 'invitations');
  return data as RelationshipInvitation[]
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
    .single()

  if (error) {
    console.error('❌ Error sending invitation:', error);
    throw error;
  }
  
  console.log('✅ Invitation sent successfully');
  return data
}

// Check if email is already a student
export const findStudentByEmail = async (email: string) => {
  console.log('🔍 Looking for student:', email);
  
  const { data, error } = await supabase
    .from('users')
    .select('id, first_name, last_name, email')
    .eq('email', email.toLowerCase().trim())
    .eq('role', 'student')
    .maybeSingle()

  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    console.error('❌ Error finding student:', error);
    throw error;
  }
  
  if (data) {
    console.log('✅ Found existing student:', data.first_name, data.last_name);
  } else {
    console.log('ℹ️ Student not found, they can register later');
  }
  
  return data
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
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error getting student tutors:', error);
    throw error;
  }
  
  console.log('✅ Found', data?.length || 0, 'tutors');
  return data
}
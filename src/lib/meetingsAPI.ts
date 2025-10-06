// src/lib/meetingsAPI.ts
import { supabase } from './supabase';

// ==================== TYPES ====================

export interface Meeting {
  id: string;
  tutor_id: string;
  title: string;
  description: string | null;
  meeting_url: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface MeetingParticipant {
  id: string;
  meeting_id: string;
  student_id: string;
  invited_at: string;
  joined_at: string | null;
  left_at: string | null;
  status: 'invited' | 'joined' | 'missed' | 'cancelled';
}

export interface MeetingWithParticipants extends Meeting {
  participants: Array<{
    id: string;
    student_id: string;
    name: string;
    email: string;
    status: string;
  }>;
}

export interface CreateMeetingData {
  title: string;
  description?: string;
  meeting_url: string;
  scheduled_at: string;
  duration_minutes: number;
  student_ids: string[];
}

// ==================== API FUNCTIONS ====================

/**
 * Pobierz wszystkie spotkania tutora
 */
export async function getTutorMeetings(tutorId: string): Promise<MeetingWithParticipants[]> {
  try {
    console.log('📅 [MEETINGS API] Fetching meetings for tutor:', tutorId);

    // KROK 1: Pobierz spotkania
    const { data: meetings, error: meetingsError } = await supabase
      .from('meetings')
      .select('*')
      .eq('tutor_id', tutorId)
      .order('scheduled_at', { ascending: true });

    if (meetingsError) {
      console.error('❌ [MEETINGS API] Error fetching meetings:', meetingsError);
      throw meetingsError;
    }

    console.log('✅ [MEETINGS API] Found', meetings?.length || 0, 'meetings');

    if (!meetings || meetings.length === 0) {
      return [];
    }

    // KROK 2: Pobierz uczestników dla wszystkich spotkań
    const meetingIds = meetings.map(m => m.id);
    const { data: participants, error: participantsError } = await supabase
      .from('meeting_participants')
      .select(`
        *,
        student:users!meeting_participants_student_id_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .in('meeting_id', meetingIds);

    if (participantsError) {
      console.error('❌ [MEETINGS API] Error fetching participants:', participantsError);
      // Nie rzucamy błędu - zwracamy spotkania bez uczestników
    }

    console.log('✅ [MEETINGS API] Found', participants?.length || 0, 'participants');

    // KROK 3: Połącz dane
    const meetingsWithParticipants: MeetingWithParticipants[] = meetings.map(meeting => ({
      ...meeting,
      participants: (participants || [])
        .filter(p => p.meeting_id === meeting.id)
        .map(p => ({
          id: p.id,
          student_id: p.student_id,
          name: p.student ? `${p.student.first_name} ${p.student.last_name}` : 'Unknown',
          email: p.student?.email || '',
          status: p.status
        }))
    }));

    console.log('✅ [MEETINGS API] Successfully loaded', meetingsWithParticipants.length, 'meetings with participants');
    return meetingsWithParticipants;

  } catch (error) {
    console.error('💥 [MEETINGS API] Complete failure:', error);
    throw error;
  }
}

/**
 * Stwórz nowe spotkanie z uczestnikami
 */
export async function createMeeting(
  tutorId: string,
  data: CreateMeetingData
): Promise<MeetingWithParticipants> {
  try {
    console.log('📅 [MEETINGS API] Creating meeting:', data.title);

    // KROK 1: Stwórz spotkanie
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .insert({
        tutor_id: tutorId,
        title: data.title,
        description: data.description || null,
        meeting_url: data.meeting_url,
        scheduled_at: data.scheduled_at,
        duration_minutes: data.duration_minutes,
        status: 'scheduled'
      })
      .select()
      .single();

    if (meetingError || !meeting) {
      console.error('❌ [MEETINGS API] Error creating meeting:', meetingError);
      throw meetingError || new Error('Failed to create meeting');
    }

    console.log('✅ [MEETINGS API] Meeting created:', meeting.id);

    // KROK 2: Dodaj uczestników
    if (data.student_ids.length > 0) {
      const participantsData = data.student_ids.map(studentId => ({
        meeting_id: meeting.id,
        student_id: studentId,
        status: 'invited' as const
      }));

      const { error: participantsError } = await supabase
        .from('meeting_participants')
        .insert(participantsData);

      if (participantsError) {
        console.error('❌ [MEETINGS API] Error adding participants:', participantsError);
        // Usuń spotkanie jeśli nie udało się dodać uczestników
        await supabase.from('meetings').delete().eq('id', meeting.id);
        throw participantsError;
      }

      console.log('✅ [MEETINGS API] Added', data.student_ids.length, 'participants');
    }

    // KROK 3: Pobierz pełne dane spotkania z uczestnikami
    const { data: participants } = await supabase
      .from('meeting_participants')
      .select(`
        *,
        student:users!meeting_participants_student_id_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('meeting_id', meeting.id);

    const meetingWithParticipants: MeetingWithParticipants = {
      ...meeting,
      participants: (participants || []).map(p => ({
        id: p.id,
        student_id: p.student_id,
        name: p.student ? `${p.student.first_name} ${p.student.last_name}` : 'Unknown',
        email: p.student?.email || '',
        status: p.status
      }))
    };

    console.log('✅ [MEETINGS API] Meeting created successfully with', meetingWithParticipants.participants.length, 'participants');
    return meetingWithParticipants;

  } catch (error) {
    console.error('💥 [MEETINGS API] Failed to create meeting:', error);
    throw error;
  }
}

/**
 * Aktualizuj spotkanie
 */
export async function updateMeeting(
  meetingId: string,
  updates: Partial<Omit<Meeting, 'id' | 'tutor_id' | 'created_at' | 'updated_at'>>
): Promise<Meeting> {
  try {
    console.log('📅 [MEETINGS API] Updating meeting:', meetingId);

    const { data, error } = await supabase
      .from('meetings')
      .update(updates)
      .eq('id', meetingId)
      .select()
      .single();

    if (error || !data) {
      console.error('❌ [MEETINGS API] Error updating meeting:', error);
      throw error || new Error('Failed to update meeting');
    }

    console.log('✅ [MEETINGS API] Meeting updated successfully');
    return data;

  } catch (error) {
    console.error('💥 [MEETINGS API] Failed to update meeting:', error);
    throw error;
  }
}

/**
 * Usuń spotkanie (cascade usunie też uczestników)
 */
export async function deleteMeeting(meetingId: string): Promise<void> {
  try {
    console.log('📅 [MEETINGS API] Deleting meeting:', meetingId);

    const { error } = await supabase
      .from('meetings')
      .delete()
      .eq('id', meetingId);

    if (error) {
      console.error('❌ [MEETINGS API] Error deleting meeting:', error);
      throw error;
    }

    console.log('✅ [MEETINGS API] Meeting deleted successfully');

  } catch (error) {
    console.error('💥 [MEETINGS API] Failed to delete meeting:', error);
    throw error;
  }
}

/**
 * Pobierz spotkania studenta
 */
export async function getStudentMeetings(studentId: string): Promise<MeetingWithParticipants[]> {
  try {
    console.log('📅 [MEETINGS API] Fetching meetings for student:', studentId);

    // Pobierz uczestnictwa studenta
    const { data: participations, error: participationsError } = await supabase
      .from('meeting_participants')
      .select('meeting_id')
      .eq('student_id', studentId);

    if (participationsError) {
      console.error('❌ [MEETINGS API] Error fetching participations:', participationsError);
      throw participationsError;
    }

    if (!participations || participations.length === 0) {
      return [];
    }

    const meetingIds = participations.map(p => p.meeting_id);

    // Pobierz spotkania
    const { data: meetings, error: meetingsError } = await supabase
      .from('meetings')
      .select(`
        *,
        tutor:users!meetings_tutor_id_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .in('id', meetingIds)
      .order('scheduled_at', { ascending: true });

    if (meetingsError) {
      console.error('❌ [MEETINGS API] Error fetching meetings:', meetingsError);
      throw meetingsError;
    }

    // Pobierz wszystkich uczestników
    const { data: allParticipants } = await supabase
      .from('meeting_participants')
      .select(`
        *,
        student:users!meeting_participants_student_id_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .in('meeting_id', meetingIds);

    const meetingsWithParticipants: MeetingWithParticipants[] = (meetings || []).map(meeting => ({
      ...meeting,
      participants: (allParticipants || [])
        .filter(p => p.meeting_id === meeting.id)
        .map(p => ({
          id: p.id,
          student_id: p.student_id,
          name: p.student ? `${p.student.first_name} ${p.student.last_name}` : 'Unknown',
          email: p.student?.email || '',
          status: p.status
        }))
    }));

    console.log('✅ [MEETINGS API] Found', meetingsWithParticipants.length, 'meetings for student');
    return meetingsWithParticipants;

  } catch (error) {
    console.error('💥 [MEETINGS API] Failed to fetch student meetings:', error);
    throw error;
  }
}
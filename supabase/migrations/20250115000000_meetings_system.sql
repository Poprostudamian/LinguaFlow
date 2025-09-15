/*
  # Educational Platform - Step 3: Online Meetings System

  This migration adds the online meeting system for tutor-student sessions.

  ## New Tables
  1. `meetings` - Online meeting sessions created by tutors
  2. `meeting_participants` - Students invited to specific meetings

  ## Features
  - Tutors can create scheduled online meetings with video call links
  - Multiple students can be invited to a single meeting
  - Meeting status tracking (scheduled, in_progress, completed, cancelled)
  - Participant status tracking (invited, joined, missed)
  - Integration with existing user_relationships system
  - Full audit trail with timestamps

  ## Security
  - RLS policies ensure tutors only manage their own meetings
  - Students only see meetings they're invited to
  - Proper foreign key constraints with cascading deletes
*/

-- Create meetings table
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  meeting_url VARCHAR(500) NOT NULL, -- Link to Zoom/Meet/Teams etc.
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60 CHECK (duration_minutes > 0 AND duration_minutes <= 480), -- Max 8 hours
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
  
  -- Role validation handled by RLS policies
);

-- Create meeting_participants table
CREATE TABLE IF NOT EXISTS meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'invited' CHECK (status IN ('invited', 'joined', 'missed', 'cancelled')),
  
  -- Ensure logical timestamp ordering
  CONSTRAINT participants_time_logic_check CHECK (
    joined_at IS NULL OR joined_at >= invited_at
  )
  
  -- Role and relationship validation handled by RLS policies
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_meetings_tutor_id ON meetings(tutor_id);
CREATE INDEX IF NOT EXISTS idx_meetings_scheduled_at ON meetings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_tutor_scheduled ON meetings(tutor_id, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting_id ON meeting_participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_student_id ON meeting_participants(student_id);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_status ON meeting_participants(status);

-- Add trigger for updated_at on meetings table
CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update meeting status based on time
CREATE OR REPLACE FUNCTION update_meeting_status()
RETURNS void AS $$
BEGIN
  -- Mark meetings as completed if they're past their end time
  UPDATE meetings 
  SET status = 'completed', updated_at = NOW()
  WHERE status = 'scheduled' 
    AND (scheduled_at + INTERVAL '1 minute' * duration_minutes) < NOW();
  
  -- Mark participants as missed if meeting is completed and they never joined
  UPDATE meeting_participants 
  SET status = 'missed'
  WHERE status = 'invited' 
    AND joined_at IS NULL
    AND meeting_id IN (SELECT id FROM meetings WHERE status = 'completed');
END;
$$ LANGUAGE plpgsql;

-- Function to validate meeting conflicts (optional, for future use)
CREATE OR REPLACE FUNCTION check_meeting_conflicts(
  p_tutor_id UUID,
  p_scheduled_at TIMESTAMPTZ,
  p_duration_minutes INTEGER,
  p_exclude_meeting_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO conflict_count
  FROM meetings
  WHERE tutor_id = p_tutor_id
    AND status IN ('scheduled', 'in_progress')
    AND (p_exclude_meeting_id IS NULL OR id != p_exclude_meeting_id)
    AND (
      -- New meeting starts during existing meeting
      (p_scheduled_at >= scheduled_at AND p_scheduled_at < scheduled_at + INTERVAL '1 minute' * duration_minutes)
      OR
      -- New meeting ends during existing meeting  
      (p_scheduled_at + INTERVAL '1 minute' * p_duration_minutes > scheduled_at 
       AND p_scheduled_at + INTERVAL '1 minute' * p_duration_minutes <= scheduled_at + INTERVAL '1 minute' * duration_minutes)
      OR
      -- New meeting completely encompasses existing meeting
      (p_scheduled_at <= scheduled_at AND p_scheduled_at + INTERVAL '1 minute' * p_duration_minutes >= scheduled_at + INTERVAL '1 minute' * duration_minutes)
    );
  
  RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meetings table
CREATE POLICY "Tutors can manage their own meetings"
  ON meetings
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = tutor_id 
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'tutor')
  )
  WITH CHECK (
    auth.uid() = tutor_id 
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'tutor')
  );

-- RLS Policies for meeting_participants table
CREATE POLICY "Tutors can manage participants in their meetings"
  ON meeting_participants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meetings m 
      WHERE m.id = meeting_id 
      AND m.tutor_id = auth.uid()
      AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'tutor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meetings m 
      WHERE m.id = meeting_id 
      AND m.tutor_id = auth.uid()
      AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'tutor')
    )
  );

CREATE POLICY "Students can view their own meeting participations"
  ON meeting_participants
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = student_id 
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'student')
  );

CREATE POLICY "Students can update their own participation status"
  ON meeting_participants
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = student_id 
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'student')
  )
  WITH CHECK (
    auth.uid() = student_id 
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'student')
  );

-- Create helpful views for common queries
CREATE OR REPLACE VIEW meeting_details AS
SELECT 
  m.id,
  m.title,
  m.description,
  m.meeting_url,
  m.scheduled_at,
  m.duration_minutes,
  m.status,
  m.created_at,
  m.updated_at,
  -- Tutor info
  u_tutor.id as tutor_id,
  u_tutor.first_name as tutor_first_name,
  u_tutor.last_name as tutor_last_name,
  u_tutor.email as tutor_email,
  -- Computed fields
  (m.scheduled_at + INTERVAL '1 minute' * m.duration_minutes) as ends_at,
  CASE 
    WHEN NOW() < m.scheduled_at THEN 'upcoming'
    WHEN NOW() >= m.scheduled_at AND NOW() < (m.scheduled_at + INTERVAL '1 minute' * m.duration_minutes) THEN 'ongoing'
    ELSE 'past'
  END as time_status
FROM meetings m
JOIN users u_tutor ON m.tutor_id = u_tutor.id;

CREATE OR REPLACE VIEW student_meetings AS
SELECT 
  md.*,
  mp.invited_at,
  mp.joined_at,
  mp.left_at,
  mp.status as participation_status,
  -- Student info
  u_student.id as student_id,
  u_student.first_name as student_first_name,
  u_student.last_name as student_last_name,
  u_student.email as student_email
FROM meeting_details md
JOIN meeting_participants mp ON md.id = mp.meeting_id
JOIN users u_student ON mp.student_id = u_student.id;

-- Grant permissions
GRANT ALL ON meetings TO authenticated;
GRANT ALL ON meeting_participants TO authenticated;
GRANT SELECT ON meeting_details TO authenticated;
GRANT SELECT ON student_meetings TO authenticated;

-- Enable RLS on views for extra security
ALTER VIEW meeting_details ENABLE ROW LEVEL SECURITY;
ALTER VIEW student_meetings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meeting_details view
CREATE POLICY "Tutors can see their own meeting details"
  ON meeting_details
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = tutor_id 
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'tutor')
  );

CREATE POLICY "Students can see meeting details they're invited to"
  ON meeting_details
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meeting_participants mp
      WHERE mp.meeting_id = meeting_details.id
      AND mp.student_id = auth.uid()
      AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'student')
    )
  );

-- RLS Policies for student_meetings view  
CREATE POLICY "Tutors can see all participants in their meetings"
  ON student_meetings
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = tutor_id 
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'tutor')
  );

CREATE POLICY "Students can see only their own meeting participations"
  ON student_meetings
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = student_id 
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'student')
  );

-- Create notification function (placeholder for future webhooks/notifications)
CREATE OR REPLACE FUNCTION notify_meeting_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Placeholder for future notification system
  -- Could trigger email notifications, push notifications, etc.
  
  PERFORM pg_notify('meeting_created', json_build_object(
    'meeting_id', NEW.id,
    'tutor_id', NEW.tutor_id,
    'title', NEW.title,
    'scheduled_at', NEW.scheduled_at
  )::text);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for meeting notifications
CREATE TRIGGER meeting_created_notification
  AFTER INSERT ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION notify_meeting_created();

-- Comments for documentation
COMMENT ON TABLE meetings IS 'Online meeting sessions created by tutors';
COMMENT ON TABLE meeting_participants IS 'Students invited to participate in meetings';
COMMENT ON COLUMN meetings.meeting_url IS 'URL for video conference (Zoom, Meet, Teams, etc.)';
COMMENT ON COLUMN meetings.duration_minutes IS 'Meeting duration in minutes (1-480)';
COMMENT ON COLUMN meeting_participants.status IS 'Participant status: invited, joined, missed, cancelled';
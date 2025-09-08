/*
  # Educational Platform - Step 2: User Relationships

  This migration adds tutor-student relationship management.

  ## New Tables
  1. `user_relationships` - Links tutors with students
  2. `relationship_invitations` - Manages invitation system

  ## Features
  - Secure invitation system by email
  - Automatic invitation acceptance when student registers
  - Relationship history tracking
  - Proper RLS policies
*/

-- Create user_relationships table
CREATE TABLE IF NOT EXISTS user_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  UNIQUE(tutor_id, student_id),
  CHECK (tutor_id != student_id)
);

-- Create relationship_invitations table
CREATE TABLE IF NOT EXISTS relationship_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_email VARCHAR(255) NOT NULL,
  student_id UUID REFERENCES users(id) ON DELETE SET NULL,
  invitation_token VARCHAR(255) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'base64'),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  message TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_relationships_tutor_id ON user_relationships(tutor_id);
CREATE INDEX IF NOT EXISTS idx_user_relationships_student_id ON user_relationships(student_id);
CREATE INDEX IF NOT EXISTS idx_user_relationships_is_active ON user_relationships(is_active);
CREATE INDEX IF NOT EXISTS idx_relationship_invitations_tutor_id ON relationship_invitations(tutor_id);
CREATE INDEX IF NOT EXISTS idx_relationship_invitations_student_email ON relationship_invitations(student_email);
CREATE INDEX IF NOT EXISTS idx_relationship_invitations_token ON relationship_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_relationship_invitations_status ON relationship_invitations(status);

-- Add trigger for updated_at on user_relationships
CREATE TRIGGER update_user_relationships_updated_at
  BEFORE UPDATE ON user_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-expire invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE relationship_invitations 
  SET status = 'expired'
  WHERE status = 'pending' 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to auto-accept invitations when student registers
CREATE OR REPLACE FUNCTION auto_accept_invitations()
RETURNS TRIGGER AS $$
BEGIN
  -- Update pending invitations for this email
  UPDATE relationship_invitations 
  SET 
    student_id = NEW.id,
    status = 'accepted',
    responded_at = NOW()
  WHERE student_email = NEW.email 
    AND status = 'pending'
    AND expires_at > NOW();
  
  -- Create relationships for accepted invitations
  INSERT INTO user_relationships (tutor_id, student_id)
  SELECT DISTINCT tutor_id, NEW.id
  FROM relationship_invitations
  WHERE student_email = NEW.email 
    AND status = 'accepted'
    AND student_id = NEW.id
  ON CONFLICT (tutor_id, student_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-accept invitations
CREATE TRIGGER auto_accept_invitations_trigger
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION auto_accept_invitations();

-- Enable RLS on new tables
ALTER TABLE user_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationship_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_relationships
CREATE POLICY "Tutors can read their relationships"
  ON user_relationships
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = tutor_id 
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'tutor')
  );

CREATE POLICY "Students can read their relationships"
  ON user_relationships
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = student_id 
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'student')
  );

CREATE POLICY "Tutors can create relationships"
  ON user_relationships
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = tutor_id 
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'tutor')
  );

CREATE POLICY "Tutors can update their relationships"
  ON user_relationships
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = tutor_id 
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'tutor')
  );

-- RLS policies for relationship_invitations
CREATE POLICY "Tutors can read their invitations"
  ON relationship_invitations
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = tutor_id 
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'tutor')
  );

CREATE POLICY "Students can read their invitations"
  ON relationship_invitations
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = student_id 
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'student')
  );

CREATE POLICY "Tutors can create invitations"
  ON relationship_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = tutor_id 
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'tutor')
  );

CREATE POLICY "Tutors can update their invitations"
  ON relationship_invitations
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = tutor_id 
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'tutor')
  );

-- Create helpful views
CREATE OR REPLACE VIEW tutor_students AS
SELECT 
  ur.id as relationship_id,
  u_tutor.id as tutor_id,
  u_tutor.first_name as tutor_first_name,
  u_tutor.last_name as tutor_last_name,
  u_student.id as student_id,
  u_student.first_name as student_first_name,
  u_student.last_name as student_last_name,
  u_student.email as student_email,
  ur.created_at as relationship_created,
  ur.notes,
  ur.is_active
FROM user_relationships ur
JOIN users u_tutor ON ur.tutor_id = u_tutor.id
JOIN users u_student ON ur.student_id = u_student.id
WHERE ur.is_active = true;

-- Grant necessary permissions
GRANT ALL ON user_relationships TO authenticated;
GRANT ALL ON relationship_invitations TO authenticated;
GRANT SELECT ON tutor_students TO authenticated;
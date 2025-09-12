/*
  # Educational Platform - Step 3: Messages System

  This migration creates the messaging system between tutors and students.
  It builds on the existing user_relationships system.

  ## New Tables
  1. `conversations` - Chat threads between users
  2. `messages` - Individual messages in conversations

  ## Features
  - Private messaging between tutor and student
  - Real-time messaging support
  - Message status tracking (read/unread)
  - Integration with existing user_relationships
*/

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  tutor_last_read_at TIMESTAMPTZ DEFAULT NOW(),
  student_last_read_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(tutor_id, student_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'system')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_edited BOOLEAN DEFAULT false
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_tutor_id ON conversations(tutor_id);
CREATE INDEX IF NOT EXISTS idx_conversations_student_id ON conversations(student_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- Trigger to update conversation timestamp when message is sent
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET 
    updated_at = NOW(),
    last_message_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversation_timestamp
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();

-- Trigger to update updated_at on message edits
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view their own conversations"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (tutor_id = auth.uid() OR student_id = auth.uid());

CREATE POLICY "Users can create conversations with their relationships"
  ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (tutor_id = auth.uid() AND EXISTS (
      SELECT 1 FROM user_relationships ur 
      WHERE ur.tutor_id = auth.uid() 
        AND ur.student_id = conversations.student_id 
        AND ur.is_active = true
    ))
    OR 
    (student_id = auth.uid() AND EXISTS (
      SELECT 1 FROM user_relationships ur 
      WHERE ur.student_id = auth.uid() 
        AND ur.tutor_id = conversations.tutor_id 
        AND ur.is_active = true
    ))
  );

CREATE POLICY "Users can update their own conversations"
  ON conversations
  FOR UPDATE
  TO authenticated
  USING (tutor_id = auth.uid() OR student_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid() OR student_id = auth.uid());

-- RLS Policies for messages
CREATE POLICY "Users can view messages from their conversations"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE tutor_id = auth.uid() OR student_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to their conversations"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE tutor_id = auth.uid() OR student_id = auth.uid()
    )
  );

CREATE POLICY "Users can edit their own messages"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- Function to create or get conversation between tutor and student
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_tutor_id UUID,
  p_student_id UUID
) RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
BEGIN
  -- Try to find existing conversation
  SELECT id INTO conversation_id
  FROM conversations
  WHERE tutor_id = p_tutor_id AND student_id = p_student_id;

  -- If not found, create new conversation
  IF conversation_id IS NULL THEN
    -- Verify relationship exists
    IF NOT EXISTS (
      SELECT 1 FROM user_relationships 
      WHERE tutor_id = p_tutor_id 
        AND student_id = p_student_id 
        AND is_active = true
    ) THEN
      RAISE EXCEPTION 'No active relationship exists between tutor and student';
    END IF;

    INSERT INTO conversations (tutor_id, student_id)
    VALUES (p_tutor_id, p_student_id)
    RETURNING id INTO conversation_id;
  END IF;

  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_conversation TO authenticated;
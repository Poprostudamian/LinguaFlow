/*
  # Educational Platform - User System Foundation

  This migration creates the foundational user system for the educational platform.

  ## New Tables
  1. `users`
    - Core user information with role-based access (student/tutor)
    - Includes profile data, authentication fields, and activity tracking
    - Supports avatar uploads and contact information
  
  2. `user_settings`
    - User preferences and configuration
    - Notification settings, theme, language, and timezone preferences
    - One-to-one relationship with users table

  ## Security
  - Enable RLS on both tables
  - Users can only access their own data
  - Policies for authenticated users to read/update their profiles
  - Policies for user settings management

  ## Performance
  - Indexes on frequently queried columns (email, role)
  - Auto-updating timestamps with triggers

  ## Data Integrity
  - CHECK constraints for role validation
  - CHECK constraints for theme and language options
  - Foreign key constraints with CASCADE delete
  - Unique constraints where appropriate
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'tutor')),
  avatar_url TEXT,
  phone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  language VARCHAR(10) DEFAULT 'pl' CHECK (language IN ('pl', 'en')),
  timezone VARCHAR(50) DEFAULT 'Europe/Warsaw',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to auto-update updated_at column
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create RLS policies for user_settings table
CREATE POLICY "Users can read own settings"
  ON user_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings"
  ON user_settings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to automatically create user settings when a user is created
CREATE OR REPLACE FUNCTION create_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-create user settings
DROP TRIGGER IF EXISTS create_user_settings_trigger ON users;
CREATE TRIGGER create_user_settings_trigger
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_settings();

-- Create helpful views for common queries
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.role,
  u.avatar_url,
  u.phone,
  u.created_at,
  u.updated_at,
  u.last_login,
  u.is_active,
  us.email_notifications,
  us.push_notifications,
  us.theme,
  us.language,
  us.timezone
FROM users u
LEFT JOIN user_settings us ON u.id = us.user_id;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT ALL ON user_settings TO authenticated;
GRANT SELECT ON user_profiles TO authenticated;
-- Clarity Supabase Schema Migration
-- Run this in Supabase SQL Editor after creating your project

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
-- Supabase Auth creates auth.users automatically
-- We create a profiles table for additional user data
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  diary_pin_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TASKS TABLE
-- ============================================================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  due_at TIMESTAMPTZ,
  remind_at TIMESTAMPTZ,
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- DIARY ENTRIES TABLE
-- ============================================================================
CREATE TABLE diary_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  body TEXT DEFAULT '',
  mood TEXT CHECK (mood IN ('HAPPY', 'NEUTRAL', 'SAD', 'ANXIOUS', 'EXCITED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(user_id, date)
);

-- ============================================================================
-- CALENDAR EVENTS TABLE
-- ============================================================================
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  event_type TEXT DEFAULT 'NOTE' CHECK (event_type IN ('TASK', 'NOTE')),
  remind_at TIMESTAMPTZ,
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- EXPENSES TABLE
-- ============================================================================
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  expense_type TEXT DEFAULT 'EXPENSE' CHECK (expense_type IN ('EXPENSE', 'INCOME')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- PROJECT TASKS TABLE
-- ============================================================================
CREATE TABLE project_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'TODO' CHECK (status IN ('TODO', 'IN_PROGRESS', 'DONE')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX idx_tasks_user_id ON tasks(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_due_at ON tasks(due_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_updated_at ON tasks(updated_at);

CREATE INDEX idx_diary_user_date ON diary_entries(user_id, date) WHERE deleted_at IS NULL;
CREATE INDEX idx_diary_updated_at ON diary_entries(updated_at);

CREATE INDEX idx_calendar_user_date ON calendar_events(user_id, event_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_calendar_updated_at ON calendar_events(updated_at);

CREATE INDEX idx_expenses_user_date ON expenses(user_id, date) WHERE deleted_at IS NULL;
CREATE INDEX idx_expenses_updated_at ON expenses(updated_at);

CREATE INDEX idx_projects_user_id ON projects(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_updated_at ON projects(updated_at);

CREATE INDEX idx_project_tasks_project_id ON project_tasks(project_id) WHERE deleted_at IS NULL;

-- ============================================================================
-- TRIGGERS TO AUTO-UPDATE updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER diary_updated_at
  BEFORE UPDATE ON diary_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER calendar_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER project_tasks_updated_at
  BEFORE UPDATE ON project_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

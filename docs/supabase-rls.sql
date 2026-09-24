-- Clarity Supabase Row Level Security (RLS) Policies
-- Run this AFTER supabase-schema.sql

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their own profile (on first sign up)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================================
-- TASKS POLICIES
-- ============================================================================
-- Users can view their own tasks (excluding soft-deleted)
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Users can insert their own tasks
CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tasks
CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete (soft-delete) their own tasks
CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- DIARY ENTRIES POLICIES
-- ============================================================================
CREATE POLICY "Users can view own diary entries"
  ON diary_entries FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert own diary entries"
  ON diary_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own diary entries"
  ON diary_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own diary entries"
  ON diary_entries FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- CALENDAR EVENTS POLICIES
-- ============================================================================
CREATE POLICY "Users can view own calendar events"
  ON calendar_events FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert own calendar events"
  ON calendar_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar events"
  ON calendar_events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar events"
  ON calendar_events FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- EXPENSES POLICIES
-- ============================================================================
CREATE POLICY "Users can view own expenses"
  ON expenses FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert own expenses"
  ON expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
  ON expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- PROJECTS POLICIES
-- ============================================================================
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- PROJECT TASKS POLICIES
-- ============================================================================
-- Users can view project tasks if they own the parent project
CREATE POLICY "Users can view own project tasks"
  ON project_tasks FOR SELECT
  USING (
    deleted_at IS NULL AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_tasks.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Users can insert project tasks if they own the parent project
CREATE POLICY "Users can insert own project tasks"
  ON project_tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_tasks.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Users can update project tasks if they own the parent project
CREATE POLICY "Users can update own project tasks"
  ON project_tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_tasks.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Users can delete project tasks if they own the parent project
CREATE POLICY "Users can delete own project tasks"
  ON project_tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_tasks.project_id
      AND projects.user_id = auth.uid()
    )
  );

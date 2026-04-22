-- ============================================================
-- HSK Trainer – Migration 008: Daily study streak tracking
-- Run this in: Supabase Dashboard → SQL Editor
-- Safe to re-run (uses IF NOT EXISTS)
-- ============================================================

CREATE TABLE IF NOT EXISTS user_streaks (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  current_streak   INTEGER     NOT NULL DEFAULT 0,
  longest_streak   INTEGER     NOT NULL DEFAULT 0,
  last_active_date DATE,                    -- YYYY-MM-DD, no time needed
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_manage_own_streaks" ON user_streaks;
CREATE POLICY "users_manage_own_streaks" ON user_streaks
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS user_streaks_user_id_idx ON user_streaks (user_id);

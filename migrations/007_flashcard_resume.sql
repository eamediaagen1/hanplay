-- ============================================================
-- HSK Trainer – Migration 007: Flashcard position / resume
-- Run this in: Supabase Dashboard → SQL Editor
-- Safe to re-run (uses IF NOT EXISTS / ON CONFLICT)
-- ============================================================

CREATE TABLE IF NOT EXISTS flashcard_positions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  level        INTEGER     NOT NULL CHECK (level BETWEEN 1 AND 6),
  category     TEXT,                        -- NULL means "All"
  last_index   INTEGER     NOT NULL DEFAULT 0,
  last_word_id TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, level)
);

ALTER TABLE flashcard_positions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_manage_own_flashcard_positions" ON flashcard_positions;
CREATE POLICY "users_manage_own_flashcard_positions" ON flashcard_positions
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS flashcard_positions_user_level_idx
  ON flashcard_positions (user_id, level);

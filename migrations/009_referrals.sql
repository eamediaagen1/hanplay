-- ============================================================
-- HSK Trainer – Migration 009: Referral system
-- Run this in: Supabase Dashboard → SQL Editor
-- Safe to re-run (uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)
-- ============================================================

-- Add referral_code column to profiles (stores the user's own shareable code)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Track who referred whom
CREATE TABLE IF NOT EXISTS referrals (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (referred_id)          -- each user can only be referred once
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_see_own_referrals" ON referrals;
CREATE POLICY "users_see_own_referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id);

CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON referrals (referrer_id);
CREATE INDEX IF NOT EXISTS profiles_referral_code_idx ON profiles (referral_code);

-- ============================================================
-- HSK Trainer – Migration 010: Referral system v2 (purchase-based)
-- Replaces the signup-only referrals table from 009 with a
-- purchase-attributed model tied to Gumroad sale_id.
-- Run this in: Supabase Dashboard → SQL Editor
-- Safe to re-run.
-- ============================================================

-- Drop old signup-only table (no real data yet at this stage)
DROP TABLE IF EXISTS referrals CASCADE;

-- New purchase-attributed referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code   TEXT        NOT NULL,                              -- code used to refer
  referrer_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  buyer_email     TEXT        NOT NULL,                              -- Gumroad buyer email
  referred_id     UUID        REFERENCES profiles(id),              -- nullable: buyer may not have signed up yet
  sale_id         TEXT        REFERENCES purchases(sale_id),        -- Gumroad sale_id (proof of purchase)
  status          TEXT        NOT NULL DEFAULT 'purchased'          -- 'purchased' | 'rewarded'
                  CHECK (status IN ('purchased', 'rewarded')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sale_id)   -- one purchase can only generate one referral record
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_see_own_referrals" ON referrals;
CREATE POLICY "users_see_own_referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id);

-- Indexes
CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON referrals (referrer_id);
CREATE INDEX IF NOT EXISTS referrals_code_idx     ON referrals (referral_code);
CREATE INDEX IF NOT EXISTS referrals_sale_idx     ON referrals (sale_id);

-- Ensure profiles still has referral_code column (safe if 009 already ran)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS profiles_referral_code_idx ON profiles (referral_code);

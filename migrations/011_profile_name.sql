-- ============================================================
-- HSK Trainer – Migration 011: Add name field to profiles
-- Run this in: Supabase Dashboard → SQL Editor
-- Safe to re-run.
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name TEXT;
f
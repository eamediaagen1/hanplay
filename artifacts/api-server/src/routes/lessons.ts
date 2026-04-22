import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { checkProgression } from "../lib/levelAccess.js";
import { getVocabByLevel } from "../lib/vocabularyService.js";

const router = Router();

/**
 * GET /api/lessons?level=N
 *
 * HSK 1  → requires auth only (free tier — all signed-in users)
 * HSK 2–6 → requires auth + is_premium = true (or role = 'admin')
 *           + all prior levels must have been passed (progression check)
 *
 * Vocabulary data source: Supabase `vocabulary` table (with automatic
 * fallback to the compiled hskData.ts if the table is empty or missing).
 * The fallback means zero downtime during the migration — the API continues
 * to serve words while the table is being seeded.
 */
router.get("/lessons", requireAuth, async (req, res) => {
  const level = parseInt(String(req.query.level ?? ""), 10);

  if (!level || level < 1 || level > 6) {
    res.status(400).json({ error: "level must be an integer between 1 and 6" });
    return;
  }

  if (level >= 2) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("is_premium, role")
      .eq("id", req.user!.id)
      .single();

    const isPremium = profile?.is_premium === true || profile?.role === "admin";
    if (!isPremium) {
      res.status(403).json({ error: "Premium subscription required for HSK levels 2–6" });
      return;
    }

    const progression = await checkProgression(req.user!.id, level);
    if (!progression.allowed) {
      res.status(403).json({ error: progression.reason });
      return;
    }
  }

  const words = await getVocabByLevel(level);
  res.json({ level, words });
});

export default router;

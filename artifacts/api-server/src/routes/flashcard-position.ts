import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// GET /api/flashcard-position?level=X — retrieve saved position
router.get("/api/flashcard-position", requireAuth, async (req, res) => {
  const level = parseInt(req.query.level as string);
  if (!level || level < 1 || level > 6) {
    res.status(400).json({ error: "level must be 1–6" });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("flashcard_positions")
    .select("category, last_index, last_word_id")
    .eq("user_id", req.user!.id)
    .eq("level", level)
    .maybeSingle();

  if (error) {
    res.json(null);
    return;
  }

  res.json(data ?? null);
});

// POST /api/flashcard-position — save current position
router.post("/api/flashcard-position", requireAuth, async (req, res) => {
  const { level, category, last_index, last_word_id } = req.body as {
    level?: number;
    category?: string;
    last_index?: number;
    last_word_id?: string;
  };

  if (!level || level < 1 || level > 6) {
    res.status(400).json({ error: "level must be 1–6" });
    return;
  }

  const { error } = await supabaseAdmin.from("flashcard_positions").upsert(
    {
      user_id: req.user!.id,
      level,
      category: category ?? null,
      last_index: last_index ?? 0,
      last_word_id: last_word_id ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,level" }
  );

  if (error) {
    res.status(500).json({ error: "Failed to save position" });
    return;
  }

  res.json({ success: true });
});

export default router;

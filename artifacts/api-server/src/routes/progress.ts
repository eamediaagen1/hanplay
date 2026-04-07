import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { requireAuth, requirePremium } from "../middleware/auth.js";
import { hskData } from "../data/hskData.js";
import { checkProgression } from "../lib/levelAccess.js";

const router = Router();

interface SavedWordRow {
  word_id: string;
  next_review: string;
  interval_days: number;
}

// GET /api/progress — get all saved words for the current user, enriched with word details
router.get("/progress", requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("saved_words")
    .select("word_id, next_review, interval_days")
    .eq("user_id", req.user!.id)
    .order("next_review", { ascending: true });

  if (error) {
    res.status(500).json({ error: "Failed to fetch progress" });
    return;
  }

  // Enrich each row with the word details from the local data source
  const enriched = (data as SavedWordRow[]).map((row) => {
    const word = hskData.find((w) => w.id === row.word_id);
    return { ...row, ...(word ?? {}) };
  });

  res.json(enriched);
});

// POST /api/progress — save or unsave a word (requires premium)
router.post("/progress", requireAuth, requirePremium, async (req, res) => {
  const { word_id, action } = req.body as {
    word_id?: string;
    action?: "save" | "unsave";
  };

  if (!word_id || !action) {
    res.status(400).json({ error: "word_id and action are required" });
    return;
  }

  if (action === "save") {
    const { error } = await supabaseAdmin.from("saved_words").upsert(
      {
        user_id: req.user!.id,
        word_id,
        next_review: new Date().toISOString(),
        interval_days: 0,
      },
      { onConflict: "user_id,word_id" }
    );
    if (error) {
      res.status(500).json({ error: "Failed to save word" });
      return;
    }
    res.json({ success: true, action: "saved" });
  } else if (action === "unsave") {
    const { error } = await supabaseAdmin
      .from("saved_words")
      .delete()
      .eq("user_id", req.user!.id)
      .eq("word_id", word_id);
    if (error) {
      res.status(500).json({ error: "Failed to unsave word" });
      return;
    }
    res.json({ success: true, action: "unsaved" });
  } else {
    res.status(400).json({ error: "action must be 'save' or 'unsave'" });
  }
});

// PATCH /api/progress/:wordId — update spaced-repetition schedule (requires premium)
router.patch("/progress/:wordId", requireAuth, requirePremium, async (req, res) => {
  const { wordId } = req.params;
  const { difficulty } = req.body as {
    difficulty?: "hard" | "good" | "easy";
  };

  if (!difficulty || !["hard", "good", "easy"].includes(difficulty)) {
    res.status(400).json({ error: "difficulty must be 'hard', 'good', or 'easy'" });
    return;
  }

  const { data: current } = await supabaseAdmin
    .from("saved_words")
    .select("interval_days")
    .eq("user_id", req.user!.id)
    .eq("word_id", wordId)
    .maybeSingle();

  const currentInterval = current?.interval_days ?? 0;

  let newInterval: number;
  if (difficulty === "hard") newInterval = 1;
  else if (difficulty === "good") newInterval = Math.max(3, currentInterval * 2);
  else newInterval = Math.max(7, currentInterval * 3);

  const nextReview = new Date(
    Date.now() + newInterval * 24 * 60 * 60 * 1000
  ).toISOString();

  const { error } = await supabaseAdmin
    .from("saved_words")
    .update({ interval_days: newInterval, next_review: nextReview })
    .eq("user_id", req.user!.id)
    .eq("word_id", wordId);

  if (error) {
    res.status(500).json({ error: "Failed to update review schedule" });
    return;
  }

  res.json({ success: true, next_review: nextReview, interval_days: newInterval });
});

// GET /api/progress/levels — get level progression (exam results) for current user
router.get("/progress/levels", requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("level_progress")
    .select("level, exam_passed, exam_score, completed_at")
    .eq("user_id", req.user!.id)
    .order("level", { ascending: true });

  if (error) {
    // Table may not exist yet (migration pending) — return empty array so UI degrades gracefully
    res.json([]);
    return;
  }

  res.json(data ?? []);
});

// POST /api/progress/exam — record a quiz/exam result and unlock next level
// Body: { level: 1-6, correct: number, total: number }
//
// Sticky-pass rule:
//   - exam_passed and completed_at are NEVER downgraded once set to true/non-null.
//   - exam_score records the best (highest) score ever achieved.
//   - Retrying and failing does NOT re-lock the next level.
router.post("/progress/exam", requireAuth, requirePremium, async (req, res) => {
  const { level, correct, total } = req.body as {
    level?: number;
    correct?: number;
    total?: number;
  };

  if (!level || level < 1 || level > 6) {
    res.status(400).json({ error: "level must be 1–6" });
    return;
  }
  if (typeof correct !== "number" || typeof total !== "number" || total <= 0) {
    res.status(400).json({ error: "correct and total are required numbers" });
    return;
  }

  // Progression gate: user must have passed all prior levels to sit this exam
  const progression = await checkProgression(req.user!.id, level);
  if (!progression.allowed) {
    res.status(403).json({ error: progression.reason });
    return;
  }

  const scorePct = Math.round((correct / total) * 100);
  const passed = scorePct >= 70;
  const now = new Date().toISOString();

  // Fetch the existing record so we can apply sticky-pass logic
  const { data: existing } = await supabaseAdmin
    .from("level_progress")
    .select("exam_passed, exam_score, completed_at")
    .eq("user_id", req.user!.id)
    .eq("level", level)
    .maybeSingle();

  // Sticky: once passed, always passed — retrying and failing must not roll back
  const wasAlreadyPassed = existing?.exam_passed === true;
  const stickyPassed     = wasAlreadyPassed || passed;
  const stickyCompleted  = wasAlreadyPassed
    ? existing!.completed_at               // keep the original completion timestamp
    : (passed ? now : null);
  // Always record the best score ever achieved
  const bestScore = Math.max(scorePct, existing?.exam_score ?? 0);

  const { error } = await supabaseAdmin
    .from("level_progress")
    .upsert(
      {
        user_id:      req.user!.id,
        level,
        exam_passed:  stickyPassed,
        exam_score:   bestScore,
        completed_at: stickyCompleted,
        updated_at:   now,
      },
      { onConflict: "user_id,level", ignoreDuplicates: false }
    );

  if (error) {
    const msg = error.message?.includes("does not exist")
      ? "Level progress table not found. Please run migration 006 in Supabase."
      : "Failed to save exam result";
    res.status(500).json({ error: msg });
    return;
  }

  const nextLevelUnlocked = stickyPassed && level < 6;

  res.json({
    success: true,
    passed,
    score_pct: scorePct,
    best_score: bestScore,
    next_level_unlocked: nextLevelUnlocked,
  });
});

// POST /api/progress/migrate — migrate localStorage saved cards on first sign-in
router.post("/progress/migrate", requireAuth, async (req, res) => {
  const { saved_cards } = req.body as {
    saved_cards?: Record<string, { id: string; nextReview: number; interval: number }>;
  };

  if (!saved_cards || typeof saved_cards !== "object") {
    res.status(400).json({ error: "saved_cards is required" });
    return;
  }

  const rows = Object.values(saved_cards).map((card) => ({
    user_id: req.user!.id,
    word_id: card.id,
    next_review: new Date(card.nextReview ?? Date.now()).toISOString(),
    interval_days: card.interval ?? 0,
  }));

  if (rows.length === 0) {
    res.json({ success: true, migrated: 0 });
    return;
  }

  const { error } = await supabaseAdmin
    .from("saved_words")
    .upsert(rows, { onConflict: "user_id,word_id", ignoreDuplicates: true });

  if (error) {
    res.status(500).json({ error: "Migration failed" });
    return;
  }

  res.json({ success: true, migrated: rows.length });
});

export default router;

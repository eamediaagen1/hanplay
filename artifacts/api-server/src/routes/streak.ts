import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// GET /api/streak — current user's streak data
router.get("/api/streak", requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("user_streaks")
    .select("current_streak, longest_streak, last_active_date")
    .eq("user_id", req.user!.id)
    .maybeSingle();

  if (error) {
    res.json({ current_streak: 0, longest_streak: 0, last_active_date: null });
    return;
  }

  res.json(data ?? { current_streak: 0, longest_streak: 0, last_active_date: null });
});

// POST /api/streak/ping — record a study activity (idempotent per day)
router.post("/api/streak/ping", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const { data: existing } = await supabaseAdmin
    .from("user_streaks")
    .select("current_streak, longest_streak, last_active_date")
    .eq("user_id", userId)
    .maybeSingle();

  if (!existing) {
    await supabaseAdmin.from("user_streaks").insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_active_date: today,
    });
    res.json({ current_streak: 1, longest_streak: 1 });
    return;
  }

  const last = existing.last_active_date;
  if (last === today) {
    res.json({ current_streak: existing.current_streak, longest_streak: existing.longest_streak });
    return;
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const newStreak = last === yesterday ? existing.current_streak + 1 : 1;
  const newLongest = Math.max(newStreak, existing.longest_streak ?? 0);

  await supabaseAdmin.from("user_streaks").upsert(
    {
      user_id: userId,
      current_streak: newStreak,
      longest_streak: newLongest,
      last_active_date: today,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  res.json({ current_streak: newStreak, longest_streak: newLongest });
});

export default router;

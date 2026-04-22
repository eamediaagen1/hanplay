import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// GET /api/onboarding — check if the current user has completed onboarding
router.get("/onboarding", requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("user_onboarding")
    .select("id")
    .eq("user_id", req.user!.id)
    .maybeSingle();

  // If the table doesn't exist yet or any DB error, treat as completed
  // so existing users are never blocked from the app
  if (error) {
    res.json({ completed: true });
    return;
  }

  res.json({ completed: !!data });
});

// POST /api/onboarding — submit onboarding data
router.post("/onboarding", requireAuth, async (req, res) => {
  const { acquisition_source, age, country } = req.body as {
    acquisition_source?: string;
    age?: string | number;
    country?: string;
  };

  const parsedAge = age !== undefined && age !== "" ? Number(age) : null;

  // Best-effort save — if table doesn't exist, silently succeed
  await supabaseAdmin
    .from("user_onboarding")
    .upsert(
      {
        user_id: req.user!.id,
        acquisition_source: acquisition_source?.trim() || null,
        age: parsedAge && !isNaN(parsedAge) ? parsedAge : null,
        country: country?.trim() || null,
      },
      { onConflict: "user_id" }
    );

  res.json({ success: true });
});

export default router;

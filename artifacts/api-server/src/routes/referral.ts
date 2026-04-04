import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function generateCode(userId: string): string {
  // Deterministic 8-char alphanumeric code derived from userId
  return userId.replace(/-/g, "").slice(0, 8).toUpperCase();
}

// GET /api/referral — get referral code + purchase-attributed count for current user
router.get("/api/referral", requireAuth, async (req, res) => {
  const userId = req.user!.id;

  // Fetch or generate referral code
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("referral_code")
    .eq("id", userId)
    .maybeSingle();

  let code = profile?.referral_code as string | null;
  if (!code) {
    code = generateCode(userId);
    await supabaseAdmin
      .from("profiles")
      .update({ referral_code: code })
      .eq("id", userId);
  }

  // Count only purchase-attributed referrals (not pending visits/signups)
  const { count } = await supabaseAdmin
    .from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", userId)
    .in("status", ["purchased", "rewarded"]);

  res.json({ referral_code: code, referral_count: count ?? 0 });
});

export default router;

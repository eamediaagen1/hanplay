import { supabaseAdmin } from "./supabase.js";

/**
 * Verifies that a user has passed all prerequisite levels before accessing `level`.
 *
 * Rules:
 *   - Level 1 is always accessible to any authenticated user.
 *   - Level N (N ≥ 2) requires exam_passed = true (or completed_at non-null)
 *     for every level from 1 through N-1.
 *
 * This is enforced server-side so URL manipulation cannot bypass it.
 */
export async function checkProgression(
  userId: string,
  level: number
): Promise<{ allowed: boolean; reason: string }> {
  if (level === 1) return { allowed: true, reason: "" };

  const priorLevels = Array.from({ length: level - 1 }, (_, i) => i + 1);

  const { data } = await supabaseAdmin
    .from("level_progress")
    .select("level, exam_passed, completed_at")
    .eq("user_id", userId)
    .in("level", priorLevels);

  for (const l of priorLevels) {
    const entry = data?.find((e) => e.level === l);
    const passed =
      entry?.exam_passed === true || entry?.completed_at !== null;
    if (!passed) {
      return {
        allowed: false,
        reason: `HSK ${l} must be passed before accessing HSK ${level}`,
      };
    }
  }

  return { allowed: true, reason: "" };
}

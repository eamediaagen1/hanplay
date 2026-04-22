import { useProfile } from "./use-profile";
import { useLevelProgress, isLevelUnlocked } from "./use-level-progress";

export type AccessDenyReason = "premium" | "locked" | "invalid";

export interface LevelAccess {
  /** True only when premium + progression checks both pass. */
  allowed: boolean;
  /** Still fetching profile / progress data — do not render gated content yet. */
  isLoading: boolean;
  /**
   * "premium"  — user needs an active premium subscription.
   * "locked"   — level is not yet unlocked by progression (must pass prior level).
   * "invalid"  — level number is out of range (1-6).
   * undefined  — allowed (no denial reason).
   */
  reason: AccessDenyReason | undefined;
}

/**
 * Checks whether the current user may access a given HSK level.
 *
 * Enforces TWO independent gates, matching the server-side rules in
 * /api/lessons and /api/progress/exam:
 *
 *   1. Premium gate  — levels 2-6 require is_premium = true (or admin role).
 *   2. Progression gate — level N requires level N-1 to have been passed.
 *
 * This is a client-side pre-flight check. The server always validates
 * independently, so this only serves as a UX safeguard and redirect trigger.
 * It never leaks protected data on its own.
 *
 * Usage:
 *   const access = useLevelAccess(level);
 *   if (access.isLoading) return <Spinner />;
 *   if (!access.allowed) return <LevelLockedScreen reason={access.reason} />;
 */
export function useLevelAccess(level: number): LevelAccess {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { progressMap, query: progressQuery } = useLevelProgress();

  const isLoading = profileLoading || progressQuery.isLoading;

  if (isLoading) {
    return { allowed: false, isLoading: true, reason: undefined };
  }

  if (level < 1 || level > 6) {
    return { allowed: false, isLoading: false, reason: "invalid" };
  }

  const isPremium =
    profile?.is_premium === true || profile?.role === "admin";

  if (level >= 2 && !isPremium) {
    return { allowed: false, isLoading: false, reason: "premium" };
  }

  if (!isLevelUnlocked(level, progressMap)) {
    return { allowed: false, isLoading: false, reason: "locked" };
  }

  return { allowed: true, isLoading: false, reason: undefined };
}

import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Book, Star, Lock, ExternalLink, RefreshCw,
  CheckCircle2, MessageSquare, ChevronRight,
  Sparkles, Loader2, RotateCcw, ArrowRight,
  Flame, BookOpen, Brain, PenLine, Play,
  Copy, Check, Users,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useProfile } from "@/hooks/use-profile";
import { useSavedWords } from "@/hooks/use-saved-words";
import { useStudyPrefs } from "@/hooks/use-study-prefs";
import { useLevelProgress, isLevelUnlocked, type LevelProgressMap, type LevelProgressEntry } from "@/hooks/use-level-progress";
import { useStreak } from "@/hooks/use-streak";
import { useLatestFlashcardPosition } from "@/hooks/use-flashcard-position";
import { useReferral } from "@/hooks/use-referral";
import { apiFetch } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { PageShell } from "@/components/PageShell";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { buildGumroadUrl } from "@/lib/gumroad";
import { getStoredReferralCode } from "@/hooks/use-referral-capture";
import { consumePendingName } from "@/lib/pending-name";

// ─── Data ────────────────────────────────────────────────────────────────────

const LEVELS = [
  { id: 1, count: 150,  title: "Beginner" },
  { id: 2, count: 150,  title: "Elementary" },
  { id: 3, count: 300,  title: "Intermediate" },
  { id: 4, count: 600,  title: "Upper-Intermediate" },
  { id: 5, count: 1300, title: "Advanced" },
  { id: 6, count: 2500, title: "Mastery" },
];

// ─── Card state ───────────────────────────────────────────────────────────────

type CardState = "locked" | "passed" | "fresh" | "in_progress";

function getCardState(
  levelId: number,
  isPremium: boolean,
  progressMap: LevelProgressMap
): CardState {
  // FREE users: all levels locked — premium access required.
  // This must override any saved progression state so stale DB data
  // (e.g. from a prior premium period) never leaks into the free-user UI.
  if (!isPremium) return "locked";

  // PREMIUM users: normal progression logic below.
  const everPassed = (e: LevelProgressEntry) =>
    e.exam_passed === true || e.completed_at !== null;

  if (levelId === 1) {
    const entry = progressMap[1];
    if (!entry) return "fresh";
    if (everPassed(entry)) return "passed";
    return "in_progress";
  }
  // Levels 2–6: require exam-based unlock on top of premium
  if (!isLevelUnlocked(levelId, progressMap)) return "locked";
  const entry = progressMap[levelId];
  if (!entry) return "fresh";
  if (everPassed(entry)) return "passed";
  return "in_progress";
}

// ─── Animations ───────────────────────────────────────────────────────────────

const container = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const cardAnim = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 26 } },
};

const fade = {
  hidden: { opacity: 0, y: 14 },
  show:   (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.3, delay: i * 0.06, ease: "easeOut" as const },
  }),
};

// ─── Level Card ───────────────────────────────────────────────────────────────

function LevelCard({
  level,
  state,
  examScore,
  isPremium,
  onGo,
  onNextLevel,
  onPhrases,
  onExam,
}: {
  level: { id: number; count: number; title: string };
  state: CardState;
  examScore: number | null;
  isPremium: boolean;
  onGo: () => void;
  onNextLevel: () => void;
  onPhrases: () => void;
  onExam: () => void;
}) {
  const isLocked     = state === "locked";
  const isPassed     = state === "passed";
  const isFresh      = state === "fresh";
  const isInProgress = state === "in_progress";
  const isLastLevel  = level.id === 6;

  const cardClass = cn(
    "relative rounded-2xl border bg-card p-6 flex flex-col transition-all duration-200",
    isLocked      && "opacity-55 border-border/40 cursor-default",
    isPassed      && "border-green-200/70 dark:border-green-800/50 bg-green-50/20 dark:bg-green-950/10 cursor-pointer hover:border-green-300/70 hover:shadow-md hover:shadow-green-500/5",
    isFresh       && "border-primary/40 ring-1 ring-primary/15 cursor-pointer hover:border-primary/50 hover:shadow-lg hover:shadow-primary/8",
    isInProgress  && "border-border/70 cursor-pointer hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
  );

  const StatusBadge = () => {
    if (isLocked)     return <Lock className="w-4 h-4 text-muted-foreground/40" />;
    if (isPassed)     return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
        <CheckCircle2 className="w-3 h-3" />
        Passed
      </span>
    );
    if (isFresh)      return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
        <Sparkles className="w-3 h-3" />
        Unlocked
      </span>
    );
    if (isInProgress) return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
        In Progress
      </span>
    );
    return null;
  };

  const SubNote = () => {
    if (!isLocked) {
      if (isPassed && examScore !== null) {
        return <p className="text-xs text-green-600 dark:text-green-400 mt-1.5 font-medium">Best score: {examScore}%</p>;
      }
      if (isFresh) {
        return <p className="text-xs text-primary/70 mt-1.5 font-medium">Ready to start</p>;
      }
      if (isInProgress) {
        return <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 font-medium">Score 70%+ on the exam to progress</p>;
      }
    }
    return null;
  };

  const LockNote = () => {
    if (!isLocked) return null;
    // Free user: all levels are premium-gated — never imply progression can unlock them
    if (!isPremium) {
      return (
        <p className="text-xs text-muted-foreground/60 mt-1.5 flex items-center gap-1">
          <Lock className="w-3 h-3" /> Premium required
        </p>
      );
    }
    // Premium user, progression lock (level 2+ not yet reached via exam)
    return (
      <p className="text-xs text-muted-foreground/60 mt-1.5 flex items-center gap-1">
        <Lock className="w-3 h-3" /> Complete HSK {level.id - 1} exam to unlock
      </p>
    );
  };

  return (
    <motion.div variants={cardAnim}>
      <div className={cardClass} onClick={() => !isLocked && onGo()}>
        <div className="absolute top-4 right-4">
          <StatusBadge />
        </div>

        <div className="mb-5 pr-20">
          <div className="flex items-center gap-1.5 mb-1">
            <Book className={cn("w-3.5 h-3.5 shrink-0", isLocked ? "text-muted-foreground/40" : "text-primary")} />
            <span className={cn("text-[11px] font-bold uppercase tracking-wider", isLocked ? "text-muted-foreground/40" : "text-primary")}>
              HSK {level.id}
            </span>
          </div>
          <h3 className="text-lg font-serif text-foreground leading-snug">{level.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{level.count.toLocaleString()} words</p>
          <SubNote />
          <LockNote />
        </div>

        <div className="mt-auto flex flex-col gap-2">
          {isLocked && (
            <button
              disabled
              className="w-full py-2.5 rounded-xl text-sm font-semibold bg-muted/60 text-muted-foreground/40 cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              Locked
            </button>
          )}

          {isPassed && (
            <>
              {isLastLevel && (
                <div className="w-full py-3 px-3 rounded-xl bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 border border-yellow-200/70 dark:border-yellow-800/50 flex flex-col items-center gap-1.5 text-center">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />
                    <span className="text-sm font-bold text-yellow-700 dark:text-yellow-400">HSK Master</span>
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />
                  </div>
                  <p className="text-xs text-yellow-600 dark:text-yellow-500 leading-tight">You have completed all six HSK levels. Congratulations!</p>
                </div>
              )}
              {!isLastLevel && (
                <button
                  onClick={(e) => { e.stopPropagation(); onNextLevel(); }}
                  className="w-full py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-primary/20"
                >
                  Go to HSK {level.id + 1}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onGo(); }}
                className="w-full py-2 rounded-xl text-sm font-medium border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
              >
                Review HSK {level.id}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onPhrases(); }}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <MessageSquare className="w-3 h-3" />
                  Phrases
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onExam(); }}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Re-take Exam
                </button>
              </div>
            </>
          )}

          {isFresh && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onGo(); }}
                className="w-full py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-primary/20"
              >
                Start HSK {level.id}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onPhrases(); }}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <MessageSquare className="w-3 h-3" />
                  Phrases
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onExam(); }}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <ChevronRight className="w-3 h-3" />
                  Take Exam
                </button>
              </div>
            </>
          )}

          {isInProgress && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onGo(); }}
                className="w-full py-2.5 rounded-xl text-sm font-bold bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center gap-1.5"
              >
                Continue HSK {level.id}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onPhrases(); }}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <MessageSquare className="w-3 h-3" />
                  Phrases
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onExam(); }}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                >
                  <ChevronRight className="w-3 h-3" />
                  Take Exam
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useProfile();
  const { savedWords, getDueCards, getDueWords, isLoading: wordsLoading } = useSavedWords();
  const { prefs } = useStudyPrefs();
  const { query: lpQuery, progressMap } = useLevelProgress();
  const { streak } = useStreak();
  const { latestPosition } = useLatestFlashcardPosition();
  const { referralCode, referralCount } = useReferral();
  const qc = useQueryClient();

  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isPremium  = profile?.is_premium ?? false;
  const dueWords   = getDueWords();
  const dueCount   = getDueCards().length;
  const savedCount = savedWords.length;
  const lastLevel  = prefs.lastLevel ?? 1;
  const email      = user?.email ?? "";
  const firstName  = profile?.name || email.split("@")[0] || "learner";

  // Save pending name (stored during email-confirmation signup) once profile loads
  useEffect(() => {
    if (!profile || profile.name) return;
    const pending = consumePendingName();
    if (!pending) return;
    apiFetch("/api/me", { method: "PATCH", body: JSON.stringify({ name: pending }) })
      .then(() => qc.invalidateQueries({ queryKey: ["profile"] }))
      .catch(() => {/* non-fatal */});
  }, [profile?.id]);

  // Use DB-backed last position if available; fall back to localStorage pref.
  // For FREE users: always cap to level 1 — stale DB positions from a prior premium
  // period must never drive the active level or continue CTA for a free user.
  const dbLastLevel = latestPosition?.level ?? null;
  const activeLevelId = isPremium ? (dbLastLevel ?? lastLevel) : 1;
  const activeLevel = LEVELS.find((l) => l.id === activeLevelId) ?? LEVELS[0];
  const savedInLevel = savedWords.filter((w) => w.word_id.startsWith(`hsk${activeLevel.id}-`)).length;

  // Position hint for the Continue CTA (only meaningful for premium users)
  const positionHint = isPremium && latestPosition
    ? latestPosition.category
      ? `${latestPosition.category} · card ${latestPosition.last_index + 1}`
      : `Card ${latestPosition.last_index + 1}`
    : null;

  const referralLink = referralCode
    ? `${window.location.origin}/?ref=${referralCode}`
    : null;

  const handleCopyReferral = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await apiFetch<{ is_premium: boolean; message: string }>("/api/premium/sync", {
        method: "POST",
      });
      setSyncMsg(res.message);
      if (res.is_premium) {
        await refetchProfile();
        qc.invalidateQueries({ queryKey: ["profile"] });
      }
    } catch {
      setSyncMsg("Sync failed. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  // Primary CTA — completely separate logic for free vs premium users.
  // Free users must NEVER see a real level CTA derived from progression state.
  const continueCta = !isPremium
    // ── FREE USER ────────────────────────────────────────────────────────────
    ? dueCount > 0
      // They may have saved words from before — let them review, that's fine
      ? { label: "Review Due Cards", sub: `${dueCount} card${dueCount !== 1 ? "s" : ""} waiting`, hint: null, isUpgrade: false, action: () => setLocation("/review") }
      // No activity → steer toward upgrade; never reference a premium level
      : { label: "Unlock Full Access", sub: "All 6 HSK levels + premium features", hint: null, isUpgrade: true, action: () => window.open(buildGumroadUrl(getStoredReferralCode()), "_blank") }
    // ── PREMIUM USER ─────────────────────────────────────────────────────────
    : dueCount > 0
      ? { label: "Review Due Cards", sub: `${dueCount} card${dueCount !== 1 ? "s" : ""} waiting`, hint: null, isUpgrade: false, action: () => setLocation("/review") }
      : savedCount > 0 || latestPosition
      ? { label: `Continue HSK ${activeLevel.id}`, sub: activeLevel.title, hint: positionHint, isUpgrade: false, action: () => setLocation(`/flashcards/${activeLevel.id}`) }
      : { label: `Start HSK ${activeLevel.id}`, sub: activeLevel.title, hint: null, isUpgrade: false, action: () => setLocation(`/flashcards/${activeLevel.id}`) };

  return (
    <PageShell maxWidth="xl">

      {/* ── Greeting + plan badge ─────────────────────────────────── */}
      <motion.div
        custom={0} variants={fade} initial="hidden" animate="show"
        className="flex items-center justify-between gap-3 mb-6"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <span className="text-base font-bold text-primary">
              {firstName[0]?.toUpperCase() ?? "?"}
            </span>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-serif font-bold text-foreground leading-tight truncate">
              Hi, {firstName}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {dueCount > 0
                ? `${dueCount} card${dueCount !== 1 ? "s" : ""} due for review`
                : savedCount > 0
                ? "You're all caught up — keep going!"
                : "Ready to start learning?"}
            </p>
          </div>
        </div>

        {!profileLoading && (
          <span className={cn(
            "shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border",
            isPremium
              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
              : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
          )}>
            {isPremium ? "Premium" : "Free"}
          </span>
        )}
      </motion.div>

      {/* ── Continue Learning hero ────────────────────────────────── */}
      <motion.div custom={1} variants={fade} initial="hidden" animate="show" className="mb-5">
        <button
          onClick={continueCta.action}
          className={cn(
            "w-full group flex items-center gap-4 p-5 rounded-2xl shadow-md transition-all duration-200 hover:shadow-lg text-left",
            continueCta.isUpgrade
              ? "bg-amber-500 text-white shadow-amber-500/20 hover:bg-amber-600 hover:shadow-amber-500/25"
              : "bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/25"
          )}
        >
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            {continueCta.isUpgrade
              ? <Sparkles className="w-6 h-6" />
              : dueCount > 0
              ? <RotateCcw className="w-6 h-6" />
              : <Play className="w-6 h-6 fill-current" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold leading-tight">{continueCta.label}</p>
            <p className="text-sm text-white/70 mt-0.5">{continueCta.sub}</p>
            {continueCta.hint && (
              <p className="text-xs text-white/60 mt-1 font-medium">
                ↩ {continueCta.hint}
              </p>
            )}
            {!continueCta.isUpgrade && !continueCta.hint && savedInLevel > 0 && dueCount === 0 && (
              <p className="text-xs text-white/60 mt-1">
                {savedInLevel} word{savedInLevel !== 1 ? "s" : ""} saved in this level
              </p>
            )}
          </div>
          <ChevronRight className="w-5 h-5 text-white/60 shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </motion.div>

      {/* ── Streak ───────────────────────────────────────────────── */}
      {streak.current_streak > 0 && (
        <motion.div custom={2} variants={fade} initial="hidden" animate="show" className="mb-5">
          <div className="flex items-center gap-4 px-5 py-3.5 rounded-2xl bg-card border border-border/60 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground leading-tight">
                {streak.current_streak} day{streak.current_streak !== 1 ? "s" : ""} streak
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {streak.current_streak >= 7
                  ? "You're on a roll — keep going!"
                  : streak.current_streak >= 3
                  ? "Building momentum — great work!"
                  : "Keep your streak going. Study again tomorrow."}
              </p>
            </div>
            {streak.longest_streak > streak.current_streak && (
              <div className="shrink-0 text-right">
                <p className="text-[10px] text-muted-foreground leading-none">Best</p>
                <p className="text-sm font-bold text-muted-foreground tabular-nums">{streak.longest_streak}d</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Quick stats (words saved + due) ──────────────────────── */}
      {!wordsLoading && savedCount > 0 && (
        <motion.div
          custom={3} variants={fade} initial="hidden" animate="show"
          className="grid grid-cols-3 gap-3 mb-5"
        >
          <div className="bg-card rounded-2xl border border-border/60 p-4 flex items-center gap-3 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground tabular-nums leading-none">{savedCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Words saved</p>
            </div>
          </div>
          <div className="bg-card rounded-2xl border border-border/60 p-4 flex items-center gap-3 shadow-sm">
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
              dueCount > 0
                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
            )}>
              {dueCount > 0 ? <Star className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            </div>
            <div>
              <p className="text-xl font-bold text-foreground tabular-nums leading-none">
                {dueCount > 0 ? dueCount : "✓"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {dueCount > 0 ? "Due for review" : "All reviewed"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setLocation(`/quiz/${activeLevel.id}`)}
            className="bg-card rounded-2xl border border-border/60 p-4 flex items-center gap-3 shadow-sm hover:border-primary/30 hover:shadow-md transition-all text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground leading-none">Quiz</p>
              <p className="text-xs text-muted-foreground mt-0.5">HSK {activeLevel.id}</p>
            </div>
          </button>
        </motion.div>
      )}

      {/* ── Due for Review list ───────────────────────────────────── */}
      {dueCount > 0 && (
        <motion.section custom={4} variants={fade} initial="hidden" animate="show" className="mb-6">
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-0.5">
              Due for Review
            </h2>
            <button
              onClick={() => setLocation("/review")}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              Review all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm">
            {dueWords.slice(0, 4).map((word, idx, arr) => (
              <div
                key={word.word_id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3",
                  idx < arr.length - 1 && "border-b border-border/40"
                )}
              >
                <span className="text-2xl font-serif text-foreground shrink-0">{word.word}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{word.meaning}</p>
                  <p className="text-xs text-muted-foreground truncate">{word.pinyin}</p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 shrink-0">
                  Due
                </span>
              </div>
            ))}
            {dueCount > 4 && (
              <button
                onClick={() => setLocation("/review")}
                className="w-full text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 py-2.5 text-center transition-colors"
              >
                + {dueCount - 4} more — review all →
              </button>
            )}
          </div>
        </motion.section>
      )}

      {/* ══ YOUR LEVELS ═══════════════════════════════════════════════════════ */}

      {/* Levels page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-1 leading-tight">
            Your Levels
          </h2>
          <p className="text-muted-foreground text-sm max-w-md">
            {isPremium
              ? "Pass each level's exam to unlock the next. Progress is saved automatically."
              : "Upgrade to Premium to unlock all 6 HSK levels and full study features."}
          </p>
        </div>

        {dueCount > 0 && (
          <button
            onClick={() => setLocation("/review")}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold/10 border border-gold/30 text-foreground hover:bg-gold/20 font-semibold transition-colors relative self-start sm:self-auto"
          >
            <Star className="w-4 h-4 text-gold fill-gold" />
            Review Mode
            <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-sm ring-2 ring-background">
              {dueCount}
            </span>
          </button>
        )}
      </div>

      {/* Non-premium upgrade banner */}
      {!isPremium && (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl bg-gold/5 border border-gold/20">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Unlock all HSK levels — 1 through 6</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Already purchased? Click Sync to activate your access instantly.
            </p>
            {syncMsg && <p className="text-xs mt-1 text-foreground/70">{syncMsg}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-60"
            >
              <RefreshCw className={cn("w-3 h-3", syncing && "animate-spin")} />
              {syncing ? "Syncing…" : "Sync"}
            </button>
            <a
              href={buildGumroadUrl(getStoredReferralCode())}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Upgrade
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Premium status bar */}
      {isPremium && (
        <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/8 border border-green-500/20 text-green-700 dark:text-green-400 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Premium active — pass each exam to unlock the next level
        </div>
      )}

      {/* Level grid */}
      {lpQuery.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8"
        >
          {LEVELS.map((level) => {
            const state     = getCardState(level.id, isPremium, progressMap);
            const examScore = progressMap[level.id]?.exam_score ?? null;

            return (
              <LevelCard
                key={level.id}
                level={level}
                state={state}
                examScore={examScore}
                isPremium={isPremium}
                onGo={() => setLocation(`/flashcards/${level.id}`)}
                onNextLevel={() => setLocation(`/flashcards/${level.id + 1}`)}
                onPhrases={() => setLocation(`/phrases/${level.id}`)}
                onExam={() => setLocation(`/quiz/${level.id}`)}
              />
            );
          })}
        </motion.div>
      )}

      {/* ── Quick practice strip ──────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <button
          onClick={() => setLocation("/strokes")}
          className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 text-left shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-200"
        >
          <PenLine className="w-5 h-5 text-primary shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground leading-tight">Strokes</p>
            <p className="text-xs text-muted-foreground mt-0.5">Writing practice</p>
          </div>
        </button>
        <button
          onClick={() => setLocation(`/phrases/${activeLevel.id}`)}
          className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 text-left shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-200"
        >
          <MessageSquare className="w-5 h-5 text-primary shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground leading-tight">Phrases</p>
            <p className="text-xs text-muted-foreground mt-0.5">HSK {activeLevel.id}</p>
          </div>
        </button>
        <button
          onClick={() => setLocation(`/quiz/${activeLevel.id}`)}
          className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 text-left shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-200"
        >
          <Brain className="w-5 h-5 text-primary shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground leading-tight">Quiz</p>
            <p className="text-xs text-muted-foreground mt-0.5">HSK {activeLevel.id}</p>
          </div>
        </button>
        <button
          onClick={() => setLocation("/review")}
          disabled={dueCount === 0}
          className={cn(
            "relative flex items-center gap-3 rounded-2xl border p-4 text-left shadow-sm transition-all duration-200",
            dueCount > 0
              ? "border-border/60 bg-card hover:border-primary/30 hover:shadow-md"
              : "border-border/40 bg-muted/30 opacity-50 cursor-not-allowed",
          )}
        >
          {dueCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-background">
              {dueCount > 9 ? "9+" : dueCount}
            </span>
          )}
          <RotateCcw className="w-5 h-5 text-primary shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground leading-tight">Review</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {dueCount > 0 ? `${dueCount} due` : "All done"}
            </p>
          </div>
        </button>
      </div>

      {/* ── Referral card ─────────────────────────────────────────── */}
      {referralCode && (
        <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Invite friends</p>
              <p className="text-xs text-muted-foreground">
                {referralCount > 0
                  ? `${referralCount} friend${referralCount !== 1 ? "s" : ""} purchased via your link`
                  : "Share your link — earn credit for purchases"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 bg-muted rounded-lg px-3 py-2 font-mono text-xs text-muted-foreground truncate border border-border/60">
              {referralLink}
            </div>
            <button
              onClick={handleCopyReferral}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-muted transition-colors"
            >
              {copied
                ? <><Check className="w-3 h-3 text-emerald-500" /> Copied</>
                : <><Copy className="w-3 h-3" /> Copy</>}
            </button>
          </div>
        </div>
      )}

    </PageShell>
  );
}

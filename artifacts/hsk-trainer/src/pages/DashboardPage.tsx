import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  BookOpen, Brain, Star, Trophy, ChevronRight,
  Lock, CheckCircle2, RefreshCw, ExternalLink, Play,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useProfile } from "@/hooks/use-profile";
import { useSavedWords } from "@/hooks/use-saved-words";
import { useStudyPrefs } from "@/hooks/use-study-prefs";
import { useLevelProgress, isLevelUnlocked, type LevelProgressMap } from "@/hooks/use-level-progress";
import { apiFetch } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useState } from "react";

const GUMROAD_URL =
  (import.meta.env.VITE_GUMROAD_URL as string | undefined) ?? "https://gumroad.com";

const LEVELS = [
  { id: 1, title: "Beginner",          count: 150  },
  { id: 2, title: "Elementary",        count: 150  },
  { id: 3, title: "Intermediate",      count: 300  },
  { id: 4, title: "Upper-Intermediate",count: 600  },
  { id: 5, title: "Advanced",          count: 1300 },
  { id: 6, title: "Mastery",           count: 2500 },
];

const fade = {
  hidden: { opacity: 0, y: 14 },
  show:   (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.3, delay: i * 0.06, ease: "easeOut" as const },
  }),
};

// ── Helpers ───────────────────────────────────────────────────────────────────

type LevelState = "free" | "locked" | "fresh" | "in_progress" | "passed";

function getLevelState(
  levelId: number,
  isPremium: boolean,
  progressMap: LevelProgressMap,
): LevelState {
  if (levelId === 1) {
    const entry = progressMap[1];
    if (!entry) return "free";
    if (entry.exam_passed) return "passed";
    return "in_progress";
  }
  if (!isPremium || !isLevelUnlocked(levelId, progressMap)) return "locked";
  const entry = progressMap[levelId];
  if (!entry) return "fresh";
  if (entry.exam_passed) return "passed";
  return "in_progress";
}

// ── Level pill ────────────────────────────────────────────────────────────────

function LevelPill({
  level,
  state,
  active,
  onClick,
}: {
  level: { id: number; title: string };
  state: LevelState;
  active: boolean;
  onClick?: () => void;
}) {
  const isPassed     = state === "passed";
  const isLocked     = state === "locked";
  const isFree       = state === "free";
  const isInProgress = state === "in_progress";
  const isFresh      = state === "fresh";

  return (
    <button
      onClick={isLocked ? undefined : onClick}
      disabled={isLocked}
      className={cn(
        "flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center transition-all duration-200",
        "min-w-0 flex-1",
        active && !isLocked
          ? "border-primary bg-primary/8 shadow-sm shadow-primary/10"
          : isLocked
          ? "border-border/40 bg-muted/30 opacity-50 cursor-not-allowed"
          : "border-border/60 bg-card hover:border-primary/30 hover:shadow-sm cursor-pointer",
      )}
    >
      <div className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
        isPassed     ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400" :
        isLocked     ? "bg-muted text-muted-foreground/50" :
        active       ? "bg-primary text-primary-foreground" :
                       "bg-muted text-muted-foreground",
      )}>
        {isPassed
          ? <CheckCircle2 className="w-3.5 h-3.5" />
          : isLocked
          ? <Lock className="w-3 h-3" />
          : level.id}
      </div>
      <div className="min-w-0 w-full">
        <p className={cn(
          "text-[10px] font-semibold leading-tight truncate",
          isLocked ? "text-muted-foreground/50" : active ? "text-primary" : "text-foreground",
        )}>
          HSK {level.id}
        </p>
        <p className={cn(
          "text-[9px] leading-tight truncate",
          isLocked ? "text-muted-foreground/40" : "text-muted-foreground",
        )}>
          {isPassed ? "Passed" :
           isFree || isFresh ? "Free" :
           isInProgress ? "Studying" :
           isLocked ? "Locked" : "Unlock"}
        </p>
      </div>
    </button>
  );
}

// ── DashboardPage ─────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { savedWords, getDueCards, getDueWords, isLoading: wordsLoading } = useSavedWords();
  const { prefs } = useStudyPrefs();
  const { progressMap } = useLevelProgress();
  const qc = useQueryClient();

  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const isPremium  = profile?.is_premium ?? false;
  const dueWords   = getDueWords();
  const dueCount   = getDueCards().length;
  const savedCount = savedWords.length;
  const lastLevel  = prefs.lastLevel ?? 1;
  const email      = user?.email ?? "";
  const firstName  = email.split("@")[0] || "learner";

  // Derive the best level to highlight as "active" for Continue Learning
  // Priority: last studied level → first unlocked in-progress → 1
  const activeLevel = LEVELS.find((l) => l.id === lastLevel) ?? LEVELS[0];

  // Words saved in the active level (for progress hint)
  const savedInLevel = savedWords.filter((w) =>
    w.word_id.startsWith(`hsk${activeLevel.id}-`)
  ).length;

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await apiFetch<{ is_premium: boolean; message: string }>("/api/premium/sync", {
        method: "POST",
      });
      setSyncMsg(res.message);
      if (res.is_premium) qc.invalidateQueries({ queryKey: ["profile"] });
    } catch {
      setSyncMsg("Sync failed. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  // ── Primary CTA text based on user state ─────────────────────────────────
  const continueCta = dueCount > 0
    ? { label: "Review Due Cards", sub: `${dueCount} card${dueCount !== 1 ? "s" : ""} waiting`, action: () => navigate("/review") }
    : savedCount > 0
    ? { label: `Continue HSK ${activeLevel.id}`, sub: activeLevel.title, action: () => navigate(`/flashcards/${activeLevel.id}`) }
    : { label: `Start HSK ${activeLevel.id}`, sub: activeLevel.title, action: () => navigate(`/flashcards/${activeLevel.id}`) };

  return (
    <div className="w-full mx-auto max-w-3xl px-4 md:px-6 lg:px-8 py-6 md:py-8 pb-24 space-y-6">

      {/* ── Welcome ─────────────────────────────────────────────── */}
      <motion.div
        custom={0} variants={fade} initial="hidden" animate="show"
        className="flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <span className="text-base font-bold text-primary">
              {firstName[0].toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-serif font-bold text-foreground leading-tight truncate">
              Welcome back, {firstName}
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

      {/* ── Continue Learning hero ──────────────────────────────── */}
      <motion.div custom={1} variants={fade} initial="hidden" animate="show">
        <button
          onClick={continueCta.action}
          className="w-full group flex items-center gap-4 p-5 rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            {dueCount > 0
              ? <RotateCcw className="w-6 h-6" />
              : <Play className="w-6 h-6 fill-current" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold leading-tight">{continueCta.label}</p>
            <p className="text-sm text-primary-foreground/70 mt-0.5">{continueCta.sub}</p>
            {savedInLevel > 0 && dueCount === 0 && (
              <p className="text-xs text-primary-foreground/60 mt-1">
                {savedInLevel} word{savedInLevel !== 1 ? "s" : ""} saved in this level
              </p>
            )}
          </div>
          <ChevronRight className="w-5 h-5 text-primary-foreground/60 shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </motion.div>

      {/* ── Level Status ────────────────────────────────────────── */}
      <motion.section custom={2} variants={fade} initial="hidden" animate="show">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-0.5">
            Level Progress
          </h2>
          <button
            onClick={() => navigate("/levels")}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            All levels <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {LEVELS.map((level) => {
            const state = getLevelState(level.id, isPremium, progressMap);
            return (
              <LevelPill
                key={level.id}
                level={level}
                state={state}
                active={level.id === activeLevel.id}
                onClick={() => navigate(
                  level.id === 1 || isPremium
                    ? `/flashcards/${level.id}`
                    : "/levels"
                )}
              />
            );
          })}
        </div>
      </motion.section>

      {/* ── Quick stats — only if user has data ─────────────────── */}
      {!wordsLoading && savedCount > 0 && (
        <motion.div
          custom={3} variants={fade} initial="hidden" animate="show"
          className="grid grid-cols-2 gap-3"
        >
          <div className="bg-card rounded-2xl border border-border/60 p-4 flex items-center gap-3 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-4.5 h-4.5" />
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
              {dueCount > 0
                ? <Star className="w-4.5 h-4.5" />
                : <CheckCircle2 className="w-4.5 h-4.5" />}
            </div>
            <div>
              <p className="text-xl font-bold text-foreground tabular-nums leading-none">
                {dueCount > 0 ? dueCount : "All clear"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {dueCount > 0 ? "Due for review" : "Nothing due"}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Secondary actions ────────────────────────────────────── */}
      <motion.section custom={4} variants={fade} initial="hidden" animate="show">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2.5 px-0.5">
          Study Options
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => navigate(`/quiz/${activeLevel.id}`)}
            className="flex flex-col items-start gap-2 rounded-2xl border border-border/60 bg-card p-4 text-left shadow-sm hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-200"
          >
            <Brain className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground leading-tight">Quiz</p>
              <p className="text-xs text-muted-foreground mt-0.5">HSK {activeLevel.id}</p>
            </div>
          </button>

          <button
            onClick={() => navigate("/review")}
            disabled={dueCount === 0}
            className={cn(
              "relative flex flex-col items-start gap-2 rounded-2xl border p-4 text-left shadow-sm transition-all duration-200",
              dueCount > 0
                ? "border-border/60 bg-card hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
                : "border-border/40 bg-muted/30 opacity-50 cursor-not-allowed",
            )}
          >
            {dueCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-background">
                {dueCount > 9 ? "9+" : dueCount}
              </span>
            )}
            <RotateCcw className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground leading-tight">Review</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {dueCount > 0 ? `${dueCount} due` : "All done"}
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate("/levels")}
            className="flex flex-col items-start gap-2 rounded-2xl border border-border/60 bg-card p-4 text-left shadow-sm hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-200"
          >
            <Trophy className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground leading-tight">Levels</p>
              <p className="text-xs text-muted-foreground mt-0.5">All HSK 1–6</p>
            </div>
          </button>
        </div>
      </motion.section>

      {/* ── Due for review list ──────────────────────────────────── */}
      {dueCount > 0 && (
        <motion.section custom={5} variants={fade} initial="hidden" animate="show">
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-0.5">
              Due for Review
            </h2>
            <button
              onClick={() => navigate("/review")}
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
                onClick={() => navigate("/review")}
                className="w-full text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 py-2.5 text-center transition-colors"
              >
                + {dueCount - 4} more — review all →
              </button>
            )}
          </div>
        </motion.section>
      )}

      {/* ── Premium / Upgrade ────────────────────────────────────── */}
      {!profileLoading && !isPremium && (
        <motion.section custom={6} variants={fade} initial="hidden" animate="show">
          <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                <Lock className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Unlock HSK 2–6</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  One-time purchase · lifetime access to 5,000+ words across all levels
                </p>
                {syncMsg && (
                  <p className="text-xs text-muted-foreground mt-1">{syncMsg}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <a
                href={GUMROAD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Upgrade
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-60"
              >
                <RefreshCw className={cn("w-3 h-3", syncing && "animate-spin")} />
                {syncing ? "Syncing…" : "Already purchased?"}
              </button>
            </div>
          </div>
        </motion.section>
      )}

      {/* ── Premium active banner ────────────────────────────────── */}
      {!profileLoading && isPremium && (
        <motion.div custom={6} variants={fade} initial="hidden" animate="show">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 flex-1">
              Premium active — all HSK 1–6 levels unlocked
            </p>
            <button
              onClick={() => navigate("/settings")}
              className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline shrink-0"
            >
              Settings
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

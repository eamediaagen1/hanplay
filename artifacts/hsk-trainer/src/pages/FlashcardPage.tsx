import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, ArrowRight, Star, ChevronLeft, Volume2, Lock, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { type VocabWord } from "@/data/hskData";
import { useSavedWords } from "@/hooks/use-saved-words";
import { useStudyPrefs } from "@/hooks/use-study-prefs";
import { useFlashcardPosition } from "@/hooks/use-flashcard-position";
import { useStreak } from "@/hooks/use-streak";
import { useLevelAccess } from "@/hooks/use-level-access";
import { apiFetch } from "@/lib/api";
import { Flashcard } from "@/components/Flashcard";
import { cn } from "@/lib/utils";
import { speakChinese } from "@/lib/speech";

const ALL_CATEGORIES = "All";

function getCategories(words: typeof hskData): string[] {
  const cats = words
    .map((w) => w.category)
    .filter((c): c is string => Boolean(c));
  return [ALL_CATEGORIES, ...Array.from(new Set(cats))];
}

export default function FlashcardPage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const level = parseInt(params.level || "1");

  // ── Access guard: premium + progression check ─────────────────────────────
  // Must be called unconditionally (hooks rules) before any early returns.
  const access = useLevelAccess(level);

  const { toggleSaveCard, isCardSaved } = useSavedWords();
  const { prefs, set: setPref } = useStudyPrefs();
  const { savedPosition, isLoading: positionLoading, savePosition } = useFlashcardPosition(level);
  const { ping: pingStreak } = useStreak();
  const positionRestored = useRef(false);

  // Track the last studied level for Dashboard quick-action + ping streak
  useEffect(() => {
    if (!access.allowed) return;
    setPref("lastLevel", level);
    pingStreak();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, access.allowed]);

  // Fetch words only when the access guard has confirmed the user is allowed.
  // This prevents the API call (and its 403 response) from even being made
  // when the user manipulated the URL to a level they can't access.
  const { data: apiLevel, isLoading: wordsLoading, error: wordsError } = useQuery({
    queryKey: ["lessons", level],
    queryFn: () =>
      apiFetch<{ level: number; words: VocabWord[] }>(`/api/lessons?level=${level}`).then(
        (r) => r.words
      ),
    enabled: access.allowed,
    staleTime: 30 * 60 * 1000,
  });

  const allLevelWords: VocabWord[] = apiLevel ?? [];

  const categories = getCategories(allLevelWords);

  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORIES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [speechSupported] = useState(() => "speechSynthesis" in window);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const levelWords =
    activeCategory !== ALL_CATEGORIES
      ? allLevelWords.filter((w) => w.category === activeCategory)
      : allLevelWords;

  // Restore saved position once (when words + position are both loaded)
  useEffect(() => {
    if (positionRestored.current) return;
    if (wordsLoading || positionLoading) return;
    if (!savedPosition) { positionRestored.current = true; return; }

    const cat = savedPosition.category ?? ALL_CATEGORIES;
    const idx = savedPosition.last_index ?? 0;
    setActiveCategory(cat);
    // We need the filtered word list after category is set — delay by one tick
    setTimeout(() => {
      setCurrentIndex(idx);
      setIsFlipped(false);
    }, 0);
    positionRestored.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordsLoading, positionLoading, savedPosition]);

  useEffect(() => {
    if (!positionRestored.current) return;
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [activeCategory]);

  useEffect(() => {
    setIsFlipped(false);
    if (!positionRestored.current) return;
    const word = levelWords[currentIndex];
    savePosition({
      level,
      category: activeCategory !== ALL_CATEGORIES ? activeCategory : null,
      last_index: currentIndex,
      last_word_id: word?.id ?? null,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  const safeIndex = levelWords.length > 0 ? Math.min(currentIndex, levelWords.length - 1) : 0;

  const handleSpeak = useCallback((word?: string) => {
    const wordEntry = levelWords[safeIndex];
    const target = word ?? wordEntry?.word;
    if (!target || typeof target !== "string") return;
    const didSpeak = speakChinese(target);
    if (didSpeak) {
      setIsSpeaking(true);
      const ms = 400 + target.length * 120 + 200;
      setTimeout(() => setIsSpeaking(false), ms);
    }
  }, [levelWords, safeIndex]);

  // Auto-play when card changes, or when words first finish loading (HSK2-6 API fetch)
  useEffect(() => {
    if (wordsLoading) return;
    if (prefs.autoPlay && levelWords[safeIndex]?.word) {
      handleSpeak(levelWords[safeIndex].word);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeIndex, prefs.autoPlay, wordsLoading]);

  // ── Access guard renders (must come before any content rendering) ────────
  if (access.isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Checking access…</p>
        </div>
      </div>
    );
  }

  if (!access.allowed) {
    const isPremiumGate = access.reason === "premium";
    return (
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="text-center max-w-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            {isPremiumGate ? "Premium Required" : "Level Locked"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {isPremiumGate
              ? "HSK levels 2–6 require a premium subscription."
              : "Complete the previous level's exam to unlock this one."}
          </p>
          <button
            onClick={() => setLocation("/dashboard")}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Show loading state while fetching words
  if (wordsLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading HSK {level} words…</p>
        </div>
      </div>
    );
  }

  // Show error/paywall for all levels
  if (wordsError) {
    const isPremiumError = (wordsError as { status?: number })?.status === 403;
    return (
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="text-center max-w-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            {isPremiumError ? "Premium Required" : "Unable to Load"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {isPremiumError
              ? "All HSK levels require a premium subscription. Upgrade to unlock all 6 levels."
              : "Something went wrong. Please check your connection and try again."}
          </p>
          <button
            onClick={() => setLocation("/dashboard")}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            Back to Levels
          </button>
        </div>
      </div>
    );
  }

  if (levelWords.length === 0) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold mb-4 text-foreground">No words found</h2>
          <button onClick={() => setLocation("/dashboard")} className="text-primary hover:underline">
            Go back
          </button>
        </div>
      </div>
    );
  }

  const currentWord = levelWords[safeIndex];
  const saved = isCardSaved(currentWord.id);
  const progress = ((safeIndex + 1) / levelWords.length) * 100;

  const handleNext = () => {
    if (currentIndex < levelWords.length - 1) setCurrentIndex((p) => p + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((p) => p - 1);
  };

  return (
    <div className="min-h-full flex flex-col">

      {/* ── Sticky top zone: context bar + mobile category chips ── */}
      <div className="sticky top-[52px] md:top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/50 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">

        {/* Header row */}
        <div className="flex items-center justify-between gap-3 px-4 h-[52px]">
          <button
            onClick={() => setLocation("/dashboard")}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors rounded-lg py-1.5 px-2 -ml-2 hover:bg-muted"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline text-sm font-medium">Levels</span>
          </button>

          <span className="font-bold font-serif text-base">HSK {level}</span>

          <button
            onClick={() => setLocation("/review")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border hover:bg-gold/10 hover:border-gold/40 transition-colors text-sm font-medium"
          >
            <Star className="w-3.5 h-3.5 text-gold fill-gold/20" />
            <span className="hidden sm:inline">Review</span>
          </button>
        </div>

        {/* Mobile category chips (lg: desktop sidebar takes over) */}
        {categories.length > 1 && (
          <div className="flex lg:hidden gap-2 overflow-x-auto scrollbar-none px-4 pb-2.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150",
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Body: category sidebar (desktop lg+) + flashcard main ── */}
      <div className="flex flex-1 w-full max-w-5xl mx-auto">

        {/* Desktop category sidebar — only visible at lg+ */}
        {categories.length > 1 && (
          <aside className="hidden lg:flex flex-col gap-px w-44 shrink-0 pt-6 pr-3 pl-2 border-r border-border/40">
            <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-3 px-3">
              Categories
            </p>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "text-left px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150",
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {cat}
              </button>
            ))}
          </aside>
        )}

        {/* Flashcard main area */}
        <main className="flex-1 flex flex-col py-6 px-4 md:px-8 overflow-y-auto">
          <div className="mx-auto w-full max-w-sm flex flex-col gap-5">

            {/* Progress */}
            <div>
              <div className="flex justify-between text-sm font-medium text-muted-foreground mb-2">
                <span>
                  {activeCategory !== ALL_CATEGORIES ? (
                    <span className="text-primary font-semibold">{activeCategory}</span>
                  ) : (
                    "Progress"
                  )}
                </span>
                <span className="tabular-nums">{safeIndex + 1} / {levelWords.length}</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <Flashcard
              word={currentWord}
              isFlipped={isFlipped}
              onFlip={() => setIsFlipped(!isFlipped)}
              showPinyin={prefs.showPinyin}
            />

            {/* Controls */}
            <div className="flex flex-col gap-3 pb-6">
              {/* Voice + Save */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleSpeak()}
                  disabled={!speechSupported}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 border text-sm",
                    speechSupported
                      ? isSpeaking
                        ? "bg-blue-500/15 border-blue-400/50 text-blue-600 dark:text-blue-400"
                        : "bg-card border-border text-foreground hover:bg-blue-500/10 hover:border-blue-400/40 hover:text-blue-600"
                      : "bg-muted border-border text-muted-foreground cursor-not-allowed opacity-50"
                  )}
                >
                  <Volume2 className={cn("w-4 h-4", isSpeaking && "animate-pulse")} />
                  {isSpeaking ? "Playing…" : "Listen"}
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); toggleSaveCard(currentWord.id); }}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 border-2 text-sm",
                    saved
                      ? "bg-gold/20 text-gold-foreground border-gold/50 hover:bg-gold/30 shadow-[0_0_15px_rgba(253,185,19,0.2)]"
                      : "bg-card text-foreground border-border hover:border-border/80 hover:bg-muted"
                  )}
                >
                  <Star className={cn("w-4 h-4", saved ? "fill-gold text-gold" : "text-muted-foreground")} />
                  {saved ? "Saved" : "Save"}
                </button>
              </div>

              {/* Prev / Next */}
              <div className="flex gap-3">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="flex-1 py-3.5 rounded-xl font-semibold bg-card border border-border text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Prev
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentIndex === levelWords.length - 1}
                  className="flex-1 py-3.5 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none transition-all flex items-center justify-center gap-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

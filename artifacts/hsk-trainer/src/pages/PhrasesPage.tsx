import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "wouter";
import { MessageSquare, ChevronLeft, Volume2 } from "lucide-react";
import { useLocation } from "wouter";
import { getPhrasesByLevel, getCategoriesByLevel, type Phrase } from "@/data/phraseData";
import { cn } from "@/lib/utils";

const LEVEL_META: Record<number, { title: string; color: string }> = {
  1: { title: "Elementary",      color: "bg-emerald-500" },
  2: { title: "Elementary+",     color: "bg-sky-500" },
  3: { title: "Intermediate",    color: "bg-violet-500" },
  4: { title: "Intermediate+",   color: "bg-amber-500" },
  5: { title: "Advanced",        color: "bg-rose-500" },
  6: { title: "Mastery",         color: "bg-red-600" },
};

function PhraseCard({ phrase }: { phrase: Phrase }) {
  const [revealed, setRevealed] = useState(false);

  const speak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ("speechSynthesis" in window) {
      const utt = new SpeechSynthesisUtterance(phrase.chinese);
      utt.lang = "zh-CN";
      utt.rate = 0.85;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utt);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-border/60 bg-card shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer overflow-hidden"
      onClick={() => setRevealed((r) => !r)}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-2xl font-bold text-foreground leading-snug tracking-wide flex-1">
            {phrase.chinese}
          </p>
          <button
            onClick={speak}
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors mt-0.5"
            aria-label="Speak"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm font-medium text-primary/80 mt-2 font-mono tracking-wide">
          {phrase.pinyin}
        </p>

        <AnimatePresence>
          {revealed && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 12 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-3 border-t border-border/50">
                <p className="text-sm text-foreground leading-relaxed">{phrase.english}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!revealed && (
          <p className="text-xs text-muted-foreground/60 mt-3">
            Tap to reveal translation
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default function PhrasesPage() {
  const params = useParams<{ level?: string }>();
  const [, setLocation] = useLocation();

  const level = parseInt(params.level ?? "1", 10) || 1;
  const meta  = LEVEL_META[level] ?? LEVEL_META[1];

  const phrases    = getPhrasesByLevel(level);
  const categories = getCategoriesByLevel(level);

  const [activeCategory, setActiveCategory] = useState<string>("All");

  const displayed = activeCategory === "All"
    ? phrases
    : phrases.filter((p) => p.category === activeCategory);

  const allCategories = ["All", ...categories];

  if (phrases.length === 0) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md text-center"
        >
          <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-3">
            HSK {level} Phrases
          </h1>
          <p className="text-muted-foreground">
            Phrases for HSK {level} are coming soon.
          </p>
          <button
            onClick={() => setLocation("/dashboard")}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <button
          onClick={() => setLocation("/dashboard")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Dashboard
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className={cn("w-2 h-10 rounded-full", meta.color)} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                HSK {level}
              </span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{meta.title}</span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-foreground">
              Common Phrases
            </h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground pl-5">
          {phrases.length} phrases · tap any card to reveal the English translation
        </p>
      </motion.div>

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-2 mb-6"
      >
        {allCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150",
              activeCategory === cat
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
            )}
          >
            {cat}
            {cat === "All" && (
              <span className="ml-1.5 opacity-60">({phrases.length})</span>
            )}
            {cat !== "All" && (
              <span className="ml-1.5 opacity-60">
                ({phrases.filter((p) => p.category === cat).length})
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {/* Phrase Cards */}
      <motion.div
        layout
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        <AnimatePresence mode="popLayout">
          {displayed.map((phrase) => (
            <PhraseCard key={phrase.id} phrase={phrase} />
          ))}
        </AnimatePresence>
      </motion.div>

      {displayed.length === 0 && (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No phrases in this category.
        </div>
      )}
    </div>
  );
}

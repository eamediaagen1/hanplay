import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useBranding, pickLogo } from "@/hooks/use-branding";
import { useTheme } from "@/hooks/use-theme";
import {
  BookOpen,
  Layers,
  CheckCircle2,
  ChevronRight,
  Star,
  ArrowRight,
  Brain,
  BarChart3,
  Shuffle,
  MessageSquare,
  GraduationCap,
  TrendingUp,
  Lock,
  Play,
  Trophy,
} from "lucide-react";

// ─── Animation helpers ─────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" as const },
  }),
};

const inView = (delay = 0) => ({
  viewport: { once: true, margin: "-60px" },
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: "easeOut" as const },
});

// ─── Reusable components ───────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary mb-4">
      <span className="w-5 h-px bg-primary" />
      {children}
      <span className="w-5 h-px bg-primary" />
    </p>
  );
}

function SectionDivider() {
  return (
    <div className="flex items-center justify-center gap-3 my-16 md:my-20">
      <span className="w-20 h-px bg-border" />
      <span className="text-border text-base">✦</span>
      <span className="w-20 h-px bg-border" />
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function MarketingPage() {
  const [, setLocation] = useLocation();
  const go = () => setLocation("/app");
  const goDemo = () => setLocation("/demo");
  const { data: brandAssets } = useBranding();
  const { theme } = useTheme();
  const logoContext = theme === "dark" ? "light" : "dark";
  const logoUrl = pickLogo(brandAssets, logoContext) ?? pickLogo(brandAssets, "default");

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden">

      {/* Ambient background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-80 h-80 rounded-full bg-primary/4 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 rounded-full bg-primary/3 blur-3xl" />
      </div>

      {/* ─── NAV ──────────────────────────────────────────────────────────── */}
      <nav className="relative z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {logoUrl
              ? <img src={logoUrl} alt="Hanplay" className="h-7 w-auto object-contain" />
              : <span className="text-2xl font-serif text-primary leading-none">汉</span>
            }
            {!logoUrl && <span className="font-bold text-foreground tracking-tight">Hanplay</span>}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation("/pricing")}
              className="hidden md:flex text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </button>
            <button
              onClick={goDemo}
              className="hidden sm:flex text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Try Demo
            </button>
            <button
              onClick={go}
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Sign in
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative z-10 pt-16 pb-10 md:pt-24 md:pb-14 px-5">
        <div className="max-w-3xl mx-auto text-center">

          <motion.div
            variants={fadeUp} initial="hidden" animate="show" custom={0}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/8 text-primary text-xs font-bold uppercase tracking-wider mb-7"
          >
            <Star className="w-3 h-3 fill-primary" />
            HSK 1–6 · Flashcards · Quizzes · Progress Tracking
          </motion.div>

          <motion.h1
            variants={fadeUp} initial="hidden" animate="show" custom={1}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground leading-[1.1] tracking-tight mb-5"
          >
            The structured way
            <br />
            <span className="text-primary font-serif">to master Chinese.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp} initial="hidden" animate="show" custom={2}
            className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-8"
          >
            Study Chinese vocabulary the right way — HSK level by level, with
            flashcards, phrase practice, and quizzes that actually build memory.
            No chaos. Just clear progress.
          </motion.p>

          <motion.div
            variants={fadeUp} initial="hidden" animate="show" custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <button
              onClick={go}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={goDemo}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base bg-card border-2 border-border text-foreground hover:bg-muted hover:border-primary/30 transition-all duration-200"
            >
              <Play className="w-4 h-4" />
              Try the Demo
            </button>
          </motion.div>

          {/* Hero flashcard mockup */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="show" custom={5}
            className="mt-12 relative"
          >
            <div className="bg-card border border-border/60 rounded-3xl p-8 shadow-2xl shadow-primary/5 max-w-xs mx-auto relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
              <p className="text-[80px] font-serif text-foreground mb-4 leading-none">你好</p>
              <p className="text-primary font-medium tracking-widest text-sm mb-1">nǐ hǎo</p>
              <p className="text-muted-foreground font-medium text-sm">Hello</p>
              <div className="mt-5 flex items-center justify-center gap-1.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={`h-1.5 rounded-full ${i === 1 ? "w-6 bg-primary" : "w-2 bg-muted"}`} />
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground/60 mt-2 uppercase tracking-wider">HSK 1 · Greetings</p>
            </div>
            {/* Floating badges */}
            <div className="absolute -left-4 top-8 hidden sm:flex items-center gap-2 bg-card border border-border/60 rounded-xl px-3 py-2 shadow-md text-xs font-semibold text-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Card saved
            </div>
            <div className="absolute -right-4 bottom-8 hidden sm:flex items-center gap-2 bg-card border border-border/60 rounded-xl px-3 py-2 shadow-md text-xs font-semibold text-foreground">
              <Brain className="w-3.5 h-3.5 text-primary" /> Quiz ready
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── STATS STRIP ─────────────────────────────────────────────────── */}
      <section className="relative z-10 px-5 pb-2">
        <div className="max-w-4xl mx-auto">
          <motion.div {...inView(0)} className="grid grid-cols-3 gap-4 border border-border/50 rounded-2xl bg-card/60 divide-x divide-border/50 overflow-hidden">
            {[
              { value: "6", label: "HSK Levels" },
              { value: "5,000+", label: "Vocabulary Words" },
              { value: "1×", label: "Lifetime Purchase" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center py-5 px-3">
                <p className="text-2xl md:text-3xl font-bold text-foreground tabular-nums">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* ─── PROBLEM ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-5 pb-4">
        <div className="max-w-4xl mx-auto">
          <motion.div {...inView(0)} className="text-center mb-10">
            <SectionLabel>The Problem</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
              Learning Chinese is hard.
              <br />
              <span className="text-muted-foreground font-medium">Most apps make it harder.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: "😵‍💫",
                title: "Too many words, zero structure",
                body: "Most tools dump thousands of words on you at once. Without a clear path, nothing actually sticks.",
              },
              {
                icon: "🔁",
                title: "You review. You forget. You repeat.",
                body: "Random word lists don't build long-term memory. You keep seeing the same words and still blank on the exam.",
              },
              {
                icon: "📉",
                title: "Progress feels invisible",
                body: "Without a level-by-level plan, it's impossible to know how far you've come — or what to study next.",
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                {...inView(i * 0.1)}
                className="bg-card border border-border/50 rounded-2xl p-6"
              >
                <p className="text-3xl mb-4">{card.icon}</p>
                <h3 className="font-bold text-foreground text-sm leading-snug mb-2">{card.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{card.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ─── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section className="relative z-10 px-5 pb-4">
        <div className="max-w-4xl mx-auto">
          <motion.div {...inView(0)} className="text-center mb-10">
            <SectionLabel>How It Works</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
              Simple steps. Real results.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            {/* Connector line (desktop only) */}
            <div className="hidden lg:block absolute top-9 left-[12.5%] right-[12.5%] h-px bg-border/60 z-0" />

            {[
              { step: "1", icon: Layers, title: "Choose your level", body: "Start at HSK 1. Each level builds on the last — no jumping ahead." },
              { step: "2", icon: BookOpen, title: "Study flashcards", body: "Practice characters, pinyin, and meanings. Save the words you want to review." },
              { step: "3", icon: Brain, title: "Take the quiz", body: "Test yourself with randomized questions. See exactly where you need more practice." },
              { step: "4", icon: Trophy, title: "Pass and progress", body: "Score 80%+ on the exam to unlock the next level. Track your real advancement." },
            ].map(({ step, icon: Icon, title, body }, i) => (
              <motion.div
                key={i}
                {...inView(i * 0.1)}
                className="relative z-10 flex flex-col items-center text-center"
              >
                <div className="w-[52px] h-[52px] rounded-2xl bg-card border border-border/60 flex items-center justify-center mb-4 shadow-sm relative">
                  <Icon className="w-5 h-5 text-primary" />
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                    {step}
                  </span>
                </div>
                <h3 className="font-bold text-foreground text-sm mb-1.5">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ─── FEATURES ────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-5 pb-4">
        <div className="max-w-4xl mx-auto">
          <motion.div {...inView(0)} className="text-center mb-10">
            <SectionLabel>Features</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
              Every tool you need
              <br />
              <span className="text-muted-foreground font-medium">in one place.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: BookOpen,
                color: "bg-primary/10 text-primary",
                title: "Flashcards by Category",
                body: "Words are grouped by theme — greetings, numbers, time, travel. Study what's relevant, not random.",
              },
              {
                icon: MessageSquare,
                color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                title: "Phrase Practice",
                body: "Go beyond vocabulary. Learn common real-world phrases in context, grouped by HSK level.",
              },
              {
                icon: Brain,
                color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
                title: "Quizzes & Exams",
                body: "Randomized quizzes every session. Pass the HSK-style exam to unlock the next level.",
              },
              {
                icon: Shuffle,
                color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                title: "Spaced Repetition",
                body: "The app tracks which cards you struggle with and schedules reviews at the optimal time.",
              },
              {
                icon: TrendingUp,
                color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                title: "Progress Tracking",
                body: "See your saved words, review queue, and exam scores. Know exactly how far you've come.",
              },
              {
                icon: GraduationCap,
                color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                title: "Level Progression",
                body: "Unlock HSK 2 → 6 as you advance. Structured progression that mirrors the real HSK exam path.",
              },
            ].map(({ icon: Icon, color, title, body }, i) => (
              <motion.div
                key={i}
                {...inView(i * 0.07)}
                className="bg-card border border-border/50 rounded-2xl p-6 hover:border-primary/20 hover:shadow-md hover:shadow-primary/5 transition-all duration-200"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} mb-4`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-foreground text-sm mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ─── PRODUCT PREVIEW ─────────────────────────────────────────────── */}
      <section className="relative z-10 px-5 pb-4">
        <div className="max-w-5xl mx-auto">
          <motion.div {...inView(0)} className="text-center mb-10">
            <SectionLabel>See It in Action</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
              Clean. Focused. Built for learners.
            </h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto text-sm">
              No clutter. No gamification gimmicks. Just the tools that actually improve your Chinese.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Level selector mockup */}
            <motion.div {...inView(0)} className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Level Selection</p>
              <div className="space-y-2.5">
                {[
                  { level: "HSK 1", words: "150 words", free: true },
                  { level: "HSK 2", words: "150 words", free: false },
                  { level: "HSK 3", words: "300 words", free: false },
                ].map(({ level, words, free }) => (
                  <div key={level} className="flex items-center justify-between px-4 py-3 rounded-xl border border-border/40 bg-muted/30">
                    <div>
                      <p className="font-bold text-sm text-foreground">{level}</p>
                      <p className="text-xs text-muted-foreground">{words}</p>
                    </div>
                    {free
                      ? <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Free</span>
                      : <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-primary/8 text-primary"><Lock className="w-2.5 h-2.5" /> Premium</span>}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">All 6 levels unlocked with a single purchase.</p>
            </motion.div>

            {/* Flashcard mockup */}
            <motion.div {...inView(0.08)} className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Flashcard Study</p>
              <div className="bg-background border border-border/40 rounded-2xl p-6 text-center mb-4 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
                <p className="text-6xl font-serif text-foreground mb-3">学习</p>
                <p className="text-primary text-sm tracking-widest font-medium mb-1">xué xí</p>
                <p className="text-muted-foreground text-sm">Study / Learn</p>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 h-10 rounded-xl bg-red-500/8 border border-red-200 dark:border-red-900/40 flex items-center justify-center text-xs font-semibold text-red-600 dark:text-red-400">
                  Again
                </div>
                <div className="flex-1 h-10 rounded-xl bg-green-500/8 border border-green-200 dark:border-green-900/40 flex items-center justify-center text-xs font-semibold text-green-600 dark:text-green-400">
                  Got it
                </div>
              </div>
            </motion.div>

            {/* Quiz mockup */}
            <motion.div {...inView(0.1)} className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Quiz Mode</p>
              <p className="text-sm font-semibold text-foreground mb-4">What does this character mean?</p>
              <p className="text-5xl font-serif text-center text-foreground mb-5">水</p>
              <div className="grid grid-cols-2 gap-2">
                {["Fire", "Water", "Earth", "Wind"].map((opt, i) => (
                  <div
                    key={opt}
                    className={`px-3 py-2.5 rounded-xl border text-sm font-medium text-center ${
                      i === 1
                        ? "border-emerald-500/50 bg-emerald-500/8 text-emerald-700 dark:text-emerald-400"
                        : "border-border/50 bg-muted/30 text-muted-foreground"
                    }`}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Review stats mockup */}
            <motion.div {...inView(0.15)} className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Spaced Review</p>
              <div className="space-y-2.5">
                {[
                  { label: "Words Saved", value: "48", icon: BookOpen },
                  { label: "Quiz Score", value: "90%", icon: BarChart3 },
                  { label: "Due for Review", value: "12", icon: Shuffle },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-3 bg-muted/30 rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{label}</span>
                    </div>
                    <span className="text-sm font-bold text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ─── TESTIMONIALS ────────────────────────────────────────────────── */}
      <section className="relative z-10 px-5 pb-4">
        <div className="max-w-5xl mx-auto">
          <motion.div {...inView(0)} className="text-center mb-10">
            <SectionLabel>Learners Say</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
              Real progress. Real people.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                name: "Sophie T.",
                role: "Beginner learner, no prior Chinese",
                quote:
                  "I'd tried Duolingo and random YouTube videos, but nothing clicked. This app gave me a real structure. HSK 1 in 3 weeks — and I actually remember the words.",
                stars: 5,
              },
              {
                name: "Marcus L.",
                role: "Self-learner preparing for travel",
                quote:
                  "The flashcard categories are brilliant. Studying 'travel' words before my trip to Shanghai made everything so practical. I could actually hold basic conversations.",
                stars: 5,
              },
              {
                name: "Ji-Young K.",
                role: "University student, HSK exam focus",
                quote:
                  "The exam mode is exactly what I needed. Clear pass/fail, level progression, no hand-holding. It pushed me to study more seriously and my test scores improved noticeably.",
                stars: 5,
              },
              {
                name: "Nadia R.",
                role: "Busy professional, 15 mins/day",
                quote:
                  "I only study on my commute. The review queue is perfect — it remembers which words I mess up and brings them back at the right time. No wasted sessions.",
                stars: 5,
              },
            ].map(({ name, role, quote, stars }, i) => (
              <motion.div
                key={i}
                {...inView(i * 0.1)}
                className="bg-card border border-border/50 rounded-2xl p-6 flex flex-col gap-4"
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: stars }).map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed flex-1">"{quote}"</p>
                <div className="border-t border-border/40 pt-4">
                  <p className="text-sm font-semibold text-foreground">{name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ─── BENEFITS ────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-5 pb-4">
        <div className="max-w-3xl mx-auto">
          <motion.div {...inView(0)} className="text-center mb-10">
            <SectionLabel>Why It Works</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
              Everything you need.
              <br />
              <span className="text-muted-foreground font-medium">Nothing you don't.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              "150 HSK 1 words — fully organized by category",
              "Flashcards with character, pinyin, and meaning",
              "Quizzes randomized every session",
              "Spaced repetition — review cards at the right time",
              "Voice pronunciation for every word",
              "Exam-based level progression (pass to unlock next)",
              "Progress saved to your account automatically",
              "Dark mode for late-night study sessions",
            ].map((benefit, i) => (
              <motion.div
                key={i}
                {...inView(i * 0.05)}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors"
              >
                <CheckCircle2 className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-foreground leading-snug">{benefit}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ─── FINAL CTA ───────────────────────────────────────────────────── */}
      <section className="relative z-10 px-5 pb-20">
        <motion.div
          {...inView(0)}
          className="max-w-2xl mx-auto bg-card border border-border/60 rounded-3xl p-10 md:p-14 text-center shadow-xl shadow-primary/5 relative overflow-hidden"
        >
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

          <p className="text-4xl font-serif text-primary/20 mb-4 leading-none select-none">加油</p>

          <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-3">
            Start learning Chinese today.
          </h2>
          <p className="text-base text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
            HSK 1 is completely free. Try the demo without an account.
            Upgrade once for lifetime access to all 6 HSK levels — 5,000+ words.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={go}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-10 py-4 rounded-2xl font-bold text-base bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={goDemo}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base bg-transparent border-2 border-border text-foreground hover:bg-muted hover:border-primary/30 transition-all duration-200"
            >
              <Play className="w-4 h-4" />
              Try the Demo
            </button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            No credit card required to sign up. Upgrade anytime.
          </p>

          <p className="mt-6 text-xs text-muted-foreground/40 font-serif">
            加油 — Keep going
          </p>
        </motion.div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-border/40 px-5 py-8 bg-background/60">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2.5">
            {logoUrl
              ? <img src={logoUrl} alt="Hanplay" className="h-6 w-auto object-contain" />
              : <span className="text-xl font-serif text-primary leading-none">汉</span>
            }
            {!logoUrl && <span className="font-semibold text-foreground">Hanplay</span>}
            <span className="hidden sm:inline text-border">·</span>
            <span className="hidden sm:inline">Learn Chinese, one level at a time.</span>
          </div>
          <div className="flex items-center gap-5">
            <button onClick={goDemo} className="hover:text-foreground transition-colors text-xs">
              Try Demo
            </button>
            <span className="text-border">·</span>
            <button onClick={go} className="hover:text-foreground transition-colors text-xs">
              Sign in
            </button>
            <span className="text-border">·</span>
            <span className="text-xs text-muted-foreground/60">© {new Date().getFullYear()} Hanplay</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

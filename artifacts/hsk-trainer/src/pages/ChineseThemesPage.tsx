import { useLocation } from "wouter";
import { ArrowLeft, Smartphone, Tablet, Laptop, Sticker, Shirt, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

const CATEGORIES = [
  {
    icon: Smartphone,
    title: "Phone Wallpapers",
    desc: "Beautiful Chinese-inspired wallpapers for your lock screen and home screen.",
    color: "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
  },
  {
    icon: Tablet,
    title: "iPad Wallpapers",
    desc: "Stunning full-resolution artwork sized for every iPad model.",
    color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  },
  {
    icon: Laptop,
    title: "Laptop Wallpapers",
    desc: "Widescreen wallpapers blending calligraphy, ink wash, and modern design.",
    color: "bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400",
  },
  {
    icon: Sticker,
    title: "Stickers",
    desc: "Character and phrase stickers — perfect for notebooks, laptops, and water bottles.",
    color: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  },
  {
    icon: Shirt,
    title: "Merch",
    desc: "Apparel and accessories featuring HSK vocabulary, idioms, and Chinese aesthetics.",
    color: "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400",
  },
];

export default function ChineseThemesPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const handleBack = () => navigate(user ? "/dashboard" : "/");

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Nav */}
      <nav className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-serif font-bold text-sm">
              汉
            </div>
            <span className="font-bold text-sm hidden sm:block">HSK Trainer</span>
          </div>
          {!user && (
            <button
              onClick={() => navigate("/app")}
              className="text-sm font-semibold text-primary hover:underline"
            >
              Sign in
            </button>
          )}
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">

        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-5">
            <Sparkles className="w-4 h-4" />
            Coming Soon
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-foreground leading-tight">
            Chinese Themes
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            A curated shop for Chinese learning aesthetics — wallpapers, stickers, and merch 
            inspired by the beauty of the language you're studying.
          </p>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.title}
                className="group bg-card border border-border/60 rounded-3xl p-6 flex flex-col gap-4 shadow-sm relative overflow-hidden transition-all duration-200 hover:shadow-md hover:border-border"
              >
                {/* Coming soon badge */}
                <div className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60">
                  Soon
                </div>

                {/* Icon */}
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${cat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Text */}
                <div>
                  <h3 className="font-bold text-foreground text-base">{cat.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{cat.desc}</p>
                </div>

                {/* Placeholder CTA */}
                <div className="mt-auto">
                  <div className="h-8 rounded-xl bg-muted/60 flex items-center justify-center">
                    <span className="text-xs text-muted-foreground font-medium">Notify me when ready</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom note */}
        <div className="mt-16 text-center bg-card border border-border/60 rounded-3xl p-8">
          <div className="text-3xl font-serif mb-3">美</div>
          <h2 className="text-lg font-bold text-foreground mb-2">
            Where learning meets aesthetics
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            We're building a collection that celebrates Chinese language and culture — 
            designed for learners who want to carry their passion beyond the screen.
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            Check back soon. New products will appear here as they launch.
          </p>
        </div>
      </div>
    </div>
  );
}

import { Smartphone, Tablet, Laptop, Sticker, Shirt, Sparkles, Lock, ExternalLink } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { PageShell } from "@/components/PageShell";
import { buildGumroadUrl } from "@/lib/gumroad";
import { getStoredReferralCode } from "@/hooks/use-referral-capture";

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
  const { data: profile, isLoading } = useProfile();
  const isPremium = profile?.is_premium ?? false;

  if (isLoading) {
    return (
      <PageShell maxWidth="lg">
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </PageShell>
    );
  }

  if (!isPremium) {
    return (
      <PageShell maxWidth="md">
        <div className="flex flex-col items-center text-center py-16 px-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-6">
            <Lock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-foreground mb-3">Premium Feature</h1>
          <p className="text-muted-foreground mb-8 max-w-sm leading-relaxed">
            Chinese Themes is a premium perk. Upgrade once to unlock all HSK levels and exclusive 
            aesthetic content — wallpapers, stickers, and merch inspired by the language you're learning.
          </p>
          <a
            href={buildGumroadUrl(getStoredReferralCode())}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            Upgrade to Premium
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="lg">
      {/* Hero */}
      <div className="text-center mb-12">
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
              <div className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60">
                Soon
              </div>
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${cat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-base">{cat.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{cat.desc}</p>
              </div>
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
      <div className="mt-12 text-center bg-card border border-border/60 rounded-3xl p-8">
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
    </PageShell>
  );
}

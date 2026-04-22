import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Smartphone, Tablet, Laptop, Sticker, Shirt, Sparkles, Lock, ExternalLink, ChevronRight } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { PageShell } from "@/components/PageShell";
import { buildGumroadUrl } from "@/lib/gumroad";
import { getStoredReferralCode } from "@/hooks/use-referral-capture";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ThemeProduct {
  id: string;
  category: string;
}

// ─── Category catalogue ───────────────────────────────────────────────────────

export const CATEGORY_SLUGS: Record<string, string> = {
  "Phone Wallpapers":  "phone-wallpapers",
  "iPad Wallpapers":   "ipad-wallpapers",
  "Laptop Wallpapers": "laptop-wallpapers",
  "Stickers":          "stickers",
  "Merch":             "merch",
};

export const SLUG_TO_CATEGORY: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_SLUGS).map(([name, slug]) => [slug, name])
);

export const CATEGORIES: {
  name: string;
  slug: string;
  icon: React.ElementType;
  description: string;
  gradient: string;
  iconColor: string;
}[] = [
  {
    name: "Phone Wallpapers",
    slug: "phone-wallpapers",
    icon: Smartphone,
    description: "Lock screens & home screens",
    gradient: "from-violet-500/20 via-violet-400/10 to-transparent",
    iconColor: "text-violet-500",
  },
  {
    name: "iPad Wallpapers",
    slug: "ipad-wallpapers",
    icon: Tablet,
    description: "Full-bleed tablet wallpapers",
    gradient: "from-blue-500/20 via-blue-400/10 to-transparent",
    iconColor: "text-blue-500",
  },
  {
    name: "Laptop Wallpapers",
    slug: "laptop-wallpapers",
    icon: Laptop,
    description: "Desktop & MacBook backgrounds",
    gradient: "from-sky-500/20 via-sky-400/10 to-transparent",
    iconColor: "text-sky-500",
  },
  {
    name: "Stickers",
    slug: "stickers",
    icon: Sticker,
    description: "Digital stickers for messaging & notes",
    gradient: "from-amber-500/20 via-amber-400/10 to-transparent",
    iconColor: "text-amber-500",
  },
  {
    name: "Merch",
    slug: "merch",
    icon: Shirt,
    description: "Physical goods & accessories",
    gradient: "from-rose-500/20 via-rose-400/10 to-transparent",
    iconColor: "text-rose-500",
  },
];

// ─── Category card ────────────────────────────────────────────────────────────

function CategoryCard({
  cat,
  count,
  onClick,
}: {
  cat: typeof CATEGORIES[number];
  count: number;
  onClick: () => void;
}) {
  const Icon = cat.icon;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/60 hover:border-border transition-all text-left group"
    >
      <div className={cn("w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0", cat.iconColor)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{cat.name}</p>
        <p className="text-xs text-muted-foreground">
          {count > 0 ? `${count} item${count !== 1 ? "s" : ""}` : "Coming soon"}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
    </button>
  );
}

// ─── Main hub page ────────────────────────────────────────────────────────────

export default function ChineseThemesPage() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const isPremium = profile?.is_premium ?? false;
  const [, navigate] = useLocation();

  const { data: products } = useQuery<ThemeProduct[]>({
    queryKey: ["themes"],
    queryFn: () => apiFetch<ThemeProduct[]>("/api/themes"),
    enabled: isPremium && !profileLoading,
    staleTime: 5 * 60 * 1000,
  });

  // ── Loading ───────────────────────────────────────────────────────────────
  if (profileLoading) {
    return (
      <PageShell maxWidth="lg">
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </PageShell>
    );
  }

  // ── Premium gate ──────────────────────────────────────────────────────────
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

  // ── Count products per category ───────────────────────────────────────────
  const countFor = (name: string) =>
    (products ?? []).filter((p) => p.category === name).length;

  return (
    <PageShell maxWidth="lg">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-5">
          <Sparkles className="w-4 h-4" />
          Premium Downloads
        </div>
        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-foreground leading-tight">
          Chinese Themes
        </h1>
        <p className="mt-4 text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Exclusive wallpapers, stickers, and aesthetic content — curated for Chinese language learners.
          Choose a category to browse.
        </p>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {CATEGORIES.map((cat) => (
          <CategoryCard
            key={cat.slug}
            cat={cat}
            count={countFor(cat.name)}
            onClick={() => navigate(`/chinese-themes/${cat.slug}`)}
          />
        ))}
      </div>

      {/* Footer note */}
      <div className="mt-10 text-center bg-card border border-border/60 rounded-3xl p-8">
        <div className="text-3xl font-serif mb-3">美</div>
        <h2 className="text-base font-bold text-foreground mb-1">Where learning meets aesthetics</h2>
        <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
          Designed for learners who want to carry their passion for Chinese beyond the screen.
          New content added regularly — check back soon.
        </p>
      </div>
    </PageShell>
  );
}

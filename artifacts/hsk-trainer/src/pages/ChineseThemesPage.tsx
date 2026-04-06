import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Smartphone, Tablet, Laptop, Sticker, Shirt, Sparkles,
  Lock, ExternalLink, Download, Eye, X, Loader2, ImageIcon, ChevronRight,
} from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { PageShell } from "@/components/PageShell";
import { buildGumroadUrl } from "@/lib/gumroad";
import { getStoredReferralCode } from "@/hooks/use-referral-capture";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ThemeProduct {
  id: string;
  title: string;
  slug: string;
  category: string;
  description: string | null;
  cover_image_url: string | null;
  preview_image_url: string | null;
  file_type: string | null;
  download_name: string | null;
}

// ─── Category config ─────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { icon: React.ElementType; color: string }> = {
  "Phone Wallpapers": { icon: Smartphone, color: "text-violet-600 dark:text-violet-400" },
  "iPad Wallpapers":  { icon: Tablet,     color: "text-blue-600 dark:text-blue-400" },
  "Laptop Wallpapers":{ icon: Laptop,     color: "text-sky-600 dark:text-sky-400" },
  "Stickers":         { icon: Sticker,    color: "text-amber-600 dark:text-amber-400" },
  "Merch":            { icon: Shirt,      color: "text-rose-600 dark:text-rose-400" },
};

// ─── View modal ───────────────────────────────────────────────────────────────

function ProductModal({
  product,
  onClose,
}: {
  product: ThemeProduct;
  onClose: () => void;
}) {
  const imgUrl = product.preview_image_url ?? product.cover_image_url;

  const downloadMut = useMutation({
    mutationFn: () =>
      apiFetch<{ url: string; name: string }>(`/api/themes/${product.id}/download`),
    onSuccess: ({ url, name }) => {
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.click();
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-card border border-border rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-xl bg-background/80 hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Preview image */}
        <div className="aspect-video bg-muted relative overflow-hidden">
          {imgUrl ? (
            <img src={imgUrl} alt={product.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {product.category}
              </span>
              <h2 className="text-lg font-bold text-foreground mt-0.5">{product.title}</h2>
            </div>
            <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              Premium
            </span>
          </div>

          {product.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
          )}

          {downloadMut.isError && (
            <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
              Download failed — please try again.
            </p>
          )}

          <button
            onClick={() => downloadMut.mutate()}
            disabled={downloadMut.isPending}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors shadow-lg shadow-primary/20"
          >
            {downloadMut.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Preparing…</>
            ) : (
              <><Download className="w-4 h-4" /> Download</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Product card ─────────────────────────────────────────────────────────────

function ProductCard({
  product,
  onView,
}: {
  product: ThemeProduct;
  onView: () => void;
}) {
  const coverUrl = product.cover_image_url;
  const downloadMut = useMutation({
    mutationFn: () =>
      apiFetch<{ url: string; name: string }>(`/api/themes/${product.id}/download`),
    onSuccess: ({ url, name }) => {
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.click();
    },
  });

  return (
    <div className="group bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-border transition-all duration-200">
      {/* Cover */}
      <div className="aspect-video bg-muted relative overflow-hidden">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-muted-foreground/20" />
          </div>
        )}
        {/* Category badge */}
        <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/50 text-white backdrop-blur-sm">
          {product.category}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-foreground text-sm leading-tight">{product.title}</h3>
          {product.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        {downloadMut.isError && (
          <p className="text-xs text-red-600">Download failed — try again</p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onView}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-muted text-foreground hover:bg-muted/80 transition-colors border border-border/60"
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </button>
          <button
            onClick={() => downloadMut.mutate()}
            disabled={downloadMut.isPending}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors shadow-sm shadow-primary/20"
          >
            {downloadMut.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            {downloadMut.isPending ? "…" : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ChineseThemesPage() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const isPremium = profile?.is_premium ?? false;

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [viewing, setViewing] = useState<ThemeProduct | null>(null);

  const { data: products, isLoading: productsLoading } = useQuery<ThemeProduct[]>({
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

  // ── Derive categories from loaded products ────────────────────────────────
  const categories = Array.from(new Set((products ?? []).map((p) => p.category)));
  const displayCat = activeCategory ?? categories[0] ?? null;
  const visibleProducts = displayCat
    ? (products ?? []).filter((p) => p.category === displayCat)
    : (products ?? []);

  return (
    <>
      {viewing && (
        <ProductModal product={viewing} onClose={() => setViewing(null)} />
      )}

      <PageShell maxWidth="lg">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-5">
            <Sparkles className="w-4 h-4" />
            Premium Downloads
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-foreground leading-tight">
            Chinese Themes
          </h1>
          <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Exclusive wallpapers, stickers, and aesthetic content — curated for Chinese language learners.
          </p>
        </div>

        {/* Loading state */}
        {productsLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty state */}
        {!productsLoading && (products ?? []).length === 0 && (
          <div className="text-center py-16 bg-card border border-border/60 rounded-3xl">
            <div className="text-4xl font-serif mb-4">美</div>
            <h2 className="text-lg font-bold text-foreground mb-2">Products Coming Soon</h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              The first batch of wallpapers, stickers, and aesthetics is being prepared. 
              Check back soon — new content drops regularly for premium members.
            </p>
          </div>
        )}

        {/* Category tabs + product grid */}
        {!productsLoading && (products ?? []).length > 0 && (
          <>
            {/* Category tab bar */}
            {categories.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 mb-6">
                {categories.map((cat) => {
                  const meta = CATEGORY_META[cat];
                  const Icon = meta?.icon;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={cn(
                        "shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-150 border",
                        displayCat === cat
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-card text-muted-foreground border-border hover:border-border/80 hover:text-foreground"
                      )}
                    >
                      {Icon && <Icon className="w-3.5 h-3.5" />}
                      {cat}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Product grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onView={() => setViewing(product)}
                />
              ))}
            </div>

            {/* Category quick-links (if showing all) */}
            {!activeCategory && categories.length > 1 && (
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map((cat) => {
                  const meta = CATEGORY_META[cat];
                  const Icon = meta?.icon;
                  const count = (products ?? []).filter((p) => p.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/60 hover:border-border transition-all text-left group"
                    >
                      {Icon && (
                        <div className={cn("w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0", meta.color)}>
                          <Icon className="w-4 h-4" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{cat}</p>
                        <p className="text-xs text-muted-foreground">{count} item{count !== 1 ? "s" : ""}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

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
    </>
  );
}

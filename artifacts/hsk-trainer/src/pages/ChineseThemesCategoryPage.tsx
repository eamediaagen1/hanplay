import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Download, Eye, X, Loader2, ImageIcon, Lock, ExternalLink } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { PageShell } from "@/components/PageShell";
import { buildGumroadUrl } from "@/lib/gumroad";
import { getStoredReferralCode } from "@/hooks/use-referral-capture";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { SLUG_TO_CATEGORY, CATEGORIES } from "./ChineseThemesPage";

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

// ─── Per-category display config ──────────────────────────────────────────────

interface DisplayConfig {
  cardAspect: string;
  gridCols: string;
  modalAspect: string;
  modalMaxW: string;
}

const DISPLAY_CONFIG: Record<string, DisplayConfig> = {
  "Phone Wallpapers": {
    cardAspect:  "aspect-[9/16]",
    gridCols:    "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
    modalAspect: "aspect-[9/16]",
    modalMaxW:   "max-w-xs",
  },
  "iPad Wallpapers": {
    cardAspect:  "aspect-[3/4]",
    gridCols:    "grid-cols-2 sm:grid-cols-3",
    modalAspect: "aspect-[3/4]",
    modalMaxW:   "max-w-sm",
  },
  "Laptop Wallpapers": {
    cardAspect:  "aspect-[16/9]",
    gridCols:    "grid-cols-1 sm:grid-cols-2",
    modalAspect: "aspect-[16/9]",
    modalMaxW:   "max-w-2xl",
  },
  "Stickers": {
    cardAspect:  "aspect-square",
    gridCols:    "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
    modalAspect: "aspect-square",
    modalMaxW:   "max-w-sm",
  },
  "Merch": {
    cardAspect:  "aspect-square",
    gridCols:    "grid-cols-2 sm:grid-cols-3",
    modalAspect: "aspect-square",
    modalMaxW:   "max-w-md",
  },
};

const DEFAULT_CONFIG: DisplayConfig = {
  cardAspect:  "aspect-[4/3]",
  gridCols:    "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  modalAspect: "aspect-video",
  modalMaxW:   "max-w-lg",
};

// ─── Download helper ──────────────────────────────────────────────────────────

function useDownload(productId: string) {
  return useMutation({
    mutationFn: () =>
      apiFetch<{ url: string; name: string }>(`/api/themes/${productId}/download`),
    onSuccess: ({ url, name }) => {
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.click();
    },
  });
}

// ─── View modal ───────────────────────────────────────────────────────────────

function ProductModal({
  product,
  config,
  onClose,
}: {
  product: ThemeProduct;
  config: DisplayConfig;
  onClose: () => void;
}) {
  const imgUrl = product.preview_image_url ?? product.cover_image_url;
  const downloadMut = useDownload(product.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={cn(
          "relative bg-card border border-border rounded-3xl shadow-2xl w-full overflow-hidden",
          config.modalMaxW
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-xl bg-background/80 hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Image — category aspect ratio */}
        <div className={cn("bg-muted relative overflow-hidden", config.modalAspect)}>
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
  config,
  onView,
}: {
  product: ThemeProduct;
  config: DisplayConfig;
  onView: () => void;
}) {
  const coverUrl = product.cover_image_url;
  const downloadMut = useDownload(product.id);

  return (
    <div className="group bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-border transition-all duration-200">
      {/* Cover — category aspect ratio */}
      <div className={cn("bg-muted relative overflow-hidden", config.cardAspect)}>
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
      </div>

      {/* Body */}
      <div className="p-3 space-y-2.5">
        <div>
          <h3 className="font-bold text-foreground text-sm leading-tight">{product.title}</h3>
          {product.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        {downloadMut.isError && (
          <p className="text-xs text-red-600">Download failed — try again</p>
        )}

        {/* Actions */}
        <div className="flex gap-1.5">
          <button
            onClick={onView}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold bg-muted text-foreground hover:bg-muted/80 transition-colors border border-border/60"
          >
            <Eye className="w-3 h-3" />
            View
          </button>
          <button
            onClick={() => downloadMut.mutate()}
            disabled={downloadMut.isPending}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors shadow-sm shadow-primary/20"
          >
            {downloadMut.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Download className="w-3 h-3" />
            )}
            {downloadMut.isPending ? "…" : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Category page ────────────────────────────────────────────────────────────

export default function ChineseThemesCategoryPage() {
  const { category: slug } = useParams<{ category: string }>();
  const [, navigate] = useLocation();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const isPremium = profile?.is_premium ?? false;

  const categoryName = SLUG_TO_CATEGORY[slug ?? ""] ?? null;
  const catMeta = CATEGORIES.find((c) => c.slug === slug);
  const config = categoryName ? (DISPLAY_CONFIG[categoryName] ?? DEFAULT_CONFIG) : DEFAULT_CONFIG;

  const [viewing, setViewing] = useState<ThemeProduct | null>(null);

  const { data: allProducts, isLoading: productsLoading } = useQuery<ThemeProduct[]>({
    queryKey: ["themes"],
    queryFn: () => apiFetch<ThemeProduct[]>("/api/themes"),
    enabled: isPremium && !profileLoading,
    staleTime: 5 * 60 * 1000,
  });

  const products = (allProducts ?? []).filter((p) => p.category === categoryName);

  // ── Loading ─────────────────────────────────────────────────────────────
  if (profileLoading) {
    return (
      <PageShell maxWidth="lg">
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </PageShell>
    );
  }

  // ── Premium gate ───────────────────────────────────────────────────────
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
            aesthetic content — wallpapers, stickers, and merch.
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

  // ── Unknown category ───────────────────────────────────────────────────
  if (!categoryName) {
    return (
      <PageShell maxWidth="md">
        <div className="flex flex-col items-center text-center py-16 px-4">
          <p className="text-muted-foreground mb-4">Category not found.</p>
          <button
            onClick={() => navigate("/chinese-themes")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-muted text-foreground hover:bg-muted/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Chinese Themes
          </button>
        </div>
      </PageShell>
    );
  }

  const Icon = catMeta?.icon;

  return (
    <>
      {viewing && (
        <ProductModal
          product={viewing}
          config={config}
          onClose={() => setViewing(null)}
        />
      )}

      <PageShell maxWidth="lg">
        {/* Back nav */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/chinese-themes")}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Chinese Themes
          </button>
        </div>

        {/* Category header */}
        <div className="flex items-center gap-4 mb-8">
          {Icon && catMeta && (
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br",
              catMeta.gradient
            )}>
              <Icon className={cn("w-7 h-7", catMeta.iconColor)} />
            </div>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground leading-tight">
              {categoryName}
            </h1>
            {catMeta && (
              <p className="text-sm text-muted-foreground mt-1">{catMeta.description}</p>
            )}
          </div>
        </div>

        {/* Loading */}
        {productsLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty state */}
        {!productsLoading && products.length === 0 && (
          <div className="text-center py-20 bg-card border border-border/60 rounded-3xl">
            <div className="text-4xl font-serif mb-4">美</div>
            <h2 className="text-base font-bold text-foreground mb-2">Coming Soon</h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              {categoryName} are being prepared. Check back soon — new content drops regularly for premium members.
            </p>
          </div>
        )}

        {/* Product grid — aspect ratio adapts per category */}
        {!productsLoading && products.length > 0 && (
          <div className={cn("grid gap-4", config.gridCols)}>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                config={config}
                onView={() => setViewing(product)}
              />
            ))}
          </div>
        )}
      </PageShell>
    </>
  );
}

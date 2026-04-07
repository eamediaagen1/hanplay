import { useQuery } from "@tanstack/react-query";

export interface BrandAsset {
  id: string;
  asset_type: "logo" | "favicon";
  variant: "default" | "light" | "dark";
  file_url: string;
  width: number | null;
  height: number | null;
}

async function fetchBranding(): Promise<BrandAsset[]> {
  const res = await fetch("/api/branding");
  if (!res.ok) return [];
  return res.json() as Promise<BrandAsset[]>;
}

export function useBranding() {
  return useQuery<BrandAsset[]>({
    queryKey: ["branding"],
    queryFn: fetchBranding,
    staleTime: 5 * 60 * 1000, // 5 minutes — brand assets rarely change
    retry: false,
  });
}

/**
 * Pick the best logo URL for a given background context.
 * - dark background → use 'light' variant (light-coloured logo)
 * - light background → use 'dark' variant (dark-coloured logo)
 * - fallback → 'default'
 */
export function pickLogo(
  assets: BrandAsset[] | undefined,
  context: "dark" | "light" | "default" = "default"
): string | null {
  if (!assets || assets.length === 0) return null;
  const logos = assets.filter((a) => a.asset_type === "logo");
  const preferred = logos.find((a) => a.variant === context);
  if (preferred) return preferred.file_url;
  const fallback = logos.find((a) => a.variant === "default");
  return fallback?.file_url ?? null;
}

export function pickFavicon(
  assets: BrandAsset[] | undefined,
  context: "dark" | "light" | "default" = "default"
): string | null {
  if (!assets || assets.length === 0) return null;
  const favicons = assets.filter((a) => a.asset_type === "favicon");
  const preferred = favicons.find((a) => a.variant === context);
  if (preferred) return preferred.file_url;
  const fallback = favicons.find((a) => a.variant === "default");
  return fallback?.file_url ?? null;
}

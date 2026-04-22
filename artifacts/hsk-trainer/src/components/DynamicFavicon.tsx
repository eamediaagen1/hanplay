import { useEffect } from "react";
import { useBranding, pickFavicon } from "@/hooks/use-branding";
import { useTheme } from "@/hooks/use-theme";

/**
 * Swaps the document favicon to the admin-uploaded one (if available).
 * Falls back to the static /favicon.svg gracefully.
 * Place this once inside QueryClientProvider.
 */
export function DynamicFavicon() {
  const { data: brandAssets } = useBranding();
  const { theme } = useTheme();

  useEffect(() => {
    const context = theme === "dark" ? "dark" : "light";
    const faviconUrl =
      pickFavicon(brandAssets, context) ??
      pickFavicon(brandAssets, "default");

    if (!faviconUrl) return; // no uploaded favicon — keep the static one

    const existing = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (existing) {
      existing.href = faviconUrl;
    } else {
      const link = document.createElement("link");
      link.rel = "icon";
      link.href = faviconUrl;
      document.head.appendChild(link);
    }
  }, [brandAssets, theme]);

  return null;
}

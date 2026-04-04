/**
 * Gumroad URL utilities
 *
 * Gumroad passes any extra query params from the checkout URL back in the
 * webhook payload as `url_params` (JSON-encoded).  We use ?ref=CODE to carry
 * the referral code through the checkout and attribute the purchase.
 */

const BASE_URL =
  (import.meta.env.VITE_GUMROAD_URL as string | undefined) ?? "https://gumroad.com";

/**
 * Build the Gumroad checkout URL, optionally appending a referral code.
 * Pass `referralCode` when the current visitor arrived via someone's referral
 * link — this ensures the purchase is attributed to the referrer.
 */
export function buildGumroadUrl(referralCode?: string | null): string {
  if (!referralCode) return BASE_URL;
  const sep = BASE_URL.includes("?") ? "&" : "?";
  return `${BASE_URL}${sep}ref=${encodeURIComponent(referralCode)}`;
}

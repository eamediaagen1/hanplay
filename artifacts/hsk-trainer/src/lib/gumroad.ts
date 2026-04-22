/**
 * Gumroad URL utilities
 *
 * Gumroad passes any extra query params from the checkout URL back in the
 * webhook payload as `url_params` (JSON-encoded).  We use:
 *   ?member=USER_ID  — Supabase user ID for direct premium attribution in webhook
 *   ?ref=CODE        — referral code for affiliate attribution
 */

const BASE_URL =
  (import.meta.env.VITE_GUMROAD_URL as string | undefined) ??
  "https://hanplay.gumroad.com/l/hanplay-premium";

/**
 * Build the Gumroad checkout URL.
 *
 * @param userId       Logged-in Supabase user ID (passed as `member` for webhook attribution)
 * @param referralCode Affiliate referral code (passed as `ref`)
 */
export function buildGumroadUrl(
  userId?: string | null,
  referralCode?: string | null
): string {
  const url = new URL(BASE_URL);
  // wanted=true sends buyers directly to checkout (skips the product page)
  url.searchParams.set("wanted", "true");
  if (userId) url.searchParams.set("member", userId);
  if (referralCode) url.searchParams.set("ref", referralCode);
  return url.toString();
}

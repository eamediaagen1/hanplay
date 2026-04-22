/**
 * Referral capture utilities
 *
 * When a visitor arrives with ?ref=CODE in the URL we store the code in
 * localStorage so it survives navigation to the Gumroad checkout.
 * The code is then appended to the Gumroad checkout URL so Gumroad echoes
 * it back in the webhook payload, where we record the purchase-based referral.
 */

const STORAGE_KEY = "hsk_ref";
const CODE_RE = /^[A-Z0-9]{4,16}$/;

/** Read ?ref= from the current URL and persist it if valid. */
export function captureReferralCode(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref && CODE_RE.test(ref.toUpperCase())) {
      localStorage.setItem(STORAGE_KEY, ref.toUpperCase());
    }
  } catch {
    // localStorage unavailable or invalid URL — ignore
  }
}

/** Return the referral code stored from a previous ?ref= visit, or null. */
export function getStoredReferralCode(): string | null {
  try {
    const code = localStorage.getItem(STORAGE_KEY);
    return code && CODE_RE.test(code) ? code : null;
  } catch {
    return null;
  }
}

/** Clear the stored referral code (e.g. after purchase confirmation). */
export function clearStoredReferralCode(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

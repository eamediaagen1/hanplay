/**
 * Shared Gumroad API utilities for the backend.
 *
 * GUMROAD_ACCESS_TOKEN is a personal access token generated from your Gumroad
 * account at:  https://app.gumroad.com/settings/advanced → "Generate token"
 *
 * It is NOT the same as the OAuth App ID or Application ID.
 * It is purely optional for /v2/licenses/verify (a public endpoint), but
 * including it as a Bearer token attaches your identity to the request and
 * may help avoid anonymous rate-limits as your volume grows.
 *
 * NEVER log, print, or expose this value.
 */

/**
 * Returns headers for Gumroad API calls.
 * Always sets Content-Type.
 * Adds Authorization only when GUMROAD_ACCESS_TOKEN is present in the env.
 */
export function gumroadHeaders(): Record<string, string> {
  const token = process.env.GUMROAD_ACCESS_TOKEN;
  return {
    "Content-Type": "application/x-www-form-urlencoded",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  };
}

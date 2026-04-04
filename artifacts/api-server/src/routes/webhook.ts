import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { webhookLimiter } from "../middleware/rate-limit.js";

const router = Router();

const WEBHOOK_SECRET = process.env.GUMROAD_WEBHOOK_SECRET;
const PRODUCT_PERMALINK = process.env.GUMROAD_PRODUCT_PERMALINK;

/**
 * POST /api/gumroad/webhook
 *
 * Receives Gumroad Ping notifications for sale and refund events.
 * Gumroad sends application/x-www-form-urlencoded with fields including:
 *   sale_id, product_permalink, email, price, refunded, url_params, ...
 *
 * Referral attribution: when a buyer arrives via a referral link
 * (?ref=CODE appended to the Gumroad checkout URL), Gumroad echoes the
 * URL params back in the `url_params` field of the webhook payload.
 * We parse the `ref` value and record a purchase-attributed referral.
 */
router.post("/gumroad/webhook", webhookLimiter, async (req, res) => {
  // 1. Validate webhook secret
  if (!WEBHOOK_SECRET) {
    res.status(503).json({ error: "Webhook secret not configured" });
    return;
  }
  if (req.query.secret !== WEBHOOK_SECRET) {
    res.status(403).json({ error: "Invalid webhook secret" });
    return;
  }

  const body = req.body as Record<string, string>;
  const { sale_id, product_permalink, email, price, refunded } = body;

  // 2. Validate required fields
  if (!sale_id || !email) {
    res.status(400).json({ error: "Missing required fields: sale_id, email" });
    return;
  }

  // 3. Validate product (skip if no permalink configured)
  if (PRODUCT_PERMALINK && product_permalink !== PRODUCT_PERMALINK) {
    res.json({ status: "ignored", reason: "unknown_product" });
    return;
  }

  // 4. Extract referral code from Gumroad's url_params echo
  // Gumroad passes back query params from the checkout URL as url_params (JSON object)
  const refCode = extractRefCode(body);

  const isRefunded = refunded === "true";
  const buyerEmail = email.toLowerCase().trim();

  // 5. Idempotency — check if we've already processed this sale_id
  const { data: existing } = await supabaseAdmin
    .from("purchases")
    .select("id, refunded")
    .eq("sale_id", sale_id)
    .maybeSingle();

  if (existing) {
    if (existing.refunded !== isRefunded) {
      await supabaseAdmin
        .from("purchases")
        .update({ refunded: isRefunded, updated_at: new Date().toISOString() })
        .eq("sale_id", sale_id);
      if (isRefunded) {
        await revokePremiumByEmail(buyerEmail);
      }
    }
    res.json({ status: "updated" });
    return;
  }

  // 6. Insert new purchase record
  const { error: insertError } = await supabaseAdmin.from("purchases").insert({
    sale_id,
    buyer_email: buyerEmail,
    product_permalink: product_permalink ?? "",
    price_cents: price ? Math.round(parseFloat(price) * 100) : 0,
    refunded: isRefunded,
    raw_payload: req.body,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      res.json({ status: "already_processed" });
      return;
    }
    res.status(500).json({ error: "Failed to save purchase" });
    return;
  }

  // 7. Grant premium + credit referral if not a refund
  if (!isRefunded) {
    await grantPremiumByEmail(buyerEmail, sale_id);
    if (refCode) {
      await creditReferral(sale_id, buyerEmail, refCode);
    }
  }

  res.json({ status: "ok" });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CODE_RE = /^[A-Z0-9]{4,16}$/;

/**
 * Extract the referral code from the Gumroad webhook payload.
 *
 * Gumroad echoes URL query params back in two ways:
 *   1. `url_params` field — JSON-encoded object of the checkout URL's query params
 *   2. Direct field — some older Gumroad versions pass params as top-level fields
 *
 * We look for a `ref` key in both places.
 */
function extractRefCode(body: Record<string, string>): string | null {
  // Method 1: url_params JSON object (current Gumroad format)
  if (body.url_params) {
    try {
      const parsed = JSON.parse(body.url_params) as Record<string, string>;
      const code = parsed.ref ?? null;
      if (code && CODE_RE.test(code.toUpperCase())) return code.toUpperCase();
    } catch {
      // url_params may be URL-encoded string instead
      try {
        const params = new URLSearchParams(body.url_params);
        const code = params.get("ref");
        if (code && CODE_RE.test(code.toUpperCase())) return code.toUpperCase();
      } catch {
        // ignore
      }
    }
  }

  // Method 2: direct top-level field
  if (body.ref && CODE_RE.test((body.ref as string).toUpperCase())) {
    return (body.ref as string).toUpperCase();
  }

  return null;
}

async function findProfileByEmail(email: string) {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id, email")
    .eq("email", email)
    .maybeSingle();
  return data;
}

async function grantPremiumByEmail(email: string, saleId: string) {
  const profile = await findProfileByEmail(email);
  if (!profile) return; // User hasn't signed up yet — premium picked up via /api/premium/sync

  await supabaseAdmin
    .from("profiles")
    .update({
      is_premium: true,
      premium_source: "gumroad",
      premium_granted_at: new Date().toISOString(),
      gumroad_email: email,
    })
    .eq("id", profile.id);

  await supabaseAdmin
    .from("purchases")
    .update({ user_id: profile.id })
    .eq("sale_id", saleId);
}

async function revokePremiumByEmail(email: string) {
  const profile = await findProfileByEmail(email);
  if (!profile) return;

  await supabaseAdmin
    .from("profiles")
    .update({ is_premium: false, premium_source: null, premium_granted_at: null })
    .eq("id", profile.id);
}

/**
 * Record a purchase-attributed referral.
 * Guards against: unknown codes, self-referral, duplicate credits per sale.
 */
async function creditReferral(saleId: string, buyerEmail: string, refCode: string) {
  // Look up the referrer by code
  const { data: referrer } = await supabaseAdmin
    .from("profiles")
    .select("id, email")
    .eq("referral_code", refCode)
    .maybeSingle();

  if (!referrer) return; // Unknown referral code

  // Prevent self-referral
  if (referrer.email.toLowerCase() === buyerEmail.toLowerCase()) return;

  // Prevent duplicate credit (sale_id UNIQUE constraint also guards this)
  const { data: dup } = await supabaseAdmin
    .from("referrals")
    .select("id")
    .eq("sale_id", saleId)
    .maybeSingle();
  if (dup) return;

  // Find referred user profile (if they have an account)
  const { data: referredProfile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("email", buyerEmail)
    .maybeSingle();

  await supabaseAdmin.from("referrals").insert({
    referral_code: refCode,
    referrer_id: referrer.id,
    buyer_email: buyerEmail,
    referred_id: referredProfile?.id ?? null,
    sale_id: saleId,
    status: "purchased",
  });
}

export default router;

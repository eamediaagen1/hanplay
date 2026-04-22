import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { webhookLimiter } from "../middleware/rate-limit.js";

// ─── SETUP REQUIRED ───────────────────────────────────────────────────────────
//
// Before this webhook can accept requests, add the following Replit Secrets:
//
//   GUMROAD_WEBHOOK_SECRET   — A strong random string you choose.
//                              Generate one with:  openssl rand -hex 32
//                              Set this same value in Gumroad as part of the URL.
//
//   GUMROAD_PRODUCT_PERMALINK — Your product's URL slug (e.g. "hanplay-premium")
//
//   GUMROAD_PRODUCT_ID        — Same value as permalink (Gumroad's license verify
//                               API calls this "product_id" but means the slug)
//
// In Gumroad → Settings → Advanced → "Ping a URL", paste:
//
//   https://YOUR-APP.replit.app/api/gumroad/webhook?secret=YOUR_SECRET_VALUE
//
// No secret is ever hardcoded in this file.  All values are read from env only.
//
// ─────────────────────────────────────────────────────────────────────────────

const router = Router();

// Read all secrets from environment — never hardcoded
const WEBHOOK_SECRET   = process.env.GUMROAD_WEBHOOK_SECRET;
const PRODUCT_PERMALINK = process.env.GUMROAD_PRODUCT_PERMALINK;
const GUMROAD_PRODUCT_ID = process.env.GUMROAD_PRODUCT_ID;

/**
 * POST /api/gumroad/webhook
 *
 * Receives Gumroad Ping notifications for sale and refund events.
 * Gumroad sends application/x-www-form-urlencoded with fields including:
 *   sale_id, product_permalink, email, price, license_key, member, refunded
 *
 * Security:
 *   The ?secret= query param is compared to GUMROAD_WEBHOOK_SECRET (env only).
 *   Requests with a missing or incorrect secret are rejected with HTTP 403.
 *
 * Attribution:
 *   The `member` field carries the Supabase user_id passed via the checkout URL
 *   as ?member=USER_ID.  When present, premium is granted directly to that user
 *   without requiring an email match.
 *
 * Premium model: 1-year access per purchase.
 *   - First purchase:  starts_at = now,             expires_at = now + 1 year
 *   - Renewal:         starts_at = max(expiry, now), expires_at = starts_at + 1 year
 */
router.post("/gumroad/webhook", webhookLimiter, async (req, res) => {
  // ── 1. Secret validation ───────────────────────────────────────────────────
  // GUMROAD_WEBHOOK_SECRET must be set as a Replit Secret.
  // If it's missing entirely, refuse all traffic (misconfiguration guard).
  if (!WEBHOOK_SECRET) {
    res.status(503).json({ error: "Webhook not configured — GUMROAD_WEBHOOK_SECRET is missing" });
    return;
  }
  // The secret is passed as ?secret= in the URL you pasted into Gumroad.
  // Any request with the wrong or absent secret is rejected immediately.
  if (req.query.secret !== WEBHOOK_SECRET) {
    res.status(403).json({ error: "Invalid webhook secret" });
    return;
  }

  const body = req.body as Record<string, string>;
  const {
    sale_id,
    product_permalink,
    email,
    price,
    refunded,
    license_key: rawLicenseKey,
    member: rawMember,
  } = body;

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

  // 4. Parse fields
  const isRefunded = refunded === "true";
  const buyerEmail = email.toLowerCase().trim();
  const licenseKey = rawLicenseKey?.trim().toLowerCase() || null;
  const memberId = rawMember?.trim() || null; // Supabase user_id if logged-in buyer

  // 5. Extract referral code from Gumroad's url_params echo
  const refCode = extractRefCode(body);

  // 6. Idempotency — check if we've already processed this sale_id
  const { data: existingPurchase } = await supabaseAdmin
    .from("purchases")
    .select("id, refunded, user_id")
    .eq("sale_id", sale_id)
    .maybeSingle();

  if (existingPurchase) {
    // Update refund status if it changed
    if (existingPurchase.refunded !== isRefunded) {
      await supabaseAdmin
        .from("purchases")
        .update({ refunded: isRefunded, updated_at: new Date().toISOString() })
        .eq("sale_id", sale_id);

      if (isRefunded) {
        await revokePremium(existingPurchase.user_id, buyerEmail);
      }
    }
    res.json({ status: "updated" });
    return;
  }

  // 7. Resolve the Supabase user
  // Priority: (a) memberId from URL param, (b) email lookup, (c) no user yet
  let userId: string | null = null;

  if (memberId) {
    // Validate memberId is a real user
    const { data: memberUser } = await supabaseAdmin.auth.admin.getUserById(memberId);
    if (memberUser?.user) userId = memberUser.user.id;
  }

  if (!userId) {
    const profile = await findProfileByEmail(buyerEmail);
    userId = profile?.id ?? null;
  }

  // 8. Insert purchase record
  const { error: insertError } = await supabaseAdmin.from("purchases").insert({
    sale_id,
    buyer_email: buyerEmail,
    product_permalink: product_permalink ?? "",
    price_cents: price ? Math.round(parseFloat(price) * 100) : 0,
    refunded: isRefunded,
    raw_payload: body,
    license_key: licenseKey,
    user_id: userId,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      res.json({ status: "already_processed" });
      return;
    }
    res.status(500).json({ error: "Failed to save purchase" });
    return;
  }

  // 9. Grant premium (if not a refund)
  if (!isRefunded) {
    if (userId && licenseKey) {
      await grantPremiumAccess(userId, licenseKey, sale_id, buyerEmail, product_permalink ?? "");
    } else if (userId) {
      // No license key — grant via profile update only
      await grantLegacyPremiumByUserId(userId, buyerEmail);
    }
    // If no userId: user hasn't signed up yet — grant picked up via /api/premium/sync or restore
    if (refCode && userId) {
      await creditReferral(sale_id, buyerEmail, refCode, userId);
    }
  }

  res.json({ status: "ok" });
});

// ─── Premium grant (primary: writes to premium_access + profiles) ─────────────

async function grantPremiumAccess(
  userId: string,
  licenseKey: string,
  saleId: string,
  buyerEmail: string,
  productPermalink: string
) {
  // Check if user already has a premium_access row (renewal case)
  const { data: existing } = await supabaseAdmin
    .from("premium_access")
    .select("id, expires_at, status")
    .eq("user_id", userId)
    .maybeSingle();

  const now = new Date();

  let startsAt: Date;
  if (existing && new Date(existing.expires_at) > now) {
    // Renewal: stack on top of current expiry
    startsAt = new Date(existing.expires_at);
  } else {
    // New or expired: start from now
    startsAt = now;
  }

  const expiresAt = new Date(startsAt.getTime() + 365 * 24 * 60 * 60 * 1000);

  if (existing) {
    await supabaseAdmin
      .from("premium_access")
      .update({
        status: "active",
        license_key: licenseKey,
        gumroad_sale_id: saleId,
        buyer_email: buyerEmail,
        expires_at: expiresAt.toISOString(),
      })
      .eq("user_id", userId);
  } else {
    await supabaseAdmin.from("premium_access").upsert({
      user_id: userId,
      license_key: licenseKey,
      gumroad_product_id: GUMROAD_PRODUCT_ID ?? productPermalink,
      gumroad_sale_id: saleId,
      buyer_email: buyerEmail,
      status: "active",
      starts_at: startsAt.toISOString(),
      expires_at: expiresAt.toISOString(),
    }, { onConflict: "user_id" });
  }

  // Always sync profiles.is_premium as the fast-path check
  await supabaseAdmin.from("profiles").update({
    is_premium: true,
    premium_source: "gumroad",
    premium_granted_at: startsAt.toISOString(),
    gumroad_email: buyerEmail,
  }).eq("id", userId);
}

async function grantLegacyPremiumByUserId(userId: string, buyerEmail: string) {
  await supabaseAdmin.from("profiles").update({
    is_premium: true,
    premium_source: "gumroad",
    premium_granted_at: new Date().toISOString(),
    gumroad_email: buyerEmail,
  }).eq("id", userId);
}

// ─── Premium revoke ───────────────────────────────────────────────────────────

async function revokePremium(userId: string | null, buyerEmail: string) {
  if (userId) {
    await supabaseAdmin
      .from("premium_access")
      .update({ status: "revoked" })
      .eq("user_id", userId);

    await supabaseAdmin
      .from("profiles")
      .update({ is_premium: false, premium_source: null, premium_granted_at: null })
      .eq("id", userId);
  } else {
    // Fallback: look up by email
    const profile = await findProfileByEmail(buyerEmail);
    if (profile) {
      await supabaseAdmin
        .from("premium_access")
        .update({ status: "revoked" })
        .eq("user_id", profile.id);

      await supabaseAdmin
        .from("profiles")
        .update({ is_premium: false, premium_source: null, premium_granted_at: null })
        .eq("id", profile.id);
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CODE_RE = /^[A-Z0-9]{4,16}$/;

function extractRefCode(body: Record<string, string>): string | null {
  if (body.url_params) {
    try {
      const parsed = JSON.parse(body.url_params) as Record<string, string>;
      const code = parsed.ref ?? null;
      if (code && CODE_RE.test(code.toUpperCase())) return code.toUpperCase();
    } catch {
      try {
        const params = new URLSearchParams(body.url_params);
        const code = params.get("ref");
        if (code && CODE_RE.test(code.toUpperCase())) return code.toUpperCase();
      } catch { /* ignore */ }
    }
  }
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

async function creditReferral(saleId: string, buyerEmail: string, refCode: string, buyerUserId: string | null) {
  const { data: referrer } = await supabaseAdmin
    .from("profiles")
    .select("id, email")
    .eq("referral_code", refCode)
    .maybeSingle();

  if (!referrer) return;
  if (referrer.email.toLowerCase() === buyerEmail.toLowerCase()) return;
  if (buyerUserId && referrer.id === buyerUserId) return;

  const { data: dup } = await supabaseAdmin
    .from("referrals")
    .select("id")
    .eq("sale_id", saleId)
    .maybeSingle();
  if (dup) return;

  await supabaseAdmin.from("referrals").insert({
    referral_code: refCode,
    referrer_id: referrer.id,
    buyer_email: buyerEmail,
    referred_id: buyerUserId,
    sale_id: saleId,
    status: "purchased",
  });
}

export default router;

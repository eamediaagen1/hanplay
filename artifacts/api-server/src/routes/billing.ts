import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { gumroadHeaders } from "../lib/gumroad.js";

const router = Router();

// ─── GET /api/billing/status ──────────────────────────────────────────────────
// Returns the premium_access row for the current user, or null if not found.
// The caller can use expires_at + status to determine real premium eligibility.
router.get("/billing/status", requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("premium_access")
    .select("id, status, starts_at, expires_at, buyer_email, gumroad_sale_id, created_at, updated_at")
    .eq("user_id", req.user!.id)
    .maybeSingle();

  if (error) {
    res.status(500).json({ error: "Failed to load billing status" });
    return;
  }

  if (!data) {
    res.json({ premium: false, subscription: null });
    return;
  }

  const now = new Date();
  const isActive = data.status === "active" && new Date(data.expires_at) > now;

  res.json({
    premium: isActive,
    subscription: {
      ...data,
      is_active: isActive,
    },
  });
});

// ─── POST /api/premium/restore ────────────────────────────────────────────────
// Allows a user to manually paste their Gumroad license key to activate / extend
// their premium access.  This is the backup flow for when the webhook missed them.
//
// Security:
// - Requires authentication — no anonymous activations
// - Verifies the key with the Gumroad API
// - Rejects keys already claimed by a DIFFERENT user
// - Writes to both premium_access and profiles (keeps both in sync)
// - Idempotent — safe to call again if already active
router.post("/premium/restore", requireAuth, async (req, res) => {
  const { license_key } = req.body as { license_key?: unknown };
  if (!license_key || typeof license_key !== "string" || !license_key.trim()) {
    res.status(400).json({ error: "License key is required." });
    return;
  }
  const key = license_key.trim().toLowerCase();

  const GUMROAD_PRODUCT_ID = process.env.GUMROAD_PRODUCT_ID;
  if (!GUMROAD_PRODUCT_ID) {
    res.status(503).json({ error: "Product not configured. Contact support." });
    return;
  }

  // ── 1. Check if this key is already in our premium_access table ──────────────
  const { data: existing } = await supabaseAdmin
    .from("premium_access")
    .select("id, user_id, status, expires_at")
    .eq("license_key", key)
    .maybeSingle();

  if (existing) {
    if (existing.user_id !== req.user!.id) {
      res.status(409).json({ error: "This license key is already linked to another account." });
      return;
    }
    // Same user — extend if it's expiring
    const now = new Date();
    const currentExpiry = new Date(existing.expires_at);
    const startsAt = currentExpiry > now ? currentExpiry : now;
    const expiresAt = new Date(startsAt.getTime() + 365 * 24 * 60 * 60 * 1000);

    await supabaseAdmin
      .from("premium_access")
      .update({ status: "active", expires_at: expiresAt.toISOString() })
      .eq("id", existing.id);

    await syncProfilePremium(req.user!.id);

    res.json({
      success: true,
      message: "Access extended. Your Hanplay Premium now runs through " + formatExpiry(expiresAt) + ".",
      expires_at: expiresAt.toISOString(),
    });
    return;
  }

  // ── 2. Verify with Gumroad API ───────────────────────────────────────────────
  let gumroadPurchase: Record<string, string> | null = null;
  try {
    const gRes = await fetch("https://api.gumroad.com/v2/licenses/verify", {
      method: "POST",
      headers: gumroadHeaders(),
      body: new URLSearchParams({
        product_id: GUMROAD_PRODUCT_ID,
        license_key: key,
        increment_uses_count: "false",
      }),
    });
    const gData = await gRes.json() as { success?: boolean; purchase?: Record<string, string>; message?: string };
    if (gData.success && gData.purchase) {
      gumroadPurchase = gData.purchase;
    }
  } catch {
    res.status(502).json({ error: "Could not reach Gumroad to verify this key. Please try again shortly." });
    return;
  }

  if (!gumroadPurchase) {
    res.status(400).json({ error: "Invalid license key. Double-check the key from your Gumroad email." });
    return;
  }

  const buyerEmail = gumroadPurchase.email?.toLowerCase().trim() ?? null;
  const saleId = gumroadPurchase.sale_id ?? null;

  // ── 3. Idempotency — check if sale_id already used by another user ───────────
  if (saleId) {
    const { data: saleExists } = await supabaseAdmin
      .from("premium_access")
      .select("id, user_id")
      .eq("gumroad_sale_id", saleId)
      .maybeSingle();

    if (saleExists && saleExists.user_id !== req.user!.id) {
      res.status(409).json({ error: "This license key is already linked to another account." });
      return;
    }
  }

  // ── 4. Create premium_access row ─────────────────────────────────────────────
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  const { error: insertError } = await supabaseAdmin.from("premium_access").upsert({
    user_id: req.user!.id,
    license_key: key,
    gumroad_product_id: GUMROAD_PRODUCT_ID,
    gumroad_sale_id: saleId,
    buyer_email: buyerEmail,
    status: "active",
    starts_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  }, { onConflict: "user_id" });

  if (insertError) {
    res.status(500).json({ error: "Failed to activate license. Please contact support." });
    return;
  }

  // ── 5. Sync profiles.is_premium ──────────────────────────────────────────────
  await syncProfilePremium(req.user!.id, buyerEmail);

  // ── 6. Record in legacy purchases table for admin visibility ─────────────────
  if (saleId) {
    await supabaseAdmin.from("purchases").upsert({
      sale_id: saleId,
      license_key: key,
      buyer_email: buyerEmail ?? "",
      product_permalink: GUMROAD_PRODUCT_ID,
      price_cents: gumroadPurchase.price ? Math.round(parseFloat(gumroadPurchase.price) * 100) : 999,
      refunded: false,
      user_id: req.user!.id,
    }, { onConflict: "sale_id" });
  }

  res.json({
    success: true,
    message: "You're all set. Your Hanplay Premium access runs through " + formatExpiry(expiresAt) + ".",
    expires_at: expiresAt.toISOString(),
  });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function syncProfilePremium(userId: string, gumroadEmail?: string | null) {
  await supabaseAdmin
    .from("profiles")
    .update({
      is_premium: true,
      premium_source: "gumroad",
      premium_granted_at: new Date().toISOString(),
      ...(gumroadEmail ? { gumroad_email: gumroadEmail } : {}),
    })
    .eq("id", userId);
}

function formatExpiry(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default router;

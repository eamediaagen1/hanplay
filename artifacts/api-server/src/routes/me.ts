import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { syncLimiter, activateLimiter } from "../middleware/rate-limit.js";
import { gumroadHeaders } from "../lib/gumroad.js";

const router = Router();

// ─── GET /api/me ──────────────────────────────────────────────────────────────

router.get("/me", requireAuth, async (req, res) => {
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("id, email, name, is_premium, premium_source, premium_granted_at, role, created_at")
    .eq("id", req.user!.id)
    .single();

  if (error || !profile) {
    const { data: newProfile, error: insertError } = await supabaseAdmin
      .from("profiles")
      .insert({ id: req.user!.id, email: req.user!.email })
      .select("id, email, name, is_premium, premium_source, premium_granted_at, role, created_at")
      .single();

    if (insertError) {
      res.status(500).json({ error: "Failed to load profile" });
      return;
    }
    res.json(newProfile);
    return;
  }

  res.json(profile);
});

// ─── PATCH /api/me ────────────────────────────────────────────────────────────

router.patch("/me", requireAuth, async (req, res) => {
  const { name } = req.body as { name?: unknown };
  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const safeName = name.trim().slice(0, 60);

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ name: safeName })
    .eq("id", req.user!.id);

  if (error) {
    res.status(500).json({ error: "Failed to update profile" });
    return;
  }

  res.json({ success: true, name: safeName });
});

// ─── POST /api/premium/sync ───────────────────────────────────────────────────
// Checks if a Gumroad purchase exists for this user's email and grants/extends
// premium access if found.  Also writes to the premium_access table if possible.

router.post("/premium/sync", requireAuth, syncLimiter, async (req, res) => {
  const userEmail = req.user!.email.toLowerCase().trim();

  const { data: purchase } = await supabaseAdmin
    .from("purchases")
    .select("id, refunded, license_key")
    .eq("buyer_email", userEmail)
    .eq("refunded", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!purchase) {
    res.json({
      is_premium: false,
      message: "No purchase found for this email. You can buy below, or use a license key if you paid with a different address.",
    });
    return;
  }

  // Grant / extend premium (writes to premium_access + profiles)
  await grantOrExtendPremium(
    req.user!.id,
    purchase.license_key ?? `sync-${Date.now()}`,
    null,
    userEmail
  );

  await supabaseAdmin
    .from("purchases")
    .update({ user_id: req.user!.id })
    .eq("id", purchase.id);

  res.json({ is_premium: true, message: "Access activated. All 6 HSK levels are now unlocked." });
});

// ─── POST /api/premium/activate ───────────────────────────────────────────────
// Legacy endpoint — still used by MembershipPage.
// Accepts a license key from purchases table or verifies live with Gumroad API.

router.post("/premium/activate", requireAuth, activateLimiter, async (req, res) => {
  const { license_key } = req.body as { license_key?: unknown };
  if (!license_key || typeof license_key !== "string" || !license_key.trim()) {
    res.status(400).json({ error: "License key is required." });
    return;
  }
  const key = license_key.trim().toLowerCase();

  // 1. Check our purchases table first (most common path)
  const { data: purchase } = await supabaseAdmin
    .from("purchases")
    .select("id, refunded, user_id, buyer_email")
    .eq("license_key", key)
    .maybeSingle();

  if (purchase) {
    if (purchase.refunded) {
      res.status(400).json({ error: "This license key has been refunded and is no longer valid." });
      return;
    }
    if (purchase.user_id && purchase.user_id !== req.user!.id) {
      res.status(409).json({ error: "This license key is already linked to another account." });
      return;
    }

    const expiresAt = await grantOrExtendPremium(
      req.user!.id,
      key,
      null,
      purchase.buyer_email
    );

    await supabaseAdmin
      .from("purchases")
      .update({ user_id: req.user!.id })
      .eq("id", purchase.id);

    res.json({
      success: true,
      message: `License activated! Premium access runs through ${formatExpiry(expiresAt)}.`,
      expires_at: expiresAt.toISOString(),
    });
    return;
  }

  // 2. Verify live with Gumroad API
  const GUMROAD_PRODUCT_ID = process.env.GUMROAD_PRODUCT_ID;
  if (!GUMROAD_PRODUCT_ID) {
    res.status(400).json({ error: "License key not found. Check the key from your Gumroad email." });
    return;
  }

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

    if (!gData.success || !gData.purchase) {
      res.status(400).json({ error: "Invalid license key. Double-check the key from your Gumroad email." });
      return;
    }

    const gPurchase = gData.purchase;
    const buyerEmail = gPurchase.email?.toLowerCase().trim() ?? null;
    const saleId = gPurchase.sale_id ?? null;

    // Guard: reject if this sale_id is already linked to another user
    if (saleId) {
      const { data: existingSale } = await supabaseAdmin
        .from("premium_access")
        .select("user_id")
        .eq("gumroad_sale_id", saleId)
        .maybeSingle();

      if (existingSale && existingSale.user_id !== req.user!.id) {
        res.status(409).json({ error: "This license key is already linked to another account." });
        return;
      }
    }

    const expiresAt = await grantOrExtendPremium(req.user!.id, key, saleId, buyerEmail);

    if (saleId) {
      await supabaseAdmin.from("purchases").upsert({
        sale_id: saleId,
        license_key: key,
        buyer_email: buyerEmail ?? "",
        product_permalink: GUMROAD_PRODUCT_ID,
        price_cents: gPurchase.price ? Math.round(parseFloat(gPurchase.price) * 100) : 999,
        refunded: false,
        user_id: req.user!.id,
      }, { onConflict: "sale_id" });
    }

    res.json({
      success: true,
      message: `License activated! Premium access runs through ${formatExpiry(expiresAt)}.`,
      expires_at: expiresAt.toISOString(),
    });
  } catch {
    res.status(502).json({ error: "Could not reach Gumroad to verify this key. Try again shortly." });
  }
});

// ─── DELETE /api/account ──────────────────────────────────────────────────────

router.delete("/account", requireAuth, async (req, res) => {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(req.user!.id);
  if (error) {
    res.status(500).json({ error: "Failed to delete account" });
    return;
  }
  res.json({ success: true });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Creates or extends a premium_access row and syncs profiles.is_premium.
 * Returns the final expires_at Date.
 */
async function grantOrExtendPremium(
  userId: string,
  licenseKey: string,
  saleId: string | null,
  buyerEmail: string | null
): Promise<Date> {
  const { data: existing } = await supabaseAdmin
    .from("premium_access")
    .select("id, expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  const now = new Date();
  const startsAt =
    existing && new Date(existing.expires_at) > now
      ? new Date(existing.expires_at)
      : now;

  const expiresAt = new Date(startsAt.getTime() + 365 * 24 * 60 * 60 * 1000);

  await supabaseAdmin.from("premium_access").upsert(
    {
      user_id: userId,
      license_key: licenseKey,
      gumroad_sale_id: saleId,
      buyer_email: buyerEmail,
      status: "active",
      starts_at: startsAt.toISOString(),
      expires_at: expiresAt.toISOString(),
    },
    { onConflict: "user_id" }
  );

  await supabaseAdmin.from("profiles").update({
    is_premium: true,
    premium_source: "gumroad",
    premium_granted_at: startsAt.toISOString(),
    ...(buyerEmail ? { gumroad_email: buyerEmail } : {}),
  }).eq("id", userId);

  return expiresAt;
}

function formatExpiry(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default router;

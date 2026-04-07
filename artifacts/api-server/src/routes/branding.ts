import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { logger } from "../lib/logger.js";

const router = Router();
const BRAND_BUCKET = "brand-assets";

// ─── PUBLIC: GET /branding ────────────────────────────────────────────────────
// Returns all active brand assets (logo + favicon, all variants).
// No auth required — needed by app shell and public pages.

router.get("/branding", async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from("brand_assets")
    .select("id, asset_type, variant, file_url, width, height")
    .eq("is_active", true);

  if (error) {
    // Gracefully return empty if table not yet created (migration pending)
    const isTableMissing =
      error.code === "42P01" ||
      error.code === "PGRST205" ||
      (error.message ?? "").toLowerCase().includes("does not exist") ||
      (error.message ?? "").toLowerCase().includes("schema cache");

    if (isTableMissing) {
      res.json([]);
      return;
    }

    logger.error({ err: error.message }, "Failed to load brand assets");
    res.status(500).json({ error: "Failed to load branding" });
    return;
  }

  res.json(data ?? []);
});

// ─── ADMIN: GET /admin/branding/upload-url ────────────────────────────────────
// Returns a signed upload URL so the admin browser can PUT directly to storage.

router.get(
  "/admin/branding/upload-url",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const { asset_type, variant = "default", filename } = req.query as Record<string, string>;

    if (!asset_type || !filename) {
      res.status(400).json({ error: "asset_type and filename are required" });
      return;
    }
    if (!["logo", "favicon"].includes(asset_type)) {
      res.status(400).json({ error: "asset_type must be logo or favicon" });
      return;
    }
    if (!["default", "light", "dark"].includes(variant)) {
      res.status(400).json({ error: "variant must be default, light, or dark" });
      return;
    }

    const ext = filename.split(".").pop()?.toLowerCase() ?? "png";
    const storagePath = `${asset_type}/${variant}/${Date.now()}.${ext}`;

    const { data, error } = await supabaseAdmin.storage
      .from(BRAND_BUCKET)
      .createSignedUploadUrl(storagePath);

    if (error || !data?.signedUrl) {
      logger.error({ err: error?.message }, "Failed to create signed upload URL for branding");
      res.status(500).json({ error: "Failed to generate upload URL" });
      return;
    }

    res.json({ signedUrl: data.signedUrl, storagePath, token: data.token });
  }
);

// ─── ADMIN: POST /admin/branding ─────────────────────────────────────────────
// Upserts (replace) the active brand asset record after file upload.

router.post("/admin/branding", requireAuth, requireAdmin, async (req, res) => {
  const { asset_type, variant = "default", storage_path, width, height } = req.body as {
    asset_type: string;
    variant?: string;
    storage_path: string;
    width?: number;
    height?: number;
  };

  if (!asset_type || !storage_path) {
    res.status(400).json({ error: "asset_type and storage_path are required" });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? "";
  const file_url = `${supabaseUrl}/storage/v1/object/public/${BRAND_BUCKET}/${storage_path}`;

  // Upsert: replace any existing record for this type+variant
  const { data, error } = await supabaseAdmin
    .from("brand_assets")
    .upsert(
      {
        asset_type,
        variant,
        storage_path,
        file_url,
        width: width ?? null,
        height: height ?? null,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "asset_type,variant" }
    )
    .select()
    .single();

  if (error) {
    logger.error({ err: error.message }, "Failed to save brand asset");
    res.status(500).json({ error: "Failed to save brand asset" });
    return;
  }

  logger.info({ asset_type, variant }, "Brand asset updated");
  res.status(201).json(data);
});

// ─── ADMIN: DELETE /admin/branding/:id ───────────────────────────────────────
// Removes (deactivates) a brand asset.

router.delete(
  "/admin/branding/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from("brand_assets")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      logger.error({ err: error.message, id }, "Failed to delete brand asset");
      res.status(500).json({ error: "Failed to delete asset" });
      return;
    }

    res.json({ success: true });
  }
);

export default router;

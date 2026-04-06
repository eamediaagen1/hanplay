import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { requireAuth, requirePremium, requireAdmin } from "../middleware/auth.js";

const router = Router();

// theme-covers is a PUBLIC bucket — safe to embed directly in <img> tags
const COVERS_BUCKET = "theme-covers";
// theme-assets is a PRIVATE bucket — files accessed via signed URLs only
const FILES_BUCKET = "theme-assets";

// ─── PREMIUM USER ENDPOINTS ────────────────────────────────────────────────

// GET /themes — list all published products (premium required)
router.get("/themes", requireAuth, requirePremium, async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from("theme_products")
    .select("id, title, slug, category, description, cover_image_url, preview_image_url, file_type, download_name, sort_order")
    .eq("is_published", true)
    .order("category")
    .order("sort_order");

  if (error) {
    res.status(500).json({ error: "Failed to load products" });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? "";

  // Convert storage paths → public URLs for covers/previews
  const products = (data ?? []).map((p) => ({
    ...p,
    cover_image_url: p.cover_image_url
      ? `${supabaseUrl}/storage/v1/object/public/${COVERS_BUCKET}/${p.cover_image_url}`
      : null,
    preview_image_url: p.preview_image_url
      ? `${supabaseUrl}/storage/v1/object/public/${COVERS_BUCKET}/${p.preview_image_url}`
      : null,
  }));

  res.json(products);
});

// GET /themes/:id/download — generate signed download URL (premium required)
router.get("/themes/:id/download", requireAuth, requirePremium, async (req, res) => {
  const { id } = req.params;

  const { data: product, error } = await supabaseAdmin
    .from("theme_products")
    .select("file_url, download_name, is_published, is_premium")
    .eq("id", id)
    .maybeSingle();

  if (error || !product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  if (!product.is_published) {
    res.status(404).json({ error: "Product not available" });
    return;
  }

  if (!product.file_url) {
    res.status(404).json({ error: "No file available for this product" });
    return;
  }

  // Generate a 1-hour signed URL for private bucket access
  const { data: signed, error: signError } = await supabaseAdmin.storage
    .from(FILES_BUCKET)
    .createSignedUrl(product.file_url, 3600, {
      download: product.download_name ?? true,
    });

  if (signError || !signed?.signedUrl) {
    res.status(500).json({ error: "Failed to generate download link" });
    return;
  }

  res.json({ url: signed.signedUrl, name: product.download_name ?? "download" });
});

// ─── ADMIN ENDPOINTS ───────────────────────────────────────────────────────

// GET /admin/themes — list all products (published + unpublished), with public cover URLs
router.get("/admin/themes", requireAuth, requireAdmin, async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from("theme_products")
    .select("*")
    .order("category")
    .order("sort_order");

  if (error) {
    res.status(500).json({ error: "Failed to load products" });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? "";

  const products = (data ?? []).map((p) => ({
    ...p,
    cover_image_url_display: p.cover_image_url
      ? `${supabaseUrl}/storage/v1/object/public/${COVERS_BUCKET}/${p.cover_image_url}`
      : null,
  }));

  res.json(products);
});

// POST /admin/themes/upload-url — signed URL for direct file upload to storage
// type: "cover" | "file" — determines which bucket and path to use
router.post("/admin/themes/upload-url", requireAuth, requireAdmin, async (req, res) => {
  const { path: filePath, type = "file" } = req.body as {
    path?: string;
    type?: "cover" | "file";
  };

  if (!filePath || typeof filePath !== "string") {
    res.status(400).json({ error: "path is required" });
    return;
  }

  const safe = filePath.replace(/[^a-zA-Z0-9\-_.\/]/g, "_");
  const bucket = type === "cover" ? COVERS_BUCKET : FILES_BUCKET;

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUploadUrl(safe);

  if (error || !data) {
    res.status(500).json({ error: "Failed to create upload URL" });
    return;
  }

  res.json({ signedUrl: data.signedUrl, path: data.path ?? safe, bucket });
});

// POST /admin/themes — create a new product
router.post("/admin/themes", requireAuth, requireAdmin, async (req, res) => {
  const {
    title, slug, category, description,
    cover_image_url, preview_image_url,
    file_url, file_type, download_name,
    is_premium = true, is_published = false, sort_order = 0,
  } = req.body as {
    title?: string;
    slug?: string;
    category?: string;
    description?: string;
    cover_image_url?: string;
    preview_image_url?: string;
    file_url?: string;
    file_type?: string;
    download_name?: string;
    is_premium?: boolean;
    is_published?: boolean;
    sort_order?: number;
  };

  if (!title || !category) {
    res.status(400).json({ error: "title and category are required" });
    return;
  }

  const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const { data, error } = await supabaseAdmin
    .from("theme_products")
    .insert({
      title, slug: finalSlug, category,
      description: description ?? null,
      cover_image_url: cover_image_url ?? null,
      preview_image_url: preview_image_url ?? null,
      file_url: file_url ?? null,
      file_type: file_type ?? null,
      download_name: download_name ?? null,
      is_premium, is_published, sort_order,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message ?? "Failed to create product" });
    return;
  }

  res.status(201).json(data);
});

// PUT /admin/themes/:id — update a product
router.put("/admin/themes/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  const allowed = [
    "title", "slug", "category", "description",
    "cover_image_url", "preview_image_url",
    "file_url", "file_type", "download_name",
    "is_premium", "is_published", "sort_order",
  ] as const;

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in req.body) patch[key] = (req.body as Record<string, unknown>)[key];
  }

  const { data, error } = await supabaseAdmin
    .from("theme_products")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message ?? "Failed to update product" });
    return;
  }

  res.json(data);
});

// DELETE /admin/themes/:id — delete a product and its storage files
router.delete("/admin/themes/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  const { data: product } = await supabaseAdmin
    .from("theme_products")
    .select("cover_image_url, preview_image_url, file_url")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabaseAdmin
    .from("theme_products")
    .delete()
    .eq("id", id);

  if (error) {
    res.status(500).json({ error: "Failed to delete product" });
    return;
  }

  if (product) {
    const coverPaths = [product.cover_image_url, product.preview_image_url]
      .filter((p): p is string => Boolean(p));
    const filePaths = [product.file_url].filter((p): p is string => Boolean(p));

    if (coverPaths.length > 0) {
      await supabaseAdmin.storage.from(COVERS_BUCKET).remove(coverPaths).catch(() => {});
    }
    if (filePaths.length > 0) {
      await supabaseAdmin.storage.from(FILES_BUCKET).remove(filePaths).catch(() => {});
    }
  }

  res.json({ success: true });
});

export default router;

import { supabaseAdmin } from "./supabase.js";
import { logger } from "./logger.js";

export const COVERS_BUCKET = "theme-covers";
export const FILES_BUCKET  = "theme-assets";

/**
 * Ensures both storage buckets exist, creating them if they don't.
 * Safe to call on every startup — 409 (already exists) is silently ignored.
 */
export async function ensureStorageBuckets(): Promise<void> {
  await Promise.all([
    ensureBucket(COVERS_BUCKET, { public: true }),
    ensureBucket(FILES_BUCKET,  { public: false }),
  ]);
}

async function ensureBucket(name: string, opts: { public: boolean }): Promise<void> {
  // First check if it already exists
  const { data: existing } = await supabaseAdmin.storage.getBucket(name);
  if (existing) {
    logger.info({ bucket: name }, "Storage bucket already exists");
    return;
  }

  const { error } = await supabaseAdmin.storage.createBucket(name, {
    public: opts.public,
    allowedMimeTypes: opts.public
      ? ["image/jpeg", "image/png", "image/webp", "image/gif"]
      : ["image/jpeg", "image/png", "image/webp", "image/gif", "application/zip", "application/pdf", "application/octet-stream"],
    fileSizeLimit: opts.public ? 10_485_760 : 52_428_800, // 10MB covers, 50MB files
  });

  if (!error) {
    logger.info({ bucket: name, public: opts.public }, "Storage bucket created ✓");
    return;
  }

  // statusCode 409 = already exists — treat as success
  const statusCode = (error as { statusCode?: string | number }).statusCode;
  if (statusCode === 409 || statusCode === "409" ||
      (error.message ?? "").toLowerCase().includes("already exists")) {
    logger.info({ bucket: name }, "Storage bucket already exists (409 ok)");
    return;
  }

  logger.warn({ bucket: name, err: error.message }, "Failed to create storage bucket");
}

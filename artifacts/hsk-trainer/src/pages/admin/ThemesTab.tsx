import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Loader2, ImageIcon, FileDown } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { isAdminVerified, SectionCard, LoadingSpinner, EmptyState, StatusBadge, fmt } from "./adminUtils";

interface ThemeProduct {
  id: string;
  title: string;
  slug: string;
  category: string;
  description: string | null;
  cover_image_url: string | null;
  cover_image_url_display?: string | null;
  preview_image_url: string | null;
  file_url: string | null;
  file_type: string | null;
  download_name: string | null;
  is_premium: boolean;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  "Phone Wallpapers",
  "iPad Wallpapers",
  "Laptop Wallpapers",
  "Stickers",
  "Merch",
];

const BLANK: Omit<ThemeProduct, "id" | "slug" | "created_at" | "updated_at"> = {
  title: "",
  category: CATEGORIES[0],
  description: "",
  cover_image_url: null,
  preview_image_url: null,
  file_url: null,
  file_type: null,
  download_name: null,
  is_premium: true,
  is_published: false,
  sort_order: 0,
};

// ─── Upload helper ────────────────────────────────────────────────────────────

async function uploadFile(file: File, folder: string, type: "cover" | "file"): Promise<string> {
  const ext = file.name.split(".").pop() ?? "bin";
  const uniqueName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  // Step 1: get a signed upload URL from our API
  const { signedUrl, path } = await apiFetch<{ signedUrl: string; path: string }>(
    "/api/admin/themes/upload-url",
    { method: "POST", body: JSON.stringify({ path: uniqueName, type }) }
  );

  // Step 2: PUT the file directly to Supabase Storage using the signed URL
  const uploadRes = await fetch(signedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });

  if (!uploadRes.ok) {
    let detail = `HTTP ${uploadRes.status}`;
    try {
      const body = await uploadRes.text();
      if (body) detail += `: ${body.slice(0, 120)}`;
    } catch { /* ignore */ }
    throw new Error(`File upload to storage failed (${detail})`);
  }

  return path;
}

// ─── Product form ─────────────────────────────────────────────────────────────

function ProductForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: Partial<ThemeProduct>;
  onSave: (data: Partial<ThemeProduct>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({ ...BLANK, ...initial });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [downloadFile, setDownloadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    setUploading(true);

    try {
      const patch = { ...form };

      if (coverFile) {
        patch.cover_image_url = await uploadFile(coverFile, "covers", "cover");
      }
      if (previewFile) {
        patch.preview_image_url = await uploadFile(previewFile, "previews", "cover");
      }
      if (downloadFile) {
        patch.file_url = await uploadFile(downloadFile, "files", "file");
        patch.file_type = downloadFile.type || "application/octet-stream";
        if (!patch.download_name) {
          patch.download_name = downloadFile.name;
        }
      }

      onSave(patch);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {uploadError && (
        <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
          {uploadError}
        </p>
      )}

      {/* Title + Category */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Title *</label>
          <input
            required
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="e.g. Cherry Blossom Phone Wallpaper"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Category *</label>
          <select
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1">Description</label>
        <textarea
          value={form.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
          rows={2}
          className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          placeholder="Short description shown on the product card"
        />
      </div>

      {/* Cover image */}
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1">
          Cover Image {form.cover_image_url && <span className="text-emerald-600">(uploaded)</span>}
        </label>
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
            className="text-xs text-muted-foreground file:mr-2 file:text-xs file:py-1 file:px-3 file:rounded-lg file:border file:border-border file:bg-muted file:text-foreground"
          />
          {coverFile && <span className="text-xs text-emerald-600">{coverFile.name}</span>}
        </div>
        {form.cover_image_url && !coverFile && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <ImageIcon className="w-3 h-3" /> Current: {form.cover_image_url.split("/").pop()}
          </p>
        )}
      </div>

      {/* Preview image (optional) */}
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1">
          Preview Image (optional, shown in modal) {form.preview_image_url && <span className="text-emerald-600">(uploaded)</span>}
        </label>
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPreviewFile(e.target.files?.[0] ?? null)}
            className="text-xs text-muted-foreground file:mr-2 file:text-xs file:py-1 file:px-3 file:rounded-lg file:border file:border-border file:bg-muted file:text-foreground"
          />
          {previewFile && <span className="text-xs text-emerald-600">{previewFile.name}</span>}
        </div>
      </div>

      {/* Downloadable file */}
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1">
          Downloadable File {form.file_url && <span className="text-emerald-600">(uploaded)</span>}
        </label>
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="image/*,application/zip,.zip,.pdf"
            onChange={(e) => setDownloadFile(e.target.files?.[0] ?? null)}
            className="text-xs text-muted-foreground file:mr-2 file:text-xs file:py-1 file:px-3 file:rounded-lg file:border file:border-border file:bg-muted file:text-foreground"
          />
          {downloadFile && <span className="text-xs text-emerald-600">{downloadFile.name}</span>}
        </div>
        {form.file_url && !downloadFile && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <FileDown className="w-3 h-3" /> Current: {form.file_url.split("/").pop()}
          </p>
        )}
      </div>

      {/* Download name + Sort order */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Download Filename</label>
          <input
            value={form.download_name ?? ""}
            onChange={(e) => set("download_name", e.target.value || null)}
            className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="cherry-blossom-wallpaper.jpg"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Sort Order</label>
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => set("sort_order", parseInt(e.target.value) || 0)}
            className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Toggles */}
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_premium}
            onChange={(e) => set("is_premium", e.target.checked)}
            className="rounded"
          />
          <span className="text-sm font-medium text-foreground">Premium only</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) => set("is_published", e.target.checked)}
            className="rounded"
          />
          <span className="text-sm font-medium text-foreground">Published</span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2 border-t border-border">
        <button
          type="submit"
          disabled={saving || uploading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {(saving || uploading) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {uploading ? "Uploading…" : saving ? "Saving…" : "Save Product"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export default function ThemesTab() {
  const qc = useQueryClient();
  const verified = isAdminVerified();

  const [editing, setEditing] = useState<ThemeProduct | "new" | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: products, isLoading } = useQuery<ThemeProduct[]>({
    queryKey: ["admin-themes"],
    queryFn: () => apiFetch<ThemeProduct[]>("/api/admin/themes"),
    staleTime: 30 * 1000,
  });

  const createMut = useMutation({
    mutationFn: (body: Partial<ThemeProduct>) =>
      apiFetch<ThemeProduct>("/api/admin/themes", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-themes"] }); setEditing(null); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...body }: Partial<ThemeProduct> & { id: string }) =>
      apiFetch<ThemeProduct>(`/api/admin/themes/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-themes"] }); setEditing(null); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/admin/themes/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-themes"] }); setDeleteId(null); },
  });

  const togglePublished = (p: ThemeProduct) => {
    updateMut.mutate({ id: p.id, is_published: !p.is_published });
  };

  const handleSave = (data: Partial<ThemeProduct>) => {
    if (editing === "new") {
      createMut.mutate(data);
    } else if (editing) {
      updateMut.mutate({ id: editing.id, ...data });
    }
  };

  const isSaving = createMut.isPending || updateMut.isPending;
  const categoryGroups = (products ?? []).reduce<Record<string, ThemeProduct[]>>((acc, p) => {
    (acc[p.category] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground">Chinese Themes Products</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{products?.length ?? 0} products total</p>
        </div>
        {verified && (
          <button
            onClick={() => setEditing("new")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        )}
      </div>

      {/* New product form */}
      {editing === "new" && (
        <SectionCard title="New Product">
          <ProductForm
            initial={{}}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
            saving={isSaving}
          />
        </SectionCard>
      )}

      {isLoading && <LoadingSpinner />}

      {!isLoading && (products ?? []).length === 0 && (
        <EmptyState message="No theme products yet. Add your first product above." />
      )}

      {/* Products grouped by category */}
      {Object.entries(categoryGroups).map(([cat, items]) => (
        <SectionCard key={cat} title={cat}>
          <div className="space-y-3">
            {items.map((p) => (
              <div key={p.id}>
                {editing && editing !== "new" && editing.id === p.id ? (
                  <div className="bg-muted/40 rounded-xl p-4">
                    <ProductForm
                      initial={p}
                      onSave={handleSave}
                      onCancel={() => setEditing(null)}
                      saving={isSaving}
                    />
                  </div>
                ) : (
                  <div className="flex items-start gap-3 py-2 border-b border-border/40 last:border-0">
                    {/* Cover thumbnail */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                      {p.cover_image_url_display ? (
                        <img
                          src={p.cover_image_url_display}
                          alt={p.title}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground truncate">{p.title}</span>
                        <StatusBadge ok={p.is_published} label={p.is_published ? "Published" : "Draft"} />
                        {p.is_premium && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            Premium
                          </span>
                        )}
                        {p.file_url && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            Has file
                          </span>
                        )}
                      </div>
                      {p.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{p.description}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">Updated {fmt(p.updated_at)}</p>
                    </div>

                    {verified && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => togglePublished(p)}
                          title={p.is_published ? "Unpublish" : "Publish"}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {p.is_published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => setEditing(p)}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(p.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Delete confirm inline */}
                {deleteId === p.id && (
                  <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2 mt-1">
                    <p className="text-xs text-red-700 dark:text-red-400 flex-1">
                      Delete "<strong>{p.title}</strong>"? This also removes uploaded files.
                    </p>
                    <button
                      onClick={() => deleteMut.mutate(p.id)}
                      disabled={deleteMut.isPending}
                      className="text-xs font-semibold text-red-700 hover:underline"
                    >
                      {deleteMut.isPending ? "Deleting…" : "Delete"}
                    </button>
                    <button
                      onClick={() => setDeleteId(null)}
                      className="p-0.5 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      ))}

      {!verified && (products ?? []).length > 0 && (
        <p className="text-xs text-center text-amber-600 dark:text-amber-400">
          Verify your admin identity to edit products.
        </p>
      )}
    </div>
  );
}

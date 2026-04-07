import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Trash2, ImageIcon, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import type { BrandAsset } from "@/hooks/use-branding";

type AssetType = "logo" | "favicon";
type Variant   = "default" | "light" | "dark";

const VARIANTS: Variant[] = ["default", "light", "dark"];
const VARIANT_LABELS: Record<Variant, string> = {
  default: "Default",
  light:   "Light bg",
  dark:    "Dark bg",
};

// ─── Upload helper ─────────────────────────────────────────────────────────────

async function uploadAsset(
  file: File,
  asset_type: AssetType,
  variant: Variant
): Promise<BrandAsset> {
  // 1. Get signed upload URL from API
  const params = new URLSearchParams({ asset_type, variant, filename: file.name });
  const { signedUrl, storagePath } = await apiFetch<{ signedUrl: string; storagePath: string; token: string }>(
    `/api/admin/branding/upload-url?${params}`
  );

  // 2. PUT the file directly to Supabase storage
  const uploadRes = await fetch(signedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!uploadRes.ok) throw new Error("File upload to storage failed");

  // 3. Measure image dimensions
  const { width, height } = await getImageDimensions(file);

  // 4. Persist the record in the database
  return apiFetch<BrandAsset>("/api/admin/branding", {
    method: "POST",
    body: JSON.stringify({ asset_type, variant, storage_path: storagePath, width, height }),
  });
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 0, height: 0 });
    };
    img.src = url;
  });
}

// ─── Asset Card ───────────────────────────────────────────────────────────────

function AssetCard({
  asset_type,
  variant,
  asset,
  onUpload,
  onDelete,
  uploading,
}: {
  asset_type: AssetType;
  variant: Variant;
  asset?: BrandAsset;
  onUpload: (file: File) => void;
  onDelete: (id: string) => void;
  uploading: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="border border-border rounded-xl p-4 flex flex-col gap-3 bg-card">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground capitalize">
          {VARIANT_LABELS[variant]}
        </span>
        {asset && (
          <button
            onClick={() => onDelete(asset.id)}
            className="text-muted-foreground hover:text-destructive transition-colors"
            title="Remove"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Preview area */}
      <div
        className={`h-28 rounded-lg border border-dashed border-border flex items-center justify-center overflow-hidden ${
          variant === "dark"  ? "bg-gray-900" :
          variant === "light" ? "bg-white" :
          "bg-muted/40"
        }`}
      >
        {asset ? (
          <img
            src={asset.file_url}
            alt={`${asset_type} ${variant}`}
            className="max-h-24 max-w-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground/60">
            <ImageIcon className="w-6 h-6" />
            <span className="text-xs">No asset</span>
          </div>
        )}
      </div>

      {asset && (
        <p className="text-xs text-muted-foreground text-center">
          {asset.width && asset.height ? `${asset.width}×${asset.height}px` : ""}
        </p>
      )}

      {/* Upload button */}
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
      >
        {uploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
        {asset ? "Replace" : "Upload"}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

function AssetSection({
  asset_type,
  label,
  description,
  assets,
  uploadingKey,
  onUpload,
  onDelete,
}: {
  asset_type: AssetType;
  label: string;
  description: string;
  assets: BrandAsset[];
  uploadingKey: string | null;
  onUpload: (file: File, asset_type: AssetType, variant: Variant) => void;
  onDelete: (id: string) => void;
}) {
  const byVariant = (v: Variant) => assets.find((a) => a.asset_type === asset_type && a.variant === v);

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold text-foreground">{label}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {VARIANTS.map((v) => (
          <AssetCard
            key={v}
            asset_type={asset_type}
            variant={v}
            asset={byVariant(v)}
            uploading={uploadingKey === `${asset_type}-${v}`}
            onUpload={(file) => onUpload(file, asset_type, v)}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export default function BrandingTab() {
  const queryClient = useQueryClient();
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const { data: assets = [], isLoading } = useQuery<BrandAsset[]>({
    queryKey: ["admin-branding"],
    queryFn: () => apiFetch<BrandAsset[]>("/api/branding"),
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/admin/branding/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-branding"] });
      queryClient.invalidateQueries({ queryKey: ["branding"] });
      toast({ title: "Asset removed" });
    },
    onError: () => toast({ title: "Failed to remove asset", variant: "destructive" }),
  });

  const handleUpload = async (file: File, asset_type: AssetType, variant: Variant) => {
    const key = `${asset_type}-${variant}`;
    setUploadingKey(key);
    try {
      await uploadAsset(file, asset_type, variant);
      queryClient.invalidateQueries({ queryKey: ["admin-branding"] });
      queryClient.invalidateQueries({ queryKey: ["branding"] });
      toast({ title: `${asset_type} (${variant}) updated` });
    } catch (e) {
      toast({
        title: "Upload failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setUploadingKey(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-10">
      <div>
        <h2 className="text-xl font-bold text-foreground">Brand Assets</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upload logo and favicon for light, dark, and default backgrounds. Changes apply immediately across the app.
        </p>
      </div>

      <AssetSection
        asset_type="logo"
        label="Logo"
        description="Used in the sidebar, header, and public pages. Recommended: 500×500px or wider SVG/PNG with transparent background."
        assets={assets}
        uploadingKey={uploadingKey}
        onUpload={handleUpload}
        onDelete={(id) => deleteMutation.mutate(id)}
      />

      <AssetSection
        asset_type="favicon"
        label="Favicon"
        description="Browser tab icon. Recommended: 32×32px or 64×64px PNG/SVG."
        assets={assets}
        uploadingKey={uploadingKey}
        onUpload={handleUpload}
        onDelete={(id) => deleteMutation.mutate(id)}
      />
    </div>
  );
}

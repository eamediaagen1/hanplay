import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Trash2, ImageIcon, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import type { BrandAsset } from "@/hooks/use-branding";

type AssetType = "logo" | "logo_landing" | "favicon";
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
  const params = new URLSearchParams({ asset_type, variant, filename: file.name });
  const { signedUrl, storagePath } = await apiFetch<{ signedUrl: string; storagePath: string; token: string }>(
    `/api/admin/branding/upload-url?${params}`
  );

  const uploadRes = await fetch(signedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!uploadRes.ok) throw new Error("File upload to storage failed");

  const { width, height } = await getImageDimensions(file);

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
  wide,
}: {
  asset_type: AssetType;
  variant: Variant;
  asset?: BrandAsset;
  onUpload: (file: File) => void;
  onDelete: (id: string) => void;
  uploading: boolean;
  wide?: boolean;
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

      {/* Preview area — taller/wider for landing logo */}
      <div
        className={`rounded-lg border border-dashed border-border flex items-center justify-center overflow-hidden ${
          wide ? "h-36" : "h-28"
        } ${
          variant === "dark"  ? "bg-gray-900" :
          variant === "light" ? "bg-white" :
          "bg-muted/40"
        }`}
      >
        {asset ? (
          <img
            src={asset.file_url}
            alt={`${asset_type} ${variant}`}
            className={`object-contain ${wide ? "max-h-32 max-w-full w-full px-3" : "max-h-24 max-w-full"}`}
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
  wide,
}: {
  asset_type: AssetType;
  label: string;
  description: string;
  assets: BrandAsset[];
  uploadingKey: string | null;
  onUpload: (file: File, asset_type: AssetType, variant: Variant) => void;
  onDelete: (id: string) => void;
  wide?: boolean;
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
            wide={wide}
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
      toast({ title: `${asset_type === "logo_landing" ? "Landing logo" : asset_type} (${variant}) updated` });
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
          Upload logos and favicon for light, dark, and default backgrounds. Changes apply immediately across the app.
        </p>
      </div>

      <AssetSection
        asset_type="logo"
        label="App Logo"
        description="Used in the sidebar and mobile header. Square or portrait format recommended — e.g. 500×500px PNG/SVG with transparent background."
        assets={assets}
        uploadingKey={uploadingKey}
        onUpload={handleUpload}
        onDelete={(id) => deleteMutation.mutate(id)}
      />

      <div className="border-t border-border/40" />

      <AssetSection
        asset_type="logo_landing"
        label="Landing Page Logo"
        description="Displayed in the navbar and footer of the public landing page. Wide/landscape format — e.g. 800×500px PNG/SVG with transparent background."
        assets={assets}
        uploadingKey={uploadingKey}
        onUpload={handleUpload}
        onDelete={(id) => deleteMutation.mutate(id)}
        wide
      />

      <div className="border-t border-border/40" />

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

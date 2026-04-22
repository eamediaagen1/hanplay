import { useBranding, pickLogo } from "@/hooks/use-branding";
import { useTheme } from "@/hooks/use-theme";

export default function MaintenancePage() {
  const { data: brandAssets } = useBranding();
  const { theme } = useTheme();
  const logoUrl = pickLogo(brandAssets, theme === "dark" ? "light" : "dark") ?? pickLogo(brandAssets, "default");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-5">
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-primary/4 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-sm w-full text-center">
        <div className="mb-8 flex justify-center">
          {logoUrl ? (
            <img src={logoUrl} alt="Hanplay" className="h-16 w-auto object-contain" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-serif font-bold text-3xl shadow-lg shadow-primary/25">
              汉
            </div>
          )}
        </div>

        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Scheduled Maintenance</p>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground leading-tight mb-3">
            We're improving Hanplay
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            We'll be back very soon. Thanks for your patience.
          </p>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl p-5 mb-8 text-sm text-muted-foreground leading-relaxed">
          We're making updates to improve your learning experience. Maintenance windows are usually brief — check back in a few minutes.
        </div>

        <p className="text-xs text-muted-foreground">
          Questions?{" "}
          <a
            href="mailto:contact@hanplay.online"
            className="text-primary hover:underline font-medium"
          >
            contact@hanplay.online
          </a>
        </p>

        <p className="mt-10 text-xs text-muted-foreground/40 font-serif">加油 — Keep going</p>
      </div>
    </div>
  );
}

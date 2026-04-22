import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Calendar, Sparkles } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useBranding, pickLogo } from "@/hooks/use-branding";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

const ACQUISITION_OPTIONS = [
  { value: "reddit", label: "Reddit" },
  { value: "tiktok", label: "TikTok" },
  { value: "google", label: "Google" },
  { value: "friend", label: "A friend" },
  { value: "chatgpt", label: "ChatGPT" },
  { value: "youtube", label: "YouTube" },
  { value: "other", label: "Other" },
];

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "Germany",
  "France", "Netherlands", "Singapore", "Japan", "South Korea", "China",
  "Taiwan", "Hong Kong", "India", "Brazil", "Mexico", "Sweden", "Norway",
  "Denmark", "Finland", "Switzerland", "Austria", "Italy", "Spain",
  "Poland", "Ukraine", "Russia", "New Zealand", "Ireland", "Other",
];

const ONBOARDING_KEY = "hanplay_onboarding_v1";

const fade = (i: number = 0) => ({
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.1, ease: "easeOut" as const } },
});

interface OnboardingPageProps {
  onComplete: () => void;
}

export default function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const [source, setSource] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: brandAssets } = useBranding();
  const { theme } = useTheme();
  const logoUrl = pickLogo(brandAssets, theme === "dark" ? "light" : "dark") ?? pickLogo(brandAssets, "default");

  const handleSubmit = async () => {
    if (!source) { setError("Please select where you heard about Hanplay."); return; }
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acquisition_source: source,
          age: age ? parseInt(age, 10) : undefined,
          country: country || undefined,
        }),
      });
      localStorage.setItem(ONBOARDING_KEY, "done");
      onComplete();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    try {
      await apiFetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    } catch { /* silent */ }
    localStorage.setItem(ONBOARDING_KEY, "done");
    onComplete();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 py-10">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-0">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-primary/4 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <motion.div {...fade(0)} className="flex justify-center mb-8">
          {logoUrl ? (
            <img src={logoUrl} alt="Hanplay" className="h-14 w-auto object-contain" />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-serif font-bold text-3xl shadow-lg shadow-primary/25">汉</div>
          )}
        </motion.div>

        {/* Header */}
        <motion.div {...fade(1)} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-4">
            <Sparkles className="w-3 h-3" />
            Quick setup
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground leading-tight mb-2">
            Welcome to Hanplay
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Two quick questions to help us improve the product. Takes 15 seconds.
          </p>
        </motion.div>

        {/* Form */}
        <motion.div {...fade(2)} className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 flex flex-col gap-7 shadow-xl shadow-primary/5">

          {/* Question 1: Source */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              Where did you hear about Hanplay?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ACQUISITION_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSource(value)}
                  className={cn(
                    "px-3 py-2.5 rounded-xl text-sm font-medium border transition-all text-left",
                    source === value
                      ? "border-primary bg-primary/10 text-primary shadow-sm shadow-primary/10"
                      : "border-border/60 bg-muted/30 text-foreground hover:border-primary/40 hover:bg-primary/5"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Question 2: Age */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary shrink-0" />
              Your age <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              type="number"
              min="10"
              max="120"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 25"
              className="w-full bg-muted/50 border border-border/60 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>

          {/* Question 3: Country */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              Your country <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-muted/50 border border-border/60 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
            >
              <option value="">Select your country…</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 text-center -mt-3">{error}</p>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2.5 -mt-1">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 shadow-md shadow-primary/20"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Go to Dashboard <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
            <button
              onClick={handleSkip}
              disabled={submitting}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors py-1 text-center"
            >
              Skip for now
            </button>
          </div>
        </motion.div>

        <motion.p {...fade(3)} className="text-center text-xs text-muted-foreground/40 mt-6 font-serif">
          加油 — Keep going
        </motion.p>
      </div>
    </div>
  );
}

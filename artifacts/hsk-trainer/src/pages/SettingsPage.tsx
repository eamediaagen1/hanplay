import { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings, Moon, Sun, Globe, Shield, Check, ExternalLink,
  LogOut, ChevronRight, Loader2, Lock, Eye, EyeOff, KeyRound,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useProfile } from "@/hooks/use-profile";
import { useStudyPrefs } from "@/hooks/use-study-prefs";
import { useTheme } from "@/hooks/use-theme";
import { PageShell } from "@/components/PageShell";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { buildGumroadUrl } from "@/lib/gumroad";
import { getStoredReferralCode } from "@/hooks/use-referral-capture";

// ── Sub-components ────────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      aria-checked={value}
      role="switch"
      className={cn(
        "w-10 h-6 rounded-full transition-colors duration-200 relative flex items-center shrink-0",
        value ? "bg-primary" : "bg-muted border border-border"
      )}
    >
      <span
        className={cn(
          "absolute w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform duration-200",
          value ? "translate-x-[18px]" : "translate-x-[2px]"
        )}
      />
    </button>
  );
}

function SettingRow({
  icon: Icon,
  label,
  description,
  children,
}: {
  icon: React.ElementType;
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4 gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-px truncate">{description}</p>
          )}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

type ThemeMode = "light" | "dark" | "system";
const sectionDelay = (n: number) => ({ duration: 0.3, delay: n * 0.06 });

// ── ChangePasswordSection ──────────────────────────────────────────────────────

function ChangePasswordSection() {
  const { updatePassword } = useAuth();
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const inputBase = cn(
    "w-full pl-10 pr-10 py-3 rounded-xl text-sm",
    "bg-background border-2 border-border",
    "text-foreground placeholder:text-muted-foreground/50",
    "focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10",
    "transition-all duration-200"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);

    if (newPw.length < 6) {
      setResult({ ok: false, msg: "Password must be at least 6 characters." });
      return;
    }
    if (newPw !== confirmPw) {
      setResult({ ok: false, msg: "Passwords don't match. Please try again." });
      return;
    }

    setLoading(true);
    try {
      await updatePassword(newPw);
      setResult({ ok: true, msg: "Password updated successfully." });
      setNewPw("");
      setConfirmPw("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setResult({ ok: false, msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <KeyRound className="w-4 h-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Change password</p>
          <p className="text-xs text-muted-foreground">Set a new password for your account</p>
        </div>
      </div>

      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type={showNew ? "text" : "password"}
          placeholder="New password"
          value={newPw}
          onChange={(e) => setNewPw(e.target.value)}
          autoComplete="new-password"
          className={inputBase}
        />
        <button
          type="button"
          onClick={() => setShowNew((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
        >
          {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type={showConfirm ? "text" : "password"}
          placeholder="Confirm new password"
          value={confirmPw}
          onChange={(e) => setConfirmPw(e.target.value)}
          autoComplete="new-password"
          className={inputBase}
        />
        <button
          type="button"
          onClick={() => setShowConfirm((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
        >
          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {result && (
        <p className={cn(
          "text-xs px-3 py-2 rounded-lg",
          result.ok
            ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
            : "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20"
        )}>
          {result.msg}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !newPw || !confirmPw}
        className={cn(
          "flex items-center justify-center gap-2 w-full py-2.5 rounded-xl",
          "text-sm font-semibold bg-primary text-primary-foreground",
          "shadow-sm shadow-primary/20 hover:bg-primary/90",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          "transition-all duration-200"
        )}
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</>
        ) : (
          "Update password"
        )}
      </button>
    </form>
  );
}

// ── SettingsPage ──────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [, navigate] = useLocation();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { prefs, set: setPref } = useStudyPrefs();
  const { theme, setTheme } = useTheme();

  const email = user?.email ?? null;
  const isPremium = profile?.is_premium ?? false;

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearMsg, setClearMsg] = useState<string | null>(null);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      navigate("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleClearStudyData = async () => {
    if (!clearConfirm) {
      setClearConfirm(true);
      return;
    }
    setClearing(true);
    try {
      await fetch("/api/progress/clear", { method: "DELETE", headers: { "Content-Type": "application/json" } });
      setClearMsg("Study data cleared.");
    } catch {
      localStorage.removeItem("hsk_saved_cards");
      setClearMsg("Local study data cleared.");
    } finally {
      setClearing(false);
      setClearConfirm(false);
    }
  };

  return (
    <PageShell maxWidth="md">

      {/* Page header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
        </div>
      </div>

      <div className="flex flex-col gap-5">

        {/* ── Account ────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={sectionDelay(0)}
        >
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-1 mb-2">
            Account
          </h2>
          <div className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm">
            {/* Email + plan */}
            <div className="flex items-center gap-4 px-5 py-4 border-b border-border/40">
              <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
                <span className="text-base font-bold text-primary">
                  {email ? email[0].toUpperCase() : "?"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{email ?? "Guest"}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {isPremium ? (
                    <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                      <Check className="w-3 h-3" /> Premium · All HSK levels
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Free plan · Demo access only</span>
                  )}
                </div>
              </div>
            </div>

            {/* Sign out */}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center justify-between w-full px-5 py-3.5 text-sm hover:bg-muted/50 transition-colors disabled:opacity-60"
            >
              <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground">
                {isLoggingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
                <span className="font-medium">{isLoggingOut ? "Signing out…" : "Sign out"}</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-40" />
            </button>
          </div>
        </motion.section>

        {/* ── Security ────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={sectionDelay(1)}
        >
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-1 mb-2">
            Security
          </h2>
          <div className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm divide-y divide-border/40">
            <ChangePasswordSection />
          </div>
          <p className="text-xs text-muted-foreground px-1 mt-1.5">
            If you signed in with a magic link and haven't set a password yet, use Forgot Password from the sign-in page.
          </p>
        </motion.section>

        {/* ── Subscription ───────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={sectionDelay(2)}
        >
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-1 mb-2">
            Subscription
          </h2>
          <div className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm">
            {isPremium ? (
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Premium · Active</p>
                  <p className="text-xs text-muted-foreground mt-px">All HSK 1–6 levels unlocked</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 px-5 py-4 border-b border-border/40">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Free plan</p>
                    <p className="text-xs text-muted-foreground mt-px">Demo access only</p>
                  </div>
                </div>
                <a
                  href={buildGumroadUrl(user?.id, getStoredReferralCode())}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full px-5 py-3.5 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors"
                >
                  <span>Get full access — $9.99/year</span>
                  <ExternalLink className="w-4 h-4 shrink-0" />
                </a>
              </>
            )}
          </div>
        </motion.section>

        {/* ── Appearance ─────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={sectionDelay(3)}
        >
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-1 mb-2">
            Appearance
          </h2>
          <div className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm">
            <div className="px-5 py-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  {theme === "dark" ? (
                    <Moon className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Sun className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <p className="text-sm font-medium text-foreground">Theme</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(["light", "dark", "system"] as ThemeMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setTheme(mode)}
                    className={cn(
                      "py-2 rounded-xl text-sm font-medium capitalize border transition-all",
                      theme === mode
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                    )}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── Study preferences ──────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={sectionDelay(4)}
        >
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-1 mb-2">
            Study
          </h2>
          <div className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm divide-y divide-border/40">
            <SettingRow
              icon={Globe}
              label="Show Pinyin"
              description="Display romanisation on flashcards"
            >
              <Toggle value={prefs.showPinyin} onChange={(v) => setPref("showPinyin", v)} />
            </SettingRow>
            <SettingRow
              icon={Globe}
              label="Auto-play audio"
              description="Speak each word when the card is shown"
            >
              <Toggle value={prefs.autoPlay} onChange={(v) => setPref("autoPlay", v)} />
            </SettingRow>
          </div>
          <p className="text-xs text-muted-foreground px-1 mt-1.5">
            Study preferences are saved to this device.
          </p>
        </motion.section>

        {/* ── Data ───────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={sectionDelay(5)}
        >
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-1 mb-2">
            Data
          </h2>
          <div className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={handleClearStudyData}
              disabled={clearing}
              className={cn(
                "flex items-center justify-between w-full px-5 py-3.5 text-sm transition-colors",
                clearConfirm
                  ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30"
                  : "text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
              )}
            >
              <div className="flex items-center gap-3">
                {clearing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
                <span className="font-medium">
                  {clearing
                    ? "Clearing…"
                    : clearConfirm
                    ? "Tap again to confirm — this cannot be undone"
                    : "Clear study data"}
                </span>
              </div>
              {!clearing && <ChevronRight className="w-4 h-4 opacity-50" />}
            </button>
            {clearMsg && (
              <p className="px-5 pb-3 text-xs text-muted-foreground">{clearMsg}</p>
            )}
          </div>
          <p className="text-xs text-muted-foreground px-1 mt-1.5">
            Clears your saved words and spaced-repetition progress. This cannot be undone.
          </p>
        </motion.section>

        {/* ── Help ───────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={sectionDelay(6)}
        >
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-1 mb-2">
            Help
          </h2>
          <div className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm">
            <div className="px-5 py-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Questions or issues? Email us at{" "}
                <a
                  href="mailto:contact@hanplay.online"
                  className="text-primary underline underline-offset-2 font-medium"
                >
                  contact@hanplay.online
                </a>
                {" "}and we'll get back to you.
              </p>
            </div>
          </div>
        </motion.section>

      </div>
    </PageShell>
  );
}

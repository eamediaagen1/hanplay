import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Loader2, Mail, Lock, User, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { DecorativeBackground, Lanterns } from "@/components/Decorations";
import { savePendingName } from "@/lib/pending-name";
import { cn } from "@/lib/utils";

type Mode = "magic" | "login" | "signup";

function friendlyError(message: string, mode?: Mode): string {
  const t = message?.trim() ?? "";

  // Empty / bare JSON body from Supabase — almost always means email delivery failed
  if (!t || t === "{}" || t === "[]" || t === "null" || t === "undefined") {
    if (mode === "magic")
      return "Couldn't send the magic link — email delivery isn't configured in Supabase yet. Use Sign In with a password, or ask your admin to fix the email settings.";
    if (mode === "signup")
      return "Account may have been created, but the confirmation email failed to send. Try signing in with your password instead, or ask your admin to disable email confirmation in Supabase.";
    return "Something went wrong. Please try again.";
  }

  if (t.includes("Invalid login credentials"))
    return "Incorrect email or password. Please try again.";
  if (t.includes("Email not confirmed"))
    return "Please confirm your email — check your inbox, or try signing in with a magic link.";
  if (t.includes("User already registered"))
    return "An account with this email already exists. Try signing in instead.";
  if (t.includes("Password should be at least"))
    return "Password must be at least 6 characters.";
  if (t.includes("Unable to validate email address"))
    return "Please enter a valid email address.";
  if (t.includes("rate limit") || t.includes("too many"))
    return "Too many attempts. Please wait a moment and try again.";
  if (t.includes("Failed to fetch") || t.includes("NetworkError"))
    return "Network error — check your connection and try again.";
  return t;
}

const inputClass = cn(
  "w-full pl-11 pr-5 py-3.5 rounded-xl",
  "bg-background border-2 border-border",
  "text-foreground placeholder:text-muted-foreground/60",
  "focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10",
  "transition-all duration-200 text-sm"
);

const modeLabels: Record<Mode, string> = {
  magic: "Magic Link",
  login: "Sign In",
  signup: "Sign Up",
};

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { signIn, signInWithPassword, signUpWithPassword } = useAuth();

  const [mode, setMode] = useState<Mode>("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setSent(false);
    setNeedsConfirm(false);
    setShowPassword(false);
    setShowConfirm(false);
    setPassword("");
    setConfirmPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    // Client-side validation before hitting the network
    if (mode === "signup") {
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords don't match. Please try again.");
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      if (mode === "magic") {
        await signIn(email);
        setSent(true);
      } else if (mode === "login") {
        await signInWithPassword(email, password);
        setLocation("/dashboard");
      } else {
        const trimmedName = name.trim();
        const { needsConfirmation } = await signUpWithPassword(email, password);

        // Store name via pending-name for both confirmation and immediate-session paths
        if (trimmedName) savePendingName(trimmedName);

        if (needsConfirmation) {
          setNeedsConfirm(true);
        } else {
          setLocation("/dashboard");
        }
      }
    } catch (err: unknown) {
      let raw = "Something went wrong. Please try again.";
      if (err instanceof Error) {
        raw = err.message;
      } else if (typeof err === "object" && err !== null && "message" in err) {
        raw = String((err as { message: unknown }).message);
      }
      setError(friendlyError(raw, mode));
    } finally {
      setIsLoading(false);
    }
  };

  const showSuccess = sent || needsConfirm;

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      <DecorativeBackground />
      <Lanterns />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-card/90 backdrop-blur-md rounded-3xl shadow-2xl border border-border/50 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-primary via-primary/70 to-primary" />

          <div className="p-8 text-center">
            {/* Logo */}
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-primary/10 flex items-center justify-center p-2">
              <img
                src={`${import.meta.env.BASE_URL}images/panda-mascot.png`}
                alt="Hanplay panda"
                className="w-full h-full object-contain"
              />
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif text-foreground mb-2 leading-tight">
              Master HSK Vocabulary{" "}
              <span className="text-primary">Faster</span>
            </h1>
            <p className="text-muted-foreground text-sm mb-7 leading-relaxed">
              Smart spaced-repetition flashcards for all 6 HSK levels.
            </p>

            {/* Mode tabs */}
            {!showSuccess && (
              <div className="flex rounded-xl bg-muted p-1 mb-6 gap-1">
                {(["magic", "login", "signup"] as Mode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => switchMode(m)}
                    className={cn(
                      "flex-1 py-2 px-1 rounded-lg text-xs font-semibold transition-all duration-200",
                      mode === m
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {modeLabels[m]}
                  </button>
                ))}
              </div>
            )}

            <AnimatePresence mode="wait">
              {/* ── Magic link sent ────────────────────────── */}
              {sent && (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 mx-auto">
                    <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">Check your inbox</p>
                    <p className="text-sm text-muted-foreground">
                      We sent a magic link to{" "}
                      <span className="font-medium text-foreground">{email}</span>.
                      Click it to sign in — no password needed.
                    </p>
                  </div>
                  <button
                    onClick={() => { setSent(false); setEmail(""); }}
                    className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
                  >
                    Use a different email
                  </button>
                </motion.div>
              )}

              {/* ── Email confirmation required ──────────── */}
              {needsConfirm && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 mx-auto">
                    <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">Account created!</p>
                    <p className="text-sm text-muted-foreground">
                      We sent a confirmation link to{" "}
                      <span className="font-medium text-foreground">{email}</span>.
                      Click it to activate your account and start learning.
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground/70">
                    Didn't receive it? Check your spam folder.
                  </p>
                  <button
                    onClick={() => { setNeedsConfirm(false); setEmail(""); setPassword(""); setConfirmPassword(""); setName(""); }}
                    className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
                  >
                    Use a different email
                  </button>
                </motion.div>
              )}

              {/* ── Form ─────────────────────────────────── */}
              {!showSuccess && (
                <motion.form
                  key={mode}
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.15 }}
                  onSubmit={handleSubmit}
                  className="space-y-3 text-left"
                >
                  {/* Name — signup only */}
                  {mode === "signup" && (
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Your name (optional)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={60}
                        autoComplete="name"
                        className={inputClass}
                      />
                    </div>
                  )}

                  {/* Email */}
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="email"
                      required
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      className={inputClass}
                    />
                  </div>

                  {/* Password */}
                  {(mode === "login" || mode === "signup") && (
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={mode === "signup" ? 6 : undefined}
                        placeholder={mode === "signup" ? "Password (min. 6 characters)" : "Password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete={mode === "signup" ? "new-password" : "current-password"}
                        className={cn(inputClass, "pr-11")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  )}

                  {/* Confirm password — signup only */}
                  {mode === "signup" && (
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <input
                        type={showConfirm ? "text" : "password"}
                        required
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        className={cn(inputClass, "pr-11")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  )}

                  {/* Forgot password link — login only */}
                  {mode === "login" && (
                    <div className="text-right -mt-1">
                      <button
                        type="button"
                        onClick={() => setLocation("/forgot-password")}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
                      >
                        Forgot your password?
                      </button>
                    </div>
                  )}

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-destructive/8 border border-destructive/20">
                          <span className="text-destructive mt-0.5 shrink-0 text-base leading-none">!</span>
                          <p className="text-sm text-destructive leading-snug">{error}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={
                      isLoading ||
                      !email ||
                      ((mode === "login" || mode === "signup") && !password) ||
                      (mode === "signup" && !confirmPassword)
                    }
                    className={cn(
                      "w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl",
                      "font-semibold text-sm",
                      "bg-primary text-primary-foreground",
                      "shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30",
                      "hover:-translate-y-0.5 active:translate-y-0 active:shadow-md",
                      "disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none",
                      "transition-all duration-200 mt-1"
                    )}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {mode === "magic" ? "Sending link…" : mode === "login" ? "Signing in…" : "Creating account…"}
                      </>
                    ) : (
                      <>
                        {mode === "magic" ? "Send Magic Link" : mode === "login" ? "Sign In" : "Create Account"}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {/* Helper */}
                  <p className="text-xs text-muted-foreground text-center pt-0.5 leading-relaxed">
                    {mode === "magic"
                      ? "No password needed — we'll email you a one-click sign-in link."
                      : mode === "login"
                      ? "New here? Switch to Sign Up above."
                      : "Already have an account? Switch to Sign In above."}
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground/40 mt-5 font-serif">
          加油 — Keep going
        </p>
      </motion.div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const inputClass = cn(
  "w-full pl-11 pr-11 py-3.5 rounded-xl",
  "bg-background border-2 border-border",
  "text-foreground placeholder:text-muted-foreground/60",
  "focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10",
  "transition-all duration-200 text-sm"
);

export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    // Listen for PASSWORD_RECOVERY event or check existing session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
        subscription.unsubscribe();
      }
    });

    // If session already exists (landed here with active session)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match. Please try again.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
      setTimeout(() => navigate("/dashboard"), 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="bg-card rounded-3xl shadow-2xl border border-border/50 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-primary via-primary/70 to-primary" />
          <div className="p-8">

            <AnimatePresence mode="wait">
              {done ? (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-4"
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-serif font-bold text-foreground mb-2">Password updated</h1>
                    <p className="text-sm text-muted-foreground">
                      Your new password is set. Redirecting you to the dashboard…
                    </p>
                  </div>
                </motion.div>
              ) : !ready ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center space-y-4 py-4"
                >
                  <div className="w-10 h-10 border-[3px] border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground">Verifying your reset link…</p>
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h1 className="text-2xl font-serif font-bold text-foreground mb-1">Set a new password</h1>
                  <p className="text-sm text-muted-foreground mb-6">
                    Choose a strong password — at least 6 characters.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* New password */}
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <input
                        type={showPw ? "text" : "password"}
                        required
                        minLength={6}
                        placeholder="New password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        autoFocus
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Confirm password */}
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <input
                        type={showConfirm ? "text" : "password"}
                        required
                        placeholder="Confirm new password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        autoComplete="new-password"
                        className={inputClass}
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

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-destructive/8 border border-destructive/20">
                            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                            <p className="text-sm text-destructive">{error}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      type="submit"
                      disabled={loading || !password || !confirm}
                      className={cn(
                        "w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl",
                        "font-semibold text-sm bg-primary text-primary-foreground",
                        "shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30",
                        "hover:-translate-y-0.5 active:translate-y-0",
                        "disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none",
                        "transition-all duration-200"
                      )}
                    >
                      {loading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Updating password…</>
                      ) : (
                        "Set new password"
                      )}
                    </button>
                  </form>
                </motion.div>
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

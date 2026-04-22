import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const inputClass = cn(
  "w-full pl-11 pr-5 py-3.5 rounded-xl",
  "bg-background border-2 border-border",
  "text-foreground placeholder:text-muted-foreground/60",
  "focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10",
  "transition-all duration-200 text-sm"
);

export default function ForgotPasswordPage() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !email.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const base = window.location.origin +
        (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
      const redirectTo = `${base}/auth/callback`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (resetError) throw resetError;
      setSent(true);
    } catch (err: unknown) {
      let raw = "Something went wrong. Please try again.";
      if (err instanceof Error) raw = err.message;
      else if (typeof err === "object" && err !== null && "message" in err)
        raw = String((err as { message: unknown }).message);

      const trimmed = raw.trim();
      let msg: string;
      if (!trimmed || trimmed === "{}" || trimmed === "[]") {
        msg = "Couldn't send the reset email — email delivery isn't configured in Supabase. Contact support at contact@hanplay.online.";
      } else if (trimmed.includes("rate limit") || trimmed.includes("too many")) {
        msg = "Too many attempts. Please wait a moment and try again.";
      } else {
        msg = raw;
      }
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

            <button
              onClick={() => navigate("/app")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </button>

            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-4"
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-serif font-bold text-foreground mb-2">Check your inbox</h1>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      We sent a password reset link to{" "}
                      <span className="font-medium text-foreground">{email}</span>.
                      Click it to set a new password.
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground/70">
                    Didn't receive it? Check your spam folder, or{" "}
                    <button
                      onClick={() => setSent(false)}
                      className="text-primary underline underline-offset-2"
                    >
                      try again
                    </button>.
                  </p>
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h1 className="text-2xl font-serif font-bold text-foreground mb-1">Reset your password</h1>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                    Enter your account email and we'll send you a link to set a new password.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <input
                        type="email"
                        required
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        autoFocus
                        className={inputClass}
                      />
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
                            <span className="text-destructive mt-0.5 shrink-0 text-base leading-none">!</span>
                            <p className="text-sm text-destructive">{error}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      type="submit"
                      disabled={loading || !email.trim()}
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
                        <><Loader2 className="w-4 h-4 animate-spin" /> Sending link…</>
                      ) : (
                        "Send reset link"
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

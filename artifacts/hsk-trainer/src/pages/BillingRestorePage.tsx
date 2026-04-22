import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Key, CheckCircle2, AlertCircle, Loader2, ArrowLeft, Clock, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { PageShell } from "@/components/PageShell";
import { cn } from "@/lib/utils";

type Result = { success: boolean; message: string; expires_at?: string };

export default function BillingRestorePage() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();

  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const handleActivate = async () => {
    if (!key.trim() || loading) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await apiFetch<Result>("/api/premium/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ license_key: key.trim() }),
      });
      setResult(res);
      if (res.success) {
        qc.invalidateQueries({ queryKey: ["profile"] });
        qc.invalidateQueries({ queryKey: ["billing-status"] });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setResult({ success: false, message: msg });
    } finally {
      setLoading(false);
    }
  };

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });
  }

  return (
    <PageShell maxWidth="sm">
      <div className="py-8 space-y-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Key className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-foreground">Restore your access</h1>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Paste the license key from your Gumroad receipt email to unlock your account instantly.
          </p>
        </motion.div>

        {/* Input card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card border border-border/60 rounded-2xl p-6 space-y-5"
        >
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              License Key
            </label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
              disabled={loading || result?.success === true}
              className={cn(
                "w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-sm font-mono",
                "text-foreground placeholder:text-muted-foreground/50",
                "focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10",
                "transition-all duration-200",
                (loading || result?.success) && "opacity-60 cursor-not-allowed"
              )}
              onKeyDown={(e) => e.key === "Enter" && handleActivate()}
            />
          </div>

          <button
            onClick={handleActivate}
            disabled={loading || !key.trim() || result?.success === true}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl",
              "text-sm font-semibold transition-all duration-200",
              "bg-primary text-primary-foreground shadow-md shadow-primary/20",
              "hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0",
              "disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            )}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying your key…
              </>
            ) : (
              <>
                <Key className="w-4 h-4" />
                Unlock my access
              </>
            )}
          </button>

          {/* Result */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className={cn(
                  "flex items-start gap-3 rounded-xl px-4 py-3.5 text-sm",
                  result.success
                    ? "bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300"
                    : "bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800/40 text-red-800 dark:text-red-300"
                )}>
                  {result.success
                    ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                  <div>
                    <p>{result.message}</p>
                    {result.success && result.expires_at && (
                      <p className="flex items-center gap-1 mt-1 text-xs opacity-75">
                        <Clock className="w-3 h-3" />
                        Access through {formatDate(result.expires_at)}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Post-success CTA */}
        {result?.success && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
            >
              Start learning
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Help text */}
        {!result?.success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="bg-muted/40 rounded-xl p-4 text-xs text-muted-foreground space-y-2"
          >
            <p className="font-semibold text-foreground/80">Can't find your key?</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Check the email inbox you used to pay — look for a receipt from Gumroad</li>
              <li>The subject line says "Your receipt from Gumroad"</li>
              <li>The key looks like: <code className="font-mono">XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX</code></li>
            </ul>
            <p>
              Still stuck?{" "}
              <a
                href="mailto:contact@hanplay.online"
                className="text-primary underline underline-offset-2"
              >
                Email us at contact@hanplay.online
              </a>{" "}
              and we'll sort it out.
            </p>
          </motion.div>
        )}

      </div>
    </PageShell>
  );
}

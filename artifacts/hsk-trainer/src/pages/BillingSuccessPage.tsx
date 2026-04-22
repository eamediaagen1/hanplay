import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, ArrowRight, Key, Clock } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { PageShell } from "@/components/PageShell";
import { cn } from "@/lib/utils";

type Phase = "polling" | "success" | "timeout";

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 10; // 30 seconds total

export default function BillingSuccessPage() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const [phase, setPhase] = useState<Phase>("polling");
  const [pollCount, setPollCount] = useState(0);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    if (phase !== "polling") return;

    const timer = setInterval(async () => {
      try {
        const res = await apiFetch<{ premium: boolean; subscription: { expires_at: string } | null }>(
          "/api/billing/status"
        );

        if (res.premium && res.subscription) {
          setExpiresAt(res.subscription.expires_at);
          setPhase("success");
          qc.invalidateQueries({ queryKey: ["profile"] });
          qc.invalidateQueries({ queryKey: ["billing-status"] });
          clearInterval(timer);
          return;
        }
      } catch {
        // Non-fatal — keep polling
      }

      setPollCount((n) => {
        if (n + 1 >= MAX_POLLS) {
          setPhase("timeout");
          clearInterval(timer);
        }
        return n + 1;
      });
    }, POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [phase, qc]);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });
  }

  return (
    <PageShell maxWidth="sm">
      <div className="min-h-[60vh] flex items-center justify-center py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full text-center"
        >
          {/* ── POLLING ─────────────────────────────────────────────────── */}
          {phase === "polling" && (
            <div className="space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold text-foreground mb-2">
                  Confirming your purchase…
                </h1>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  This usually takes just a moment. Please stay on this page.
                </p>
              </div>
              <div className="flex justify-center">
                <div className="flex gap-1.5">
                  {Array.from({ length: MAX_POLLS }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1 w-4 rounded-full transition-all duration-300",
                        i < pollCount ? "bg-primary" : "bg-muted"
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── SUCCESS ─────────────────────────────────────────────────── */}
          {phase === "success" && (
            <div className="space-y-6">
              <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <div>
                <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
                  You're in. Welcome to Hanplay Premium.
                </h1>
                <p className="text-muted-foreground mb-1">
                  All 6 HSK levels are unlocked. Pick up where you left off.
                </p>
                {expiresAt && (
                  <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    Access through {formatDate(expiresAt)}
                  </div>
                )}
              </div>
              <button
                onClick={() => navigate("/dashboard")}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                Start learning
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── TIMEOUT ─────────────────────────────────────────────────── */}
          {phase === "timeout" && (
            <div className="space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto">
                <Clock className="w-8 h-8 text-amber-500" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold text-foreground mb-2">
                  Taking a little longer than usual
                </h1>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Your payment went through — we're still activating your access behind the scenes.
                  Use your license key from the Gumroad receipt to unlock access right now.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
                >
                  Check back later
                </button>
                <button
                  onClick={() => navigate("/billing/restore")}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
                >
                  <Key className="w-4 h-4" />
                  Enter my license key
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Your license key is in the receipt email from Gumroad.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </PageShell>
  );
}

import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Crown, Sparkles, Lock, ExternalLink, RefreshCw,
  CheckCircle2, Key, Clock, User, Calendar,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { PageShell } from "@/components/PageShell";
import { buildGumroadUrl } from "@/lib/gumroad";
import { getStoredReferralCode } from "@/hooks/use-referral-capture";
import { useProfile } from "@/hooks/use-profile";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

const fade = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.08, ease: "easeOut" as const },
  }),
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
}

function formatSource(source: string | null | undefined): string {
  if (!source) return "—";
  const map: Record<string, string> = {
    gumroad: "Gumroad",
    license_key: "License Key",
    admin: "Admin Grant",
    gift: "Gift",
  };
  return map[source] ?? source;
}

// ─── License Activation Panel ─────────────────────────────────────────────────

function LicenseActivationPanel({ onSuccess }: { onSuccess: () => void }) {
  const [, navigate] = useLocation();
  void onSuccess;
  return (
    <div className="bg-card border border-border/60 rounded-2xl p-5 sm:p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Key className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-foreground text-sm">Already purchased?</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Find your license key in the Gumroad receipt email and paste it here to activate instantly.
          </p>
        </div>
      </div>
      <button
        onClick={() => navigate("/billing/restore")}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/15 transition-colors border border-primary/20"
      >
        <Key className="w-4 h-4" />
        Enter my license key
      </button>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function MembershipPage() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const { subscription, refetch: refetchSub } = useSubscription();
  const qc = useQueryClient();

  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const isPremium = profile?.is_premium ?? false;
  const buyUrl = buildGumroadUrl(user?.id, getStoredReferralCode());

  const daysLeft = subscription?.expires_at
    ? Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / 86_400_000)
    : null;

  const isExpiringSoon = daysLeft !== null && daysLeft <= 30 && daysLeft > 0;

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await apiFetch<{ is_premium: boolean; message: string }>("/api/premium/sync", {
        method: "POST",
      });
      setSyncMsg({ text: res.message, ok: res.is_premium });
      if (res.is_premium) {
        qc.invalidateQueries({ queryKey: ["profile"] });
        qc.invalidateQueries({ queryKey: ["billing-status"] });
        refetchSub();
      }
    } catch {
      setSyncMsg({ text: "Couldn't connect. Please try again.", ok: false });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <PageShell title="Membership" maxWidth="md">
      <div className="flex flex-col gap-6 pb-10">

        {/* Header */}
        <motion.div custom={0} variants={fade} initial="hidden" animate="show">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground leading-tight mb-2">
            Membership
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your plan, access details, and subscription status.
          </p>
        </motion.div>

        {/* Status card */}
        <motion.div custom={1} variants={fade} initial="hidden" animate="show">
          {isLoading ? (
            <div className="bg-card border border-border/60 rounded-2xl p-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
                <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
              </div>
            </div>
          ) : isPremium ? (
            <div className="bg-gradient-to-br from-primary/8 via-amber-500/5 to-transparent border border-primary/25 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />

              {/* Expiring soon banner */}
              {isExpiringSoon && (
                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-400/30 rounded-xl px-3 py-2 mb-4 text-amber-700 dark:text-amber-400 text-xs font-medium">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  Your access expires in {daysLeft} day{daysLeft !== 1 ? "s" : ""}.{" "}
                  <a href={buyUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 ml-0.5">
                    Renew to keep your progress →
                  </a>
                </div>
              )}

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <Crown className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-foreground text-lg">Premium</p>
                    <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      <Sparkles className="w-3 h-3" /> Active
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Full access to all 6 HSK levels</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2.5 bg-card/60 rounded-xl px-3 py-2.5">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Started</p>
                    <p className="text-xs font-semibold text-foreground mt-0.5">
                      {formatDate(subscription?.starts_at ?? profile?.premium_granted_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 bg-card/60 rounded-xl px-3 py-2.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Expires</p>
                    <p className={cn(
                      "text-xs font-semibold mt-0.5",
                      isExpiringSoon ? "text-amber-600 dark:text-amber-400" : "text-foreground"
                    )}>
                      {subscription?.expires_at ? formatDate(subscription.expires_at) : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 bg-card/60 rounded-xl px-3 py-2.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Via</p>
                    <p className="text-xs font-semibold text-foreground mt-0.5">
                      {formatSource(profile?.premium_source)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Renewal CTA for expiring-soon users */}
              {isExpiringSoon && (
                <div className="mt-4">
                  <a
                    href={buyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
                  >
                    Renew for another year — $9.99
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card border border-border/60 rounded-2xl p-6">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-bold text-foreground text-lg mb-0.5">Free Plan</p>
                  <p className="text-sm text-muted-foreground">All levels locked — upgrade to unlock everything</p>
                </div>
              </div>
              <a
                href={buyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
              >
                Get full access — $9.99/year
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </motion.div>

        {/* What's included */}
        <motion.div custom={2} variants={fade} initial="hidden" animate="show"
          className="bg-card border border-border/60 rounded-2xl p-5 sm:p-6"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
            {isPremium ? "Your Access Includes" : "What's Included"}
          </p>
          <ul className="space-y-3">
            {[
              "All 6 HSK levels — 5,000+ vocabulary words",
              "Full flashcard decks with category filtering",
              "Phrase practice for every level",
              "Quizzes and level exams",
              "Spaced repetition review",
              "Exam-based progression system",
              "$9.99/year · no auto-renewal · cancel anytime",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm">
                <CheckCircle2 className={cn("w-4 h-4 shrink-0", isPremium ? "text-primary" : "text-muted-foreground/50")} />
                <span className={isPremium ? "text-foreground" : "text-muted-foreground"}>{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* License activation — only for free users */}
        {!isPremium && (
          <motion.div custom={3} variants={fade} initial="hidden" animate="show">
            <LicenseActivationPanel onSuccess={() => {
              qc.invalidateQueries({ queryKey: ["profile"] });
              qc.invalidateQueries({ queryKey: ["billing-status"] });
            }} />
          </motion.div>
        )}

        {/* Email sync — only for free users */}
        {!isPremium && (
          <motion.div custom={4} variants={fade} initial="hidden" animate="show"
            className="bg-card border border-border/60 rounded-2xl p-5"
          >
            <p className="text-sm font-semibold text-foreground mb-1">Purchased with this email?</p>
            <p className="text-xs text-muted-foreground mb-4">
              If you paid with the same email you signed up with, we can activate your access automatically — no key needed.
            </p>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors disabled:opacity-60"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", syncing && "animate-spin")} />
              {syncing ? "Checking…" : "Check my purchase"}
            </button>
            {syncMsg && (
              <div className={cn(
                "flex items-center gap-2 mt-2.5 text-xs px-3 py-2 rounded-lg",
                syncMsg.ok
                  ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                  : "text-muted-foreground bg-muted/50"
              )}>
                {syncMsg.ok && <CheckCircle2 className="w-3.5 h-3.5" />}
                {syncMsg.text}
              </div>
            )}
          </motion.div>
        )}

        {/* Premium users: renew section (not expiring soon) */}
        {isPremium && !isExpiringSoon && subscription?.expires_at && (
          <motion.div custom={4} variants={fade} initial="hidden" animate="show"
            className="bg-card border border-border/60 rounded-2xl p-5"
          >
            <p className="text-sm font-semibold text-foreground mb-1">Renew your access</p>
            <p className="text-xs text-muted-foreground mb-4">
              Your access is active until {formatDate(subscription.expires_at)}. Renew early and the extra year stacks on top — you won't lose any time.
            </p>
            <a
              href={buyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors"
            >
              Renew for another year — $9.99
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </motion.div>
        )}

      </div>
    </PageShell>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Copy, Check, Users, Gift, ExternalLink, ChevronRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { PageShell } from "@/components/PageShell";
import { buildGumroadUrl } from "@/lib/gumroad";
import { cn } from "@/lib/utils";

interface ReferralData {
  referral_code: string;
  referral_count: number;
}

const fade = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.08, ease: "easeOut" as const },
  }),
};

export default function AffiliatePage() {
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery<ReferralData>({
    queryKey: ["referral"],
    queryFn: () => apiFetch<ReferralData>("/api/referral"),
  });

  const referralCode = data?.referral_code ?? "";
  const referralCount = data?.referral_count ?? 0;
  const referralLink = referralCode
    ? buildGumroadUrl(null, referralCode)
    : buildGumroadUrl();

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <PageShell title="Affiliate Program" maxWidth="md">
      <div className="flex flex-col gap-6 pb-10">

        {/* Header */}
        <motion.div custom={0} variants={fade} initial="hidden" animate="show">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground leading-tight mb-2">
            Refer & Earn
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-lg">
            Share Hanplay with friends and language learners. Every time someone purchases using your link, you earn credit — and help someone start their Chinese journey.
          </p>
        </motion.div>

        {/* How it works */}
        <motion.div custom={1} variants={fade} initial="hidden" animate="show"
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          {[
            { icon: ExternalLink, label: "Share your link", body: "Send your unique referral link to friends or share it publicly." },
            { icon: Users, label: "They purchase", body: "When they buy Hanplay Premium using your link, it gets tracked automatically." },
            { icon: Gift, label: "You earn credit", body: "Your referral count grows with every confirmed purchase." },
          ].map(({ icon: Icon, label, body }, i) => (
            <div key={i} className="bg-card border border-border/60 rounded-2xl p-5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <p className="font-semibold text-foreground text-sm mb-1">{label}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </motion.div>

        {/* Stats card */}
        <motion.div custom={2} variants={fade} initial="hidden" animate="show"
          className="bg-card border border-border/60 rounded-2xl p-5 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground tabular-nums leading-none">
              {isLoading ? "—" : referralCount}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {referralCount === 1 ? "Confirmed referral" : "Confirmed referrals"}
            </p>
          </div>
        </motion.div>

        {/* Referral code */}
        <motion.div custom={3} variants={fade} initial="hidden" animate="show"
          className="bg-card border border-border/60 rounded-2xl p-5 sm:p-6 flex flex-col gap-4"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Your Referral Code</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-muted/50 border border-border/60 rounded-xl px-4 py-3">
                <p className="font-mono font-bold text-lg text-foreground tracking-widest">
                  {isLoading ? "Loading…" : referralCode || "—"}
                </p>
              </div>
              <button
                onClick={handleCopyCode}
                disabled={isLoading || !referralCode}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all shrink-0",
                  copied
                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-200 dark:border-emerald-800"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20"
                )}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          <div className="border-t border-border/40 pt-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Your Referral Link</p>
            <div className="flex items-center gap-2 bg-muted/50 border border-border/60 rounded-xl px-4 py-3 mb-3">
              <p className="text-xs text-muted-foreground truncate flex-1 font-mono">
                {isLoading ? "Loading…" : referralLink}
              </p>
            </div>
            <button
              onClick={handleCopyLink}
              disabled={isLoading || !referralCode}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy Full Link
            </button>
          </div>
        </motion.div>

        {/* Tip */}
        <motion.div custom={4} variants={fade} initial="hidden" animate="show"
          className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4 flex items-start gap-3"
        >
          <Gift className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            <span className="font-semibold">Pro tip:</span> Share your link in language learning communities, social media bios, or with study partners. Referrals are tracked automatically when someone clicks your link before purchasing.
          </p>
        </motion.div>

        {/* CTA to purchase page */}
        <motion.div custom={5} variants={fade} initial="hidden" animate="show">
          <a
            href={referralLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 w-full bg-card border border-border/60 rounded-2xl p-4 hover:border-primary/30 hover:shadow-md transition-all group"
          >
            <div>
              <p className="text-sm font-semibold text-foreground">View your purchase page</p>
              <p className="text-xs text-muted-foreground mt-0.5">Opens your referral link on Gumroad</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </a>
        </motion.div>

      </div>
    </PageShell>
  );
}

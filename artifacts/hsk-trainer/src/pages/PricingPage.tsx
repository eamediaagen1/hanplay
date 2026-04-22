import { useLocation } from "wouter";
import { CheckCircle2, ArrowLeft, Zap, HelpCircle } from "lucide-react";
import { buildGumroadUrl } from "@/lib/gumroad";
import { getStoredReferralCode } from "@/hooks/use-referral-capture";
import { useBranding, pickLogo } from "@/hooks/use-branding";
import { useTheme } from "@/hooks/use-theme";

const BENEFITS = [
  "All 6 HSK levels — 5,000+ words and growing",
  "Full flashcard decks and phrase practice for every level",
  "Quizzes, level exams, and spaced repetition",
  "Exam-based progression system",
  "1 year of access · no auto-renewal · no surprise charges",
];

const FAQS = [
  {
    q: "What do I get with Premium?",
    a: "Full access to all 6 HSK levels — over 5,000 vocabulary words, all quizzes, phrase practice, and the level progression system. Everything unlocked from day one.",
  },
  {
    q: "Is this a subscription?",
    a: "$9.99 unlocks one full year of access. There's no auto-renewal or recurring charge — just repurchase when you're ready to continue.",
  },
  {
    q: "What if I already purchased?",
    a: "Sign in and go to Membership. You can enter your license key or use the email sync option to restore access in seconds.",
  },
  {
    q: "Do you offer refunds?",
    a: "Yes. If Hanplay isn't right for you, reach out within 30 days of purchase and we'll issue a full refund — no questions asked.",
  },
];

export default function PricingPage() {
  const [, navigate] = useLocation();
  const { data: brandAssets } = useBranding();
  const { theme } = useTheme();
  const logoContext = theme === "dark" ? "light" : "dark";
  const logoUrl = pickLogo(brandAssets, logoContext) ?? pickLogo(brandAssets, "default");

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Nav */}
      <nav className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            {logoUrl
              ? <img src={logoUrl} alt="Hanplay" className="h-6 w-auto object-contain" />
              : <div className="w-6 h-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-serif font-bold text-sm">汉</div>
            }
            {!logoUrl && <span className="font-bold text-sm hidden sm:block">Hanplay</span>}
          </div>
          <button
            onClick={() => navigate("/app")}
            className="text-sm font-semibold text-primary hover:underline"
          >
            Sign in
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 sm:py-24">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-foreground leading-tight">
            One plan. Everything unlocked.
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            All 6 HSK levels for $9.99/year. No subscriptions. No surprises.
          </p>
        </div>

        {/* Plan card */}
        <div className="bg-card border-2 border-primary rounded-3xl p-8 shadow-xl shadow-primary/10 relative overflow-hidden">

          {/* Glow accent */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

          <div className="relative">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4">
              <Zap className="w-3 h-3 fill-current" />
              Premium — Full Access
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-5xl font-bold text-foreground">$9.99</span>
              <span className="text-lg text-muted-foreground font-medium">/ year</span>
            </div>
            <p className="text-sm text-muted-foreground mb-8">
              1 full year of access. No auto-renewal. No surprise charges.
            </p>

            {/* Benefits */}
            <ul className="space-y-3 mb-8">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">{b}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <a
              href={buildGumroadUrl(null, getStoredReferralCode())}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-primary text-primary-foreground font-bold text-base shadow-lg shadow-primary/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200"
            >
              Get full access — $9.99/year
            </a>

            <p className="text-center text-xs text-muted-foreground mt-3">
              Secure checkout · Instant access · 30-day money-back guarantee
            </p>
          </div>
        </div>

        {/* Demo note */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Not sure yet?{" "}
            <button
              onClick={() => navigate("/demo")}
              className="text-primary font-semibold hover:underline"
            >
              Try the demo first
            </button>
            {" "}— no account needed.
          </p>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-lg font-bold text-foreground">Common questions</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <div key={faq.q} className="bg-card border border-border/60 rounded-2xl p-5">
                <p className="font-semibold text-foreground text-sm mb-1.5">{faq.q}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trust footer */}
        <p className="text-center text-xs text-muted-foreground mt-12">
          Have a question before buying?{" "}
          <a href="mailto:contact@hanplay.online" className="text-primary underline underline-offset-2">
            contact@hanplay.online
          </a>
          . We offer a 30-day full refund — no questions asked.
        </p>
      </div>
    </div>
  );
}

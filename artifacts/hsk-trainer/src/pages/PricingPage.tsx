import { useLocation } from "wouter";
import { CheckCircle2, ArrowLeft, Zap, HelpCircle } from "lucide-react";
import { buildGumroadUrl } from "@/lib/gumroad";
import { getStoredReferralCode } from "@/hooks/use-referral-capture";

const BENEFITS = [
  "Access to all HSK levels — HSK 1 through HSK 6",
  "Full flashcard decks and phrase practice for every level",
  "All quizzes and level exams",
  "Spaced repetition progress tracking",
  "Level progression system — pass exams to advance",
  "Lifetime access — no subscription, pay once",
];

const FAQS = [
  {
    q: "Is HSK 1 really free?",
    a: "Yes. HSK 1 (150 words) is completely free with no account required in demo mode, and free for all registered users.",
  },
  {
    q: "What do I get with Premium?",
    a: "Full access to all 6 HSK levels — over 5,000 words, all quizzes, phrases, and the level progression system.",
  },
  {
    q: "Is this a subscription?",
    a: "No. It's a one-time payment. You pay once and keep access forever.",
  },
  {
    q: "What if I already purchased?",
    a: "Sign in and use the 'Already purchased?' button on your dashboard to sync your access.",
  },
];

export default function PricingPage() {
  const [, navigate] = useLocation();

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
            <div className="w-6 h-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-serif font-bold text-sm">
              汉
            </div>
            <span className="font-bold text-sm hidden sm:block">HSK Trainer</span>
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
            Simple Pricing
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            One plan. One payment. Lifetime access.
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
              <span className="text-5xl font-bold text-foreground">$29</span>
              <span className="text-lg text-muted-foreground font-medium">one-time</span>
            </div>
            <p className="text-sm text-muted-foreground mb-8">
              No subscription. No renewals. Yours forever.
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
              href={buildGumroadUrl(getStoredReferralCode())}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-primary text-primary-foreground font-bold text-base shadow-lg shadow-primary/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200"
            >
              Get Full Access
            </a>

            <p className="text-center text-xs text-muted-foreground mt-3">
              Secure checkout via Gumroad · Instant delivery
            </p>
          </div>
        </div>

        {/* Free tier note */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Want to try first?{" "}
            <button
              onClick={() => navigate("/demo")}
              className="text-primary font-semibold hover:underline"
            >
              Try the free HSK 1 demo
            </button>{" "}
            — no account needed.
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

        {/* Trust */}
        <p className="text-center text-xs text-muted-foreground mt-12">
          Have questions? Reach out before purchasing.
          Satisfaction matters — if Premium doesn't work for you, we'll make it right.
        </p>
      </div>
    </div>
  );
}

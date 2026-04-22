import { useEffect, useRef, useCallback, useState } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { captureReferralCode } from "@/hooks/use-referral-capture";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import MarketingPage    from "@/pages/MarketingPage";
import OnboardingPage   from "@/pages/OnboardingPage";
import PricingPage      from "@/pages/PricingPage";
import ChineseThemesPage         from "@/pages/ChineseThemesPage";
import ChineseThemesCategoryPage from "@/pages/ChineseThemesCategoryPage";
import LandingPage      from "@/pages/LandingPage";
import AuthCallback     from "@/pages/AuthCallback";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage  from "@/pages/ResetPasswordPage";
import DemoPage         from "@/pages/DemoPage";
import DashboardPage    from "@/pages/DashboardPage";
import FlashcardPage    from "@/pages/FlashcardPage";
import ReviewPage       from "@/pages/ReviewPage";
import QuizPage         from "@/pages/QuizPage";
import PhrasesPage      from "@/pages/PhrasesPage";
import StrokesPage      from "@/pages/StrokesPage";
import SettingsPage     from "@/pages/SettingsPage";
import MembershipPage   from "@/pages/MembershipPage";
import BillingSuccessPage from "@/pages/BillingSuccessPage";
import BillingRestorePage from "@/pages/BillingRestorePage";
import AffiliatePage    from "@/pages/AffiliatePage";
import MaintenancePage  from "@/pages/MaintenancePage";
import AdminPage        from "@/pages/AdminPage";
import AdminLoginPage   from "@/pages/AdminLoginPage";
import { AppShell }     from "@/components/AppShell";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { DynamicFavicon } from "@/components/DynamicFavicon";

const queryClient = new QueryClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Full-page loading spinner shown while auth state is resolving. */
function FullPageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-10 h-10 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

/**
 * Renders a spinner and immediately navigates to `to`.
 * Using a spinner prevents any flash of the wrong page content while the
 * one-tick useEffect runs.
 */
function Redirect({ to }: { to: string }) {
  const [, navigate] = useLocation();
  useEffect(() => { navigate(to); }, [to, navigate]);
  return <FullPageSpinner />;
}

// ─── Top-level router ────────────────────────────────────────────────────────

/** Captures ?ref=CODE from the URL on every navigation into localStorage. */
function ReferralCaptureEffect() {
  const [location] = useLocation();
  useEffect(() => { captureReferralCode(); }, [location]);
  return null;
}

/**
 * Clears the entire React Query cache whenever the authenticated user changes
 * (sign-out, or switching accounts). This ensures stale user-specific data
 * from a previous session never leaks into the next user's view.
 */
function CacheClearEffect() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    // Skip the initial render (undefined → null/id is not a "switch")
    if (prevUserIdRef.current === undefined) {
      prevUserIdRef.current = user?.id ?? null;
      return;
    }
    // Clear cache whenever the user identity changes (logout or account switch)
    if (prevUserIdRef.current !== (user?.id ?? null)) {
      qc.clear();
    }
    prevUserIdRef.current = user?.id ?? null;
  }, [user?.id, qc]);

  return null;
}

/**
 * Centralised route → component mapping with explicit auth guards.
 *
 * Auth guard matrix (all synchronous after loading resolves):
 *   /              → always public (marketing)
 *   /demo          → always public
 *   /auth/callback → always public (handles token exchange)
 *   /app           → signed-in  → /dashboard   |  signed-out → LandingPage
 *   /admin/*       → AdminPage / AdminLoginPage handle their own auth
 *   everything else → signed-in → AppShell     |  signed-out → /app
 */
function Router() {
  const [location] = useLocation();
  const { user, loading } = useAuth();

  // ── 1. Auth callback — render immediately regardless of auth state ─────────
  if (location.startsWith("/auth/callback")) {
    return <AuthCallback />;
  }

  // ── 2. True public pages — no auth needed, always render instantly ─────────
  const publicPaths = ["/", "/demo", "/pricing", "/maintenance", "/forgot-password", "/reset-password"];
  if (publicPaths.includes(location)) {
    return (
      <Switch>
        <Route path="/"                  component={MarketingPage} />
        <Route path="/demo"              component={DemoPage} />
        <Route path="/pricing"           component={PricingPage} />
        <Route path="/maintenance"       component={MaintenancePage} />
        <Route path="/forgot-password"   component={ForgotPasswordPage} />
        <Route path="/reset-password"    component={ResetPasswordPage} />
      </Switch>
    );
  }

  // ── 3. All remaining routes need auth state resolved first ─────────────────
  if (loading) return <FullPageSpinner />;

  // ── 4. Admin routes — AdminPage / AdminLoginPage manage their own auth ─────
  if (location.startsWith("/admin/login")) return <AdminLoginPage />;
  if (location.startsWith("/admin"))       return <AdminPage />;

  // ── 5. Login / landing page ───────────────────────────────────────────────
  if (location === "/app") {
    // Signed-in user visiting the login page → send to dashboard immediately
    if (user) return <Redirect to="/dashboard" />;
    return <LandingPage />;
  }

  // ── 6. All other routes are protected ────────────────────────────────────
  if (!user) return <Redirect to="/app" />;

  return <AuthenticatedApp />;
}

const ONBOARDING_LS_KEY = "hanplay_onboarding_v1";

function AuthenticatedApp() {
  const qc = useQueryClient();
  const [, navigate] = useLocation();

  // Use state so changing it re-renders without a full page reload
  const [localDone, setLocalDone] = useState(
    () => localStorage.getItem(ONBOARDING_LS_KEY) === "done"
  );

  const { data: onboardingData, isLoading: onboardingLoading, isError: onboardingError } = useQuery({
    queryKey: ["onboarding"],
    queryFn: () => apiFetch<{ completed: boolean }>("/api/onboarding"),
    enabled: !localDone,
    staleTime: Infinity,
    // On any error (table missing, network down), never block the app
    retry: false,
  });

  // Derive whether onboarding is needed — must be computed before any hooks
  const showOnboarding =
    !localDone &&
    !onboardingError &&
    onboardingData !== undefined &&
    onboardingData.completed === false;

  // Stamp localStorage the first time we pass through without needing onboarding.
  // ALL hooks must be declared before any conditional returns.
  useEffect(() => {
    if (!localDone && !onboardingLoading && !showOnboarding) {
      localStorage.setItem(ONBOARDING_LS_KEY, "done");
      setLocalDone(true);
    }
  }, [localDone, onboardingLoading, showOnboarding]);

  /** Called by OnboardingPage when the user completes or skips the form.
   *  NO full-page reload — we update React Query cache + local state so the
   *  AppShell renders in the same React tree immediately. */
  const handleOnboardingComplete = useCallback(() => {
    localStorage.setItem(ONBOARDING_LS_KEY, "done");
    setLocalDone(true);
    // Seed the cache so the useQuery above doesn't refetch
    qc.setQueryData(["onboarding"], { completed: true });
    // Ensure we land on the dashboard
    navigate("/dashboard");
  }, [qc, navigate]);

  // All hooks declared above — now safe to early-return
  if (!localDone && onboardingLoading) return <FullPageSpinner />;

  if (showOnboarding) {
    return <OnboardingPage onComplete={handleOnboardingComplete} />;
  }

  return (
    <AppShell>
      <Switch>
        <Route path="/dashboard"         component={DashboardPage} />
        <Route path="/levels"            component={() => <Redirect to="/dashboard" />} />
        <Route path="/progress"          component={() => <Redirect to="/dashboard" />} />
        <Route path="/flashcards/:level" component={FlashcardPage} />
        <Route path="/quiz/:level"       component={QuizPage} />
        <Route path="/review"            component={ReviewPage} />
        <Route path="/phrases/:level"    component={PhrasesPage} />
        <Route path="/phrases"           component={PhrasesPage} />
        <Route path="/strokes"           component={StrokesPage} />
        <Route path="/chinese-themes/:category" component={ChineseThemesCategoryPage} />
        <Route path="/chinese-themes"           component={ChineseThemesPage} />
        <Route path="/settings"          component={SettingsPage} />
        <Route path="/membership"        component={MembershipPage} />
        <Route path="/billing/success"   component={BillingSuccessPage} />
        <Route path="/billing/restore"   component={BillingRestorePage} />
        <Route path="/affiliate"         component={AffiliatePage} />
        <Route component={NotFound} />
      </Switch>
    </AppShell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DynamicFavicon />
      <AuthProvider>
        <CacheClearEffect />
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <ReferralCaptureEffect />
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

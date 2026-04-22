import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";

/**
 * /auth/callback
 *
 * Supabase redirects here after:
 *   - Magic link click (SIGNED_IN event)
 *   - Email confirmation after signup (SIGNED_IN event)
 *   - Password reset link click (PASSWORD_RECOVERY event)
 *
 * The SDK automatically exchanges the URL hash tokens for a session.
 * We inspect the event type and route accordingly:
 *   - PASSWORD_RECOVERY → /reset-password (user sets new password)
 *   - SIGNED_IN         → /dashboard (with optional data migration)
 */
export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          // Redirect to the reset password page — session is active so the
          // user can call updateUser({ password }) there.
          subscription.unsubscribe();
          setLocation("/reset-password");
          return;
        }

        if (event === "SIGNED_IN" && session) {
          // Migrate spaced-repetition data from localStorage (fire-and-forget)
          try {
            const raw = localStorage.getItem("hsk_saved_cards");
            if (raw) {
              const cards = JSON.parse(raw) as Record<string, unknown>;
              if (Object.keys(cards).length > 0) {
                await apiFetch("/api/progress/migrate", {
                  method: "POST",
                  body: JSON.stringify({ saved_cards: cards }),
                });
                localStorage.removeItem("hsk_saved_cards");
              }
            }
          } catch {
            // Migration failure is non-fatal
          } finally {
            localStorage.removeItem("hsk_is_paid");
            localStorage.removeItem("hsk_email");
          }

          subscription.unsubscribe();
          setLocation("/dashboard");
        }
      }
    );

    // Fallback: if already signed in when this page loads (e.g. hard refresh)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        subscription.unsubscribe();
        setLocation("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-[3px] border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">Signing you in…</p>
      </div>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api";

export interface SubscriptionData {
  id: string;
  status: "active" | "expired" | "revoked";
  starts_at: string;
  expires_at: string;
  buyer_email: string | null;
  gumroad_sale_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface BillingStatus {
  premium: boolean;
  subscription: SubscriptionData | null;
}

/**
 * Returns the user's premium_access row, including exact expiry date.
 * Falls back gracefully if the table doesn't exist or returns an error.
 */
export function useSubscription() {
  const { user } = useAuth();

  const query = useQuery<BillingStatus>({
    queryKey: ["billing-status", user?.id],
    queryFn: () => apiFetch<BillingStatus>("/api/billing/status"),
    enabled: !!user,
    staleTime: 2 * 60 * 1000,  // 2 min
    retry: false,               // Non-fatal — app works without this
  });

  return {
    subscription: query.data?.subscription ?? null,
    isPremium: query.data?.premium ?? false,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

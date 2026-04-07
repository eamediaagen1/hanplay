import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

interface ReferralData {
  referral_code: string;
  referral_count: number; // purchase-attributed referrals only
}

export function useReferral() {
  const { user } = useAuth();

  const query = useQuery<ReferralData>({
    queryKey: ["referral", user?.id],
    queryFn: () => apiFetch<ReferralData>("/api/referral"),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  return {
    referralCode: query.data?.referral_code ?? null,
    referralCount: query.data?.referral_count ?? 0, // friends who completed a purchase
    isLoading: query.isLoading,
  };
}

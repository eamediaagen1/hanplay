import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

interface ReferralData {
  referral_code: string;
  referral_count: number; // purchase-attributed referrals only
}

export function useReferral() {
  const query = useQuery<ReferralData>({
    queryKey: ["referral"],
    queryFn: () => apiFetch<ReferralData>("/api/referral"),
    staleTime: 5 * 60 * 1000,
  });

  return {
    referralCode: query.data?.referral_code ?? null,
    referralCount: query.data?.referral_count ?? 0, // friends who completed a purchase
    isLoading: query.isLoading,
  };
}

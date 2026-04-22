import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
}

export function useStreak() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery<StreakData>({
    queryKey: ["streak", user?.id],
    queryFn: () => apiFetch<StreakData>("/api/streak"),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const pingMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ current_streak: number; longest_streak: number }>("/api/streak/ping", {
        method: "POST",
      }),
    onSuccess: (data) => {
      qc.setQueryData(["streak", user?.id], (old: StreakData | undefined) => ({
        ...(old ?? { last_active_date: null }),
        current_streak: data.current_streak,
        longest_streak: data.longest_streak,
      }));
    },
  });

  return {
    streak: query.data ?? { current_streak: 0, longest_streak: 0, last_active_date: null },
    isLoading: query.isLoading,
    ping: pingMutation.mutate,
  };
}

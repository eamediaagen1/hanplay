import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useCallback, useRef } from "react";

export interface FlashcardPosition {
  category: string | null;
  last_index: number;
  last_word_id: string | null;
  updated_at?: string;
}

export interface LatestFlashcardPosition extends FlashcardPosition {
  level: number;
}

interface SavePositionPayload {
  level: number;
  category: string | null;
  last_index: number;
  last_word_id?: string | null;
}

// Hook for FlashcardPage — fetch + save position for a specific level.
// Query key includes user.id so data never leaks between accounts.
export function useFlashcardPosition(level: number) {
  const { user } = useAuth();

  const query = useQuery<FlashcardPosition | null>({
    queryKey: ["flashcard-position", user?.id, level],
    queryFn: () =>
      apiFetch<FlashcardPosition | null>(`/api/flashcard-position?level=${level}`).catch(() => null),
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: SavePositionPayload) =>
      apiFetch("/api/flashcard-position", { method: "POST", body: JSON.stringify(payload) }),
  });

  // Debounce ref so we don't spam the API on every card swipe
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const savePosition = useCallback(
    (payload: SavePositionPayload) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        saveMutation.mutate(payload);
      }, 800);
    },
    [saveMutation]
  );

  return {
    savedPosition: query.data ?? null,
    isLoading: query.isLoading,
    savePosition,
  };
}

// Hook for Dashboard — fetch the most recently updated position across all levels.
// Query key includes user.id so data never leaks between accounts.
export function useLatestFlashcardPosition() {
  const { user } = useAuth();

  const query = useQuery<LatestFlashcardPosition | null>({
    queryKey: ["flashcard-position-latest", user?.id],
    queryFn: () =>
      apiFetch<LatestFlashcardPosition | null>("/api/flashcard-position/latest").catch(() => null),
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    // Always fetch fresh on mount so the dashboard reflects the latest session
    refetchOnMount: true,
  });

  return {
    latestPosition: query.data ?? null,
    isLoading: query.isLoading,
  };
}

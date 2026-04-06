import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
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

// Hook for FlashcardPage — fetch + save position for a specific level
export function useFlashcardPosition(level: number) {
  const query = useQuery<FlashcardPosition | null>({
    queryKey: ["flashcard-position", level],
    queryFn: () =>
      apiFetch<FlashcardPosition | null>(`/api/flashcard-position?level=${level}`).catch(() => null),
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

// Hook for Dashboard — fetch the most recently updated position across all levels
export function useLatestFlashcardPosition() {
  const query = useQuery<LatestFlashcardPosition | null>({
    queryKey: ["flashcard-position-latest"],
    queryFn: () =>
      apiFetch<LatestFlashcardPosition | null>("/api/flashcard-position/latest").catch(() => null),
    staleTime: 2 * 60 * 1000,
  });

  return {
    latestPosition: query.data ?? null,
    isLoading: query.isLoading,
  };
}

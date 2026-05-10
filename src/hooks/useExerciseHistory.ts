/**
 * useExerciseHistory hook
 *
 * Provides summary data for exercise detail views.
 * Wraps ExerciseHistoryService for reactive UI consumption.
 *
 * Usage:
 *   const { summary, isLoading, fetchSummary } = useExerciseHistory(historyService);
 */

import { useState, useCallback } from "react";
import type { ExerciseDetailSummary, ExerciseHistoryService } from "../types";

export interface UseExerciseHistoryResult {
  /** Exercise detail summary data */
  summary: ExerciseDetailSummary | null;
  /** Loading state */
  isLoading: boolean;
  /** Fetch summary for an exercise */
  fetchSummary: (exerciseBizKey: bigint) => Promise<void>;
  /** Clear current summary */
  clearSummary: () => void;
}

/**
 * Hook for exercise history data.
 */
export function useExerciseHistory(
  historyService: ExerciseHistoryService,
): UseExerciseHistoryResult {
  const [summary, setSummary] = useState<ExerciseDetailSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSummary = useCallback(
    async (exerciseBizKey: bigint) => {
      setIsLoading(true);
      try {
        const result = await historyService.getExerciseSummary(exerciseBizKey);
        setSummary(result);
      } catch {
        setSummary(null);
      } finally {
        setIsLoading(false);
      }
    },
    [historyService],
  );

  const clearSummary = useCallback(() => {
    setSummary(null);
  }, []);

  return {
    summary,
    isLoading,
    fetchSummary,
    clearSummary,
  };
}

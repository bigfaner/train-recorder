/**
 * useProgressiveOverload hook
 *
 * Provides suggestion data for the current exercise.
 * Wraps ProgressiveOverload service for reactive UI consumption.
 *
 * Usage:
 *   const { suggestion, isLoading, fetchSuggestion } = useProgressiveOverload(overloadService);
 */

import { useState, useCallback } from "react";
import type { OverloadSuggestion, ProgressiveOverload } from "../types";

export interface UseProgressiveOverloadResult {
  /** Current suggestion for the selected exercise */
  suggestion: OverloadSuggestion | null;
  /** Loading state */
  isLoading: boolean;
  /** Fetch suggestion for an exercise */
  fetchSuggestion: (
    exerciseBizKey: bigint,
    targetReps: number,
  ) => Promise<void>;
  /** Clear current suggestion */
  clearSuggestion: () => void;
}

/**
 * Hook for progressive overload suggestions.
 */
export function useProgressiveOverload(
  overloadService: ProgressiveOverload,
): UseProgressiveOverloadResult {
  const [suggestion, setSuggestion] = useState<OverloadSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSuggestion = useCallback(
    async (exerciseBizKey: bigint, targetReps: number) => {
      setIsLoading(true);
      try {
        const result = await overloadService.calculateSuggestion(
          exerciseBizKey,
          targetReps,
        );
        setSuggestion(result);
      } catch {
        setSuggestion(null);
      } finally {
        setIsLoading(false);
      }
    },
    [overloadService],
  );

  const clearSuggestion = useCallback(() => {
    setSuggestion(null);
  }, []);

  return {
    suggestion,
    isLoading,
    fetchSuggestion,
    clearSuggestion,
  };
}

/**
 * Feeling recording page.
 *
 * Post-workout feeling page displayed after workout completion.
 * Renders FeelingScreen with placeholder data for standalone mode.
 * In production, data flows from the completed workout session.
 */

import React, { useCallback } from "react";
import { useRouter } from "expo-router";
import { FeelingScreen } from "@components/feeling/FeelingScreen";
import type { WorkoutExercise, WorkoutSet } from "../src/types";

// Placeholder data for standalone/web mode
const PLACEHOLDER_EXERCISE_BIZ_KEY = BigInt(1);
const PLACEHOLDER_EXERCISE: WorkoutExercise = {
  id: 1,
  biz_key: BigInt(100),
  workout_session_biz_key: BigInt(1),
  exercise_biz_key: PLACEHOLDER_EXERCISE_BIZ_KEY,
  order_index: 0,
  exercise_status: "completed",
  exercise_note: null,
  target_sets: 3,
  target_reps: 8,
  suggested_weight: 60,
  exercise_mode: "fixed",
  created_at: "2026-05-10T10:00:00Z",
};

const PLACEHOLDER_SETS: WorkoutSet[] = [
  {
    id: 1,
    biz_key: BigInt(200),
    workout_exercise_biz_key: BigInt(100),
    set_index: 0,
    target_weight: 60,
    target_reps: 8,
    actual_weight: 60,
    actual_reps: 8,
    is_completed: 1,
    completed_at: "2026-05-10T10:00:00Z",
    is_target_met: 1,
  },
];

const PLACEHOLDER_SETS_MAP = new Map<bigint, WorkoutSet[]>([
  [BigInt(100), PLACEHOLDER_SETS],
]);

const PLACEHOLDER_EXERCISE_NAMES = {
  get: (bizKey: bigint) =>
    bizKey === PLACEHOLDER_EXERCISE_BIZ_KEY ? "深蹲" : undefined,
};

export default function FeelingPage() {
  const router = useRouter();

  const handleSave = useCallback(
    (_data: {
      fatigue: number;
      satisfaction: number;
      overallNote: string;
      exerciseNotes: Map<bigint, string>;
    }) => {
      // In production, saves feeling to DB
      // For now, navigate back
      router.back();
    },
    [router],
  );

  const handleSkip = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <FeelingScreen
      trainingType="push"
      exercises={[PLACEHOLDER_EXERCISE]}
      setsByExercise={PLACEHOLDER_SETS_MAP}
      exerciseNames={PLACEHOLDER_EXERCISE_NAMES}
      onSave={handleSave}
      onSkip={handleSkip}
    />
  );
}

/**
 * E2E Seed Route
 *
 * Navigating to /seed populates the SQLite database with test fixtures
 * so that e2e tests have pre-existing data (plans, workouts, measurements).
 *
 * The page shows a brief status message and redirects to / after seeding.
 * Idempotent: checks for existing data before inserting.
 */

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { getDatabase, getSnowflakeGenerator } from "../src/db/database";
import { createTrainingPlanRepo } from "../src/db/repositories/training-plan.repo";
import { createTrainingDayRepo } from "../src/db/repositories/training-day.repo";
import { createWorkoutSessionRepo } from "../src/db/repositories/workout-session.repo";
import { createWorkoutExerciseRepo } from "../src/db/repositories/workout-exercise.repo";
import { createWorkoutSetRepo } from "../src/db/repositories/workout-set.repo";
import { createBodyMeasurementRepo } from "../src/db/repositories/body-measurement.repo";
import { createFeelingRepo } from "../src/db/repositories/feeling.repo";
import { createExerciseFeelingRepo } from "../src/db/repositories/exercise-feeling.repo";
import { createPersonalRecordRepo } from "../src/db/repositories/personal-record.repo";
import type { DatabaseAdapter } from "../src/db/database-adapter";

function getDbAdapter(): DatabaseAdapter {
  return getDatabase() as unknown as DatabaseAdapter;
}

function seedDatabase(): string {
  const db = getDbAdapter();
  const snowflake = getSnowflakeGenerator();
  const now = new Date();

  // Check if already seeded
  const planRepo = createTrainingPlanRepo(db);
  const existing = planRepo.findActive();
  if (existing) {
    return "Already seeded";
  }

  // --- 1. Training Plan ---
  const planBizKey = BigInt(snowflake.generate());
  const plan = planRepo.createPlan({
    biz_key: planBizKey,
    plan_name: "PPL 无限循环",
    plan_mode: "infinite_loop",
    cycle_length: null,
    schedule_mode: "weekly_fixed",
    rest_days: 1,
    weekly_config: JSON.stringify({
      1: null, // Monday: rest
      2: "push",
      3: "pull",
      4: "legs",
      5: "push",
      6: "pull",
      7: "legs",
    }),
    is_active: 1,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  });

  // --- 2. Training Days (6 days for PPL split) ---
  const dayRepo = createTrainingDayRepo(db);
  const dayConfigs = [
    { name: "Push A", type: "push" as const, order: 1 },
    { name: "Pull A", type: "pull" as const, order: 2 },
    { name: "Legs A", type: "legs" as const, order: 3 },
    { name: "Push B", type: "push" as const, order: 4 },
    { name: "Pull B", type: "pull" as const, order: 5 },
    { name: "Legs B", type: "legs" as const, order: 6 },
  ];
  const _days = dayConfigs.map((cfg) =>
    dayRepo.createDay({
      biz_key: BigInt(snowflake.generate()),
      plan_biz_key: plan.biz_key,
      day_name: cfg.name,
      training_type: cfg.type,
      order_index: cfg.order,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    }),
  );

  // --- 3. Workout Sessions (4 completed sessions in past days) ---
  const sessionRepo = createWorkoutSessionRepo(db);
  const exerciseRepo = createWorkoutExerciseRepo(db);
  const setRepo = createWorkoutSetRepo(db);
  const feelingRepo = createFeelingRepo(db);
  const exerciseFeelingRepo = createExerciseFeelingRepo(db);
  const prRepo = createPersonalRecordRepo(db);

  // Exercise biz_keys for squat/bench/deadlift (built-in, from schema seed)
  // These match the BUILTIN_EXERCISES order in schema.ts
  // We query the actual DB to get the real biz_keys
  const exercises = db.getAllSync<{ biz_key: number; exercise_name: string }>(
    "SELECT biz_key, exercise_name FROM exercises WHERE is_deleted = 0 LIMIT 10",
  );
  const exerciseMap = new Map(
    exercises.map((e) => [e.exercise_name, BigInt(e.biz_key)]),
  );

  // Fallback: if built-in exercises not found, create some
  if (exerciseMap.size === 0) {
    const fallbackNames = ["深蹲", "卧推", "硬拉"];
    for (const name of fallbackNames) {
      const bizKey = BigInt(snowflake.generate());
      db.runSync(
        `INSERT OR IGNORE INTO exercises (biz_key, exercise_name, category, increment, default_rest, is_custom, is_deleted, created_at, updated_at)
         VALUES (?, ?, 'core_powerlifting', 2.5, 300, 0, 0, ?, ?)`,
        [Number(bizKey), name, now.toISOString(), now.toISOString()],
      );
      exerciseMap.set(name, bizKey);
    }
  }

  // Get the squat/bench/deadlift biz_keys
  const squatBizKey = exerciseMap.get("深蹲") ?? BigInt(snowflake.generate());
  const benchBizKey = exerciseMap.get("卧推") ?? BigInt(snowflake.generate());
  const deadliftBizKey =
    exerciseMap.get("硬拉") ?? BigInt(snowflake.generate());

  // Create 4 completed workout sessions over the past 7 days
  const sessionData = [
    {
      daysAgo: 1,
      type: "push" as const,
      exercises: [benchBizKey],
      weights: [60],
      reps: [5],
    },
    {
      daysAgo: 2,
      type: "pull" as const,
      exercises: [deadliftBizKey],
      weights: [100],
      reps: [3],
    },
    {
      daysAgo: 3,
      type: "legs" as const,
      exercises: [squatBizKey],
      weights: [80],
      reps: [5],
    },
    {
      daysAgo: 5,
      type: "push" as const,
      exercises: [benchBizKey],
      weights: [57.5],
      reps: [5],
    },
  ];

  for (const sd of sessionData) {
    const sessionDate = new Date(now.getTime() - sd.daysAgo * 86400000)
      .toISOString()
      .slice(0, 10);
    const startedAt = new Date(
      now.getTime() - sd.daysAgo * 86400000,
    ).toISOString();
    const endedAt = new Date(
      now.getTime() - sd.daysAgo * 86400000 + 3600000,
    ).toISOString();

    const session = sessionRepo.createSession({
      biz_key: BigInt(snowflake.generate()),
      session_date: sessionDate,
      training_type: sd.type,
      session_status: "completed",
      started_at: startedAt,
      ended_at: endedAt,
      is_backlog: 0,
      created_at: startedAt,
      updated_at: endedAt,
    });

    // Create workout exercises and sets for each exercise in this session
    for (let ei = 0; ei < sd.exercises.length; ei++) {
      const exerciseBizKey = sd.exercises[ei];
      const weight = sd.weights[ei];
      const targetReps = sd.reps[ei];

      const workoutExercise = exerciseRepo.createExercise({
        biz_key: BigInt(snowflake.generate()),
        workout_session_biz_key: session.biz_key,
        exercise_biz_key: exerciseBizKey,
        order_index: ei,
        exercise_status: "completed",
        exercise_note: null,
        suggested_weight: weight,
        target_sets: 3,
        target_reps: targetReps,
        exercise_mode: "fixed",
        created_at: startedAt,
      });

      // Create 3 completed sets
      for (let setIdx = 0; setIdx < 3; setIdx++) {
        setRepo.createSet({
          biz_key: BigInt(snowflake.generate()),
          workout_exercise_biz_key: workoutExercise.biz_key,
          set_index: setIdx,
          target_weight: weight,
          target_reps: targetReps,
          actual_weight: weight,
          actual_reps: targetReps,
          is_completed: 1,
          completed_at: endedAt,
          is_target_met: 1,
        });
      }
    }

    // --- 4. Feelings for 2 of the sessions ---
    if (sd.daysAgo === 1 || sd.daysAgo === 3) {
      const feeling = feelingRepo.createFeeling({
        biz_key: BigInt(snowflake.generate()),
        workout_session_biz_key: session.biz_key,
        fatigue_level: sd.daysAgo === 1 ? 7 : 5,
        satisfaction: sd.daysAgo === 1 ? 6 : 8,
        overall_note: "Good workout",
        created_at: endedAt,
        updated_at: endedAt,
      });

      // Exercise feelings
      for (const exBizKey of sd.exercises) {
        exerciseFeelingRepo.create({
          biz_key: BigInt(snowflake.generate()),
          feeling_biz_key: feeling.biz_key,
          exercise_biz_key: exBizKey,
          workout_exercise_biz_key: BigInt(0), // simplified for seed
          feeling_note: null,
          created_at: endedAt,
        });
      }
    }

    // --- 5. Personal Records for the best session ---
    if (sd.daysAgo === 2) {
      // Deadlift PR
      prRepo.create({
        biz_key: BigInt(snowflake.generate()),
        exercise_biz_key: deadliftBizKey,
        pr_type: "weight",
        pr_value: 100,
        pr_date: sessionDate,
        workout_set_biz_key: null,
        created_at: endedAt,
      });
    }
  }

  // --- 6. Body Measurements (3 entries over past week) ---
  const bodyRepo = createBodyMeasurementRepo(db);
  const bodyData = [
    { daysAgo: 1, weight: 75.5, chest: 100.0, waist: 82.0 },
    { daysAgo: 3, weight: 75.8, chest: 100.0, waist: 82.5 },
    { daysAgo: 6, weight: 76.0, chest: 99.5, waist: 83.0 },
  ];
  for (const bd of bodyData) {
    const date = new Date(now.getTime() - bd.daysAgo * 86400000)
      .toISOString()
      .slice(0, 10);
    bodyRepo.createMeasurement({
      biz_key: BigInt(snowflake.generate()),
      record_date: date,
      body_weight: bd.weight,
      chest_circumference: bd.chest,
      waist_circumference: bd.waist,
      arm_circumference: null,
      thigh_circumference: null,
      body_note: null,
      created_at: new Date(now.getTime() - bd.daysAgo * 86400000).toISOString(),
      updated_at: new Date(now.getTime() - bd.daysAgo * 86400000).toISOString(),
    });
  }

  return "Seed complete";
}

export default function SeedPage() {
  const [status, setStatus] = useState<string>("Seeding...");
  const router = useRouter();

  useEffect(() => {
    try {
      const result = seedDatabase();
      setStatus(result);
      // Redirect to home after a brief delay so Playwright can see the result
      const timer = setTimeout(() => {
        router.replace("/");
      }, 500);
      return () => clearTimeout(timer);
    } catch (e) {
      setStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [router]);

  return (
    <View style={styles.container}>
      <Text testID="seed-status">{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

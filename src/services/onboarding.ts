/**
 * Onboarding Service
 *
 * Provides plan templates for first-time users and manages onboarding state.
 * Templates are static/hardcoded data (not database records).
 *
 * State persisted in user_settings table under key 'onboarding_completed'.
 */

import type {
  PlanTemplate,
  OnboardingService,
  TrainingPlan,
  FixedSetsConfig,
} from "../types";
import type { DatabaseAdapter } from "../db/database-adapter";
import type { TrainingPlanRepo } from "../db/repositories/training-plan.repo";
import type { TrainingDayRepo } from "../db/repositories/training-day.repo";
import type { ExerciseRepo } from "../db/repositories/exercise.repo";
import type { PlanExerciseRepo } from "../db/repositories/plan-exercise.repo";
import type { UserSettingsRepo } from "../db/repositories/user-settings.repo";
import type { SnowflakeIdGenerator } from "./snowflake";

/**
 * Generate a batch of safe-integer biz_keys that won't lose precision
 * when converted to JS Number via toDbValue.
 * Uses offset from Date.now() to produce unique values within safe range.
 */
function generateSafeBizKeys(
  snowflake: SnowflakeIdGenerator,
  count: number,
): bigint[] {
  // Generate raw snowflake IDs, then mask to safe integer range.
  // We keep the lower 53 bits which are guaranteed unique per generator.
  const rawIds = snowflake.generateBatch(count);
  const MASK = (1n << 53n) - 1n; // MAX_SAFE_INTEGER bits
  return rawIds.map((id) => id & MASK);
}

// ============================================================
// Static Plan Templates
// ============================================================

export const TEMPLATES: PlanTemplate[] = [
  {
    templateId: "ppl",
    templateName: "推拉蹲 3日循环",
    description:
      "经典推/拉/蹲分化训练，每周3-4次，适合中级训练者。推日练胸+三头，拉日练背+二头，蹲日练腿。",
    planMode: "infinite_loop",
    scheduleMode: "weekly_fixed",
    days: [
      {
        dayName: "推日",
        trainingType: "push",
        exercises: [
          {
            exerciseName: "卧推",
            setsConfig: {
              mode: "fixed",
              target_reps: 5,
              target_weight: null,
              target_repeat: 4,
            } satisfies FixedSetsConfig,
          },
          {
            exerciseName: "上斜卧推",
            setsConfig: {
              mode: "fixed",
              target_reps: 8,
              target_weight: null,
              target_repeat: 3,
            } satisfies FixedSetsConfig,
          },
          {
            exerciseName: "哑铃飞鸟",
            setsConfig: {
              mode: "fixed",
              target_reps: 12,
              target_weight: null,
              target_repeat: 3,
            } satisfies FixedSetsConfig,
          },
          {
            exerciseName: "三头下压",
            setsConfig: {
              mode: "fixed",
              target_reps: 12,
              target_weight: null,
              target_repeat: 3,
            } satisfies FixedSetsConfig,
          },
        ],
      },
      {
        dayName: "拉日",
        trainingType: "pull",
        exercises: [
          {
            exerciseName: "硬拉",
            setsConfig: {
              mode: "fixed",
              target_reps: 5,
              target_weight: null,
              target_repeat: 4,
            } satisfies FixedSetsConfig,
          },
          {
            exerciseName: "杠铃划船",
            setsConfig: {
              mode: "fixed",
              target_reps: 8,
              target_weight: null,
              target_repeat: 3,
            } satisfies FixedSetsConfig,
          },
          {
            exerciseName: "引体向上",
            setsConfig: {
              mode: "fixed",
              target_reps: 8,
              target_weight: null,
              target_repeat: 3,
            } satisfies FixedSetsConfig,
          },
          {
            exerciseName: "二头弯举",
            setsConfig: {
              mode: "fixed",
              target_reps: 12,
              target_weight: null,
              target_repeat: 3,
            } satisfies FixedSetsConfig,
          },
        ],
      },
      {
        dayName: "蹲日",
        trainingType: "legs",
        exercises: [
          {
            exerciseName: "深蹲",
            setsConfig: {
              mode: "fixed",
              target_reps: 5,
              target_weight: null,
              target_repeat: 4,
            } satisfies FixedSetsConfig,
          },
          {
            exerciseName: "前蹲",
            setsConfig: {
              mode: "fixed",
              target_reps: 6,
              target_weight: null,
              target_repeat: 3,
            } satisfies FixedSetsConfig,
          },
          {
            exerciseName: "腿举",
            setsConfig: {
              mode: "fixed",
              target_reps: 10,
              target_weight: null,
              target_repeat: 3,
            } satisfies FixedSetsConfig,
          },
          {
            exerciseName: "腿弯举",
            setsConfig: {
              mode: "fixed",
              target_reps: 12,
              target_weight: null,
              target_repeat: 3,
            } satisfies FixedSetsConfig,
          },
        ],
      },
    ],
  },
  {
    templateId: "upper_lower",
    templateName: "上下肢 4日分化",
    description:
      "上下肢分化训练，每周4次，上肢日+下肢日交替进行，适合有一定基础的训练者。",
    planMode: "infinite_loop",
    scheduleMode: "weekly_fixed",
    days: [
      {
        dayName: "上肢日A",
        trainingType: "push",
        exercises: [
          {
            exerciseName: "卧推",
            setsConfig: {
              mode: "fixed",
              target_reps: 5,
              target_weight: null,
              target_repeat: 4,
            } satisfies FixedSetsConfig,
          },
          {
            exerciseName: "杠铃划船",
            setsConfig: {
              mode: "fixed",
              target_reps: 8,
              target_weight: null,
              target_repeat: 3,
            } satisfies FixedSetsConfig,
          },
          {
            exerciseName: "推举",
            setsConfig: {
              mode: "fixed",
              target_reps: 8,
              target_weight: null,
              target_repeat: 3,
            } satisfies FixedSetsConfig,
          },
        ],
      },
      {
        dayName: "下肢日A",
        trainingType: "legs",
        exercises: [
          {
            exerciseName: "深蹲",
            setsConfig: {
              mode: "fixed",
              target_reps: 5,
              target_weight: null,
              target_repeat: 4,
            } satisfies FixedSetsConfig,
          },
          {
            exerciseName: "罗马尼亚硬拉",
            setsConfig: {
              mode: "fixed",
              target_reps: 8,
              target_weight: null,
              target_repeat: 3,
            } satisfies FixedSetsConfig,
          },
          {
            exerciseName: "腿举",
            setsConfig: {
              mode: "fixed",
              target_reps: 10,
              target_weight: null,
              target_repeat: 3,
            } satisfies FixedSetsConfig,
          },
        ],
      },
      {
        dayName: "上肢日B",
        trainingType: "pull",
        exercises: [
          {
            exerciseName: "硬拉",
            setsConfig: {
              mode: "fixed",
              target_reps: 5,
              target_weight: null,
              target_repeat: 4,
            } satisfies FixedSetsConfig,
          },
          {
            exerciseName: "上斜卧推",
            setsConfig: {
              mode: "fixed",
              target_reps: 8,
              target_weight: null,
              target_repeat: 3,
            } satisfies FixedSetsConfig,
          },
          {
            exerciseName: "引体向上",
            setsConfig: {
              mode: "fixed",
              target_reps: 8,
              target_weight: null,
              target_repeat: 3,
            } satisfies FixedSetsConfig,
          },
        ],
      },
      {
        dayName: "下肢日B",
        trainingType: "legs",
        exercises: [
          {
            exerciseName: "前蹲",
            setsConfig: {
              mode: "fixed",
              target_reps: 6,
              target_weight: null,
              target_repeat: 3,
            } satisfies FixedSetsConfig,
          },
          {
            exerciseName: "腿弯举",
            setsConfig: {
              mode: "fixed",
              target_reps: 12,
              target_weight: null,
              target_repeat: 3,
            } satisfies FixedSetsConfig,
          },
          {
            exerciseName: "卷腹",
            setsConfig: {
              mode: "fixed",
              target_reps: 15,
              target_weight: null,
              target_repeat: 3,
            } satisfies FixedSetsConfig,
          },
        ],
      },
    ],
  },
  {
    templateId: "full_body",
    templateName: "全身 3日训练",
    description:
      "每次训练全身主要肌群，每周3次，适合新手入门或时间有限的训练者。",
    planMode: "infinite_loop",
    scheduleMode: "weekly_fixed",
    days: [
      {
        dayName: "全身日A",
        trainingType: "custom",
        exercises: [
          {
            exerciseName: "深蹲",
            setsConfig: {
              mode: "fixed",
              target_reps: 5,
              target_weight: null,
              target_repeat: 4,
            } satisfies FixedSetsConfig,
          },
          {
            exerciseName: "卧推",
            setsConfig: {
              mode: "fixed",
              target_reps: 5,
              target_weight: null,
              target_repeat: 4,
            } satisfies FixedSetsConfig,
          },
          {
            exerciseName: "杠铃划船",
            setsConfig: {
              mode: "fixed",
              target_reps: 8,
              target_weight: null,
              target_repeat: 3,
            } satisfies FixedSetsConfig,
          },
        ],
      },
      {
        dayName: "全身日B",
        trainingType: "custom",
        exercises: [
          {
            exerciseName: "硬拉",
            setsConfig: {
              mode: "fixed",
              target_reps: 5,
              target_weight: null,
              target_repeat: 4,
            } satisfies FixedSetsConfig,
          },
          {
            exerciseName: "推举",
            setsConfig: {
              mode: "fixed",
              target_reps: 8,
              target_weight: null,
              target_repeat: 3,
            } satisfies FixedSetsConfig,
          },
          {
            exerciseName: "引体向上",
            setsConfig: {
              mode: "fixed",
              target_reps: 8,
              target_weight: null,
              target_repeat: 3,
            } satisfies FixedSetsConfig,
          },
        ],
      },
      {
        dayName: "全身日C",
        trainingType: "custom",
        exercises: [
          {
            exerciseName: "前蹲",
            setsConfig: {
              mode: "fixed",
              target_reps: 6,
              target_weight: null,
              target_repeat: 3,
            } satisfies FixedSetsConfig,
          },
          {
            exerciseName: "上斜卧推",
            setsConfig: {
              mode: "fixed",
              target_reps: 8,
              target_weight: null,
              target_repeat: 3,
            } satisfies FixedSetsConfig,
          },
          {
            exerciseName: "罗马尼亚硬拉",
            setsConfig: {
              mode: "fixed",
              target_reps: 8,
              target_weight: null,
              target_repeat: 3,
            } satisfies FixedSetsConfig,
          },
        ],
      },
    ],
  },
];

// ============================================================
// Onboarding Service Implementation
// ============================================================

const ONBOARDING_KEY = "onboarding_completed";

export type OnboardingServiceImpl = OnboardingService;

export function createOnboardingService(
  db: DatabaseAdapter,
  planRepo: TrainingPlanRepo,
  dayRepo: TrainingDayRepo,
  exerciseRepo: ExerciseRepo,
  planExerciseRepo: PlanExerciseRepo,
  userSettingsRepo: UserSettingsRepo,
  snowflake: SnowflakeIdGenerator,
): OnboardingServiceImpl {
  return {
    getTemplates(): PlanTemplate[] {
      return TEMPLATES;
    },

    createPlanFromTemplate(template: PlanTemplate): TrainingPlan {
      return db.withTransactionSync(() => {
        // Deactivate any currently active plan
        const activePlan = planRepo.findActive();
        if (activePlan) {
          planRepo.deactivatePlan(activePlan.id);
        }

        const now = new Date().toISOString();

        // Pre-compute total number of biz_keys needed:
        // 1 (plan) + N (days) + sum of exercise counts
        let totalIds = 1 + template.days.length;
        for (const day of template.days) {
          totalIds += day.exercises.length;
        }
        const bizKeys = generateSafeBizKeys(snowflake, totalIds);
        let keyIdx = 0;

        // Create the training plan
        const planBizKey = bizKeys[keyIdx++];
        const plan = planRepo.createPlan({
          biz_key: planBizKey,
          plan_name: template.templateName,
          plan_mode: template.planMode,
          cycle_length: null,
          schedule_mode: template.scheduleMode,
          rest_days: 1,
          weekly_config: null,
          is_active: 1,
          created_at: now,
          updated_at: now,
        });

        // Build a lookup of exercise name -> biz_key for resolution
        const allExercises = exerciseRepo.findAllActive();
        const exerciseLookup = new Map<string, bigint>();
        for (const ex of allExercises) {
          exerciseLookup.set(ex.exercise_name, ex.biz_key);
        }

        // Create training days and their exercises
        for (let dayIdx = 0; dayIdx < template.days.length; dayIdx++) {
          const templateDay = template.days[dayIdx];
          const dayBizKey = bizKeys[keyIdx++];

          const trainingDay = dayRepo.createDay({
            biz_key: dayBizKey,
            plan_biz_key: plan.biz_key,
            day_name: templateDay.dayName,
            training_type: templateDay.trainingType,
            order_index: dayIdx,
            created_at: now,
            updated_at: now,
          });

          // Create plan exercises for this day
          for (let exIdx = 0; exIdx < templateDay.exercises.length; exIdx++) {
            const templateEx = templateDay.exercises[exIdx];

            // Resolve exercise name to biz_key
            const exerciseBizKey = exerciseLookup.get(templateEx.exerciseName);

            if (!exerciseBizKey) {
              throw new Error(`Exercise not found: ${templateEx.exerciseName}`);
            }

            const exBizKey = bizKeys[keyIdx++];
            planExerciseRepo.createPlanExercise({
              biz_key: exBizKey,
              training_day_biz_key: trainingDay.biz_key,
              exercise_biz_key: exerciseBizKey,
              sets_config: JSON.stringify(templateEx.setsConfig),
              order_index: exIdx,
              exercise_note: null,
              created_at: now,
              updated_at: now,
            });
          }
        }

        return plan;
      });
    },

    isOnboardingComplete(): boolean {
      const value = userSettingsRepo.getValue(ONBOARDING_KEY);
      return value === "true";
    },

    markOnboardingComplete(): void {
      userSettingsRepo.setValue(ONBOARDING_KEY, "true");
    },

    resetOnboarding(): void {
      userSettingsRepo.setValue(ONBOARDING_KEY, "false");
    },
  };
}

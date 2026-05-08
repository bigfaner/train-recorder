/**
 * Tests for OnboardingService: template retrieval, plan creation from template,
 * and onboarding state management (isOnboardingComplete, markOnboardingComplete, resetOnboarding).
 */

import { createTestDb } from "../db/test-helpers";
import type { DatabaseAdapter } from "../../src/db/database-adapter";
import {
  createTrainingPlanRepo,
  type TrainingPlanRepo,
} from "../../src/db/repositories/training-plan.repo";
import {
  createTrainingDayRepo,
  type TrainingDayRepo,
} from "../../src/db/repositories/training-day.repo";
import {
  createPlanExerciseRepo,
  type PlanExerciseRepo,
} from "../../src/db/repositories/plan-exercise.repo";
import {
  createUserSettingsRepo,
  type UserSettingsRepo,
} from "../../src/db/repositories/user-settings.repo";
import {
  createExerciseRepo,
  type ExerciseRepo,
} from "../../src/db/repositories/exercise.repo";
import {
  createOnboardingService,
  type OnboardingServiceImpl,
} from "../../src/services/onboarding";
import { SnowflakeGenerator } from "../../src/services/snowflake";
import type { SetsConfig } from "../../src/types";

let db: DatabaseAdapter;
let planRepo: TrainingPlanRepo;
let dayRepo: TrainingDayRepo;
let exerciseRepo: ExerciseRepo;
let planExerciseRepo: PlanExerciseRepo;
let userSettingsRepo: UserSettingsRepo;
let service: OnboardingServiceImpl;

const now = new Date().toISOString();

// Use a unique machine ID for the entire test suite to avoid biz_key collisions
// across tests that run within the same millisecond.
let snowflakeGenerator: SnowflakeGenerator;

beforeAll(() => {
  snowflakeGenerator = new SnowflakeGenerator(42);
});

beforeEach(async () => {
  db = await createTestDb();
  planRepo = createTrainingPlanRepo(db);
  dayRepo = createTrainingDayRepo(db);
  exerciseRepo = createExerciseRepo(db);
  planExerciseRepo = createPlanExerciseRepo(db);
  userSettingsRepo = createUserSettingsRepo(db);
  service = createOnboardingService(
    db,
    planRepo,
    dayRepo,
    exerciseRepo,
    planExerciseRepo,
    userSettingsRepo,
    snowflakeGenerator,
  );

  // Seed built-in exercises so createPlanFromTemplate can resolve names
  seedExercises();
});

function seedExercises(): void {
  const exercises = [
    { name: "卧推", category: "core_powerlifting", increment: 2.5, rest: 300 },
    { name: "深蹲", category: "core_powerlifting", increment: 2.5, rest: 300 },
    { name: "硬拉", category: "core_powerlifting", increment: 2.5, rest: 300 },
    { name: "推举", category: "core_powerlifting", increment: 2.5, rest: 300 },
    {
      name: "上斜卧推",
      category: "upper_push",
      increment: 2.5,
      rest: 240,
    },
    {
      name: "哑铃飞鸟",
      category: "upper_push",
      increment: 2.5,
      rest: 240,
    },
    {
      name: "三头下压",
      category: "upper_push",
      increment: 2.5,
      rest: 180,
    },
    { name: "杠铃划船", category: "upper_pull", increment: 2.5, rest: 240 },
    { name: "引体向上", category: "upper_pull", increment: 2.5, rest: 240 },
    { name: "二头弯举", category: "upper_pull", increment: 2.5, rest: 180 },
    { name: "前蹲", category: "lower", increment: 2.5, rest: 300 },
    { name: "腿举", category: "lower", increment: 5.0, rest: 240 },
    {
      name: "罗马尼亚硬拉",
      category: "lower",
      increment: 2.5,
      rest: 300,
    },
    { name: "腿弯举", category: "lower", increment: 2.5, rest: 180 },
    { name: "卷腹", category: "core", increment: 2.5, rest: 120 },
  ];

  let bizKey = 1000n;
  for (const ex of exercises) {
    db.runSync(
      `INSERT INTO exercises (biz_key, exercise_name, category, increment, default_rest, is_custom, is_deleted, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?)`,
      [Number(bizKey), ex.name, ex.category, ex.increment, ex.rest, now, now],
    );
    bizKey += 1n;
  }
}

// ============================================================
// getTemplates()
// ============================================================

describe("OnboardingService.getTemplates", () => {
  it("should return at least 3 templates", () => {
    const templates = service.getTemplates();
    expect(templates.length).toBeGreaterThanOrEqual(3);
  });

  it("should return templates with PPL, Upper/Lower, Full Body", () => {
    const templates = service.getTemplates();
    const ids = templates.map((t) => t.templateId);
    expect(ids).toContain("ppl");
    expect(ids).toContain("upper_lower");
    expect(ids).toContain("full_body");
  });

  it("each template should have required fields", () => {
    const templates = service.getTemplates();
    for (const t of templates) {
      expect(t.templateId).toBeTruthy();
      expect(t.templateName).toBeTruthy();
      expect(t.description).toBeTruthy();
      expect(["fixed_cycle", "infinite_loop"]).toContain(t.planMode);
      expect(["weekly_fixed", "fixed_interval"]).toContain(t.scheduleMode);
      expect(t.days.length).toBeGreaterThan(0);

      for (const day of t.days) {
        expect(day.dayName).toBeTruthy();
        expect(["push", "pull", "legs", "custom"]).toContain(day.trainingType);
        expect(day.exercises.length).toBeGreaterThan(0);

        for (const ex of day.exercises) {
          expect(ex.exerciseName).toBeTruthy();
          expect(ex.setsConfig).toBeDefined();
          expect(["fixed", "custom"]).toContain(ex.setsConfig.mode);
        }
      }
    }
  });

  it("PPL template should have push, pull, legs days", () => {
    const templates = service.getTemplates();
    const ppl = templates.find((t) => t.templateId === "ppl")!;
    expect(ppl).toBeDefined();
    const types = ppl.days.map((d) => d.trainingType);
    expect(types).toContain("push");
    expect(types).toContain("pull");
    expect(types).toContain("legs");
  });

  it("PPL template push day should have correct exercises", () => {
    const templates = service.getTemplates();
    const ppl = templates.find((t) => t.templateId === "ppl")!;
    const pushDay = ppl.days.find((d) => d.trainingType === "push")!;
    const names = pushDay.exercises.map((e) => e.exerciseName);
    expect(names).toContain("卧推");
    expect(names).toContain("上斜卧推");
    expect(names).toContain("哑铃飞鸟");
    expect(names).toContain("三头下压");
  });

  it("PPL template pull day should have correct exercises", () => {
    const templates = service.getTemplates();
    const ppl = templates.find((t) => t.templateId === "ppl")!;
    const pullDay = ppl.days.find((d) => d.trainingType === "pull")!;
    const names = pullDay.exercises.map((e) => e.exerciseName);
    expect(names).toContain("硬拉");
    expect(names).toContain("杠铃划船");
    expect(names).toContain("引体向上");
    expect(names).toContain("二头弯举");
  });

  it("PPL template legs day should have correct exercises", () => {
    const templates = service.getTemplates();
    const ppl = templates.find((t) => t.templateId === "ppl")!;
    const legsDay = ppl.days.find((d) => d.trainingType === "legs")!;
    const names = legsDay.exercises.map((e) => e.exerciseName);
    expect(names).toContain("深蹲");
    expect(names).toContain("前蹲");
    expect(names).toContain("腿举");
    expect(names).toContain("腿弯举");
  });

  it("each exercise in templates should have sets_config with valid structure", () => {
    const templates = service.getTemplates();
    for (const t of templates) {
      for (const day of t.days) {
        for (const ex of day.exercises) {
          const config = ex.setsConfig;
          if (config.mode === "fixed") {
            expect(config.target_reps).toBeGreaterThan(0);
            expect(config.target_repeat).toBeGreaterThan(0);
          } else if (config.mode === "custom") {
            expect(config.sets.length).toBeGreaterThan(0);
            for (const s of config.sets) {
              expect(s.target_reps).toBeGreaterThan(0);
            }
          }
        }
      }
    }
  });
});

// ============================================================
// createPlanFromTemplate()
// ============================================================

describe("OnboardingService.createPlanFromTemplate", () => {
  it("should create a TrainingPlan from a template", () => {
    const templates = service.getTemplates();
    const ppl = templates.find((t) => t.templateId === "ppl")!;
    const plan = service.createPlanFromTemplate(ppl);

    expect(plan).toBeDefined();
    expect(plan.id).toBeGreaterThan(0);
    expect(plan.biz_key).toBeDefined();
    expect(plan.plan_name).toBe(ppl.templateName);
    expect(plan.plan_mode).toBe(ppl.planMode);
    expect(plan.schedule_mode).toBe(ppl.scheduleMode);
    expect(plan.is_active).toBe(1);
  });

  it("should create TrainingDays for each template day", () => {
    const templates = service.getTemplates();
    const ppl = templates.find((t) => t.templateId === "ppl")!;
    const plan = service.createPlanFromTemplate(ppl);

    const days = dayRepo.findByPlanBizKey(plan.biz_key);
    expect(days.length).toBe(ppl.days.length);

    for (let i = 0; i < ppl.days.length; i++) {
      expect(days[i].day_name).toBe(ppl.days[i].dayName);
      expect(days[i].training_type).toBe(ppl.days[i].trainingType);
      expect(days[i].order_index).toBe(i);
      expect(days[i].plan_biz_key).toBe(plan.biz_key);
    }
  });

  it("should create PlanExercises for each day's exercises", () => {
    const templates = service.getTemplates();
    const ppl = templates.find((t) => t.templateId === "ppl")!;
    const plan = service.createPlanFromTemplate(ppl);

    const days = dayRepo.findByPlanBizKey(plan.biz_key);
    let totalExercises = 0;
    for (let i = 0; i < ppl.days.length; i++) {
      const exercises = planExerciseRepo.findByTrainingDayBizKey(
        days[i].biz_key,
      );
      totalExercises += exercises.length;
      expect(exercises.length).toBe(ppl.days[i].exercises.length);

      for (let j = 0; j < ppl.days[i].exercises.length; j++) {
        const templateEx = ppl.days[i].exercises[j];
        const dbEx = exercises[j];

        // The exercise_biz_key should resolve from exercise name
        expect(dbEx.exercise_biz_key).toBeGreaterThan(0n);
        expect(dbEx.order_index).toBe(j);

        // sets_config should be valid JSON
        const parsedConfig = JSON.parse(dbEx.sets_config) as SetsConfig;
        expect(parsedConfig.mode).toBe(templateEx.setsConfig.mode);
      }
    }

    // PPL has 4 exercises per day * 3 days = 12
    expect(totalExercises).toBe(12);
  });

  it("should deactivate any previously active plan", () => {
    const templates = service.getTemplates();
    const ppl = templates.find((t) => t.templateId === "ppl")!;
    const upperLower = templates.find((t) => t.templateId === "upper_lower")!;

    const plan1 = service.createPlanFromTemplate(ppl);
    expect(plan1.is_active).toBe(1);

    const plan2 = service.createPlanFromTemplate(upperLower);
    expect(plan2.is_active).toBe(1);

    // plan1 should now be deactivated
    const plan1Refreshed = planRepo.findById(plan1.id)!;
    expect(plan1Refreshed.is_active).toBe(0);
  });

  it("should resolve exercise names to existing exercise biz_keys", () => {
    const templates = service.getTemplates();
    const ppl = templates.find((t) => t.templateId === "ppl")!;
    const plan = service.createPlanFromTemplate(ppl);

    const days = dayRepo.findByPlanBizKey(plan.biz_key);
    const pushDay = days.find((d) => d.training_type === "push")!;
    const exercises = planExerciseRepo.findByTrainingDayBizKey(pushDay.biz_key);

    // Each exercise_biz_key should correspond to a real exercise
    for (const ex of exercises) {
      const exercise = exerciseRepo.findByBizKey(ex.exercise_biz_key);
      expect(exercise).not.toBeNull();
      expect(exercise!.is_deleted).toBe(0);
    }
  });

  it("should work for all template types", () => {
    const templates = service.getTemplates();
    for (const t of templates) {
      const plan = service.createPlanFromTemplate(t);
      expect(plan).toBeDefined();
      expect(plan.plan_name).toBe(t.templateName);

      const days = dayRepo.findByPlanBizKey(plan.biz_key);
      expect(days.length).toBe(t.days.length);
    }
  });
});

// ============================================================
// Onboarding State Management
// ============================================================

describe("OnboardingService - state management", () => {
  it("isOnboardingComplete should return false initially", () => {
    expect(service.isOnboardingComplete()).toBe(false);
  });

  it("markOnboardingComplete should set onboarding_completed to true", () => {
    service.markOnboardingComplete();
    expect(service.isOnboardingComplete()).toBe(true);
  });

  it("markOnboardingComplete should be idempotent", () => {
    service.markOnboardingComplete();
    service.markOnboardingComplete();
    expect(service.isOnboardingComplete()).toBe(true);
  });

  it("resetOnboarding should clear the onboarding flag", () => {
    service.markOnboardingComplete();
    expect(service.isOnboardingComplete()).toBe(true);

    service.resetOnboarding();
    expect(service.isOnboardingComplete()).toBe(false);
  });

  it("resetOnboarding should be safe when onboarding was never completed", () => {
    expect(service.isOnboardingComplete()).toBe(false);
    service.resetOnboarding();
    expect(service.isOnboardingComplete()).toBe(false);
  });

  it("state should persist in user_settings table", () => {
    // Initially no setting
    expect(userSettingsRepo.getValue("onboarding_completed")).toBeNull();

    service.markOnboardingComplete();
    expect(userSettingsRepo.getValue("onboarding_completed")).toBe("true");

    service.resetOnboarding();
    expect(userSettingsRepo.getValue("onboarding_completed")).toBe("false");
  });
});

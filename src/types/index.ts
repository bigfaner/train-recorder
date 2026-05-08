// Train Recorder - Type Definitions
// All 15 entity types, SetsConfig discriminated union, service interfaces, and error types.

// ============================================================
// Entity Types (matching er-diagram.md / schema.sql)
// ============================================================

export interface TrainingPlan {
  id: number;
  biz_key: bigint;
  plan_name: string;
  plan_mode: "fixed_cycle" | "infinite_loop";
  cycle_length: number | null;
  schedule_mode: "weekly_fixed" | "fixed_interval";
  rest_days: number;
  weekly_config: string | null; // JSON: weekday -> training_day_biz_key mapping
  is_active: 0 | 1;
  created_at: string;
  updated_at: string;
}

export interface TrainingDay {
  id: number;
  biz_key: bigint;
  plan_biz_key: bigint;
  day_name: string;
  training_type: "push" | "pull" | "legs" | "custom";
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Exercise {
  id: number;
  biz_key: bigint;
  exercise_name: string;
  category:
    | "core_powerlifting"
    | "upper_push"
    | "upper_pull"
    | "lower"
    | "core"
    | "shoulder"
    | "custom";
  increment: number;
  default_rest: number;
  is_custom: 0 | 1;
  is_deleted: 0 | 1;
  created_at: string;
  updated_at: string;
}

// SetsConfig: discriminated union on mode field
export interface FixedSetsConfig {
  mode: "fixed";
  target_reps: number;
  target_weight: number | null;
  target_repeat: number;
}

export interface CustomSetsConfig {
  mode: "custom";
  sets: Array<{
    target_reps: number;
    target_weight: number | null;
  }>;
}

export type SetsConfig = FixedSetsConfig | CustomSetsConfig;

export interface PlanExercise {
  id: number;
  biz_key: bigint;
  training_day_biz_key: bigint;
  exercise_biz_key: bigint;
  sets_config: string; // JSON-serialized SetsConfig
  order_index: number;
  exercise_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkoutSession {
  id: number;
  biz_key: bigint;
  session_date: string; // 'YYYY-MM-DD'
  training_type: "push" | "pull" | "legs" | "custom";
  session_status: "in_progress" | "completed" | "completed_partial";
  started_at: string;
  ended_at: string | null;
  is_backlog: 0 | 1;
  created_at: string;
  updated_at: string;
}

export interface WorkoutExercise {
  id: number;
  biz_key: bigint;
  workout_session_biz_key: bigint;
  exercise_biz_key: bigint;
  order_index: number;
  exercise_status: "pending" | "in_progress" | "completed" | "skipped";
  exercise_note: string | null;
  suggested_weight: number | null;
  target_sets: number;
  target_reps: number;
  exercise_mode: "fixed" | "custom";
  created_at: string;
}

export interface WorkoutSet {
  id: number;
  biz_key: bigint;
  workout_exercise_biz_key: bigint;
  set_index: number;
  target_weight: number | null;
  target_reps: number;
  actual_weight: number | null;
  actual_reps: number | null;
  is_completed: 0 | 1;
  completed_at: string | null;
  is_target_met: 0 | 1 | null;
}

export interface Feeling {
  id: number;
  biz_key: bigint;
  workout_session_biz_key: bigint;
  fatigue_level: number; // 1-10
  satisfaction: number; // 1-10
  overall_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExerciseFeeling {
  id: number;
  biz_key: bigint;
  feeling_biz_key: bigint;
  exercise_biz_key: bigint;
  workout_exercise_biz_key: bigint;
  feeling_note: string | null;
  created_at: string;
}

export interface PersonalRecord {
  id: number;
  biz_key: bigint;
  exercise_biz_key: bigint;
  pr_type: "weight" | "volume";
  pr_value: number;
  pr_date: string; // 'YYYY-MM-DD'
  workout_set_biz_key: bigint | null;
  created_at: string;
}

export interface BodyMeasurement {
  id: number;
  biz_key: bigint;
  record_date: string; // 'YYYY-MM-DD'
  body_weight: number | null;
  chest_circumference: number | null;
  waist_circumference: number | null;
  arm_circumference: number | null;
  thigh_circumference: number | null;
  body_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface OtherSportRecord {
  id: number;
  biz_key: bigint;
  record_date: string; // 'YYYY-MM-DD'
  sport_type_biz_key: bigint;
  sport_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface SportType {
  id: number;
  biz_key: bigint;
  sport_name: string;
  icon: string | null;
  is_custom: 0 | 1;
  created_at: string;
}

export interface SportMetric {
  id: number;
  biz_key: bigint;
  sport_type_biz_key: bigint;
  metric_name: string;
  metric_unit: string | null;
  is_custom: 0 | 1;
  order_index: number;
}

export interface SportMetricValue {
  id: number;
  biz_key: bigint;
  sport_record_biz_key: bigint;
  sport_metric_biz_key: bigint;
  metric_value: number;
}

export interface UserSettings {
  id: number;
  biz_key: bigint;
  setting_key: string;
  setting_value: string;
  updated_at: string;
}

// ============================================================
// Repository Interface (Base)
// ============================================================

export interface BaseRepository<T> {
  findById(id: number): Promise<T | null>;
  findByBizKey(bizKey: bigint): Promise<T | null>;
  findAll(filter?: Partial<T>, orderBy?: string, limit?: number): Promise<T[]>;
  create(
    data: Omit<T, "id" | "biz_key" | "created_at" | "updated_at">,
  ): Promise<T>;
  update(id: number, data: Partial<T>): Promise<T>;
  deleteById(id: number): Promise<void>;
}

// ============================================================
// Service Interfaces
// ============================================================

// --- CalendarComputer ---

export interface CalendarDay {
  date: string; // 'YYYY-MM-DD'
  trainingDay: TrainingDay | null;
  workoutSession: WorkoutSession | null;
  otherSport: OtherSportRecord | null;
  isSkipped: boolean;
  consecutiveSkips: number;
  dayType:
    | "training"
    | "rest"
    | "other_sport"
    | "completed"
    | "completed_partial"
    | "skipped";
}

export interface CalendarComputer {
  computeMonth(
    year: number,
    month: number,
    plan: TrainingPlan,
    days: TrainingDay[],
  ): Promise<CalendarDay[]>;
  computeDay(
    date: string,
    plan: TrainingPlan,
    days: TrainingDay[],
  ): Promise<CalendarDay>;
  getTodayPlan(plan: TrainingPlan, days: TrainingDay[]): Promise<CalendarDay>;
  skipTrainingDay(date: string, planBizKey: bigint): Promise<void>;
  unskipTrainingDay(date: string, planBizKey: bigint): Promise<void>;
  getSkippedDates(planBizKey: bigint): Promise<string[]>;
  getConsecutiveSkips(planBizKey: bigint, beforeDate: string): Promise<number>;
}

// --- ProgressiveOverload ---

export interface OverloadSuggestion {
  suggestedWeight: number | null;
  previousWeight: number | null;
  increment: number;
  direction: "increase" | "maintain" | "decrease";
  reason: string;
  consecutiveCompleted: number;
  consecutiveMissed: number;
}

export interface ProgressiveOverload {
  calculateSuggestion(
    exerciseBizKey: bigint,
    targetReps: number,
  ): Promise<OverloadSuggestion>;
  recordResult(exerciseBizKey: bigint, sets: WorkoutSet[]): Promise<void>;
  recalculateChain(exerciseBizKey: bigint, fromDate: string): Promise<void>;
}

// --- TimerService ---

export interface TimerState {
  isActive: boolean;
  remainingSeconds: number;
  totalDuration: number;
  startedAt: number | null; // Date.now() timestamp
  exerciseBizKey: bigint | null;
}

export interface TimerService {
  start(durationSeconds: number, exerciseBizKey?: bigint): void;
  pause(): void;
  resume(): void;
  skip(): void;
  adjust(deltaSeconds: number): void;
  getState(): TimerState;
  persistState(): Promise<void>;
  recoverState(): Promise<TimerState | null>;
  onTick(callback: (remaining: number) => void): () => void;
  onComplete(callback: () => void): () => void;
}

// --- PRTracker ---

export interface PersonalRecordEntry {
  exerciseBizKey: bigint;
  prType: "weight" | "volume";
  prValue: number;
  prDate: string;
}

export interface PRTracker {
  checkAndRecordPR(
    exerciseBizKey: bigint,
    workoutSetBizKey: bigint,
    actualWeight: number,
    actualReps: number,
  ): Promise<PersonalRecordEntry | null>;
  recalculatePR(exerciseBizKey: bigint): Promise<void>;
  getPRList(): Promise<PersonalRecordEntry[]>;
  getEstimated1RM(weight: number, reps: number): number;
}

// --- ExerciseHistoryService ---

export interface ExerciseSessionSummary {
  sessionDate: string;
  workoutSessionBizKey: bigint;
  sets: { weight: number; reps: number; isTargetMet: boolean }[];
}

export interface ExerciseDetailSummary {
  exerciseBizKey: bigint;
  exerciseName: string;
  recentSessions: ExerciseSessionSummary[];
  personalRecords: PersonalRecordEntry[];
  totalSessionCount: number;
}

export interface ExerciseHistoryService {
  getExerciseSummary(exerciseBizKey: bigint): Promise<ExerciseDetailSummary>;
  getRecentSessions(
    exerciseBizKey: bigint,
    limit: number,
  ): Promise<ExerciseSessionSummary[]>;
}

// --- UnitConversion ---

export interface UnitConversion {
  kgToLbs(kg: number): number;
  lbsToKg(lbs: number): number;
  displayWeight(kg: number, unit: "kg" | "lbs"): string;
  storeWeight(input: number, unit: "kg" | "lbs"): number; // always stores as kg
  roundToPlate(kg: number): number; // round to nearest barbell plate combination
}

// --- DataExportService ---

export type ExportRange = "all" | "3m" | "6m";

export interface ExportResult {
  filePath: string;
  fileName: string; // train-recorder-export-YYYYMMDD.json
  recordCount: number;
  fileSizeKB: number;
}

export interface DataExportService {
  exportData(range: ExportRange): Promise<ExportResult>;
  getEstimatedSize(range: ExportRange): Promise<number>;
  shareFile(filePath: string): Promise<void>;
}

// --- DataImportService ---

export interface ImportValidation {
  isValid: boolean;
  errors: string[];
  recordCounts: Record<string, number>;
}

export interface ImportConflict {
  bizKey: bigint;
  entityType: string;
  action: "skip" | "overwrite";
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export interface DataImportService {
  validateFile(filePath: string): Promise<ImportValidation>;
  importData(
    filePath: string,
    conflictStrategy: "skip" | "overwrite",
  ): Promise<ImportResult>;
  previewImport(filePath: string): Promise<ImportValidation>;
}

// --- OnboardingService ---

export interface PlanTemplateDayExercise {
  exerciseName: string;
  setsConfig: SetsConfig;
}

export interface PlanTemplateDay {
  dayName: string;
  trainingType: "push" | "pull" | "legs" | "custom";
  exercises: PlanTemplateDayExercise[];
}

export interface PlanTemplate {
  templateId: string;
  templateName: string;
  description: string;
  planMode: "fixed_cycle" | "infinite_loop";
  scheduleMode: "weekly_fixed" | "fixed_interval";
  days: PlanTemplateDay[];
}

export interface OnboardingState {
  currentStep:
    | "welcome"
    | "template_select"
    | "plan_config"
    | "exercise_config"
    | "done";
  selectedTemplate: PlanTemplate | null;
  completed: boolean;
}

export interface OnboardingService {
  getTemplates(): PlanTemplate[];
  createPlanFromTemplate(template: PlanTemplate): TrainingPlan;
  isOnboardingComplete(): boolean;
  markOnboardingComplete(): void;
  resetOnboarding(): void;
}

// ============================================================
// Error Types
// ============================================================

export type ErrorCode =
  | "ERR_DB_INIT"
  | "ERR_DB_MIGRATION"
  | "ERR_VALIDATION"
  | "ERR_NOT_FOUND"
  | "ERR_PLAN_ACTIVE"
  | "ERR_WORKOUT_ACTIVE"
  | "ERR_EXERCISE_IN_USE"
  | "ERR_EXPORT"
  | "ERR_IMPORT"
  | "ERR_TIMER";

export class AppError extends Error {
  code: ErrorCode;
  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
  }
}

export class DatabaseInitError extends AppError {
  constructor(message: string) {
    super("ERR_DB_INIT", message);
    this.name = "DatabaseInitError";
  }
}

export class MigrationError extends AppError {
  constructor(message: string) {
    super("ERR_DB_MIGRATION", message);
    this.name = "MigrationError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super("ERR_VALIDATION", message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super("ERR_NOT_FOUND", message);
    this.name = "NotFoundError";
  }
}

export class ActivePlanConflict extends AppError {
  constructor(message: string) {
    super("ERR_PLAN_ACTIVE", message);
    this.name = "ActivePlanConflict";
  }
}

export class ActiveWorkoutConflict extends AppError {
  constructor(message: string) {
    super("ERR_WORKOUT_ACTIVE", message);
    this.name = "ActiveWorkoutConflict";
  }
}

export class ExerciseInUseError extends AppError {
  constructor(message: string) {
    super("ERR_EXERCISE_IN_USE", message);
    this.name = "ExerciseInUseError";
  }
}

export class ExportError extends AppError {
  constructor(message: string) {
    super("ERR_EXPORT", message);
    this.name = "ExportError";
  }
}

export class ImportError extends AppError {
  constructor(message: string) {
    super("ERR_IMPORT", message);
    this.name = "ImportError";
  }
}

export class TimerError extends AppError {
  constructor(message: string) {
    super("ERR_TIMER", message);
    this.name = "TimerError";
  }
}

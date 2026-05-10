---
created: 2026-05-08
prd: prd/prd-spec.md
status: Draft
---

# Technical Design: Train Recorder

## Overview

A React Native + Expo mobile app for powerlifters to manage periodized training plans, execute workouts with real-time set tracking, receive progressive overload suggestions, and analyze progress trends. All data stored locally via expo-sqlite with a repository pattern.

**Tech Stack**: React Native, Expo SDK 52+, TypeScript, expo-sqlite (raw), Zustand, victory-native (Skia charts), Expo Router (file-based navigation).

**Key Architectural Decision**: expo-sqlite (raw) instead of WatermelonDB, because the schema uses INTEGER auto-increment IDs (SQLite 64-bit) + snowflake biz_keys (stored as INTEGER) + DATETIME fields, which are incompatible with WatermelonDB's string-ID architecture.

## Architecture

### Layer Placement

Single-device mobile app with three layers:

```
┌─────────────────────────────────────────────┐
│              Presentation Layer              │
│  Expo Router pages + React Native components │
├─────────────────────────────────────────────┤
│              State Layer (Zustand)           │
│  workoutStore · timerStore · settingsStore   │
├─────────────────────────────────────────────┤
│              Service Layer                   │
│  progressiveOverload · scheduler · timer     │
│  prTracker · dataExport · unitConversion     │
├─────────────────────────────────────────────┤
│              Data Layer                      │
│  Repository classes + expo-sqlite            │
│  Snowflake ID generator · Migration manager  │
└─────────────────────────────────────────────┘
```

### Component Diagram

```
┌──────────┐    ┌──────────────┐    ┌────────────────┐
│  UI Pages │───→│ Zustand Store │───→│   Services     │
│ (Expo     │    │ (workout,    │    │ (overload,     │
│  Router)  │    │  timer,      │    │  scheduler,    │
│           │    │  settings)   │    │  pr, export)   │
└──────────┘    └──────────────┘    └───────┬────────┘
                                            │
                                    ┌───────▼────────┐
                                    │  Repositories   │
                                    │  (CRUD per      │
                                    │   entity)       │
                                    └───────┬────────┘
                                            │
                                    ┌───────▼────────┐
                                    │  expo-sqlite    │
                                    │  (SQLite DB)    │
                                    └────────────────┘
```

### Dependencies

| Category      | Package                    | Version | Purpose                      |
| ------------- | -------------------------- | ------- | ---------------------------- |
| Framework     | expo                       | ~52     | Core SDK                     |
| Framework     | react-native               | ~0.76   | Mobile runtime               |
| Navigation    | expo-router                | ~4      | File-based routing           |
| Database      | expo-sqlite                | ~15     | Local SQLite                 |
| State         | zustand                    | ~5      | Lightweight state management |
| Charts        | victory-native             | ~41     | Skia-based charts            |
| Charts        | @shopify/react-native-skia | ~1      | Chart rendering engine       |
| Notifications | expo-notifications         | ~0.x    | Local push notifications     |
| Background    | expo-background-fetch      | ~13     | Background timer support     |
| Background    | expo-task-manager          | ~12     | Background task execution    |
| Filesystem    | expo-file-system           | ~18     | Data export/import           |
| Date          | date-fns                   | ~4      | Date manipulation            |
| ID Generation | snowflake-id               | custom  | Snowflake biz_key generation |

### Directory Structure

```
train-recorder/
├── app/                          # Expo Router (file-based routing)
│   ├── _layout.tsx              # Root layout
│   ├── (tabs)/                  # Tab navigation group
│   │   ├── _layout.tsx          # Tab bar layout
│   │   ├── calendar.tsx         # Tab 1: Training Calendar
│   │   ├── plan.tsx             # Tab 2: Plan Management
│   │   ├── history.tsx          # Tab 3: History & Progress
│   │   ├── stats.tsx            # Tab 4: Statistics Overview
│   │   └── settings.tsx         # Tab 5: Settings
│   ├── workout.tsx              # Push: Workout Execution
│   ├── feeling.tsx              # Push: Post-Workout Feeling
│   ├── other-sport.tsx          # Push: Other Sports
│   ├── exercise-library.tsx     # Push: Exercise Library
│   ├── exercise-detail.tsx      # Push: Exercise Detail
│   ├── body-data.tsx            # Push: Body Data
│   ├── plan-editor.tsx          # Push: Plan Create/Edit
│   ├── training-day-editor.tsx  # Push: Training Day Editor
│   ├── onboarding.tsx           # Push: First-time Onboarding
│   └── sport-editor.tsx         # Push: Custom Sport Editor
├── src/
│   ├── db/
│   │   ├── database.ts          # DB init + connection
│   │   ├── schema.ts            # CREATE TABLE statements
│   │   ├── migrations/          # Schema version management
│   │   └── repositories/        # Per-entity CRUD
│   │       ├── base.repository.ts
│   │       ├── training-plan.repo.ts
│   │       ├── training-day.repo.ts
│   │       ├── exercise.repo.ts
│   │       ├── plan-exercise.repo.ts
│   │       ├── workout-session.repo.ts
│   │       ├── workout-exercise.repo.ts
│   │       ├── workout-set.repo.ts
│   │       ├── feeling.repo.ts
│   │       ├── exercise-feeling.repo.ts
│   │       ├── personal-record.repo.ts
│   │       ├── body-measurement.repo.ts
│   │       ├── other-sport.repo.ts
│   │       ├── sport-type.repo.ts
│   │       ├── sport-metric.repo.ts
│   │       ├── sport-metric-value.repo.ts
│   │       └── user-settings.repo.ts
│   ├── stores/
│   │   ├── workout.store.ts     # Active workout state
│   │   ├── timer.store.ts       # Rest timer state
│   │   └── settings.store.ts    # User preferences cache
│   ├── services/
│   │   ├── calendar-computer.ts # Real-time calendar computation
│   │   ├── progressive-overload.ts
│   │   ├── pr-tracker.ts
│   │   ├── timer.ts             # Background timer service
│   │   ├── data-export.ts
│   │   ├── data-import.ts
│   │   ├── unit-conversion.ts
│   │   └── snowflake.ts         # ID generator
│   ├── components/
│   │   ├── ui/                  # Base UI (Button, Card, Input, Slider, Tag, Timer)
│   │   ├── calendar/            # Calendar grid, day cells, detail card
│   │   ├── workout/             # Exercise cards, set inputs, timer panel
│   │   ├── plan/                # Plan cards, day editor, exercise picker
│   │   ├── history/             # Progress chart, volume chart, PR list
│   │   ├── stats/               # Hero card, four-grid, heatmap, bar chart
│   │   └── onboarding/          # Welcome steps, template picker
│   ├── hooks/
│   │   ├── useWorkout.ts
│   │   ├── useTimer.ts
│   │   ├── useCalendar.ts       # Computed calendar hook
│   │   ├── useProgressiveOverload.ts
│   │   ├── useExerciseHistory.ts
│   │   └── useUnitConversion.ts
│   ├── utils/
│   │   ├── date.ts
│   │   ├── weight.ts
│   │   └── constants.ts
│   └── types/
│       └── index.ts
├── assets/
├── app.config.ts
├── package.json
├── tsconfig.json
└── babel.config.js
```

## Interfaces

### Repository Interface (Base)

```typescript
interface BaseRepository<T> {
  findById(id: number): Promise<T | null>;
  findByBizKey(bizKey: bigint): Promise<T | null>;
  findAll(filter?: Partial<T>, orderBy?: string, limit?: number): Promise<T[]>;
  create(
    data: Omit<T, "id" | "biz_key" | "created_at" | "updated_at">,
  ): Promise<T>;
  update(id: number, data: Partial<T>): Promise<T>;
  deleteById(id: number): Promise<void>;
}
```

### CalendarComputer Service

```typescript
interface CalendarDay {
  date: string; // 'YYYY-MM-DD'
  trainingDay: TrainingDay | null; // null = rest day
  workoutSession: WorkoutSession | null; // actual record, if any
  otherSport: OtherSportRecord | null;
  isSkipped: boolean; // true = 用户主动跳过
  consecutiveSkips: number; // 连续跳过次数（用于 3 次警告）
  dayType:
    | "training"
    | "rest"
    | "other_sport"
    | "completed"
    | "completed_partial"
    | "skipped";
}

interface CalendarComputer {
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
  skipTrainingDay(date: string): Promise<void>; // 在 user_settings 中记录跳过日期
  unskipTrainingDay(date: string): Promise<void>; // 取消跳过，恢复排期
  getSkippedDates(planBizKey: bigint): Promise<string[]>; // 查询当前计划的跳过日期列表
  getConsecutiveSkips(planBizKey: bigint, beforeDate: string): Promise<number>; // 连续跳过计数
}
```

Skip/restore mechanism: Skipped dates are stored as a JSON array in `user_settings` table under key `skipped_dates_{planBizKey}`. CalendarComputer reads this list when computing day type. When a day is skipped, `computeMonth` shifts subsequent training assignments forward. Unskip removes the date and restores the original assignment.

### ProgressiveOverload Service

```typescript
interface OverloadSuggestion {
  suggestedWeight: number;
  previousWeight: number | null;
  increment: number;
  direction: "increase" | "maintain" | "decrease";
  reason: string;
  consecutiveCompleted: number;
  consecutiveMissed: number;
}

interface ProgressiveOverload {
  calculateSuggestion(
    exerciseBizKey: bigint,
    targetReps: number,
  ): Promise<OverloadSuggestion>;
  recordResult(exerciseBizKey: bigint, sets: WorkoutSet[]): Promise<void>;
  recalculateChain(exerciseBizKey: bigint, fromDate: string): Promise<void>;
}
```

### Timer Service

```typescript
interface TimerState {
  isActive: boolean;
  remainingSeconds: number;
  totalDuration: number;
  startedAt: number | null; // Date.now() timestamp
  exerciseBizKey: bigint | null;
}

interface TimerService {
  start(durationSeconds: number): void;
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
```

### PR Tracker Service

```typescript
interface PersonalRecordEntry {
  exerciseBizKey: bigint;
  prType: "weight" | "volume";
  prValue: number;
  prDate: string;
}

interface PRTracker {
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
```

### Exercise History Service

```typescript
interface ExerciseSessionSummary {
  sessionDate: string;
  workoutSessionBizKey: bigint;
  sets: { weight: number; reps: number; isTargetMet: boolean }[];
}

interface ExerciseDetailSummary {
  exerciseBizKey: bigint;
  exerciseName: string;
  recentSessions: ExerciseSessionSummary[]; // 最近 5 次训练
  personalRecords: PersonalRecordEntry[]; // 重量 PR + 容量 PR
  totalSessionCount: number; // 历史总训练次数
}

interface ExerciseHistoryService {
  getExerciseSummary(exerciseBizKey: bigint): Promise<ExerciseDetailSummary>;
  getRecentSessions(
    exerciseBizKey: bigint,
    limit: number,
  ): Promise<ExerciseSessionSummary[]>;
}
```

Implementation: `getExerciseSummary` queries `workout_exercises` + `workout_sets` joined by `exercise_biz_key`, groups by session, sorts by date descending, takes top 5. PR data comes from `personal_records` table. Total count is a COUNT DISTINCT on `workout_session_biz_key`.

### Unit Conversion Service

```typescript
interface UnitConversion {
  kgToLbs(kg: number): number;
  lbsToKg(lbs: number): number;
  displayWeight(kg: number, unit: "kg" | "lbs"): string;
  storeWeight(input: number, unit: "kg" | "lbs"): number; // always stores as kg
  roundToPlate(kg: number): number; // round to nearest barbell plate combination
}
```

### Snowflake ID Generator

```typescript
interface SnowflakeIdGenerator {
  generate(): bigint; // 生成全局唯一 bigint biz_key
  generateBatch(count: number): bigint[]; // 批量生成（创建计划时一次生成多个 biz_key）
}
```

Implementation notes: Uses timestamp (41 bits) + machine-id (10 bits) + sequence (12 bits) to produce 64-bit integers. Machine-id is derived from device fingerprint hash. All biz_key columns store as INTEGER (SQLite 64-bit).

### Data Export Service

```typescript
type ExportRange = "all" | "3m" | "6m";

interface ExportResult {
  filePath: string; // expo-file-system 路径
  fileName: string; // train-recorder-export-YYYYMMDD.json
  recordCount: number; // 导出的记录总数
  fileSizeKB: number; // 文件大小
}

interface DataExportService {
  exportData(range: ExportRange): Promise<ExportResult>;
  getEstimatedSize(range: ExportRange): Promise<number>; // 预估文件大小 (KB)
  shareFile(filePath: string): Promise<void>; // 调用系统分享 (邮件/云盘/本地)
}
```

Export format: single JSON file containing `training_plans`, `workout_sessions`, `workout_exercises`, `workout_sets`, `feelings`, `exercise_feelings`, `personal_records`, `body_measurements`, `other_sport_records`, `sport_types`, `sport_metrics`, `sport_metric_values`, `user_settings` arrays. Date range filters on `session_date`/`record_date`.

### Data Import Service

```typescript
type ImportValidation = {
  isValid: boolean;
  errors: string[]; // 格式/版本/数据校验错误
  recordCounts: Record<string, number>; // 各表的记录数预览
};

interface ImportConflict {
  bizKey: bigint;
  entityType: string;
  action: "skip" | "overwrite"; // 冲突处理策略
}

interface ImportResult {
  imported: number; // 成功导入的记录数
  skipped: number; // 因冲突跳过的记录数
  errors: string[]; // 导入过程中的错误
}

interface DataImportService {
  validateFile(filePath: string): Promise<ImportValidation>;
  importData(
    filePath: string,
    conflictStrategy: "skip" | "overwrite",
  ): Promise<ImportResult>;
  previewImport(filePath: string): Promise<ImportValidation>; // 预览，不写入
}
```

Validation rules: check JSON schema structure, verify required fields per entity, detect duplicate biz_key conflicts against existing data. Import wrapped in a transaction; rolled back on error.

### Onboarding Service

```typescript
interface PlanTemplate {
  templateId: string;
  templateName: string; // 如「推/拉/蹲 3日循环」
  description: string;
  planMode: "fixed_cycle" | "infinite_loop";
  scheduleMode: "weekly_fixed" | "fixed_interval";
  days: {
    dayName: string;
    trainingType: "push" | "pull" | "legs" | "custom";
    exercises: {
      exerciseName: string; // 内置动作名
      setsConfig: SetsConfig;
    }[];
  }[];
}

interface OnboardingState {
  currentStep:
    | "welcome"
    | "template_select"
    | "plan_config"
    | "exercise_config"
    | "done";
  selectedTemplate: PlanTemplate | null;
  completed: boolean;
}

interface OnboardingService {
  getTemplates(): PlanTemplate[];
  createPlanFromTemplate(template: PlanTemplate): Promise<TrainingPlan>;
  isOnboardingComplete(): Promise<boolean>;
  markOnboardingComplete(): Promise<void>;
  resetOnboarding(): Promise<void>; // 设置中「重新查看新手引导」
}
```

Onboarding flow: Welcome (3-4 intro steps) -> Template selection -> Plan config (adjust weights) -> Done. State persisted in `user_settings` table (`onboarding_completed` key). ResetOnboarding allows revisiting from Settings page.

## Data Models

> Full database design in separate files.
> **ER Diagram**: design/er-diagram.md
> **SQL Schema**: design/schema.sql

### Field Quick Reference

| Model            | Key Fields                                                          | Notes                           |
| ---------------- | ------------------------------------------------------------------- | ------------------------------- |
| TrainingPlan     | plan_name, plan_mode, schedule_mode, weekly_config, is_active       | 15 entities, biz_key 关联       |
| TrainingDay      | plan_biz_key, day_name, training_type, order_index                  | 计划的训练日类型                |
| Exercise         | exercise_name, category, increment, default_rest                    | 动作库，is_deleted 软删除       |
| PlanExercise     | training_day_biz_key, exercise_biz_key, sets_config (JSON)          | 固定/自定义模式统一 JSON        |
| WorkoutSession   | session_date, training_type, session_status, started_at, ended_at   | 无 schedule 关联，duration 计算 |
| WorkoutExercise  | workout_session_biz_key, exercise_biz_key, suggested_weight         | 训练中的动作快照                |
| WorkoutSet       | workout_exercise_biz_key, actual_weight, actual_reps, is_target_met | 逐组记录，PR 引用               |
| Feeling          | workout_session_biz_key, fatigue_level, satisfaction                | 训练后感受                      |
| ExerciseFeeling  | feeling_biz_key, exercise_biz_key, feeling_note                     | 每动作感受                      |
| PersonalRecord   | exercise_biz_key, pr_type, pr_value, pr_date                        | 重量/容量 PR                    |
| BodyMeasurement  | record_date, body_weight, chest/waist/arm/thigh_circumference       | 身体数据                        |
| OtherSportRecord | record_date, sport_type_biz_key                                     | 其他运动                        |
| SportType        | sport_name, icon, is_custom                                         | 运动类型                        |
| SportMetric      | sport_type_biz_key, metric_name, metric_unit                        | 运动指标定义                    |
| SportMetricValue | sport_record_biz_key, sport_metric_biz_key, metric_value            | 指标值                          |
| UserSettings     | setting_key, setting_value                                          | 应用偏好                        |

## Error Handling

### Error Types & Codes

| Error Code          | Name                  | Description                |
| ------------------- | --------------------- | -------------------------- |
| ERR_DB_INIT         | DatabaseInitError     | SQLite 初始化失败          |
| ERR_DB_MIGRATION    | MigrationError        | 数据库迁移失败             |
| ERR_VALIDATION      | ValidationError       | 输入验证失败（如重量 ≤ 0） |
| ERR_NOT_FOUND       | NotFoundError         | 实体不存在                 |
| ERR_PLAN_ACTIVE     | ActivePlanConflict    | 已有激活计划时创建新计划   |
| ERR_WORKOUT_ACTIVE  | ActiveWorkoutConflict | 已有进行中的训练           |
| ERR_EXERCISE_IN_USE | ExerciseInUseError    | 删除正在使用的动作         |
| ERR_EXPORT          | ExportError           | 数据导出失败               |
| ERR_IMPORT          | ImportError           | 数据导入校验失败           |
| ERR_TIMER           | TimerError            | 计时器状态异常             |

### Propagation Strategy

- **Repository 层**: 抛出带 error code 的自定义异常
- **Service 层**: 捕获 Repository 异常，转换为业务语义异常，必要时回滚事务
- **Store 层**: 捕获 Service 异常，更新 UI 状态（error 字段）
- **UI 层**: 监听 Store.error，显示 Toast 或 Alert

所有数据库写操作在 Service 层使用事务包裹，确保原子性。

## Cross-Layer Data Map

| Field Name            | Storage Layer            | Service/DTO Type | Frontend Type                                       | Validation Rule                                      |
| --------------------- | ------------------------ | ---------------- | --------------------------------------------------- | ---------------------------------------------------- |
| biz_key               | INTEGER NOT NULL UNIQUE  | bigint           | bigint                                              | Auto-generated (snowflake), stored as 64-bit INTEGER |
| session_date          | VARCHAR(10) 'YYYY-MM-DD' | string           | string                                              | ISO date format                                      |
| started_at / ended_at | DATETIME                 | Date             | Date                                                | started_at ≤ ended_at                                |
| session_status        | VARCHAR(20)              | enum string      | 'in_progress' \| 'completed' \| 'completed_partial' | State machine                                        |
| actual_weight         | DECIMAL(6,2) nullable    | number \| null   | number \| null                                      | > 0 if not null                                      |
| actual_reps           | INT nullable             | number \| null   | number \| null                                      | ≥ 0 if not null                                      |
| is_target_met         | TINYINT nullable         | 0 \| 1 \| null   | boolean \| null                                     | Computed: actual_reps ≥ target_reps                  |
| sets_config           | VARCHAR(2048) JSON       | object           | SetsConfig                                          | mode: 'fixed' \| 'custom'                            |
| fatigue_level         | INT DEFAULT 5            | number           | number                                              | 1-10                                                 |
| satisfaction          | INT DEFAULT 5            | number           | number                                              | 1-10                                                 |
| increment             | DECIMAL(6,2)             | number           | number                                              | > 0                                                  |
| training_type         | VARCHAR(20)              | enum string      | 'push' \| 'pull' \| 'legs' \| 'custom'              | Enum values                                          |
| schedule_mode         | VARCHAR(20)              | enum string      | 'weekly_fixed' \| 'fixed_interval'                  | Enum values                                          |
| plan_mode             | VARCHAR(20)              | enum string      | 'fixed_cycle' \| 'infinite_loop'                    | Enum values                                          |

## Integration Specs

No existing-page integrations — not applicable. All pages are new.

## Testing Strategy

### Per-Layer Test Plan

| Layer        | Test Type   | Tool                               | What to Test                                                                       | Coverage Target |
| ------------ | ----------- | ---------------------------------- | ---------------------------------------------------------------------------------- | --------------- |
| Services     | Unit        | Jest                               | Progressive overload algorithm, calendar computation, PR tracking, unit conversion | 90%             |
| Repositories | Integration | Jest + in-memory SQLite            | CRUD operations, queries, transactions                                             | 80%             |
| Stores       | Unit        | Jest (useStore.getState() + act()) | State transitions, async actions                                                   | 80%             |
| Components   | Component   | React Testing Library              | User interactions, rendering states                                                | 70%             |
| E2E          | E2E         | Maestro                            | Core workout flow, plan creation, data export                                      | Key flows       |

### Tooling Rationale

**E2E: Maestro** (chosen over Detox). Maestro uses YAML-based test definitions with no native module compilation, which avoids the recurring Detox build-config issues common in Expo projects. Maestro's element matching works directly with React Native's accessibility labels, requires no test runner setup in the JS bundle, and supports both iOS and Android from the same flow file. For a local-first app with no backend dependencies, Maestro's simplicity and zero-config approach outweighs Detox's broader API surface.

**Zustand testing pattern**: Access store state directly via `useStore.getState()` in Jest tests; dispatch actions by calling store methods directly (no React rendering needed). For async actions that call services, mock the service module with `jest.mock()` and assert state transitions via `getState()` before/after action calls. Wrap state-updating actions in `act()` from `react` when testing components that subscribe to the store. Example: `const { result } = renderHook(() => useWorkoutStore()); act(() => { result.current.startWorkout(planBizKey); }); expect(result.current.activeSession).toBeDefined();`

### Key Test Scenarios

1. **Progressive Overload**: All sets met → increase; some missed → maintain; 2 consecutive miss → decrease 10%; 3 consecutive success → suggest larger increment
2. **Calendar Computation**: weekly_fixed maps weekdays correctly; fixed_interval cycles with rest days; past dates show actual records
3. **Timer Recovery**: Force kill app during timer → reopen → compute elapsed time correctly
4. **PR Tracking**: New max weight triggers PR record; deleting PR record rolls back to previous max
5. **Partial Workout**: Mid-workout exit preserves completed sets, marks incomplete exercises
6. **Edit/Delete Cascade**: Editing past workout recalculates overload chain; deleting PR-containing workout rolls back PR
7. **Unit Conversion**: Switch kg→lbs displays correctly; input in lbs stores as kg; increment options adjust per unit

### Overall Coverage Target

80% for services and repositories.

## Security Considerations

### Threat Model

| Threat                                | Risk Level | Description                                                                                                             |
| ------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| Local data access (locked device)     | Low        | Device stolen/lost while locked; iOS/Android full-disk encryption protects data at rest                                 |
| Local data access (unlocked device)   | Medium     | Device stolen while unlocked; OS encryption ineffective; training data (personal health data per PRD) directly readable |
| Local data access (jailbroken/rooted) | Medium     | OS sandbox bypassed; full-disk encryption trivially defeated; database file directly accessible via filesystem          |
| Data loss                             | Medium     | App uninstall or DB corruption loses all data                                                                           |
| Export file leak                      | Medium     | Exported JSON contains all personal training data in plaintext; any file manager or sharing endpoint exposes contents   |

### Mitigations

- **Database encryption (accepted: not implemented)**: Evaluated `expo-sqlite` SQLCipher support and `expo-sqlite-encrypted` as alternatives. expo-sqlite (v15) does not bundle SQLCipher by default; enabling it requires a custom dev client build with the `--encrypt` flag and a native plugin, which adds significant build complexity (custom native code, EAS build required, cannot use Expo Go). `expo-sqlite-encrypted` is a community package with no Expo SDK guarantee and potential compatibility breaks on SDK upgrades. **Decision**: defer database encryption. The app stores no financial, authentication, or legally regulated data. For a single-user personal training log on a non-jailbroken device, OS-level encryption (iOS Data Protection, Android file-based encryption) provides adequate protection. If the PRD scope expands to include shared accounts or cloud sync, this decision must be revisited.
- **Jailbroken/rooted device risk (accepted)**: On jailbroken iOS or rooted Android, the OS sandbox is bypassed and full-disk encryption is trivially defeated, making the SQLite database file directly readable. **Mitigation**: no technical countermeasure is implemented. Jailbroken/rooted devices compromise the entire OS security model; app-layer encryption without a remote key management service provides only marginal improvement (the key would also be stored locally and equally accessible). Documenting this as an accepted risk for the personal-use scope.
- **Export file encryption (accepted: not implemented)**: Export files are plaintext JSON containing all training history. Adding AES encryption would require a user-supplied password or a device-stored key. A password-based approach (e.g., using `expo-crypto` PBKDF2 to derive an AES key) adds UX friction and password recovery complexity for a single-user app. A device-stored key via `expo-secure-store` protects against casual file browsing but not against determined extraction on a compromised device. **Decision**: export files remain unencrypted. The filename (`train-recorder-export-YYYYMMDD.json`) does not identify the user. Users are informed in the export UI that exported data is unencrypted and should be stored securely.
- **Data loss**: Export feature for backup; import for restore; encourage periodic exports via settings reminder
- **No network**: No API keys, no tokens, no network requests -- eliminates entire categories of security issues (MITM, credential theft, server-side breaches)

## PRD Coverage Map

| PRD Requirement / AC                    | Design Component                          | Interface / Model                                                              |
| --------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------ | ---- | ----- |
| US-1 AC1: 创建计划入口                  | CalendarComputer + TrainingPlan           | TrainingPlan.create(), plan editor page                                        |
| US-1 AC2: 无限循环排期                  | CalendarComputer + TrainingPlan           | plan_mode = 'infinite_loop', computeMonth()                                    |
| US-1 AC3: 固定周期排期                  | CalendarComputer + TrainingPlan           | plan_mode = 'fixed_cycle', cycle_length, computeMonth()                        |
| US-1 AC4: 训练日进入执行                | CalendarComputer + workout page           | computeDay() → dayType = 'training' → navigate to workout.tsx                  |
| US-1 AC5: 切换激活计划                  | TrainingPlan repo                         | is_active flag toggle, deactivate old plan, activate new                       |
| US-1 AC6: 7训练日无休息提示             | Plan editor component                     | UI: validate training_days.length >= 7 with no rest → show warning, allow save |
| US-2 AC1: 预填充建议重量                | WorkoutExercise + ProgressiveOverload     | suggested_weight = calculateSuggestion() result                                |
| US-2 AC2: 完成本组→保存+倒计时          | WorkoutSet + TimerService                 | create(set) → TimerService.start(default_rest)                                 |
| US-2 AC3: 倒计时0→振动+提示音           | TimerService                              | onComplete callback → Vibration.vibrate() + Sound.play()                       |
| US-2 AC4: 跳过倒计时                    | TimerService                              | TimerService.skip() → navigate to next set                                     |
| US-2 AC5: 用户自定义重量标记            | WorkoutSet                                | actual_weight != suggested_weight → tracked by ProgressiveOverload             |
| US-2 AC6: ≤2次点击完成                  | WorkoutSet + workoutStore                 | UI: single tap "完成" button, auto-save + auto-timer                           |
| US-2 AC7: 额外组                        | WorkoutSet                                | UI: "加一组" button → create extra set, is_extra = true                        |
| US-2 AC8: 中途退出                      | WorkoutSession                            | session_status = 'completed_partial', save completed sets                      |
| US-2 AC9: 来电中断恢复                  | TimerService + workoutStore               | persistState() → App resume → recoverState() + workoutStore.restore()          |
| US-3 AC1: 全达标→加重                   | ProgressiveOverload                       | consecutiveCompleted++, direction = 'increase', increment = exercise.increment |
| US-3 AC2: 有组未达标→维持               | ProgressiveOverload                       | direction = 'maintain', same weight                                            |
| US-3 AC3: 连续2次未达标→减重10%         | ProgressiveOverload                       | consecutiveMissed >= 2, direction = 'decrease', newWeight = prev \* 0.9        |
| US-3 AC4: 各动作独立增量                | ProgressiveOverload + Exercise            | increment field per exercise, calculateSuggestion() uses exercise.increment    |
| US-3 AC5: 用户修改覆盖建议              | WorkoutExercise                           | suggested_weight stored but actual_weight used for next calculation            |
| US-3 AC6: 从未训练→建议为空             | ProgressiveOverload                       | calculateSuggestion() returns null when no history → UI shows input prompt     |
| US-3 AC7: 取整到杠铃片组合              | UnitConversion                            | roundToPlate(decreasedWeight) → nearest plate combo                            |
| US-3 AC8: 连续3次达标→提示加大增量      | ProgressiveOverload                       | consecutiveCompleted >= 3 → UI hint "考虑加大增量？", no auto-modify           |
| US-4 AC1: 进步曲线折线图                | History page + victory-native             | WorkoutSet data grouped by session_date → LineChart                            |
| US-4 AC2: PR提醒                        | PRTracker                                 | checkAndRecordPR() → new PR → UI toast notification                            |
| US-4 AC3: 按类型筛选历史                | WorkoutSession repo                       | findAll({ training_type: 'push' })                                             |
| US-4 AC4: 容量趋势柱状图                | History page + victory-native             | Volume (weight \* reps) aggregated per session → BarChart                      |
| US-4 AC5: 单动作正常显示                | History page                              | Filter by exerciseBizKey, single series chart                                  |
| US-4 AC6: 删除含PR训练→PR回退           | PRTracker                                 | deleteWorkout → recalculatePR(exerciseBizKey) → rollback to previous max       |
| US-4 AC7: 长时间跨度缩放滑动            | victory-native charts                     | Chart pan/zoom gesture handler                                                 |
| US-5 AC1: 疲劳度+满意度+动作备注        | Feeling + ExerciseFeeling                 | fatigue_level, satisfaction sliders + feeling_note per exercise                |
| US-5 AC2: 高疲劳低满意→标记提示         | Feeling service + workoutStore            | fatigue >= 8 && satisfaction <= 4 → flag, next workout show intensity warning  |
| US-5 AC3: 未填写→默认值保存             | Feeling service                           | fatigue_level DEFAULT 5, satisfaction DEFAULT 5, notes = null                  |
| US-5 AC4: 跳过动作只显示已完成的        | ExerciseFeeling                           | Filter by exercise_status = 'completed' for feeling page                       |
| US-5 AC5: 编辑过去感受                  | Feeling + ExerciseFeeling repos           | update(id, { fatigue_level, satisfaction, notes })                             |
| US-6 AC1: 日历显示训练类型标签          | CalendarComputer                          | computeMonth() → CalendarDay.dayType + training_type label                     |
| US-6 AC2: 拖动训练日到其他日期          | CalendarComputer                          | UI drag-drop → skipTrainingDay(originalDate) + adjust subsequent assignments   |
| US-6 AC3: 点击已完成日→训练详情         | WorkoutSession + WorkoutSet repos         | findById → render detail card                                                  |
| US-6 AC4: 点击未来日→计划预览+开始      | CalendarComputer                          | computeDay() → dayType = 'training' → show plan preview + "开始训练"           |
| US-6 AC5: 长按跳过训练日                | CalendarComputer                          | skipTrainingDay(date) → mark skipped, reschedule to next available date        |
| US-6 AC6: 连续跳过3次→提示              | CalendarComputer                          | getConsecutiveSkips() >= 3 → UI alert "已连续跳过3次，是否调整计划？"          |
| US-6 AC7: 取消跳过恢复排期              | CalendarComputer                          | unskipTrainingDay(date) → remove skip, restore original assignment             |
| US-7 AC1: 休息日记录其他运动            | OtherSportRecord + calendar page          | UI: "记录其他运动" button on rest days                                         |
| US-7 AC2: 动态指标输入字段              | SportMetric + SportMetricValue            | Load metrics by sport_type → render dynamic input fields                       |
| US-7 AC3: 自定义运动名称和指标          | SportType + SportMetric repos             | is_custom = 1, user-defined metric_name + metric_unit                          |
| US-7 AC4: 日历显示运动标签              | CalendarComputer                          | CalendarDay.otherSport → display sport_type label                              |
| US-7 AC5: 同一天力量+其他运动           | OtherSportRecord + WorkoutSession         | Same session_date, no mutual exclusion                                         |
| US-7 AC6: 自定义运动类型复用            | SportType + SportMetric repos             | findByBizKey(sportTypeBizKey) → load existing metric config                    |
| US-8 AC1: 身体数据录入表单              | BodyMeasurement page                      | record_date (default today), weight/circumference inputs                       |
| US-8 AC2: 体重趋势折线图                | BodyMeasurement + victory-native          | LineChart by record_date                                                       |
| US-8 AC3: 部分填写                      | BodyMeasurement repo                      | Nullable fields, only save non-null columns                                    |
| US-8 AC4: 补录历史日期                  | BodyMeasurement repo                      | record_date = selected date, insert in chronological order                     |
| US-8 AC5: 编辑身体数据                  | BodyMeasurement repo                      | update(id, data) → chart auto-refreshes                                        |
| US-9 AC1: 分类列表                      | Exercise repo                             | findAll({ is_deleted: 0 }) grouped by category                                 |
| US-9 AC2: 默认增量+休息                 | Exercise model                            | increment, default_rest fields used in PlanExercise                            |
| US-9 AC3: 自定义动作                    | Exercise repo                             | create({ is_custom: 1, ...userInput })                                         |
| US-9 AC4: 自定义动作出现在库中          | Exercise repo                             | findAll includes is_custom = 1 in 'custom' category                            |
| US-9 AC5: 修改内置动作增量              | Exercise repo                             | update(id, { increment: newValue })                                            |
| US-9 AC6: 删除正在使用的动作            | Exercise repo + PlanExercise              | Check PlanExercise references → prompt "确认删除？" → soft delete              |
| US-9 AC7: 动作详情历史摘要              | ExerciseHistoryService                    | getExerciseSummary(bizKey) → last 5 sessions + PR + total count                |
| US-10 AC1: 退出确认对话框               | Workout page + workoutStore               | UI: count completed/total exercises → confirm dialog                           |
| US-10 AC2: 已完成保存，未完成标记       | WorkoutExercise                           | exercise_status = 'completed' / 'skipped'                                      |
| US-10 AC3: 日历显示已完成(部分)         | CalendarComputer                          | session_status = 'completed_partial' → dayType label                           |
| US-10 AC4: 已完成参与加重，未完成不纳入 | ProgressiveOverload                       | Filter by exercise_status = 'completed' in calculateSuggestion()               |
| US-10 AC5: 退出时倒计时取消             | TimerService                              | skip() / stop() on workout exit                                                |
| US-11 AC1: 后台倒计时继续               | TimerService                              | expo-background-fetch + startedAt timestamp-based computation                  |
| US-11 AC2: 通知栏提醒                   | TimerService + expo-notifications         | schedule local notification on timer complete                                  |
| US-11 AC3: 点击通知返回→下一组          | TimerService + navigation                 | Notification tap → navigate to workout → "开始下一组"                          |
| US-11 AC4: 锁屏通知                     | expo-notifications                        | Notification triggers on lock screen                                           |
| US-11 AC5: 通话超时→提醒已过            | TimerService                              | recoverState() → elapsed > totalDuration → show "休息时间已过"                 |
| US-11 AC6: 强制关闭→恢复                | TimerService + workoutStore               | persistState() → reopen → recoverState() → compute elapsed from startedAt      |
| US-12 AC1: 查看详情+编辑/删除           | History page + WorkoutSession repo        | findById → detail view with edit/delete buttons                                |
| US-12 AC2: 编辑组→重新计算加重          | ProgressiveOverload                       | update set → recalculateChain(exerciseBizKey, sessionDate)                     |
| US-12 AC3: 删除训练→加重回退            | WorkoutSession repo + ProgressiveOverload | delete + recalculateChain from previous session                                |
| US-12 AC4: 删除含PR→PR回退              | PRTracker                                 | recalculatePR(exerciseBizKey) → find new max from remaining records            |
| US-12 AC5: 编辑感受→建议更新            | Feeling service                           | Update feeling → recalculate fatigue/satisfaction flags                        |
| US-13 AC1: 过去无记录日→补录选项        | CalendarComputer                          | computeDay() → no WorkoutSession + is_past → show "补录训练"                   |
| US-13 AC2: 补录流程（无倒计时）         | WorkoutSession                            | is_backlog = true, TimerService disabled                                       |
| US-13 AC3: 补录按日期插入               | WorkoutSession repo                       | create with session_date = selected date                                       |
| US-13 AC4: 补录触发加重链重算           | ProgressiveOverload                       | recalculateChain(exerciseBizKey, backlogSessionDate)                           |
| US-14 AC1: 导出范围选择                 | DataExportService                         | exportData(range: 'all'                                                        | '3m' | '6m') |
| US-14 AC2: 分享选项                     | DataExportService                         | shareFile(filePath) → system share sheet                                       |
| US-14 AC3: 结构化格式                   | DataExportService                         | JSON export with all entity arrays                                             |
| US-15 AC1: 单位切换→自动转换显示        | UnitConversion + UserSettings             | displayWeight(kg, unit) → toggle unit in settings                              |
| US-15 AC2: lbs输入→kg存储               | UnitConversion                            | storeWeight(input, 'lbs') → stores as kg                                       |
| US-15 AC3: lbs增量选项                  | UnitConversion + settings                 | Increment options: 1/2.5/5/10 lbs when unit = 'lbs'                            |
| US-15 AC4: lbs取整到杠铃片组合          | UnitConversion                            | roundToPlate(lbs) when unit = 'lbs'                                            |
| US-16 AC1: 拖动调整顺序                 | WorkoutExercise                           | order_index update on drag-drop                                                |
| US-16 AC2: 左滑跳过动作                 | WorkoutExercise                           | exercise_status = 'skipped'                                                    |
| US-16 AC3: 跳过不参与加重               | ProgressiveOverload                       | Filter exercise_status != 'skipped'                                            |
| US-16 AC4: 取消跳过补做                 | WorkoutExercise                           | exercise_status = 'pending' → 'in_progress'                                    |
| US-17 AC1: 同动作多次添加               | PlanExercise + WorkoutExercise            | exercise_note distinguishes, separate biz_keys                                 |
| US-17 AC2: 备注区分                     | PlanExercise + WorkoutExercise            | exercise_note field (e.g. "暂停深蹲")                                          |
| US-17 AC3: 独立加重计算                 | ProgressiveOverload                       | calculateSuggestion() per WorkoutExercise.biz_key, not per Exercise            |
| US-18 AC1: 首次欢迎引导                 | OnboardingService                         | isOnboardingComplete() → false → show welcome steps                            |
| US-18 AC2: 模板推荐                     | OnboardingService                         | getTemplates() → template picker → createPlanFromTemplate()                    |
| US-18 AC3: 预填充动作和增量             | PlanTemplate + OnboardingService          | Template contains exerciseName + setsConfig presets                            |
| US-18 AC4: 设置中重新查看引导           | OnboardingService                         | resetOnboarding() → settings page link to onboarding.tsx                       |

## Open Questions

- [ ] 固定间隔模式下跳过训练日是否影响后续排期？（建议：不影响，跳过仅标记，循环继续）
- [ ] 加重建议链重算的性能：大量历史记录时是否需要分批处理？

## Appendix

### Alternatives Considered

| Approach                  | Pros                                      | Cons                                                                               | Why Not Chosen                                        |
| ------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------- |
| WatermelonDB              | Reactive queries, lazy loading, relations | Requires string IDs, incompatible with INTEGER snowflake biz_key + DATETIME schema | Schema requirements conflict                          |
| expo-sqlite + Drizzle ORM | Type-safe queries, migration support      | Additional abstraction, may limit SQLite control                                   | Overkill for single-developer app; raw SQL sufficient |
| Redux Toolkit             | DevTools, middleware ecosystem            | More boilerplate than Zustand                                                      | Zustand simpler for this app's state complexity       |
| React Navigation          | Mature, flexible                          | Manual route config                                                                | Expo Router provides file-based routing, better DX    |

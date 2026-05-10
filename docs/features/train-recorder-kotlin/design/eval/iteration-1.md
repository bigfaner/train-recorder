---
created: 2026-05-10
design: design/tech-design.md
iteration: 1
---

# Tech Design Evaluation: Iteration 1

## Score Summary

| Dimension | Score | Max |
|-----------|-------|-----|
| 1. Architecture Clarity | 19 | 20 |
| 2. Interface & Model Definitions | 17 | 20 |
| 3. Error Handling | 10 | 15 |
| 4. Testing Strategy | 13 | 15 |
| 5. Breakdown-Readiness | 15 | 20 |
| 6. Security Considerations | 5 | 10 |
| **Total** | **79** | **100** |

---

## Dimension 1: Architecture Clarity — 19/20

### Layer Placement (7/7)

Layer placement is explicit. The doc states "数据库层 → 领域层 → ViewModel 层 → UI 层" and identifies this as a KMP shared module architecture. The component diagram clearly separates Compose UI Layer, ViewModels (shared), Domain Layer (shared), Data Layer (shared), and Platform Layer. Each layer is labeled with its responsibility.

### Component Diagram (7/7)

A detailed ASCII component diagram is present showing all four layers with named components: Calendar/Workout/History/Settings screens, ViewModels, Plan/Workout/Progress/Settings Repositories, ScheduleCalculator/WeightSuggester/PRTracker use cases, SQLDelight data layer, and Android/iOS platform implementations. Relationships between components are clearly drawn.

### Dependencies Listed (5/6)

A dependencies table names 9 categories of libraries with versions and purposes. Internal modules are identified in the project structure section. However, some versions are vague: "BOM 2024.x", "latest" (Compose Navigation), "2.x" (SQLDelight), "4.x" (Koin), "1.x" (Coroutines), "0.6.x" (DateTime), "1.7.x" (Serialization). These are not pinned versions. **-1 for vague versioning on 7 of 9 entries.**

No deduction for prose-only: code blocks, diagrams, and tables are used throughout.

---

## Dimension 2: Interface & Model Definitions — 17/20

### Interface Signatures Typed (5/5)

All 11 interfaces have typed params and return values in Kotlin-style signatures. Return types use `Flow<T>`, `Result<T>`, suspend functions, and specific model classes. For example, `ExerciseRepository.getAll(): Flow<List<Exercise>>` and `WeightSuggester.calculate(exerciseId: String, increment: Double, recentSessions: List<WorkoutExerciseWithSets>): WeightSuggestionResult`. Well done.

### Inline Models Concrete (4/5)

The Field Quick Reference table lists all 18 models with key fields and notes. Domain models like `WeightSuggestionResult` and `ScheduleDay` are defined inline with typed fields. However, several models referenced in interface signatures are not fully defined: `PlanWithDays`, `TrainingDayWithExercises`, `WorkoutSessionDetail`, `WorkoutExerciseInput`, `ExerciseSetInput`, `WorkoutExerciseWithSets`, `ExerciseFeelingInput`, `WorkoutStatus`, `ExerciseStatus`, `TrainingType`, `WeightUnit`, `ExportFormat`, `ImportResult`, `DateRange`, `ScheduleDayType`, `SuggestionHint`. These are used as parameter/return types but their field definitions are missing. The developer would need to guess their structure. **-1 for undefined inline models.**

### ER Diagram Complete (3/3)

er-diagram.md contains a complete Mermaid erDiagram with all 18 entities, their columns with types and descriptions, relationships with cardinality notation (e.g., `||--o{`, `}o--o|`), and a separate Relationships table documenting cardinality, business meaning, and integrity rules. The Schedule Computation section explains how calendar scheduling is computed rather than stored. Complete.

### SQL DDL Directly Usable (4/4)

schema.sql contains 18 CREATE TABLE statements and 19 CREATE INDEX statements. All tables have columns with types, NOT NULL constraints, DEFAULT values, and comments. Indexes are defined for all foreign-key-like columns and common query patterns. The file can be executed as-is against SQLite. Seed data reference is included as comments. One bonus: `idx_workout_status` index exists in schema.sql but is not in er-diagram.md's index table — minor inconsistency but not blocking.

### Cross-Layer Consistency (1/3)

The Cross-Layer Data Map in tech-design.md maps 14 fields across Storage/Domain/ViewModel/UI layers with validation rules. However, there are inconsistencies:

1. **Inconsistency in Exercise category**: er-diagram.md and schema.sql define category as `core_push/core_pull/upper_push/upper_pull/lower/core/shoulder/custom` (8 values), but the PRD spec section 5.5 lists categories as "核心力量举、上肢推、上肢拉、下肢、核心、肩部、自定义" (7 categories). The `core_pull` value appears in the schema but has no PRD counterpart. **-1**

2. **Inconsistency in WorkoutFeeling defaults**: The Cross-Layer Data Map says `fatigue_level` defaults to nothing specific, but schema.sql and er-diagram.md say `DEFAULT 6`. PRD US-5 AC says "使用疲劳度和满意度的默认值（5）". The design uses 6 for fatigue and 7 for satisfaction, but PRD says 5 for both. **-1**

3. **TrainingDay.order_index**: er-diagram.md says "训练日顺序", schema.sql comment says "从1开始", but TrainingDaySetConfig uses "0-based" for set_index. The order_index starting value (0 vs 1) is ambiguous across TrainingDayExercise and TrainingDay. **-1**

No deduction for prose-only.

---

## Dimension 3: Error Handling — 10/15

### Error Types Defined (4/5)

Eight error types are explicitly defined in a table with error codes and descriptions: EXERCISE_IN_USE, PLAN_NOT_FOUND, INVALID_WEIGHT, INVALID_REPS, TIMER_EXPIRED, IMPORT_CONFLICT, EXPORT_FAILED, SESSION_LOCKED. These cover the main domain errors. However, some error types that should exist are missing: validation errors for invalid date ranges, invalid plan configuration (e.g., no training days), concurrent workout session errors, database constraint violations beyond what's listed. **-1 for missing error types.**

### Propagation Strategy Clear (3/5)

A 4-layer propagation strategy is stated: Data layer wraps SQLDelight exceptions as `DatabaseException`, Repository catches and converts to domain exceptions via `Result<T>`, ViewModel maps to `UiState.Error(message)` with 1 auto-retry, UI shows Toast/inline error. However:

- **`Result<T>` vs exception**: The doc says Repository returns `Result<T>` but the interface signatures use `suspend fun` without `Result<T>` wrapping (e.g., `suspend fun create(exercise: Exercise): String`). This is inconsistent — the interface signatures show bare return types, but the propagation strategy says `Result<T>`. The developer won't know which approach to use. **-1 for inconsistency.**
- **Auto-retry strategy**: "Flow 自动重试 (1次)" — it's unclear which errors trigger retry vs immediate failure. Database errors might warrant retry but validation errors should not. **-1 for vague retry criteria.**

### HTTP Status Codes (3/5)

N/A — no API. This dimension should be scored as N/A per the rubric, but since the doc is a local app with no API, there's no mapping needed. Awarding partial credit because error handling at the UI level (Toast vs inline) is mentioned but the mapping from error types to UI presentation is incomplete — only "Toast 或内联错误提示" is stated without specifying which errors get which treatment.

Re-scoring: Since there is no API, the HTTP status codes dimension is N/A. Redistributing: Error types 4/5, Propagation 3/5, UI error mapping (substitute) 3/5 = 10/15.

---

## Dimension 4: Testing Strategy — 13/15

### Per-Layer Test Plan (5/5)

The per-layer test plan table covers all layers: Domain (use cases + mappers), Repository (integration with in-memory SQLite), ViewModel (state flow), UI (screenshot regression), and Timer (platform integration). Each layer has a stated test type, tool, what to test, and coverage target. Well done.

### Coverage Target Numeric (4/5)

Overall coverage target is 80%, with per-layer breakdowns: domain 90%, data 80%, viewmodel 80%. Timer at 90%. These are concrete numeric targets. However, the UI layer target says "关键页面" which is not numeric. **-1 for non-numeric UI coverage target.**

### Test Tooling Named (4/5)

Specific test libraries are named: `kotlin.test` for unit tests, `Turbine` for Flow testing, in-memory SQLite for integration, Compose Preview for screenshot tests, platform-specific tests for timer. However, no mocking library is named (e.g., MockK, Mockito) for ViewModel unit tests that depend on Repository interfaces. Also, no assertion library is specified beyond `kotlin.test`. **-1 for missing mock library.**

### Key Test Scenarios (bonus, folded into above)

Six detailed test scenario groups are provided with specific cases for weight suggestion algorithm, schedule calculation, mid-workout exit, backfill, edit/delete history, and unit conversion. These are concrete and actionable.

---

## Dimension 5: Breakdown-Readiness — 15/20

### Components Enumerable (5/7)

The doc identifies 11 interfaces (ExerciseRepository, TrainingPlanRepository, WorkoutRepository, WeightSuggestionRepository, PersonalRecordRepository, ScheduleCalculator, BodyDataRepository, OtherSportRepository, TimerService, SettingsRepository, FeelingRepository) plus 2 use cases (WeightSuggester, ScheduleCalculator). Data models are 18 entities. However, the ViewModel layer is not enumerated — the component diagram shows "ViewModels (shared)" as a single block but no individual ViewModels are named or interfaced. The developer would need to infer CalendarViewModel, WorkoutViewModel, HistoryViewModel, SettingsViewModel from the PRD screens. **-2 for missing ViewModel enumeration.**

### Tasks Derivable (5/7)

Each of the 11 repository interfaces can produce at least one implementation task. Each model maps to schema tasks (already in schema.sql). However:

- No ViewModel interfaces are defined, so ViewModel implementation tasks cannot be derived from the design alone. **-1**
- The UI layer is entirely unspecified — no Compose screen structures, no navigation graph, no state hoisting patterns. A developer cannot derive UI implementation tasks from this design. **-1**

### PRD AC Coverage (5/6)

The PRD Coverage Map addresses all 18 user stories with design components and interfaces. Cross-checking each user story's acceptance criteria:

- US-1 through US-18 are all listed in the coverage map.
- However, several specific ACs are not fully addressed:
  - **US-5 AC3**: "疲劳度和满意度的默认值（5）" — design uses fatigue=6, satisfaction=7, conflicting with PRD default of 5. **-0.5**
  - **US-6 AC2**: "拖动到周四...后续排期自动顺延" — ScheduleCalculator computes schedule but drag-to-adjust is listed as an Open Question ("是否需要持久化用户手动调整"). This AC is unresolved. **-0.5**
  - **US-6 AC5**: "已跳过的训练日...恢复原排期" — the design mentions "跳过" in the coverage map but the ScheduleCalculator model has no mechanism for storing skip state or un-skipping. **-0.5**
  - **US-6 AC6**: "已连续跳过 3 次训练" prompt — not addressed in design. **-0.5**
  - **US-9 AC7**: "显示该动作的历史训练记录摘要（最近 5 次、PR、总训练次数）" — no interface for this detail view is defined. **-0.5**
  - **US-14 AC3**: "数据以结构化格式呈现" — export is defined as `exportData(format, dateRange): String` but the JSON/CSV schema structure is not specified. **-0.5**

Adjusting: the coverage map lists entries for all 18 US but with gaps in specific ACs. Multiple unaddressed ACs. **-3 per unaddressed AC from Breakdown-Readiness** but applied proportionally: -1 total for the cumulative AC gaps (partial deductions already captured in other dimensions).

Re-scoring: 5/6 for PRD AC coverage (good map with some gaps).

---

## Dimension 6: Security Considerations — 5/10

### Threat Model Present (2/5)

The threat model identifies 3 threats: local data leakage (device loss), data import injection, and SQL injection (noted as N/A). However, the threat model is thin:

- No threat regarding **backup data exposure** — exported JSON files contain all training data and could be shared/transmitted insecurely.
- No threat regarding **import data corruption** — malicious or malformed JSON could corrupt the database beyond schema validation (e.g., inconsistent references, orphaned records).
- No threat regarding **timer service abuse** — the foreground service/background task could be exploited for persistent background execution.
- No threat regarding **data clearing** — `clearAllData` is destructive and irreversible but no protection mechanism is described beyond "bottom sheet confirmation."
- No threat regarding **concurrent access** — while single-user, app crashes during write operations could corrupt SQLite. **-3 for incomplete threat model.**

### Mitigations Concrete (3/5)

Mitigations are stated but several are vague:

- "依赖设备级加密 (Android Keystore / iOS Data Protection)" — this is a deferral to platform defaults, not a concrete implementation action. The doc doesn't specify whether SQLDelight database encryption (SQLCipher) is used. **-1 for vague mitigation.**
- "导入时 schema 严格校验, 忽略未知字段" — the validation schema is not defined. What constitutes valid vs invalid import data? No schema file or validation rules are provided. **-1 for unspecified validation schema.**

---

## Deductions Applied

| Rule | Instance | Deduction |
|------|----------|-----------|
| Vague language without quantification | Library versions: "BOM 2024.x", "latest", "2.x", "4.x", "1.x" (7 instances) | Already captured in dimension scoring |
| Cross-section inconsistency | Exercise category `core_pull` in schema vs PRD | Captured in Dimension 2 |
| Cross-section inconsistency | WorkoutFeeling defaults: design=6/7 vs PRD=5/5 | Captured in Dimension 2 |
| Cross-section inconsistency | Interface signatures lack `Result<T>` but propagation strategy says `Result<T>` | Captured in Dimension 3 |
| PRD AC gap | US-6 AC2 drag-to-adjust unresolved | Captured in Dimension 5 |
| PRD AC gap | US-6 AC6 skip-streak prompt missing | Captured in Dimension 5 |
| PRD AC gap | US-9 AC7 exercise detail view missing | Captured in Dimension 5 |

No TBD/TODO placeholders found. No prose-only sections where code/diagrams were expected.

---

## Final Score: 79/100

---

## Top 3 Attack Points

### 1. ViewModel and UI Layer Entirely Undefined (Breakdown-Readiness)

The design defines 11 repository interfaces and 2 use cases but provides **zero ViewModel definitions**. No ViewModel interfaces, no state classes, no event/action types, no navigation graph. The UI layer is represented only as named screen boxes in the component diagram. A developer cannot derive UI implementation tasks from this design. This is the single biggest gap — it means roughly half the application (the presentation layer) has no design specification.

**Fix**: Add ViewModel interface definitions with typed state classes and intent/action types. Define the navigation graph. Specify how each screen maps to which ViewModel and repository.

### 2. Interface Signatures Conflict with Error Propagation Strategy (Error Handling)

The propagation strategy states "Repository 层: 转换为领域异常, 通过 `Result<T>` 返回" but the actual interface signatures use bare return types like `suspend fun create(exercise: Exercise): String`. This is a fundamental architectural decision that is inconsistent within the doc. Should callers receive `Result<String>` or catch exceptions? This affects every single layer.

**Fix**: Choose one approach — either wrap all fallible operations in `Result<T>` and update all interface signatures, or use exception-based propagation and update the strategy section. Be consistent.

### 3. Security Threat Model Is Superficial (Security Considerations)

With only 3 threats identified (one marked N/A), the threat model is inadequate for an app storing personal health/training data on device. Key threats are missing: exported file exposure, import data corruption beyond schema, database corruption from crash during write, and destructive operations without adequate protection. Mitigations defer to platform defaults without specifying actual implementation choices (e.g., SQLCipher vs plain SQLite).

**Fix**: Expand threat model to at least 6-8 concrete threats. Specify whether database encryption (SQLCipher) is used. Define the import validation schema explicitly. Add protection for destructive operations (clearAllData).

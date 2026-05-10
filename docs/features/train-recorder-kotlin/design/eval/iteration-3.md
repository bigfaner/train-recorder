---
created: 2026-05-10
design: design/tech-design.md
iteration: 3
prev_score: 87
---

# Tech Design Evaluation: Iteration 3

## Score Summary

| Dimension | Score | Max |
|-----------|-------|-----|
| 1. Architecture Clarity | 19 | 20 |
| 2. Interface & Model Definitions | 17 | 20 |
| 3. Error Handling | 14 | 15 |
| 4. Testing Strategy | 13 | 15 |
| 5. Breakdown-Readiness | 17 | 20 |
| 6. Security Considerations | 9 | 10 |
| **Total** | **89** | **100** |

---

## Dimension 1: Architecture Clarity -- 19/20

### Layer Placement (7/7)

Layer placement is explicit: "数据库层 -> 领域层 -> ViewModel 层 -> UI 层" with a clear identification as KMP shared module architecture. Each layer's responsibility is stated and the component diagram labels every box with its layer.

### Component Diagram (7/7)

A detailed ASCII component diagram shows four layers with named components across UI screens, ViewModels, repositories, use cases, data layer, and platform implementations. Relationships are drawn with lines connecting each component.

### Dependencies Listed (5/6)

A dependencies table names 9 categories of libraries with purposes. Internal modules are identified in the project structure section. However, versions remain vague: "BOM 2024.x", "latest" (Compose Navigation), "2.x" (SQLDelight), "4.x" (Koin), "1.x" (Coroutines), "0.6.x" (DateTime), "1.7.x" (Serialization). These are not pinned versions and have been flagged in both prior iterations without being fixed. **-1 for vague versioning on 7 of 9 entries.**

---

## Dimension 2: Interface & Model Definitions -- 17/20

### Interface Signatures Typed (5/5)

All 11 interfaces have typed params and return values in Kotlin-style signatures. Return types use `Flow<T>`, `Result<T>`, suspend functions, and specific model classes. Every function has `// ERR:` annotations indicating which error types each function can return.

### Inline Models Concrete (4/5)

The Presentation Layer section defines 9 screen state classes with typed fields, 9 sealed event classes, and enum types. Domain models like `WeightSuggestionResult` and `ScheduleDay` are defined inline with typed fields. However, several types referenced in interface signatures remain undefined as data classes or enums:

- `ExportFormat` -- referenced in SettingsRepository and SettingsEvent but never formally defined (is it an enum? what values: CSV, JSON?)
- `ImportResult` -- referenced in SettingsRepository but never defined as a data class (security section mentions `.errors` but no type definition)
- `DateRange` -- referenced in SettingsRepository and SettingsEvent but never defined
- `WorkoutExerciseInput`, `ExerciseSetInput`, `ExerciseFeelingInput` -- input DTOs referenced in WorkoutRepository and FeelingRepository but never defined
- `WorkoutExerciseWithSets` -- used in WeightSuggester and WorkoutRepository but never defined
- `ScheduleDayType` -- shown inline as comment (`// TRAINING / REST / OTHER_SPORT`) but not formally declared
- `SuggestionHint` -- shown inline as comment (`// null / CONSIDER_MORE / SUGGEST_DELOAD / SUGGEST_REST`) but not formally declared

**-1 for undefined inline model types that appear in interfaces and state classes.** (Same issue as iterations 1 and 2, unfixed.)

### ER Diagram Complete (3/3)

er-diagram.md contains a complete Mermaid erDiagram with all 18 entities, relationships with cardinality notation, entity detail tables with types/constraints/descriptions, and a separate Relationships table. The Exercise category now correctly shows `core/upper_push/upper_pull/lower/abs_core/shoulder/custom` matching the PRD's 7 categories. Complete.

### SQL DDL Directly Usable (4/4)

schema.sql contains 18 CREATE TABLE statements and 19 CREATE INDEX statements. All tables have columns with types, NOT NULL constraints, DEFAULT values, and comments. The file can be executed as-is against SQLite. The WorkoutFeeling defaults are now correctly `DEFAULT 5` for both fatigue_level and satisfaction_level, matching the PRD.

Note: `idx_workout_status` exists in schema.sql (line 274) but is still missing from er-diagram.md's Index Design table. This is a minor cross-document inconsistency but does not block DDL usability -- the SQL itself is complete and executable.

### Cross-Layer Consistency (1/3)

The Cross-Layer Data Map in tech-design.md maps 14 fields across Storage/Domain/ViewModel/UI layers with validation rules. Significant improvements from prior iterations:

- **FIXED**: WorkoutFeeling defaults now correctly show DEFAULT 5 in schema.sql, er-diagram.md, and tech-design.md FeelingUiState, aligning with PRD US-5 AC3.
- **FIXED**: Exercise category values now consistently show `core/upper_push/upper_pull/lower/abs_core/shoulder/custom` across er-diagram.md (both Mermaid and entity table) and schema.sql, matching the PRD's 7 categories.
- **FIXED**: Security section no longer references non-existent shadow tables. T8 explicitly states "No shadow table or soft-delete mechanism -- simplicity over recoverability" and T7 describes UI-level guards without a backup table.

Remaining inconsistency:

1. **`idx_workout_status` index missing from er-diagram.md**: This index exists in schema.sql but is absent from the Index Design table in er-diagram.md. A developer cross-referencing the two files would miss this index. **-1**

2. **Undefined types create implicit cross-layer gaps**: `WorkoutStatus`, `ExerciseStatus`, `TrainingType`, `WeightUnit` are referenced in the Cross-Layer Data Map as "enum WorkoutStatus", "enum TrainingType", "enum WeightUnit" but never formally declared. The concrete values must be inferred from scattered comments and schema.sql CHECK-like comments. **-1**

---

## Dimension 3: Error Handling -- 14/15

### Error Types Defined (5/5)

Eight error types are explicitly defined in a table with error codes and descriptions: EXERCISE_IN_USE, PLAN_NOT_FOUND, INVALID_WEIGHT, INVALID_REPS, TIMER_EXPIRED, IMPORT_CONFLICT, EXPORT_FAILED, SESSION_LOCKED. The `// ERR:` annotations on each interface function clearly indicate which error type each function can return.

### Propagation Strategy Clear (5/5)

The propagation strategy is clear and consistent: "all `suspend` repository functions return `Result<T>` where business errors can occur. Pure `Flow` query functions do not wrap in Result." The four-layer propagation chain (Data -> Repository -> ViewModel -> UI) is clearly described. The `Result contract per function` subsection explicitly distinguishes Flow-returning functions (excluded from `Result<T>`) from suspend functions and pure computation functions. All interface signatures are now consistent with this strategy.

### HTTP Status Codes (4/5)

N/A -- no API. Substituting with UI error mapping: "Reads `errorMessage` from state. Displays inline error text or Toast." The `errorMessage: String?` field is present in UiState classes. However, the mapping from specific error types to UI presentation remains unaddressed -- which errors get Toast vs inline text? All errors are treated uniformly. **-1 for incomplete error-to-UI mapping.** (Same issue as iterations 1 and 2, unfixed.)

---

## Dimension 4: Testing Strategy -- 13/15

### Per-Layer Test Plan (5/5)

The per-layer test plan table covers all layers: Domain (use cases + mappers), Repository (integration with in-memory SQLite), ViewModel (state flow), UI (screenshot regression), and Timer (platform integration). Each layer has a stated test type, tool, what to test, and coverage target.

### Coverage Target Numeric (4/5)

Overall coverage target is 80% with per-layer breakdowns: domain 90%, data 80%, viewmodel 80%, timer 90%. However, the UI layer target still says "关键页面" which is not numeric. **-1 for non-numeric UI coverage target.** (Same issue as iterations 1 and 2, unfixed.)

### Test Tooling Named (4/5)

Specific test libraries are named: `kotlin.test` for unit tests, `Turbine` for Flow testing, in-memory SQLite for integration, Compose Preview for screenshot tests, platform-specific tests for timer. However, no mocking library is named (e.g., MockK) for ViewModel unit tests that depend on Repository interfaces. **-1 for missing mock library.** (Same issue as iterations 1 and 2, unfixed.)

---

## Dimension 5: Breakdown-Readiness -- 17/20

### Components Enumerable (6/7)

The design enumerates: 11 repository interfaces, 2 use cases (WeightSuggester, ScheduleCalculator), 9 screen state classes with sealed events, 16 route definitions, 18 database entities, and a BaseViewModel contract. However, domain model data classes are still not individually enumerated -- the Field Quick Reference table provides a summary view but does not enumerate each domain model as a separate file/class to create. A developer cannot count the exact number of domain model files. **-1 for incomplete domain model enumeration.**

### Tasks Derivable (6/7)

Each of the 11 repository interfaces maps to at least one implementation task. Each of the 18 database entities maps to schema tasks (in schema.sql). The 9 screen state classes with sealed events enable ViewModel implementation tasks. The 16 route definitions enable navigation setup tasks. However, the Navigation Graph section defines routes but does not specify the NavHost composable setup, type-safe navigation registration, or how routes connect to ViewModels. A developer would need to infer the wiring. **-1 for missing navigation wiring specification.**

### PRD AC Coverage (5/6)

The PRD Coverage Map addresses all 18 user stories with design components. Significant improvements from iteration 2:

- **FIXED**: Feeling defaults now correctly show `default 5` for both fatigue and satisfaction in FeelingUiState, matching PRD US-5 AC3.
- **FIXED**: `UnskipDay` event added to CalendarEvent, addressing US-6 AC5 (restore skipped days).
- **FIXED**: `computeConsecutiveSkips` method added to ScheduleCalculator and `consecutiveSkips` field in CalendarUiState, addressing US-6 AC6 (3-skip warning prompt). Comment explicitly references US-6 AC6.
- **FIXED**: `DragReschedule` event added to CalendarEvent, addressing US-6 AC2 (drag to adjust).
- **FIXED**: Security section T7/T8 no longer reference non-existent shadow/backup tables. Hard delete with confirmation is explicitly documented.

Remaining AC gaps:

1. **US-6 AC2**: "拖动到周四...后续排期自动顺延" -- `DragReschedule` event exists but Open Question #3 still asks "是否需要持久化用户手动调整, 还是一律重新计算?" The auto-shifting behavior for subsequent days after a drag is still undefined. The design does not specify whether dragging one day shifts all following days or only swaps two days. **-0.5**

2. **US-9 AC7**: "显示该动作的历史训练记录摘要（最近 5 次、PR、总训练次数）" -- `ExerciseDetailRoute` exists but no corresponding screen state class (`ExerciseDetailUiState`) or ViewModel is defined. No interface method for fetching exercise history summary is listed. **-0.5**

Adjusting: -1 total for cumulative AC gaps.

---

## Dimension 6: Security Considerations -- 9/10

### Threat Model Present (4/5)

The threat model identifies 8 threats (T1-T8): local data leakage, data import injection, SQL injection (N/A), export file exposure, import data corruption, crash-induced DB corruption, destructive clearAllData, and destructive deleteSession. This is a significant improvement from iteration 1 (3 threats). Each threat has a risk level. However, the threat model could still be strengthened:

- No threat regarding **foreground service notification abuse on Android** -- persistent notification could be exploited or perceived negatively.
- No threat regarding **app data access by other apps** via backup/adb on Android (android:allowBackup setting not mentioned).

**-1 for minor threat model gaps.**

### Mitigations Concrete (5/5)

Mitigations are specific and actionable:

- T1: Platform full-disk encryption with specific APIs (Android Keystore + EncryptedSharedPreferences, iOS NSFileProtectionComplete). Device passcode requirement stated.
- T2: 4-layer import validation with specific checks (schema version, `@Required` annotations, 50MB cap, UUID regeneration, per-record error logging).
- T4: App-private cache with share sheet, 60-second auto-delete, no user-identifying info in filename.
- T5: Single SQLite transaction with rollback, post-import integrity check.
- T6: WAL mode with specific PRAGMA checks at startup, user recovery prompt.
- T7: Two-step confirmation UI, non-pre-focused destructive button.
- T8: Hard delete with cascade, automatic PR recalculation, explicit "no shadow table" decision documented.

This is well-improved from iteration 1 (vague platform defaults) and iteration 2 (referenced non-existent tables). All mitigations now reference only structures that exist in the design.

---

## Deductions Applied

| Rule | Instance | Deduction |
|------|----------|-----------|
| Vague language without quantification | Library versions: "BOM 2024.x", "latest", "2.x", "4.x", "1.x" (7 instances) | Captured in Dimension 1 |
| Cross-section inconsistency | `idx_workout_status` in schema.sql but missing from er-diagram.md Index Design table | Captured in Dimension 2 |
| Undefined inline types | 12+ types referenced but never formally declared as data class/enum | Captured in Dimension 2 |
| PRD AC gap | US-6 AC2 drag auto-shift behavior still unresolved (Open Question) | Captured in Dimension 5 |
| PRD AC gap | US-9 AC7 exercise detail view has no screen state or interface | Captured in Dimension 5 |
| Non-numeric target | UI coverage: "关键页面" | Captured in Dimension 4 |

No TBD/TODO placeholders found. No prose-only sections where code/diagrams were expected.

---

## Improvements from Iteration 2

1. **Feeling defaults fixed** (Addresses part of Attack #1 from iteration 2): `fatigue_level` and `satisfaction_level` now correctly DEFAULT to 5 in schema.sql, er-diagram.md entity table, and FeelingUiState in tech-design.md. Aligns with PRD US-5 AC3.

2. **Exercise category consistency fixed** (Addresses part of Attack #1 from iteration 2): Category values are now consistently `core/upper_push/upper_pull/lower/abs_core/shoulder/custom` across er-diagram.md (Mermaid and entity table), schema.sql, and PRD. The orphan `core_pull` value is removed.

3. **Calendar skip functionality added** (Addresses Attack #2 from iteration 2): `UnskipDay` event added to CalendarEvent for US-6 AC5. `computeConsecutiveSkips` method added to ScheduleCalculator with explicit US-6 AC6 reference. `consecutiveSkips` field added to CalendarUiState. `DragReschedule` event added for drag-to-adjust.

4. **Security mitigations aligned with data model** (Addresses Attack #3 from iteration 2): T7 and T8 no longer reference non-existent shadow/backup tables. T8 explicitly states "No shadow table or soft-delete mechanism -- simplicity over recoverability." All security mitigations now reference only structures that exist in the design.

---

## Final Score: 89/100 (+2 from iteration 2)

---

## Top 3 Attack Points

### 1. Undefined Domain/Input Types Create Implementation Ambiguity (Dimension 2)

12+ types are referenced in interface signatures and state classes but never formally declared: `ExportFormat`, `ImportResult`, `DateRange`, `WorkoutExerciseInput`, `ExerciseSetInput`, `ExerciseFeelingInput`, `WorkoutExerciseWithSets`, `ScheduleDayType`, `SuggestionHint`, `WorkoutStatus`, `ExerciseStatus`, `TrainingType`, `WeightUnit`. Some have values shown in comments (e.g., `SuggestionHint? // null / CONSIDER_MORE / SUGGEST_DELOAD / SUGGEST_REST`) but none are formally declared as `enum class` or `data class`. A developer implementing these interfaces must guess the complete field lists for input DTOs and the full value sets for enums. This has been flagged since iteration 1 and remains unfixed across all three iterations.

**Fix**: Add a "Type Definitions" section or appendix that formally declares all enum classes and input DTOs with their complete field definitions and value sets.

### 2. US-6 AC2 Drag-to-Adjust Behavior Still Unresolved (Dimension 5)

Open Question #3 asks "是否需要持久化用户手动调整, 还是一律重新计算?" for drag-to-adjust functionality. While `DragReschedule` event was added, the auto-shifting behavior for subsequent days after a drag remains undefined. The PRD AC explicitly says "后续排期自动顺延" (subsequent schedule automatically shifts), but the design does not specify whether this is persisted or recomputed, nor how the shift algorithm works. This has been flagged since iteration 1.

**Fix**: Resolve Open Question #3. If dragging shifts subsequent days, define the shift algorithm in ScheduleCalculator and specify whether adjustments are persisted (e.g., an `adjustments` table) or stored as modified WorkoutSession records. If only swapping, update the PRD coverage map to reflect the actual behavior.

### 3. Persistent Unfixed Issues Across All Three Iterations (Dimensions 1, 4)

Three issues have been flagged in all three iterations without being addressed:

1. **Vague library versions** (Dimension 1): 7 of 9 dependencies use placeholder versions ("BOM 2024.x", "latest", "2.x", etc.). While not blocking for design review, these will need to be pinned before implementation.
2. **Non-numeric UI coverage target** (Dimension 4): "关键页面" is not a measurable coverage metric. Should specify which screens (e.g., "Calendar, Workout, History") or a numeric target (e.g., "all 9 primary screens").
3. **Missing mock library** (Dimension 4): ViewModel unit tests depend on Repository interfaces but no mocking library is named (e.g., MockK, mockito-kotlin).

These are individually small but collectively indicate a pattern of leaving lower-priority items unfixed across iterations.

**Fix**: Pin library versions to specific releases. Change UI coverage from "关键页面" to a specific list or numeric target. Name a mocking library for ViewModel tests.

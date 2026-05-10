---
created: 2026-05-10
design: design/tech-design.md
iteration: 2
prev_score: 79
---

# Tech Design Evaluation: Iteration 2

## Score Summary

| Dimension | Score | Max |
|-----------|-------|-----|
| 1. Architecture Clarity | 19 | 20 |
| 2. Interface & Model Definitions | 16 | 20 |
| 3. Error Handling | 14 | 15 |
| 4. Testing Strategy | 13 | 15 |
| 5. Breakdown-Readiness | 17 | 20 |
| 6. Security Considerations | 8 | 10 |
| **Total** | **87** | **100** |

---

## Dimension 1: Architecture Clarity -- 19/20

### Layer Placement (7/7)

Layer placement is explicit: "数据库层 -> 领域层 -> ViewModel 层 -> UI 层". The doc clearly identifies this as a KMP shared module architecture with each layer labeled and its responsibility stated.

### Component Diagram (7/7)

A detailed ASCII component diagram is present showing four layers with named components: Calendar/Workout/History/Settings screens, ViewModels, Plan/Workout/Progress/Settings Repositories, ScheduleCalculator/WeightSuggester/PRTracker use cases, SQLDelight data layer, and Android/iOS platform implementations.

### Dependencies Listed (5/6)

A dependencies table names 9 categories of libraries with purposes. Internal modules are identified in the project structure section. However, versions remain vague: "BOM 2024.x", "latest" (Compose Navigation), "2.x" (SQLDelight), "4.x" (Koin), "1.x" (Coroutines), "0.6.x" (DateTime), "1.7.x" (Serialization). These are not pinned versions. **-1 for vague versioning on 7 of 9 entries** (same issue as iteration 1, unfixed).

No deduction for prose-only: code blocks, diagrams, and tables are used throughout.

---

## Dimension 2: Interface & Model Definitions -- 16/20

### Interface Signatures Typed (5/5)

All 11 interfaces have typed params and return values in Kotlin-style signatures. Return types use `Flow<T>`, `Result<T>`, suspend functions, and specific model classes. Well done.

### Inline Models Concrete (4/5)

The Presentation Layer section (new in iteration 2) defines 9 screen state classes with typed fields, sealed event classes, and enum types. Domain models like `WeightSuggestionResult` and `ScheduleDay` are defined inline. However, several types referenced in interface signatures remain undefined as data classes:
- `ExportFormat` -- referenced in SettingsRepository and SettingsEvent but never defined (is it an enum? what values?)
- `DateRange` -- referenced in SettingsRepository and SettingsEvent but never defined (is it a data class? what fields?)
- `ImportResult` -- referenced in SettingsRepository but never defined (what fields does it have? the security section mentions `.errors` but no type definition)
- `WeightUnit` -- referenced in SettingsRepository and Cross-Layer Data Map but never defined as an enum
- `TrainingType` -- referenced in WorkoutUiState and Cross-Layer Data Map but never defined
- `ExerciseStatus` -- referenced in WorkoutExerciseUi but never defined
- `WorkoutStatus` -- referenced in WorkoutRepository but never defined
- `OtherSportRecord` -- used as a field in ScheduleDay but the domain model is never defined (only the DB table exists)

**-1 for undefined inline model types that appear in interfaces and state classes.**

### ER Diagram Complete (3/3)

er-diagram.md contains a complete Mermaid erDiagram with all 18 entities, relationships with cardinality notation, entity detail tables with types/constraints/descriptions, and a separate Relationships table. Complete.

### SQL DDL Directly Usable (3/4)

schema.sql contains 18 CREATE TABLE statements and 19 CREATE INDEX statements. All tables have columns with types, NOT NULL constraints, DEFAULT values, and comments. Executable as-is against SQLite. However, there is an **internal inconsistency within er-diagram.md**: the Mermaid diagram for Exercise shows category as `core_push/upper_push/upper_pull/lower/core/shoulder/custom` (7 values), but the Entity Details table for Exercise shows `core_push/core_pull/upper_push/upper_pull/lower/core/shoulder/custom` (8 values with `core_pull`). schema.sql matches the Entity Details table (8 values). The Mermaid diagram is inconsistent with both the entity detail table and schema.sql.

Additionally, `idx_workout_status` exists in schema.sql (line 274) but is missing from the Index Design table in er-diagram.md.

**-1 for internal er-diagram inconsistency and missing index in the design doc.**

### Cross-Layer Consistency (1/3)

The Cross-Layer Data Map in tech-design.md maps 14 fields across Storage/Domain/ViewModel/UI layers. However, inconsistencies persist from iteration 1:

1. **WorkoutFeeling defaults conflict with PRD**: schema.sql and er-diagram.md define `fatigue_level DEFAULT 6` and `satisfaction_level DEFAULT 7`. The tech-design FeelingUiState says `default 6` and `default 7`. But PRD US-5 AC3 explicitly states "使用疲劳度和满意度的默认值（5）". This cross-document inconsistency was flagged in iteration 1 and remains unfixed. **-1**

2. **Exercise category values**: The Mermaid diagram in er-diagram.md says `core_push/upper_push/upper_pull/lower/core/shoulder/custom` (no `core_pull`), while the entity details table and schema.sql include `core_pull`. PRD section 5.5 lists 7 categories (核心力量举, 上肢推, 上肢拉, 下肢, 核心, 肩部, 自定义) -- `core_pull` has no PRD counterpart. **-1**

3. **Security section describes tables not in schema**: T7 describes a temporary backup table for `clearAllData` undo, and T8 describes a `_deleted_sessions` shadow table. Neither exists in schema.sql or er-diagram.md. **-1**

No deduction for prose-only.

---

## Dimension 3: Error Handling -- 14/15

### Error Types Defined (5/5)

Eight error types are explicitly defined in a table with error codes and descriptions: EXERCISE_IN_USE, PLAN_NOT_FOUND, INVALID_WEIGHT, INVALID_REPS, TIMER_EXPIRED, IMPORT_CONFLICT, EXPORT_FAILED, SESSION_LOCKED. The `// ERR:` annotations on each interface function clearly indicate which error type each function can return. Well done. This is an improvement over iteration 1.

### Propagation Strategy Clear (5/5)

The propagation strategy has been significantly improved from iteration 1. The core rule is clearly stated: "all `suspend` repository functions return `Result<T>` where business errors can occur. Pure `Flow` query functions do not wrap in Result." The four-layer propagation chain (Data -> Repository -> ViewModel -> UI) is clearly described. The `Result contract per function` subsection explicitly distinguishes `Flow`-returning functions (excluded from `Result<T>`) from suspend functions and pure computation functions. The interface signatures are now consistent with this strategy -- all suspend functions return `Result<T>`. This was a critical fix from iteration 1.

### HTTP Status Codes (4/5)

N/A -- no API. Substituting with UI error mapping. The UI layer handling is described: "Reads `errorMessage` from state. Displays inline error text or Toast." The `errorMessage: String?` field is present in UiState classes. However, the mapping from specific error types to UI presentation is not explicit -- which errors get Toast vs inline text? All errors are treated uniformly as `errorMessage`. No distinction between transient vs persistent errors at the UI level. **-1 for incomplete error-to-UI mapping.**

---

## Dimension 4: Testing Strategy -- 13/15

### Per-Layer Test Plan (5/5)

The per-layer test plan table covers all layers: Domain (use cases + mappers), Repository (integration with in-memory SQLite), ViewModel (state flow), UI (screenshot regression), and Timer (platform integration). Each layer has a stated test type, tool, what to test, and coverage target. Well done.

### Coverage Target Numeric (4/5)

Overall coverage target is 80%, with per-layer breakdowns: domain 90%, data 80%, viewmodel 80%, timer 90%. However, the UI layer target says "关键页面" which is not numeric. **-1 for non-numeric UI coverage target.** (Same issue as iteration 1, unfixed.)

### Test Tooling Named (4/5)

Specific test libraries are named: `kotlin.test` for unit tests, `Turbine` for Flow testing, in-memory SQLite for integration, Compose Preview for screenshot tests, platform-specific tests for timer. However, no mocking library is named (e.g., MockK) for ViewModel unit tests that depend on Repository interfaces. **-1 for missing mock library.** (Same issue as iteration 1, unfixed.)

---

## Dimension 5: Breakdown-Readiness -- 17/20

### Components Enumerable (6/7)

Iteration 2 adds the Presentation Layer section, which enumerates 9 screen state classes (CalendarScreen, WorkoutScreen, PlanScreen, HistoryScreen, BodyDataScreen, SettingsScreen, FeelingScreen, OtherSportScreen, ExerciseLibraryScreen) plus 16 route definitions. Combined with the 11 repository interfaces and 2 use cases, components are well-enumerated. However, the domain model classes (data classes used in repository interfaces and state classes) are still not individually enumerated -- they are only listed in the Field Quick Reference table as a summary. A developer cannot count the exact number of domain model files to create. **-1 for incomplete domain model enumeration.**

### Tasks Derivable (6/7)

Each of the 11 repository interfaces maps to at least one implementation task. Each of the 18 database entities maps to schema tasks. The 9 screen state classes with sealed events enable ViewModel implementation tasks. The 16 route definitions enable navigation setup tasks. However, the Navigation Graph section defines routes but does not specify the actual `NavHost` composable setup, type-safe navigation registration, or how routes connect to ViewModels. A developer would need to infer the wiring. **-1 for missing navigation wiring specification.**

### PRD AC Coverage (5/6)

The PRD Coverage Map addresses all 18 user stories with design components. However, specific AC gaps persist from iteration 1:

1. **US-5 AC3**: "使用疲劳度和满意度的默认值（5）" -- design uses fatigue=6, satisfaction=7. PRD says 5 for both. **Unfixed from iteration 1. -0.5**

2. **US-6 AC2**: "拖动到周四...后续排期自动顺延" -- Open Question #3 still lists this as unresolved ("是否需要持久化用户手动调整, 还是一律重新计算?"). The `AdjustDate` event exists but no mechanism for auto-shifting subsequent days is described. **-0.5**

3. **US-6 AC5**: "已跳过的训练日...恢复原排期" -- `SkipDay` event exists but no `UnskipDay` or equivalent event. No mechanism for restoring skipped days. **-0.5**

4. **US-6 AC6**: "已连续跳过 3 次训练" prompt -- no skip-streak tracking mechanism in the design. The ScheduleDay model does not track skip history across days. **-0.5**

5. **US-9 AC7**: "显示该动作的历史训练记录摘要（最近 5 次、PR、总训练次数）" -- `ExerciseDetailRoute` exists but no corresponding screen state class (`ExerciseDetailUiState`) or ViewModel is defined. No interface for fetching exercise history summary. **-0.5**

6. **US-2 AC7**: "加一组" (extra set) -- Coverage map mentions it but no explicit `AddExtraSet` event in `WorkoutEvent`. The design does not specify how extra sets beyond `targetSets` are handled or excluded from weight suggestion calculation. **-0.5**

Applying proportional deductions: -1 total for cumulative AC gaps.

---

## Dimension 6: Security Considerations -- 8/10

### Threat Model Present (4/5)

Iteration 2 significantly expands the threat model from 3 threats to 8 threats (T1-T8), covering: local data leakage, import injection, SQL injection (N/A), export file exposure, import data corruption, crash-induced DB corruption, destructive clearAllData, and destructive deleteSession. This is a substantial improvement. However:

- No threat regarding **timer foreground service abuse on Android** -- a foreground service with persistent notification could be exploited or perceived as intrusive by users.
- No threat regarding **on-device data access by other apps** -- while app sandbox is mentioned, no mention of Android's scoped storage implications or iOS app group containers.

**-1 for minor threat model gaps.**

### Mitigations Concrete (4/5)

Mitigations are substantially more concrete than iteration 1. Specific implementations are described: platform full-disk encryption with specific APIs (Android Keystore, iOS NSFileProtectionComplete), import validation with 4-layer checks, WAL mode for crash protection, undo windows with temporary backup tables, share sheet with auto-delete from cache. However:

- The `_deleted_sessions` shadow table (T8) and temporary backup table for `clearAllData` undo (T7) are described in prose but not reflected in schema.sql or er-diagram.md. A developer implementing these features would need to design the schema themselves. **-1 for mitigations not reflected in data model.**

---

## Deductions Applied

| Rule | Instance | Deduction |
|------|----------|-----------|
| Vague language without quantification | Library versions: "BOM 2024.x", "latest", "2.x", "4.x", "1.x" (7 instances) | Captured in Dimension 1 |
| Cross-section inconsistency | WorkoutFeeling defaults: design=6/7 vs PRD=5/5 | Captured in Dimension 2 |
| Cross-section inconsistency | Exercise category `core_pull` in schema/entity table but not in Mermaid diagram or PRD | Captured in Dimension 2 |
| Cross-section inconsistency | Security T7/T8 describe tables not in schema.sql/er-diagram.md | Captured in Dimension 2 |
| PRD AC gap | US-5 AC3 defaults unfixed | Captured in Dimension 5 |
| PRD AC gap | US-6 AC2 drag-to-adjust unresolved | Captured in Dimension 5 |
| PRD AC gap | US-6 AC5 skip-restore missing | Captured in Dimension 5 |
| PRD AC gap | US-6 AC6 skip-streak prompt missing | Captured in Dimension 5 |
| PRD AC gap | US-9 AC7 exercise detail view missing | Captured in Dimension 5 |
| PRD AC gap | US-2 AC7 extra set handling unspecified | Captured in Dimension 5 |
| Non-numeric target | UI coverage: "关键页面" | Captured in Dimension 4 |

No TBD/TODO placeholders found. No prose-only sections where code/diagrams were expected.

---

## Improvements from Iteration 1

1. **Presentation Layer added** (Addresses Attack #1 from iteration 1): 9 screen state classes with typed fields, 9 sealed event classes, 16 route definitions, and a `BaseViewModel` contract. This was the biggest gap in iteration 1 and has been substantially addressed.

2. **Error propagation strategy fixed** (Addresses Attack #2 from iteration 1): The `Result<T>` vs exception inconsistency is resolved. All suspend functions return `Result<T>`, Flow functions are explicitly excluded, and the "Result contract per function" subsection clarifies the distinction.

3. **Security threat model expanded** (Addresses Attack #3 from iteration 1): From 3 threats to 8 threats with concrete mitigations including specific platform APIs, WAL mode, undo windows, and transaction-based import.

4. **ViewModel coverage map added**: The PRD Coverage Map now references specific ViewModels (e.g., `WorkoutViewModel`, `CalendarViewModel`) making the mapping more traceable.

---

## Final Score: 87/100 (+8 from iteration 1)

---

## Top 3 Attack Points

### 1. Cross-Document Inconsistencies Remain Unfixed (Dimension 2, Dimension 5)

The WorkoutFeeling default values (design=6/7, PRD=5) and Exercise category values (`core_pull` inconsistency) were both flagged in iteration 1 and remain unfixed. These are not cosmetic issues -- a developer implementing the FeelingScreen will see `default 6` in the tech design and set `fatigue = 6`, directly contradicting the PRD AC which explicitly says "默认值（5）". Similarly, the `core_pull` category exists in the database schema but has no PRD mapping, creating an orphan category. These inconsistencies cause rework when discovered during implementation or testing.

**Fix**: Align all defaults to PRD values (fatigue=5, satisfaction=5). Remove `core_pull` from the category enum or add a corresponding PRD category. Update both er-diagram.md Mermaid diagram and entity details table to match.

### 2. PRD AC Gaps in Calendar/Skip Functionality (Dimension 5)

US-6 has three ACs that remain unaddressed or partially addressed: (AC2) drag-to-adjust with auto-shifting subsequent days is an open question; (AC5) restoring skipped training days has no `UnskipDay` event; (AC6) skip-streak warning (3 consecutive skips) has no tracking mechanism. The `ScheduleDay` model does not carry skip history. These are user-facing features that a developer cannot implement from the design alone -- they would need to invent the skip tracking data structure and the auto-shift algorithm.

**Fix**: Add `UnskipDay` event to `CalendarEvent`. Define a skip-tracking mechanism (either a `SkippedDays` table or a field in `ScheduleDay`). Resolve Open Question #3 for drag-to-adjust. Add a `checkSkipStreak()` method or similar to `ScheduleCalculator` that returns a warning when 3+ consecutive days are skipped.

### 3. Security Mitigations Not Reflected in Data Model (Dimension 2, Dimension 6)

The security section describes two tables that do not exist in the data model: (1) a temporary backup table for `clearAllData` undo (T7), and (2) a `_deleted_sessions` shadow table for soft-delete with 24-hour TTL (T8). These are implementation-critical features -- a developer reading schema.sql would not know these tables exist, and would implement hard deletes as the interface annotation says ("级联删除关联数据"). Additionally, WAL mode configuration and startup `PRAGMA` checks are mentioned in security but not documented in the project structure or SQLDelight driver configuration.

**Fix**: Add the shadow table(s) to schema.sql and er-diagram.md, or explicitly document them as "ephemeral tables created at runtime" with their schema. Update `WorkoutRepository.deleteSession` annotation to reflect the soft-delete behavior. Add a SQLDelight driver configuration note about WAL mode and PRAGMA checks.

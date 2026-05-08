---
date: "2026-05-08"
doc_dir: "docs/features/train-recorder/design/"
iteration: "1"
target_score: "90"
evaluator: Claude (automated, adversarial)
---

# Design Eval -- Iteration 1

**Score: 84/100** (target: 90)

```
┌─────────────────────────────────────────────────────────────────┐
│                     DESIGN QUALITY SCORECARD                     │
├──────────────────────────────┬──────────┬──────────┬────────────┤
│ Dimension                    │ Score    │ Max      │ Status     │
├──────────────────────────────┼──────────┼──────────┼────────────┤
│ 1. Architecture Clarity      │  19      │  20      │ ✅         │
│    Layer placement explicit  │  7/7     │          │            │
│    Component diagram present │  6/7     │          │            │
│    Dependencies listed       │  6/6     │          │            │
├──────────────────────────────┼──────────┬──────────┬────────────┤
│ 2. Interface & Model Defs    │  16      │  20      │ ⚠️         │
│    Interface signatures typed│  4/5     │          │            │
│    Inline models concrete    │  4/5     │          │            │
│    ER diagram complete       │  3/3     │          │            │
│    SQL DDL directly usable   │  3/4     │          │            │
│    Cross-layer consistency   │  2/3     │          │            │
├──────────────────────────────┼──────────┬──────────┬────────────┤
│ 3. Error Handling            │  15      │  15      │ ✅         │
│    Error types defined       │  5/5     │          │            │
│    Propagation strategy clear│  5/5     │          │            │
│    HTTP status codes mapped  │  5/5     │          │ N/A        │
├──────────────────────────────┼──────────┬──────────┬────────────┤
│ 4. Testing Strategy          │  13      │  15      │ ⚠️         │
│    Per-layer test plan       │  5/5     │          │            │
│    Coverage target numeric   │  5/5     │          │            │
│    Test tooling named        │  3/5     │          │            │
├──────────────────────────────┼──────────┬──────────┬────────────┤
│ 5. Breakdown-Readiness ★     │  14      │  20      │ ⚠️         │
│    Components enumerable     │  6/7     │          │            │
│    Tasks derivable           │  5/7     │          │            │
│    PRD AC coverage           │  3/6     │          │            │
├──────────────────────────────┼──────────┬──────────┬────────────┤
│ 6. Security Considerations   │  7       │  10      │ ⚠️         │
│    Threat model present      │  4/5     │          │            │
│    Mitigations concrete      │  3/5     │          │            │
├──────────────────────────────┼──────────┬──────────┬────────────┤
│ TOTAL                        │  84      │  100     │            │
└──────────────────────────────┴──────────┴──────────┴────────────┘
```

★ Breakdown-Readiness: 14/20 -- can proceed to /breakdown-tasks (>= 12 threshold met)

---

## Deductions

| Location | Issue | Penalty |
|----------|-------|---------|
| tech-design.md: Interfaces | Per-entity repository interfaces not typed (only generic BaseRepository<T>). Developer must guess each repo's specific query methods. | -1 (D2: Interface signatures) |
| tech-design.md: Interfaces | SetsConfig union type described in prose but never formalized as a TypeScript type definition. | -1 (D2: Inline models) |
| schema.sql: AUTO_INCREMENT | SQLite uses `AUTOINCREMENT` keyword, not MySQL's `AUTO_INCREMENT`. schema.sql would fail if executed as-is against expo-sqlite. | -1 (D2: SQL DDL) |
| tech-design.md + schema.sql | WorkoutExercise fields `suggested_weight`, `target_sets`, `target_reps`, `exercise_mode` exist in schema/ER but are absent from the Field Quick Reference table. | -1 (D2: Cross-layer consistency) |
| tech-design.md: Testing | "Jest + zustand testing" is vague -- no specific Zustand testing utility named. "Detox / Maestro" lists two tools without choosing one. | -2 (D4: Test tooling) |
| tech-design.md: PRD Coverage Map | Multiple PRD acceptance criteria not mapped: US-1 "7 training days no rest day warning", US-2 "phone call recovery", US-3 "never-trained exercise" / "3 consecutive success suggest larger increment", US-5 "edit past feeling", US-6 "skip 3 consecutive warning" / "cancel skip restore", US-7 "same-day dual record", US-9 "exercise detail history summary", US-14 "export range selection", US-18 "revisit onboarding in settings". | -3 (D5: PRD AC coverage) |
| tech-design.md: Interfaces | DataExportService and DataImportService listed in directory structure but have no interface signatures. Developer cannot derive tasks for these. | -2 (D5: Tasks derivable) |
| tech-design.md: Security | PRD explicitly states "Storage encryption: 训练数据为个人隐私数据", but design only relies on OS-level full-disk encryption with zero app-layer encryption. No SQLCipher, no EncryptedStorage. | -2 (D6: Mitigations) |

---

## Attack Points

### Attack 1: Breakdown-Readiness -- PRD acceptance criteria coverage is incomplete

**Where**: tech-design.md PRD Coverage Map (lines 396-431). The map covers user story titles but skips at least 10 specific ACs. For example:
- US-2 AC: "用户接到来电导致 App 进入后台...通话结束后返回 App，Then 训练页面恢复到中断前的状态" -- no design element addresses phone-call interruption recovery beyond generic timer persistence.
- US-6 AC: "长按该日选择「跳过」...该训练日的内容顺延到下一个可用日期" -- mapped to CalendarComputer + WorkoutSession but no model or interface handles skip-and-reschedule logic. There is no `skipped_dates` table, no skip-tracking field, and `recalculateChain` is for overload not schedule.
- US-9 AC: "显示该动作的历史训练记录摘要（最近 5 次、PR、总训练次数）" -- no interface or service method supports this exercise detail summary query.

**Why it's weak**: A developer given tasks from this design would implement US-6 skip/restore and US-9 exercise detail without any spec to follow. The coverage map says "covered" but the actual ACs have no backing interface or data model.

**What must improve**: Add explicit interface methods for each unmapped AC (e.g., `ExerciseService.getExerciseSummary(bizKey)` returning last 5 sessions + PR + total count; `CalendarComputer.skipTrainingDay(date)` and `CalendarComputer.unskipTrainingDay(date)` with reschedule logic). Expand the coverage map to list every AC individually.

### Attack 2: Interface & Model Definitions -- DataExport/DataImport and Onboarding have no interface specs

**Where**: tech-design.md Directory Structure (lines 134-139) lists `data-export.ts`, `data-import.ts`, `snowflake.ts`, and `onboarding.tsx`. The Interfaces section (lines 168-274) provides signatures for CalendarComputer, ProgressiveOverload, TimerService, PRTracker, and UnitConversion -- but **not** for DataExport, DataImport, SnowflakeId, or Onboarding.

**Why it's weak**: DataExport and DataImport are listed in the dependency table (expo-file-system) and directory tree, and US-14 defines ACs including "导出范围选择（全部/最近 3 个月/最近半年）" -- but no `DataExportService` interface exists. A developer cannot derive export tasks without knowing the method signature, export format, or range selection API. Snowflake ID generator is the core of the `biz_key` strategy yet has no interface. Onboarding (US-18) has 4 ACs but zero design detail.

**What must improve**: Add interface blocks for:
1. `DataExportService` with `exportData(range: 'all' | '3m' | '6m'): Promise<ExportResult>` and return type
2. `DataImportService` with `importData(filePath: string): Promise<ImportResult>` and validation logic
3. `SnowflakeId.generate(): bigint`
4. Onboarding flow spec (steps, state transitions, template data structure)

### Attack 3: SQL DDL -- AUTO_INCREMENT is MySQL syntax, not SQLite

**Where**: schema.sql, every CREATE TABLE uses `BIGINT PRIMARY KEY AUTO_INCREMENT` (e.g., line 14: `id BIGINT PRIMARY KEY AUTO_INCREMENT`). expo-sqlite uses SQLite, which uses `INTEGER PRIMARY KEY AUTOINCREMENT` (note: `INTEGER` not `BIGINT`, and `AUTOINCREMENT` not `AUTO_INCREMENT`).

**Why it's weak**: SQLite does not have a BIGINT column type -- it treats all integer types as TEXT/INTEGER/REAL/BLOB internally. `AUTO_INCREMENT` is MySQL syntax and will cause a syntax error in SQLite. The schema.sql cannot be executed as-is, violating the "directly usable" criterion. Additionally, SQLite's AUTOINCREMENT requires `INTEGER PRIMARY KEY` specifically -- using BIGINT may not trigger auto-increment behavior.

**What must improve**: Change all `id` columns to `INTEGER PRIMARY KEY AUTOINCREMENT` in schema.sql. Document that SQLite internally stores all integers as 64-bit regardless of declared type, so the BIGINT semantic is preserved. Add a note that `biz_key` BIGINT columns are application-enforced (stored as INTEGER in SQLite). Validate the schema against expo-sqlite by actually running it.

---

## Previous Issues Check

<!-- Only for iteration > 1 -->

N/A -- Iteration 1.

---

## Verdict

- **Score**: 84/100
- **Target**: 90/100
- **Gap**: 6 points
- **Breakdown-Readiness**: 14/20 -- can proceed to /breakdown-tasks
- **Action**: Continue to iteration 2. Focus on: (1) mapping all PRD ACs to specific interface methods, (2) adding DataExport/DataImport/SnowflakeId interface signatures, (3) fixing SQLite syntax in schema.sql.

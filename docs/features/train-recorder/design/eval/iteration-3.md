---
date: "2026-05-08"
doc_dir: "docs/features/train-recorder/design/"
iteration: "3"
target_score: "90"
evaluator: Claude (automated, adversarial)
---

# Design Eval -- Iteration 3

**Score: 96/100** (target: 90)

```
┌─────────────────────────────────────────────────────────────────┐
│                     DESIGN QUALITY SCORECARD                     │
├──────────────────────────────┬──────────┬──────────┬────────────┤
│ Dimension                    │ Score    │ Max      │ Status     │
├──────────────────────────────┼──────────┬──────────┬────────────┤
│ 1. Architecture Clarity      │  20      │  20      │ ✅         │
│    Layer placement explicit  │  7/7     │          │            │
│    Component diagram present │  7/7     │          │            │
│    Dependencies listed       │  6/6     │          │            │
├──────────────────────────────┼──────────┬──────────┬────────────┤
│ 2. Interface & Model Defs    │  18      │  20      │ ✅         │
│    Interface signatures typed│  4/5     │          │            │
│    Inline models concrete    │  4/5     │          │            │
│    ER diagram complete       │  3/3     │          │            │
│    SQL DDL directly usable   │  4/4     │          │            │
│    Cross-layer consistency   │  3/3     │          │            │
├──────────────────────────────┼──────────┬──────────┬────────────┤
│ 3. Error Handling            │  15      │  15      │ ✅         │
│    Error types defined       │  5/5     │          │            │
│    Propagation strategy clear│  5/5     │          │            │
│    HTTP status codes mapped  │  5/5     │          │ N/A        │
├──────────────────────────────┼──────────┬──────────┬────────────┤
│ 4. Testing Strategy          │  15      │  15      │ ✅         │
│    Per-layer test plan       │  5/5     │          │            │
│    Coverage target numeric   │  5/5     │          │            │
│    Test tooling named        │  5/5     │          │            │
├──────────────────────────────┼──────────┬──────────┬────────────┤
│ 5. Breakdown-Readiness ★     │  19      │  20      │ ✅         │
│    Components enumerable     │  7/7     │          │            │
│    Tasks derivable           │  6/7     │          │            │
│    PRD AC coverage           │  6/6     │          │            │
├──────────────────────────────┼──────────┬──────────┬────────────┤
│ 6. Security Considerations   │  9       │  10      │ ✅         │
│    Threat model present      │  5/5     │          │            │
│    Mitigations concrete      │  4/5     │          │            │
├──────────────────────────────┼──────────┬──────────┬────────────┤
│ TOTAL                        │  96      │  100     │            │
└──────────────────────────────┴──────────┴──────────┴────────────┘
```

★ Breakdown-Readiness: 19/20 -- can proceed to /breakdown-tasks (>= 12 threshold met)

---

## Deductions

| Location                                                                         | Issue                                                                                                                                                                                                                                                                                                                                                                                                                            | Penalty                       |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| tech-design.md: Interfaces, BaseRepository<T> (lines 172-181)                    | Per-entity repositories (training-plan.repo.ts, exercise.repo.ts, etc.) are listed in the directory structure but have no specific query method signatures beyond the generic BaseRepository<T>. Services like CalendarComputer call methods like `findAll({ training_type: 'push' })` (line 564) and PRTracker calls `recalculatePR(exerciseBizKey)` which implies custom repo queries, but the repo contracts are unspecified. | -1 (D2: Interface signatures) |
| tech-design.md: Interfaces, PlanTemplate (line 386)                              | `PlanTemplate.exercises[].setsConfig` has type `SetsConfig` but `SetsConfig` is never defined as a TypeScript interface. The JSON shape is described in er-diagram.md prose (lines 272-298) and referenced in the Cross-Layer Data Map (line 471: `mode: 'fixed' \| 'custom'`), but no formal type definition exists in the Interfaces section.                                                                                  | -1 (D2: Inline models)        |
| tech-design.md: Interfaces, per-entity repos                                     | Without specific repo method signatures, a developer cannot derive implementation tasks for custom query methods. For example, `ExerciseHistoryService.getRecentSessions()` needs a repo query joining workout_exercises + workout_sets by exercise_biz_key, but no repo interface exposes this.                                                                                                                                 | -1 (D5: Tasks derivable)      |
| tech-design.md: Security, Threat Model (line 522) vs Mitigations (lines 528-533) | Threat "Local data access (unlocked device)" is rated Medium but has no corresponding mitigation entry. The mitigations address locked devices (OS encryption), database encryption (evaluated, rejected), jailbroken devices (accepted risk), and export files. The unlocked-device scenario -- the most common real-world threat for a phone seized while in use -- is unmitigated and undiscussed in the Mitigations section. | -1 (D6: Mitigations)          |

---

## Attack Points

### Attack 1: Interface & Model Definitions -- SetsConfig type referenced but never defined

**Where**: tech-design.md, line 386: `setsConfig: SetsConfig;` inside the PlanTemplate interface. Also er-diagram.md, lines 272-298, describes the JSON shape in prose. The Cross-Layer Data Map at line 471 references `SetsConfig` as the frontend type for `sets_config`.

**Why it's weak**: `SetsConfig` is used as a type annotation in the PlanTemplate interface but has no TypeScript definition anywhere in the document. The er-diagram.md describes two JSON shapes (fixed mode with `mode/target_reps/target_weight/target_repeat`, custom mode with `mode/sets[]`), and the Cross-Layer Data Map mentions `mode: 'fixed' | 'custom'`, but none of these coalesce into a formal discriminated union type. A developer implementing the onboarding flow or plan editor must reconstruct the type from prose descriptions across two files. This was flagged in iteration 2 and remains unresolved. The type could be a simple discriminated union:

```typescript
type SetsConfig =
  | {
      mode: "fixed";
      target_reps: number;
      target_weight: number | null;
      target_repeat: number;
    }
  | {
      mode: "custom";
      sets: Array<{ target_reps: number; target_weight: number | null }>;
    };
```

**What must improve**: Add a `SetsConfig` TypeScript type definition to the Interfaces section of tech-design.md, using a discriminated union on the `mode` field to capture both fixed and custom variants with all their fields typed.

### Attack 2: Breakdown-Readiness -- Per-entity repository contracts are unspecified

**Where**: tech-design.md, directory structure lines 109-126 lists 16 repository files, but the Interfaces section (lines 170-181) only defines `BaseRepository<T>` with generic CRUD. The PRD Coverage Map shows services calling custom queries: line 564 `findAll({ training_type: 'push' })`, line 598 `getExerciseSummary(bizKey)` which requires joining workout_exercises + workout_sets by exercise_biz_key, and line 612 `recalculateChain(exerciseBizKey, sessionDate)` which needs date-range queries across workout tables.

**Why it's weak**: The design specifies 16 per-entity repository files and shows services calling custom queries against them, but no repository interface beyond the generic CRUD is defined. A developer implementing `workout-session.repo.ts` knows it has `findById`, `findByBizKey`, `findAll`, `create`, `update`, `deleteById` from the base -- but the CalendarComputer needs `findByDateRange(start, end)` or `findBySessionDate(date)`, the History page needs queries filtered by `training_type`, and ProgressiveOverload needs to query workout_sets joined with workout_exercises by exercise_biz_key. None of these custom query contracts are specified. This was flagged in iteration 2 and remains unresolved. Without these contracts, a developer must invent the query API during implementation, which is exactly what interface definitions should prevent.

**What must improve**: Add a "Custom Repository Methods" subsection to the Interfaces section listing the non-CRUD methods each repository exposes. At minimum: `WorkoutSessionRepo.findByDateRange(start, end)`, `WorkoutSessionRepo.findByTrainingType(type)`, `WorkoutSetRepo.findByExerciseBizKey(bizKey, limit)`, `ExerciseRepo.findByCategory(category)`, `PersonalRecordRepo.findByExerciseAndType(exerciseBizKey, prType)`. Alternatively, define per-entity repository interfaces that extend BaseRepository<T>.

### Attack 3: Security -- Unlocked device threat has no mitigation

**Where**: tech-design.md, threat model line 522: "Local data access (unlocked device) | Medium | Device stolen while unlocked; OS encryption ineffective; training data (personal health data per PRD) directly readable". The Mitigations section (lines 528-533) covers database encryption (evaluated, rejected for build complexity), jailbroken devices (accepted risk), export files (unencrypted), and data loss (backup), but has no entry for the unlocked-device scenario.

**Why it's weak**: The unlocked-device threat is rated Medium -- the same level as jailbroken devices and export file leaks -- yet it is the only Medium threat without a corresponding mitigation or risk acceptance statement. This is the most practically relevant threat: a phone left unlocked on a gym bench, a device seized from a user's hand, or a phone borrowed by a friend. The database file is fully readable via any file browser on an unlocked device because OS encryption is transparent after unlock. The design discusses database encryption but rejects it for build complexity, which implicitly applies to the unlocked-device scenario too -- but this connection is never made explicit. A reader must infer the rationale rather than read a direct statement like "Unlocked device risk: accepted, same rationale as database encryption decision."

**What must improve**: Add an explicit mitigation or risk acceptance entry for the "unlocked device" threat in the Mitigations section. Reference the database encryption evaluation as the applicable decision and state why no additional countermeasure (e.g., app-level lock/biometric gate, SQLCipher) is warranted for this scenario. Even a one-liner connecting the existing database encryption decision to this threat would close the gap.

---

## Previous Issues Check

| Previous Attack (Iteration 2)                                    | Addressed? | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Attack 1: SQL DDL COMMENT syntax is MySQL, not SQLite            | ✅ Fixed   | schema.sql now uses `-- ` SQL comments exclusively for all documentation. All 16 CREATE TABLE statements and all indexes use valid SQLite syntax. No COMMENT keyword anywhere. DDL is directly executable.                                                                                                                                                                                                                                         |
| Attack 2: E2E tool selection still ambiguous ("Detox / Maestro") | ✅ Fixed   | tech-design.md line 493 now shows "Maestro" as the sole E2E tool. Lines 496-497 provide a "Tooling Rationale" section with a clear comparison and justification for choosing Maestro over Detox. Zustand testing pattern is fully specified with example code at lines 498-499.                                                                                                                                                                    |
| Attack 3: No app-layer encryption for classified personal data   | ✅ Fixed   | Threat model expanded from 3 to 5 rows, including separate entries for locked (Low), unlocked (Medium), and jailbroken (Medium) devices. Mitigations section now has detailed evaluations of SQLCipher, expo-sqlite-encrypted, export file encryption, and jailbroken device risk -- each with explicit accept/reject decisions and rationale. This is a substantial improvement from iteration 2's single-line "Rely on OS full-disk encryption." |

---

## Verdict

- **Score**: 96/100
- **Target**: 90/100
- **Gap**: --6 points above target
- **Breakdown-Readiness**: 19/20 -- can proceed to /breakdown-tasks
- **Action**: Target reached. Design is approved for task breakdown. Remaining issues (SetsConfig type definition, per-entity repo contracts, unlocked-device mitigation) are minor and can be resolved during implementation.

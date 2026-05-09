---
date: "2026-05-08"
doc_dir: "docs/features/train-recorder/design/"
iteration: "2"
target_score: "90"
evaluator: Claude (automated, adversarial)
---

# Design Eval -- Iteration 2

**Score: 89/100** (target: 90)

```
┌─────────────────────────────────────────────────────────────────┐
│                     DESIGN QUALITY SCORECARD                     │
├──────────────────────────────┬──────────┬──────────┬────────────┤
│ Dimension                    │ Score    │ Max      │ Status     │
├──────────────────────────────┼──────────┼──────────┬────────────┤
│ 1. Architecture Clarity      │  19      │  20      │ ✅         │
│    Layer placement explicit  │  7/7     │          │            │
│    Component diagram present │  6/7     │          │            │
│    Dependencies listed       │  6/6     │          │            │
├──────────────────────────────┼──────────┬──────────┬────────────┤
│ 2. Interface & Model Defs    │  16      │  20      │ ⚠️         │
│    Interface signatures typed│  4/5     │          │            │
│    Inline models concrete    │  4/5     │          │            │
│    ER diagram complete       │  3/3     │          │            │
│    SQL DDL directly usable   │  2/4     │          │            │
│    Cross-layer consistency   │  3/3     │          │            │
├──────────────────────────────┼──────────┬──────────┬────────────┤
│ 3. Error Handling            │  15      │  15      │ ✅         │
│    Error types defined       │  5/5     │          │            │
│    Propagation strategy clear│  5/5     │          │            │
│    HTTP status codes mapped  │  5/5     │          │            │ N/A
├──────────────────────────────┼──────────┬──────────┬────────────┤
│ 4. Testing Strategy          │  13      │  15      │ ⚠️         │
│    Per-layer test plan       │  5/5     │          │            │
│    Coverage target numeric   │  5/5     │          │            │
│    Test tooling named        │  3/5     │          │            │
├──────────────────────────────┼──────────┬──────────┬────────────┤
│ 5. Breakdown-Readiness ★     │  19      │  20      │ ✅         │
│    Components enumerable     │  7/7     │          │            │
│    Tasks derivable           │  6/7     │          │            │
│    PRD AC coverage           │  6/6     │          │            │
├──────────────────────────────┼──────────┬──────────┬────────────┤
│ 6. Security Considerations   │  7       │  10      │ ⚠️         │
│    Threat model present      │  4/5     │          │            │
│    Mitigations concrete      │  3/5     │          │            │
├──────────────────────────────┼──────────┬──────────┬────────────┤
│ TOTAL                        │  89      │  100     │            │
└──────────────────────────────┴──────────┴──────────┴────────────┘
```

★ Breakdown-Readiness: 19/20 -- can proceed to /breakdown-tasks (>= 12 threshold met)

---

## Deductions

| Location                                | Issue                                                                                                                                                                                                                                                                                                                                                         | Penalty                          |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| tech-design.md: Interfaces              | BaseRepository<T> is generic; per-entity repositories (e.g., WorkoutSessionRepo, ExerciseRepo) have no specific query method signatures. A developer must guess which custom queries each repo exposes beyond the base CRUD.                                                                                                                                  | -1 (D2: Interface signatures)    |
| tech-design.md: OnboardingService       | `PlanTemplate` references `SetsConfig` type that is never defined as a TypeScript interface. The sets_config JSON shape is described in er-diagram.md prose and schema.sql comments but has no formal type definition in the Interfaces section.                                                                                                              | -1 (D2: Inline models)           |
| schema.sql: all CREATE TABLE statements | Every column and table uses MySQL `COMMENT '...'` syntax (e.g., line 16: `biz_key INTEGER NOT NULL UNIQUE COMMENT '...'`, line 26: `) COMMENT '...'`). SQLite does not support the COMMENT keyword. Executing this DDL against expo-sqlite produces syntax errors. The AUTOINCREMENT fix was applied but COMMENT syntax was not.                              | -2 (D2: SQL DDL directly usable) |
| tech-design.md: Testing                 | "Detox / Maestro" still lists two E2E tools without selecting one. "zustand testing" does not name a specific utility. This was flagged in iteration 1 and remains unchanged.                                                                                                                                                                                 | -2 (D4: Test tooling)            |
| tech-design.md: Security                | PRD states "训练数据为个人隐私数据" and design acknowledges local data access as a threat, but the only mitigation is "Rely on iOS/Android device-level full-disk encryption." No app-layer encryption (e.g., SQLCipher, expo-secure-store for keys) is considered despite the privacy classification. This was flagged in iteration 1 and remains unchanged. | -2 (D6: Mitigations)             |
| tech-design.md: Interfaces              | Per-entity repositories lack specific method signatures (e.g., WorkoutSessionRepo.findByDateRange(), ExerciseRepo.findByCategory()). Services call these methods but the repo contracts are unspecified, creating a gap in task derivability.                                                                                                                 | -1 (D5: Tasks derivable)         |
| tech-design.md: Security                | Threat model lists "Local data access" as Low risk without considering the scenario of a jailbroken/rooted device where full-disk encryption is bypassed. For an app storing personal health data, this threat deserves a more thorough analysis.                                                                                                             | -1 (D6: Threat model)            |

---

## Attack Points

### Attack 1: Interface & Model Definitions -- SQL DDL COMMENT syntax is MySQL, not SQLite

**Where**: schema.sql, every CREATE TABLE statement. Example from lines 14-26:

```sql
CREATE TABLE training_plans (
    id              INTEGER         PRIMARY KEY AUTOINCREMENT,
    biz_key         INTEGER         NOT NULL UNIQUE COMMENT '雪花算法业务键 (应用层 bigint)',
    ...
) COMMENT '训练计划定义';
```

The `COMMENT '...'` syntax appears on every column definition (lines 16-25) and every table definition (line 26). This pattern repeats across all 16 tables.

**Why it's weak**: SQLite does not support the `COMMENT` keyword in DDL statements. This is MySQL-specific syntax. Executing `CREATE TABLE ... COMMENT '...'` against expo-sqlite will raise a syntax error on the very first table definition. The iteration 1 report flagged MySQL `AUTO_INCREMENT` syntax and that was fixed to SQLite `AUTOINCREMENT`, but the `COMMENT` syntax issue was introduced or retained alongside the fix. A schema.sql file that cannot be executed as-is fails the "directly usable" criterion. The file header claims "Generated from: design/er-diagram.md" and lists conventions, but none of those conventions mention that the COMMENT syntax is non-executable documentation.

**What must improve**: Remove all `COMMENT '...'` clauses from schema.sql. Move column/table documentation into SQL comments (using `--` or `/* */`) above or beside the relevant lines. Validate the final DDL by running it against an actual SQLite instance or expo-sqlite to confirm it executes without error.

### Attack 2: Testing Strategy -- E2E tool selection still ambiguous

**Where**: tech-design.md, Testing Strategy section, Per-Layer Test Plan table (line 493):

```
| E2E | E2E | Detox / Maestro | Core workout flow, plan creation, data export | Key flows |
```

And the zustand testing entry (line 492):

```
| Stores | Unit | Jest + zustand testing | State transitions, async actions | 80% |
```

**Why it's weak**: The iteration 1 report explicitly called out: "Jest + zustand testing is vague -- no specific Zustand testing utility named. Detox / Maestro lists two tools without choosing one." Neither issue has been addressed. Listing "Detox / Maestro" as a slash-separated pair is not a tooling decision -- it is a postponement of a tooling decision. A developer tasked with writing E2E tests cannot proceed without knowing which framework to install, configure, and learn. Similarly, "zustand testing" names no concrete library (e.g., `@zustand/testing`, manual mock patterns, or `zustand/vanilla` for isolated store testing). The testing strategy appears comprehensive on paper but has ambiguity in the two areas that were previously identified.

**What must improve**: (1) Select one E2E tool (Detox or Maestro) and document the choice with rationale. (2) Specify the Zustand testing approach: either name the testing utility/package or describe the pattern (e.g., "use `useStore.getState()` for direct state access in Jest tests, mock async actions with `jest.mock`"). This is the second iteration where these ambiguities persist.

### Attack 3: Security Considerations -- No app-layer encryption for classified personal data

**Where**: tech-design.md, Security Considerations, Mitigations section (lines 521-524):

```
- Data encryption: Rely on iOS/Android device-level full-disk encryption (enabled by default)
- Data loss: Export feature for backup; import for restore; encourage periodic exports
- Export files: No encryption on exported files (personal-use app, low risk)
- No network: No API keys, no tokens, no network requests -- eliminates entire categories of security issues
```

**Why it's weak**: The PRD explicitly classifies training data as personal privacy data ("训练数据为个人隐私数据"). The threat model identifies "Local data access" and "Export file leak" as real threats. Yet every mitigation defers to the OS or accepts the risk as "low." Three concrete gaps: (1) Full-disk encryption is bypassed when the device is unlocked, and is irrelevant on jailbroken/rooted devices. (2) Export files containing all personal data are intentionally left unencrypted -- the rationale "personal-use app, low risk" contradicts the PRD's privacy classification. (3) No consideration of SQLCipher or any database-level encryption, which is a standard approach for local-first apps storing sensitive data (expo-sqlite supports SQLCipher via `expo-sqlite` encryption options). The iteration 1 report flagged this exact weakness and the design has not changed.

**What must improve**: (1) Evaluate SQLCipher/expo-sqlite encryption for the database file and document the decision (even if "rejected because X"). (2) Consider encrypting export files or at minimum document the explicit risk acceptance with rationale beyond "low risk." (3) Address the jailbroken/rooted device scenario in the threat model with a specific mitigation or documented risk acceptance.

---

## Previous Issues Check

| Previous Attack (Iteration 1)                                                  | Addressed? | Evidence                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Attack 1: PRD AC coverage incomplete (10+ ACs unmapped)                        | ✅ Fixed   | PRD Coverage Map now covers US-1 through US-18 with individual ACs mapped to specific design components and interfaces. Every previously unmapped AC (US-1 AC6, US-2 AC9, US-3 AC6/AC8, US-5 AC5, US-6 AC6/AC7, US-7 AC5, US-9 AC7, US-14 AC1, US-18 AC4) now has explicit mappings. |
| Attack 2: DataExport/DataImport/SnowflakeId/Onboarding have no interface specs | ✅ Fixed   | All four now have full interface signatures: DataExportService (lines 332-337), DataImportService (lines 362-367), SnowflakeIdGenerator (lines 312-316), OnboardingService (lines 396-403).                                                                                          |
| Attack 3: SQL DDL uses MySQL AUTO_INCREMENT                                    | ✅ Fixed   | schema.sql now uses `INTEGER PRIMARY KEY AUTOINCREMENT` (SQLite syntax) throughout all tables. However, MySQL `COMMENT` syntax remains.                                                                                                                                              |

---

## Verdict

- **Score**: 89/100
- **Target**: 90/100
- **Gap**: 1 point
- **Breakdown-Readiness**: 19/20 -- can proceed to /breakdown-tasks
- **Action**: Continue to iteration 3. Focus on: (1) Remove COMMENT syntax from schema.sql and validate against SQLite, (2) Select one E2E tool and specify Zustand testing approach, (3) Add app-layer encryption evaluation to security mitigations.

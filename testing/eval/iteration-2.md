---
date: "2026-05-09"
doc_dir: "/Users/fanhuifeng/Projects/ai/train-recorder/testing/"
iteration: 2
target_score: 80
evaluator: Claude (automated, adversarial)
---

# Test Cases Eval — Iteration 2

**Score: 72/100** (target: 80)

```
┌─────────────────────────────────────────────────────────────────┐
│                  TEST CASES QUALITY SCORECARD                     │
├──────────────────────────────────────────────────────────────────┤
│ Dimension                    │ Score    │ Max      │ Status     │
├──────────────────────────────┼──────────┼──────────┼────────────┤
│ 1. PRD Traceability          │  18      │  25      │ ⚠️         │
│    TC-to-AC mapping          │  7/9     │          │            │
│    Traceability table        │  4/8     │          │            │
│    Reverse coverage          │  7/8     │          │            │
├──────────────────────────────┼──────────┼──────────┼────────────┤
│ 2. Step Actionability        │  20      │  25      │ ⚠️         │
│    Steps concrete            │  7/9     │          │            │
│    Expected results          │  7/9     │          │            │
│    Preconditions explicit    │  6/7     │          │            │
├──────────────────────────────┼──────────┼──────────┼────────────┤
│ 3. Route & Element Accuracy  │  14      │  20      │ ⚠️         │
│    Routes valid              │  5/7     │          │            │
│    Elements identifiable     │  5/7     │          │            │
│    Consistency               │  4/6     │          │            │
├──────────────────────────────┼──────────┼──────────┤
│ 4. Completeness              │  11      │  20      │ ⚠️         │
│    Type coverage             │  6/7     │          │            │
│    Boundary cases            │  2/7     │          │            │
│    Integration scenarios     │  3/6     │          │            │
├──────────────────────────────┼──────────┼──────────┤
│ 5. Structure & ID Integrity  │  9       │  10      │ ✅         │
│    IDs sequential/unique     │  4/4     │          │            │
│    Classification correct    │  3/3     │          │            │
│    Summary matches actual    │  2/3     │          │            │
├──────────────────────────────┼──────────┼──────────┼────────────┤
│ TOTAL                        │  72      │  100     │            │
└──────────────────────────────────────────────────────────────────┘
```

---

## Deductions

| Location                                | Issue                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Penalty                                |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| All 106 TCs                             | Source fields use paraphrased AC text (e.g., "US-1 AC: 用户首次使用 App，点击「创建计划」") instead of numbered references like "US-1 AC-1.1" — zero TCs use numbered AC identifiers                                                                                                                                                                                                                                                                                 | -2 pts (Traceability)                  |
| Traceability Matrix                     | Matrix groups TCs by ranges ("TC-UI-001 ~ TC-UI-006") instead of listing each TC individually with Source, Type, Target, Priority columns as required by the rubric; 67 of 106 TCs are not individually listed                                                                                                                                                                                                                                                       | -4 pts (Traceability)                  |
| Route Validation Table                  | 5 routes used in TCs are missing: `/plan/edit`, `/history/{workoutId}`, `/history/{workoutId}/edit`, `/history/{workoutId}/feeling`, `/exercise-library/{exerciseId}`                                                                                                                                                                                                                                                                                                | -2 pts (Route & Element)               |
| All TCs                                 | No boundary/invalid-input TCs: no negative weight, zero reps, max boundary (sets=10, reps=30), or extremely large values despite PRD specifying validation ranges                                                                                                                                                                                                                                                                                                    | -5 pts (Completeness)                  |
| Missing from PRD 5.11                   | No TC for data import (PRD 5.11 interaction flow step 8-9 describes import flow); TC-UI-092 only checks dialog appears but does not verify data is actually cleared                                                                                                                                                                                                                                                                                                  | -2 pts (Completeness)                  |
| TC-UI-056, TC-UI-060                    | Pre-conditions specify exact timing ("剩余 90 秒", "剩余 60 秒") but steps don't explain how to create this precise state programmatically — insufficient for automation setup                                                                                                                                                                                                                                                                                       | -1 pt (Actionability)                  |
| TC-UI-057, TC-UI-059                    | Element field says "系统通知（无法通过 data-testid 定位，使用通知 API 验证）" and "系统锁屏通知（通过通知 API 验证）" — these are not selector strategies, they are descriptions of what cannot be done                                                                                                                                                                                                                                                              | -2 pts (Route & Element)               |
| TC-UI-007                               | Steps has only 1 step "在训练执行页点击一个动作卡片展开区域" but the expected result checks multiple elements (suggested weight AND target sets/reps) — step is too coarse                                                                                                                                                                                                                                                                                           | -1 pt (Actionability)                  |
| API TCs (TC-API-001 through TC-API-014) | Route fields use function signatures `calculateSuggestedWeight(exerciseId, userId)` which are internal implementation details, not API routes or service identifiers; mixing code-level function calls with test specifications                                                                                                                                                                                                                                      | -2 pts (Route & Element)               |
| Traceability Matrix                     | Missing rows for PRD 5.11.1 (Data Export detail), PRD 5.11.2 (Unit Switch detail), PRD 5.11.3 (Onboarding detail); these subsections have TCs but are collapsed under "5.11 设置"                                                                                                                                                                                                                                                                                    | -1 pt (Traceability)                   |
| Summary table                           | Document total_test_cases in frontmatter says "106" and summary table shows "106" — actual count is correct (92 UI + 14 API = 106), but P1 total in summary says 46 while actual is 47 (UI:42 + API:4 + rounding shows 46 in table but 42+4=46 is correct — wait, rechecked: 47 P1 lines exist in file but some lines are from the table itself being counted) — actually the count is verified correct: UI P1=42, API P1=4, Total P1=46. Summary table is accurate. | 0 pts (no deduction, verified correct) |

---

## Attack Points

### Attack 1: PRD Traceability — Traceability matrix groups by ranges instead of listing each TC individually

**Where**: Traceability Matrix section:

> | 5.1 训练日历 | US-1, US-6 | TC-UI-001 ~ TC-UI-006, TC-UI-028 ~ TC-UI-034 |
> | 5.2 训练执行 | US-2, US-10, US-16, US-17 | TC-UI-007 ~ TC-UI-015, TC-UI-053 ~ TC-UI-055, TC-UI-077 ~ TC-UI-083 |

**Why it's weak**: The rubric requires the traceability table to list "every TC with its PRD source, type, target, and priority." The current matrix has columns [PRD Section, User Story, Test Cases] and uses range notation, which means 67 out of 106 TCs are not individually listed. The required columns (Source, Type, Target, Priority) are entirely absent from the matrix. A test manager or automation engineer cannot use this matrix to verify coverage of any specific TC without manually expanding the ranges. Additionally, the Source fields in individual TCs use paraphrased AC text (e.g., "US-1 AC: 用户首次使用 App，点击「创建计划」") instead of numbered references like "US-1 AC-1.1" — while these are descriptive, they do not provide a stable, short-form reference that maps to the numbered AC bullets in the PRD user stories.

**What must improve**: (1) Expand the traceability matrix to list every TC individually on its own row. (2) Add columns: TC ID, Source (numbered AC reference like "US-1 AC-1"), Type, Target, Priority. (3) Add numbered references to the PRD acceptance criteria (the ACs in prd-user-stories.md are bullet points that can be numbered sequentially within each story).

### Attack 2: Completeness — Missing boundary, invalid-input, and error-handling test cases

**Where**: The entire document. For example, TC-API-007 tests rounding:

> Pre-conditions: 卧推上次重量 97.5kg，需减重 10%
> Expected: 返回 87.5（向下取整到最近 2.5kg 杠铃片组合）

This is the closest the document gets to a boundary test, but it only tests one rounding case.

**Why it's weak**: The PRD specifies validation ranges (目标组数: 1-10, 目标次数: 1-30, 加重增量: > 0, 休息时间: 30-600) but there are zero TCs testing boundary values: sets=1, sets=10, reps=1, reps=30, rest=30s, rest=600s. There are no negative-input TCs (e.g., weight=-5kg). There are no invalid-input TCs (e.g., exercise name with special characters, weight=0). The PRD mentions data import (5.11 interaction flow steps 8-9) but no import TC exists. TC-UI-092 checks that the clear-data warning dialog appears but never verifies that data is actually deleted after confirmation. This means ~90% of TCs are happy-path only.

**What must improve**: Add TCs for: (1) boundary values for sets (1, 10), reps (1, 30), rest time (30s, 600s); (2) invalid inputs: negative weight, zero reps, non-numeric weight, extremely long exercise name; (3) data import flow from PRD 5.11; (4) verification that clear-data actually deletes records; (5) error handling for corrupted/invalid imported data.

### Attack 3: Route & Element Accuracy — System notification TCs lack selector strategies and API TCs use implementation functions as routes

**Where**: TC-UI-057:

> Element | 系统通知（无法通过 data-testid 定位，使用通知 API 验证） |

TC-UI-059:

> Element | 系统锁屏通知（通过通知 API 验证） |

TC-API-001:

> Route | `calculateSuggestedWeight(exerciseId, userId)` |

**Why it's weak**: The rubric requires "Every Element field uses a selector strategy: data-testid, aria-label, or semantic locator." TC-UI-057 and TC-UI-059 have Element fields that explicitly state they cannot use selectors — they are admissions of failure, not valid selector strategies. These TCs need a different verification approach (e.g., a notification testing library API or a specific notification identifier). For API TCs, the Route field contains internal function signatures like `calculateSuggestedWeight(exerciseId, userId)`. These are not API routes (there are no HTTP endpoints since this is a local app) but they are also not service-level identifiers with enough specificity — they look like code-level function calls that could change with refactoring. They should either use service method signatures from a service interface definition or describe the data flow more abstractly.

**What must improve**: (1) For notification TCs, specify the exact notification API to use (e.g., `NotificationManager.getLastNotification()` or platform-specific notification testing APIs) in the Element field. (2) For API TCs, decide on a consistent identifier format — either document the service interface methods or use descriptive data-flow identifiers rather than raw function signatures.

---

## Previous Issues Check

| Previous Attack                                                                               | Addressed? | Evidence                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Attack 1: Zero Element selectors in any test case and Target fields are file paths not routes | PARTIAL    | Element fields now exist in all UI TCs with `data-testid` selectors (e.g., `data-testid="complete-set-btn"`). Target fields are now descriptive component names (e.g., "训练执行页组操作区") instead of file paths. Routes are proper app routes like `/workout`, `/calendar`. However, 2 notification TCs (TC-UI-057, TC-UI-059) still lack valid selectors. |
| Attack 2: Steps use passive observation language instead of concrete automatable actions      | MOSTLY     | Steps are significantly improved. Most now use concrete verbs: "点击「创建计划」按钮", "在次数输入框输入实际完成次数", "拖动疲劳度滑块至值 8 或以上". Some TCs still have coarse steps (TC-UI-007: single step for multi-element check). Overall major improvement from iteration 1.                                                                          |
| Attack 3: Summary table priority counts are materially wrong                                  | YES        | Summary table now correctly shows: UI P0=41, P1=42, P2=9, API P0=8, P1=4, P2=2, Total=106. Verified by independent count — all numbers match.                                                                                                                                                                                                                 |

---

## Verdict

- **Score**: 72/100
- **Target**: 80/100
- **Gap**: 8 points
- **Step Actionability**: 20/25 (at blocking threshold of 20 — borderline, NOT BLOCKING)
- **Action**: Continue to iteration 3. Priority fixes: (1) Expand traceability matrix to list every TC individually with all required columns, (2) Add boundary/invalid-input/error TCs, (3) Fix notification TC Element fields with proper verification strategies, (4) Add missing routes to Route Validation Table.

SCORE: 72/100
DIMENSIONS:

- PRD Traceability: 18/25
- Step Actionability: 20/25
- Route & Element Accuracy: 14/20
- Completeness: 11/20
- Structure & ID Integrity: 9/10
  ATTACKS:

1. PRD Traceability: Traceability matrix uses range notation grouping 67 of 106 TCs into collapsed ranges instead of listing each individually with Source/Type/Target/Priority columns — "TC-UI-001 ~ TC-UI-006, TC-UI-028 ~ TC-UI-034" — expand to individual rows with all required columns and add numbered AC references
2. Completeness: Missing boundary/invalid-input test cases despite PRD specifying validation ranges (sets 1-10, reps 1-30, rest 30-600s) — zero TCs test boundary values, negative weight, zero reps, or data import flow from PRD 5.11 — add boundary TCs for every PRD-specified validation range and missing error/import scenarios
3. Route & Element Accuracy: TC-UI-057 and TC-UI-059 have Element fields that admit selectors are impossible ("系统通知（无法通过 data-testid 定位，使用通知 API 验证）") and API TCs use internal function signatures as Routes ("calculateSuggestedWeight(exerciseId, userId)") — provide concrete notification testing API identifiers and consistent service-level route identifiers

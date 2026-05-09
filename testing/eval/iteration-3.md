---
date: "2026-05-09"
doc_dir: "/Users/fanhuifeng/Projects/ai/train-recorder/testing/"
iteration: 3
target_score: 80
evaluator: Claude (automated, adversarial)
---

# Test Cases Eval -- Iteration 3

**Score: 80/100** (target: 80)

```
+-------------------------------------------------------------------+
|                  TEST CASES QUALITY SCORECARD                      |
+-------------------------------------------------------------------+
| Dimension                    | Score    | Max      | Status       |
|------------------------------|----------|----------|--------------|
| 1. PRD Traceability          |  20      |  25      | :warning:    |
|    TC-to-AC mapping          |  8/9     |          |              |
|    Traceability table        |  7/8     |          |              |
|    Reverse coverage          |  5/8     |          |              |
|------------------------------|----------|----------|--------------|
| 2. Step Actionability        |  22      |  25      | :white_check_mark: |
|    Steps concrete            |  8/9     |          |              |
|    Expected results          |  8/9     |          |              |
|    Preconditions explicit    |  6/7     |          |              |
|------------------------------|----------|----------|--------------|
| 3. Route & Element Accuracy  |  16      |  20      | :warning:    |
|    Routes valid              |  6/7     |          |              |
|    Elements identifiable     |  5/7     |          |              |
|    Consistency               |  5/6     |          |              |
|------------------------------|----------|----------|--------------|
| 4. Completeness              |  14      |  20      | :warning:    |
|    Type coverage             |  7/7     |          |              |
|    Boundary cases            |  5/7     |          |              |
|    Integration scenarios     |  2/6     |          |              |
|------------------------------|----------|----------|--------------|
| 5. Structure & ID Integrity  |  8       |  10      | :warning:    |
|    IDs sequential/unique     |  4/4     |          |              |
|    Classification correct    |  3/3     |          |              |
|    Summary matches actual    |  1/3     |          |              |
|------------------------------|----------|----------|--------------|
| TOTAL                        |  80      |  100     |              |
+-------------------------------------------------------------------+
```

---

## Deductions

| Location                                  | Issue                                                                                                                                                                                                                                                                                                                                                                                                                            | Penalty                  |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| TC-UI-012 Expected                        | Expected result says "总操作次数 <= 2 次点击完成一组记录（步骤 2 的 1 次点击）" but does not objectively define how to verify "total operations <= 2 clicks" -- it is a UX metric, not a verifiable UI state                                                                                                                                                                                                                     | -1 pt (Actionability)    |
| TC-UI-022 Steps                           | "在进步曲线图区域执行双指捏合手势缩小视图" is a gesture description, not a discrete programmatic action -- no selector or coordinate specified for automation                                                                                                                                                                                                                                                                    | -1 pt (Actionability)    |
| TC-UI-058 Element                         | Element field says "系统通知（点击动作），`data-testid="next-set-btn"`, `data-testid="rest-timer"`" -- the notification click is described in parentheses but not given a selector strategy                                                                                                                                                                                                                                      | -1 pt (Route & Element)  |
| TC-UI-007 Steps                           | Single step "在训练执行页点击一个动作卡片展开区域" but Expected checks multiple distinct elements (suggested weight AND target sets/reps) -- step is too coarse for a single verification                                                                                                                                                                                                                                        | -1 pt (Actionability)    |
| TC-UI-056, TC-UI-060 Pre-conditions       | Pre-conditions specify exact timing ("剩余 90 秒", "剩余 60 秒") but steps don't explain how to programmatically create this precise state -- insufficient for automation setup                                                                                                                                                                                                                                                  | -1 pt (Actionability)    |
| Summary table                             | Summary table says UI P0=44, P2=11, Total P0=52, Total P2=13. Actual count from both body entries and traceability matrix: UI P0=43, P2=10, Total P0=51, Total P2=12. UI count is off by +1 for P0 and +1 for P2                                                                                                                                                                                                                 | -2 pts (Structure)       |
| PRD 5.1 interaction flow                  | PRD 5.1 has 7 interaction flow steps but no TC explicitly traces to "PRD 5.1 AC-X" format; calendar page TCs trace to US-1 AC-4 and US-6 ACs which cover similar ground but the calendar page's own interaction steps (month switching, training type filtering) have only partial coverage                                                                                                                                      | -1 pt (Traceability)     |
| PRD 5.9 plan management                   | PRD 5.9 has detailed plan creation form fields (plan name, plan mode, cycle length, scheduling method, fixed-day vs interval-day scheduling) with validation rules, but no TC tests the "fixed interval" scheduling mode or cycle length validation (1-12 weeks)                                                                                                                                                                 | -1 pt (Traceability)     |
| PRD 5.2 interaction steps 4-5             | PRD 5.2 step 4: "倒计时到时" has TC-UI-009 but the "振动 + 声音提醒 + 显示「开始下一组」按钮" is only partially verified -- the TC checks vibration and sound but the "开始下一组" button appearance is not verified in that TC (it appears in TC-UI-058 instead for the background scenario)                                                                                                                                    | -1 pt (Reverse coverage) |
| Integration scenarios                     | Only TC-UI-069 (retroactive record affects progressive overload) and TC-API-005 (custom weight affects next suggestion) test cross-feature integration. No TC tests: (1) UI action triggering API call and verifying both UI state change AND service data; (2) exercise library change affecting active plan; (3) settings unit change propagating to workout page display; (4) feeling data affecting next training suggestion | -4 pts (Completeness)    |
| TC-UI-094 Source field                    | Source is "PRD 5.11.1 AC-1" but PRD 5.11.1 does not have numbered ACs -- it has interaction flow steps 1-3. The mapping to "AC-1" is fabricated                                                                                                                                                                                                                                                                                  | -1 pt (Traceability)     |
| TC-UI-088 through TC-UI-090 Source fields | Sources use "PRD 5.10 AC-1" through "PRD 5.10 AC-6" but the PRD spec section 5.10 does not have numbered acceptance criteria -- it has 7 interaction flow steps and validation rules. The "AC-N" numbering is invented                                                                                                                                                                                                           | -2 pts (Traceability)    |

---

## Attack Points

### Attack 1: Completeness -- Integration test scenarios are severely lacking

**Where**: The entire document. TC-UI-069 is the only true integration TC (retroactive record affecting progressive overload suggestion). TC-API-005 tests custom weight affecting suggestion but from the API side only.

**Why it's weak**: The PRD defines a tightly coupled system where actions in one feature affect another. No TC verifies end-to-end flows across interfaces:

1. User changes unit setting in /settings -> all workout/history pages display converted weights (TC-UI-073 only checks the setting page, does not navigate to /workout or /history to verify propagation)
2. User edits exercise library increment -> active plan's future suggestions reflect the change
3. User records high fatigue/low satisfaction feeling -> next workout page actually shows the reduced-intensity prompt (TC-UI-024 checks the feeling save, TC-UI-066 checks history edit, but no TC verifies the prompt appears when starting the NEXT workout)
4. User creates a plan with template -> exercises auto-populate with correct defaults -> first workout shows correct suggestions (the onboarding flow is split across TC-UI-084, TC-UI-085, TC-UI-086 but none verify the full chain)

**What must improve**: Add integration TCs that traverse multiple routes: (1) settings -> workout page unit verification; (2) feeling record -> next workout reduced-intensity prompt; (3) template creation -> workout execution with correct pre-populated data; (4) exercise library increment change -> active plan suggestion recalculation.

### Attack 2: PRD Traceability -- Fabricated AC numbering for PRD spec sections

**Where**: TC-UI-088 through TC-UI-090 use "PRD 5.10 AC-1", "PRD 5.10 AC-2", "PRD 5.10 AC-3". TC-UI-091 through TC-UI-093 use "PRD 5.11 AC-1", "PRD 5.11 AC-2", "PRD 5.11 AC-3". TC-UI-094 uses "PRD 5.11.1 AC-1". TC-API-012 through TC-API-014 use "PRD 5.10 AC-4" through "PRD 5.10 AC-6".

**Why it's weak**: The PRD spec sections 5.10, 5.11, and 5.11.1 do not have numbered acceptance criteria. They have interaction flow steps (numbered 1-7 for 5.10, 1-14 for 5.11, 1-3 for 5.11.1) and validation rules. The document invents "AC-1" through "AC-6" labels that do not exist in the PRD. This means the traceability chain is broken for these TCs -- a reviewer cannot follow "PRD 5.10 AC-3" back to an actual numbered criterion in the PRD because no such numbering exists. Additionally, PRD 5.1 (calendar page) has 7 interaction flow steps but no TC explicitly traces to them, and PRD 5.9 (plan management) has detailed scheduling rules (fixed-day vs interval-day) with no TC coverage for the interval-day scheduling mode.

**What must improve**: (1) Map TCs to actual PRD section identifiers -- use "PRD 5.10 Step 1" instead of inventing "AC-1". (2) Add TCs for PRD 5.9 interval-day scheduling mode and cycle length validation. (3) Ensure every PRD interaction flow step has at least one TC or explicitly state why it is covered by an existing TC.

### Attack 3: Structure & ID Integrity -- Summary table priority counts are materially wrong

**Where**: Summary table at the end of the document:

> | UI | 109 | 44 | 56 | 11 |
> | API | 14 | 8 | 4 | 2 |
> | **Total** | **123** | **52** | **60** | **13** |

**Why it's weak**: Independent count of both the individual TC body entries and the traceability matrix rows confirms: UI P0=43 (not 44), UI P2=10 (not 11), Total P0=51 (not 52), Total P2=12 (not 13). The total count of 123 TCs is correct, but the priority breakdown in the summary table is wrong by +1 for P0 and +1 for P2. This means either a TC was miscounted or a priority was changed without updating the summary. This is the same class of error found in iteration 1 and partially fixed in iteration 2 -- the document has regressed on summary accuracy.

**What must improve**: Re-count all TC priorities from the individual TC entries. The correct values should be: UI P0=43, P1=56, P2=10; Total P0=51, P1=60, P2=12. Update the summary table to match.

---

## Previous Issues Check

| Previous Attack                                                                                              | Addressed? | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Attack 1: Traceability matrix uses range notation grouping 67 of 106 TCs into collapsed ranges               | YES        | Traceability matrix now lists every TC individually on its own row with all required columns (TC ID, Source, Type, Target, Priority). All 123 TCs are listed.                                                                                                                                                                                                                                                                                                                                                                   |
| Attack 2: Missing boundary/invalid-input test cases                                                          | MOSTLY     | Added TC-UI-095 through TC-UI-109: 15 new TCs covering sets boundary (0, 1, 10, 11), reps boundary (0, 1, 30), rest time boundary (29, 30, 600), negative weight (-5), zero reps during workout, zero increment, long exercise name, corrupted import file. Covers the main PRD 5.3 validation rules. Still missing: non-numeric input in weight field, rest time > 600, very large weight values.                                                                                                                              |
| Attack 3: Notification TC Element fields lack selector strategies; API TCs use function signatures as routes | MOSTLY     | Notification TCs (TC-UI-057, TC-UI-059) now use `NotificationManager.getLastNotification({ channel: 'rest-timer' })` and `NotificationManager.getLockScreenNotification({ channel: 'rest-timer' })` as Element identifiers -- this is a concrete testing API. API TCs now use `service://progressive-overload/calculateSuggestedWeight` URI-style identifiers instead of raw function signatures -- much better. TC-UI-058 Element field still has "系统通知（点击动作）" as a free-text description alongside valid selectors. |

---

## Verdict

- **Score**: 80/100
- **Target**: 80/100
- **Gap**: 0 points
- **Step Actionability**: 22/25 (above blocking threshold of 20 -- NOT BLOCKING)
- **Action**: Target score reached. Document is acceptable for downstream gen-test-scripts.

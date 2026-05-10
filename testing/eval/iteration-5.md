---
date: "2026-05-09"
doc_dir: "/Users/fanhuifeng/Projects/ai/train-recorder/testing/"
iteration: 5
target_score: 80
evaluator: Claude (automated, adversarial)
---

# Test Cases Eval -- Iteration 5

**Score: 90/100** (target: 80)

```
+-------------------------------------------------------------------+
|                  TEST CASES QUALITY SCORECARD                      |
+-------------------------------------------------------------------+
| Dimension                    | Score    | Max      | Status       |
|------------------------------|----------|----------|--------------|
| 1. PRD Traceability          |  23      |  25      | :warning:    |
|    TC-to-AC mapping          |  9/9     |          |              |
|    Traceability table        |  8/8     |          |              |
|    Reverse coverage          |  6/8     |          |              |
|------------------------------|----------|----------|--------------|
| 2. Step Actionability        |  23      |  25      | :white_check_mark: |
|    Steps concrete            |  8/9     |          |              |
|    Expected results          |  8/9     |          |              |
|    Preconditions explicit    |  7/7     |          |              |
|------------------------------|----------|----------|--------------|
| 3. Route & Element Accuracy  |  18      |  20      | :white_check_mark: |
|    Routes valid              |  7/7     |          |              |
|    Elements identifiable     |  6/7     |          |              |
|    Consistency               |  5/6     |          |              |
|------------------------------|----------|----------|--------------|
| 4. Completeness              |  18      |  20      | :white_check_mark: |
|    Type coverage             |  7/7     |          |              |
|    Boundary cases            |  6/7     |          |              |
|    Integration scenarios     |  5/6     |          |              |
|------------------------------|----------|----------|--------------|
| 5. Structure & ID Integrity  |  8       |  10      | :warning:    |
|    IDs sequential/unique     |  4/4     |          |              |
|    Classification correct    |  3/3     |          |              |
|    Summary matches actual    |  1/3     |          |              |
|------------------------------|----------|----------|--------------|
| TOTAL                        |  90      |  100     |              |
+-------------------------------------------------------------------+
```

---

## Deductions

| Location                           | Issue                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Penalty                                |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| TC-UI-012 Expected                 | Expected result says "总操作次数 <= 2 次点击完成一组记录（步骤 2 的 1 次点击）" -- this is a UX metric assertion, not an objectively verifiable UI state. A test script cannot programmatically count "total operations" across a workflow and compare to a threshold of 2 clicks. Same issue flagged in iteration 4, still unfixed.                                                                                                                                                                                                                 | -1 pt (Actionability: Expected)        |
| TC-UI-022 Steps                    | "在进步曲线图区域执行双指捏合手势缩小视图" is a mobile gesture description without specifying a selector, coordinate, or automation API for the pinch gesture. Playwright/React Native Testing Library mobile gestures require explicit element targeting (e.g., `pinch(element, { scale: 0.5 })`). Same issue flagged in iteration 4, still unfixed.                                                                                                                                                                                                | -1 pt (Actionability: Steps)           |
| TC-UI-096/100/102/103 Expected     | Boundary TCs for valid upper/lower bounds use "保存成功" as expected result without specifying what observable UI state confirms success (e.g., Toast text, navigation event, or data assertion). Other TCs in the document use the more precise "Toast 提示「保存成功」" pattern. Same issue flagged in iteration 4.                                                                                                                                                                                                                                | -1 pt (Actionability: Expected)        |
| TC-UI-022 Element                  | Element field uses `data-testid="progress-chart"` and `data-testid="chart-container"` but the Steps describe a pinch gesture and swipe on the chart area without referencing these selectors or using a gesture automation API. The step "执行双指捏合手势缩小视图" does not specify which data-testid the gesture targets.                                                                                                                                                                                                                          | -1 pt (Route & Element: Elements)      |
| TC-UI-047 Route                    | Route is "/exercise-library -> /plan/edit" which chains two routes with an arrow. This is ambiguous for test script generation -- it is unclear whether the TC navigates between pages or covers both. Multi-step TCs should specify which route corresponds to which step, or use the step with route notation.                                                                                                                                                                                                                                     | -1 pt (Route & Element: Consistency)   |
| PRD 5.10 Step 6                    | PRD 5.10 Step 6 says "点击「查看全部」-- 跳转历史页 PR 面板". TC-UI-120 verifies the PR list shows at most 4 items and has a "查看全部" button, but no TC verifies that clicking "查看全部" actually navigates to the history page PR panel. TC-UI-120 only checks the button exists, not the navigation.                                                                                                                                                                                                                                            | -1 pt (Traceability: Reverse coverage) |
| PRD 5.11 Steps 2-9                 | PRD 5.11 defines 14 interaction steps. Steps 2 (click exercise library -> navigate), 3 (click weight unit -> toggle), 4 (click rest time -> picker), 5 (toggle switches), 6-9 (export flow) are only partially covered. TC-UI-091 covers Step 1, TC-UI-092 covers Steps 10-11, but Steps 2-5 and 12-14 lack dedicated TCs. The body TCs (TC-UI-073, TC-UI-091-094) cover some of these but the mapping is implicit and incomplete for Steps 4 (rest time picker), 5 (toggle switches), 12 (onboarding replay), 13 (app store rating), 14 (feedback). | -1 pt (Traceability: Reverse coverage) |
| Boundary TCs TC-UI-096/100/102/103 | These valid-boundary TCs verify "保存成功" without any visual feedback specification, making them borderline for automated verification. Other TCs specify Toast text or UI state changes, creating an inconsistency in expected result quality.                                                                                                                                                                                                                                                                                                     | -1 pt (Completeness: Boundary)         |
| Integration scenarios              | TC-UI-122 and TC-UI-123 are new UI-API cross-layer integration TCs that verify both UI state and service-layer data. This is a significant improvement. However, no integration TC tests the data export end-to-end flow: export data from UI -> read file via fs.readFile -> verify JSON structure includes all record types AND correct data values in a single TC. TC-UI-072 verifies file structure but is a standalone TC, not an end-to-end integration scenario.                                                                              | -1 pt (Completeness: Integration)      |
| Summary table Priority P0          | Summary table lists UI P0=45, P1=68, P2=10 and Total P0=53, P1=72, P2=12. Body verification confirms: UI P0=45, P1=68, P2=10, API P0=8, P1=4, P2=2, Total P0=53, P1=72, P2=12. All counts match. However, the traceability matrix priority column shows TC-UI-091 as P0 but TC-UI-091's Source field says "PRD 5.11 Step 1" which is just viewing the settings list -- this is a display/verification TC, not a critical path, so P0 classification is arguably generous. No deduction for this; noting for completeness.                            | 0 pts (verified correct)               |

---

## Attack Points

### Attack 1: Actionability -- TC-UI-012 and TC-UI-022 remain unfixed from iteration 4

**Where**: TC-UI-012 Expected: "总操作次数 <= 2 次点击完成一组记录（步骤 2 的 1 次点击）". TC-UI-022 Steps: "在进步曲线图区域执行双指捏合手势缩小视图".

**Why it's weak**: These two TCs were flagged in iteration 4 and remain unchanged in iteration 5. TC-UI-012's expected result is a UX metric threshold, not an observable UI state. A downstream test script cannot assert "total operations <= 2 clicks" programmatically. TC-UI-022 describes a pinch gesture without specifying a gesture automation API call or element coordinate. Both issues block automated script generation for these specific TCs.

**What must improve**: (1) For TC-UI-012, change the expected result to verify concrete UI state: e.g., "建议重量输入框预填充值正确（1 次阅读确认），点击「完成本组」后倒计时自动启动（1 次点击），总共 1 次点击操作". Or simply verify the two-step workflow completes and assert specific UI outcomes. (2) For TC-UI-022, use a gesture automation API: e.g., `gesture.pinch('data-testid="progress-chart"', { scale: 0.5, duration: 500 })` and `gesture.swipe('data-testid="chart-container"', { direction: 'left', distance: 200 })`.

### Attack 2: PRD Traceability -- PRD 5.10 Step 6 ("查看全部" navigation) and PRD 5.11 Steps 2-5, 12-14 still have incomplete coverage

**Where**: PRD 5.10 Step 6 specifies "点击「查看全部」-- 跳转历史页 PR 面板". PRD 5.11 Steps 2-5 define interactions for exercise library navigation, weight unit toggle, rest time picker, and toggle switches. Steps 12-14 define onboarding replay, app store rating, and feedback.

**Why it's weak**: TC-UI-120 verifies that the "查看全部" button exists in the stats PR list, but no TC verifies the actual navigation to the history page PR panel when that button is clicked. This is a functional gap -- the PRD explicitly defines this navigation step.

For PRD 5.11, the existing TCs (TC-UI-073, TC-UI-091-094) cover some steps but leave gaps:

- Step 4 (rest time picker): No TC verifies the bottom sheet picker with 90/120/180/240/300 options
- Step 5 (toggle switches): No TC verifies toggle state changes for training reminder, vibration, and sound
- Step 12 (onboarding replay from settings): TC-UI-087 covers this but it is listed as P2
- Step 13 (app store rating): No TC covers this
- Step 14 (feedback): No TC covers this

While Steps 13-14 may seem trivial (they redirect to external apps), the picker and toggle steps are core settings functionality.

**What must improve**: (1) Add a TC for PRD 5.10 Step 6: click "查看全部" button on stats page -> verify navigation to /history with PR panel active. (2) Add a TC for PRD 5.11 Step 4: click rest time -> verify bottom picker with correct options. (3) Add a TC for PRD 5.11 Step 5: toggle switches -> verify state persistence.

### Attack 3: Completeness -- Boundary TCs (TC-UI-096, 100, 102, 103) use imprecise expected results

**Where**: TC-UI-096 Expected: "保存成功，该动作目标组数记录为 10". TC-UI-100 Expected: "保存成功，该动作目标次数记录为 30". TC-UI-102 Expected: "保存成功，该动作休息时间记录为 30 秒". TC-UI-103 Expected: "保存成功，该动作休息时间记录为 600 秒".

**Why it's weak**: These four valid-boundary TCs use "保存成功" as their expected result without specifying any observable UI feedback that confirms success. The rest of the document uses patterns like "Toast 提示「保存成功」" or "弹出保存成功提示" which are more actionable for downstream script generation. Without a specific UI element to assert (Toast text, navigation event, element state), a test script must rely on implicit success detection. This is an inconsistency with the rest of the TCs and makes these boundary TCs less actionable than they should be.

**What must improve**: For each of these four TCs, add specific UI feedback to the expected result, e.g., "Toast 提示「保存成功」" or "页面导航至 /calendar，日历显示新排期" or "数据库查询确认 target_sets = 10".

---

## Previous Issues Check

| Previous Attack                                                                | Addressed? | Evidence                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Attack 1: Integration TCs lack API+UI dual verification                        | YES        | Added TC-UI-122 and TC-UI-123, which explicitly verify both UI state and service-layer data in the same TC. TC-UI-122 calls `service://progressive-overload/getSetRecord` and `service://progressive-overload/getWorkoutProgress`. TC-UI-123 calls `service://progressive-overload/calculateSuggestedWeight`. Both include UI assertions AND service-layer assertions. |
| Attack 2: PRD 5.10 sub-panels have inadequate coverage                         | YES        | Added TC-UI-119 (weekly volume bar chart with color coding), TC-UI-120 (PR list max 4 items), TC-UI-121 (frequency heatmap rendering with intensity and blue borders). These three TCs directly address Steps 4, 5, and 7 of PRD 5.10.                                                                                                                                 |
| Attack 3: TC-UI-058 and TC-UI-072 Element fields use non-selector descriptions | YES        | TC-UI-058 now uses `NotificationManager.openNotification({ channel: 'rest-timer', action: 'tap' })` as a concrete testing API call. TC-UI-072 now uses "N/A（文件内容断言，非 DOM 元素）" and the steps include `fs.readFile(exportedFilePath)` for file verification.                                                                                                 |
| TC-UI-012 UX metric expected result                                            | NO         | Still reads "总操作次数 <= 2 次点击完成一组记录（步骤 2 的 1 次点击）" -- unchanged from iteration 4.                                                                                                                                                                                                                                                                  |
| TC-UI-022 gesture without selector                                             | NO         | Still reads "在进步曲线图区域执行双指捏合手势缩小视图" -- unchanged from iteration 4.                                                                                                                                                                                                                                                                                  |
| Boundary TCs (096/100/102/103) imprecise expected                              | NO         | Still use "保存成功" without Toast text or UI state specification -- unchanged from iteration 4.                                                                                                                                                                                                                                                                       |
| TC-UI-047 Route ambiguity                                                      | NO         | Still reads "/exercise-library -> /plan/edit" with arrow notation -- unchanged from iteration 4.                                                                                                                                                                                                                                                                       |

---

## Verdict

- **Score**: 90/100
- **Target**: 80/100
- **Gap**: 0 points (target exceeded by 10)
- **Step Actionability**: 23/25 (above blocking threshold of 20 -- NOT BLOCKING)
- **Action**: Target score reached. Document is acceptable for downstream gen-test-scripts. Two unfixed issues from iteration 4 (TC-UI-012 and TC-UI-022) remain but do not block the pipeline.

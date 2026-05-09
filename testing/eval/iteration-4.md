---
date: "2026-05-09"
doc_dir: "/Users/fanhuifeng/Projects/ai/train-recorder/testing/"
iteration: 4
target_score: 80
evaluator: Claude (automated, adversarial)
---

# Test Cases Eval -- Iteration 4

**Score: 86/100** (target: 80)

```
+-------------------------------------------------------------------+
|                  TEST CASES QUALITY SCORECARD                      |
+-------------------------------------------------------------------+
| Dimension                    | Score    | Max      | Status       |
|------------------------------|----------|----------|--------------|
| 1. PRD Traceability          |  22      |  25      | :warning:    |
|    TC-to-AC mapping          |  8/9     |          |              |
|    Traceability table        |  8/8     |          |              |
|    Reverse coverage          |  6/8     |          |              |
|------------------------------|----------|----------|--------------|
| 2. Step Actionability        |  23      |  25      | :white_check_mark: |
|    Steps concrete            |  8/9     |          |              |
|    Expected results          |  8/9     |          |              |
|    Preconditions explicit    |  7/7     |          |              |
|------------------------------|----------|----------|--------------|
| 3. Route & Element Accuracy  |  17      |  20      | :warning:    |
|    Routes valid              |  6/7     |          |              |
|    Elements identifiable     |  6/7     |          |              |
|    Consistency               |  5/6     |          |              |
|------------------------------|----------|----------|--------------|
| 4. Completeness              |  16      |  20      | :warning:    |
|    Type coverage             |  7/7     |          |              |
|    Boundary cases            |  6/7     |          |              |
|    Integration scenarios     |  3/6     |          |              |
|------------------------------|----------|----------|--------------|
| 5. Structure & ID Integrity  |  8       |  10      | :warning:    |
|    IDs sequential/unique     |  4/4     |          |              |
|    Classification correct    |  3/3     |          |              |
|    Summary matches actual    |  1/3     |          |              |
|------------------------------|----------|----------|--------------|
| TOTAL                        |  86      |  100     |              |
+-------------------------------------------------------------------+
```

---

## Deductions

| Location                             | Issue                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Penalty                                |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| TC-UI-012 Expected                   | Expected result says "总操作次数 <= 2 次点击完成一组记录（步骤 2 的 1 次点击）" -- this is a UX metric verification, not an objectively verifiable UI state. A downstream test script cannot programmatically count "total operations" across a workflow and compare to a threshold of 2 clicks.                                                                                                                                                                                                                                                                            | -1 pt (Actionability: Expected)        |
| TC-UI-022 Steps                      | "在进步曲线图区域执行双指捏合手势缩小视图" is a gesture description without specifying a selector, coordinate, or automation API for the pinch gesture. Playwright mobile gestures require explicit element targeting.                                                                                                                                                                                                                                                                                                                                                      | -1 pt (Actionability: Steps)           |
| TC-UI-058 Element                    | Element field says "系统通知（点击动作），`data-testid="next-set-btn"`, `data-testid="rest-timer"`" -- "系统通知（点击动作）" is a free-text description of a notification tap action, not a selector strategy. The notification click has no data-testid or programmatic identifier.                                                                                                                                                                                                                                                                                       | -1 pt (Route & Element: Elements)      |
| TC-UI-072 Element                    | Element field says "外部文件验证（通过文件内容断言）" -- this is a methodology description, not a selector strategy. No testid, aria-label, or semantic locator is provided for the file content assertion.                                                                                                                                                                                                                                                                                                                                                                 | -1 pt (Route & Element: Elements)      |
| TC-UI-047 Route                      | Route is "/exercise-library -> /plan/edit" which chains two routes. This is acceptable for a multi-step TC, but the Route field should specify which route corresponds to which step. The single-arrow notation is ambiguous for test script generation.                                                                                                                                                                                                                                                                                                                    | -1 pt (Route & Element: Routes)        |
| TC-UI-088 Source                     | Source is "PRD 5.10 Step 2" but PRD 5.10 has 7 interaction flow steps. Steps 4-7 of PRD 5.10 (周容量柱状图, 个人记录列表, 查看全部跳转, 训练频率热力图) are only partially covered -- Step 4 (周容量柱状图) has no dedicated TC, Step 5 (个人记录列表) has no dedicated TC, Step 7 (热力图) has no dedicated TC. They are subsumed under TC-UI-088/089 but the TCs verify only Hero card and four-grid, not individual sub-panels.                                                                                                                                          | -1 pt (Traceability: Reverse coverage) |
| PRD 5.10 Steps 4-5                   | PRD 5.10 Step 4: "查看周容量柱状图" specifies "本周高亮为主题色，其他周为灰色，上周绿色边框" but no TC verifies the color coding/highlighting of the bar chart. PRD 5.10 Step 5: "查看个人记录列表" specifies "最多显示 4 条" but no TC verifies the 4-item limit. PRD 5.10 Step 7: "查看训练频率热力图" specifies "计划中日期蓝色边框标注" but no TC verifies heatmap rendering at all.                                                                                                                                                                                    | -1 pt (Traceability: Reverse coverage) |
| Integration scenarios                | TC-UI-110 through TC-UI-113 cover 4 integration scenarios (unit propagation, feeling -> reduced intensity, template -> workout, increment change -> suggestion). However, no TC tests: (1) UI action triggering API call and verifying BOTH UI state change AND service response data in the same TC; (2) editing a historical training record from UI and verifying the progressive-overload recalculation in the service layer; (3) data export from UI and verifying the exported file content includes correct data format AND all record types in one end-to-end flow. | -3 pts (Completeness: Integration)     |
| TC-UI-096/103 Expected               | Boundary TCs for valid upper/lower bounds (TC-UI-096, TC-UI-099, TC-UI-100, TC-UI-102, TC-UI-103) use "保存成功" as expected result without specifying what observable UI state confirms success (e.g., Toast text, navigation event, or data assertion). This is borderline -- "保存成功" is somewhat verifiable but less precise than "Toast 提示「保存成功」" which other TCs use.                                                                                                                                                                                       | -1 pt (Completeness: Boundary)         |
| Traceability matrix P0 count vs body | Traceability matrix lists TC-UI-091 as P0 but TC-UI-091's body entry also says P0, and TC-UI-092 says P0. The summary says UI P0=43 which is correct per body count. However, the traceability matrix lists 51 rows with P0, 69 with P1, 12 with P2 -- matching the summary. No cross-section inconsistency found.                                                                                                                                                                                                                                                          | 0 pts (verified correct)               |

---

## Attack Points

### Attack 1: Completeness -- Integration TCs still lack API+UI dual verification

**Where**: TC-UI-110 through TC-UI-113 are the integration TCs.

**Why it's weak**: While 4 integration TCs were added since iteration 3, they all verify integration at the UI level only. None of them verify both the UI state change AND the underlying service/data layer in the same test case. For example:

- TC-UI-110 (unit switch propagation) navigates /settings -> /workout -> /history but only checks display values on each page. It does not verify the database storage unit field or the service-layer conversion logic.
- TC-UI-113 (increment change -> suggestion update) checks the suggested weight display value but does not call the progressive-overload service directly to confirm the service uses the new increment.
- No TC exists for: (1) editing a historical record via UI and verifying progressive-overload service recalculates correctly; (2) exporting data via UI and programmatically validating the file structure contains all required fields and data types.

The rubric's integration criterion (0-6 pts) asks for "cross-feature or cross-interface scenarios (e.g., UI action triggers API call)". None of the 132 TCs cross the UI-API interface boundary.

**What must improve**: Add at least 2 TCs that explicitly cross the UI-API boundary: (1) a TC that performs a UI action (e.g., complete a set) and then verifies both the UI update AND the service-layer data via an API call or database assertion; (2) a TC that modifies data via UI and verifies the service recalculation produces correct output in the data layer.

### Attack 2: PRD Traceability -- PRD 5.10 sub-panels have inadequate coverage

**Where**: TC-UI-088 covers PRD 5.10 Step 2 (Hero card), TC-UI-089 covers PRD 5.10 Step 3 (four-grid), TC-UI-090 covers PRD 5.10 Step 1 (no_data status). But PRD 5.10 Steps 4, 5, and 7 are untested.

**Why it's weak**: PRD 5.10 defines 7 interaction flow steps. Steps 4-7 describe distinct UI components with specific visual rules:

- Step 4: "周容量柱状图 -- 近 8 周柱状图，本周高亮为主题色，其他周为灰色，上周绿色边框". No TC verifies this chart renders, and specifically no TC checks the color-coding rules (theme color for current week, grey for others, green border for last week).
- Step 5: "个人记录列表 -- 展示各动作 1RM 估测及达成日期，最多显示 4 条". No TC verifies the PR list displays or the 4-item maximum limit.
- Step 6: "点击「查看全部」-- 跳转历史页 PR 面板". No TC tests this navigation.
- Step 7: "训练频率热力图 -- 近 4 周活动方块图，深浅表示训练强度，计划中日期蓝色边框标注". No TC verifies the heatmap renders or the blue border annotation for planned dates.

TC-API-012 through TC-API-014 test the underlying calculation formulas (1RM estimation, week-over-week, heatmap intensity) but these are API-layer TCs. No UI TC verifies these computed values actually render in the /stats page components.

**What must improve**: Add at least 3 UI TCs for /stats: (1) TC verifying the weekly volume bar chart renders with correct color coding (current week highlighted, last week green border); (2) TC verifying the personal record list shows at most 4 items with correct exercise names and dates; (3) TC verifying the heatmap renders with intensity shading and blue borders for planned dates.

### Attack 3: Route & Element Accuracy -- Two TCs use non-selector Element descriptions

**Where**: TC-UI-058 Element field: "系统通知（点击动作），`data-testid="next-set-btn"`, `data-testid="rest-timer"`". TC-UI-072 Element field: "外部文件验证（通过文件内容断言）".

**Why it's weak**: The rubric requires Elements to use a "selector strategy: data-testid, aria-label, or semantic locator. Not 'the button' or 'the form'." TC-UI-058 prefixes its element with "系统通知（点击动作）" which is a free-text description, not a selector. A test script cannot target "系统通知（点击动作）" -- it needs a NotificationManager API call or a specific deep link URI. TC-UI-072 uses "外部文件验证（通过文件内容断言）" which is a verification methodology, not a DOM element. The downstream gen-test-scripts skill cannot convert this to a selector.

**What must improve**: (1) For TC-UI-058, replace "系统通知（点击动作）" with a concrete testing API call like `NotificationManager.openNotification({ channel: 'rest-timer' })` or a deep link URI that simulates notification tap. (2) For TC-UI-072, either add a file assertion API like `fs.readFile(exportedFilePath)` or specify that the Element field is N/A for file-content TCs and move the verification to a post-step assertion block.

---

## Previous Issues Check

| Previous Attack                                            | Addressed? | Evidence                                                                                                                                                                                                                |
| ---------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Attack 1: Traceability matrix uses range notation grouping | YES        | Traceability matrix now lists every TC individually with all columns. All 132 TCs present.                                                                                                                              |
| Attack 2: Missing boundary/invalid-input TCs               | YES        | TC-UI-095 through TC-UI-109 cover sets/reps/rest boundaries, plus TC-UI-115 through TC-UI-118 cover cycle length and interval day validation. Comprehensive boundary coverage for PRD 5.3 and PRD 5.9 validation rules. |
| Attack 3: Integration scenarios severely lacking           | PARTIALLY  | Added TC-UI-110 through TC-UI-113 (4 integration TCs). Still no TC crosses UI-API boundary. Still missing UI verification for PRD 5.10 sub-panels.                                                                      |
| Fabricated AC numbering for PRD 5.10/5.11                  | YES        | Sources now use "PRD 5.10 Step N" and "PRD 5.11 Step N" format, matching actual PRD section structure.                                                                                                                  |
| Summary table priority counts wrong                        | YES        | Summary now shows UI P0=43, P1=65, P2=10; Total P0=51, P1=69, P2=12. Verified correct against individual TC entries.                                                                                                    |
| PRD 5.9 interval scheduling mode uncovered                 | YES        | Added TC-UI-114 (fixed interval scheduling), TC-UI-115 through TC-UI-118 (cycle length and interval bounds).                                                                                                            |
| TC-UI-058 Element field has free-text description          | NO         | Still reads "系统通知（点击动作）" alongside valid data-testid selectors.                                                                                                                                               |

---

## Verdict

- **Score**: 86/100
- **Target**: 80/100
- **Gap**: 0 points (target exceeded by 6)
- **Step Actionability**: 23/25 (above blocking threshold of 20 -- NOT BLOCKING)
- **Action**: Target score reached. Document is acceptable for downstream gen-test-scripts.

---
date: "2026-05-09"
doc_dir: "/Users/fanhuifeng/Projects/ai/train-recorder/testing/"
iteration: 1
target: 80
evaluator: Claude (automated, adversarial)
---

# Test Cases Eval — Iteration 1

**Score: 54/100** (target: 80)

```
┌─────────────────────────────────────────────────────────────────┐
│                  TEST CASES QUALITY SCORECARD                     │
├──────────────────────────────────────────────────────────────────┤
│ Dimension                    │ Score    │ Max      │ Status     │
├──────────────────────────────┼──────────┼──────────┼────────────┤
│ 1. PRD Traceability          │  15      │  25      │ ❌         │
│    TC-to-AC mapping          │   6/9    │          │            │
│    Traceability table        │   3/8    │          │            │
│    Reverse coverage          │   6/8    │          │            │
├──────────────────────────────┼──────────┼──────────┼────────────┤
│ 2. Step Actionability        │  15      │  25      │ ⚠️         │
│    Steps concrete            │   4/9    │          │            │
│    Expected results          │   6/9    │          │            │
│    Preconditions explicit    │   5/7    │          │            │
├──────────────────────────────┼──────────┼──────────┼────────────┤
│ 3. Route & Element Accuracy  │   4      │  20      │ ❌         │
│    Routes valid              │   3/7    │          │            │
│    Elements identifiable     │   0/7    │          │            │
│    Consistency               │   1/6    │          │            │
├──────────────────────────────┼──────────┼──────────┼────────────┤
│ 4. Completeness              │  13      │  20      │ ⚠️         │
│    Type coverage             │   7/7    │          │            │
│    Boundary cases            │   3/7    │          │            │
│    Integration scenarios     │   3/6    │          │            │
├──────────────────────────────┼──────────┼──────────┼────────────┤
│ 5. Structure & ID Integrity  │   7      │  10      │ ⚠️         │
│    IDs sequential/unique     │   4/4    │          │            │
│    Classification correct    │   3/3    │          │            │
│    Summary matches actual    │   0/3    │          │            │
├──────────────────────────────┼──────────┼──────────┼────────────┤
│ TOTAL                        │  54      │  100     │            │
└──────────────────────────────────────────────────────────────────┘
```

---

## Deductions

| Location                        | Issue                                                                                                                                                                              | Penalty                                             |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| All TCs                         | Source fields use paraphrased AC text (e.g., "US-1 AC: 用户首次使用 App，点击「创建计划」") instead of numbered references like "PRD AC-1.1"                                       | -3 pts (Traceability)                               |
| Traceability Matrix             | Matrix groups TCs by ranges ("TC-UI-001 ~ TC-UI-006") instead of listing each TC with Source, Type, Target, Priority columns as required                                           | -5 pts (Traceability)                               |
| Multiple TCs                    | Steps use passive observation language: "观察首页提示" (TC-UI-001), "观察今日日期格子" (TC-UI-004), "观察输入字段" (TC-UI-041)                                                     | -5 pts (Actionability, -1 per pattern x5 instances) |
| All 106 TCs                     | No Element field exists in any test case. Zero selector strategies (data-testid, aria-label, etc.) provided                                                                        | -7 pts (Route & Element)                            |
| All TCs                         | Target fields use file paths (e.g., "app/(tabs)/calendar.tsx", "src/services/timer.ts") not URL routes (e.g., `/calendar`, `/workout`)                                             | -4 pts (Route & Element)                            |
| Summary table                   | Priority counts are wrong: UI P0=34 claimed but actual=41; P2=18 claimed but actual=9; Total P0=40 claimed but actual=49; Total P2=20 claimed but actual=11                        | -3 pts (Structure)                                  |
| Most TCs                        | Almost exclusively happy-path testing. No TCs for: invalid weight input (negative, zero, extremely large), storage full, corrupted data, boundary values for sets/reps (1, 30, 31) | -4 pts (Completeness)                               |
| TC-UI-041                       | Precondition is circular: "用户点击「记录身体数据」" — this is a test step, not a precondition                                                                                     | -1 pt (Actionability)                               |
| TC-UI-022, TC-UI-039, TC-UI-077 | Vague expected results: "图表支持缩放和滑动浏览", "允许同一天既记录...", "动作卡片可拖动" — no objective pass/fail criteria                                                        | -3 pts (Actionability, -1 per instance)             |

---

## Attack Points

### Attack 1: Route & Element Accuracy — Complete absence of Element selectors

**Where**: Every single test case in the document. For example, TC-UI-008:

> | Target | app/workout.tsx |

**Why it's weak**: No test case has an Element field. The rubric requires "Every Element field uses a selector strategy: data-testid, aria-label, or semantic locator." Without selectors, a test automation engineer has zero guidance on how to locate interactive elements. The TC says "click「完成本组」" but there is no way to programmatically identify that button. Additionally, Target fields are file paths from the codebase, not navigable routes. A test script cannot navigate to "app/(tabs)/calendar.tsx" — it needs a route like `/calendar` or a deep link.

**What must improve**: Add an Element field to every UI TC with a concrete selector. Example: `data-testid="complete-set-btn"`. Convert Target fields from file paths to app routes. For API TCs, use function/method signatures or endpoint identifiers instead of file paths.

### Attack 2: Step Actionability — Steps are passive descriptions, not executable actions

**Where**: TC-UI-001:

> Steps: 1. 打开 App 2. 观察首页提示 3. 点击「创建计划」

TC-UI-084:

> Steps: 1. 首次打开 App

TC-UI-022:

> Steps: 1. 查看进步曲线 2. 尝试缩放和滑动

**Why it's weak**: The rubric demands "Each step describes a single, unambiguous user action. 'Click the Submit button' not 'Submit the form'." Steps like "观察首页提示" and "尝试缩放和滑动" are neither concrete nor automatable. What gesture performs the zoom — a pinch? A button tap? Which specific element is being interacted with? TC-UI-084 has a single step "首次打开 App" with no detail about what the user actually does or sees at each of the "3-4 steps" of the onboarding. API TCs like TC-API-001 say "加载本次训练深蹲" which is a description of what the system does, not an API call like `GET /api/suggestions?exercise=squat`.

**What must improve**: Rewrite every step as a concrete, automatable action. Replace "观察" with specific assertions. Replace "查看" with navigation actions (tap tab, scroll to section). Replace API "加载" with actual function calls or data flow descriptions. Each TC should have enough detail that a developer could write a test script without re-reading the PRD.

### Attack 3: Structure & ID Integrity — Summary table counts are materially wrong

**Where**: Summary section:

> | UI | 92 | 34 | 40 | 18 |

**Why it's weak**: Manual count of the actual TCs reveals: UI P0=41 (not 34), UI P1=42 (not 40), UI P2=9 (not 18). API P0=8 (not 6), API P1=4 (not 6). Total P0=49 (not 40), Total P2=11 (not 20). The discrepancy is massive — P2 is off by 9, P0 is off by 9. This means the summary table cannot be trusted. If a test runner uses these counts to verify completeness, it will produce false positives/negatives.

**What must improve**: Recount every priority category against the actual TC definitions. Correct the summary table. As an added safeguard, add a TC count verification step to the generation pipeline so future edits cannot silently break the count.

---

## Previous Issues Check

<!-- First iteration — no previous issues to check -->

---

## Verdict

- **Score**: 54/100
- **Target**: 80/100
- **Gap**: 26 points
- **Step Actionability**: 15/25 (above blocking threshold of 20? NO — 15 < 20, BLOCKING)
- **Action**: Continue to iteration 2. Priority fixes: (1) Add Element selectors to all UI TCs, (2) Rewrite steps as concrete actions, (3) Fix summary table counts, (4) Add edge/boundary TCs.

SCORE: 54/100
DIMENSIONS:

- PRD Traceability: 15/25
- Step Actionability: 15/25
- Route & Element Accuracy: 4/20
- Completeness: 13/20
- Structure & ID Integrity: 7/10
  ATTACKS:

1. Route & Element Accuracy: Zero Element selectors in any test case and Target fields are file paths not routes — "Target: app/workout.tsx" and no Element field exists — every UI TC must add a data-testid/aria-label selector; every Target must use an app route
2. Step Actionability: Steps use passive observation language instead of concrete automatable actions — "1. 打开 App 2. 观察首页提示 3. 点击「创建计划」" (TC-UI-001), "1. 首次打开 App" (TC-UI-084), "1. 查看进步曲线 2. 尝试缩放和滑动" (TC-UI-022) — rewrite every step as a specific click/tap/gesture with identifiable elements
3. Structure & ID Integrity: Summary table priority counts are materially wrong — claims "UI P0=34, P2=18" but actual count is P0=41, P2=9; claims "Total P0=40, P2=20" but actual is P0=49, P2=11 — recount and correct all priority tallies

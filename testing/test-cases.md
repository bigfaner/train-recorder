---
feature: "Train Recorder"
generated_from: "prd/prd-spec.md, prd/prd-user-stories.md, prd/prd-ui-functions.md"
generated_date: "2026-05-09"
total_test_cases: 137
---

# Test Cases: Train Recorder

> Structured test cases generated from PRD acceptance criteria.
> Grouped by type: UI -> API -> CLI.

---

## Type: UI

### TC-UI-001: 首次使用进入计划创建流程

| Field          | Value                                                                                 |
| -------------- | ------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-001                                                                             |
| Source         | US-1 AC-1                                                                             |
| Type           | UI                                                                                    |
| Route          | /calendar                                                                             |
| Target         | 首页空状态引导组件                                                                    |
| Element        | `data-testid="empty-state-guide"`, `data-testid="create-plan-btn"`                    |
| Priority       | P0                                                                                    |
| Pre-conditions | 用户首次使用，无任何训练数据                                                          |
| Steps          | 1. 启动 App（冷启动） 2. 等待首页加载，断言空状态引导组件可见 3. 点击「创建计划」按钮 |
| Expected       | 页面导航至 /plan/create，显示计划创建流程第一步                                       |

### TC-UI-002: 无限循环模式自动排期

| Field          | Value                                                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-002                                                                                                               |
| Source         | US-1 AC-2                                                                                                               |
| Type           | UI                                                                                                                      |
| Route          | /plan/create                                                                                                            |
| Target         | 计划创建表单                                                                                                            |
| Element        | `data-testid="mode-selector"`, `data-testid="mode-endless-loop"`, `data-testid="save-plan-btn"`                         |
| Priority       | P0                                                                                                                      |
| Pre-conditions | 用户在计划创建页面                                                                                                      |
| Steps          | 1. 点击「模式选择器」展开下拉菜单 2. 选择「无限循环」选项 3. 分别为推日、拉日、蹲日添加训练动作 4. 点击「保存计划」按钮 |
| Expected       | 弹出保存成功提示，日历页显示推->拉->蹲顺序的无限循环排期                                                                |

### TC-UI-003: 固定周期模式自动排期

| Field          | Value                                                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-003                                                                                                                          |
| Source         | US-1 AC-3                                                                                                                          |
| Type           | UI                                                                                                                                 |
| Route          | /plan/create                                                                                                                       |
| Target         | 计划创建表单                                                                                                                       |
| Element        | `data-testid="mode-selector"`, `data-testid="mode-fixed-cycle"`, `data-testid="cycle-length-input"`, `data-testid="save-plan-btn"` |
| Priority       | P0                                                                                                                                 |
| Pre-conditions | 用户在计划创建页面                                                                                                                 |
| Steps          | 1. 点击「模式选择器」选择「固定周期」 2. 在周期输入框输入 4 3. 定义每周训练日及动作 4. 点击「保存计划」                            |
| Expected       | 生成 4 周完整排期并保存，第 5 周自动重新开始                                                                                       |

### TC-UI-004: 训练日日历显示今日训练类型

| Field          | Value                                                                    |
| -------------- | ------------------------------------------------------------------------ |
| Test ID        | TC-UI-004                                                                |
| Source         | US-1 AC-4                                                                |
| Type           | UI                                                                       |
| Route          | /calendar                                                                |
| Target         | 日历今日日期格子                                                         |
| Element        | `data-testid="calendar-today-cell"`, `data-testid="training-type-label"` |
| Priority       | P0                                                                       |
| Pre-conditions | 有训练计划排期，今天是训练日                                             |
| Steps          | 1. 切换到日历 Tab 2. 断言今日日期格子内可见训练类型标签文本              |
| Expected       | 今日格子显示训练类型标签（如「推日」），点击该格子导航至 /workout        |

### TC-UI-005: 切换计划后日历重新排期

| Field          | Value                                                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-005                                                                                                             |
| Source         | US-1 AC-5                                                                                                             |
| Type           | UI                                                                                                                    |
| Route          | /plan/create -> /calendar                                                                                             |
| Target         | 计划创建页 + 日历页                                                                                                   |
| Element        | `data-testid="save-plan-btn"`, `data-testid="activate-plan-btn"`, `data-testid="calendar-month-view"`                 |
| Priority       | P1                                                                                                                    |
| Pre-conditions | 用户已有正在执行的计划 A                                                                                              |
| Steps          | 1. 导航至 /plan/create 创建新计划 B 2. 填写计划内容并点击「保存计划」 3. 在计划列表点击「激活」按钮 4. 切换到日历 Tab |
| Expected       | 日历清除计划 A 的排期标记，显示按计划 B 重新排列的训练日                                                              |

### TC-UI-006: 无休息日计划保存提示

| Field          | Value                                                                   |
| -------------- | ----------------------------------------------------------------------- |
| Test ID        | TC-UI-006                                                               |
| Source         | US-1 AC-6                                                               |
| Type           | UI                                                                      |
| Route          | /plan/create                                                            |
| Target         | 计划创建表单                                                            |
| Element        | `data-testid="save-plan-btn"`, `data-testid="rest-day-warning"`         |
| Priority       | P2                                                                      |
| Pre-conditions | 用户在计划创建/编辑页面                                                 |
| Steps          | 1. 为每天（周一至周日）添加训练日，不设置休息日 2. 点击「保存计划」按钮 |
| Expected       | 弹出提示条「建议安排休息日」，用户点击确认后仍可保存成功                |

### TC-UI-007: 训练执行页面显示建议重量和目标组数

| Field          | Value                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-007                                                                                                      |
| Source         | US-2 AC-1                                                                                                      |
| Type           | UI                                                                                                             |
| Route          | /workout                                                                                                       |
| Target         | 训练执行页动作卡片                                                                                             |
| Element        | `data-testid="exercise-card-{exerciseId}"`, `data-testid="suggested-weight"`, `data-testid="target-sets-reps"` |
| Priority       | P0                                                                                                             |
| Pre-conditions | 用户在训练执行页面，动作有历史训练记录                                                                         |
| Steps          | 1. 在训练执行页点击一个动作卡片展开区域                                                                        |
| Expected       | 卡片展开后显示建议重量输入框（预填充值如 80kg）和目标组数 x 次数文本（如 4x8）                                 |

### TC-UI-008: 完成本组后自动启动倒计时

| Field          | Value                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-008                                                                                |
| Source         | US-2 AC-2                                                                                |
| Type           | UI                                                                                       |
| Route          | /workout                                                                                 |
| Target         | 训练执行页组操作区                                                                       |
| Element        | `data-testid="reps-input"`, `data-testid="complete-set-btn"`, `data-testid="rest-timer"` |
| Priority       | P0                                                                                       |
| Pre-conditions | 用户在训练执行页面，正在进行某组训练                                                     |
| Steps          | 1. 在次数输入框输入实际完成次数 2. 点击「完成本组」按钮                                  |
| Expected       | 数据保存成功，组间倒计时自动启动并显示 03:00（180 秒），倒计时数字每秒递减               |

### TC-UI-009: 倒计时到时振动和提示音

| Field          | Value                                                                |
| -------------- | -------------------------------------------------------------------- |
| Test ID        | TC-UI-009                                                            |
| Source         | US-2 AC-3                                                            |
| Type           | UI                                                                   |
| Route          | /workout                                                             |
| Target         | 倒计时组件                                                           |
| Element        | `data-testid="rest-timer"`                                           |
| Priority       | P0                                                                   |
| Pre-conditions | 组间倒计时进行中                                                     |
| Steps          | 1. 等待倒计时从 00:03 归零至 00:00                                   |
| Expected       | 设备振动 1 次（200ms），播放系统提示音 1 声，倒计时显示 00:00 并闪烁 |

### TC-UI-010: 倒计时中跳过

| Field          | Value                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------ |
| Test ID        | TC-UI-010                                                                                  |
| Source         | US-2 AC-4                                                                                  |
| Type           | UI                                                                                         |
| Route          | /workout                                                                                   |
| Target         | 倒计时跳过按钮                                                                             |
| Element        | `data-testid="skip-rest-btn"`, `data-testid="rest-timer"`, `data-testid="next-set-prompt"` |
| Priority       | P1                                                                                         |
| Pre-conditions | 组间倒计时进行中                                                                           |
| Steps          | 1. 点击「跳过休息」按钮                                                                    |
| Expected       | 倒计时立即停止并隐藏，显示下一组记录输入区                                                 |

### TC-UI-011: 修改建议重量后标记为自定义

| Field          | Value                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-011                                                                                               |
| Source         | US-2 AC-5                                                                                               |
| Type           | UI                                                                                                      |
| Route          | /workout                                                                                                |
| Target         | 训练执行页重量输入框                                                                                    |
| Element        | `data-testid="suggested-weight"`, `data-testid="complete-set-btn"`, `data-testid="custom-weight-badge"` |
| Priority       | P1                                                                                                      |
| Pre-conditions | 用户在训练执行页面，建议重量已预填充                                                                    |
| Steps          | 1. 清空建议重量输入框，输入新的重量值 2. 在次数输入框输入完成次数 3. 点击「完成本组」按钮               |
| Expected       | 该组记录旁显示「自定义」标签，系统记录用户使用了自定义重量而非建议值                                    |

### TC-UI-012: 每组记录操作次数不超过 2 次

| Field          | Value                                                                     |
| -------------- | ------------------------------------------------------------------------- |
| Test ID        | TC-UI-012                                                                 |
| Source         | US-2 AC-6                                                                 |
| Type           | UI                                                                        |
| Route          | /workout                                                                  |
| Target         | 训练执行页组操作区                                                        |
| Element        | `data-testid="suggested-weight"`, `data-testid="complete-set-btn"`        |
| Priority       | P0                                                                        |
| Pre-conditions | 用户在训练执行页面，建议重量正确无需修改                                  |
| Steps          | 1. 确认建议重量输入框预填充值正确（0 次额外操作） 2. 点击「完成本组」按钮 |
| Expected       | 总操作次数 <= 2 次点击完成一组记录（步骤 2 的 1 次点击）                  |

### TC-UI-013: 额外组记录

| Field          | Value                                                           |
| -------------- | --------------------------------------------------------------- |
| Test ID        | TC-UI-013                                                       |
| Source         | US-2 AC-7                                                       |
| Type           | UI                                                              |
| Route          | /workout                                                        |
| Target         | 额外组按钮                                                      |
| Element        | `data-testid="add-extra-set-btn"`, `data-testid="set-list"`     |
| Priority       | P1                                                              |
| Pre-conditions | 用户已完成某动作的所有目标组数                                  |
| Steps          | 1. 点击「加一组」按钮                                           |
| Expected       | 组列表新增第 N+1 组输入行，输入框为空，额外组标记不影响加重判断 |

### TC-UI-014: 中途退出训练数据保留

| Field          | Value                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-014                                                                                             |
| Source         | US-2 AC-8                                                                                             |
| Type           | UI                                                                                                    |
| Route          | /workout                                                                                              |
| Target         | 训练退出确认对话框                                                                                    |
| Element        | `data-testid="back-btn"`, `data-testid="exit-confirm-dialog"`, `data-testid="confirm-exit-btn"`       |
| Priority       | P0                                                                                                    |
| Pre-conditions | 用户在训练执行页面，已完成 2 组动作                                                                   |
| Steps          | 1. 点击顶部导航栏「返回」按钮 2. 等待确认对话框弹出 3. 点击「确认退出」按钮                           |
| Expected       | 对话框关闭，页面导航至 /calendar；已完成 2 组数据保留在数据库中，未完成的动作状态字段标记为「未完成」 |

### TC-UI-015: 后台返回恢复训练状态

| Field          | Value                                                                        |
| -------------- | ---------------------------------------------------------------------------- |
| Test ID        | TC-UI-015                                                                    |
| Source         | US-2 AC-9                                                                    |
| Type           | UI                                                                           |
| Route          | /workout                                                                     |
| Target         | 训练执行页倒计时组件                                                         |
| Element        | `data-testid="rest-timer"`, `data-testid="current-set-display"`              |
| Priority       | P0                                                                           |
| Pre-conditions | 用户在训练执行页面，倒计时运行中（剩余 90 秒）                               |
| Steps          | 1. 模拟来电中断使 App 进入后台 2. 等待 30 秒模拟通话 3. 通过最近任务切回 App |
| Expected       | 训练页面恢复显示，当前组显示正确，倒计时继续从剩余时间递减（约 60 秒）       |

### TC-UI-016: 查看进步曲线折线图

| Field          | Value                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-016                                                                                       |
| Source         | US-4 AC-1                                                                                       |
| Type           | UI                                                                                              |
| Route          | /history                                                                                        |
| Target         | 进步曲线面板                                                                                    |
| Element        | `data-testid="progress-tab"`, `data-testid="exercise-selector"`, `data-testid="progress-chart"` |
| Priority       | P0                                                                                              |
| Pre-conditions | 用户有 >= 2 次深蹲训练记录                                                                      |
| Steps          | 1. 切换到历史 Tab 2. 点击「进步」面板标签 3. 在动作选择下拉菜单点击并选择「深蹲」               |
| Expected       | 折线图渲染完成，X 轴标签为日期，Y 轴标签为重量 (kg)，数据点数量 = 深蹲训练次数                  |

### TC-UI-017: PR 提醒显示

| Field          | Value                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Test ID        | TC-UI-017                                                                                                                            |
| Source         | US-4 AC-2                                                                                                                            |
| Type           | UI                                                                                                                                   |
| Route          | /workout -> /feeling                                                                                                                 |
| Target         | PR 提醒弹窗                                                                                                                          |
| Element        | `data-testid="save-workout-btn"`, `data-testid="pr-notification"`, `data-testid="pr-exercise-name"`, `data-testid="pr-weight-value"` |
| Priority       | P0                                                                                                                                   |
| Pre-conditions | 用户刚打破深蹲历史最高重量                                                                                                           |
| Steps          | 1. 点击「保存训练」按钮                                                                                                              |
| Expected       | 弹出 PR 提醒卡片，标题文本为「新个人记录！」，下方显示动作名称「深蹲」和重量值「140kg」                                              |

### TC-UI-018: 按训练类型筛选历史

| Field          | Value                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-018                                                                                         |
| Source         | US-4 AC-3                                                                                         |
| Type           | UI                                                                                                |
| Route          | /history                                                                                          |
| Target         | 历史列表筛选器                                                                                    |
| Element        | `data-testid="history-list"`, `data-testid="type-filter-btn"`, `data-testid="filter-option-push"` |
| Priority       | P1                                                                                                |
| Pre-conditions | 用户有不同类型的训练记录                                                                          |
| Steps          | 1. 切换到历史 Tab 2. 点击「类型筛选」按钮展开选项 3. 点击「推日」选项                             |
| Expected       | 列表仅显示推日训练记录，每条记录的训练类型标签文本为「推日」                                      |

### TC-UI-019: 月度容量趋势柱状图

| Field          | Value                                                             |
| -------------- | ----------------------------------------------------------------- |
| Test ID        | TC-UI-019                                                         |
| Source         | US-4 AC-4                                                         |
| Type           | UI                                                                |
| Route          | /history                                                          |
| Target         | 容量面板                                                          |
| Element        | `data-testid="volume-tab"`, `data-testid="volume-chart"`          |
| Priority       | P1                                                                |
| Pre-conditions | 用户有当月训练记录                                                |
| Steps          | 1. 切换到历史 Tab 2. 点击「容量」面板标签                         |
| Expected       | 柱状图渲染完成，每根柱代表一次训练，X 轴为日期，Y 轴为总容量 (kg) |

### TC-UI-020: 单动作进步曲线

| Field          | Value                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-020                                                                                       |
| Source         | US-4 AC-5                                                                                       |
| Type           | UI                                                                                              |
| Route          | /history                                                                                        |
| Target         | 进步曲线面板                                                                                    |
| Element        | `data-testid="progress-tab"`, `data-testid="exercise-selector"`, `data-testid="progress-chart"` |
| Priority       | P2                                                                                              |
| Pre-conditions | 只有一个训练动作有历史数据                                                                      |
| Steps          | 1. 切换到历史 Tab 2. 点击「进步」面板标签 3. 在动作选择器中选择有数据的动作                     |
| Expected       | 折线图正常显示该动作的曲线；无数据动作在选择器中显示为禁用（灰色）状态                          |

### TC-UI-021: 删除含 PR 记录后 PR 回退

| Field          | Value                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-021                                                                                           |
| Source         | US-4 AC-6                                                                                           |
| Type           | UI                                                                                                  |
| Route          | /history                                                                                            |
| Target         | 训练记录详情 + PR 列表                                                                              |
| Element        | `data-testid="delete-record-btn"`, `data-testid="confirm-delete-btn"`, `data-testid="pr-list"`      |
| Priority       | P0                                                                                                  |
| Pre-conditions | 用户有包含 PR 的训练记录                                                                            |
| Steps          | 1. 点击某条含 PR 的训练记录 2. 点击「删除」按钮 3. 点击确认弹窗中的「确认删除」 4. 导航至 PR 列表页 |
| Expected       | PR 列表中该动作的最高纪录回退到上一次历史最高值（如 140kg -> 135kg）                                |

### TC-UI-022: 进步曲线缩放和滑动

| Field          | Value                                                                                  |
| -------------- | -------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-022                                                                              |
| Source         | US-4 AC-7                                                                              |
| Type           | UI                                                                                     |
| Route          | /history                                                                               |
| Target         | 进步曲线图表区域                                                                       |
| Element        | `data-testid="progress-chart"`, `data-testid="chart-container"`                        |
| Priority       | P2                                                                                     |
| Pre-conditions | 用户有超过 6 个月的训练数据                                                            |
| Steps          | 1. 在进步曲线图区域执行双指捏合手势缩小视图 2. 单指左右滑动图表区域                    |
| Expected       | 捏合后图表缩放比例变化（数据点间距缩小），滑动后图表水平偏移，显示不同日期区间的数据点 |

### TC-UI-023: 感受记录页面显示

| Field          | Value                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-023                                                                                               |
| Source         | US-5 AC-1                                                                                               |
| Type           | UI                                                                                                      |
| Route          | /feeling                                                                                                |
| Target         | 感受记录页表单                                                                                          |
| Element        | `data-testid="fatigue-slider"`, `data-testid="satisfaction-slider"`, `data-testid="exercise-note-{id}"` |
| Priority       | P0                                                                                                      |
| Pre-conditions | 用户完成所有训练动作                                                                                    |
| Steps          | 1. 完成最后一个动作后自动导航至 /feeling 2. 断言页面可见疲劳度滑块、满意度滑块和各动作备注文本框        |
| Expected       | 疲劳度滑块范围 1-10（默认值 5），满意度滑块范围 1-10（默认值 5），每个已完成动作各有一个文本备注框      |

### TC-UI-024: 高疲劳低满意训练标记

| Field          | Value                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-024                                                                                             |
| Source         | US-5 AC-2                                                                                             |
| Type           | UI                                                                                                    |
| Route          | /feeling                                                                                              |
| Target         | 感受记录滑块 + 保存按钮                                                                               |
| Element        | `data-testid="fatigue-slider"`, `data-testid="satisfaction-slider"`, `data-testid="save-feeling-btn"` |
| Priority       | P1                                                                                                    |
| Pre-conditions | 用户在感受记录页面                                                                                    |
| Steps          | 1. 拖动疲劳度滑块至值 8 或以上 2. 拖动满意度滑块至值 4 或以下 3. 点击「保存」按钮                     |
| Expected       | 保存成功，该训练记录在历史列表中被标记为「高疲劳低满意」，下次训练页面显示降低强度提示                |

### TC-UI-025: 感受默认值保存

| Field          | Value                                                       |
| -------------- | ----------------------------------------------------------- |
| Test ID        | TC-UI-025                                                   |
| Source         | US-5 AC-3                                                   |
| Type           | UI                                                          |
| Route          | /feeling                                                    |
| Target         | 感受记录保存按钮                                            |
| Element        | `data-testid="save-feeling-btn"`                            |
| Priority       | P1                                                          |
| Pre-conditions | 用户在感受记录页面                                          |
| Steps          | 1. 不修改任何滑块或文本框，直接点击「保存」按钮             |
| Expected       | 保存成功，数据库记录疲劳度 = 5，满意度 = 5，文本备注 = null |

### TC-UI-026: 跳过动作后感受只显示已完成动作

| Field          | Value                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-026                                                                                 |
| Source         | US-5 AC-4                                                                                 |
| Type           | UI                                                                                        |
| Route          | /feeling                                                                                  |
| Target         | 感受记录页动作列表                                                                        |
| Element        | `data-testid="exercise-note-list"`, `data-testid="exercise-note-{id}"`                    |
| Priority       | P1                                                                                        |
| Pre-conditions | 用户在训练中跳过了某些动作                                                                |
| Steps          | 1. 完成训练（有 2 个动作已完成，1 个被跳过）后自动进入 /feeling 2. 断言感受页动作备注列表 |
| Expected       | 页面显示 2 个已完成动作的备注文本框，被跳过的动作不出现在列表中                           |

### TC-UI-027: 编辑历史训练感受

| Field          | Value                                                                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-027                                                                                                                               |
| Source         | US-5 AC-5                                                                                                                               |
| Type           | UI                                                                                                                                      |
| Route          | /history -> /feeling                                                                                                                    |
| Target         | 历史记录详情 + 感受编辑表单                                                                                                             |
| Element        | `data-testid="history-record-{id}"`, `data-testid="edit-feeling-btn"`, `data-testid="fatigue-slider"`, `data-testid="save-feeling-btn"` |
| Priority       | P1                                                                                                                                      |
| Pre-conditions | 用户有历史训练记录含感受数据                                                                                                            |
| Steps          | 1. 在历史列表点击一条训练记录 2. 点击「编辑感受」按钮 3. 拖动疲劳度滑块修改评分 4. 在备注框输入新文本 5. 点击「保存」                   |
| Expected       | 保存成功提示，历史记录中感受评分和备注文本已更新为新值                                                                                  |

### TC-UI-028: 日历训练类型标签显示

| Field          | Value                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-028                                                                                                 |
| Source         | US-6 AC-1                                                                                                 |
| Type           | UI                                                                                                        |
| Route          | /calendar                                                                                                 |
| Target         | 日历月视图训练日格子                                                                                      |
| Element        | `data-testid="calendar-month-view"`, `data-testid="day-cell-{date}"`, `data-testid="training-type-label"` |
| Priority       | P0                                                                                                        |
| Pre-conditions | 训练计划已排期                                                                                            |
| Steps          | 1. 切换到日历 Tab 2. 断言日历月视图渲染完成，遍历所有训练日格子                                           |
| Expected       | 每个训练日格子在日期数字下方显示对应训练类型标签（文本为「推」/「拉」/「蹲」）                            |

### TC-UI-029: 日历拖动调整训练日

| Field          | Value                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-029                                                                                       |
| Source         | US-6 AC-2                                                                                       |
| Type           | UI                                                                                              |
| Route          | /calendar                                                                                       |
| Target         | 日历训练日格子                                                                                  |
| Element        | `data-testid="day-cell-wed"`, `data-testid="day-cell-thu"`, `data-testid="training-type-label"` |
| Priority       | P1                                                                                              |
| Pre-conditions | 训练计划已排期，周三为拉日                                                                      |
| Steps          | 1. 长按周三格子直到出现拖拽手柄 2. 拖动周三格子至周四位置并释放                                 |
| Expected       | 周三格子变为空白（休息日），周四格子显示「拉日」标签，周五及之后的排期自动顺延                  |

### TC-UI-030: 点击已完成训练日显示详情

| Field          | Value                                                                 |
| -------------- | --------------------------------------------------------------------- |
| Test ID        | TC-UI-030                                                             |
| Source         | US-6 AC-3                                                             |
| Type           | UI                                                                    |
| Route          | /calendar -> /history/{workoutId}                                     |
| Target         | 已完成训练日格子                                                      |
| Element        | `data-testid="day-cell-{date}"`, `data-testid="workout-detail-panel"` |
| Priority       | P0                                                                    |
| Pre-conditions | 用户有已完成的训练日                                                  |
| Steps          | 1. 点击一个含已完成标记的日历格子（绿色圆点标记）                     |
| Expected       | 弹出训练详情面板，包含动作名称、重量、容量数值和感受评分              |

### TC-UI-031: 点击未来训练日显示预览

| Field          | Value                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-031                                                                                                 |
| Source         | US-6 AC-4                                                                                                 |
| Type           | UI                                                                                                        |
| Route          | /calendar                                                                                                 |
| Target         | 未来训练日格子                                                                                            |
| Element        | `data-testid="day-cell-{date}"`, `data-testid="workout-preview-panel"`, `data-testid="start-workout-btn"` |
| Priority       | P0                                                                                                        |
| Pre-conditions | 有未来的训练日安排                                                                                        |
| Steps          | 1. 点击一个未来日期的训练日格子                                                                           |
| Expected       | 弹出训练预览面板，列出计划动作，底部显示可点击的「开始训练」按钮                                          |

### TC-UI-032: 跳过训练日

| Field          | Value                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------ |
| Test ID        | TC-UI-032                                                                                  |
| Source         | US-6 AC-5                                                                                  |
| Type           | UI                                                                                         |
| Route          | /calendar                                                                                  |
| Target         | 今日训练日格子 + 上下文菜单                                                                |
| Element        | `data-testid="day-cell-today"`, `data-testid="context-menu"`, `data-testid="skip-day-btn"` |
| Priority       | P1                                                                                         |
| Pre-conditions | 今天是训练日                                                                               |
| Steps          | 1. 长按今日格子直到上下文菜单弹出 2. 点击「跳过」菜单项                                    |
| Expected       | 今日格子变为「已跳过」标记（灰色斜线），训练日内容顺延到下一个可用日期                     |

### TC-UI-033: 连续跳过 3 次训练提示

| Field          | Value                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-033                                                                                         |
| Source         | US-6 AC-6                                                                                         |
| Type           | UI                                                                                                |
| Route          | /calendar                                                                                         |
| Target         | 训练日提示弹窗                                                                                    |
| Element        | `data-testid="day-cell-today"`, `data-testid="skip-streak-warning"`                               |
| Priority       | P2                                                                                                |
| Pre-conditions | 用户已连续跳过 3 个训练日                                                                         |
| Steps          | 1. App 打开时第 4 个训练日到来，触发页面加载                                                      |
| Expected       | 弹出提示对话框，文本为「已连续跳过 3 次训练，是否需要调整计划？」，提供「调整」和「继续」两个按钮 |

### TC-UI-034: 取消跳过训练日

| Field          | Value                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-034                                                                                    |
| Source         | US-6 AC-7                                                                                    |
| Type           | UI                                                                                           |
| Route          | /calendar                                                                                    |
| Target         | 已跳过的训练日格子                                                                           |
| Element        | `data-testid="day-cell-{date}"`, `data-testid="context-menu"`, `data-testid="undo-skip-btn"` |
| Priority       | P2                                                                                           |
| Pre-conditions | 用户有已跳过的训练日                                                                         |
| Steps          | 1. 点击已跳过的训练日格子 2. 在弹出菜单中点击「取消跳过」                                    |
| Expected       | 格子恢复原排期训练类型标签，后续排期恢复                                                     |

### TC-UI-035: 其他运动类型选择

| Field          | Value                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-035                                                                                             |
| Source         | US-7 AC-1                                                                                             |
| Type           | UI                                                                                                    |
| Route          | /calendar -> /other-sport                                                                             |
| Target         | 日历休息日格子 + 其他运动入口                                                                         |
| Element        | `data-testid="day-cell-{date}"`, `data-testid="log-other-sport-btn"`, `data-testid="sport-type-list"` |
| Priority       | P1                                                                                                    |
| Pre-conditions | 用户在日历上选择了一个休息日                                                                          |
| Steps          | 1. 点击一个休息日格子 2. 在弹出面板中点击「记录其他运动」按钮                                         |
| Expected       | 页面导航至 /other-sport，显示运动类型选择列表（游泳、跑步、骑行等）                                   |

### TC-UI-036: 其他运动指标录入

| Field          | Value                                                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-036                                                                                                                                         |
| Source         | US-7 AC-2                                                                                                                                         |
| Type           | UI                                                                                                                                                |
| Route          | /other-sport                                                                                                                                      |
| Target         | 其他运动录入表单                                                                                                                                  |
| Element        | `data-testid="sport-type-item-swim"`, `data-testid="metric-distance-input"`, `data-testid="metric-time-input"`, `data-testid="metric-laps-input"` |
| Priority       | P1                                                                                                                                                |
| Pre-conditions | 用户选择了游泳运动类型                                                                                                                            |
| Steps          | 1. 在运动类型列表中点击「游泳」                                                                                                                   |
| Expected       | 表单渲染出距离输入框、时间输入框、趟数输入框，每个输入框的 placeholder 文本分别为「距离 (m)」「时间 (min)」「趟数」                               |

### TC-UI-037: 自定义运动类型

| Field          | Value                                                                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-037                                                                                                                                     |
| Source         | US-7 AC-3                                                                                                                                     |
| Type           | UI                                                                                                                                            |
| Route          | /other-sport                                                                                                                                  |
| Target         | 自定义运动创建表单                                                                                                                            |
| Element        | `data-testid="custom-sport-btn"`, `data-testid="sport-name-input"`, `data-testid="metric-config-list"`, `data-testid="save-custom-sport-btn"` |
| Priority       | P1                                                                                                                                            |
| Pre-conditions | 用户想记录的运动类型不在预设列表中                                                                                                            |
| Steps          | 1. 点击「自定义运动」按钮 2. 在运动名称输入框输入「瑜伽」 3. 添加指标（时长） 4. 点击「保存」                                                 |
| Expected       | 保存成功提示，「瑜伽」出现在运动类型选择列表中                                                                                                |

### TC-UI-038: 其他运动保存后日历标签

| Field          | Value                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-038                                                                                         |
| Source         | US-7 AC-4                                                                                         |
| Type           | UI                                                                                                |
| Route          | /other-sport -> /calendar                                                                         |
| Target         | 其他运动保存按钮 + 日历格子                                                                       |
| Element        | `data-testid="save-sport-btn"`, `data-testid="day-cell-{date}"`, `data-testid="sport-type-label"` |
| Priority       | P1                                                                                                |
| Pre-conditions | 用户正在录入其他运动数据                                                                          |
| Steps          | 1. 填写距离和时间数值 2. 点击「保存」按钮 3. 自动导航至 /calendar                                 |
| Expected       | 保存成功提示，日历上该日格子显示运动类型标签（如「游泳」）                                        |

### TC-UI-039: 同一天力量训练和其他运动并存

| Field          | Value                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Test ID        | TC-UI-039                                                                                                                                  |
| Source         | US-7 AC-5                                                                                                                                  |
| Type           | UI                                                                                                                                         |
| Route          | /calendar -> /other-sport                                                                                                                  |
| Target         | 日历今日格子                                                                                                                               |
| Element        | `data-testid="day-cell-today"`, `data-testid="log-other-sport-btn"`, `data-testid="sport-type-label"`, `data-testid="training-type-label"` |
| Priority       | P1                                                                                                                                         |
| Pre-conditions | 用户今天已完成力量训练                                                                                                                     |
| Steps          | 1. 点击今日日历格子 2. 在详情面板点击「记录其他运动」 3. 选择游泳类型并填写数据 4. 点击「保存」                                            |
| Expected       | 保存成功后今日格子同时显示「推日」和「游泳」两个标签，各自独立可见                                                                         |

### TC-UI-040: 自定义运动类型复用

| Field          | Value                                                                      |
| -------------- | -------------------------------------------------------------------------- |
| Test ID        | TC-UI-040                                                                  |
| Source         | US-7 AC-6                                                                  |
| Type           | UI                                                                         |
| Route          | /other-sport                                                               |
| Target         | 运动类型选择列表                                                           |
| Element        | `data-testid="sport-type-item-hiking"`, `data-testid="metric-config-list"` |
| Priority       | P2                                                                         |
| Pre-conditions | 用户之前自定义了运动类型「登山」                                           |
| Steps          | 1. 在运动类型列表中点击「登山」                                            |
| Expected       | 录入表单自动加载之前的指标配置（海拔、时长），无需重新设置                 |

### TC-UI-041: 身体数据录入页面

| Field          | Value                                                                                                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-041                                                                                                                                                                   |
| Source         | US-8 AC-1                                                                                                                                                                   |
| Type           | UI                                                                                                                                                                          |
| Route          | /body-data                                                                                                                                                                  |
| Target         | 身体数据录入表单                                                                                                                                                            |
| Element        | `data-testid="date-picker"`, `data-testid="weight-input"`, `data-testid="chest-input"`, `data-testid="waist-input"`, `data-testid="arm-input"`, `data-testid="thigh-input"` |
| Priority       | P0                                                                                                                                                                          |
| Pre-conditions | 用户在首页或设置中点击「记录身体数据」导航至 /body-data                                                                                                                     |
| Steps          | 1. 导航至 /body-data 2. 断言页面可见日期选择器（默认值为今天）、体重输入框、胸围输入框、腰围输入框、臂围输入框、大腿围输入框                                                |
| Expected       | 6 个输入字段全部渲染，日期默认值为当天，其余输入框为空                                                                                                                      |

### TC-UI-042: 体重趋势折线图

| Field          | Value                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-042                                                                                            |
| Source         | US-8 AC-2                                                                                            |
| Type           | UI                                                                                                   |
| Route          | /body-data                                                                                           |
| Target         | 趋势图面板                                                                                           |
| Element        | `data-testid="trend-chart-btn"`, `data-testid="metric-selector"`, `data-testid="weight-trend-chart"` |
| Priority       | P1                                                                                                   |
| Pre-conditions | 用户有 >= 2 次体重记录                                                                               |
| Steps          | 1. 点击「趋势图」按钮 2. 在指标选择下拉菜单中选择「体重」                                            |
| Expected       | 折线图渲染完成，X 轴为日期，Y 轴为体重 (kg)，数据点数量 = 体重记录条数                               |

### TC-UI-043: 只填写体重保存

| Field          | Value                                                                 |
| -------------- | --------------------------------------------------------------------- |
| Test ID        | TC-UI-043                                                             |
| Source         | US-8 AC-3                                                             |
| Type           | UI                                                                    |
| Route          | /body-data                                                            |
| Target         | 身体数据保存按钮                                                      |
| Element        | `data-testid="weight-input"`, `data-testid="save-body-data-btn"`      |
| Priority       | P1                                                                    |
| Pre-conditions | 用户在身体数据录入页面                                                |
| Steps          | 1. 在体重输入框输入「75.5」 2. 保持围度输入框为空 3. 点击「保存」按钮 |
| Expected       | 保存成功，数据库仅记录 weight=75.5，其余围度字段为 null               |

### TC-UI-044: 录入历史日期身体数据

| Field          | Value                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-044                                                                                     |
| Source         | US-8 AC-4                                                                                     |
| Type           | UI                                                                                            |
| Route          | /body-data                                                                                    |
| Target         | 日期选择器 + 保存按钮                                                                         |
| Element        | `data-testid="date-picker"`, `data-testid="weight-input"`, `data-testid="save-body-data-btn"` |
| Priority       | P1                                                                                            |
| Pre-conditions | 用户在身体数据录入页面                                                                        |
| Steps          | 1. 点击日期选择器，选择 3 天前的日期 2. 在体重输入框输入数据 3. 点击「保存」按钮              |
| Expected       | 保存成功，该记录按日期排序插入到历史列表正确位置，趋势图按时间顺序显示                        |

### TC-UI-045: 编辑身体数据后趋势图更新

| Field          | Value                                                                                                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-045                                                                                                                                                               |
| Source         | US-8 AC-5                                                                                                                                                               |
| Type           | UI                                                                                                                                                                      |
| Route          | /body-data                                                                                                                                                              |
| Target         | 历史记录列表 + 编辑表单                                                                                                                                                 |
| Element        | `data-testid="body-record-{id}"`, `data-testid="edit-record-btn"`, `data-testid="weight-input"`, `data-testid="save-body-data-btn"`, `data-testid="weight-trend-chart"` |
| Priority       | P2                                                                                                                                                                      |
| Pre-conditions | 用户有历史身体数据记录                                                                                                                                                  |
| Steps          | 1. 在历史列表中点击一条记录 2. 点击「编辑」按钮 3. 修改体重输入框的值 4. 点击「保存」 5. 切换到趋势图                                                                   |
| Expected       | 趋势图中对应日期的数据点更新为修改后的值                                                                                                                                |

### TC-UI-046: 动作库分类列表

| Field          | Value                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| Test ID        | TC-UI-046                                                              |
| Source         | US-9 AC-1                                                              |
| Type           | UI                                                                     |
| Route          | /exercise-library                                                      |
| Target         | 动作库分类列表                                                         |
| Element        | `data-testid="exercise-library-list"`, `data-testid="category-{name}"` |
| Priority       | P0                                                                     |
| Pre-conditions | 用户打开动作库                                                         |
| Steps          | 1. 导航至 /exercise-library 2. 断言分类列表渲染完成                    |
| Expected       | 显示 7 个分类：核心力量举、上肢推、上肢拉、下肢、核心、肩部、自定义    |

### TC-UI-047: 动作默认加重增量

| Field          | Value                                                                |
| -------------- | -------------------------------------------------------------------- |
| Test ID        | TC-UI-047                                                            |
| Source         | US-9 AC-2                                                            |
| Type           | UI                                                                   |
| Route          | /exercise-library -> /plan/edit                                      |
| Target         | 动作选择 + 计划编辑器                                                |
| Element        | `data-testid="exercise-item-squat"`, `data-testid="add-to-plan-btn"` |
| Priority       | P0                                                                   |
| Pre-conditions | 用户在计划编辑中从动作库选择动作                                     |
| Steps          | 1. 在动作库中点击「深蹲」展开详情 2. 点击「添加到计划」按钮          |
| Expected       | 深蹲被添加到训练日，加重增量自动设为 5kg，休息时间自动设为 180 秒    |

### TC-UI-048: 自定义动作创建

| Field          | Value                                                                                                                                                                                                            |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-048                                                                                                                                                                                                        |
| Source         | US-9 AC-3                                                                                                                                                                                                        |
| Type           | UI                                                                                                                                                                                                               |
| Route          | /exercise-library                                                                                                                                                                                                |
| Target         | 自定义动作创建表单                                                                                                                                                                                               |
| Element        | `data-testid="custom-exercise-btn"`, `data-testid="exercise-name-input"`, `data-testid="category-selector"`, `data-testid="increment-input"`, `data-testid="rest-time-input"`, `data-testid="save-exercise-btn"` |
| Priority       | P1                                                                                                                                                                                                               |
| Pre-conditions | 用户打开动作库                                                                                                                                                                                                   |
| Steps          | 1. 点击「自定义动作」按钮 2. 在名称输入框输入「绳索夹胸」 3. 在分类选择器选择「上肢推」 4. 在加重增量输入框输入 2.5 5. 在休息时间输入框输入 120 6. 点击「保存」                                                  |
| Expected       | 保存成功提示，「绳索夹胸」出现在「上肢推」分类中                                                                                                                                                                 |

### TC-UI-049: 自定义动作出现在动作库

| Field          | Value                                                               |
| -------------- | ------------------------------------------------------------------- |
| Test ID        | TC-UI-049                                                           |
| Source         | US-9 AC-4                                                           |
| Type           | UI                                                                  |
| Route          | /exercise-library                                                   |
| Target         | 自定义分类列表                                                      |
| Element        | `data-testid="category-custom"`, `data-testid="exercise-item-{id}"` |
| Priority       | P1                                                                  |
| Pre-conditions | 用户之前创建了自定义动作                                            |
| Steps          | 1. 导航至 /exercise-library 2. 滚动至「自定义」分类并点击展开       |
| Expected       | 自定义动作出现在列表中，名称和配置信息与创建时一致                  |

### TC-UI-050: 修改内置动作加重增量

| Field          | Value                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Test ID        | TC-UI-050                                                                                                                                  |
| Source         | US-9 AC-5                                                                                                                                  |
| Type           | UI                                                                                                                                         |
| Route          | /exercise-library/{exerciseId}                                                                                                             |
| Target         | 动作详情编辑表单                                                                                                                           |
| Element        | `data-testid="exercise-item-squat"`, `data-testid="edit-exercise-btn"`, `data-testid="increment-input"`, `data-testid="save-exercise-btn"` |
| Priority       | P1                                                                                                                                         |
| Pre-conditions | 用户在动作详情页                                                                                                                           |
| Steps          | 1. 在动作库中点击「深蹲」进入详情 2. 点击「编辑」按钮 3. 在加重增量输入框清空并输入 2.5 4. 点击「保存」                                    |
| Expected       | 保存成功，深蹲加重增量显示为 2.5kg（覆盖默认的 5kg）                                                                                       |

### TC-UI-051: 删除使用中的自定义动作

| Field          | Value                                                                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-051                                                                                                                                          |
| Source         | US-9 AC-6                                                                                                                                          |
| Type           | UI                                                                                                                                                 |
| Route          | /exercise-library                                                                                                                                  |
| Target         | 自定义动作删除操作                                                                                                                                 |
| Element        | `data-testid="exercise-item-{id}"`, `data-testid="delete-exercise-btn"`, `data-testid="confirm-delete-dialog"`, `data-testid="confirm-delete-btn"` |
| Priority       | P1                                                                                                                                                 |
| Pre-conditions | 用户有自定义动作正在某训练计划中使用                                                                                                               |
| Steps          | 1. 在自定义分类中点击该动作的「删除」按钮 2. 等待确认对话框弹出 3. 断言对话框文本包含「该动作正在使用中」 4. 点击「确认删除」                      |
| Expected       | 确认对话框提示「该动作正在使用中，确认删除？」，确认后动作从库和计划中同时移除                                                                     |

### TC-UI-052: 查看动作详情摘要

| Field          | Value                                                                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-052                                                                                                                                                           |
| Source         | US-9 AC-7                                                                                                                                                           |
| Type           | UI                                                                                                                                                                  |
| Route          | /exercise-library/{exerciseId}                                                                                                                                      |
| Target         | 动作详情面板                                                                                                                                                        |
| Element        | `data-testid="exercise-item-{id}"`, `data-testid="exercise-detail-panel"`, `data-testid="recent-records"`, `data-testid="pr-value"`, `data-testid="total-sessions"` |
| Priority       | P1                                                                                                                                                                  |
| Pre-conditions | 用户在动作库页面                                                                                                                                                    |
| Steps          | 1. 在动作库列表中点击一个动作名称                                                                                                                                   |
| Expected       | 导航至动作详情页，显示最近 5 次训练记录列表、PR 重量值、总训练次数数值                                                                                              |

### TC-UI-053: 中途退出确认对话框

| Field          | Value                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-053                                                                                   |
| Source         | US-10 AC-1                                                                                  |
| Type           | UI                                                                                          |
| Route          | /workout                                                                                    |
| Target         | 训练退出确认对话框                                                                          |
| Element        | `data-testid="back-btn"`, `data-testid="exit-confirm-dialog"`, `data-testid="exit-message"` |
| Priority       | P0                                                                                          |
| Pre-conditions | 用户在训练执行页面，已完成 2/3 个动作                                                       |
| Steps          | 1. 点击顶部导航栏「返回」按钮                                                               |
| Expected       | 弹出确认对话框，文本为「已完成 2/3 动作，确定结束训练？」，提供「确认」和「取消」两个按钮   |

### TC-UI-054: 中途退出数据保存

| Field          | Value                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-054                                                                                |
| Source         | US-10 AC-2                                                                               |
| Type           | UI                                                                                       |
| Route          | /workout -> /calendar                                                                    |
| Target         | 退出确认按钮                                                                             |
| Element        | `data-testid="confirm-exit-btn"`                                                         |
| Priority       | P0                                                                                       |
| Pre-conditions | 用户确认中途退出训练                                                                     |
| Steps          | 1. 在确认对话框中点击「确认」按钮                                                        |
| Expected       | 页面导航至 /calendar，已完成的 2 个动作数据保存到数据库，第 3 个动作状态标记为「未完成」 |

### TC-UI-055: 部分完成训练日日历显示

| Field          | Value                                                                            |
| -------------- | -------------------------------------------------------------------------------- |
| Test ID        | TC-UI-055                                                                        |
| Source         | US-10 AC-3                                                                       |
| Type           | UI                                                                               |
| Route          | /calendar                                                                        |
| Target         | 部分完成训练日格子                                                               |
| Element        | `data-testid="day-cell-{date}"`, `data-testid="completion-status"`               |
| Priority       | P0                                                                               |
| Pre-conditions | 用户有中途退出的训练记录                                                         |
| Steps          | 1. 在日历页面滑动至含部分完成训练的日期 2. 点击该日格子                          |
| Expected       | 格子显示「已完成（部分）」状态标签，点击后详情面板显示 status: completed_partial |

### TC-UI-056: 后台计时器持续运行

| Field          | Value                                                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-056                                                                                                                  |
| Source         | US-11 AC-1                                                                                                                 |
| Type           | UI                                                                                                                         |
| Route          | /workout                                                                                                                   |
| Target         | 训练执行页倒计时组件                                                                                                       |
| Element        | `data-testid="rest-timer"`                                                                                                 |
| Priority       | P0                                                                                                                         |
| Pre-conditions | 组间倒计时进行中，剩余 90 秒                                                                                               |
| Steps          | 1. 通过 Home 键切至后台（模拟器使用 adb shell input keyevent 3） 2. 等待 30 秒 3. 通过最近任务切回 App 4. 读取倒计时显示值 |
| Expected       | 倒计时显示约 00:60（90s - 30s = 60s，允许 +-2s 误差），计时器仍在递减                                                      |

### TC-UI-057: 后台倒计时结束通知

| Field          | Value                                                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-057                                                                                                               |
| Source         | US-11 AC-2                                                                                                              |
| Type           | UI                                                                                                                      |
| Route          | /workout (后台)                                                                                                         |
| Target         | 系统通知栏                                                                                                              |
| Element        | `NotificationManager.getLastNotification({ channel: 'rest-timer' })`                                                    |
| Priority       | P0                                                                                                                      |
| Pre-conditions | 后台倒计时即将结束（剩余 3 秒）                                                                                         |
| Steps          | 1. 切至后台等待倒计时归零 2. 通过 `NotificationManager.getLastNotification({ channel: 'rest-timer' })` 读取最新通知内容 |
| Expected       | 通知对象 title 字段为「休息结束，开始下一组！」，notification.channel = 'rest-timer'                                    |

### TC-UI-058: 点击通知返回训练页

| Field          | Value                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Test ID        | TC-UI-058                                                                                                                                  |
| Source         | US-11 AC-3                                                                                                                                 |
| Type           | UI                                                                                                                                         |
| Route          | /workout                                                                                                                                   |
| Target         | 系统通知 + 训练页面                                                                                                                        |
| Element        | `NotificationManager.openNotification({ channel: 'rest-timer', action: 'tap' })`, `data-testid="next-set-btn"`, `data-testid="rest-timer"` |
| Priority       | P0                                                                                                                                         |
| Pre-conditions | 后台倒计时已结束，通知已发送                                                                                                               |
| Steps          | 1. 通过 `NotificationManager.openNotification({ channel: 'rest-timer', action: 'tap' })` 模拟点击系统通知栏中的「休息结束」通知            |
| Expected       | App 前台化并导航至 /workout，页面显示「开始下一组」按钮（`data-testid="next-set-btn"` 可见），倒计时显示 00:00                             |

### TC-UI-059: 锁屏倒计时提醒

| Field          | Value                                                                                                                             |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-059                                                                                                                         |
| Source         | US-11 AC-4                                                                                                                        |
| Type           | UI                                                                                                                                |
| Route          | /workout (锁屏)                                                                                                                   |
| Target         | 锁屏通知                                                                                                                          |
| Element        | `NotificationManager.getLockScreenNotification({ channel: 'rest-timer' })`                                                        |
| Priority       | P0                                                                                                                                |
| Pre-conditions | 用户锁屏且倒计时运行中                                                                                                            |
| Steps          | 1. 按电源键锁屏 2. 等待倒计时归零 3. 通过 `NotificationManager.getLockScreenNotification({ channel: 'rest-timer' })` 读取锁屏通知 |
| Expected       | 通知对象 body 字段为「休息结束，开始下一组！」，notification.category = 'timer_complete'                                          |

### TC-UI-060: 通话结束后超时提醒

| Field          | Value                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-060                                                                                                  |
| Source         | US-11 AC-5                                                                                                 |
| Type           | UI                                                                                                         |
| Route          | /workout                                                                                                   |
| Target         | 训练执行页超时提醒                                                                                         |
| Element        | `data-testid="overtime-message"`, `data-testid="next-set-btn"`                                             |
| Priority       | P1                                                                                                         |
| Pre-conditions | 倒计时运行中（剩余 60 秒），用户接到来电                                                                   |
| Steps          | 1. 模拟来电中断使 App 进入后台 2. 等待 300 秒模拟 5 分钟通话 3. 挂断电话返回 App                           |
| Expected       | 训练页面显示超时提示文本「休息时间已过，准备好了就开始下一组」，倒计时显示 00:00，「开始下一组」按钮可点击 |

### TC-UI-061: 强制关闭后恢复计时器

| Field          | Value                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------ |
| Test ID        | TC-UI-061                                                                                        |
| Source         | US-11 AC-6                                                                                       |
| Type           | UI                                                                                               |
| Route          | /workout                                                                                         |
| Target         | 训练恢复页面                                                                                     |
| Element        | `data-testid="rest-timer"`, `data-testid="overtime-message"`, `data-testid="resume-workout-btn"` |
| Priority       | P0                                                                                               |
| Pre-conditions | 倒计时运行中（剩余 60 秒），App 被强制关闭                                                       |
| Steps          | 1. 通过 adb shell am force-close 强制关闭 App 2. 等待 90 秒（超过剩余倒计时） 3. 重新启动 App    |
| Expected       | App 恢复至 /workout 页面，显示训练状态和超时提示「休息时间已过」，当前组和已完成组数据完整保留   |

### TC-UI-062: 编辑历史训练记录

| Field          | Value                                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-062                                                                                                                 |
| Source         | US-12 AC-1                                                                                                                |
| Type           | UI                                                                                                                        |
| Route          | /history/{workoutId}                                                                                                      |
| Target         | 训练详情页                                                                                                                |
| Element        | `data-testid="history-record-{id}"`, `data-testid="workout-detail"`, `data-testid="edit-btn"`, `data-testid="delete-btn"` |
| Priority       | P0                                                                                                                        |
| Pre-conditions | 用户有历史训练记录                                                                                                        |
| Steps          | 1. 在历史列表点击一条训练记录                                                                                             |
| Expected       | 导航至训练详情页，页面显示每组动作的重量和次数数据，底部可见「编辑」和「删除」按钮                                        |

### TC-UI-063: 编辑记录后加重建议重算

| Field          | Value                                                                                                                        |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-063                                                                                                                    |
| Source         | US-12 AC-2                                                                                                                   |
| Type           | UI                                                                                                                           |
| Route          | /history/{workoutId}/edit                                                                                                    |
| Target         | 训练编辑表单                                                                                                                 |
| Element        | `data-testid="edit-btn"`, `data-testid="weight-input-{setId}"`, `data-testid="reps-input-{setId}"`, `data-testid="save-btn"` |
| Priority       | P0                                                                                                                           |
| Pre-conditions | 用户在历史训练详情页                                                                                                         |
| Steps          | 1. 点击「编辑」按钮 2. 在第 1 组重量输入框修改数值 3. 点击「保存」按钮                                                       |
| Expected       | 保存成功提示，下次训练时该动作的加重建议基于修改后的数值重新计算                                                             |

### TC-UI-064: 删除训练记录

| Field          | Value                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-064                                                                                             |
| Source         | US-12 AC-3                                                                                            |
| Type           | UI                                                                                                    |
| Route          | /history/{workoutId}                                                                                  |
| Target         | 训练删除操作                                                                                          |
| Element        | `data-testid="delete-btn"`, `data-testid="confirm-delete-dialog"`, `data-testid="confirm-delete-btn"` |
| Priority       | P0                                                                                                    |
| Pre-conditions | 用户在历史训练详情页                                                                                  |
| Steps          | 1. 点击「删除」按钮 2. 等待确认对话框弹出 3. 点击「确认删除」按钮                                     |
| Expected       | 对话框关闭，页面导航回 /history，该记录从列表中移除，加重建议回退到上一次训练的数据                   |

### TC-UI-065: 删除含 PR 记录后 PR 回退

| Field          | Value                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-065                                                                                                                       |
| Source         | US-12 AC-4                                                                                                                      |
| Type           | UI                                                                                                                              |
| Route          | /history/{workoutId}                                                                                                            |
| Target         | 训练删除 + PR 列表                                                                                                              |
| Element        | `data-testid="delete-btn"`, `data-testid="confirm-delete-btn"`, `data-testid="pr-list"`, `data-testid="pr-weight-{exerciseId}"` |
| Priority       | P0                                                                                                                              |
| Pre-conditions | 用户删除了包含 PR 的训练记录                                                                                                    |
| Steps          | 1. 点击「删除」按钮 2. 点击「确认删除」 3. 导航至 PR 列表页                                                                     |
| Expected       | PR 列表中该动作的重量值回退到上一次历史最高值（如 140kg -> 135kg）                                                              |

### TC-UI-066: 编辑感受后训练建议更新

| Field          | Value                                                                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-066                                                                                                                               |
| Source         | US-12 AC-5                                                                                                                              |
| Type           | UI                                                                                                                                      |
| Route          | /history/{workoutId}/feeling                                                                                                            |
| Target         | 感受编辑表单                                                                                                                            |
| Element        | `data-testid="edit-feeling-btn"`, `data-testid="fatigue-slider"`, `data-testid="satisfaction-slider"`, `data-testid="save-feeling-btn"` |
| Priority       | P1                                                                                                                                      |
| Pre-conditions | 用户编辑了历史训练的感受数据                                                                                                            |
| Steps          | 1. 拖动疲劳度滑块从 5 改为 9 2. 拖动满意度滑块从 5 改为 2 3. 点击「保存」按钮                                                           |
| Expected       | 保存成功，下次训练时页面显示「建议降低强度」提示（因疲劳度 >= 8 且满意度 <= 4）                                                         |

### TC-UI-067: 补录过去训练记录

| Field          | Value                                                                |
| -------------- | -------------------------------------------------------------------- |
| Test ID        | TC-UI-067                                                            |
| Source         | US-13 AC-1                                                           |
| Type           | UI                                                                   |
| Route          | /calendar -> /workout/retroactive                                    |
| Target         | 日历过去日期格子 + 补录入口                                          |
| Element        | `data-testid="day-cell-{date}"`, `data-testid="log-retroactive-btn"` |
| Priority       | P1                                                                   |
| Pre-conditions | 用户在日历页面，选择了过去无训练的日期                               |
| Steps          | 1. 点击一个过去无训练的日期格子 2. 在弹出面板点击「补录训练」按钮    |
| Expected       | 页面导航至 /workout/retroactive，显示训练类型和动作选择界面          |

### TC-UI-068: 补录训练无倒计时

| Field          | Value                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-068                                                                                      |
| Source         | US-13 AC-2                                                                                     |
| Type           | UI                                                                                             |
| Route          | /workout/retroactive                                                                           |
| Target         | 补录训练页面                                                                                   |
| Element        | `data-testid="retroactive-form"`, `data-testid="complete-set-btn"`, `data-testid="rest-timer"` |
| Priority       | P1                                                                                             |
| Pre-conditions | 用户在补录训练流程中                                                                           |
| Steps          | 1. 选择训练类型并点击开始 2. 为动作输入重量和次数 3. 点击「完成本组」按钮                      |
| Expected       | 数据保存成功，页面不显示倒计时组件（rest-timer 元素不存在于 DOM 中）                           |

### TC-UI-069: 补录记录参与加重建议

| Field          | Value                                                                     |
| -------------- | ------------------------------------------------------------------------- |
| Test ID        | TC-UI-069                                                                 |
| Source         | US-13 AC-3                                                                |
| Type           | UI                                                                        |
| Route          | /workout/retroactive -> /workout                                          |
| Target         | 补录保存 + 加重建议显示                                                   |
| Element        | `data-testid="save-workout-btn"`, `data-testid="suggested-weight"`        |
| Priority       | P0                                                                        |
| Pre-conditions | 用户完成补录训练                                                          |
| Steps          | 1. 填写所有动作数据 2. 点击「保存训练」按钮 3. 开始下次训练并查看建议重量 |
| Expected       | 保存成功，补录记录按其日期插入历史；下次训练的建议重量计算包含该补录记录  |

### TC-UI-070: 数据导出功能

| Field          | Value                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-070                                                                                                  |
| Source         | US-14 AC-1                                                                                                 |
| Type           | UI                                                                                                         |
| Route          | /settings                                                                                                  |
| Target         | 设置页导出按钮                                                                                             |
| Element        | `data-testid="export-data-btn"`, `data-testid="export-range-selector"`, `data-testid="export-confirm-btn"` |
| Priority       | P1                                                                                                         |
| Pre-conditions | 用户在设置页                                                                                               |
| Steps          | 1. 点击「导出数据」按钮 2. 在范围选择器选择「最近 3 个月」 3. 点击「确认导出」按钮                         |
| Expected       | 显示导出进度条，完成后提示「导出成功」，文件包含训练记录、身体数据、其他运动记录                           |

### TC-UI-071: 导出完成分享选项

| Field          | Value                                                                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-071                                                                                                                               |
| Source         | US-14 AC-2                                                                                                                              |
| Type           | UI                                                                                                                                      |
| Route          | /settings                                                                                                                               |
| Target         | 导出完成分享面板                                                                                                                        |
| Element        | `data-testid="export-success-panel"`, `data-testid="share-email-btn"`, `data-testid="share-cloud-btn"`, `data-testid="share-local-btn"` |
| Priority       | P1                                                                                                                                      |
| Pre-conditions | 数据导出文件已生成                                                                                                                      |
| Steps          | 1. 导出完成后断言分享面板可见                                                                                                           |
| Expected       | 分享面板显示 3 个选项按钮：「邮件」「云盘」「本地保存」，每个按钮可点击                                                                 |

### TC-UI-072: 导出数据结构化格式

| Field          | Value                                                                                                                                                                                                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-072                                                                                                                                                                                                                                                               |
| Source         | US-14 AC-3                                                                                                                                                                                                                                                              |
| Type           | UI                                                                                                                                                                                                                                                                      |
| Route          | /settings                                                                                                                                                                                                                                                               |
| Target         | 导出文件内容验证                                                                                                                                                                                                                                                        |
| Element        | N/A（文件内容断言，非 DOM 元素）                                                                                                                                                                                                                                        |
| Priority       | P1                                                                                                                                                                                                                                                                      |
| Pre-conditions | 用户已导出数据文件                                                                                                                                                                                                                                                      |
| Steps          | 1. 选择「本地保存」下载文件 2. 通过 `fs.readFile(exportedFilePath)` 读取导出文件内容 3. 解析 JSON 结构断言顶层字段包含 `workout_records`、`body_data`、`other_sports`；断言 `workout_records[0]` 包含 `date`、`exercise_name`、`sets`、`weight`、`reps`、`feeling` 字段 |
| Expected       | JSON 文件结构完整，`workout_records` 数组每条记录包含列头：日期、动作、组数、重量、次数、感受；数据完整无缺失，数值字段类型为 number                                                                                                                                    |

### TC-UI-073: 重量单位切换 kg 到 lbs

| Field          | Value                                                                               |
| -------------- | ----------------------------------------------------------------------------------- |
| Test ID        | TC-UI-073                                                                           |
| Source         | US-15 AC-1                                                                          |
| Type           | UI                                                                                  |
| Route          | /settings                                                                           |
| Target         | 设置页单位切换选项                                                                  |
| Element        | `data-testid="unit-selector"`, `data-testid="unit-option-lbs"`                      |
| Priority       | P0                                                                                  |
| Pre-conditions | 用户当前使用 kg 单位                                                                |
| Steps          | 1. 点击「单位选择器」展开选项 2. 点击「lbs」选项                                    |
| Expected       | 所有已记录的数据显示值自动转换（如 80kg -> 176.4lbs），使用转换系数 1kg = 2.2046lbs |

### TC-UI-074: lbs 单位下录入数据

| Field          | Value                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-074                                                                                   |
| Source         | US-15 AC-2                                                                                  |
| Type           | UI                                                                                          |
| Route          | /workout                                                                                    |
| Target         | 训练执行页重量输入框                                                                        |
| Element        | `data-testid="suggested-weight"`, `data-testid="complete-set-btn"`                          |
| Priority       | P0                                                                                          |
| Pre-conditions | 用户已切换为 lbs 单位                                                                       |
| Steps          | 1. 开始训练进入执行页 2. 确认建议重量输入框单位标签为 lbs 3. 输入实际重量并点击「完成本组」 |
| Expected       | 建议重量显示单位为 lbs，数据以原始录入单位存储，数据库 unit 字段 = "lbs"                    |

### TC-UI-075: lbs 加重增量选项

| Field          | Value                                                      |
| -------------- | ---------------------------------------------------------- |
| Test ID        | TC-UI-075                                                  |
| Source         | US-15 AC-3                                                 |
| Type           | UI                                                         |
| Route          | /settings -> /exercise-library/{exerciseId}                |
| Target         | 加重增量配置选项                                           |
| Element        | `data-testid="increment-options"`                          |
| Priority       | P1                                                         |
| Pre-conditions | 用户使用 lbs 单位                                          |
| Steps          | 1. 导航至动作详情页 2. 点击编辑 3. 查看加重增量下拉选项    |
| Expected       | 增量选项列表为 1 lbs、2.5 lbs、5 lbs、10 lbs（而非 kg 值） |

### TC-UI-076: lbs 加重建议取整

| Field          | Value                                                                         |
| -------------- | ----------------------------------------------------------------------------- |
| Test ID        | TC-UI-076                                                                     |
| Source         | US-15 AC-4                                                                    |
| Type           | UI                                                                            |
| Route          | /workout                                                                      |
| Target         | 加重建议显示值                                                                |
| Element        | `data-testid="suggested-weight"`                                              |
| Priority       | P1                                                                            |
| Pre-conditions | 用户使用 lbs 单位，有加重建议                                                 |
| Steps          | 1. 开始训练进入执行页 2. 读取建议重量输入框的预填充值                         |
| Expected       | 建议值以 lbs 为单位显示，数值取整到常见杠铃片组合（如 5 的倍数或 2.5 的倍数） |

### TC-UI-077: 训练中拖动调整动作顺序

| Field          | Value                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-077                                                                                 |
| Source         | US-16 AC-1                                                                                |
| Type           | UI                                                                                        |
| Route          | /workout                                                                                  |
| Target         | 动作卡片列表                                                                              |
| Element        | `data-testid="exercise-card-{id}"`, `data-testid="exercise-list"`                         |
| Priority       | P1                                                                                        |
| Pre-conditions | 用户在训练执行页面                                                                        |
| Steps          | 1. 长按第 3 个未开始的动作卡片直到卡片浮起（出现拖拽手柄） 2. 向上拖动至第 1 个位置并释放 |
| Expected       | 释放后动作卡片列表顺序更新：被拖动的动作出现在第 1 位，原 1-2 位顺移至 2-3 位             |

### TC-UI-078: 跳过动作

| Field          | Value                                                                 |
| -------------- | --------------------------------------------------------------------- |
| Test ID        | TC-UI-078                                                             |
| Source         | US-16 AC-2                                                            |
| Type           | UI                                                                    |
| Route          | /workout                                                              |
| Target         | 动作卡片滑动区域                                                      |
| Element        | `data-testid="exercise-card-{id}"`, `data-testid="skip-exercise-btn"` |
| Priority       | P1                                                                    |
| Pre-conditions | 用户在训练执行页面                                                    |
| Steps          | 1. 在未开始的动作卡片上执行向左滑动手势 2. 滑出后点击「跳过」按钮     |
| Expected       | 该动作卡片显示「已跳过」标签（灰色覆盖层），不显示组输入区域          |

### TC-UI-079: 跳过动作不参与加重

| Field          | Value                                                                             |
| -------------- | --------------------------------------------------------------------------------- |
| Test ID        | TC-UI-079                                                                         |
| Source         | US-16 AC-3                                                                        |
| Type           | UI                                                                                |
| Route          | /workout -> /history                                                              |
| Target         | 加重建议显示                                                                      |
| Element        | `data-testid="save-workout-btn"`, `data-testid="suggested-weight"`                |
| Priority       | P1                                                                                |
| Pre-conditions | 用户跳过了某动作并完成训练                                                        |
| Steps          | 1. 跳过卧推动作，完成其他动作 2. 点击「保存训练」 3. 开始下次训练查看卧推建议重量 |
| Expected       | 卧推的建议重量与跳过前的上次训练值相同，未因跳过而变化                            |

### TC-UI-080: 取消跳过动作

| Field          | Value                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-080                                                                                             |
| Source         | US-16 AC-4                                                                                            |
| Type           | UI                                                                                                    |
| Route          | /workout                                                                                              |
| Target         | 已跳过的动作卡片                                                                                      |
| Element        | `data-testid="exercise-card-{id}"`, `data-testid="undo-skip-btn"`, `data-testid="start-exercise-btn"` |
| Priority       | P2                                                                                                    |
| Pre-conditions | 用户已跳过某动作                                                                                      |
| Steps          | 1. 点击已跳过的动作卡片 2. 点击「取消跳过」按钮                                                       |
| Expected       | 「已跳过」标签消失，显示「开始记录」按钮，点击后可正常录入组数据                                      |

### TC-UI-081: 同一动作多次出现

| Field          | Value                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-081                                                                                           |
| Source         | US-17 AC-1                                                                                          |
| Type           | UI                                                                                                  |
| Route          | /plan/edit                                                                                          |
| Target         | 计划编辑动作列表                                                                                    |
| Element        | `data-testid="exercise-item-squat"`, `data-testid="add-to-plan-btn"`, `data-testid="exercise-list"` |
| Priority       | P1                                                                                                  |
| Pre-conditions | 用户在计划编辑页面                                                                                  |
| Steps          | 1. 从动作库点击「深蹲」添加到训练日 2. 再次从动作库点击「深蹲」添加到同一训练日                     |
| Expected       | 列表中出现两个「深蹲」条目，各自独立显示序号，加重建议独立计算                                      |

### TC-UI-082: 同一动作备注区分

| Field          | Value                                                                   |
| -------------- | ----------------------------------------------------------------------- |
| Test ID        | TC-UI-082                                                               |
| Source         | US-17 AC-2                                                              |
| Type           | UI                                                                      |
| Route          | /plan/edit                                                              |
| Target         | 动作备注输入框                                                          |
| Element        | `data-testid="exercise-note-input-{id}"`, `data-testid="exercise-list"` |
| Priority       | P1                                                                      |
| Pre-conditions | 用户在同一训练日添加了同一动作两次                                      |
| Steps          | 1. 点击第二个「深蹲」条目的备注输入框 2. 输入「暂停深蹲」               |
| Expected       | 训练执行页面显示为「深蹲 #1」和「深蹲 #2 - 暂停深蹲」，两条目可区分     |

### TC-UI-083: 同一动作独立加重建议

| Field          | Value                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-083                                                                                                |
| Source         | US-17 AC-3                                                                                               |
| Type           | UI                                                                                                       |
| Route          | /workout                                                                                                 |
| Target         | 两次同动作的建议重量                                                                                     |
| Element        | `data-testid="suggested-weight-{exerciseIndex}"`                                                         |
| Priority       | P1                                                                                                       |
| Pre-conditions | 同一动作在同一天出现两次                                                                                 |
| Steps          | 1. 展开两个「深蹲」卡片 2. 分别读取两个建议重量输入框的值                                                |
| Expected       | 两个建议重量值各自独立计算，互不影响（第一次基于上一次第 1 次出现数据，第二次基于上一次第 2 次出现数据） |

### TC-UI-084: 首次使用欢迎引导

| Field          | Value                                                                                                                        |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-084                                                                                                                    |
| Source         | US-18 AC-1                                                                                                                   |
| Type           | UI                                                                                                                           |
| Route          | /onboarding                                                                                                                  |
| Target         | 欢迎引导页面                                                                                                                 |
| Element        | `data-testid="onboarding-step-1"`, `data-testid="onboarding-next-btn"`, `data-testid="onboarding-skip-btn"`                  |
| Priority       | P0                                                                                                                           |
| Pre-conditions | 用户首次打开 App，无任何训练数据                                                                                             |
| Steps          | 1. 冷启动 App 2. 等待 /onboarding 页面加载 3. 断言第 1 步引导卡片可见 4. 点击「下一步」按钮 5. 重复点击「下一步」直到第 4 步 |
| Expected       | 引导共 4 步，每步显示核心概念（计划、训练、记录、进步），底部有「跳过」和「下一步」按钮                                      |

### TC-UI-085: 引导后模板推荐

| Field          | Value                                                                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-085                                                                                                                                           |
| Source         | US-18 AC-2                                                                                                                                          |
| Type           | UI                                                                                                                                                  |
| Route          | /onboarding -> /plan/create                                                                                                                         |
| Target         | 模板推荐列表                                                                                                                                        |
| Element        | `data-testid="onboarding-finish-btn"`, `data-testid="template-list"`, `data-testid="template-item-push-pull-legs"`, `data-testid="custom-plan-btn"` |
| Priority       | P0                                                                                                                                                  |
| Pre-conditions | 引导已完成                                                                                                                                          |
| Steps          | 1. 在引导最后一步点击「开始使用」按钮                                                                                                               |
| Expected       | 页面导航至 /plan/create，显示计划模板推荐列表（含「推/拉/蹲 3 日循环」模板卡片），底部有「自定义创建」按钮                                          |

### TC-UI-086: 模板动作预填充

| Field          | Value                                                                                                             |
| -------------- | ----------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-086                                                                                                         |
| Source         | US-18 AC-3                                                                                                        |
| Type           | UI                                                                                                                |
| Route          | /plan/create                                                                                                      |
| Target         | 模板动作配置表单                                                                                                  |
| Element        | `data-testid="template-item-push-pull-legs"`, `data-testid="exercise-list"`, `data-testid="increment-input-{id}"` |
| Priority       | P1                                                                                                                |
| Pre-conditions | 用户选择了模板创建计划                                                                                            |
| Steps          | 1. 点击「推/拉/蹲 3 日循环」模板卡片 2. 断言动作列表渲染完成                                                      |
| Expected       | 每个训练日预填充常见动作（如推日：卧推、肩推、三头下压），加重增量为默认值，用户只需修改起始重量                  |

### TC-UI-087: 设置中重新查看新手引导

| Field          | Value                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-087                                                                                         |
| Source         | US-18 AC-4                                                                                        |
| Type           | UI                                                                                                |
| Route          | /settings -> /onboarding                                                                          |
| Target         | 设置页新手引导入口                                                                                |
| Element        | `data-testid="settings-list"`, `data-testid="onboarding-link"`, `data-testid="onboarding-step-1"` |
| Priority       | P2                                                                                                |
| Pre-conditions | 用户之前跳过了引导                                                                                |
| Steps          | 1. 切换到设置 Tab 2. 在设置列表中滚动找到「新手引导」项 3. 点击「新手引导」                       |
| Expected       | 页面导航至 /onboarding，显示完整引导流程第 1 步                                                   |

### TC-UI-088: 统计概览 Hero 卡片

| Field          | Value                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-088                                                                                             |
| Source         | PRD 5.10 Step 2                                                                                       |
| Type           | UI                                                                                                    |
| Route          | /stats                                                                                                |
| Target         | 统计页 Hero 卡片                                                                                      |
| Element        | `data-testid="stats-hero-card"`, `data-testid="weekly-volume"`, `data-testid="week-over-week-change"` |
| Priority       | P0                                                                                                    |
| Pre-conditions | 用户有本周和上周的训练记录                                                                            |
| Steps          | 1. 切换到统计 Tab（Tab 4） 2. 断言 Hero 卡片渲染完成 3. 读取总容量数值和周环比百分比                  |
| Expected       | Hero 卡片显示本周训练总容量数值（如 12500 kg），周环比变化百分比（上升显示绿色、下降显示红色）        |

### TC-UI-089: 统计概览四宫格

| Field          | Value                                                                                                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-089                                                                                                                                                                  |
| Source         | PRD 5.10 Step 3                                                                                                                                                            |
| Type           | UI                                                                                                                                                                         |
| Route          | /stats                                                                                                                                                                     |
| Target         | 统计页四宫格卡片                                                                                                                                                           |
| Element        | `data-testid="stats-grid"`, `data-testid="weekly-session-count"`, `data-testid="monthly-session-count"`, `data-testid="weekly-duration"`, `data-testid="monthly-pr-count"` |
| Priority       | P0                                                                                                                                                                         |
| Pre-conditions | 用户有训练记录                                                                                                                                                             |
| Steps          | 1. 切换到统计 Tab 2. 断言四宫格卡片可见 3. 读取 4 个格子数值                                                                                                               |
| Expected       | 四宫格依次显示：本周训练次数（如 3/5）、本月训练次数（如 8 + 连续 3 周）、本周训练时长（如 180min）、本月新增 PR 数（如 2）                                                |

### TC-UI-090: 统计概览无数据状态

| Field          | Value                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| Test ID        | TC-UI-090                                                              |
| Source         | PRD 5.10 Step 1 (no_data status)                                       |
| Type           | UI                                                                     |
| Route          | /stats                                                                 |
| Target         | 统计页空状态提示                                                       |
| Element        | `data-testid="stats-empty-state"`, `data-testid="start-training-link"` |
| Priority       | P1                                                                     |
| Pre-conditions | 用户无任何训练记录                                                     |
| Steps          | 1. 切换到统计 Tab                                                      |
| Expected       | 显示空状态提示文本「完成你的第一次训练」，带可点击链接引导至训练页面   |

### TC-UI-091: 设置页列表显示

| Field          | Value                                                                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Test ID        | TC-UI-091                                                                                                                                                                                  |
| Source         | PRD 5.11 Step 1                                                                                                                                                                            |
| Type           | UI                                                                                                                                                                                         |
| Route          | /settings                                                                                                                                                                                  |
| Target         | 设置页分组列表                                                                                                                                                                             |
| Element        | `data-testid="settings-list"`, `data-testid="settings-group-training"`, `data-testid="settings-group-reminder"`, `data-testid="settings-group-data"`, `data-testid="settings-group-about"` |
| Priority       | P0                                                                                                                                                                                         |
| Pre-conditions | 用户进入设置页                                                                                                                                                                             |
| Steps          | 1. 切换到设置 Tab（Tab 5） 2. 断言设置列表渲染完成                                                                                                                                         |
| Expected       | 显示 App 名称和版本号 + 4 个分组：「训练设置」「提醒」「数据管理」「关于」                                                                                                                 |

### TC-UI-092: 清除数据二次确认

| Field          | Value                                                                                                       |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-092                                                                                                   |
| Source         | PRD 5.11 Step 10-11                                                                                         |
| Type           | UI                                                                                                          |
| Route          | /settings                                                                                                   |
| Target         | 清除数据确认面板                                                                                            |
| Element        | `data-testid="clear-data-btn"`, `data-testid="clear-data-warning-panel"`, `data-testid="confirm-clear-btn"` |
| Priority       | P0                                                                                                          |
| Pre-conditions | 用户在设置页                                                                                                |
| Steps          | 1. 在数据管理分组中点击「清除所有数据」按钮                                                                 |
| Expected       | 底部弹出警告面板，文本包含「此操作不可撤销」，需再次点击「确认清除」按钮才执行删除                          |

### TC-UI-093: 清除数据后验证数据实际删除

| Field          | Value                                                                                                                         |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-093                                                                                                                     |
| Source         | PRD 5.11 Step 11                                                                                                              |
| Type           | UI                                                                                                                            |
| Route          | /settings                                                                                                                     |
| Target         | 清除数据操作 + 日历/历史验证                                                                                                  |
| Element        | `data-testid="confirm-clear-btn"`, `data-testid="clear-success-toast"`                                                        |
| Priority       | P0                                                                                                                            |
| Pre-conditions | 用户有训练记录、身体数据和其他运动记录                                                                                        |
| Steps          | 1. 在数据管理分组中点击「清除所有数据」按钮 2. 点击「确认清除」按钮 3. 导航至日历页断言无训练标记 4. 导航至历史页断言列表为空 |
| Expected       | Toast 提示「数据已清除」；日历页所有训练日标记消失；历史页显示空状态；动作库和用户偏好设置保留                                |

### TC-UI-094: 数据导入流程

| Field          | Value                                                                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-094                                                                                                                                           |
| Source         | PRD 5.11.1 Step 1-3                                                                                                                                 |
| Type           | UI                                                                                                                                                  |
| Route          | /settings                                                                                                                                           |
| Target         | 导入数据操作                                                                                                                                        |
| Element        | `data-testid="import-data-btn"`, `data-testid="import-confirm-panel"`, `data-testid="file-picker-btn"`, `data-testid="import-success-toast"`        |
| Priority       | P0                                                                                                                                                  |
| Pre-conditions | 用户已导出过数据文件（JSON 格式）                                                                                                                   |
| Steps          | 1. 在数据管理分组中点击「导入训练数据」按钮 2. 断言底部弹出确认面板，文本包含数据合并规则说明 3. 点击「选择文件」按钮选择 JSON 文件 4. 等待导入完成 |
| Expected       | 导入完成 Toast 提示「导入成功」；相同 ID 记录被导入数据覆盖，新增记录添加到历史列表                                                                 |

### TC-UI-095: 目标组数边界值 — 最小值 1 组

| Field          | Value                                                               |
| -------------- | ------------------------------------------------------------------- |
| Test ID        | TC-UI-095                                                           |
| Source         | PRD 5.3 验证规则: 目标组数 1-10（下界 sets=1）                      |
| Type           | UI                                                                  |
| Route          | /plan/create                                                        |
| Target         | 训练计划目标组数输入框                                              |
| Element        | `data-testid="target-sets-input"`, `data-testid="validation-error"` |
| Priority       | P1                                                                  |
| Pre-conditions | 用户在计划创建页面编辑动作参数                                      |
| Steps          | 1. 在目标组数输入框输入 1 2. 点击「保存计划」按钮                   |
| Expected       | 保存成功，该动作目标组数记录为 1，训练执行页显示 1 组输入区域       |

### TC-UI-096: 目标组数边界值 — 最大值 10 组

| Field          | Value                                                               |
| -------------- | ------------------------------------------------------------------- |
| Test ID        | TC-UI-096                                                           |
| Source         | PRD 5.3 验证规则: 目标组数 1-10（上界 sets=10）                     |
| Type           | UI                                                                  |
| Route          | /plan/create                                                        |
| Target         | 训练计划目标组数输入框                                              |
| Element        | `data-testid="target-sets-input"`, `data-testid="validation-error"` |
| Priority       | P1                                                                  |
| Pre-conditions | 用户在计划创建页面编辑动作参数                                      |
| Steps          | 1. 在目标组数输入框输入 10 2. 点击「保存计划」按钮                  |
| Expected       | 保存成功，该动作目标组数记录为 10                                   |

### TC-UI-097: 目标组数超出范围 — 输入 0

| Field          | Value                                                                    |
| -------------- | ------------------------------------------------------------------------ |
| Test ID        | TC-UI-097                                                                |
| Source         | PRD 5.3 验证规则: 目标组数 1-10（无效 sets=0）                           |
| Type           | UI                                                                       |
| Route          | /plan/create                                                             |
| Target         | 训练计划目标组数输入框                                                   |
| Element        | `data-testid="target-sets-input"`, `data-testid="validation-error"`      |
| Priority       | P1                                                                       |
| Pre-conditions | 用户在计划创建页面编辑动作参数                                           |
| Steps          | 1. 在目标组数输入框输入 0 2. 点击「保存计划」按钮                        |
| Expected       | 输入框下方显示验证错误文本「组数不能小于 1」，保存按钮禁用或点击后不提交 |

### TC-UI-098: 目标组数超出范围 — 输入 11

| Field          | Value                                                                     |
| -------------- | ------------------------------------------------------------------------- |
| Test ID        | TC-UI-098                                                                 |
| Source         | PRD 5.3 验证规则: 目标组数 1-10（无效 sets=11）                           |
| Type           | UI                                                                        |
| Route          | /plan/create                                                              |
| Target         | 训练计划目标组数输入框                                                    |
| Element        | `data-testid="target-sets-input"`, `data-testid="validation-error"`       |
| Priority       | P1                                                                        |
| Pre-conditions | 用户在计划创建页面编辑动作参数                                            |
| Steps          | 1. 在目标组数输入框输入 11 2. 点击「保存计划」按钮                        |
| Expected       | 输入框下方显示验证错误文本「组数不能超过 10」，保存按钮禁用或点击后不提交 |

### TC-UI-099: 目标次数边界值 — 最小值 1 次

| Field          | Value                                                            |
| -------------- | ---------------------------------------------------------------- |
| Test ID        | TC-UI-099                                                        |
| Source         | PRD 5.3 验证规则: 目标次数 1-30（下界 reps=1）                   |
| Type           | UI                                                               |
| Route          | /plan/create                                                     |
| Target         | 训练计划目标次数输入框                                           |
| Element        | `data-testid="target-reps-input"`, `data-testid="save-plan-btn"` |
| Priority       | P1                                                               |
| Pre-conditions | 用户在计划创建页面编辑动作参数                                   |
| Steps          | 1. 在目标次数输入框输入 1 2. 点击「保存计划」按钮                |
| Expected       | 保存成功，该动作目标次数记录为 1                                 |

### TC-UI-100: 目标次数边界值 — 最大值 30 次

| Field          | Value                                                            |
| -------------- | ---------------------------------------------------------------- |
| Test ID        | TC-UI-100                                                        |
| Source         | PRD 5.3 验证规则: 目标次数 1-30（上界 reps=30）                  |
| Type           | UI                                                               |
| Route          | /plan/create                                                     |
| Target         | 训练计划目标次数输入框                                           |
| Element        | `data-testid="target-reps-input"`, `data-testid="save-plan-btn"` |
| Priority       | P1                                                               |
| Pre-conditions | 用户在计划创建页面编辑动作参数                                   |
| Steps          | 1. 在目标次数输入框输入 30 2. 点击「保存计划」按钮               |
| Expected       | 保存成功，该动作目标次数记录为 30                                |

### TC-UI-101: 目标次数超出范围 — 输入 0

| Field          | Value                                                                    |
| -------------- | ------------------------------------------------------------------------ |
| Test ID        | TC-UI-101                                                                |
| Source         | PRD 5.3 验证规则: 目标次数 1-30（无效 reps=0）                           |
| Type           | UI                                                                       |
| Route          | /plan/create                                                             |
| Target         | 训练计划目标次数输入框                                                   |
| Element        | `data-testid="target-reps-input"`, `data-testid="validation-error"`      |
| Priority       | P1                                                                       |
| Pre-conditions | 用户在计划创建页面编辑动作参数                                           |
| Steps          | 1. 在目标次数输入框输入 0 2. 点击「保存计划」按钮                        |
| Expected       | 输入框下方显示验证错误文本「次数不能小于 1」，保存按钮禁用或点击后不提交 |

### TC-UI-102: 休息时间边界值 — 最小值 30 秒

| Field          | Value                                                          |
| -------------- | -------------------------------------------------------------- |
| Test ID        | TC-UI-102                                                      |
| Source         | PRD 5.3 验证规则: 休息时间 30-600s（下界 rest=30）             |
| Type           | UI                                                             |
| Route          | /plan/create                                                   |
| Target         | 休息时间输入框                                                 |
| Element        | `data-testid="rest-time-input"`, `data-testid="save-plan-btn"` |
| Priority       | P1                                                             |
| Pre-conditions | 用户在计划创建页面编辑动作参数                                 |
| Steps          | 1. 在休息时间输入框输入 30 2. 点击「保存计划」按钮             |
| Expected       | 保存成功，该动作休息时间记录为 30 秒                           |

### TC-UI-103: 休息时间边界值 — 最大值 600 秒

| Field          | Value                                                          |
| -------------- | -------------------------------------------------------------- |
| Test ID        | TC-UI-103                                                      |
| Source         | PRD 5.3 验证规则: 休息时间 30-600s（上界 rest=600）            |
| Type           | UI                                                             |
| Route          | /plan/create                                                   |
| Target         | 休息时间输入框                                                 |
| Element        | `data-testid="rest-time-input"`, `data-testid="save-plan-btn"` |
| Priority       | P1                                                             |
| Pre-conditions | 用户在计划创建页面编辑动作参数                                 |
| Steps          | 1. 在休息时间输入框输入 600 2. 点击「保存计划」按钮            |
| Expected       | 保存成功，该动作休息时间记录为 600 秒                          |

### TC-UI-104: 休息时间超出范围 — 输入 29

| Field          | Value                                                                            |
| -------------- | -------------------------------------------------------------------------------- |
| Test ID        | TC-UI-104                                                                        |
| Source         | PRD 5.3 验证规则: 休息时间 30-600s（无效 rest=29）                               |
| Type           | UI                                                                               |
| Route          | /plan/create                                                                     |
| Target         | 休息时间输入框                                                                   |
| Element        | `data-testid="rest-time-input"`, `data-testid="validation-error"`                |
| Priority       | P1                                                                               |
| Pre-conditions | 用户在计划创建页面编辑动作参数                                                   |
| Steps          | 1. 在休息时间输入框输入 29 2. 点击「保存计划」按钮                               |
| Expected       | 输入框下方显示验证错误文本「休息时间不能少于 30 秒」，保存按钮禁用或点击后不提交 |

### TC-UI-105: 训练中输入负数重量

| Field          | Value                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-105                                                                                            |
| Source         | PRD 5.3 验证规则: 重量 > 0（无效 weight=-5）                                                         |
| Type           | UI                                                                                                   |
| Route          | /workout                                                                                             |
| Target         | 训练执行页重量输入框                                                                                 |
| Element        | `data-testid="suggested-weight"`, `data-testid="validation-error"`, `data-testid="complete-set-btn"` |
| Priority       | P1                                                                                                   |
| Pre-conditions | 用户在训练执行页面                                                                                   |
| Steps          | 1. 清空建议重量输入框 2. 输入 -5 3. 点击「完成本组」按钮                                             |
| Expected       | 输入框下方显示验证错误文本「重量不能为负数」，按钮禁用，数据不保存                                   |

### TC-UI-106: 训练中输入零次数

| Field          | Value                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-106                                                                                      |
| Source         | PRD 5.3 验证规则: 次数 1-30（无效 reps=0 训练中）                                              |
| Type           | UI                                                                                             |
| Route          | /workout                                                                                       |
| Target         | 训练执行页次数输入框                                                                           |
| Element        | `data-testid="reps-input"`, `data-testid="validation-error"`, `data-testid="complete-set-btn"` |
| Priority       | P1                                                                                             |
| Pre-conditions | 用户在训练执行页面                                                                             |
| Steps          | 1. 在次数输入框输入 0 2. 点击「完成本组」按钮                                                  |
| Expected       | 输入框下方显示验证错误文本「次数不能小于 1」，按钮禁用，数据不保存                             |

### TC-UI-107: 加重增量输入非正数

| Field          | Value                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-107                                                                                            |
| Source         | PRD 5.3 验证规则: 加重增量 > 0（无效 increment=0）                                                   |
| Type           | UI                                                                                                   |
| Route          | /exercise-library/{exerciseId}                                                                       |
| Target         | 动作详情加重增量输入框                                                                               |
| Element        | `data-testid="increment-input"`, `data-testid="validation-error"`, `data-testid="save-exercise-btn"` |
| Priority       | P1                                                                                                   |
| Pre-conditions | 用户在动作详情编辑模式                                                                               |
| Steps          | 1. 在加重增量输入框输入 0 2. 点击「保存」按钮                                                        |
| Expected       | 输入框下方显示验证错误文本「增量必须大于 0」，保存按钮禁用或点击后不提交                             |

### TC-UI-108: 动作名称输入超长字符

| Field          | Value                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-108                                                                                                |
| Source         | PRD 5.5 验证规则: 动作名称最大长度（超长输入）                                                           |
| Type           | UI                                                                                                       |
| Route          | /exercise-library                                                                                        |
| Target         | 自定义动作名称输入框                                                                                     |
| Element        | `data-testid="exercise-name-input"`, `data-testid="validation-error"`, `data-testid="save-exercise-btn"` |
| Priority       | P2                                                                                                       |
| Pre-conditions | 用户在自定义动作创建表单                                                                                 |
| Steps          | 1. 在动作名称输入框输入 100 个字符的超长文本 2. 点击「保存」按钮                                         |
| Expected       | 输入框下方显示验证错误文本「名称不能超过 50 个字符」，保存按钮禁用或点击后不提交                         |

### TC-UI-109: 导入损坏的 JSON 文件

| Field          | Value                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-109                                                                                            |
| Source         | PRD 5.11.1 异常处理: 导入损坏文件                                                                    |
| Type           | UI                                                                                                   |
| Route          | /settings                                                                                            |
| Target         | 导入数据错误处理                                                                                     |
| Element        | `data-testid="import-data-btn"`, `data-testid="file-picker-btn"`, `data-testid="import-error-toast"` |
| Priority       | P1                                                                                                   |
| Pre-conditions | 用户有一个格式损坏的 JSON 文件                                                                       |
| Steps          | 1. 点击「导入训练数据」按钮 2. 确认导入 3. 选择损坏的 JSON 文件                                      |
| Expected       | Toast 提示「文件格式错误，无法导入」，现有数据不受影响                                               |

### TC-UI-110: 单位切换后训练页重量显示转换（集成）

| Field          | Value                                                                                                                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-110                                                                                                                                                                                      |
| Source         | PRD 5.11.2 Step 2 + PRD 5.2 Step 1（跨功能集成）                                                                                                                                               |
| Type           | UI                                                                                                                                                                                             |
| Route          | /settings -> /workout -> /history                                                                                                                                                              |
| Target         | 设置页单位切换 + 训练页重量显示 + 历史页重量显示                                                                                                                                               |
| Element        | `data-testid="unit-selector"`, `data-testid="unit-option-lbs"`, `data-testid="suggested-weight"`, `data-testid="history-record-{id}"`                                                          |
| Priority       | P1                                                                                                                                                                                             |
| Pre-conditions | 用户当前使用 kg 单位，有历史训练记录（深蹲 80kg）                                                                                                                                              |
| Steps          | 1. 导航至 /settings 点击「单位选择器」切换为 lbs 2. 导航至 /workout 断言建议重量输入框单位标签为 lbs 且数值已转换（80kg -> 176.4lbs） 3. 导航至 /history 断言历史记录中深蹲重量显示为 176.4lbs |
| Expected       | 三个页面重量显示全部转换为 lbs：设置页单位标签为 lbs，训练页建议重量为 176.4lbs，历史页记录显示 176.4lbs                                                                                       |

### TC-UI-111: 高疲劳低满意后下次训练降低强度提示（集成）

| Field          | Value                                                                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-111                                                                                                                                                |
| Source         | US-5 AC-2 + PRD 5.4 加重关联（跨功能集成）                                                                                                               |
| Type           | UI                                                                                                                                                       |
| Route          | /feeling -> /calendar -> /workout                                                                                                                        |
| Target         | 感受保存 + 下次训练降低强度提示                                                                                                                          |
| Element        | `data-testid="fatigue-slider"`, `data-testid="satisfaction-slider"`, `data-testid="save-feeling-btn"`, `data-testid="reduced-intensity-prompt"`          |
| Priority       | P1                                                                                                                                                       |
| Pre-conditions | 用户刚完成一次训练，进入感受记录页                                                                                                                       |
| Steps          | 1. 拖动疲劳度滑块至 9 2. 拖动满意度滑块至 3 3. 点击「保存」按钮 4. 导航至 /calendar 等待下一个训练日 5. 点击训练日格子开始训练 6. 断言训练执行页顶部区域 |
| Expected       | 保存成功；下次训练执行页顶部显示降低强度提示横幅（`data-testid="reduced-intensity-prompt"` 文本包含「建议降低强度」）                                    |

### TC-UI-112: 模板创建计划到训练执行全链路（集成）

| Field          | Value                                                                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-112                                                                                                                                                                                                                             |
| Source         | US-18 AC-2 + US-18 AC-3 + PRD 5.2 Step 1（跨功能集成）                                                                                                                                                                                |
| Type           | UI                                                                                                                                                                                                                                    |
| Route          | /onboarding -> /plan/create -> /calendar -> /workout                                                                                                                                                                                  |
| Target         | 模板选择 -> 动作预填充 -> 训练执行建议重量显示                                                                                                                                                                                        |
| Element        | `data-testid="template-item-push-pull-legs"`, `data-testid="exercise-list"`, `data-testid="start-workout-btn"`, `data-testid="suggested-weight"`                                                                                      |
| Priority       | P1                                                                                                                                                                                                                                    |
| Pre-conditions | 新用户完成引导流程，无历史训练记录                                                                                                                                                                                                    |
| Steps          | 1. 在 /plan/create 点击「推/拉/蹲 3 日循环」模板卡片 2. 断言动作列表已预填充（推日包含卧推等动作） 3. 不修改默认参数点击「保存计划」 4. 导航至 /calendar 点击今日训练日格子 5. 点击「开始训练」按钮 6. 断言 /workout 页面动作卡片列表 |
| Expected       | 计划保存成功；训练执行页显示模板预填充的动作（推日：卧推等），每个动作卡片有目标组数 x 次数（如 3x8），建议重量输入框为空（首次无历史）提示用户输入初始重量                                                                           |

### TC-UI-113: 修改动作库加重增量后活跃计划建议更新（集成）

| Field          | Value                                                                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Test ID        | TC-UI-113                                                                                                                                                                |
| Source         | US-9 AC-5 + US-3 AC-1（跨功能集成）                                                                                                                                      |
| Type           | UI                                                                                                                                                                       |
| Route          | /exercise-library/{exerciseId} -> /workout                                                                                                                               |
| Target         | 动作库增量修改 + 下次训练加重建议                                                                                                                                        |
| Element        | `data-testid="increment-input"`, `data-testid="save-exercise-btn"`, `data-testid="suggested-weight"`                                                                     |
| Priority       | P1                                                                                                                                                                       |
| Pre-conditions | 深蹲加重增量当前为 5kg，上次深蹲 80kg 且全部达标                                                                                                                         |
| Steps          | 1. 导航至 /exercise-library 点击「深蹲」进入详情 2. 点击「编辑」按钮 3. 在加重增量输入框清空并输入 2.5 4. 点击「保存」 5. 导航至 /workout 开始训练 6. 读取深蹲建议重量值 |
| Expected       | 动作库保存成功提示「增量已更新为 2.5kg」；训练执行页深蹲建议重量 = 80 + 2.5 = 82.5kg（使用新增量而非旧增量 5kg）                                                         |

### TC-UI-114: 固定天数间隔排期方式创建计划

| Field          | Value                                                                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Test ID        | TC-UI-114                                                                                                                                                                            |
| Source         | PRD 5.9 排期方式: 固定天数间隔                                                                                                                                                       |
| Type           | UI                                                                                                                                                                                   |
| Route          | /plan/create -> /calendar                                                                                                                                                            |
| Target         | 计划创建表单 + 日历排期验证                                                                                                                                                          |
| Element        | `data-testid="scheduling-method-selector"`, `data-testid="interval-days-input"`, `data-testid="save-plan-btn"`, `data-testid="calendar-month-view"`                                  |
| Priority       | P1                                                                                                                                                                                   |
| Pre-conditions | 用户在计划创建页面                                                                                                                                                                   |
| Steps          | 1. 点击「排期方式选择器」选择「固定天数间隔」 2. 在间隔天数输入框输入 1（练一天休一天） 3. 定义推日、拉日、蹲日三个训练日的动作 4. 点击「保存计划」 5. 导航至 /calendar 断言日历排期 |
| Expected       | 日历按「训练(推) -> 休息 -> 训练(拉) -> 休息 -> 训练(蹲) -> 休息」循环排期，间隔天为休息日标记                                                                                       |

### TC-UI-115: 固定周期长度边界值 — 最小 1 周

| Field          | Value                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-115                                                                                               |
| Source         | PRD 5.9 验证规则: 周期长度 1-12 周（下界 cycle=1）                                                      |
| Type           | UI                                                                                                      |
| Route          | /plan/create                                                                                            |
| Target         | 计划创建周期长度输入框                                                                                  |
| Element        | `data-testid="mode-fixed-cycle"`, `data-testid="cycle-length-input"`, `data-testid="save-plan-btn"`     |
| Priority       | P1                                                                                                      |
| Pre-conditions | 用户在计划创建页面选择固定周期模式                                                                      |
| Steps          | 1. 点击「模式选择器」选择「固定周期」 2. 在周期长度输入框输入 1 3. 定义训练日和动作 4. 点击「保存计划」 |
| Expected       | 保存成功，生成 1 周排期，第 2 周自动重新开始                                                            |

### TC-UI-116: 固定周期长度边界值 — 最大 12 周

| Field          | Value                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-116                                                                                                |
| Source         | PRD 5.9 验证规则: 周期长度 1-12 周（上界 cycle=12）                                                      |
| Type           | UI                                                                                                       |
| Route          | /plan/create                                                                                             |
| Target         | 计划创建周期长度输入框                                                                                   |
| Element        | `data-testid="mode-fixed-cycle"`, `data-testid="cycle-length-input"`, `data-testid="save-plan-btn"`      |
| Priority       | P1                                                                                                       |
| Pre-conditions | 用户在计划创建页面选择固定周期模式                                                                       |
| Steps          | 1. 点击「模式选择器」选择「固定周期」 2. 在周期长度输入框输入 12 3. 定义训练日和动作 4. 点击「保存计划」 |
| Expected       | 保存成功，生成 12 周完整排期，日历覆盖约 3 个月范围                                                      |

### TC-UI-117: 固定周期长度超出范围 — 输入 0

| Field          | Value                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| Test ID        | TC-UI-117                                                                                              |
| Source         | PRD 5.9 验证规则: 周期长度 1-12 周（无效 cycle=0）                                                     |
| Type           | UI                                                                                                     |
| Route          | /plan/create                                                                                           |
| Target         | 计划创建周期长度输入框                                                                                 |
| Element        | `data-testid="mode-fixed-cycle"`, `data-testid="cycle-length-input"`, `data-testid="validation-error"` |
| Priority       | P1                                                                                                     |
| Pre-conditions | 用户在计划创建页面选择固定周期模式                                                                     |
| Steps          | 1. 在周期长度输入框输入 0 2. 点击「保存计划」按钮                                                      |
| Expected       | 输入框下方显示验证错误文本「周期长度不能小于 1 周」，保存按钮禁用或点击后不提交                        |

### TC-UI-118: 间隔天数超出范围 — 输入 7

| Field          | Value                                                                                                             |
| -------------- | ----------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-118                                                                                                         |
| Source         | PRD 5.9 验证规则: 间隔天数 0-6（无效 interval=7）                                                                 |
| Type           | UI                                                                                                                |
| Route          | /plan/create                                                                                                      |
| Target         | 计划创建间隔天数输入框                                                                                            |
| Element        | `data-testid="scheduling-method-selector"`, `data-testid="interval-days-input"`, `data-testid="validation-error"` |
| Priority       | P1                                                                                                                |
| Pre-conditions | 用户在计划创建页面选择固定天数间隔排期方式                                                                        |
| Steps          | 1. 在间隔天数输入框输入 7 2. 点击「保存计划」按钮                                                                 |
| Expected       | 输入框下方显示验证错误文本「间隔天数不能超过 6」，保存按钮禁用或点击后不提交                                      |

### TC-UI-119: 统计概览周容量柱状图颜色编码

| Field          | Value                                                                                                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Test ID        | TC-UI-119                                                                                                                                                                                        |
| Source         | PRD 5.10 Step 4                                                                                                                                                                                  |
| Type           | UI                                                                                                                                                                                               |
| Route          | /stats                                                                                                                                                                                           |
| Target         | 统计页周容量柱状图                                                                                                                                                                               |
| Element        | `data-testid="weekly-volume-chart"`, `data-testid="bar-current-week"`, `data-testid="bar-last-week"`, `data-testid="bar-other-week"`                                                             |
| Priority       | P1                                                                                                                                                                                               |
| Pre-conditions | 用户有近 8 周训练记录，当前处于本周                                                                                                                                                              |
| Steps          | 1. 切换到统计 Tab 2. 滚动至周容量柱状图区域 3. 读取本周柱条 CSS `fill` 或 `background-color` 属性 4. 读取上周柱条样式属性 5. 读取其余周柱条样式属性                                              |
| Expected       | 柱状图渲染 8 根柱条；本周柱条 `fill` 为主题色（如 `var(--color-primary)`），上周柱条带有绿色边框（`border: 2px solid var(--color-green)`），其余 6 周柱条为灰色（`fill: var(--color-grey-300)`） |

### TC-UI-120: 统计概览个人记录列表最多显示 4 条

| Field          | Value                                                                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-120                                                                                                                                          |
| Source         | PRD 5.10 Step 5                                                                                                                                    |
| Type           | UI                                                                                                                                                 |
| Route          | /stats                                                                                                                                             |
| Target         | 统计页个人记录列表区域                                                                                                                             |
| Element        | `data-testid="pr-record-list"`, `data-testid="pr-record-item-{index}"`, `data-testid="view-all-pr-btn"`                                            |
| Priority       | P1                                                                                                                                                 |
| Pre-conditions | 用户有 >= 5 个动作的个人记录数据                                                                                                                   |
| Steps          | 1. 切换到统计 Tab 2. 滚动至个人记录列表区域 3. 统计列表中 `data-testid="pr-record-item-{index}"` 元素数量 4. 断言每条记录显示动作名称和达成日期    |
| Expected       | 列表渲染 `data-testid="pr-record-item-{index}"` 元素数量 = 4（不多于 4 条），每条显示动作名称、估测 1RM 重量值和达成日期；底部显示「查看全部」按钮 |

### TC-UI-121: 统计概览训练频率热力图渲染

| Field          | Value                                                                                                                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Test ID        | TC-UI-121                                                                                                                                                                                                                |
| Source         | PRD 5.10 Step 7                                                                                                                                                                                                          |
| Type           | UI                                                                                                                                                                                                                       |
| Route          | /stats                                                                                                                                                                                                                   |
| Target         | 统计页训练频率热力图                                                                                                                                                                                                     |
| Element        | `data-testid="frequency-heatmap"`, `data-testid="heatmap-cell-{date}"`, `data-testid="heatmap-cell-planned-{date}"`                                                                                                      |
| Priority       | P1                                                                                                                                                                                                                       |
| Pre-conditions | 用户有近 4 周训练记录（含已训练日、休息日和计划中未完成日）                                                                                                                                                              |
| Steps          | 1. 切换到统计 Tab 2. 滚动至训练频率热力图区域 3. 统计 `data-testid="heatmap-cell-{date}"` 元素总数是否为 28（4 周 x 7 天） 4. 读取已训练日方块的 `opacity` 或填充深浅样式 5. 读取计划中未完成日方块的 `border` 样式      |
| Expected       | 热力图渲染 28 个方块（28 天），已训练日方块按强度分级填充（强度越高颜色越深，`opacity` 范围 0.4-1.0），计划中但未完成的日期方块显示蓝色边框（`border: 2px solid var(--color-blue)`），休息日方块浅灰色（`opacity: 0.1`） |

### TC-UI-122: 完成本组后 UI 状态与服务层数据双重验证（集成）

| Field          | Value                                                                                                                                                                                                                                                                                                                                                                                                                             |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-122                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Source         | US-2 AC-2 + PRD 5.2 Step 4（UI-API 跨层集成）                                                                                                                                                                                                                                                                                                                                                                                     |
| Type           | UI                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Route          | /workout                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Target         | 训练执行页组操作区 + progressive-overload 服务                                                                                                                                                                                                                                                                                                                                                                                    |
| Element        | `data-testid="reps-input"`, `data-testid="complete-set-btn"`, `data-testid="rest-timer"`, `data-testid="set-list"`                                                                                                                                                                                                                                                                                                                |
| Priority       | P0                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Pre-conditions | 用户在训练执行页面，正在进行深蹲第 2 组（目标 4 组），建议重量 80kg                                                                                                                                                                                                                                                                                                                                                               |
| Steps          | 1. 在次数输入框输入 8 2. 点击「完成本组」按钮 3. **UI 断言**：倒计时自动启动并显示 03:00，组列表中第 2 组标记为已完成且显示重量 80kg x 8 次 4. **服务层断言**：调用 `service://progressive-overload/getSetRecord` 传入当前 setId，断言返回 `{ weight: 80, reps: 8, status: 'completed' }` 5. **服务层断言**：调用 `service://progressive-overload/getWorkoutProgress` 传入当前 workoutId，断言 `completedSets = 2, totalSets = 4` |
| Expected       | UI 层：倒计时启动（03:00），第 2 组显示完成状态；服务层：数据库记录 weight=80, reps=8, status=completed，训练进度 completedSets=2/totalSets=4                                                                                                                                                                                                                                                                                     |

### TC-UI-123: 编辑历史记录后 UI 状态与加重建议服务重算双重验证（集成）

| Field          | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Test ID        | TC-UI-123                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Source         | US-12 AC-2 + PRD 5.6.1 加重建议链重算（UI-API 跨层集成）                                                                                                                                                                                                                                                                                                                                                                                                     |
| Type           | UI                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Target         | 训练详情编辑表单 + progressive-overload 服务                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Route          | /history/{workoutId}/edit -> /workout                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Element        | `data-testid="weight-input-{setId}"`, `data-testid="save-btn"`, `data-testid="suggested-weight"`                                                                                                                                                                                                                                                                                                                                                             |
| Priority       | P0                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Pre-conditions | 用户有上次深蹲训练记录（5 组 x 80kg x 8 次，全部达标），下次建议重量应为 85kg                                                                                                                                                                                                                                                                                                                                                                                |
| Steps          | 1. 导航至 /history/{workoutId} 点击「编辑」按钮 2. 将第 5 组重量从 80kg 修改为 60kg（模拟输入错误修正） 3. 点击「保存」按钮 4. **UI 断言**：Toast 提示保存成功 5. **服务层断言**：调用 `service://progressive-overload/calculateSuggestedWeight` 传入 `{ exerciseId: 'squat', userId }`，断言返回 `suggestedWeight = 60 + 5 = 65`（基于修改后的实际值重新计算，而非旧的 80kg） 6. **UI 断言**：导航至 /workout 开始下次训练，读取深蹲建议重量输入框值 = 65kg |
| Expected       | UI 层：保存成功提示，下次训练建议重量显示 65kg；服务层：calculateSuggestedWeight 返回 65（基于编辑后实际重量 60kg + 增量 5kg 重新计算）                                                                                                                                                                                                                                                                                                                      |

## Type: API

### TC-API-001: 加重建议 - 所有组完成目标次数

| Field          | Value                                                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Test ID        | TC-API-001                                                                                                                                       |
| Source         | US-3 AC-1                                                                                                                                        |
| Type           | API                                                                                                                                              |
| Route          | `service://progressive-overload/calculateSuggestedWeight`                                                                                        |
| Target         | progressive-overload service                                                                                                                     |
| Priority       | P0                                                                                                                                               |
| Pre-conditions | 上次深蹲所有组均完成目标次数，深蹲加重增量为 5kg                                                                                                 |
| Steps          | 1. 调用 progressive-overload 服务的 `calculateSuggestedWeight` 方法，传入 `{ exerciseId: 'squat', userId }` 2. 断言返回值中 suggestedWeight 字段 |
| Expected       | `suggestedWeight = lastWorkoutWeight + exercise.increment`（如 80 + 5 = 85kg）                                                                   |

### TC-API-002: 加重建议 - 部分组未完成

| Field          | Value                                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Test ID        | TC-API-002                                                                                                                                             |
| Source         | US-3 AC-2                                                                                                                                              |
| Type           | API                                                                                                                                                    |
| Route          | `service://progressive-overload/calculateSuggestedWeight`                                                                                              |
| Target         | progressive-overload service                                                                                                                           |
| Priority       | P0                                                                                                                                                     |
| Pre-conditions | 上次卧推有 1 组未完成目标次数（目标 8 次，实际完成 6 次）                                                                                              |
| Steps          | 1. 调用 progressive-overload 服务的 `calculateSuggestedWeight` 方法，传入 `{ exerciseId: 'bench-press', userId }` 2. 断言返回值中 suggestedWeight 字段 |
| Expected       | `suggestedWeight = lastWorkoutWeight`（保持不变，不加不减）                                                                                            |

### TC-API-003: 加重建议 - 连续两次未完成建议减重

| Field          | Value                                                                                                                                                             |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-API-003                                                                                                                                                        |
| Source         | US-3 AC-3                                                                                                                                                         |
| Type           | API                                                                                                                                                               |
| Route          | `service://progressive-overload/calculateSuggestedWeight`                                                                                                         |
| Target         | progressive-overload service                                                                                                                                      |
| Priority       | P0                                                                                                                                                                |
| Pre-conditions | 卧推连续 2 次训练均有组未完成，上次重量 100kg                                                                                                                     |
| Steps          | 1. 调用 progressive-overload 服务的 `calculateSuggestedWeight` 方法，传入 `{ exerciseId: 'bench-press', userId }` 2. 断言返回值中 suggestedWeight 和 warning 字段 |
| Expected       | `suggestedWeight = floor(lastWeight * 0.9)`（100 \* 0.9 = 90kg），`warning = "建议减重 10%"`                                                                      |

### TC-API-004: 各动作独立加重增量

| Field          | Value                                                                                                                                                                        |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-API-004                                                                                                                                                                   |
| Source         | US-3 AC-4                                                                                                                                                                    |
| Type           | API                                                                                                                                                                          |
| Route          | `service://progressive-overload/calculateSuggestedWeight`                                                                                                                    |
| Target         | progressive-overload service                                                                                                                                                 |
| Priority       | P0                                                                                                                                                                           |
| Pre-conditions | 深蹲增量 5kg、上次 80kg；卧推增量 2.5kg、上次 60kg；两个动作均达标                                                                                                           |
| Steps          | 1. 调用 progressive-overload 服务的 `calculateSuggestedWeight` 方法，分别传入 `{ exerciseId: 'squat', userId }` 和 `{ exerciseId: 'bench-press', userId }` 3. 断言两个返回值 |
| Expected       | 深蹲建议 = 80 + 5 = 85kg，卧推建议 = 60 + 2.5 = 62.5kg，各自独立计算                                                                                                         |

### TC-API-005: 用户修改建议重量不影响下次建议

| Field          | Value                                                                                                                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-API-005                                                                                                                                                                                                     |
| Source         | US-3 AC-5                                                                                                                                                                                                      |
| Type           | API                                                                                                                                                                                                            |
| Route          | `service://progressive-overload/saveSet`                                                                                                                                                                       |
| Target         | progressive-overload service                                                                                                                                                                                   |
| Priority       | P0                                                                                                                                                                                                             |
| Pre-conditions | 加重建议已生成（80kg），用户修改实际使用重量为 75kg                                                                                                                                                            |
| Steps          | 1. 调用 progressive-overload 服务的 `saveSet` 方法，传入 `{ exerciseId: 'squat', setId, weight: 75, reps: 8, isCustom: true }` 2. 调用 `calculateSuggestedWeight` 方法，传入 `{ exerciseId: 'squat', userId }` |
| Expected       | 下次建议基于实际使用重量 75kg 计算（而非原始建议 80kg）                                                                                                                                                        |

### TC-API-006: 新动作建议重量为空

| Field          | Value                                                                                                                            |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-API-006                                                                                                                       |
| Source         | US-3 AC-6                                                                                                                        |
| Type           | API                                                                                                                              |
| Route          | `service://progressive-overload/calculateSuggestedWeight`                                                                        |
| Target         | progressive-overload service                                                                                                     |
| Priority       | P0                                                                                                                               |
| Pre-conditions | 动作无历史训练记录                                                                                                               |
| Steps          | 1. 调用 progressive-overload 服务的 `calculateSuggestedWeight` 方法，传入 `{ exerciseId: 'new-exercise', userId }` 2. 断言返回值 |
| Expected       | `suggestedWeight = null`，`isNewExercise = true`，前端显示空输入框提示用户输入初始重量                                           |

### TC-API-007: 减重取整到可用杠铃片组合

| Field          | Value                                                                                                            |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-API-007                                                                                                       |
| Source         | US-3 AC-7                                                                                                        |
| Type           | API                                                                                                              |
| Route          | `service://progressive-overload/roundToPlateCombo`                                                               |
| Target         | progressive-overload service                                                                                     |
| Priority       | P1                                                                                                               |
| Pre-conditions | 卧推上次重量 97.5kg，需减重 10%                                                                                  |
| Steps          | 1. 调用 progressive-overload 服务的 `roundToPlateCombo` 方法，传入 `{ weight: 87.75, unit: 'kg' }` 2. 断言返回值 |
| Expected       | 返回 87.5（向下取整到最近 2.5kg 杠铃片组合）                                                                     |

### TC-API-008: 连续 3 次达标增量提示

| Field          | Value                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Test ID        | TC-API-008                                                                                                                           |
| Source         | US-3 AC-8                                                                                                                            |
| Type           | API                                                                                                                                  |
| Route          | `service://progressive-overload/calculateSuggestedWeight`                                                                            |
| Target         | progressive-overload service                                                                                                         |
| Priority       | P2                                                                                                                                   |
| Pre-conditions | 动作连续 3 次训练均达标                                                                                                              |
| Steps          | 1. 调用 progressive-overload 服务的 `calculateSuggestedWeight` 方法，传入 `{ exerciseId: 'squat', userId }` 2. 断言返回值中 tip 字段 |
| Expected       | `suggestedWeight` 按正常增量加重，`tip = "状态不错，考虑加大增量？"`（增量不自动修改）                                               |

### TC-API-009: 中途退出已完成动作加重判断

| Field          | Value                                                                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-API-009                                                                                                                                                 |
| Source         | US-10 AC-4                                                                                                                                                 |
| Type           | API                                                                                                                                                        |
| Route          | `service://progressive-overload/calculateSuggestedWeight`                                                                                                  |
| Target         | progressive-overload service                                                                                                                               |
| Priority       | P0                                                                                                                                                         |
| Pre-conditions | 用户中途退出训练（完成了深蹲 5 组中的 3 组，卧推 0 组）                                                                                                    |
| Steps          | 1. 调用 progressive-overload 服务的 `calculateSuggestedWeight` 方法，分别传入 `{ exerciseId: 'squat', userId }` 和 `{ exerciseId: 'bench-press', userId }` |
| Expected       | 深蹲：基于已完成 3 组正常判断加重；卧推：建议重量不变（视为未完成，不纳入计算）                                                                            |

### TC-API-010: 中途退出倒计时自动取消

| Field          | Value                                                                         |
| -------------- | ----------------------------------------------------------------------------- |
| Test ID        | TC-API-010                                                                    |
| Source         | US-10 AC-5                                                                    |
| Type           | API                                                                           |
| Route          | `service://timer/cancelTimer`                                                 |
| Target         | timer service                                                                 |
| Priority       | P1                                                                            |
| Pre-conditions | 用户在倒计时运行中中途退出训练                                                |
| Steps          | 1. 调用 timer 服务的 `cancelTimer` 方法，传入 `{ timerId }` 2. 断言计时器状态 |
| Expected       | `timer.status = 'cancelled'`，计时器停止递减，不触发通知                      |

### TC-API-011: 补录记录加重建议链重算

| Field          | Value                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-API-011                                                                                                                                                                            |
| Source         | US-13 AC-4                                                                                                                                                                            |
| Type           | API                                                                                                                                                                                   |
| Route          | `service://progressive-overload/recalculateOverloadChain`                                                                                                                             |
| Target         | progressive-overload service                                                                                                                                                          |
| Priority       | P0                                                                                                                                                                                    |
| Pre-conditions | 用户补录的训练日期早于最近训练（补录 3 天前的深蹲 85kg，之后已有 1 次深蹲 90kg）                                                                                                      |
| Steps          | 1. 调用 progressive-overload 服务的 `saveRetroactiveWorkout` 方法保存补录数据 2. 调用 `recalculateOverloadChain` 方法，传入 `{ userId, exerciseId: 'squat' }` 3. 查询后续训练的建议值 |
| Expected       | 补录后的训练建议链重新计算：第 1 次 85kg -> 建议 90kg（一致），第 2 次 90kg -> 建议 95kg（不变）                                                                                      |

### TC-API-012: 1RM 估测公式

| Field          | Value                                                                                  |
| -------------- | -------------------------------------------------------------------------------------- |
| Test ID        | TC-API-012                                                                             |
| Source         | PRD 5.10 验证规则: 1RM 估测公式                                                        |
| Type           | API                                                                                    |
| Route          | `service://stats/estimate1RM`                                                          |
| Target         | stats service                                                                          |
| Priority       | P1                                                                                     |
| Pre-conditions | 用户有训练记录含最大重量组（100kg x 5 次）                                             |
| Steps          | 1. 调用 stats 服务的 `estimate1RM` 方法，传入 `{ weight: 100, reps: 5 }` 2. 断言返回值 |
| Expected       | `estimated1RM = 100 * (1 + 5 / 30) = 116.67`（四舍五入到 116.7）                       |

### TC-API-013: 周环比计算

| Field          | Value                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------- |
| Test ID        | TC-API-013                                                                                    |
| Source         | PRD 5.10 验证规则: 周环比计算公式                                                             |
| Type           | API                                                                                           |
| Route          | `service://stats/calculateWeekOverWeek`                                                       |
| Target         | stats service                                                                                 |
| Priority       | P1                                                                                            |
| Pre-conditions | 用户有本周容量 12000kg 和上周容量 10000kg                                                     |
| Steps          | 1. 调用 stats 服务的 `calculateWeekOverWeek` 方法，传入 `{ userId }` 2. 断言返回值            |
| Expected       | `weekOverWeekChange = 12000 / 10000 - 1 = 0.2`（即 +20%）；上周无数据时返回 `null` 显示「--」 |

### TC-API-014: 训练频率热力图强度分级

| Field          | Value                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| Test ID        | TC-API-014                                                                                                         |
| Source         | PRD 5.10 验证规则: 热力图强度分级                                                                                  |
| Type           | API                                                                                                                |
| Route          | `service://stats/calculateHeatmapIntensity`                                                                        |
| Target         | stats service                                                                                                      |
| Priority       | P2                                                                                                                 |
| Pre-conditions | 用户有近 4 周训练数据（含休息日、轻度日、中度日、重度日）                                                          |
| Steps          | 1. 调用 stats 服务的 `calculateHeatmapIntensity` 方法，传入 `{ userId, dateRange: '4w' }` 2. 断言各日 intensity 值 |
| Expected       | 休息日 intensity = 0.1，轻度 = 0.4-0.6，中度 = 0.7-0.8，重度 >= 0.9                                                |

---

## Type: CLI

> No CLI test cases applicable. This is a mobile app (React Native / Expo) with no command-line interface.

---

## Summary

| Type      | Count   | Priority P0 | Priority P1 | Priority P2 |
| --------- | ------- | ----------- | ----------- | ----------- |
| UI        | 123     | 45          | 68          | 10          |
| API       | 14      | 8           | 4           | 2           |
| CLI       | 0       | 0           | 0           | 0           |
| **Total** | **137** | **53**      | **72**      | **12**      |

### Traceability Matrix

| TC ID      | Source                                              | Type | Target                                           | Priority |
| ---------- | --------------------------------------------------- | ---- | ------------------------------------------------ | -------- |
| TC-UI-001  | US-1 AC-1                                           | UI   | 首页空状态引导组件                               | P0       |
| TC-UI-002  | US-1 AC-2                                           | UI   | 计划创建表单                                     | P0       |
| TC-UI-003  | US-1 AC-3                                           | UI   | 计划创建表单                                     | P0       |
| TC-UI-004  | US-1 AC-4                                           | UI   | 日历今日日期格子                                 | P0       |
| TC-UI-005  | US-1 AC-5                                           | UI   | 计划创建页 + 日历页                              | P1       |
| TC-UI-006  | US-1 AC-6                                           | UI   | 计划创建表单                                     | P2       |
| TC-UI-007  | US-2 AC-1                                           | UI   | 训练执行页动作卡片                               | P0       |
| TC-UI-008  | US-2 AC-2                                           | UI   | 训练执行页组操作区                               | P0       |
| TC-UI-009  | US-2 AC-3                                           | UI   | 倒计时组件                                       | P0       |
| TC-UI-010  | US-2 AC-4                                           | UI   | 倒计时跳过按钮                                   | P1       |
| TC-UI-011  | US-2 AC-5                                           | UI   | 训练执行页重量输入框                             | P1       |
| TC-UI-012  | US-2 AC-6                                           | UI   | 训练执行页组操作区                               | P0       |
| TC-UI-013  | US-2 AC-7                                           | UI   | 额外组按钮                                       | P1       |
| TC-UI-014  | US-2 AC-8                                           | UI   | 训练退出确认对话框                               | P0       |
| TC-UI-015  | US-2 AC-9                                           | UI   | 训练执行页倒计时组件                             | P0       |
| TC-UI-016  | US-4 AC-1                                           | UI   | 进步曲线面板                                     | P0       |
| TC-UI-017  | US-4 AC-2                                           | UI   | PR 提醒弹窗                                      | P0       |
| TC-UI-018  | US-4 AC-3                                           | UI   | 历史列表筛选器                                   | P1       |
| TC-UI-019  | US-4 AC-4                                           | UI   | 容量面板                                         | P1       |
| TC-UI-020  | US-4 AC-5                                           | UI   | 进步曲线面板                                     | P2       |
| TC-UI-021  | US-4 AC-6                                           | UI   | 训练记录详情 + PR 列表                           | P0       |
| TC-UI-022  | US-4 AC-7                                           | UI   | 进步曲线图表区域                                 | P2       |
| TC-UI-023  | US-5 AC-1                                           | UI   | 感受记录页表单                                   | P0       |
| TC-UI-024  | US-5 AC-2                                           | UI   | 感受记录滑块 + 保存按钮                          | P1       |
| TC-UI-025  | US-5 AC-3                                           | UI   | 感受记录保存按钮                                 | P1       |
| TC-UI-026  | US-5 AC-4                                           | UI   | 感受记录页动作列表                               | P1       |
| TC-UI-027  | US-5 AC-5                                           | UI   | 历史记录详情 + 感受编辑表单                      | P1       |
| TC-UI-028  | US-6 AC-1                                           | UI   | 日历月视图训练日格子                             | P0       |
| TC-UI-029  | US-6 AC-2                                           | UI   | 日历训练日格子                                   | P1       |
| TC-UI-030  | US-6 AC-3                                           | UI   | 已完成训练日格子                                 | P0       |
| TC-UI-031  | US-6 AC-4                                           | UI   | 未来训练日格子                                   | P0       |
| TC-UI-032  | US-6 AC-5                                           | UI   | 今日训练日格子 + 上下文菜单                      | P1       |
| TC-UI-033  | US-6 AC-6                                           | UI   | 训练日提示弹窗                                   | P2       |
| TC-UI-034  | US-6 AC-7                                           | UI   | 已跳过的训练日格子                               | P2       |
| TC-UI-035  | US-7 AC-1                                           | UI   | 日历休息日格子 + 其他运动入口                    | P1       |
| TC-UI-036  | US-7 AC-2                                           | UI   | 其他运动录入表单                                 | P1       |
| TC-UI-037  | US-7 AC-3                                           | UI   | 自定义运动创建表单                               | P1       |
| TC-UI-038  | US-7 AC-4                                           | UI   | 其他运动保存按钮 + 日历格子                      | P1       |
| TC-UI-039  | US-7 AC-5                                           | UI   | 日历今日格子                                     | P1       |
| TC-UI-040  | US-7 AC-6                                           | UI   | 运动类型选择列表                                 | P2       |
| TC-UI-041  | US-8 AC-1                                           | UI   | 身体数据录入表单                                 | P0       |
| TC-UI-042  | US-8 AC-2                                           | UI   | 趋势图面板                                       | P1       |
| TC-UI-043  | US-8 AC-3                                           | UI   | 身体数据保存按钮                                 | P1       |
| TC-UI-044  | US-8 AC-4                                           | UI   | 日期选择器 + 保存按钮                            | P1       |
| TC-UI-045  | US-8 AC-5                                           | UI   | 历史记录列表 + 编辑表单                          | P2       |
| TC-UI-046  | US-9 AC-1                                           | UI   | 动作库分类列表                                   | P0       |
| TC-UI-047  | US-9 AC-2                                           | UI   | 动作选择 + 计划编辑器                            | P0       |
| TC-UI-048  | US-9 AC-3                                           | UI   | 自定义动作创建表单                               | P1       |
| TC-UI-049  | US-9 AC-4                                           | UI   | 自定义分类列表                                   | P1       |
| TC-UI-050  | US-9 AC-5                                           | UI   | 动作详情编辑表单                                 | P1       |
| TC-UI-051  | US-9 AC-6                                           | UI   | 自定义动作删除操作                               | P1       |
| TC-UI-052  | US-9 AC-7                                           | UI   | 动作详情面板                                     | P1       |
| TC-UI-053  | US-10 AC-1                                          | UI   | 训练退出确认对话框                               | P0       |
| TC-UI-054  | US-10 AC-2                                          | UI   | 退出确认按钮                                     | P0       |
| TC-UI-055  | US-10 AC-3                                          | UI   | 部分完成训练日格子                               | P0       |
| TC-UI-056  | US-11 AC-1                                          | UI   | 训练执行页倒计时组件                             | P0       |
| TC-UI-057  | US-11 AC-2                                          | UI   | 系统通知栏                                       | P0       |
| TC-UI-058  | US-11 AC-3                                          | UI   | 系统通知 + 训练页面                              | P0       |
| TC-UI-059  | US-11 AC-4                                          | UI   | 锁屏通知                                         | P0       |
| TC-UI-060  | US-11 AC-5                                          | UI   | 训练执行页超时提醒                               | P1       |
| TC-UI-061  | US-11 AC-6                                          | UI   | 训练恢复页面                                     | P0       |
| TC-UI-062  | US-12 AC-1                                          | UI   | 训练详情页                                       | P0       |
| TC-UI-063  | US-12 AC-2                                          | UI   | 训练编辑表单                                     | P0       |
| TC-UI-064  | US-12 AC-3                                          | UI   | 训练删除操作                                     | P0       |
| TC-UI-065  | US-12 AC-4                                          | UI   | 训练删除 + PR 列表                               | P0       |
| TC-UI-066  | US-12 AC-5                                          | UI   | 感受编辑表单                                     | P1       |
| TC-UI-067  | US-13 AC-1                                          | UI   | 日历过去日期格子 + 补录入口                      | P1       |
| TC-UI-068  | US-13 AC-2                                          | UI   | 补录训练页面                                     | P1       |
| TC-UI-069  | US-13 AC-3                                          | UI   | 补录保存 + 加重建议显示                          | P0       |
| TC-UI-070  | US-14 AC-1                                          | UI   | 设置页导出按钮                                   | P1       |
| TC-UI-071  | US-14 AC-2                                          | UI   | 导出完成分享面板                                 | P1       |
| TC-UI-072  | US-14 AC-3                                          | UI   | 导出文件内容验证                                 | P1       |
| TC-UI-073  | US-15 AC-1                                          | UI   | 设置页单位切换选项                               | P0       |
| TC-UI-074  | US-15 AC-2                                          | UI   | 训练执行页重量输入框                             | P0       |
| TC-UI-075  | US-15 AC-3                                          | UI   | 加重增量配置选项                                 | P1       |
| TC-UI-076  | US-15 AC-4                                          | UI   | 加重建议显示值                                   | P1       |
| TC-UI-077  | US-16 AC-1                                          | UI   | 动作卡片列表                                     | P1       |
| TC-UI-078  | US-16 AC-2                                          | UI   | 动作卡片滑动区域                                 | P1       |
| TC-UI-079  | US-16 AC-3                                          | UI   | 加重建议显示                                     | P1       |
| TC-UI-080  | US-16 AC-4                                          | UI   | 已跳过的动作卡片                                 | P2       |
| TC-UI-081  | US-17 AC-1                                          | UI   | 计划编辑动作列表                                 | P1       |
| TC-UI-082  | US-17 AC-2                                          | UI   | 动作备注输入框                                   | P1       |
| TC-UI-083  | US-17 AC-3                                          | UI   | 两次同动作的建议重量                             | P1       |
| TC-UI-084  | US-18 AC-1                                          | UI   | 欢迎引导页面                                     | P0       |
| TC-UI-085  | US-18 AC-2                                          | UI   | 模板推荐列表                                     | P0       |
| TC-UI-086  | US-18 AC-3                                          | UI   | 模板动作配置表单                                 | P1       |
| TC-UI-087  | US-18 AC-4                                          | UI   | 设置页新手引导入口                               | P2       |
| TC-UI-088  | PRD 5.10 Step 2                                     | UI   | 统计页 Hero 卡片                                 | P0       |
| TC-UI-089  | PRD 5.10 Step 3                                     | UI   | 统计页四宫格卡片                                 | P0       |
| TC-UI-090  | PRD 5.10 Step 1 (no_data status)                    | UI   | 统计页空状态提示                                 | P1       |
| TC-UI-091  | PRD 5.11 Step 1                                     | UI   | 设置页分组列表                                   | P0       |
| TC-UI-092  | PRD 5.11 Step 10-11                                 | UI   | 清除数据确认面板                                 | P0       |
| TC-UI-093  | PRD 5.11 Step 11                                    | UI   | 清除数据操作 + 日历/历史验证                     | P0       |
| TC-UI-094  | PRD 5.11.1 Step 1-3                                 | UI   | 导入数据操作                                     | P0       |
| TC-UI-095  | PRD 5.3 验证规则: 目标组数 1-10（下界 sets=1）      | UI   | 训练计划目标组数输入框                           | P1       |
| TC-UI-096  | PRD 5.3 验证规则: 目标组数 1-10（上界 sets=10）     | UI   | 训练计划目标组数输入框                           | P1       |
| TC-UI-097  | PRD 5.3 验证规则: 目标组数 1-10（无效 sets=0）      | UI   | 训练计划目标组数输入框                           | P1       |
| TC-UI-098  | PRD 5.3 验证规则: 目标组数 1-10（无效 sets=11）     | UI   | 训练计划目标组数输入框                           | P1       |
| TC-UI-099  | PRD 5.3 验证规则: 目标次数 1-30（下界 reps=1）      | UI   | 训练计划目标次数输入框                           | P1       |
| TC-UI-100  | PRD 5.3 验证规则: 目标次数 1-30（上界 reps=30）     | UI   | 训练计划目标次数输入框                           | P1       |
| TC-UI-101  | PRD 5.3 验证规则: 目标次数 1-30（无效 reps=0）      | UI   | 训练计划目标次数输入框                           | P1       |
| TC-UI-102  | PRD 5.3 验证规则: 休息时间 30-600s（下界 rest=30）  | UI   | 休息时间输入框                                   | P1       |
| TC-UI-103  | PRD 5.3 验证规则: 休息时间 30-600s（上界 rest=600） | UI   | 休息时间输入框                                   | P1       |
| TC-UI-104  | PRD 5.3 验证规则: 休息时间 30-600s（无效 rest=29）  | UI   | 休息时间输入框                                   | P1       |
| TC-UI-105  | PRD 5.3 验证规则: 重量 > 0（无效 weight=-5）        | UI   | 训练执行页重量输入框                             | P1       |
| TC-UI-106  | PRD 5.3 验证规则: 次数 1-30（无效 reps=0 训练中）   | UI   | 训练执行页次数输入框                             | P1       |
| TC-UI-107  | PRD 5.3 验证规则: 加重增量 > 0（无效 increment=0）  | UI   | 动作详情加重增量输入框                           | P1       |
| TC-UI-108  | PRD 5.5 验证规则: 动作名称最大长度（超长输入）      | UI   | 自定义动作名称输入框                             | P2       |
| TC-UI-109  | PRD 5.11.1 异常处理: 导入损坏文件                   | UI   | 导入数据错误处理                                 | P1       |
| TC-UI-110  | PRD 5.11.2 Step 2 + PRD 5.2 Step 1                  | UI   | 设置页单位切换 + 训练页重量显示 + 历史页重量显示 | P1       |
| TC-UI-111  | US-5 AC-2 + PRD 5.4 加重关联                        | UI   | 感受保存 + 下次训练降低强度提示                  | P1       |
| TC-UI-112  | US-18 AC-2 + US-18 AC-3 + PRD 5.2 Step 1            | UI   | 模板选择 -> 动作预填充 -> 训练执行建议重量显示   | P1       |
| TC-UI-113  | US-9 AC-5 + US-3 AC-1                               | UI   | 动作库增量修改 + 下次训练加重建议                | P1       |
| TC-UI-114  | PRD 5.9 排期方式: 固定天数间隔                      | UI   | 计划创建表单 + 日历排期验证                      | P1       |
| TC-UI-115  | PRD 5.9 验证规则: 周期长度 1-12 周（下界 cycle=1）  | UI   | 计划创建周期长度输入框                           | P1       |
| TC-UI-116  | PRD 5.9 验证规则: 周期长度 1-12 周（上界 cycle=12） | UI   | 计划创建周期长度输入框                           | P1       |
| TC-UI-117  | PRD 5.9 验证规则: 周期长度 1-12 周（无效 cycle=0）  | UI   | 计划创建周期长度输入框                           | P1       |
| TC-UI-118  | PRD 5.9 验证规则: 间隔天数 0-6（无效 interval=7）   | UI   | 计划创建间隔天数输入框                           | P1       |
| TC-UI-119  | PRD 5.10 Step 4                                     | UI   | 统计页周容量柱状图                               | P1       |
| TC-UI-120  | PRD 5.10 Step 5                                     | UI   | 统计页个人记录列表区域                           | P1       |
| TC-UI-121  | PRD 5.10 Step 7                                     | UI   | 统计页训练频率热力图                             | P1       |
| TC-UI-122  | US-2 AC-2 + PRD 5.2 Step 4                          | UI   | 训练执行页组操作区 + progressive-overload 服务   | P0       |
| TC-UI-123  | US-12 AC-2 + PRD 5.6.1 加重建议链重算               | UI   | 训练详情编辑表单 + progressive-overload 服务     | P0       |
| TC-API-001 | US-3 AC-1                                           | API  | progressive-overload service                     | P0       |
| TC-API-002 | US-3 AC-2                                           | API  | progressive-overload service                     | P0       |
| TC-API-003 | US-3 AC-3                                           | API  | progressive-overload service                     | P0       |
| TC-API-004 | US-3 AC-4                                           | API  | progressive-overload service                     | P0       |
| TC-API-005 | US-3 AC-5                                           | API  | progressive-overload service                     | P0       |
| TC-API-006 | US-3 AC-6                                           | API  | progressive-overload service                     | P0       |
| TC-API-007 | US-3 AC-7                                           | API  | progressive-overload service                     | P1       |
| TC-API-008 | US-3 AC-8                                           | API  | progressive-overload service                     | P2       |
| TC-API-009 | US-10 AC-4                                          | API  | progressive-overload service                     | P0       |
| TC-API-010 | US-10 AC-5                                          | API  | timer service                                    | P1       |
| TC-API-011 | US-13 AC-4                                          | API  | progressive-overload service                     | P0       |
| TC-API-012 | PRD 5.10 验证规则: 1RM 估测公式                     | API  | stats service                                    | P1       |
| TC-API-013 | PRD 5.10 验证规则: 周环比计算公式                   | API  | stats service                                    | P1       |
| TC-API-014 | PRD 5.10 验证规则: 热力图强度分级                   | API  | stats service                                    | P2       |

### Route Validation Table

| Route                             | TC IDs                                                                                                                                                                                       | Description   |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| /calendar                         | TC-UI-004, TC-UI-005, TC-UI-028 ~ TC-UI-034, TC-UI-039, TC-UI-055, TC-UI-067                                                                                                                 | 训练日历页    |
| /plan/create                      | TC-UI-002, TC-UI-003, TC-UI-006, TC-UI-085, TC-UI-086, TC-UI-095 ~ TC-UI-098, TC-UI-099 ~ TC-UI-104, TC-UI-114 ~ TC-UI-118                                                                   | 计划创建/编辑 |
| /plan/edit                        | TC-UI-005, TC-UI-081, TC-UI-082                                                                                                                                                              | 计划编辑      |
| /workout                          | TC-UI-007 ~ TC-UI-015, TC-UI-053, TC-UI-054, TC-UI-056 ~ TC-UI-061, TC-UI-074, TC-UI-076 ~ TC-UI-080, TC-UI-083, TC-UI-105, TC-UI-106, TC-UI-110, TC-UI-112, TC-UI-113, TC-UI-122, TC-UI-123 | 训练执行页    |
| /workout/retroactive              | TC-UI-068, TC-UI-069                                                                                                                                                                         | 补录训练      |
| /history                          | TC-UI-016 ~ TC-UI-022, TC-UI-062 ~ TC-UI-066, TC-UI-110, TC-UI-123                                                                                                                           | 训练历史/分析 |
| /history/{workoutId}              | TC-UI-062, TC-UI-064, TC-UI-065                                                                                                                                                              | 训练详情页    |
| /history/{workoutId}/edit         | TC-UI-063, TC-UI-123                                                                                                                                                                         | 训练编辑页    |
| /history/{workoutId}/feeling      | TC-UI-066                                                                                                                                                                                    | 感受编辑页    |
| /feeling                          | TC-UI-023 ~ TC-UI-027                                                                                                                                                                        | 感受记录页    |
| /exercise-library                 | TC-UI-046 ~ TC-UI-051, TC-UI-108                                                                                                                                                             | 动作库        |
| /exercise-library/{exerciseId}    | TC-UI-050, TC-UI-052, TC-UI-107, TC-UI-113                                                                                                                                                   | 动作详情页    |
| /other-sport                      | TC-UI-035 ~ TC-UI-040                                                                                                                                                                        | 其他运动记录  |
| /body-data                        | TC-UI-041 ~ TC-UI-045                                                                                                                                                                        | 身体数据录入  |
| /settings                         | TC-UI-070 ~ TC-UI-073, TC-UI-075, TC-UI-087, TC-UI-091 ~ TC-UI-094, TC-UI-109, TC-UI-110                                                                                                     | 设置页        |
| /stats                            | TC-UI-088 ~ TC-UI-090, TC-UI-119 ~ TC-UI-121                                                                                                                                                 | 统计概览页    |
| /onboarding                       | TC-UI-084, TC-UI-085                                                                                                                                                                         | 新手引导      |
| service://progressive-overload/\* | TC-API-001 ~ TC-API-009, TC-API-011                                                                                                                                                          | 渐进加重服务  |
| service://timer/\*                | TC-API-010                                                                                                                                                                                   | 计时器服务    |
| service://stats/\*                | TC-API-012 ~ TC-API-014                                                                                                                                                                      | 统计服务      |

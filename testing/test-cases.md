---
feature: "Train Recorder"
generated_from: "prd/prd-spec.md, prd/prd-user-stories.md, prd/prd-ui-functions.md"
generated_date: "2026-05-09"
total_test_cases: 106
---

# Test Cases: Train Recorder

> Structured test cases generated from PRD acceptance criteria.
> Grouped by type: UI -> API -> CLI.

---

## Type: UI

### TC-UI-001: 首次使用进入计划创建流程

| Field          | Value                                                    |
| -------------- | -------------------------------------------------------- |
| Test ID        | TC-UI-001                                                |
| Source         | US-1 AC: 用户首次使用 App，点击「创建计划」              |
| Type           | UI                                                       |
| Target         | app/(tabs)/calendar.tsx                                  |
| Priority       | P0                                                       |
| Pre-conditions | 用户首次使用，无任何训练数据                              |
| Steps          | 1. 打开 App 2. 观察首页提示 3. 点击「创建计划」          |
| Expected       | 进入计划创建流程页面                                      |

### TC-UI-002: 无限循环模式自动排期

| Field          | Value                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-002                                                                                      |
| Source         | US-1 AC: 选择「无限循环」模式，定义推日/拉日/蹲日三个训练日                                   |
| Type           | UI                                                                                             |
| Target         | app/(tabs)/plan.tsx                                                                            |
| Priority       | P0                                                                                             |
| Pre-conditions | 用户在计划创建页面                                                                             |
| Steps          | 1. 选择「无限循环」模式 2. 定义推日、拉日、蹲日三个训练日 3. 保存计划                         |
| Expected       | App 自动按推->拉->蹲顺序排期到日历中，无限循环                                                |

### TC-UI-003: 固定周期模式自动排期

| Field          | Value                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-003                                                                                |
| Source         | US-1 AC: 选择「固定周期」模式，设置 4 周周期                                              |
| Type           | UI                                                                                       |
| Target         | app/(tabs)/plan.tsx                                                                      |
| Priority       | P0                                                                                       |
| Pre-conditions | 用户在计划创建页面                                                                       |
| Steps          | 1. 选择「固定周期」模式 2. 设置周期为 4 周 3. 定义每周训练日 4. 保存                     |
| Expected       | App 生成 4 周完整排期，第 5 周自动重新开始                                                |

### TC-UI-004: 训练日日历显示今日训练类型

| Field          | Value                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-004                                                                                    |
| Source         | US-1 AC: 训练日当天，打开 App，日历上显示今日训练类型                                       |
| Type           | UI                                                                                           |
| Target         | app/(tabs)/calendar.tsx                                                                      |
| Priority       | P0                                                                                           |
| Pre-conditions | 有训练计划排期，今天是训练日                                                                 |
| Steps          | 1. 打开 App 到日历页 2. 观察今日日期格子                                                    |
| Expected       | 日历上今日显示训练类型标签，点击可进入训练执行页面                                           |

### TC-UI-005: 切换计划后日历重新排期

| Field          | Value                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| Test ID        | TC-UI-005                                                                                              |
| Source         | US-1 AC: 已有计划 A，创建并激活新计划 B                                                                 |
| Type           | UI                                                                                                     |
| Target         | app/(tabs)/plan.tsx, app/(tabs)/calendar.tsx                                                           |
| Priority       | P1                                                                                                     |
| Pre-conditions | 用户已有正在执行的计划 A                                                                                |
| Steps          | 1. 创建新计划 B 2. 激活计划 B                                                                          |
| Expected       | 日历清除计划 A 的排期，重新按计划 B 排期                                                                |

### TC-UI-006: 无休息日计划保存提示

| Field          | Value                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-006                                                                                    |
| Source         | US-1 AC: 定义 7 个训练日未包含休息日，保存计划时提示                                        |
| Type           | UI                                                                                           |
| Target         | app/(tabs)/plan.tsx                                                                          |
| Priority       | P2                                                                                           |
| Pre-conditions | 用户在计划创建/编辑页面                                                                      |
| Steps          | 1. 定义 7 个训练日（无休息日） 2. 点击保存                                                  |
| Expected       | 允许保存但显示提示「建议安排休息日」                                                         |

### TC-UI-007: 训练执行页面显示建议重量和目标组数

| Field          | Value                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------ |
| Test ID        | TC-UI-007                                                                                        |
| Source         | US-2 AC: 在训练执行页面，进入一个动作                                                            |
| Type           | UI                                                                                               |
| Target         | app/workout.tsx                                                                                  |
| Priority       | P0                                                                                               |
| Pre-conditions | 用户在训练执行页面，动作有历史训练记录                                                          |
| Steps          | 1. 进入训练执行页 2. 点击一个动作卡片展开                                                       |
| Expected       | 显示建议重量（预填充）和目标组数 x 次数                                                         |

### TC-UI-008: 完成本组后自动启动倒计时

| Field          | Value                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-008                                                                                    |
| Source         | US-2 AC: 完成一组，点击「完成本组」                                                           |
| Type           | UI                                                                                           |
| Target         | app/workout.tsx                                                                              |
| Priority       | P0                                                                                           |
| Pre-conditions | 用户在训练执行页面，正在进行某组训练                                                          |
| Steps          | 1. 输入次数 2. 点击「完成本组」                                                              |
| Expected       | 数据保存成功且自动启动组间倒计时（默认 180 秒）                                               |

### TC-UI-009: 倒计时到时振动和提示音

| Field          | Value                                                              |
| -------------- | ------------------------------------------------------------------ |
| Test ID        | TC-UI-009                                                          |
| Source         | US-2 AC: 组间倒计时到 0                                            |
| Type           | UI                                                                 |
| Target         | app/workout.tsx                                                    |
| Priority       | P0                                                                 |
| Pre-conditions | 组间倒计时进行中                                                   |
| Steps          | 1. 等待倒计时到 0                                                  |
| Expected       | 设备振动并播放提示音                                               |

### TC-UI-010: 倒计时中跳过

| Field          | Value                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-010                                                                                    |
| Source         | US-2 AC: 组间倒计时进行中，点击「跳过」                                                       |
| Type           | UI                                                                                           |
| Target         | app/workout.tsx                                                                              |
| Priority       | P1                                                                                           |
| Pre-conditions | 组间倒计时进行中                                                                             |
| Steps          | 1. 点击「跳过」按钮                                                                          |
| Expected       | 立即进入下一组记录                                                                           |

### TC-UI-011: 修改建议重量后标记为自定义

| Field          | Value                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-011                                                                                      |
| Source         | US-2 AC: 修改预填充的建议重量后完成本组                                                        |
| Type           | UI                                                                                             |
| Target         | app/workout.tsx                                                                                |
| Priority       | P1                                                                                             |
| Pre-conditions | 用户在训练执行页面，建议重量已预填充                                                           |
| Steps          | 1. 修改建议重量 2. 输入次数 3. 点击「完成本组」                                               |
| Expected       | 系统记录用户使用了自定义重量而非建议值                                                         |

### TC-UI-012: 每组记录操作次数不超过 2 次

| Field          | Value                                                                     |
| -------------- | ------------------------------------------------------------------------- |
| Test ID        | TC-UI-012                                                                 |
| Source         | US-2 AC: 记录一组数据，总操作次数 <= 2 次点击                             |
| Type           | UI                                                                        |
| Target         | app/workout.tsx                                                           |
| Priority       | P0                                                                        |
| Pre-conditions | 用户在训练执行页面                                                        |
| Steps          | 1. 确认建议重量（无需修改） 2. 点击「完成本组」                           |
| Expected       | 总操作次数 <= 2 次点击完成一组记录                                        |

### TC-UI-013: 额外组记录

| Field          | Value                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-013                                                                                      |
| Source         | US-2 AC: 完成所有目标组数后想做额外组                                                          |
| Type           | UI                                                                                             |
| Target         | app/workout.tsx                                                                                |
| Priority       | P1                                                                                             |
| Pre-conditions | 用户已完成某动作的所有目标组数                                                                 |
| Steps          | 1. 点击「加一组」                                                                             |
| Expected       | 允许继续记录额外组，额外组不影响加重判断                                                       |

### TC-UI-014: 中途退出训练数据保留

| Field          | Value                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-014                                                                                                |
| Source         | US-2 AC: 在第 3 组（共 5 组）时退出训练页面                                                              |
| Type           | UI                                                                                                       |
| Target         | app/workout.tsx                                                                                          |
| Priority       | P0                                                                                                       |
| Pre-conditions | 用户在训练执行页面，已完成 2 组动作                                                                      |
| Steps          | 1. 点击返回或退出按钮 2. 系统弹出确认 3. 用户确认退出                                                   |
| Expected       | 已完成的 2 组数据保留，未完成的动作标记为「未完成」                                                       |

### TC-UI-015: 后台返回恢复训练状态

| Field          | Value                                                                                                            |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-015                                                                                                        |
| Source         | US-2 AC: 接到来电导致 App 进入后台，通话结束后返回                                                               |
| Type           | UI                                                                                                               |
| Target         | app/workout.tsx                                                                                                  |
| Priority       | P0                                                                                                               |
| Pre-conditions | 用户在训练执行页面，倒计时运行中                                                                                 |
| Steps          | 1. 接到来电导致 App 进入后台 2. 通话结束 3. 返回 App                                                             |
| Expected       | 训练页面恢复到中断前的状态，倒计时继续运行或已结束待提醒                                                          |

### TC-UI-016: 查看进步曲线折线图

| Field          | Value                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-016                                                                                          |
| Source         | US-4 AC: 有 >= 2 次深蹲训练记录，查看深蹲进步曲线                                                 |
| Type           | UI                                                                                                 |
| Target         | app/(tabs)/history.tsx                                                                             |
| Priority       | P0                                                                                                 |
| Pre-conditions | 用户有 >= 2 次深蹲训练记录                                                                         |
| Steps          | 1. 进入历史页 2. 切换到「进步」面板 3. 选择深蹲                                                   |
| Expected       | 显示以日期为 X 轴、重量为 Y 轴的折线图                                                            |

### TC-UI-017: PR 提醒显示

| Field          | Value                                                                      |
| -------------- | -------------------------------------------------------------------------- |
| Test ID        | TC-UI-017                                                                  |
| Source         | US-4 AC: 打破历史最高重量，训练完成保存后                                  |
| Type           | UI                                                                         |
| Target         | app/workout.tsx, app/feeling.tsx                                           |
| Priority       | P0                                                                         |
| Pre-conditions | 用户刚打破深蹲历史最高重量                                                 |
| Steps          | 1. 完成训练并保存                                                          |
| Expected       | App 显示 PR 提醒「新个人记录！深蹲 140kg」                                 |

### TC-UI-018: 按训练类型筛选历史

| Field          | Value                                                                      |
| -------------- | -------------------------------------------------------------------------- |
| Test ID        | TC-UI-018                                                                  |
| Source         | US-4 AC: 查看训练历史列表，按训练类型筛选「推日」                          |
| Type           | UI                                                                         |
| Target         | app/(tabs)/history.tsx                                                     |
| Priority       | P1                                                                         |
| Pre-conditions | 用户有不同类型的训练记录                                                   |
| Steps          | 1. 进入历史页 2. 按训练类型筛选「推日」                                   |
| Expected       | 只显示推日训练记录                                                         |

### TC-UI-019: 月度容量趋势柱状图

| Field          | Value                                                                      |
| -------------- | -------------------------------------------------------------------------- |
| Test ID        | TC-UI-019                                                                  |
| Source         | US-4 AC: 查看容量趋势，选择月度视图                                        |
| Type           | UI                                                                         |
| Target         | app/(tabs)/history.tsx                                                     |
| Priority       | P1                                                                         |
| Pre-conditions | 用户有当月训练记录                                                         |
| Steps          | 1. 进入历史页 2. 切换到「容量」面板                                        |
| Expected       | 显示该月每次训练的总容量柱状图                                             |

### TC-UI-020: 单动作进步曲线

| Field          | Value                                                                          |
| -------------- | ------------------------------------------------------------------------------ |
| Test ID        | TC-UI-020                                                                      |
| Source         | US-4 AC: 只有一个训练动作有历史数据，查看进步曲线                              |
| Type           | UI                                                                             |
| Target         | app/(tabs)/history.tsx                                                         |
| Priority       | P2                                                                             |
| Pre-conditions | 只有一个训练动作有历史数据                                                     |
| Steps          | 1. 进入历史页 2. 切换到「进步」面板 3. 选择有数据的动作                        |
| Expected       | 正常显示该动作的曲线，无数据动作不显示                                         |

### TC-UI-021: 删除含 PR 记录后 PR 回退

| Field          | Value                                                                        |
| -------------- | ---------------------------------------------------------------------------- |
| Test ID        | TC-UI-021                                                                    |
| Source         | US-4 AC: 删除某次包含 PR 的训练记录后刷新 PR 列表                            |
| Type           | UI                                                                           |
| Target         | app/(tabs)/history.tsx                                                       |
| Priority       | P0                                                                           |
| Pre-conditions | 用户有包含 PR 的训练记录                                                     |
| Steps          | 1. 删除包含 PR 的训练记录 2. 刷新 PR 列表                                   |
| Expected       | PR 回退到上一次的历史最高值                                                   |

### TC-UI-022: 进步曲线缩放和滑动

| Field          | Value                                                                                  |
| -------------- | -------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-022                                                                              |
| Source         | US-4 AC: 进步曲线时间跨度超过 6 个月，数据点过多                                      |
| Type           | UI                                                                                     |
| Target         | app/(tabs)/history.tsx                                                                 |
| Priority       | P2                                                                                     |
| Pre-conditions | 用户有超过 6 个月的训练数据                                                            |
| Steps          | 1. 查看进步曲线 2. 尝试缩放和滑动                                                      |
| Expected       | 图表支持缩放和滑动浏览                                                                 |

### TC-UI-023: 感受记录页面显示

| Field          | Value                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-023                                                                                    |
| Source         | US-5 AC: 完成所有动作，进入感受记录页面                                                      |
| Type           | UI                                                                                           |
| Target         | app/feeling.tsx                                                                              |
| Priority       | P0                                                                                           |
| Pre-conditions | 用户完成所有训练动作                                                                         |
| Steps          | 1. 训练完成后自动进入感受记录页                                                              |
| Expected       | 显示疲劳度滑块（1-10）、满意度滑块（1-10）和各动作文本备注                                 |

### TC-UI-024: 高疲劳低满意训练标记

| Field          | Value                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-024                                                                                    |
| Source         | US-5 AC: 记录疲劳度 >= 8 且满意度 <= 4                                                      |
| Type           | UI                                                                                           |
| Target         | app/feeling.tsx                                                                              |
| Priority       | P1                                                                                           |
| Pre-conditions | 用户在感受记录页面                                                                           |
| Steps          | 1. 设置疲劳度 >= 8 2. 设置满意度 <= 4 3. 保存                                              |
| Expected       | 系统标记本次训练为「高疲劳低满意」，下次训练建议降低强度                                    |

### TC-UI-025: 感受默认值保存

| Field          | Value                                                                          |
| -------------- | ------------------------------------------------------------------------------ |
| Test ID        | TC-UI-025                                                                      |
| Source         | US-5 AC: 未填写感受直接保存                                                     |
| Type           | UI                                                                             |
| Target         | app/feeling.tsx                                                                |
| Priority       | P1                                                                             |
| Pre-conditions | 用户在感受记录页面                                                             |
| Steps          | 1. 不修改任何值直接点击保存                                                    |
| Expected       | 使用疲劳度和满意度默认值（5），文本备注为空                                    |

### TC-UI-026: 跳过动作后感受只显示已完成动作

| Field          | Value                                                                                  |
| -------------- | -------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-026                                                                              |
| Source         | US-5 AC: 跳过某些动作（训练中断），进入感受记录                                        |
| Type           | UI                                                                                     |
| Target         | app/feeling.tsx                                                                        |
| Priority       | P1                                                                                     |
| Pre-conditions | 用户在训练中跳过了某些动作                                                             |
| Steps          | 1. 训练完成（有动作被跳过） 2. 进入感受记录页                                          |
| Expected       | 只显示已完成的动作的感受备注区                                                         |

### TC-UI-027: 编辑历史训练感受

| Field          | Value                                                                                  |
| -------------- | -------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-027                                                                              |
| Source         | US-5 AC: 在训练历史中找到记录并点击编辑感受                                            |
| Type           | UI                                                                                     |
| Target         | app/(tabs)/history.tsx                                                                 |
| Priority       | P1                                                                                     |
| Pre-conditions | 用户有历史训练记录含感受数据                                                           |
| Steps          | 1. 找到历史训练记录 2. 点击编辑 3. 修改感受评分和备注 4. 保存                         |
| Expected       | 允许修改感受评分和备注，保存后更新                                                     |

### TC-UI-028: 日历训练类型标签显示

| Field          | Value                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-028                                                                                      |
| Source         | US-6 AC: 训练计划已排期，打开日历页面                                                          |
| Type           | UI                                                                                             |
| Target         | app/(tabs)/calendar.tsx                                                                        |
| Priority       | P0                                                                                             |
| Pre-conditions | 训练计划已排期                                                                                 |
| Steps          | 1. 打开日历页面                                                                                |
| Expected       | 每个训练日显示对应训练类型标签（推/拉/蹲）                                                     |

### TC-UI-029: 日历拖动调整训练日

| Field          | Value                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| Test ID        | TC-UI-029                                                                                              |
| Source         | US-6 AC: 将周三的「拉日」拖动到周四                                                                    |
| Type           | UI                                                                                                     |
| Target         | app/(tabs)/calendar.tsx                                                                                |
| Priority       | P1                                                                                                     |
| Pre-conditions | 训练计划已排期，周三为拉日                                                                             |
| Steps          | 1. 拖动周三的拉日到周四                                                                                |
| Expected       | 周三变为休息日，周四变为拉日，后续排期自动顺延                                                         |

### TC-UI-030: 点击已完成训练日显示详情

| Field          | Value                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-030                                                                                          |
| Source         | US-6 AC: 点击已完成的训练日，该日有训练记录                                                        |
| Type           | UI                                                                                                 |
| Target         | app/(tabs)/calendar.tsx                                                                            |
| Priority       | P0                                                                                                 |
| Pre-conditions | 用户有已完成的训练日                                                                               |
| Steps          | 1. 点击已完成的训练日期                                                                            |
| Expected       | 显示该日训练详情（动作、重量、容量、感受）                                                         |

### TC-UI-031: 点击未来训练日显示预览

| Field          | Value                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-031                                                                                    |
| Source         | US-6 AC: 点击未来的训练日，该日有训练安排                                                    |
| Type           | UI                                                                                           |
| Target         | app/(tabs)/calendar.tsx                                                                      |
| Priority       | P0                                                                                           |
| Pre-conditions | 有未来的训练日安排                                                                           |
| Steps          | 1. 点击未来的训练日                                                                          |
| Expected       | 显示训练计划预览，可点击「开始训练」                                                         |

### TC-UI-032: 跳过训练日

| Field          | Value                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| Test ID        | TC-UI-032                                                                                              |
| Source         | US-6 AC: 长按今天的训练日选择「跳过」                                                                  |
| Type           | UI                                                                                                     |
| Target         | app/(tabs)/calendar.tsx                                                                                |
| Priority       | P1                                                                                                     |
| Pre-conditions | 今天是训练日                                                                                           |
| Steps          | 1. 长按今天的训练日 2. 选择「跳过」                                                                    |
| Expected       | 该日标记为「已跳过」，训练日内容顺延到下一个可用日期                                                   |

### TC-UI-033: 连续跳过 3 次训练提示

| Field          | Value                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-033                                                                                                |
| Source         | US-6 AC: 已跳过 3 个连续训练日，第 4 个训练日到来时                                                      |
| Type           | UI                                                                                                       |
| Target         | app/(tabs)/calendar.tsx                                                                                  |
| Priority       | P2                                                                                                       |
| Pre-conditions | 用户已连续跳过 3 个训练日                                                                                |
| Steps          | 1. 第 4 个训练日到来时                                                                                   |
| Expected       | 显示提示「已连续跳过 3 次训练，是否需要调整计划？」                                                      |

### TC-UI-034: 取消跳过训练日

| Field          | Value                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| Test ID        | TC-UI-034                                                              |
| Source         | US-6 AC: 已跳过的训练日，取消跳过状态                                  |
| Type           | UI                                                                     |
| Target         | app/(tabs)/calendar.tsx                                                |
| Priority       | P2                                                                     |
| Pre-conditions | 用户有已跳过的训练日                                                   |
| Steps          | 1. 点击已跳过的训练日 2. 选择取消跳过                                 |
| Expected       | 恢复原排期                                                             |

### TC-UI-035: 其他运动类型选择

| Field          | Value                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-035                                                                                      |
| Source         | US-7 AC: 在日历上选择休息日，点击「记录其他运动」                                              |
| Type           | UI                                                                                             |
| Target         | app/other-sport.tsx                                                                            |
| Priority       | P1                                                                                             |
| Pre-conditions | 用户在日历上选择了一个休息日                                                                   |
| Steps          | 1. 选择休息日 2. 点击「记录其他运动」                                                          |
| Expected       | 显示运动类型选择                                                                               |

### TC-UI-036: 其他运动指标录入

| Field          | Value                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-036                                                                                          |
| Source         | US-7 AC: 选择「游泳」并配置指标，进入记录页面                                                     |
| Type           | UI                                                                                                 |
| Target         | app/other-sport.tsx                                                                                |
| Priority       | P1                                                                                                 |
| Pre-conditions | 用户选择了游泳运动类型                                                                             |
| Steps          | 1. 选择游泳 2. 观察录入表单                                                                       |
| Expected       | 显示距离、时间、趟数等对应输入字段                                                                 |

### TC-UI-037: 自定义运动类型

| Field          | Value                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-037                                                                                      |
| Source         | US-7 AC: 首次记录不在预设列表中的运动类型                                                       |
| Type           | UI                                                                                             |
| Target         | app/other-sport.tsx                                                                            |
| Priority       | P1                                                                                             |
| Pre-conditions | 用户想记录的运动类型不在预设列表中                                                              |
| Steps          | 1. 点击「自定义运动」 2. 输入运动名称和指标                                                    |
| Expected       | 用户可以自定义运动名称和指标                                                                   |

### TC-UI-038: 其他运动保存后日历标签

| Field          | Value                                                                            |
| -------------- | -------------------------------------------------------------------------------- |
| Test ID        | TC-UI-038                                                                        |
| Source         | US-7 AC: 完成其他运动记录并保存                                                  |
| Type           | UI                                                                               |
| Target         | app/other-sport.tsx, app/(tabs)/calendar.tsx                                     |
| Priority       | P1                                                                               |
| Pre-conditions | 用户正在录入其他运动数据                                                         |
| Steps          | 1. 填写运动数据 2. 点击保存                                                      |
| Expected       | 保存成功，日历上该日显示运动类型标签                                             |

### TC-UI-039: 同一天力量训练和其他运动并存

| Field          | Value                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| Test ID        | TC-UI-039                                                                                              |
| Source         | US-7 AC: 同一天已完成力量训练，还想记录游泳                                                             |
| Type           | UI                                                                                                     |
| Target         | app/(tabs)/calendar.tsx, app/other-sport.tsx                                                           |
| Priority       | P1                                                                                                     |
| Pre-conditions | 用户今天已完成力量训练                                                                                 |
| Steps          | 1. 在日历点击今天 2. 选择记录其他运动 3. 保存                                                         |
| Expected       | 允许同一天既记录力量训练又记录其他运动，日历上两个标签并列显示                                         |

### TC-UI-040: 自定义运动类型复用

| Field          | Value                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-040                                                                                    |
| Source         | US-7 AC: 之前自定义了「登山」并配置了指标，再次选择「登山」                                  |
| Type           | UI                                                                                           |
| Target         | app/other-sport.tsx                                                                          |
| Priority       | P2                                                                                           |
| Pre-conditions | 用户之前自定义了运动类型「登山」                                                             |
| Steps          | 1. 再次选择「登山」                                                                         |
| Expected       | 自动加载之前的指标配置，无需重新设置                                                         |

### TC-UI-041: 身体数据录入页面

| Field          | Value                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-041                                                                                                  |
| Source         | US-8 AC: 点击「记录身体数据」，进入录入页面                                                                |
| Type           | UI                                                                                                         |
| Target         | app/body-data.tsx                                                                                          |
| Priority       | P0                                                                                                         |
| Pre-conditions | 用户点击「记录身体数据」                                                                                   |
| Steps          | 1. 进入录入页面 2. 观察输入字段                                                                            |
| Expected       | 显示日期（默认今天）、体重、胸围、腰围、臂围、大腿围输入框                                                 |

### TC-UI-042: 体重趋势折线图

| Field          | Value                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-042                                                                                      |
| Source         | US-8 AC: 有 >= 2 次体重记录，查看体重趋势图                                                   |
| Type           | UI                                                                                             |
| Target         | app/body-data.tsx                                                                              |
| Priority       | P1                                                                                             |
| Pre-conditions | 用户有 >= 2 次体重记录                                                                         |
| Steps          | 1. 点击「趋势图」 2. 选择体重指标                                                             |
| Expected       | 显示以日期为 X 轴、体重为 Y 轴的折线图                                                        |

### TC-UI-043: 只填写体重保存

| Field          | Value                                                                          |
| -------------- | ------------------------------------------------------------------------------ |
| Test ID        | TC-UI-043                                                                      |
| Source         | US-8 AC: 只填写了体重未填围度                                                  |
| Type           | UI                                                                             |
| Target         | app/body-data.tsx                                                              |
| Priority       | P1                                                                             |
| Pre-conditions | 用户在身体数据录入页面                                                         |
| Steps          | 1. 只填写体重 2. 保存                                                          |
| Expected       | 只保存体重，未填写的围度不记录                                                 |

### TC-UI-044: 录入历史日期身体数据

| Field          | Value                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-044                                                                                |
| Source         | US-8 AC: 录入过去某天的身体数据                                                          |
| Type           | UI                                                                                       |
| Target         | app/body-data.tsx                                                                        |
| Priority       | P1                                                                                       |
| Pre-conditions | 用户在身体数据录入页面                                                                   |
| Steps          | 1. 选择一个历史日期 2. 填写数据 3. 保存                                                 |
| Expected       | 数据插入到正确的时间位置，趋势图按时间排序                                               |

### TC-UI-045: 编辑身体数据后趋势图更新

| Field          | Value                                                                                  |
| -------------- | -------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-045                                                                              |
| Source         | US-8 AC: 修改之前录入的身体数据                                                        |
| Type           | UI                                                                                     |
| Target         | app/body-data.tsx                                                                      |
| Priority       | P2                                                                                     |
| Pre-conditions | 用户有历史身体数据记录                                                                 |
| Steps          | 1. 在历史记录中找到记录 2. 点击编辑 3. 修改数据 4. 保存                               |
| Expected       | 允许修改，保存后趋势图自动更新                                                         |

### TC-UI-046: 动作库分类列表

| Field          | Value                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| Test ID        | TC-UI-046                                                                                                          |
| Source         | US-9 AC: 打开动作库，显示分类列表                                                                                  |
| Type           | UI                                                                                                                 |
| Target         | app/exercise-library.tsx                                                                                           |
| Priority       | P0                                                                                                                 |
| Pre-conditions | 用户打开动作库                                                                                                     |
| Steps          | 1. 打开动作库                                                                                                      |
| Expected       | 显示分类列表（核心力量举、上肢推、上肢拉、下肢、核心、肩部、自定义）                                               |

### TC-UI-047: 动作默认加重增量

| Field          | Value                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-047                                                                                      |
| Source         | US-9 AC: 选择「深蹲」添加到训练日                                                              |
| Type           | UI                                                                                             |
| Target         | app/(tabs)/plan.tsx, app/exercise-library.tsx                                                  |
| Priority       | P0                                                                                             |
| Pre-conditions | 用户在计划编辑中从动作库选择动作                                                               |
| Steps          | 1. 选择「深蹲」添加到训练日                                                                    |
| Expected       | 使用深蹲的默认加重增量（5kg）和默认休息时间（180 秒）                                          |

### TC-UI-048: 自定义动作创建

| Field          | Value                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-048                                                                                      |
| Source         | US-9 AC: 需要的动作不在内置库中，点击「自定义动作」                                            |
| Type           | UI                                                                                             |
| Target         | app/exercise-library.tsx                                                                       |
| Priority       | P1                                                                                             |
| Pre-conditions | 用户打开动作库                                                                                 |
| Steps          | 1. 点击「自定义动作」 2. 输入名称、选择分类、设置加重增量和休息时间                            |
| Expected       | 可以自定义动作并保存                                                                           |

### TC-UI-049: 自定义动作出现在动作库

| Field          | Value                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-049                                                                                      |
| Source         | US-9 AC: 自定义了动作，下次创建计划时                                                          |
| Type           | UI                                                                                             |
| Target         | app/exercise-library.tsx                                                                       |
| Priority       | P1                                                                                             |
| Pre-conditions | 用户之前创建了自定义动作                                                                       |
| Steps          | 1. 打开动作库 2. 查看「自定义」分类                                                            |
| Expected       | 自定义动作出现在动作库的「自定义」分类中                                                       |

### TC-UI-050: 修改内置动作加重增量

| Field          | Value                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| Test ID        | TC-UI-050                                                                                              |
| Source         | US-9 AC: 修改内置动作「深蹲」的默认加重增量                                                            |
| Type           | UI                                                                                                     |
| Target         | app/exercise-library.tsx, app/exercise-detail.tsx                                                      |
| Priority       | P1                                                                                                     |
| Pre-conditions | 用户在动作详情页                                                                                       |
| Steps          | 1. 点击深蹲 2. 点击编辑 3. 修改增量从 5kg 到 2.5kg 4. 保存                                            |
| Expected       | 允许修改增量，修改后的值覆盖默认值                                                                     |

### TC-UI-051: 删除使用中的自定义动作

| Field          | Value                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| Test ID        | TC-UI-051                                                                                                    |
| Source         | US-9 AC: 删除已在训练计划中使用的自定义动作                                                                  |
| Type           | UI                                                                                                           |
| Target         | app/exercise-library.tsx                                                                                     |
| Priority       | P1                                                                                                           |
| Pre-conditions | 用户有自定义动作正在某训练计划中使用                                                                         |
| Steps          | 1. 尝试删除该自定义动作                                                                                      |
| Expected       | 提示「该动作正在使用中，确认删除？」，确认后从计划中移除                                                      |

### TC-UI-052: 查看动作详情摘要

| Field          | Value                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-052                                                                                          |
| Source         | US-9 AC: 点击动作名称查看详情                                                                      |
| Type           | UI                                                                                                 |
| Target         | app/exercise-detail.tsx                                                                            |
| Priority       | P1                                                                                                 |
| Pre-conditions | 用户在动作库页面                                                                                   |
| Steps          | 1. 点击动作名称                                                                                    |
| Expected       | 显示该动作的历史训练记录摘要（最近 5 次、PR、总训练次数）                                          |

### TC-UI-053: 中途退出确认对话框

| Field          | Value                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-053                                                                                |
| Source         | US-10 AC: 完成 3 个动作中的 2 个，点击返回或退出按钮                                     |
| Type           | UI                                                                                       |
| Target         | app/workout.tsx                                                                          |
| Priority       | P0                                                                                       |
| Pre-conditions | 用户在训练执行页面，已完成 2/3 个动作                                                   |
| Steps          | 1. 点击返回或退出按钮                                                                    |
| Expected       | 弹出确认对话框「已完成 2/3 动作，确定结束训练？」                                        |

### TC-UI-054: 中途退出数据保存

| Field          | Value                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-054                                                                                      |
| Source         | US-10 AC: 确认退出后保存数据                                                                   |
| Type           | UI                                                                                             |
| Target         | app/workout.tsx                                                                                |
| Priority       | P0                                                                                             |
| Pre-conditions | 用户确认中途退出训练                                                                           |
| Steps          | 1. 确认退出                                                                                    |
| Expected       | 已完成的动作数据正常保存，未完成的动作标记为「未完成」                                         |

### TC-UI-055: 部分完成训练日日历显示

| Field          | Value                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-055                                                                                          |
| Source         | US-10 AC: 中途退出的训练，在日历上查看该日                                                         |
| Type           | UI                                                                                                 |
| Target         | app/(tabs)/calendar.tsx                                                                            |
| Priority       | P0                                                                                                 |
| Pre-conditions | 用户有中途退出的训练记录                                                                           |
| Steps          | 1. 在日历上查看该训练日                                                                            |
| Expected       | 显示「已完成（部分）」状态（status: completed_partial）                                            |

### TC-UI-056: 后台计时器持续运行

| Field          | Value                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| Test ID        | TC-UI-056                                                                                              |
| Source         | US-11 AC: 组间倒计时中切换到其他 App，倒计时剩余 90 秒                                                |
| Type           | UI                                                                                                     |
| Target         | app/workout.tsx, src/services/timer.ts                                                                 |
| Priority       | P0                                                                                                     |
| Pre-conditions | 组间倒计时进行中，剩余 90 秒                                                                          |
| Steps          | 1. 切换到其他 App 2. 观察倒计时行为                                                                   |
| Expected       | 计时器在后台继续倒计时                                                                               |

### TC-UI-057: 后台倒计时结束通知

| Field          | Value                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-057                                                                                      |
| Source         | US-11 AC: 后台倒计时结束，用户在其他 App 或锁屏状态                                            |
| Type           | UI                                                                                             |
| Target         | src/services/timer.ts                                                                          |
| Priority       | P0                                                                                             |
| Pre-conditions | 后台倒计时即将结束                                                                             |
| Steps          | 1. 等待倒计时结束                                                                              |
| Expected       | 系统通知栏显示「休息结束，开始下一组！」                                                       |

### TC-UI-058: 点击通知返回训练页

| Field          | Value                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-058                                                                                      |
| Source         | US-11 AC: 点击通知返回 App                                                                     |
| Type           | UI                                                                                             |
| Target         | app/workout.tsx                                                                                |
| Priority       | P0                                                                                             |
| Pre-conditions | 后台倒计时已结束，通知已发送                                                                   |
| Steps          | 1. 点击通知                                                                                    |
| Expected       | 训练页面恢复，显示「开始下一组」按钮，倒计时显示 00:00                                        |

### TC-UI-059: 锁屏倒计时提醒

| Field          | Value                                                              |
| -------------- | ------------------------------------------------------------------ |
| Test ID        | TC-UI-059                                                          |
| Source         | US-11 AC: 倒计时中锁屏，倒计时结束                                |
| Type           | UI                                                                 |
| Target         | src/services/timer.ts                                              |
| Priority       | P0                                                                 |
| Pre-conditions | 用户锁屏且倒计时运行中                                             |
| Steps          | 1. 锁屏 2. 等待倒计时结束                                         |
| Expected       | 锁屏界面显示提醒通知                                               |

### TC-UI-060: 通话结束后超时提醒

| Field          | Value                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-060                                                                                                |
| Source         | US-11 AC: 倒计时中接到电话，通话 5 分钟                                                                  |
| Type           | UI                                                                                                       |
| Target         | src/services/timer.ts, app/workout.tsx                                                                   |
| Priority       | P1                                                                                                       |
| Pre-conditions | 倒计时运行中，用户接到来电                                                                               |
| Steps          | 1. 接到电话 2. 通话 5 分钟（远超倒计时） 3. 通话结束                                                     |
| Expected       | 显示提醒「休息时间已过，准备好了就开始下一组」                                                           |

### TC-UI-061: 强制关闭后恢复计时器

| Field          | Value                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| Test ID        | TC-UI-061                                                                                              |
| Source         | US-11 AC: 强制关闭 App，倒计时还在运行，重新打开 App                                                   |
| Type           | UI                                                                                                     |
| Target         | src/services/timer.ts, app/workout.tsx                                                                 |
| Priority       | P0                                                                                                     |
| Pre-conditions | 倒计时运行中，App 被强制关闭                                                                           |
| Steps          | 1. 重新打开 App                                                                                        |
| Expected       | 训练页面恢复，倒计时状态根据实际经过时间计算（已过则显示超时提示）                                     |

### TC-UI-062: 编辑历史训练记录

| Field          | Value                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-062                                                                                                |
| Source         | US-12 AC: 查看训练历史，点击某次训练记录                                                                 |
| Type           | UI                                                                                                       |
| Target         | app/(tabs)/history.tsx                                                                                   |
| Priority       | P0                                                                                                       |
| Pre-conditions | 用户有历史训练记录                                                                                       |
| Steps          | 1. 点击训练记录 2. 观察详情页                                                                           |
| Expected       | 显示该次训练详细数据，包含「编辑」和「删除」按钮                                                         |

### TC-UI-063: 编辑记录后加重建议重算

| Field          | Value                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-063                                                                                                |
| Source         | US-12 AC: 点击「编辑」，修改某组的重量或次数                                                             |
| Type           | UI                                                                                                       |
| Target         | app/(tabs)/history.tsx                                                                                   |
| Priority       | P0                                                                                                       |
| Pre-conditions | 用户在历史训练详情页                                                                                     |
| Steps          | 1. 点击「编辑」 2. 修改重量或次数 3. 保存                                                               |
| Expected       | 保存后加重建议基于修改后的数据重新计算                                                                   |

### TC-UI-064: 删除训练记录

| Field          | Value                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-064                                                                                          |
| Source         | US-12 AC: 点击「删除」，确认删除                                                                   |
| Type           | UI                                                                                                 |
| Target         | app/(tabs)/history.tsx                                                                             |
| Priority       | P0                                                                                                 |
| Pre-conditions | 用户在历史训练详情页                                                                               |
| Steps          | 1. 点击「删除」 2. 确认删除                                                                       |
| Expected       | 训练记录及所有组数据被删除，加重建议回退到上一次训练的数据                                          |

### TC-UI-065: 删除含 PR 记录后 PR 回退

| Field          | Value                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-065                                                                                |
| Source         | US-12 AC: 删除了包含 PR 的训练记录                                                       |
| Type           | UI                                                                                       |
| Target         | app/(tabs)/history.tsx                                                                   |
| Priority       | P0                                                                                       |
| Pre-conditions | 用户删除了包含 PR 的训练记录                                                             |
| Steps          | 1. 删除含 PR 的训练记录 2. 刷新 PR 列表                                                 |
| Expected       | PR 回退到上一次的历史最高值                                                               |

### TC-UI-066: 编辑感受后训练建议更新

| Field          | Value                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-066                                                                                          |
| Source         | US-12 AC: 编辑了训练记录中的感受数据                                                                |
| Type           | UI                                                                                                 |
| Target         | app/(tabs)/history.tsx                                                                             |
| Priority       | P1                                                                                                 |
| Pre-conditions | 用户编辑了历史训练的感受数据                                                                       |
| Steps          | 1. 编辑感受数据 2. 保存                                                                           |
| Expected       | 感受相关的训练建议（如降低强度）相应更新                                                           |

### TC-UI-067: 补录过去训练记录

| Field          | Value                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-067                                                                                                |
| Source         | US-13 AC: 在日历上选择过去的无训练日期                                                                   |
| Type           | UI                                                                                                       |
| Target         | app/(tabs)/calendar.tsx, app/workout.tsx                                                                 |
| Priority       | P1                                                                                                       |
| Pre-conditions | 用户在日历页面，选择了过去无训练的日期                                                                  |
| Steps          | 1. 选择过去日期 2. 点击「补录训练」                                                                     |
| Expected       | 显示「补录训练」选项                                                                                     |

### TC-UI-068: 补录训练无倒计时

| Field          | Value                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-068                                                                                          |
| Source         | US-13 AC: 选择补录训练，进入训练记录流程                                                           |
| Type           | UI                                                                                                 |
| Target         | app/workout.tsx                                                                                    |
| Priority       | P1                                                                                                 |
| Pre-conditions | 用户在补录训练流程中                                                                               |
| Steps          | 1. 选择训练类型和动作 2. 开始录入                                                                  |
| Expected       | 进入正常的训练记录流程但无倒计时                                                                   |

### TC-UI-069: 补录记录参与加重建议

| Field          | Value                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-069                                                                                          |
| Source         | US-13 AC: 补录训练保存成功，该记录参与加重建议计算                                                 |
| Type           | UI                                                                                                 |
| Target         | app/workout.tsx                                                                                    |
| Priority       | P0                                                                                                 |
| Pre-conditions | 用户完成补录训练                                                                                   |
| Steps          | 1. 填写训练数据 2. 保存                                                                           |
| Expected       | 该记录按日期插入到历史中，参与加重建议计算                                                         |

### TC-UI-070: 数据导出功能

| Field          | Value                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-070                                                                                                |
| Source         | US-14 AC: 在设置中点击「导出数据」                                                                       |
| Type           | UI                                                                                                       |
| Target         | app/(tabs)/settings.tsx                                                                                  |
| Priority       | P1                                                                                                       |
| Pre-conditions | 用户在设置页                                                                                             |
| Steps          | 1. 点击「导出数据」 2. 选择导出范围（全部/最近 3 个月/最近半年）                                        |
| Expected       | 生成包含训练记录、身体数据、其他运动记录的导出文件                                                       |

### TC-UI-071: 导出完成分享选项

| Field          | Value                                                              |
| -------------- | ------------------------------------------------------------------ |
| Test ID        | TC-UI-071                                                          |
| Source         | US-14 AC: 导出完成，文件生成成功                                   |
| Type           | UI                                                                 |
| Target         | app/(tabs)/settings.tsx                                            |
| Priority       | P1                                                                 |
| Pre-conditions | 数据导出文件已生成                                                 |
| Steps          | 1. 导出完成后观察                                                  |
| Expected       | 提供分享选项（邮件、云盘、本地保存）                               |

### TC-UI-072: 导出数据结构化格式

| Field          | Value                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-072                                                                                          |
| Source         | US-14 AC: 导出的文件，用户在电脑上打开                                                             |
| Type           | UI                                                                                                 |
| Target         | app/(tabs)/settings.tsx                                                                            |
| Priority       | P1                                                                                                 |
| Pre-conditions | 用户已导出数据文件                                                                                 |
| Steps          | 1. 在电脑上打开导出文件                                                                            |
| Expected       | 数据以结构化格式呈现，包含所有训练详情（日期、动作、组数、重量、次数、感受）                       |

### TC-UI-073: 重量单位切换 kg 到 lbs

| Field          | Value                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| Test ID        | TC-UI-073                                                                                              |
| Source         | US-15 AC: 当前使用 kg，在设置中切换为 lbs                                                              |
| Type           | UI                                                                                                     |
| Target         | app/(tabs)/settings.tsx                                                                                |
| Priority       | P0                                                                                                     |
| Pre-conditions | 用户当前使用 kg 单位                                                                                   |
| Steps          | 1. 在设置中切换为 lbs                                                                                  |
| Expected       | 所有已记录的数据自动转换为 lbs 显示（1kg = 2.2046lbs）                                                |

### TC-UI-074: lbs 单位下录入数据

| Field          | Value                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-074                                                                                      |
| Source         | US-15 AC: 切换为 lbs 后录入数据                                                                |
| Type           | UI                                                                                             |
| Target         | app/workout.tsx                                                                                |
| Priority       | P0                                                                                             |
| Pre-conditions | 用户已切换为 lbs 单位                                                                         |
| Steps          | 1. 录入训练数据（lbs 单位） 2. 保存                                                           |
| Expected       | 数据以原始录入单位存储，显示时按当前设置单位转换                                               |

### TC-UI-075: lbs 加重增量选项

| Field          | Value                                                                              |
| -------------- | ---------------------------------------------------------------------------------- |
| Test ID        | TC-UI-075                                                                          |
| Source         | US-15 AC: 使用 lbs 设置，加重增量为 5lbs                                           |
| Type           | UI                                                                                 |
| Target         | app/(tabs)/settings.tsx, app/exercise-detail.tsx                                   |
| Priority       | P1                                                                                 |
| Pre-conditions | 用户使用 lbs 单位                                                                  |
| Steps          | 1. 查看加重增量选项                                                                |
| Expected       | 增量选项适应 lbs 单位（如 1/2.5/5/10 lbs）                                        |

### TC-UI-076: lbs 加重建议取整

| Field          | Value                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-076                                                                                      |
| Source         | US-15 AC: 使用磅，加重建议生成                                                                 |
| Type           | UI                                                                                             |
| Target         | app/workout.tsx                                                                                |
| Priority       | P1                                                                                             |
| Pre-conditions | 用户使用 lbs 单位，有加重建议                                                                  |
| Steps          | 1. 查看加重建议值                                                                              |
| Expected       | 建议值以磅为单位显示，且取整到常用的杠铃片组合                                                 |

### TC-UI-077: 训练中拖动调整动作顺序

| Field          | Value                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-077                                                                                          |
| Source         | US-16 AC: 在训练执行页面，长按未开始的动作卡片                                                     |
| Type           | UI                                                                                                 |
| Target         | app/workout.tsx                                                                                    |
| Priority       | P1                                                                                                 |
| Pre-conditions | 用户在训练执行页面                                                                                 |
| Steps          | 1. 长按某个未开始的动作卡片 2. 拖动调整顺序                                                       |
| Expected       | 动作卡片可拖动，顺序可调整                                                                         |

### TC-UI-078: 跳过动作

| Field          | Value                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-078                                                                                      |
| Source         | US-16 AC: 想跳过某个动作，向左滑动动作卡片                                                     |
| Type           | UI                                                                                             |
| Target         | app/workout.tsx                                                                                |
| Priority       | P1                                                                                             |
| Pre-conditions | 用户在训练执行页面                                                                             |
| Steps          | 1. 向左滑动动作卡片 2. 点击「跳过」                                                            |
| Expected       | 显示「跳过」选项，确认后该动作标记为「已跳过」                                                 |

### TC-UI-079: 跳过动作不参与加重

| Field          | Value                                                                      |
| -------------- | -------------------------------------------------------------------------- |
| Test ID        | TC-UI-079                                                                  |
| Source         | US-16 AC: 跳过了某个动作，训练结束                                         |
| Type           | UI                                                                         |
| Target         | app/workout.tsx                                                            |
| Priority       | P1                                                                         |
| Pre-conditions | 用户跳过了某动作并完成训练                                                 |
| Steps          | 1. 完成训练 2. 查看加重建议                                                |
| Expected       | 跳过的动作不参与加重建议计算                                               |

### TC-UI-080: 取消跳过动作

| Field          | Value                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| Test ID        | TC-UI-080                                                              |
| Source         | US-16 AC: 跳过某动作后又想补做                                         |
| Type           | UI                                                                     |
| Target         | app/workout.tsx                                                        |
| Priority       | P2                                                                     |
| Pre-conditions | 用户已跳过某动作                                                       |
| Steps          | 1. 点击已跳过的动作                                                    |
| Expected       | 可以取消跳过并开始记录                                                 |

### TC-UI-081: 同一动作多次出现

| Field          | Value                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-081                                                                                      |
| Source         | US-17 AC: 在计划中添加了「深蹲」，再次添加「深蹲」                                             |
| Type           | UI                                                                                             |
| Target         | app/(tabs)/plan.tsx                                                                            |
| Priority       | P1                                                                                             |
| Pre-conditions | 用户在计划编辑页面                                                                             |
| Steps          | 1. 添加「深蹲」到训练日 2. 再次添加「深蹲」                                                   |
| Expected       | 允许添加，两次出现独立记录加重建议                                                             |

### TC-UI-082: 同一动作备注区分

| Field          | Value                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-082                                                                                      |
| Source         | US-17 AC: 想区分两次深蹲，添加备注（如「暂停深蹲」）                                           |
| Type           | UI                                                                                             |
| Target         | app/(tabs)/plan.tsx                                                                            |
| Priority       | P1                                                                                             |
| Pre-conditions | 用户在同一训练日添加了同一动作两次                                                             |
| Steps          | 1. 为第二次深蹲添加备注「暂停深蹲」                                                           |
| Expected       | 训练页面显示备注区分（如「深蹲 #1」、「深蹲 #2 - 暂停深蹲」）                                 |

### TC-UI-083: 同一动作独立加重建议

| Field          | Value                                                                              |
| -------------- | ---------------------------------------------------------------------------------- |
| Test ID        | TC-UI-083                                                                          |
| Source         | US-17 AC: 同一动作出现两次，加重建议计算                                           |
| Type           | UI                                                                                 |
| Target         | app/workout.tsx                                                                    |
| Priority       | P1                                                                                 |
| Pre-conditions | 同一动作在同一天出现两次                                                           |
| Steps          | 1. 查看两次动作的加重建议                                                          |
| Expected       | 两次独立计算加重建议，互不影响                                                     |

### TC-UI-084: 首次使用欢迎引导

| Field          | Value                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-084                                                                                      |
| Source         | US-18 AC: 首次打开 App，没有任何训练数据                                                       |
| Type           | UI                                                                                             |
| Target         | app/onboarding.tsx                                                                             |
| Priority       | P0                                                                                             |
| Pre-conditions | 用户首次打开 App，无任何训练数据                                                               |
| Steps          | 1. 首次打开 App                                                                                |
| Expected       | 显示简短的欢迎引导（3-4 步），介绍核心概念（计划->训练->记录->进步）                           |

### TC-UI-085: 引导后模板推荐

| Field          | Value                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-085                                                                                          |
| Source         | US-18 AC: 引导结束后，进入创建计划流程                                                             |
| Type           | UI                                                                                                 |
| Target         | app/onboarding.tsx                                                                                 |
| Priority       | P0                                                                                                 |
| Pre-conditions | 引导已完成                                                                                         |
| Steps          | 1. 引导结束进入创建计划流程                                                                        |
| Expected       | 提供计划模板推荐（如「推/拉/蹲 3 日循环」），用户可选择模板快速创建或自定义                       |

### TC-UI-086: 模板动作预填充

| Field          | Value                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-086                                                                                      |
| Source         | US-18 AC: 选择模板创建计划，进入动作配置                                                        |
| Type           | UI                                                                                             |
| Target         | app/onboarding.tsx                                                                             |
| Priority       | P1                                                                                             |
| Pre-conditions | 用户选择了模板创建计划                                                                         |
| Steps          | 1. 选择模板 2. 进入动作配置                                                                    |
| Expected       | 动作已预填充常见动作和加重增量，用户只需调整重量即可                                           |

### TC-UI-087: 设置中重新查看新手引导

| Field          | Value                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-087                                                                                      |
| Source         | US-18 AC: 跳过引导直接使用，再次打开 App 在设置中找到「新手引导」                              |
| Type           | UI                                                                                             |
| Target         | app/(tabs)/settings.tsx                                                                        |
| Priority       | P2                                                                                             |
| Pre-conditions | 用户之前跳过了引导                                                                             |
| Steps          | 1. 进入设置页 2. 点击「新手引导」                                                              |
| Expected       | 可在设置中找到「新手引导」重新查看                                                             |

### TC-UI-088: 统计概览 Hero 卡片

| Field          | Value                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-088                                                                                      |
| Source         | PRD 5.10: 统计概览 Hero 卡片展示                                                               |
| Type           | UI                                                                                             |
| Target         | app/(tabs)/stats.tsx                                                                           |
| Priority       | P0                                                                                             |
| Pre-conditions | 用户有训练记录                                                                                 |
| Steps          | 1. 进入统计页（Tab 4） 2. 查看 Hero 卡片                                                      |
| Expected       | 显示本周训练总容量 + 周环比变化百分比（上升绿色/下降红色）                                     |

### TC-UI-089: 统计概览四宫格

| Field          | Value                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-089                                                                                      |
| Source         | PRD 5.10: 统计概览四宫格汇总                                                                   |
| Type           | UI                                                                                             |
| Target         | app/(tabs)/stats.tsx                                                                           |
| Priority       | P0                                                                                             |
| Pre-conditions | 用户有训练记录                                                                                 |
| Steps          | 1. 查看四宫格汇总卡片                                                                          |
| Expected       | 展示本周训练次数（含目标）、本月训练次数（含连续周数）、本周训练时长、本月新增 PR               |

### TC-UI-090: 统计概览无数据状态

| Field          | Value                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| Test ID        | TC-UI-090                                                              |
| Source         | PRD 5.10: 无数据状态                                                   |
| Type           | UI                                                                     |
| Target         | app/(tabs)/stats.tsx                                                   |
| Priority       | P1                                                                     |
| Pre-conditions | 用户无任何训练记录                                                     |
| Steps          | 1. 进入统计页                                                          |
| Expected       | 显示提示「完成你的第一次训练」                                         |

### TC-UI-091: 设置页列表显示

| Field          | Value                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| Test ID        | TC-UI-091                                                              |
| Source         | PRD 5.11: 设置页分组列表                                               |
| Type           | UI                                                                     |
| Target         | app/(tabs)/settings.tsx                                                |
| Priority       | P0                                                                     |
| Pre-conditions | 用户进入设置页                                                         |
| Steps          | 1. 进入设置页（Tab 5）                                                 |
| Expected       | 显示应用信息 + 分组设置列表（训练设置、提醒、数据管理、关于）         |

### TC-UI-092: 清除数据二次确认

| Field          | Value                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------- |
| Test ID        | TC-UI-092                                                                                    |
| Source         | PRD 5.11: 清除所有数据操作                                                                   |
| Type           | UI                                                                                           |
| Target         | app/(tabs)/settings.tsx                                                                      |
| Priority       | P0                                                                                           |
| Pre-conditions | 用户在设置页                                                                                 |
| Steps          | 1. 点击「清除所有数据」                                                                      |
| Expected       | 底部弹出警告面板，提示不可撤销，需二次确认                                                   |

---

## Type: API

### TC-API-001: 加重建议 - 所有组完成目标次数

| Field          | Value                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-API-001                                                                                               |
| Source         | US-3 AC: 上次深蹲所有组均完成目标次数                                                                     |
| Type           | API                                                                                                      |
| Target         | src/services/progressive-overload.ts                                                                     |
| Priority       | P0                                                                                                       |
| Pre-conditions | 上次深蹲所有组均完成目标次数，深蹲加重增量为 5kg                                                         |
| Steps          | 1. 加载本次训练深蹲 2. 查看建议重量                                                                      |
| Expected       | 建议重量 = 上次重量 + 深蹲的加重增量（5kg）                                                              |

### TC-API-002: 加重建议 - 部分组未完成

| Field          | Value                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| Test ID        | TC-API-002                                                                                             |
| Source         | US-3 AC: 上次卧推有 1 组未完成目标次数                                                                 |
| Type           | API                                                                                                    |
| Target         | src/services/progressive-overload.ts                                                                   |
| Priority       | P0                                                                                                     |
| Pre-conditions | 上次卧推有 1 组未完成目标次数                                                                          |
| Steps          | 1. 加载本次训练卧推 2. 查看建议重量                                                                    |
| Expected       | 建议重量 = 上次相同重量（不加不减）                                                                    |

### TC-API-003: 加重建议 - 连续两次未完成建议减重

| Field          | Value                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-API-003                                                                                                 |
| Source         | US-3 AC: 卧推连续 2 次训练均有组未完成                                                                     |
| Type           | API                                                                                                        |
| Target         | src/services/progressive-overload.ts                                                                       |
| Priority       | P0                                                                                                         |
| Pre-conditions | 卧推连续 2 次训练均有组未完成                                                                              |
| Steps          | 1. 加载本次训练卧推 2. 查看建议重量                                                                        |
| Expected       | 建议减重 10% 并提示用户                                                                                    |

### TC-API-004: 各动作独立加重增量

| Field          | Value                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| Test ID        | TC-API-004                                                                                             |
| Source         | US-3 AC: 深蹲加重增量 5kg，卧推加重增量 2.5kg，两个动作均达标                                          |
| Type           | API                                                                                                    |
| Target         | src/services/progressive-overload.ts                                                                   |
| Priority       | P0                                                                                                     |
| Pre-conditions | 深蹲和卧推各有独立的加重增量                                                                            |
| Steps          | 1. 加载训练动作 2. 查看各自的加重建议                                                                   |
| Expected       | 各自按自己的增量加重（深蹲 +5kg，卧推 +2.5kg）                                                          |

### TC-API-005: 用户修改建议重量不影响下次建议

| Field          | Value                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-API-005                                                                                               |
| Source         | US-3 AC: 用户手动修改为目标重量                                                                          |
| Type           | API                                                                                                     |
| Target         | src/services/progressive-overload.ts                                                                     |
| Priority       | P0                                                                                                      |
| Pre-conditions | 加重建议已生成，用户修改了建议重量                                                                       |
| Steps          | 1. 用户修改建议重量 2. 完成训练 3. 查看下次建议                                                          |
| Expected       | 使用用户修改的值，但下次建议仍基于实际完成情况计算                                                       |

### TC-API-006: 新动作建议重量为空

| Field          | Value                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------- |
| Test ID        | TC-API-006                                                                                         |
| Source         | US-3 AC: 某动作从未训练过（无历史记录）                                                            |
| Type           | API                                                                                                |
| Target         | src/services/progressive-overload.ts                                                               |
| Priority       | P0                                                                                                 |
| Pre-conditions | 动作无历史训练记录                                                                                 |
| Steps          | 1. 加载该动作 2. 查看建议重量                                                                      |
| Expected       | 建议重量为空，提示用户输入初始重量，不强制要求                                                     |

### TC-API-007: 减重取整到可用杠铃片组合

| Field          | Value                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-API-007                                                                                               |
| Source         | US-3 AC: 减重 10% 的计算值不是整数                                                                       |
| Type           | API                                                                                                      |
| Target         | src/services/progressive-overload.ts                                                                     |
| Priority       | P1                                                                                                       |
| Pre-conditions | 卧推上次重量 97.5kg，需减重 10%                                                                         |
| Steps          | 1. 计算减重建议 97.5 * 0.9 = 87.75                                                                      |
| Expected       | 向下取整到最近的可用杠铃片组合（如 87.5kg）                                                              |

### TC-API-008: 连续 3 次达标增量提示

| Field          | Value                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-API-008                                                                                               |
| Source         | US-3 AC: 用户连续 3 次训练均完成目标                                                                     |
| Type           | API                                                                                                      |
| Target         | src/services/progressive-overload.ts                                                                     |
| Priority       | P2                                                                                                       |
| Pre-conditions | 动作连续 3 次训练均达标                                                                                  |
| Steps          | 1. 计算加重建议                                                                                          |
| Expected       | 显示提示「状态不错，考虑加大增量？」，但不自动修改增量                                                   |

### TC-API-009: 中途退出已完成动作加重判断

| Field          | Value                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Test ID        | TC-API-009                                                                                               |
| Source         | US-10 AC: 中途退出的训练，加重算法计算下次建议                                                           |
| Type           | API                                                                                                      |
| Target         | src/services/progressive-overload.ts                                                                     |
| Priority       | P0                                                                                                       |
| Pre-conditions | 用户中途退出训练，部分动作已完成                                                                         |
| Steps          | 1. 查看加重建议计算                                                                                      |
| Expected       | 已完成的动作正常参与加重判断，未完成的动作不纳入                                                          |

### TC-API-010: 中途退出倒计时自动取消

| Field          | Value                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| Test ID        | TC-API-010                                                             |
| Source         | US-10 AC: 中途退出时倒计时仍在运行                                     |
| Type           | API                                                                    |
| Target         | src/services/timer.ts                                                  |
| Priority       | P1                                                                     |
| Pre-conditions | 用户在倒计时运行中中途退出训练                                         |
| Steps          | 1. 确认退出训练                                                        |
| Expected       | 倒计时自动取消                                                         |

### TC-API-011: 补录记录加重建议链重算

| Field          | Value                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------- |
| Test ID        | TC-API-011                                                                                         |
| Source         | US-13 AC: 补录的训练日期在最近一次训练之前                                                         |
| Type           | API                                                                                                |
| Target         | src/services/progressive-overload.ts                                                               |
| Priority       | P0                                                                                                 |
| Pre-conditions | 用户补录的训练日期早于最近训练                                                                     |
| Steps          | 1. 保存补录记录 2. 查看后续训练的加重建议                                                          |
| Expected       | 中间的训练建议链会重新计算                                                                         |

### TC-API-012: 1RM 估测公式

| Field          | Value                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Test ID        | TC-API-012                                                                                     |
| Source         | PRD 5.10: 1RM 估测公式                                                                         |
| Type           | API                                                                                            |
| Target         | src/services/stats.ts                                                                          |
| Priority       | P1                                                                                             |
| Pre-conditions | 用户有训练记录含最大重量组                                                                     |
| Steps          | 1. 计算 1RM 估测值                                                                             |
| Expected       | 1RM = 实际重量 x (1 + 实际次数 / 30)，基于训练中最大重量组计算                                 |

### TC-API-013: 周环比计算

| Field          | Value                                                                      |
| -------------- | -------------------------------------------------------------------------- |
| Test ID        | TC-API-013                                                                 |
| Source         | PRD 5.10: 周环比计算公式                                                   |
| Type           | API                                                                        |
| Target         | src/services/stats.ts                                                      |
| Priority       | P1                                                                         |
| Pre-conditions | 用户有本周和上周的训练数据                                                 |
| Steps          | 1. 计算周环比变化                                                          |
| Expected       | 周环比 = 本周容量 / 上周容量 - 1；上周无数据时显示「--」                   |

### TC-API-014: 训练频率热力图强度分级

| Field          | Value                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| Test ID        | TC-API-014                                                             |
| Source         | PRD 5.10: 热力图强度分级                                               |
| Type           | API                                                                    |
| Target         | src/services/stats.ts                                                  |
| Priority       | P2                                                                     |
| Pre-conditions | 用户有近 4 周训练数据                                                  |
| Steps          | 1. 计算各日训练强度                                                    |
| Expected       | 休息=0.1，轻度=0.4-0.6，中度=0.7-0.8，重度=0.9+                       |

---

## Type: CLI

> No CLI test cases applicable. This is a mobile app (React Native / Expo) with no command-line interface.

---

## Summary

| Type   | Count | Priority P0 | Priority P1 | Priority P2 |
| ------ | ----- | ----------- | ----------- | ----------- |
| UI     | 92    | 34          | 40          | 18          |
| API    | 14    | 6           | 6           | 2           |
| CLI    | 0     | 0           | 0           | 0           |
| **Total** | **106** | **40**      | **46**      | **20**      |

### Traceability Matrix

| PRD Section   | User Story | Test Cases                                                 |
| ------------- | ---------- | ---------------------------------------------------------- |
| 5.1 训练日历  | US-1, US-6 | TC-UI-001 ~ TC-UI-006, TC-UI-028 ~ TC-UI-034              |
| 5.2 训练执行  | US-2, US-10, US-16, US-17 | TC-UI-007 ~ TC-UI-015, TC-UI-053 ~ TC-UI-055, TC-UI-077 ~ TC-UI-083 |
| 5.2.4 后台计时器 | US-11 | TC-UI-056 ~ TC-UI-061, TC-API-010                          |
| 5.3 渐进加重  | US-3       | TC-API-001 ~ TC-API-008, TC-API-009                       |
| 5.4 感受记录  | US-5       | TC-UI-023 ~ TC-UI-027                                     |
| 5.5 动作库    | US-9       | TC-UI-046 ~ TC-UI-052                                     |
| 5.6 历史分析  | US-4, US-12, US-13 | TC-UI-016 ~ TC-UI-022, TC-UI-062 ~ TC-UI-069, TC-API-011 |
| 5.7 身体数据  | US-8       | TC-UI-041 ~ TC-UI-045                                     |
| 5.8 其他运动  | US-7       | TC-UI-035 ~ TC-UI-040                                     |
| 5.9 计划管理  | US-1       | TC-UI-001 ~ TC-UI-006                                     |
| 5.10 统计概览 | -          | TC-UI-088 ~ TC-UI-090, TC-API-012 ~ TC-API-014            |
| 5.11 设置     | US-14, US-15, US-18 | TC-UI-070 ~ TC-UI-076, TC-UI-084 ~ TC-UI-087, TC-UI-091 ~ TC-UI-092 |

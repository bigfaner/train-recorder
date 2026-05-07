---
feature: "Train Recorder"
status: Draft
---

# Train Recorder — PRD Spec

> PRD Spec: defines WHAT the feature is and why it exists.

## Background

### Why (Reason)

力量举训练者依赖渐进式加重（Progressive Overload）来持续提升力量水平，但缺乏一个围绕这一核心理念设计的训练记录工具。当前用户使用纸质记录和记忆来管理训练，导致：(1) 无法基于历史数据做出加重决策；(2) 无法可视化进步趋势；(3) 训练安排缺乏系统化；(4) 训练感受无法追溯。随着训练水平提升，数据驱动的决策越来越重要，但现有工具要么面向泛健身用户功能臃肿，要么缺少关键的加重建议和分析能力。

### What (Target)

一个跨平台移动 App，提供力量举周期化训练的完整闭环：训练计划管理 → 训练执行与实时记录 → 渐进加重建议 → 历史数据与进步分析。同时支持其他运动（游泳等）的记录和身体数据追踪。数据存储在设备本地，离线可用。

### Who (Users)

| 角色 | 描述 |
|------|------|
| 力量举训练者（主要） | 有经验的力量举爱好者，采用周期化推/拉/蹲训练方式，每周训练 3-4 次，追求渐进加重 |
| 其他运动爱好者 | 同时进行游泳、跑步等其他运动的健身者，需要记录非力量训练数据 |

## Goals

| Goal | Metric | Notes |
|------|--------|-------|
| 消除加重决策盲区 | 100% 的训练动作都有基于历史表现的加重建议 | 核心价值 |
| 可视化进步趋势 | 能查看任意动作的重量进步曲线和训练容量趋势 | 数据驱动 |
| 训练记录效率 | 记录一组数据 ≤ 2 次点击 | 含预填充 |
| 训练节奏保障 | 组间计时器后台可靠运行，到时提醒 | 核心 UX |
| 跨平台一致 | Android 和 iOS 核心体验一致 | 平台约束 |
| 替代纸质记录 | 创作者本人连续使用 ≥ 2 周 | 自我验证 |

## Scope

### In Scope

- [x] 训练计划管理（周期化计划创建、推/拉/蹲分区、多模板切换）
- [x] 动作库（内置力量举动作 + 自定义动作 + 独立加重配置）
- [x] 训练执行与实时记录（逐组记录、组间计时器、到时提醒）
- [x] 渐进加重建议（基于表现的自动建议、每动作独立加重规则）
- [x] 训练日历（自动排期 + 可调整日期、训练类型标注）
- [x] 训练后感受记录（整体疲劳度、各动作感受、关联加重判断）
- [x] 历史数据与进步分析（训练历史、进步曲线、容量趋势、PR 追踪）
- [x] 身体数据记录（体重、围度、变化趋势）
- [x] 其他运动记录（自定义运动类型和指标）
- [x] 本地数据存储（数据导出功能）

### Out of Scope

- 云同步 / 多设备同步
- 社交功能（分享、好友对比、排行榜）
- 动作教学视频
- 营养/饮食记录
- Apple Watch / Wear OS 配套应用
- 付费/订阅功能
- 教练端功能

## Flow Description

### Business Flow Description

**核心训练闭环：**

1. **创建计划** — 用户创建一个训练计划，选择模式（固定周期或无限循环），定义训练日（推/拉/蹲分区），为每个训练日从动作库中选择动作并设置目标组数和次数。
2. **自动排期** — App 根据计划自动生成训练日历，标注每个训练日的训练类型。用户可调整具体日期。
3. **开始训练** — 用户在训练日打开 App，看到今日训练安排。App 根据上次每个动作的完成情况，自动建议本次目标重量。
4. **逐组记录** — 用户选择一个动作开始训练，按组输入实际重量和完成次数。记录完成后自动启动组间休息倒计时。
5. **计时提醒** — 倒计时到时后通过振动/声音提醒用户开始下一组。用户可在倒计时中提前开始或延长休息。
6. **完成动作** — 一个动作的所有组完成后，App 判断是否达成目标（目标次数全部完成 = 达成）。
7. **完成训练** — 所有动作完成后，用户记录整体训练感受（疲劳度、满意度）和各动作感受。
8. **加重判断** — App 根据各动作的完成情况更新加重建议：达成 → 下次加重，未达成 → 保持，连续两次未达成 → 建议减重 10%。
9. **回顾分析** — 用户在训练历史中查看各动作的进步曲线、容量趋势和个人记录。

**其他运动流程：**

用户可直接在日历中选择「其他运动」，选择运动类型（或自定义），录入相关指标（距离、时间等），保存后可在历史中查看。

**身体数据流程：**

用户在任何时候可录入身体数据（体重、围度），App 记录时间戳并生成变化趋势图。

### Business Flow Diagram

```mermaid
flowchart TD
    Start([用户打开 App]) --> HasPlan{已有训练计划?}
    HasPlan -->|否| CreatePlan[创建训练计划]
    HasPlan -->|是| Calendar[训练日历]
    CreatePlan --> DefineDays[定义训练日分区和动作]
    DefineDays --> AutoSchedule[自动排期生成日历]
    AutoSchedule --> Calendar

    Calendar --> SelectDay{选择训练日}
    SelectDay -->|训练日| TodayPlan[查看今日训练安排]
    SelectDay -->|休息日| OtherSport{记录其他运动?}
    SelectDay -->|历史日| ViewHistory[查看历史训练记录]

    OtherSport -->|是| RecordOther[记录其他运动数据]
    OtherSport -->|否| Calendar

    TodayPlan --> LoadSuggestion[加载加重建议和上次表现]
    LoadSuggestion --> StartExercise[开始训练]

    StartExercise --> SelectExercise[选择动作]
    SelectExercise --> RecordSet[记录一组: 重量 + 次数]
    RecordSet --> SetTimer[自动启动组间倒计时]
    SetTimer --> TimerDone{倒计时结束/跳过}
    TimerDone --> MoreSets{还有更多组?}
    MoreSets -->|是| RecordSet
    MoreSets -->|否| SetComplete{还有更多动作?}
    SetComplete -->|是| SelectExercise
    SetComplete -->|否| FinishTraining[完成训练]

    FinishTraining --> RecordFeeling[记录训练感受]
    RecordFeeling --> UpdateSuggestion[更新加重建议]
    UpdateSuggestion --> SaveData[保存训练数据]
    SaveData --> Calendar

    RecordSet --> UserOverride{用户修改建议重量?}
    UserOverride -->|是| UseCustom[使用用户自定义重量]
    UserOverride -->|否| UseSuggested[使用建议重量]
    UseCustom --> SetTimer
    UseSuggested --> SetTimer

    style Start fill:#e1f5fe
    style FinishTraining fill:#e8f5e9
    style RecordFeeling fill:#fff3e0
```

### Data Flow Description

本系统为单设备本地应用，无跨系统数据流。数据流均在设备内部完成。

## Functional Specs

### 5.1 训练日历页面

**Data Source**: 本地数据库中的训练计划排期 + 训练记录历史

**Display Scope**: 当月所有日期，标注训练类型

**Data Permissions**: 单用户，无权限区分

**Sort Order**: 按日期自然排序

**Page Type**: Dashboard（日历视图 + 当日摘要）

**Sample Data**:

| 日期 | 训练类型 | 状态 | 备注 |
|------|---------|------|------|
| 2026-05-05 (周一) | 推日 | 已完成 | 卧推 PR |
| 2026-05-07 (周三) | 拉日 | 待训练 | — |
| 2026-05-09 (周五) | 蹲日 | — | — |
| 2026-05-10 (周六) | 游泳 | 已完成 | 1500m |

**Status Description**:

| Status Value | Display Text | Business Meaning |
|--------|----------|----------|
| completed | 已完成 | 当日训练已完成并记录 |
| planned | 待训练 | 计划中的训练日 |
| skipped | 已跳过 | 用户跳过了该训练日 |
| rest | 休息 | 休息日 |
| other_sport | 其他运动 | 非力量训练的其他运动 |

**List Fields**:

| Field Name | Type | Description |
|---------|------|------|
| date | date | 训练日期 |
| training_type | string | 训练类型（推/拉/蹲/其他运动名称/休息） |
| status | string | 训练状态 |
| summary | string | 训练摘要（如总容量、PR 等） |

**Search Criteria**:

| # | Search Field | Control Type | Description | Default Placeholder |
|------|--------|----------|------|----------|
| 1 | 月份 | 日期切换 | 左右箭头切换月份 | 当前月份 |
| 2 | 训练类型 | 标签筛选 | 筛选特定训练类型 | 全部 |

### 5.2 训练执行页面

**Data Source**: 训练计划中当日的动作列表 + 上次训练记录（用于加重建议）

**Display Scope**: 当日训练的所有动作及每组记录

**Page Type**: Form page（逐组录入）

**功能描述**:

| 区域 | 内容 |
|------|------|
| 动作卡片列表 | 每个动作一个卡片，显示：动作名称、建议重量（可修改）、目标组数×次数 |
| 当前组记录区 | 当前正在进行的组：重量输入（预填充建议值）、实际次数输入、完成按钮 |
| 计时器区 | 组间休息倒计时显示，可暂停/跳过/延长 |
| 训练进度 | 已完成动作数/总动作数 |

**交互流程**:

| # | 操作 | 系统响应 |
|------|------|------|
| 1 | 点击「开始训练」 | 加载今日动作列表，预填充建议重量，进入第一个动作 |
| 2 | 修改重量 | 允许用户覆盖建议值，记录为自定义值 |
| 3 | 输入次数并点击「完成本组」 | 保存本组数据，自动启动组间倒计时 |
| 4 | 倒计时到时 | 振动 + 声音提醒，显示「开始下一组」按钮 |
| 5 | 提前跳过计时 | 直接进入下一组记录 |
| 6 | 完成动作所有组 | 标记该动作完成，判断是否达成目标，显示下一个动作 |
| 7 | 所有动作完成 | 显示训练汇总（总容量、各动作完成情况），进入感受记录 |

### 5.3 渐进加重建议逻辑

**加重规则（每个动作独立配置）**:

| 动作完成情况 | 加重建议 | 说明 |
|------------|---------|------|
| 所有组均完成目标次数 | 建议加重（按该动作配置的增量） | 如深蹲 +5kg，卧推 +2.5kg |
| 部分组未完成目标次数 | 保持当前重量 | 不加重也不减重 |
| 连续 2 次训练均有组未完成 | 建议减重 10% | 可能训练过量 |
| 连续 3 次训练均完成 | 可考虑加大增量 | 可选功能，用户可忽略 |

**加重增量配置（动作级别）**:

| Field Name | Control Type | Required | Default | Rules |
|---------|----------|------|--------|----------|
| 加重增量 | 数字输入 | 是 | 2.5kg | > 0，支持小数（0.5/1/1.25/2.5/5） |
| 目标组数 | 数字输入 | 是 | — | 1-10 |
| 目标次数（每组） | 数字输入 | 是 | — | 1-30 |
| 组间休息时长（秒） | 数字输入 | 是 | 180 | 30-600 |

### 5.4 训练后感受记录

**Form Fields**:

| Field Name | Control Type | Required | Max Length | Rules |
|---------|----------|------|----------|----------|
| 整体疲劳度 | 滑块评分（1-10） | 是 | — | 1=极度轻松，10=筋疲力尽 |
| 训练满意度 | 滑块评分（1-10） | 是 | — | 1=很差，10=完美 |
| 各动作感受 | 多行文本（每动作） | 否 | 200 字 | 自由文本 |
| 备注 | 多行文本 | 否 | 500 字 | 自由文本 |

**加重关联**: 当疲劳度 ≥ 8 且满意度 ≤ 4 时，下次训练建议降低强度或休息。

### 5.5 动作库

**Data Source**: 预置动作列表 + 用户自定义动作

**内置动作分类**:

| 分类 | 动作 |
|------|------|
| 核心力量举动作 | 深蹲、卧推、硬拉、推举 |
| 上肢推 | 上斜卧推、哑铃卧推、双杠臂屈伸 |
| 上肢拉 | 杠铃划船、引体向上、高位下拉、哑铃划船 |
| 下肢辅助 | 前蹲、腿举、罗马尼亚硬拉、腿弯举 |
| 其他 | 二头弯举、三头下压、侧平举、面拉 |

**动作属性**:

| Field Name | Type | Description |
|---------|------|------|
| name | string | 动作名称 |
| category | string | 所属分类 |
| increment | number | 默认加重增量（kg） |
| default_rest | number | 默认组间休息（秒） |
| is_custom | boolean | 是否为用户自定义动作 |

### 5.6 历史数据与进步分析

**训练历史列表**:

| Field Name | Type | Description |
|---------|------|------|
| date | date | 训练日期 |
| type | string | 训练类型 |
| exercises | string | 包含的动作列表 |
| total_volume | number | 总容量（kg） |
| duration | number | 训练时长（分钟） |
| feeling | number | 感受评分 |

**进步曲线图**: X 轴为日期，Y 轴为重量（kg），每个动作一条线。标注 PR（个人记录）点。

**容量趋势图**: X 轴为日期，Y 轴为总容量（kg），柱状图展示每次训练容量。

**PR 追踪**: 记录每个动作的历史最高重量和最高容量，在新 PR 产生时提醒用户。

### 5.7 身体数据记录

**Form Fields**:

| Field Name | Control Type | Required | Rules |
|---------|----------|------|----------|
| 记录日期 | 日期选择 | 是 | 默认今天 |
| 体重（kg） | 数字输入 | 是 | 精确到 0.1 |
| 胸围（cm） | 数字输入 | 否 | 精确到 0.1 |
| 腰围（cm） | 数字输入 | 否 | 精确到 0.1 |
| 臂围（cm） | 数字输入 | 否 | 精确到 0.1 |
| 大腿围（cm） | 数字输入 | 否 | 精确到 0.1 |
| 备注 | 文本 | 否 | 最大 200 字 |

**趋势图**: 各指标随时间变化的折线图。

### 5.8 其他运动记录

**运动类型配置**:

| Field Name | Control Type | Required | Rules |
|---------|----------|------|----------|
| 运动名称 | 文本输入 | 是 | 如：游泳、跑步、骑行 |
| 记录指标 | 多选配置 | 是 | 从预设指标中选择或自定义 |

**预设指标**: 距离、时间、配速、趟数、心率、卡路里、自定义数值

**记录表单**: 根据选择的指标动态生成对应输入字段。

### 5.9 训练计划管理

**创建计划表单**:

| Field Name | Control Type | Required | Rules |
|---------|----------|------|----------|
| 计划名称 | 文本输入 | 是 | 如：5/3/1 周期、得州方法 |
| 计划模式 | 单选 | 是 | 固定周期 / 无限循环 |
| 周期长度（固定模式） | 数字输入 | 条件必填 | 1-12 周 |
| 训练日定义 | 列表编辑 | 是 | 每行：训练类型 + 选择动作 + 目标组数×次数 |

**自动排期规则**:
- 固定周期模式：按周期长度生成完整排期，周期结束后重新开始
- 无限循环模式：按定义的训练日顺序无限循环，跳过标记为休息的日期
- 用户可在日历上拖动调整已排期的训练日期

## Other Notes

### Performance Requirements
- Response time: 训练中操作响应 ≤ 200ms
- Concurrency: 单用户，无并发需求
- Data storage: 本地数据库，预估单用户年数据量 < 10MB
- Compatibility: Android 8.0+ / iOS 15.0+，支持主流屏幕尺寸

### Data Requirements
- Data tracking: 所有训练数据带时间戳，支持精确到秒的训练时长记录
- Data initialization: 首次使用提供引导流程：创建第一个训练计划、录入当前力量水平
- Data migration: 支持数据导出为标准格式，后续版本可导入

### Security Requirements
- Transport encryption: 不适用（纯本地存储，无网络传输）
- Storage encryption: 训练数据为个人隐私数据，建议使用设备级加密存储
- Display masking: 不适用
- Rate limiting: 不适用

---

## Quality Checklist

- [x] Is the requirement title accurate and descriptive
- [x] Does the background include all three elements: reason, target, users
- [x] Are the goals quantified
- [x] Is the flow description complete
- [x] Does the business flow diagram exist (Mermaid format)
- [x] Is the list page description complete (data source / display scope / permissions / sorting / pagination / fields / search)
- [x] Are button actions described completely (permissions / states / validation / data logic)
- [x] Are form descriptions complete (fields / validation rules)
- [x] Are related changes thoroughly analyzed
- [x] Are non-functional requirements considered (performance / data / monitoring / security)
- [x] Are all tables filled completely
- [x] Is there any ambiguous or vague wording
- [x] Is the spec actionable and verifiable

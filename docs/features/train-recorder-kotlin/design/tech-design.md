---
created: 2026-05-10
prd: prd/prd-spec.md
status: Approved
---

# Technical Design: Train Recorder

## Overview

Train Recorder 是一个跨平台力量举训练助手 App，采用 Kotlin Multiplatform (KMP) + Compose Multiplatform 架构，实现 Android/iOS 共享代码。核心架构为 MVVM + Repository 模式，使用 SQLDelight 做本地持久化，Koin 做依赖注入。

核心训练闭环：创建计划 → 自动排期 → 执行训练（逐组记录 + 组间计时） → 渐进加重建议 → 历史分析 + PR 追踪。

## Architecture

### Layer Placement

本功能覆盖全栈：数据库层 → 领域层 → ViewModel 层 → UI 层，为 KMP 共享模块架构。

### Component Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Compose UI Layer                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Calendar  │ │ Workout  │ │ History  │ │ Settings │   │
│  │ Screen    │ │ Screen   │ │ Screen   │ │ Screen   │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘   │
│       │             │            │             │          │
│  ┌────┴─────────────┴────────────┴─────────────┴─────┐  │
│  │              ViewModels (shared)                    │  │
│  └────┬─────────────┬────────────┬─────────────┬─────┘  │
├───────┼─────────────┼────────────┼─────────────┼────────┤
│       │        Domain Layer (shared)            │        │
│  ┌────┴─────┐ ┌────┴─────┐ ┌────┴─────┐ ┌────┴─────┐  │
│  │ Plan     │ │ Workout  │ │ Progress │ │ Settings │  │
│  │ Repo     │ │ Repo     │ │ Repo     │ │ Repo     │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │
│       │             │            │             │          │
│  ┌────┴─────┐ ┌────┴─────┐ ┌───┴──────┐               │
│  │ Schedule │ │ Weight   │ │ PR       │               │
│  │Calculator│ │Suggester │ │ Tracker  │               │
│  └──────────┘ └──────────┘ └──────────┘               │
│       │             │            │                       │
├───────┼─────────────┼────────────┼──────────────────────┤
│       │        Data Layer (shared)              │        │
│  ┌────┴─────────────┴────────────┴─────────────────┐   │
│  │            SQLDelight (SQLite)                    │   │
│  │   共享数据库 schema, 平台特定 SQLite driver       │   │
│  └──────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│                  Platform Layer                          │
│  ┌──────────────────┐  ┌──────────────────────────────┐ │
│  │ Android          │  │ iOS (via Kotlin/Native)      │ │
│  │ - Foreground Svc │  │ - Background Task            │ │
│  │ - Local Notif    │  │ - Local Notif                │ │
│  │ - SQLite driver  │  │ - SQLite driver              │ │
│  └──────────────────┘  └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Project Structure

```
train-recorder-kotlin/
├── shared/                          # KMP 共享模块
│   ├── src/
│   │   ├── commonMain/kotlin/
│   │   │   └── com/trainrecorder/
│   │   │       ├── data/
│   │   │       │   ├── db/          # SQLDelight queries
│   │   │       │   │   └── TrainRecorderDatabase.sq
│   │   │       │   ├── mapper/      # DB ↔ Domain 映射
│   │   │       │   └── repository/  # Repository 实现
│   │   │       ├── domain/
│   │   │       │   ├── model/       # 领域模型 (data classes)
│   │   │       │   ├── repository/  # Repository 接口
│   │   │       │   └── usecase/     # 业务逻辑 (ScheduleCalculator, WeightSuggester 等)
│   │   │       └── viewmodel/       # ViewModels
│   │   ├── commonTest/              # 共享单元测试
│   │   ├── androidMain/             # Android 平台实现
│   │   └── iosMain/                 # iOS 平台实现
│   └── build.gradle.kts
├── androidApp/                      # Android 应用入口
│   ├── src/main/
│   │   ├── kotlin/                  # Activity, Service, Notification
│   │   └── AndroidManifest.xml
│   └── build.gradle.kts
├── iosApp/                          # iOS 应用入口 (Xcode project)
└── build.gradle.kts                 # 根构建文件
```

### Dependencies

| Category | Library | Version | Purpose |
|----------|---------|---------|---------|
| UI | Compose Multiplatform | BOM 2024.x | 声明式 UI, Android/iOS 共享 |
| Navigation | Compose Multiplatform Navigation | latest | 页面路由 |
| Database | SQLDelight | 2.x | KMP SQLite, 类型安全 SQL |
| DI | Koin | 4.x | 轻量级依赖注入, KMP 原生 |
| Coroutines | Kotlinx Coroutines | 1.x | 异步操作 |
| DateTime | Kotlinx DateTime | 0.6.x | 跨平台日期时间 |
| Serialization | Kotlinx Serialization | 1.7.x | 数据导出 JSON |
| Charts | Custom Compose Canvas | — | 进步曲线、容量柱状图、热力图 |
| Timer | Foreground Service (Android) | Platform | 后台计时器可靠性 |
| Timer | Background Task (iOS) | Platform | 后台计时器可靠性 |

## Interfaces

### Interface 1: ExerciseRepository

```
interface ExerciseRepository {
    fun getAll(): Flow<List<Exercise>>
    fun getByCategory(category: ExerciseCategory): Flow<List<Exercise>>
    fun getById(id: String): Flow<Exercise?>
    fun search(query: String): Flow<List<Exercise>>
    suspend fun create(exercise: Exercise): Result<String>         // ERR: duplicate name
    suspend fun update(exercise: Exercise): Result<Unit>           // ERR: not found
    suspend fun delete(id: String): Result<Unit>                   // ERR: ExerciseInUseError
    suspend fun seedDefaultExercises(): Result<Unit>               // 首次启动插入预置动作
}
```

### Interface 2: TrainingPlanRepository

```
interface TrainingPlanRepository {
    fun getActivePlan(): Flow<TrainingPlan?>
    fun getAllPlans(): Flow<List<TrainingPlan>>
    fun getPlanWithDays(planId: String): Flow<PlanWithDays?>  // Plan + TrainingDays + Exercises
    suspend fun createPlan(plan: TrainingPlan, days: List<TrainingDayWithExercises>): Result<String>  // ERR: validation
    suspend fun updatePlan(plan: TrainingPlan, days: List<TrainingDayWithExercises>): Result<Unit>    // ERR: PlanNotFoundError
    suspend fun activatePlan(planId: String): Result<Unit>     // ERR: PlanNotFoundError
    suspend fun deletePlan(planId: String): Result<Unit>       // ERR: PlanNotFoundError
}
```

### Interface 3: WorkoutRepository

```
interface WorkoutRepository {
    fun getSessionsByDateRange(startDate: LocalDate, endDate: LocalDate): Flow<List<WorkoutSession>>
    fun getSessionWithDetails(sessionId: String): Flow<WorkoutSessionDetail?>  // Session + Exercises + Sets
    suspend fun createSession(session: WorkoutSession, exercises: List<WorkoutExerciseInput>): Result<String>       // ERR: validation
    suspend fun updateSessionStatus(sessionId: String, status: WorkoutStatus): Result<Unit>                         // ERR: SessionLockedError
    suspend fun recordSet(workoutExerciseId: String, set: ExerciseSetInput): Result<ExerciseSet>                    // ERR: InvalidWeight/InvalidReps
    suspend fun updateExerciseStatus(workoutExerciseId: String, status: ExerciseStatus): Result<Unit>                // ERR: SessionLockedError
    suspend fun completeSession(sessionId: String): Result<Unit>                                                     // ERR: SessionLockedError
    suspend fun partialCompleteSession(sessionId: String): Result<Unit>                                              // ERR: not found
    suspend fun deleteSession(sessionId: String): Result<Unit>                                                       // 级联删除关联数据
    suspend fun backfillSession(session: WorkoutSession, exercises: List<WorkoutExerciseWithSets>): Result<String>   // ERR: date conflict
}
```

### Interface 4: WeightSuggestionRepository

```
interface WeightSuggestionRepository {
    fun getSuggestion(exerciseId: String): Flow<WeightSuggestion?>
    suspend fun recalculate(exerciseId: String): Result<Unit>                            // 从 exercise_set 历史重算
    suspend fun recalculateChain(fromDate: LocalDate, exerciseId: String): Result<Unit>  // 补录/编辑后从该日期起重算
}
```

WeightSuggestion 计算逻辑封装在 `WeightSuggester` use case 中:

```
class WeightSuggester {
    fun calculate(
        exerciseId: String,
        increment: Double,
        recentSessions: List<WorkoutExerciseWithSets>  // 按日期倒序
    ): WeightSuggestionResult

    data class WeightSuggestionResult(
        suggestedWeight: Double?,
        consecutiveCompletions: Int,
        consecutiveFailures: Int,
        hint: SuggestionHint?  // null / CONSIDER_MORE / SUGGEST_DELOAD / SUGGEST_REST
    )
}
```

### Interface 5: PersonalRecordRepository

```
interface PersonalRecordRepository {
    fun getRecord(exerciseId: String): Flow<PersonalRecord?>
    fun getAllRecords(): Flow<List<PersonalRecord>>
    suspend fun updateAfterWorkout(sessionId: String): Result<Unit>    // 训练完成后检查并更新 PR
    suspend fun recalculate(exerciseId: String): Result<Unit>          // 删除/编辑记录后重算
    suspend fun recalculateAll(): Result<Unit>                         // 清理场景
}
```

### Interface 6: ScheduleCalculator

```
class ScheduleCalculator {
    fun computeSchedule(
        plan: TrainingPlan,
        trainingDays: List<TrainingDay>,
        workoutSessions: List<WorkoutSession>,
        startDate: LocalDate,
        endDate: LocalDate
    ): List<ScheduleDay>

    data class ScheduleDay(
        val date: LocalDate,
        val type: ScheduleDayType,  // TRAINING / REST / OTHER_SPORT
        val trainingDay: TrainingDay?,  // 非训练日为 null
        val workoutSession: WorkoutSession?,  // 已完成时有值
        val otherSportRecord: OtherSportRecord?,  // 其他运动记录
        val isSkipped: Boolean,               // 用户手动跳过
        val isToday: Boolean
    )

    // 跳过连击追踪: 计算 scheduleDays 中连续 isSkipped=true 的天数,
    // 用于 CalendarUiState.consecutiveSkips。连续跳过 >= 3 天时,
    // CalendarViewModel 弹出鼓励提示 (US-6 AC6)。
    fun computeConsecutiveSkips(scheduleDays: List<ScheduleDay>, fromDate: LocalDate): Int
}
```

### Interface 7: BodyDataRepository

```
interface BodyDataRepository {
    fun getAll(): Flow<List<BodyMeasurement>>
    fun getByDateRange(start: LocalDate, end: LocalDate): Flow<List<BodyMeasurement>>
    fun getLatest(): Flow<BodyMeasurement?>
    suspend fun create(record: BodyMeasurement): Result<String>    // ERR: validation
    suspend fun update(record: BodyMeasurement): Result<Unit>      // ERR: not found
    suspend fun delete(id: String): Result<Unit>                   // ERR: not found
}
```

### Interface 8: OtherSportRepository

```
interface OtherSportRepository {
    // 运动类型
    fun getSportTypes(): Flow<List<OtherSportType>>
    suspend fun createSportType(type: OtherSportType, metrics: List<OtherSportMetric>): Result<String>  // ERR: duplicate name

    // 运动记录
    fun getRecordsByDateRange(start: LocalDate, end: LocalDate): Flow<List<OtherSportRecord>>
    suspend fun createRecord(record: OtherSportRecord, metricValues: List<OtherSportMetricValue>): Result<String>  // ERR: validation
    suspend fun deleteRecord(id: String): Result<Unit>  // ERR: not found
}
```

### Interface 9: TimerService

```
interface TimerService {
    val remainingSeconds: StateFlow<Int?>
    val timerState: StateFlow<TimerState?>

    suspend fun startTimer(sessionId: String, durationSeconds: Int)
    suspend fun cancelTimer()
    suspend fun resumeFromPersistedState()  // App 重启后恢复

    // 平台实现: Android ForegroundService, iOS BackgroundTask
}
```

### Interface 10: SettingsRepository

```
interface SettingsRepository {
    fun getSettings(): Flow<UserSettings>
    suspend fun updateWeightUnit(unit: WeightUnit): Result<Unit>    // kg / lb
    suspend fun updateDefaultRest(seconds: Int): Result<Unit>
    suspend fun updateNotifications(reminder: Boolean, vibration: Boolean, sound: Boolean): Result<Unit>
    suspend fun completeOnboarding(): Result<Unit>
    suspend fun exportData(format: ExportFormat, dateRange: DateRange?): Result<String>   // 返回文件路径; ERR: ExportFailedError
    suspend fun importData(filePath: String): Result<ImportResult>                        // ERR: ImportConflictError
    suspend fun clearAllData(): Result<Unit>                                               // 保留动作库和设置
}
```

### Interface 11: FeelingRepository

```
interface FeelingRepository {
    suspend fun saveFeeling(
        sessionId: String,
        fatigue: Int,
        satisfaction: Int,
        notes: String?,
        exerciseNotes: List<ExerciseFeelingInput>
    ): Result<Unit>                                    // ERR: validation, SessionLockedError
    suspend fun updateFeeling(feelingId: String, fatigue: Int, satisfaction: Int, notes: String?): Result<Unit>  // ERR: not found
    fun getFeelingForSession(sessionId: String): Flow<WorkoutFeeling?>
}
```

## Presentation Layer

### Navigation Graph

Using Compose Multiplatform Navigation with type-safe route definitions.

```
// --- Tab bar destinations (top-level) ---
@Serializable object CalendarRoute        // 日历首页
@Serializable object PlanListRoute        // 训练计划管理
@Serializable object HistoryRoute         // 历史数据与进步分析
@Serializable object BodyDataRoute        // 身体数据记录
@Serializable object SettingsRoute        // 设置

// --- Detail / sub-pages ---
@Serializable data class WorkoutRoute(val sessionId: String? = null, val planDayId: String? = null, val date: String? = null)
@Serializable data class FeelingRoute(val sessionId: String)
@Serializable data class OtherSportRoute(val date: String, val recordId: String? = null)
@Serializable data class PlanEditRoute(val planId: String? = null)          // null = create
@Serializable data class DayEditRoute(val planId: String, val dayId: String? = null)
@Serializable data class ExercisePickerRoute(val multiSelect: Boolean = true)
@Serializable data class ExerciseDetailRoute(val exerciseId: String)
@Serializable data class ExerciseCreateRoute(val exerciseId: String? = null)
@Serializable data class SessionDetailRoute(val sessionId: String)
@Serializable data class BodyDataEditRoute(val recordId: String? = null, val date: String? = null)
@Serializable data class ProgressChartRoute(val exerciseId: String)
@Serializable data class OtherSportCreateRoute(val typeId: String? = null)
@Serializable object OnboardingRoute
```

**Navigation rules:**
- Workout screen hides tab bar (fullscreen)
- Feeling screen pushes after workout completion; back returns to calendar (not workout)
- ExercisePickerRoute opens as modal sheet from Plan day-edit

### Screen State Classes

Each screen exposes a single `UiState` data class through its ViewModel via `StateFlow`. User actions are dispatched as sealed-class events.

#### CalendarScreen

```
data class CalendarUiState(
    val month: YearMonth,
    val scheduleDays: List<ScheduleDay>,       // from ScheduleCalculator
    val todaySummary: TodaySummary?,
    val consecutiveSkips: Int,                 // current consecutive skip streak (for 3-skip prompt)
    val isLoaded: Boolean
)

data class TodaySummary(
    val date: LocalDate,
    val trainingDay: TrainingDay?,
    val workoutSession: WorkoutSession?,       // if already started/completed
    val otherSportRecords: List<OtherSportRecord>
)

sealed class CalendarEvent {
    data class ChangeMonth(val month: YearMonth) : CalendarEvent()
    data class SelectDate(val date: LocalDate) : CalendarEvent()
    data class StartWorkout(val date: LocalDate) : CalendarEvent()
    data class SkipDay(val date: LocalDate) : CalendarEvent()
    data class UnskipDay(val date: LocalDate) : CalendarEvent()
    data class AdjustDate(val fromDate: LocalDate, val toDate: LocalDate) : CalendarEvent()
    data class DragReschedule(val fromDate: LocalDate, val toDate: LocalDate) : CalendarEvent()
    data object RecordOtherSport : CalendarEvent()
}
```

#### WorkoutScreen

```
data class WorkoutUiState(
    val sessionId: String,
    val trainingType: TrainingType,
    val exercises: List<WorkoutExerciseUi>,    // ordered
    val currentExerciseIndex: Int,
    val timerState: TimerDisplayState?,
    val progress: WorkoutProgress,
    val isSaving: Boolean
)

data class WorkoutExerciseUi(
    val exerciseId: String,
    val exerciseName: String,
    val exerciseStatus: ExerciseStatus,
    val suggestedWeight: Double?,
    val isCustomWeight: Boolean,
    val sets: List<ExerciseSetUi>,
    val targetSets: Int,
    val targetReps: Int,
    val restSeconds: Int,
    val weightIncrement: Double
)

data class ExerciseSetUi(
    val setIndex: Int,
    val targetWeight: Double,
    val actualWeight: Double?,
    val actualReps: Int?,
    val isCompleted: Boolean
)

data class TimerDisplayState(
    val remainingSeconds: Int,
    val totalDuration: Int,
    val isExpired: Boolean
)

data class WorkoutProgress(
    val completedExercises: Int,
    val totalExercises: Int
)

sealed class WorkoutEvent {
    data class RecordSet(val exerciseId: String, val weight: Double, val reps: Int) : WorkoutEvent()
    data class UpdateWeight(val exerciseId: String, val weight: Double) : WorkoutEvent()
    data class SkipExercise(val exerciseId: String) : WorkoutEvent()
    data class ReorderExercise(val fromIndex: Int, val toIndex: Int) : WorkoutEvent()
    data object SkipTimer : WorkoutEvent()
    data class AdjustTimer(val deltaSeconds: Int) : WorkoutEvent()
    data object CompleteWorkout : WorkoutEvent()
    data object PartialComplete : WorkoutEvent()
}
```

#### PlanScreen

```
data class PlanUiState(
    val activePlan: PlanWithDays?,
    val allPlans: List<TrainingPlan>,
    val isLoaded: Boolean
)

data class PlanWithDays(
    val plan: TrainingPlan,
    val days: List<TrainingDayWithExercises>
)

data class TrainingDayWithExercises(
    val day: TrainingDay,
    val exercises: List<TrainingDayExercise>
)

sealed class PlanEvent {
    data class CreatePlan(val plan: TrainingPlan, val days: List<TrainingDayWithExercises>) : PlanEvent()
    data class UpdatePlan(val plan: TrainingPlan, val days: List<TrainingDayWithExercises>) : PlanEvent()
    data class ActivatePlan(val planId: String) : PlanEvent()
    data class DeletePlan(val planId: String) : PlanEvent()
}
```

#### HistoryScreen

```
data class HistoryUiState(
    val selectedTab: HistoryTab,
    val sessions: List<WorkoutSessionSummary>,
    val selectedExerciseId: String?,
    val progressData: List<ProgressDataPoint>?,
    val personalRecords: List<PersonalRecord>,
    val volumeData: List<VolumeDataPoint>?,
    val isLoaded: Boolean
)

enum class HistoryTab { HISTORY, PROGRESS, VOLUME, PR }

data class WorkoutSessionSummary(
    val sessionId: String,
    val date: LocalDate,
    val trainingType: TrainingType,
    val exercises: List<String>,               // display names
    val totalVolume: Double,
    val feelingScore: Int?
)

data class ProgressDataPoint(
    val date: LocalDate,
    val weight: Double,
    val isPR: Boolean
)

data class VolumeDataPoint(
    val date: LocalDate,
    val volume: Double
)

sealed class HistoryEvent {
    data class SelectTab(val tab: HistoryTab) : HistoryEvent()
    data class SelectExercise(val exerciseId: String) : HistoryEvent()
    data class DeleteSession(val sessionId: String) : HistoryEvent()
    data class EditSession(val sessionId: String) : HistoryEvent()
    data class ViewSessionDetail(val sessionId: String) : HistoryEvent()
}
```

#### BodyDataScreen

```
data class BodyDataUiState(
    val latestMeasurement: BodyMeasurement?,
    val trendData: List<BodyMeasurement>,
    val selectedMetric: BodyMetric,
    val isLoaded: Boolean
)

enum class BodyMetric { WEIGHT, CHEST, WAIST, ARM, THIGH }

sealed class BodyDataEvent {
    data class SaveRecord(val record: BodyMeasurement) : BodyDataEvent()
    data class DeleteRecord(val id: String) : BodyDataEvent()
    data class SelectMetric(val metric: BodyMetric) : BodyDataEvent()
}
```

#### SettingsScreen

```
data class SettingsUiState(
    val settings: UserSettings,
    val isExporting: Boolean,
    val isImporting: Boolean
)

sealed class SettingsEvent {
    data class UpdateWeightUnit(val unit: WeightUnit) : SettingsEvent()
    data class UpdateDefaultRest(val seconds: Int) : SettingsEvent()
    data class UpdateNotifications(val reminder: Boolean, val vibration: Boolean, val sound: Boolean) : SettingsEvent()
    data class ExportData(val format: ExportFormat, val dateRange: DateRange?) : SettingsEvent()
    data class ImportData(val filePath: String) : SettingsEvent()
    data object ClearAllData : SettingsEvent()
    data object CompleteOnboarding : SettingsEvent()
}
```

#### FeelingScreen

```
data class FeelingUiState(
    val sessionId: String,
    val trainingSummary: WorkoutSessionSummary,
    val fatigue: Int,                          // 1-10, default 5
    val satisfaction: Int,                     // 1-10, default 5
    val exerciseFeelings: List<ExerciseFeelingUi>,
    val notes: String?,
    val isSaving: Boolean,
    val showHighFatigueWarning: Boolean        // fatigue >= 8 && satisfaction <= 4
)

data class ExerciseFeelingUi(
    val exerciseId: String,
    val exerciseName: String,
    val notes: String?
)

sealed class FeelingEvent {
    data class SetFatigue(val level: Int) : FeelingEvent()
    data class SetSatisfaction(val level: Int) : FeelingEvent()
    data class SetExerciseNotes(val exerciseId: String, val notes: String) : FeelingEvent()
    data class SetNotes(val notes: String) : FeelingEvent()
    data object Save : FeelingEvent()
}
```

#### OtherSportScreen

```
data class OtherSportUiState(
    val sportTypes: List<OtherSportType>,
    val selectedType: OtherSportType?,
    val metrics: List<OtherSportMetric>,
    val metricValues: Map<String, String>,     // metricId -> value
    val date: LocalDate,
    val notes: String,
    val isSaving: Boolean
)

sealed class OtherSportEvent {
    data class SelectSportType(val typeId: String) : OtherSportEvent()
    data class SetMetricValue(val metricId: String, val value: String) : OtherSportEvent()
    data class SetNotes(val notes: String) : OtherSportEvent()
    data class Save(val date: LocalDate) : OtherSportEvent()
    data class CreateCustomType(val name: String, val metrics: List<OtherSportMetric>) : OtherSportEvent()
}
```

#### ExerciseLibraryScreen

```
data class ExerciseLibraryUiState(
    val exercises: List<Exercise>,
    val searchQuery: String,
    val selectedCategory: ExerciseCategory?,
    val isSelectionMode: Boolean,
    val selectedIds: Set<String>
)

sealed class ExerciseLibraryEvent {
    data class Search(val query: String) : ExerciseLibraryEvent()
    data class FilterCategory(val category: ExerciseCategory?) : ExerciseLibraryEvent()
    data class ToggleSelection(val exerciseId: String) : ExerciseLibraryEvent()
    data class ConfirmSelection(val selectedIds: Set<String>) : ExerciseLibraryEvent()
    data class CreateExercise(val exercise: Exercise) : ExerciseLibraryEvent()
    data class DeleteExercise(val exerciseId: String) : ExerciseLibraryEvent()
}
```

### ViewModel Contract

All ViewModels follow the same pattern:

```
abstract class BaseViewModel<S : Any, E : Any>(
    initial: S
) : ViewModel() {
    private val _state = MutableStateFlow(initial)
    val state: StateFlow<S> = _state.asStateFlow()

    protected fun setState(reduce: S.() -> S) { _state.update(reduce) }

    abstract fun onEvent(event: E)
}
```

- State is always a single `data class` (never nullable wrapper)
- Loading/errors are fields within the state class (`isLoaded`, `errorMessage: String?`)
- ViewModels receive repositories via Koin injection
- Flow-based data is collected in `init` blocks; `suspend` repo calls run in `viewModelScope`

## Data Models

> Full database design in separate files.
> **ER Diagram**: design/er-diagram.md
> **SQL Schema**: design/schema.sql

### Field Quick Reference

| Model | Key Fields | Notes |
|-------|------------|-------|
| Exercise | display_name, category, weight_increment, default_rest, is_custom | 动作库, 19+ 预置 + 自定义 |
| TrainingPlan | display_name, plan_mode, schedule_mode, is_active | 同一时间只有一个激活 |
| TrainingDay | plan_id, display_name, day_type, order_index | 训练日定义 |
| TrainingDayExercise | training_day_id, exercise_id, exercise_mode, target_sets/reps, rest_seconds, weight_increment | 动作配置, 支持固定/自定义模式 |
| TrainingDaySetConfig | day_exercise_id, set_index, target_reps, target_weight | 仅 custom 模式使用 |
| WorkoutSession | plan_id, record_date, training_type, workout_status, is_backfill | 一次训练会话 |
| WorkoutExercise | workout_session_id, exercise_id, suggested_weight, exercise_status | 动作执行实例 |
| ExerciseSet | workout_exercise_id, set_index, actual_weight, actual_reps, is_completed | 逐组记录 |
| WorkoutFeeling | workout_session_id, fatigue_level, satisfaction_level, notes | 一对一训练感受 |
| ExerciseFeeling | workout_feeling_id, exercise_id, notes | 各动作独立感受 |
| PersonalRecord | exercise_id, max_weight, max_volume, max_weight_date | 每动作一条 PR |
| WeightSuggestion | exercise_id, suggested_weight, consecutive_completions/failures | 加重建议缓存 |
| BodyMeasurement | record_date, body_weight, chest, waist, arm, thigh | 身体数据 |
| OtherSportType | display_name, is_custom | 运动 + 自定义 |
| OtherSportMetric | sport_type_id, metric_key, input_type, unit | 动态指标配置 |
| OtherSportRecord | sport_type_id, record_date | 运动记录 |
| OtherSportMetricValue | sport_record_id, metric_id, metric_value | 指标值存储 |
| TimerState | workout_session_id, start_timestamp, total_duration_seconds | 后台计时器 |
| UserSettings | weight_unit, default_rest_seconds, onboarding_completed | 全局设置 |

## Error Handling

### Error Types & Codes

| Error Code | Name | Description |
|------------|------|-------------|
| EXERCISE_IN_USE | ExerciseInUseError | 删除被计划使用的动作 |
| PLAN_NOT_FOUND | PlanNotFoundError | 操作不存在的计划 |
| INVALID_WEIGHT | InvalidWeightError | 重量 ≤ 0 |
| INVALID_REPS | InvalidRepsError | 次数 < 0 |
| TIMER_EXPIRED | TimerExpiredError | 计时器已超时 |
| IMPORT_CONFLICT | ImportConflictError | 导入数据 ID 冲突 |
| EXPORT_FAILED | ExportFailedError | 导出失败 |
| SESSION_LOCKED | SessionLockedError | 已完成的训练不允许直接修改组数据 |

### Propagation Strategy

**Core rule: all `suspend` repository functions return `Result<T>` where business errors can occur.** Pure `Flow` query functions do not wrap in Result -- they emit empty/default on error and rely on Flow error handling.

1. **Data layer**: SQLDelight operations throw `DatabaseException` on constraint violations, IO failures, etc. The Repository implementation catches these.
2. **Repository layer**: Catches `DatabaseException`, maps to typed domain errors (`ExerciseInUseError`, etc.), and returns `Result.failure(...)`. On success, returns `Result.success(value)`. Callers never see raw exceptions from this layer.
3. **ViewModel layer**: Unwraps `Result` via `onSuccess` / `onFailure`. On failure, sets `errorMessage: String?` in the UiState. Flow-based queries auto-retry once on error.
4. **UI layer**: Reads `errorMessage` from state. Displays inline error text or Toast. No global error dialogs.

**Result contract per function:**
- Functions annotated `// ERR: ...` in the interface definitions above indicate which domain error types each function can return.
- `Flow`-returning functions (queries) are excluded from `Result<T>` -- they emit data reactively; errors are handled via Flow's `catch` operator in the ViewModel.
- Pure computation functions (`ScheduleCalculator.computeSchedule`, `WeightSuggester.calculate`) are synchronous and throw on invalid input (caller validates before calling).

## Cross-Layer Data Map

| Field Name | Storage Layer (SQLite) | Domain Model | ViewModel State | UI Type | Validation Rule |
|------------|----------------------|--------------|-----------------|---------|-----------------|
| exercise_id | TEXT (UUID) | String | — | — | 非空 UUID |
| display_name | TEXT | String | — | String | 1-100 字符 |
| weight_increment | REAL (kg) | Double | — | String (显示时按 unit 转换) | > 0 |
| suggested_weight | REAL (kg) | Double? | — | String (显示时按 unit 转换) | null 或 > 0 |
| actual_weight | REAL (kg) | Double | — | String | > 0 |
| actual_reps | INTEGER | Int? | — | String | null 或 ≥ 0 |
| record_date | TEXT (yyyy-MM-dd) | LocalDate | — | String (本地化日期) | 有效日期, 不超过今天(补录) |
| workout_status | TEXT | enum WorkoutStatus | — | String (已完成/进行中/部分完成) | 枚举值 |
| fatigue_level | INTEGER (1-10) | Int | — | Slider (1-10) | 1-10 |
| satisfaction_level | INTEGER (1-10) | Int | — | Slider (1-10) | 1-10 |
| weight_unit | TEXT (kg/lb) | enum WeightUnit | — | Segmented Control | kg 或 lb |
| training_type | TEXT | enum TrainingType | — | Tag/Pill (颜色编码) | push/pull/legs/other |
| total_volume | — (计算) | Double | — | String (带千分位) | ≥ 0 |
| estimated_1rm | — (计算) | Double | — | String | weight × (1 + reps/30) |

## Integration Specs

No existing-page integrations — all pages are new. Not applicable.

## Testing Strategy

### Per-Layer Test Plan

| Layer | Test Type | Tool | What to Test | Coverage Target |
|-------|-----------|------|--------------|-----------------|
| Domain (use cases) | Unit | kotlin.test | WeightSuggester 算法, ScheduleCalculator 排期逻辑, PR 判断 | 90% |
| Domain (mappers) | Unit | kotlin.test | DB ↔ Domain 映射正确性 | 80% |
| Repository | Integration | kotlin.test + in-memory SQLite | CRUD 操作, 级联删除, 查询过滤 | 80% |
| ViewModel | Unit | kotlin.test + Turbine | 状态流转, 用户操作 → 状态变化 | 80% |
| UI | Screenshot | Compose Preview | 关键屏幕截图回归 | 关键页面 |
| Timer | Integration | Platform test | 后台恢复, 超时处理 | 90% |

### Key Test Scenarios

1. **加重建议算法**:
   - 首次训练 → 无建议
   - 全部完成 → 加重
   - 部分未完成 → 保持
   - 连续 2 次未完成 → 减重 10%, 向下取整到 2.5kg 倍数
   - 连续 3 次完成 → 提示"状态不错"
   - 减重 10% 后非整数 → 向下取整到最近可用值 (87.75 → 87.5)

2. **排期计算**:
   - weekly_fixed: 周一推、周三拉、周五蹲 → 正确排期
   - fixed_interval: 间隔 1 天 → 推、休、拉、休、蹲
   - 已完成的训练覆写排期状态
   - 计划切换后旧排期消失

3. **中途退出**:
   - 已完成 2/3 动作 → 保存为 completed_partial
   - 已完成动作的加重建议正常计算
   - 未完成动作不参与加重判断

4. **补录训练**:
   - 插入到正确日期
   - 从补录日期起重算加重建议链
   - 标记为补录

5. **编辑/删除历史**:
   - 删除含 PR 的记录 → PR 回退到次优
   - 编辑重量 → 加重建议重算

6. **单位切换**:
   - kg → lb: 所有显示立即转换 (× 2.20462)
   - lb 输入 → 存储为 kg (÷ 2.20462)

### Overall Coverage Target

80% (domain layer 90%, data layer 80%, viewmodel 80%)

## Security Considerations

### Threat Model

| # | Threat | Risk Level | Mitigation |
|---|--------|-----------|------------|
| T1 | 本地数据泄露 (设备丢失/被盗) | Medium | SQLite file protected by platform full-disk encryption: Android Keystore + EncryptedSharedPreferences for key material, iOS NSFileProtectionComplete. No separate encryption layer needed -- rely on OS-level device lock + file protection. Require device passcode to be set for the app to function. |
| T2 | 数据导入注入 (恶意 JSON) | Medium | Multi-layer validation: (1) JSON schema version check -- reject unknown versions; (2) Strict field-level type/range validation using `kotlinx.serialization` with `@Required` annotations -- any missing/extra fields cause record-level skip; (3) Input size cap at 50 MB -- reject larger files immediately; (4) All imported IDs are regenerated server-side (UUID v4) to prevent ID collision attacks. Each invalid record is logged to `ImportResult.errors`; import continues with remaining records. |
| T3 | SQL 注入 | N/A | SQLDelight compiles queries at build time -- no string concatenation. Not applicable. |
| T4 | 导出文件暴露 | Medium | Exported files written to app-private cache dir, not external storage. Share via platform share sheet (`Intent.ACTION_SEND` / `UIActivityViewController`) which grants temporary read-only access to the chosen app. File deleted from cache 60 seconds after share completes. Export filename includes timestamp but no user-identifying info. |
| T5 | 导入数据损坏 (beyond schema) | Medium | Import runs inside a single SQLite transaction. If any write fails mid-import, the entire transaction rolls back -- no partial state. Post-import integrity check: verify foreign key references exist for all imported records. If integrity check fails, roll back and report. |
| T6 | 写入期间崩溃导致数据库损坏 | Low | SQLite WAL (Write-Ahead Logging) mode enabled via SQLDelight driver config. WAL provides atomic commits -- a crash mid-write leaves either the old or new state, never a partial write. On app startup, run `PRAGMA integrity_check` and `PRAGMA foreign_key_check`; if either fails, prompt user to re-import from last export. |
| T7 | 破坏性操作误操作 (清空所有数据) | High | `clearAllData()` guarded by confirmation dialog + two-step action (select then confirm). Destructive-styled button ("Delete All Training Data") is not pre-focused (must tap, not just press Enter). No special DB mechanism needed — UI-level guard is sufficient. Data loss is permanent after confirmation. |
| T8 | 破坏性操作误操作 (删除训练记录) | Medium | `deleteSession` performs hard delete with confirmation dialog. Cascade deletes associated WorkoutExercise, ExerciseSet, WorkoutFeeling, ExerciseFeeling rows at application layer. PersonalRecord auto-recalculates via `PersonalRecordRepository.recalculate()` after deletion. No shadow table or soft-delete mechanism — simplicity over recoverability for single-session deletion. |

### Mitigations Summary

- All data stored in app sandbox; file protection set to `complete` (iOS) / credential-encrypted storage (Android)
- Export uses share sheet with temporary file access; auto-delete from cache after share
- Import validated in 3 layers (schema version, field types/ranges, referential integrity); executed in a single transaction with rollback
- SQLite WAL mode prevents crash-induced corruption; startup integrity check with recovery prompt
- All destructive operations (clear all, delete session, delete plan) require confirmation dialog; PR records auto-recalculate after session deletion
- No network communication; all data is local-only -- no network attack surface
- No authentication data stored; no passwords/tokens in the app

## PRD Coverage Map

| PRD Requirement / AC | Design Component | Interface / Model |
|---|---|---|
| US-1: 创建并执行周期化训练计划 | TrainingPlanRepository, ScheduleCalculator | TrainingPlan, TrainingDay, TrainingDayExercise |
| US-1: 无限循环排期 | ScheduleCalculator.weekly_fixed/fixed_interval | plan_mode, schedule_mode |
| US-1: 固定周期排期 | ScheduleCalculator | cycle_length |
| US-1: 计划切换 | TrainingPlanRepository.activatePlan | is_active |
| US-2: 逐组记录训练数据 | WorkoutRepository.recordSet | ExerciseSet (actual_weight, actual_reps) |
| US-2: 组间计时器 | TimerService | TimerState (timestamp-based) |
| US-2: ≤2次点击记录 | WorkoutViewModel | suggested_weight 预填充 |
| US-2: 中途退出 | WorkoutRepository.partialCompleteSession | workout_status = completed_partial |
| US-2: 加一组 | WorkoutRepository.recordSet (extra set) | is_completed, 超出 target_sets |
| US-3: 渐进加重建议 | WeightSuggester, WeightSuggestionRepository | WeightSuggestion |
| US-3: 加重/保持/减重规则 | WeightSuggester.calculate | consecutive_completions/failures |
| US-3: 用户覆盖建议 | WorkoutRepository | is_custom_weight |
| US-3: 减重取整 | WeightSuggester | 向下取整到 increment 倍数 |
| US-3: 连续3次提示 | WeightSuggester | SuggestionHint.CONSIDER_MORE |
| US-4: 进步曲线图 | Custom Compose Canvas | ExerciseSet (actual_weight, record_date) |
| US-4: PR 追踪 | PersonalRecordRepository | PersonalRecord |
| US-4: 容量趋势 | WorkoutRepository | Σ(actual_weight × actual_reps) per session |
| US-5: 训练感受记录 | FeelingRepository | WorkoutFeeling, ExerciseFeeling |
| US-5: 高疲劳低满意提示 | WorkoutViewModel | fatigue ≥ 8 && satisfaction ≤ 4 |
| US-6: 训练日历 | CalendarViewModel, ScheduleCalculator | ScheduleDay |
| US-6: 调整训练日期 | WorkoutRepository | record_date 更新 |
| US-6: 跳过训练日 | WorkoutViewModel | schedule_day marked as skipped |
| US-7: 其他运动记录 | OtherSportRepository | OtherSportType, OtherSportMetric, OtherSportRecord |
| US-8: 身体数据 | BodyDataRepository | BodyMeasurement |
| US-9: 动作库管理 | ExerciseRepository | Exercise (is_custom, category) |
| US-10: 中途退出训练 | WorkoutRepository.partialCompleteSession | workout_status = completed_partial |
| US-11: 后台计时器 | TimerService (timestamp-based) | TimerState (start_timestamp, total_duration_seconds) |
| US-12: 编辑删除历史 | WorkoutRepository.deleteSession, PersonalRecordRepository.recalculate | WorkoutSession, PersonalRecord |
| US-13: 补录训练 | WorkoutRepository.backfillSession, WeightSuggestionRepository.recalculateChain | is_backfill |
| US-14: 数据导出 | SettingsRepository.exportData | JSON/CSV export |
| US-15: 重量单位切换 | SettingsRepository.updateWeightUnit | UserSettings.weight_unit |
| US-16: 动作顺序调整 | WorkoutViewModel | WorkoutExercise.order_index |
| US-17: 同动作多次出现 | TrainingDayExercise (note field) | note, 独立加重建议链 |
| US-18: 首次引导 | SettingsRepository.completeOnboarding | UserSettings.onboarding_completed |

## Open Questions

- [ ] iOS 后台计时器实现方案: BackgroundTask vs BGProcessingTask vs 其他? 需 iOS 开发阶段验证
- [ ] 数据导入格式: JSON 导入 schema 版本控制策略 (后续版本数据结构变化时兼容性)
- [ ] 日历拖拽调整排期: 是否需要持久化用户手动调整, 还是一律重新计算?

## Appendix

### Alternatives Considered

| Approach | Pros | Cons | Why Not Chosen |
|----------|------|------|----------------|
| Room (Android-only) | 成熟稳定, Jetpack 集成好 | 不支持 KMP/iOS | 需要 KMP 跨平台方案 |
| Hilt/Dagger | 编译时检查, Google 官方 | 仅 Android | Koin 跨平台更合适 |
| Vico Charts | 开箱即用的 Compose 图表 | Android-only, 定制性差 | 自定义 Canvas 更灵活且跨平台 |
| Room + SQLDelight 混合 | 各取所长 | 维护两套 DB 层 | 统一 SQLDelight 减少复杂度 |
| Store schedule in DB | 查询简单 | 冗余数据, 计划变更时需同步更新 | 实时计算更简洁, 避免不一致 |

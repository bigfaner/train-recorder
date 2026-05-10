# Phase 3 Summary: Presentation Layer

## Tasks Completed

| Task | Title | Status | Notes |
|------|-------|--------|-------|
| 3.1 | TimerService Platform Implementation | completed | TimerServiceImpl with timestamp-based logic, SQLDelight persistence, TimerNotificationHelper abstraction, TimerClock for testability, 29 tests |
| 3.2 | Core ViewModels | completed | BaseViewModel, CalendarViewModel, WorkoutViewModel, PlanViewModel, YearMonth value type, 33 tests |
| 3.3 | Supporting ViewModels | completed | HistoryViewModel, StatsViewModel, FeelingViewModel, SettingsViewModel, BodyDataViewModel, OtherSportViewModel, ExerciseLibraryViewModel, 71 tests |
| 3.4 | Navigation Graph & Chart Components | completed | 18 type-safe routes, 5-tab scaffold, custom vector icons, LineChart/BarChart/HeatmapGrid with touch-to-inspect, 27 tests |

## Key Decisions

- **3.1**: TimerServiceImpl uses timestamp-based calculation (start_timestamp + total_duration_seconds - now) for accurate remaining time on app resume. TimerNotificationHelper abstracts platform-specific notification/background execution. TimerClock interface wraps Clock.System for testability.
- **3.2**: Custom YearMonth data class created since kotlinx-datetime 0.6.x does not provide one. CalendarViewModel uses ScheduleCalculator for schedule computation with skipped dates overlay. All ViewModels accept optional CoroutineScope for test injection.
- **3.3**: HistoryViewModel filters IN_PROGRESS sessions, 4 tabs (HISTORY, PROGRESS, VOLUME, PR). StatsViewModel uses 1RM formula weight * (1 + reps/30). FeelingViewModel high-fatigue warning when fatigue >= 8 AND satisfaction <= 4. ExerciseLibraryViewModel uses combine of getAll flow + search query + category filter.
- **3.4**: Custom vector icons (TrainRecorderIcons) instead of material-icons-extended (Android-only). Charts use Compose Canvas with overlay Text composables for labels. HeatmapGrid uses 5-level intensity scale. TabDestination changed from enum to data class + list to avoid Compose scope issues.

## Types & Interfaces Changed

| Type | Change | Blast Radius |
|------|--------|-------------|
| `TimerServiceImpl` | New class: timestamp-based timer with DB persistence | WorkoutViewModel, platform source sets |
| `TimerNotificationHelper` | New interface for platform-specific notifications | Android/iOS source sets |
| `TimerClock` | New interface wrapping Clock.System | TimerServiceImpl, tests |
| `TrainRecorder.sq` | Added 6 timer_state CRUD queries | TimerServiceImpl, SQLDelight generated code |
| `BaseViewModel<S, E>` | Abstract class with StateFlow state management, coroutine scope | All 10 ViewModels |
| `YearMonth` | Custom value type (kotlinx-datetime 0.6.x lacks it) | CalendarViewModel, tests |
| `CalendarViewModel` | New ViewModel with calendar state, schedule computation | UI layer |
| `WorkoutViewModel` | New ViewModel integrating TimerService | UI layer |
| `PlanViewModel` | New ViewModel with plan CRUD and active plan | UI layer |
| `HistoryViewModel` | New ViewModel with 4-tab history view | UI layer |
| `StatsViewModel` | New ViewModel with weekly/monthly stats, 1RM estimation | UI layer |
| `FeelingViewModel` | New ViewModel with fatigue/satisfaction sliders | UI layer |
| `SettingsViewModel` | New ViewModel with unit toggle, export/import | UI layer |
| `BodyDataViewModel` | New ViewModel with body measurements CRUD | UI layer |
| `OtherSportViewModel` | New ViewModel with sport types, dynamic metrics | UI layer |
| `ExerciseLibraryViewModel` | New ViewModel with browse/search/filter/CRUD | UI layer |
| `Route` (sealed class) | 18 @Serializable route definitions | Navigation graph, UI layer |
| `TrainRecorderScaffold` | Tab bar scaffold with 5 tabs | App entry point |
| `TrainRecorderIcons` | Custom vector icon objects | All screens with icons |
| `ChartModels` | Data models for chart components | LineChart, BarChart, HeatmapGrid |
| `LineChart` | Compose Canvas chart for progress curves | StatsViewModel UI |
| `BarChart` | Compose Canvas chart for volume trends | HistoryViewModel UI |
| `HeatmapGrid` | Compose Canvas chart for training frequency | StatsViewModel UI |

## Conventions Established

1. **BaseViewModel pattern**: All ViewModels extend BaseViewModel<S, E> with typed State and Event. State exposed via stateFlow: StateFlow<S>, events via processEvent(E). Loading/error states use sealed class variants within each ViewModel's state.
2. **Fake repository testing**: All ViewModel tests use hand-written fake repository implementations (no mocking framework). Fakes maintain in-memory state and implement repository interfaces directly.
3. **Type-safe navigation**: All routes are @Serializable data classes (with parameters) or objects (no parameters). Navigation uses Compose Multiplatform Navigation library.
4. **Compose Canvas charts**: Custom chart components use Canvas for drawing with overlay Text composables for labels. Data models (ChartModels) are separate from rendering code.
5. **Coroutine scope injection**: ViewModels accept optional CoroutineScope parameter for testability, defaulting to default dispatchers in production.

## Deviations from Design

- Platform-specific timer implementations (Android ForegroundService, iOS BackgroundTask) are not yet wired -- TimerNotificationHelper provides the extension point but actual platform builds are needed for full integration testing.
- Tab bar uses custom vector icons defined as composable functions rather than Material Icons, since material-icons-extended is Android-only.
- TabDestination was changed from enum to data class + list to avoid Compose scope issues with enum companion objects.
- StatsViewModel.estimatedOneRepMax list is currently empty because it requires session details with exercise sets -- full population requires UI-layer session detail loading.
- DI module (AppModule.kt) remains a placeholder -- ViewModel and repository registration deferred to when the app module is built.

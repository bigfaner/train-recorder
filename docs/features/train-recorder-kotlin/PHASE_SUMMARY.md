# Phase 2 Summary: Business Logic

## Tasks Completed

| Task | Title | Status | Notes |
|------|-------|--------|-------|
| 2.1 | Exercise & Settings Repository Implementations | completed | ExerciseRepositoryImpl, SettingsRepositoryImpl, seed data, clearAllData, export/import, unit conversion |
| 2.2 | Plan & Workout Repository Implementations | completed | TrainingPlanRepositoryImpl, WorkoutRepositoryImpl, plan CRUD with nested days, workout lifecycle, cascade deletes, backfill |
| 2.3 | Supporting Repository Implementations | completed | BodyDataRepositoryImpl, OtherSportRepositoryImpl, FeelingRepositoryImpl, PersonalRecordRepositoryImpl, WeightSuggestionRepositoryImpl |
| 2.4 | Core Use Cases: WeightSuggester & ScheduleCalculator | completed | WeightSuggester (increment/hold/deload/CONSIDER_MORE/first-time), ScheduleCalculator (weekly_fixed/fixed_interval), pure computation classes |

## Key Decisions

- **2.summary**: Added `resolutionStrategy.force("org.jetbrains.kotlinx:kotlinx-datetime:0.6.2")` in shared/build.gradle.kts to fix runtime/compile classpath mismatch. Compose 1.9.3 transitively pulls in kotlinx-datetime 0.7.1, which removes the built-in `Instant` serializer needed by `@Serializable` domain models. Forcing 0.6.2 keeps both classpaths consistent without migrating all models to `@Contextual`.

- **2.1-2.3**: All repository implementations use `TrainRecorderDatabase` directly (not individual query objects). Application-level cascade deletes are used throughout -- no SQL foreign keys.

- **2.4**: WeightSuggester and ScheduleCalculator are pure computation classes with no dependencies or side effects. They operate on domain model types directly.

## Types & Interfaces Changed

| Type | Change | Blast Radius |
|------|--------|-------------|
| `DomainError` | Added sealed error types for all repositories (ExerciseInUseError, SessionLockedError, etc.) | All repository impls, tests |
| `EntityMappers.kt` | Added bidirectional mappers (toDomain/toDb) for all 17 entity types | All repository impls |
| `TrainRecorder.sq` | Complete `.sq` file with schema DDL, indexes, and all queries for every repository | All repository impls, SQLDelight generated code |
| `WeightSuggester` | New pure use case class | Tests, future ViewModels |
| `ScheduleCalculator` | New pure use case class with `ScheduleDay`, `DayType` types | Tests, future ViewModels |
| `WorkoutExerciseWithSets` | New data class for WeightSuggester input | WeightSuggester, WeightSuggestionRepository |

## Conventions Established

1. **Repository pattern**: All repositories are interfaces in `domain/repository/` with SQLDelight implementations in `data/repository/`. They return `Flow<List<T>>` for queries and `Result<T>` for mutations.
2. **Entity mappers**: Bidirectional mappers between SQLDelight generated types and domain models live in `domain/mapper/EntityMappers.kt`. Extension functions `toDomain()` and `toDb()` convert between layers.
3. **Error handling**: Domain errors are sealed class `DomainError` extending `Exception`. Returned via `Result.failure()`, never thrown directly.
4. **Pure use cases**: WeightSuggester and ScheduleCalculator have no dependencies -- they are stateless pure functions that take domain model inputs and return computed results.
5. **Cascade deletes**: All cascade deletes are implemented at the application level in repository implementations (delete children before parents in correct order).
6. **SQLDelight single file**: All queries live in one `.sq` file (`TrainRecorder.sq`) organized by section headers.

## Deviations from Design

- The DI module (`AppModule.kt`) is still a placeholder. Repository and use case registration is deferred to Phase 3 when ViewModels need them.
- The `WorkoutRepositoryImpl` handles backfill via the `is_backfill` column on `workout_session` as designed, but does not enforce unique date constraints (application-level concern).
- `PersonalRecordRepository` recalculates max weight/volume via SQL aggregate queries (`selectMaxWeightForExercise`, `selectMaxVolumeForExercise`) rather than scanning all sets in Kotlin.

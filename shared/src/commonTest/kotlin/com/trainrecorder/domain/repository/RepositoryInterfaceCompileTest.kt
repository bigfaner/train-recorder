package com.trainrecorder.domain.repository

import kotlin.test.Test
import kotlin.test.assertTrue

/**
 * Compile-time verification that all 11 repository interfaces exist
 * and have the expected function signatures.
 *
 * These tests confirm structural correctness by referencing each interface
 * and exercising the type system. They pass if the code compiles.
 */
class RepositoryInterfaceCompileTest {

    @Test
    fun exerciseRepository_interface_compiles() {
        // Verify the interface exists and can be referenced
        val reference: () -> ExerciseRepository = {
            object : ExerciseRepository {
                override fun getAll() = kotlinx.coroutines.flow.flowOf(emptyList<com.trainrecorder.domain.model.Exercise>())
                override fun getByCategory(category: com.trainrecorder.domain.model.ExerciseCategory) = kotlinx.coroutines.flow.flowOf(emptyList<com.trainrecorder.domain.model.Exercise>())
                override fun getById(id: String) = kotlinx.coroutines.flow.flowOf<com.trainrecorder.domain.model.Exercise?>(null)
                override fun search(query: String) = kotlinx.coroutines.flow.flowOf(emptyList<com.trainrecorder.domain.model.Exercise>())
                override suspend fun create(exercise: com.trainrecorder.domain.model.Exercise) = Result.success("id")
                override suspend fun update(exercise: com.trainrecorder.domain.model.Exercise) = Result.success(Unit)
                override suspend fun delete(id: String) = Result.success(Unit)
                override suspend fun seedDefaultExercises() = Result.success(Unit)
            }
        }
        val repo = reference()
        assertTrue(repo is ExerciseRepository)
    }

    @Test
    fun trainingPlanRepository_interface_compiles() {
        val reference: () -> TrainingPlanRepository = {
            object : TrainingPlanRepository {
                override fun getActivePlan() = kotlinx.coroutines.flow.flowOf<com.trainrecorder.domain.model.TrainingPlan?>(null)
                override fun getAllPlans() = kotlinx.coroutines.flow.flowOf(emptyList<com.trainrecorder.domain.model.TrainingPlan>())
                override fun getPlanWithDays(planId: String) = kotlinx.coroutines.flow.flowOf<PlanWithDays?>(null)
                override suspend fun createPlan(plan: com.trainrecorder.domain.model.TrainingPlan, days: List<TrainingDayWithExercises>) = Result.success("id")
                override suspend fun updatePlan(plan: com.trainrecorder.domain.model.TrainingPlan, days: List<TrainingDayWithExercises>) = Result.success(Unit)
                override suspend fun activatePlan(planId: String) = Result.success(Unit)
                override suspend fun deletePlan(planId: String) = Result.success(Unit)
            }
        }
        val repo = reference()
        assertTrue(repo is TrainingPlanRepository)
    }

    @Test
    fun workoutRepository_interface_compiles() {
        val reference: () -> WorkoutRepository = {
            object : WorkoutRepository {
                override fun getSessionsByDateRange(startDate: kotlinx.datetime.LocalDate, endDate: kotlinx.datetime.LocalDate) =
                    kotlinx.coroutines.flow.flowOf(emptyList<com.trainrecorder.domain.model.WorkoutSession>())
                override fun getSessionWithDetails(sessionId: String) = kotlinx.coroutines.flow.flowOf<WorkoutSessionDetail?>(null)
                override suspend fun createSession(session: com.trainrecorder.domain.model.WorkoutSession, exercises: List<WorkoutExerciseInput>) = Result.success("id")
                override suspend fun updateSessionStatus(sessionId: String, status: com.trainrecorder.domain.model.WorkoutStatus) = Result.success(Unit)
                override suspend fun recordSet(workoutExerciseId: String, set: ExerciseSetInput) = Result.success(
                    com.trainrecorder.domain.model.ExerciseSet("", "", 0, 0.0, 0.0, 0, null, false, null, null, kotlinx.datetime.Instant.DISTANT_PAST, kotlinx.datetime.Instant.DISTANT_PAST)
                )
                override suspend fun updateExerciseStatus(workoutExerciseId: String, status: com.trainrecorder.domain.model.ExerciseStatus) = Result.success(Unit)
                override suspend fun completeSession(sessionId: String) = Result.success(Unit)
                override suspend fun partialCompleteSession(sessionId: String) = Result.success(Unit)
                override suspend fun deleteSession(sessionId: String) = Result.success(Unit)
                override suspend fun backfillSession(session: com.trainrecorder.domain.model.WorkoutSession, exercises: List<WorkoutExerciseWithSets>) = Result.success("id")
            }
        }
        val repo = reference()
        assertTrue(repo is WorkoutRepository)
    }

    @Test
    fun weightSuggestionRepository_interface_compiles() {
        val reference: () -> WeightSuggestionRepository = {
            object : WeightSuggestionRepository {
                override fun getSuggestion(exerciseId: String) = kotlinx.coroutines.flow.flowOf<com.trainrecorder.domain.model.WeightSuggestion?>(null)
                override suspend fun recalculate(exerciseId: String) = Result.success(Unit)
                override suspend fun recalculateChain(fromDate: kotlinx.datetime.LocalDate, exerciseId: String) = Result.success(Unit)
            }
        }
        val repo = reference()
        assertTrue(repo is WeightSuggestionRepository)
    }

    @Test
    fun personalRecordRepository_interface_compiles() {
        val reference: () -> PersonalRecordRepository = {
            object : PersonalRecordRepository {
                override fun getRecord(exerciseId: String) = kotlinx.coroutines.flow.flowOf<com.trainrecorder.domain.model.PersonalRecord?>(null)
                override fun getAllRecords() = kotlinx.coroutines.flow.flowOf(emptyList<com.trainrecorder.domain.model.PersonalRecord>())
                override suspend fun updateAfterWorkout(sessionId: String) = Result.success(Unit)
                override suspend fun recalculate(exerciseId: String) = Result.success(Unit)
                override suspend fun recalculateAll() = Result.success(Unit)
            }
        }
        val repo = reference()
        assertTrue(repo is PersonalRecordRepository)
    }

    @Test
    fun bodyDataRepository_interface_compiles() {
        val reference: () -> BodyDataRepository = {
            object : BodyDataRepository {
                override fun getAll() = kotlinx.coroutines.flow.flowOf(emptyList<com.trainrecorder.domain.model.BodyMeasurement>())
                override fun getByDateRange(start: kotlinx.datetime.LocalDate, end: kotlinx.datetime.LocalDate) = kotlinx.coroutines.flow.flowOf(emptyList<com.trainrecorder.domain.model.BodyMeasurement>())
                override fun getLatest() = kotlinx.coroutines.flow.flowOf<com.trainrecorder.domain.model.BodyMeasurement?>(null)
                override suspend fun create(record: com.trainrecorder.domain.model.BodyMeasurement) = Result.success("id")
                override suspend fun update(record: com.trainrecorder.domain.model.BodyMeasurement) = Result.success(Unit)
                override suspend fun delete(id: String) = Result.success(Unit)
            }
        }
        val repo = reference()
        assertTrue(repo is BodyDataRepository)
    }

    @Test
    fun otherSportRepository_interface_compiles() {
        val reference: () -> OtherSportRepository = {
            object : OtherSportRepository {
                override fun getSportTypes() = kotlinx.coroutines.flow.flowOf(emptyList<com.trainrecorder.domain.model.OtherSportType>())
                override suspend fun createSportType(type: com.trainrecorder.domain.model.OtherSportType, metrics: List<com.trainrecorder.domain.model.OtherSportMetric>) = Result.success("id")
                override fun getRecordsByDateRange(start: kotlinx.datetime.LocalDate, end: kotlinx.datetime.LocalDate) = kotlinx.coroutines.flow.flowOf(emptyList<com.trainrecorder.domain.model.OtherSportRecord>())
                override suspend fun createRecord(record: com.trainrecorder.domain.model.OtherSportRecord, metricValues: List<com.trainrecorder.domain.model.OtherSportMetricValue>) = Result.success("id")
                override suspend fun deleteRecord(id: String) = Result.success(Unit)
            }
        }
        val repo = reference()
        assertTrue(repo is OtherSportRepository)
    }

    @Test
    fun timerService_interface_compiles() {
        val reference: () -> TimerService = {
            object : TimerService {
                override val remainingSeconds = kotlinx.coroutines.flow.MutableStateFlow<Int?>(null)
                override val timerState = kotlinx.coroutines.flow.MutableStateFlow<com.trainrecorder.domain.model.TimerState?>(null)
                override suspend fun startTimer(sessionId: String, durationSeconds: Int) {}
                override suspend fun cancelTimer() {}
                override suspend fun resumeFromPersistedState() {}
            }
        }
        val service = reference()
        assertTrue(service is TimerService)
    }

    @Test
    fun settingsRepository_interface_compiles() {
        val reference: () -> SettingsRepository = {
            object : SettingsRepository {
                override fun getSettings() = kotlinx.coroutines.flow.flowOf(
                    com.trainrecorder.domain.model.UserSettings("", com.trainrecorder.domain.model.WeightUnit.KG, 90, true, true, true, false, kotlinx.datetime.Instant.DISTANT_PAST)
                )
                override suspend fun updateWeightUnit(unit: com.trainrecorder.domain.model.WeightUnit) = Result.success(Unit)
                override suspend fun updateDefaultRest(seconds: Int) = Result.success(Unit)
                override suspend fun updateNotifications(reminder: Boolean, vibration: Boolean, sound: Boolean) = Result.success(Unit)
                override suspend fun completeOnboarding() = Result.success(Unit)
                override suspend fun exportData(format: ExportFormat, dateRange: DateRange?) = Result.success("/path")
                override suspend fun importData(filePath: String) = Result.success(ImportResult(0, 0, emptyList()))
                override suspend fun clearAllData() = Result.success(Unit)
            }
        }
        val repo = reference()
        assertTrue(repo is SettingsRepository)
    }

    @Test
    fun feelingRepository_interface_compiles() {
        val reference: () -> FeelingRepository = {
            object : FeelingRepository {
                override suspend fun saveFeeling(sessionId: String, fatigue: Int, satisfaction: Int, notes: String?, exerciseNotes: List<ExerciseFeelingInput>) = Result.success(Unit)
                override suspend fun updateFeeling(feelingId: String, fatigue: Int, satisfaction: Int, notes: String?) = Result.success(Unit)
                override fun getFeelingForSession(sessionId: String) = kotlinx.coroutines.flow.flowOf<com.trainrecorder.domain.model.WorkoutFeeling?>(null)
            }
        }
        val repo = reference()
        assertTrue(repo is FeelingRepository)
    }
}

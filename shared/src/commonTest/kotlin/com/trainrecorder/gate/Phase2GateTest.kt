package com.trainrecorder.gate

import com.trainrecorder.domain.model.DomainError
import com.trainrecorder.domain.model.ExerciseCategory
import com.trainrecorder.domain.model.ExerciseMode
import com.trainrecorder.domain.model.ExerciseSet
import com.trainrecorder.domain.model.ExerciseStatus
import com.trainrecorder.domain.model.MetricInputType
import com.trainrecorder.domain.model.PlanMode
import com.trainrecorder.domain.model.ScheduleDayType
import com.trainrecorder.domain.model.SuggestionHint
import com.trainrecorder.domain.model.TrainingType
import com.trainrecorder.domain.model.WeightUnit
import com.trainrecorder.domain.model.WorkoutStatus
import com.trainrecorder.domain.repository.BodyDataRepository
import com.trainrecorder.domain.repository.ExerciseRepository
import com.trainrecorder.domain.repository.FeelingRepository
import com.trainrecorder.domain.repository.OtherSportRepository
import com.trainrecorder.domain.repository.PersonalRecordRepository
import com.trainrecorder.domain.repository.SettingsRepository
import com.trainrecorder.domain.repository.TrainingPlanRepository
import com.trainrecorder.domain.repository.WeightSuggestionRepository
import com.trainrecorder.domain.repository.WorkoutExerciseWithSets
import com.trainrecorder.domain.repository.WorkoutRepository
import com.trainrecorder.domain.usecase.ScheduleCalculator
import com.trainrecorder.domain.usecase.WeightSuggester
import com.trainrecorder.data.repository.BodyDataRepositoryImpl
import com.trainrecorder.data.repository.ExerciseRepositoryImpl
import com.trainrecorder.data.repository.FeelingRepositoryImpl
import com.trainrecorder.data.repository.OtherSportRepositoryImpl
import com.trainrecorder.data.repository.PersonalRecordRepositoryImpl
import com.trainrecorder.data.repository.SettingsRepositoryImpl
import com.trainrecorder.data.repository.TrainingPlanRepositoryImpl
import com.trainrecorder.data.repository.WeightSuggestionRepositoryImpl
import com.trainrecorder.data.repository.WorkoutRepositoryImpl
import com.trainrecorder.createTestDatabase
import com.trainrecorder.db.TrainRecorderDatabase
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue
import org.koin.test.check.checkModules

/**
 * Phase 2 Exit Gate tests - verifies all Phase 2 business logic criteria.
 *
 * Gate Criteria:
 * 1. Repository Layer: all CRUD operations, seed data, delete guards, cascade deletes
 * 2. Use Cases: WeightSuggester (increment/hold/deload/CONSIDER_MORE/first-time),
 *    ScheduleCalculator (weekly_fixed/fixed_interval)
 * 3. SQLDelight: all .sq queries compile without errors
 * 4. Integration: no regressions in Phase 1 code
 */
class Phase2GateTest {

    private val testInstant = Instant.parse("2026-01-15T10:30:00Z")
    private val testDate = LocalDate.parse("2026-01-15")

    // ================================================================
    // 1. Repository Layer Verification
    // ================================================================

    // --- ExerciseRepository ---

    @Test
    fun gate_exerciseRepository_crudPasses() = runTest {
        val db = createTestDatabase()
        val repo = ExerciseRepositoryImpl(db)

        // Create
        val exercise = com.trainrecorder.domain.model.Exercise(
            id = "ex-gate", displayName = "Gate Squat", category = ExerciseCategory.CORE,
            weightIncrement = 5.0, defaultRest = 180, isCustom = false,
            createdAt = testInstant, updatedAt = testInstant,
        )
        assertTrue(repo.create(exercise).isSuccess)

        // Read
        val fetched = repo.getById("ex-gate").first()
        assertNotNull(fetched)
        assertEquals("Gate Squat", fetched.displayName)

        // Update
        val updated = exercise.copy(displayName = "Updated Squat")
        assertTrue(repo.update(updated).isSuccess)
        assertEquals("Updated Squat", repo.getById("ex-gate").first()!!.displayName)

        // Delete (when not in use)
        assertTrue(repo.delete("ex-gate").isSuccess)
        assertNull(repo.getById("ex-gate").first())
    }

    @Test
    fun gate_exerciseRepository_seedDataInsertsOnFirstLaunch() = runTest {
        val db = createTestDatabase()
        val repo = ExerciseRepositoryImpl(db)

        val result = repo.seedDefaultExercises()
        assertTrue(result.isSuccess)

        val exercises = repo.getAll().first()
        assertEquals(21, exercises.size)
    }

    @Test
    fun gate_exerciseRepository_deleteGuardWithExerciseInUseError() = runTest {
        val db = createTestDatabase()
        val queries = db.trainRecorderQueries

        // Insert exercise
        queries.insertExercise(
            id = "ex-guard", display_name = "Guarded", category = "core",
            weight_increment = 5.0, default_rest = 180L, is_custom = 0L,
            created_at = testInstant.toString(), updated_at = testInstant.toString(),
        )
        // Insert plan + day + day_exercise referencing the exercise
        queries.insertSettings(
            id = "s", weight_unit = "kg", default_rest_seconds = 180L,
            training_reminder_enabled = 1L, vibration_enabled = 1L, sound_enabled = 0L,
            onboarding_completed = 0L, updated_at = testInstant.toString(),
        )
        val driver = com.trainrecorder.TestDatabaseFactory().createDriver()
        com.trainrecorder.db.TrainRecorderDatabase.Schema.create(driver)
        val rawDb = com.trainrecorder.db.TrainRecorderDatabase(driver)
        rawDb.trainRecorderQueries.insertExercise(
            id = "ex-g2", display_name = "Guarded2", category = "core",
            weight_increment = 5.0, default_rest = 180L, is_custom = 0L,
            created_at = testInstant.toString(), updated_at = testInstant.toString(),
        )
        driver.execute(null, "INSERT INTO training_plan(id, display_name, plan_mode, schedule_mode, is_active, created_at, updated_at) VALUES('tp-g','T','infinite_loop','weekly_fixed',1,'${testInstant}','${testInstant}')", 0)
        driver.execute(null, "INSERT INTO training_day(id, plan_id, display_name, day_type, order_index, created_at, updated_at) VALUES('td-g','tp-g','D','push',1,'${testInstant}','${testInstant}')", 0)
        driver.execute(null, "INSERT INTO training_day_exercise(id, training_day_id, exercise_id, order_index, exercise_mode, target_sets, target_reps, rest_seconds, weight_increment, created_at, updated_at) VALUES('tde-g','td-g','ex-g2',1,'fixed',3,5,180,2.5,'${testInstant}','${testInstant}')", 0)

        val repo = ExerciseRepositoryImpl(rawDb)
        val result = repo.delete("ex-g2")
        assertTrue(result.isFailure)
        assertIs<DomainError.ExerciseInUseError>(result.exceptionOrNull())
    }

    // --- SettingsRepository ---

    @Test
    fun gate_settingsRepository_getUpdateRoundTrip() = runTest {
        val db = createTestDatabase()
        val repo = SettingsRepositoryImpl(db)

        repo.ensureSettingsInitialized()
        repo.updateWeightUnit(WeightUnit.LB)
        repo.updateDefaultRest(300)

        val settings = repo.getSettings().first()
        assertEquals(WeightUnit.LB, settings.weightUnit)
        assertEquals(300, settings.defaultRestSeconds)
    }

    @Test
    fun gate_settingsRepository_unitConversion() {
        assertEquals(2.20462, SettingsRepositoryImpl.kgToLb(1.0), 0.0001)
        assertEquals(1.0, SettingsRepositoryImpl.lbToKg(2.20462), 0.0001)
    }

    @Test
    fun gate_settingsRepository_exportImportAndClearAllData() = runTest {
        val db = createTestDatabase()
        val repo = SettingsRepositoryImpl(db)
        repo.ensureSettingsInitialized()

        // Export
        val export = repo.exportData(com.trainrecorder.domain.repository.ExportFormat.JSON, null)
        assertTrue(export.isSuccess)
        assertTrue(export.getOrThrow().contains("version"))

        // ClearAllData preserves settings
        assertTrue(repo.clearAllData().isSuccess)
        val settings = repo.getSettings().first()
        assertNotNull(settings)
        assertEquals("default", settings.id)
    }

    // --- TrainingPlanRepository ---

    @Test
    fun gate_trainingPlanRepository_planCrudWithNestedDays() = runTest {
        val db = createTestDatabase()
        val repo = TrainingPlanRepositoryImpl(db)

        val plan = com.trainrecorder.domain.model.TrainingPlan(
            id = "plan-g", displayName = "Gate Plan", planMode = PlanMode.INFINITE_LOOP,
            cycleLength = null, scheduleMode = ScheduleDayType.WEEKLY_FIXED,
            intervalDays = null, isActive = false,
            createdAt = testInstant, updatedAt = testInstant,
        )
        val day = com.trainrecorder.domain.model.TrainingDay(
            id = "day-g", planId = "plan-g", displayName = "Push", dayType = TrainingType.PUSH,
            orderIndex = 1, createdAt = testInstant, updatedAt = testInstant,
        )
        val dayEx = com.trainrecorder.domain.model.TrainingDayExercise(
            id = "dex-g", trainingDayId = "day-g", exerciseId = "ex-1",
            orderIndex = 1, exerciseMode = ExerciseMode.FIXED,
            targetSets = 3, targetReps = 5, startWeight = 60.0,
            note = null, restSeconds = 180, weightIncrement = 2.5,
            createdAt = testInstant, updatedAt = testInstant,
        )
        val days = listOf(com.trainrecorder.domain.repository.TrainingDayWithExercises(day, listOf(dayEx)))

        // Create
        assertTrue(repo.createPlan(plan, days).isSuccess)
        val planWithDays = repo.getPlanWithDays("plan-g").first()
        assertNotNull(planWithDays)
        assertEquals(1, planWithDays.days.size)
        assertEquals("ex-1", planWithDays.days[0].exercises[0].exerciseId)

        // Update
        val updatedPlan = plan.copy(displayName = "Updated Plan")
        assertTrue(repo.updatePlan(updatedPlan, emptyList()).isSuccess)

        // Delete
        assertTrue(repo.deletePlan("plan-g").isSuccess)
        assertNull(repo.getPlanWithDays("plan-g").first())
    }

    @Test
    fun gate_trainingPlanRepository_activateDeactivate() = runTest {
        val db = createTestDatabase()
        val repo = TrainingPlanRepositoryImpl(db)

        val plan = com.trainrecorder.domain.model.TrainingPlan(
            id = "plan-act", displayName = "Active Plan", planMode = PlanMode.INFINITE_LOOP,
            cycleLength = null, scheduleMode = ScheduleDayType.WEEKLY_FIXED,
            intervalDays = null, isActive = false,
            createdAt = testInstant, updatedAt = testInstant,
        )
        repo.createPlan(plan, emptyList())
        assertNull(repo.getActivePlan().first())

        repo.activatePlan("plan-act")
        assertNotNull(repo.getActivePlan().first())
        assertEquals("plan-act", repo.getActivePlan().first()!!.id)
    }

    // --- WorkoutRepository ---

    @Test
    fun gate_workoutRepository_fullSessionLifecycle() = runTest {
        val db = createTestDatabase()
        val repo = WorkoutRepositoryImpl(db)

        val session = com.trainrecorder.domain.model.WorkoutSession(
            id = "ws-gate", planId = null, trainingDayId = null,
            recordDate = testDate, trainingType = TrainingType.PUSH,
            workoutStatus = WorkoutStatus.IN_PROGRESS,
            startedAt = testInstant, endedAt = null, isBackfill = false,
            createdAt = testInstant, updatedAt = testInstant,
        )
        val exerciseInput = com.trainrecorder.domain.repository.WorkoutExerciseInput(
            exerciseId = "ex-1", orderIndex = 1, targetSets = 3, targetReps = 5,
            exerciseMode = ExerciseMode.FIXED,
        )

        // Create
        repo.createSession(session, listOf(exerciseInput))

        // Record sets
        val detail = repo.getSessionWithDetails("ws-gate").first()
        assertNotNull(detail)
        val weId = detail.exercises[0].workoutExercise.id

        val setInput = com.trainrecorder.domain.repository.ExerciseSetInput(
            setIndex = 0, targetWeight = 60.0, actualWeight = 60.0,
            targetReps = 5, actualReps = 5,
        )
        assertTrue(repo.recordSet(weId, setInput).isSuccess)

        // Complete
        assertTrue(repo.completeSession("ws-gate").isSuccess)
        val completed = repo.getSessionWithDetails("ws-gate").first()
        assertNotNull(completed)
        assertEquals(WorkoutStatus.COMPLETED, completed.session.workoutStatus)
    }

    @Test
    fun gate_workoutRepository_cascadeDelete() = runTest {
        val db = createTestDatabase()
        val repo = WorkoutRepositoryImpl(db)

        val session = com.trainrecorder.domain.model.WorkoutSession(
            id = "ws-del", planId = null, trainingDayId = null,
            recordDate = testDate, trainingType = TrainingType.PUSH,
            workoutStatus = WorkoutStatus.IN_PROGRESS,
            startedAt = testInstant, endedAt = null, isBackfill = false,
            createdAt = testInstant, updatedAt = testInstant,
        )
        repo.createSession(session, listOf(
            com.trainrecorder.domain.repository.WorkoutExerciseInput(
                exerciseId = "ex-1", orderIndex = 1, targetSets = 3, targetReps = 5,
                exerciseMode = ExerciseMode.FIXED,
            )
        ))

        assertTrue(repo.deleteSession("ws-del").isSuccess)
        assertNull(repo.getSessionWithDetails("ws-del").first())
    }

    @Test
    fun gate_workoutRepository_backfillSession() = runTest {
        val db = createTestDatabase()
        val repo = WorkoutRepositoryImpl(db)

        val session = com.trainrecorder.domain.model.WorkoutSession(
            id = "ws-bf", planId = null, trainingDayId = null,
            recordDate = testDate, trainingType = TrainingType.PUSH,
            workoutStatus = WorkoutStatus.COMPLETED,
            startedAt = testInstant, endedAt = testInstant, isBackfill = false,
            createdAt = testInstant, updatedAt = testInstant,
        )
        val exercise = com.trainrecorder.domain.model.WorkoutExercise(
            id = "we-bf", workoutSessionId = "ws-bf", exerciseId = "ex-1",
            orderIndex = 1, note = null, suggestedWeight = null, isCustomWeight = false,
            targetSets = 3, targetReps = 5, exerciseMode = ExerciseMode.FIXED,
            exerciseStatus = ExerciseStatus.COMPLETED,
            createdAt = testInstant, updatedAt = testInstant,
        )
        val set = com.trainrecorder.domain.model.ExerciseSet(
            id = "set-bf", workoutExerciseId = "we-bf", setIndex = 0,
            targetWeight = 60.0, actualWeight = 60.0, targetReps = 5, actualReps = 5,
            isCompleted = true, restStartedAt = null, restDuration = null,
            createdAt = testInstant, updatedAt = testInstant,
        )

        val result = repo.backfillSession(session, listOf(WorkoutExerciseWithSets(exercise, listOf(set))))
        assertTrue(result.isSuccess)
        val detail = repo.getSessionWithDetails("ws-bf").first()
        assertNotNull(detail)
        assertTrue(detail.session.isBackfill)
    }

    // --- BodyDataRepository ---

    @Test
    fun gate_bodyDataRepository_crudWithDateRangeQueries() = runTest {
        val db = createTestDatabase()
        val repo = BodyDataRepositoryImpl(db)

        val m1 = com.trainrecorder.domain.model.BodyMeasurement(
            id = "bm-1", recordDate = LocalDate.parse("2026-01-10"),
            bodyWeight = 75.0, chest = 100.0, waist = 80.0, arm = 35.0, thigh = 55.0,
            notes = null, createdAt = testInstant, updatedAt = testInstant,
        )
        val m2 = com.trainrecorder.domain.model.BodyMeasurement(
            id = "bm-2", recordDate = LocalDate.parse("2026-01-20"),
            bodyWeight = 76.0, chest = 101.0, waist = 79.0, arm = 35.5, thigh = 55.5,
            notes = "Good", createdAt = testInstant, updatedAt = testInstant,
        )

        // Create
        assertTrue(repo.create(m1).isSuccess)
        assertTrue(repo.create(m2).isSuccess)

        // Date range query
        val range = repo.getByDateRange(
            LocalDate.parse("2026-01-15"), LocalDate.parse("2026-01-25"),
        ).first()
        assertEquals(1, range.size)
        assertEquals(76.0, range[0].bodyWeight)

        // Update
        val updated = m2.copy(bodyWeight = 77.0)
        assertTrue(repo.update(updated).isSuccess)

        // Delete
        assertTrue(repo.delete("bm-1").isSuccess)
        assertEquals(1, repo.getAll().first().size)
    }

    // --- OtherSportRepository ---

    @Test
    fun gate_otherSportRepository_sportTypeCrudWithMetricsAndRecords() = runTest {
        val db = createTestDatabase()
        val repo = OtherSportRepositoryImpl(db)

        val sportType = com.trainrecorder.domain.model.OtherSportType(
            id = "st-g", displayName = "Running", isCustom = true,
            createdAt = testInstant, updatedAt = testInstant,
        )
        val metric = com.trainrecorder.domain.model.OtherSportMetric(
            id = "m-g", sportTypeId = "st-g", metricName = "Distance", metricKey = "distance",
            inputType = MetricInputType.NUMBER, isRequired = true, unit = "km",
            createdAt = testInstant, updatedAt = testInstant,
        )

        // Create sport type with metrics
        assertTrue(repo.createSportType(sportType, listOf(metric)).isSuccess)
        val types = repo.getSportTypes().first()
        assertEquals(1, types.size)
        assertEquals("Running", types[0].displayName)

        // Create record
        val record = com.trainrecorder.domain.model.OtherSportRecord(
            id = "sr-g", sportTypeId = "st-g", recordDate = testDate, notes = "5K",
            createdAt = testInstant, updatedAt = testInstant,
        )
        val metricValue = com.trainrecorder.domain.model.OtherSportMetricValue(
            id = "mv-g", sportRecordId = "sr-g", metricId = "m-g", metricValue = "5.0",
            createdAt = testInstant, updatedAt = testInstant,
        )
        assertTrue(repo.createRecord(record, listOf(metricValue)).isSuccess)

        // Delete record
        assertTrue(repo.deleteRecord("sr-g").isSuccess)
    }

    // --- FeelingRepository ---

    @Test
    fun gate_feelingRepository_saveUpdateWithExerciseLevelNotes() = runTest {
        val db = createTestDatabase()
        val repo = FeelingRepositoryImpl(db)

        // Setup session
        db.trainRecorderQueries.insertSession(
            id = "ws-f", plan_id = null, training_day_id = null,
            record_date = "2026-01-15", training_type = "push",
            workout_status = "in_progress", started_at = testInstant.toString(),
            ended_at = null, is_backfill = 0L,
            created_at = testInstant.toString(), updated_at = testInstant.toString(),
        )

        // Save with exercise notes
        val exerciseNotes = listOf(
            com.trainrecorder.domain.repository.ExerciseFeelingInput(exerciseId = "ex-1", notes = "Felt strong"),
        )
        assertTrue(repo.saveFeeling("ws-f", 7, 8, "Great", exerciseNotes).isSuccess)

        val feeling = repo.getFeelingForSession("ws-f").first()
        assertNotNull(feeling)
        assertEquals(7, feeling.fatigueLevel)
        assertEquals(8, feeling.satisfactionLevel)
        assertEquals("Great", feeling.notes)

        // Update
        assertTrue(repo.updateFeeling(feeling.id, 5, 6, "OK").isSuccess)
        val updated = repo.getFeelingForSession("ws-f").first()
        assertNotNull(updated)
        assertEquals(5, updated.fatigueLevel)
    }

    // --- PersonalRecordRepository ---

    @Test
    fun gate_personalRecordRepository_autoUpdateAfterWorkoutAndRecalculateOnDelete() = runTest {
        val db = createTestDatabase()
        val repo = PersonalRecordRepositoryImpl(db)
        val queries = db.trainRecorderQueries

        // Insert exercise
        queries.insertOrIgnoreExercise(
            id = "ex-pr", display_name = "PR Squat", category = "core",
            weight_increment = 2.5, default_rest = 180L, is_custom = 0L,
            created_at = testInstant.toString(), updated_at = testInstant.toString(),
        )

        // Insert session + workout exercise + set
        queries.insertSession(
            id = "ws-pr1", plan_id = null, training_day_id = null,
            record_date = "2026-01-10", training_type = "push",
            workout_status = "completed", started_at = testInstant.toString(),
            ended_at = testInstant.toString(), is_backfill = 0L,
            created_at = testInstant.toString(), updated_at = testInstant.toString(),
        )
        queries.insertWorkoutExercise(
            id = "we-pr1", workout_session_id = "ws-pr1", exercise_id = "ex-pr",
            order_index = 1L, note = null, suggested_weight = null, is_custom_weight = 0L,
            target_sets = 3L, target_reps = 5L, exercise_mode = "fixed", exercise_status = "completed",
            created_at = testInstant.toString(), updated_at = testInstant.toString(),
        )
        queries.insertExerciseSet(
            id = "set-pr1-0", workout_exercise_id = "we-pr1", set_index = 0L,
            target_weight = 100.0, actual_weight = 100.0, target_reps = 5L, actual_reps = 5L,
            is_completed = 1L, rest_started_at = null, rest_duration = null,
            created_at = testInstant.toString(), updated_at = testInstant.toString(),
        )

        // Auto-update after workout
        assertTrue(repo.updateAfterWorkout("ws-pr1").isSuccess)
        val pr = repo.getRecord("ex-pr").first()
        assertNotNull(pr)
        assertEquals(100.0, pr.maxWeight)

        // Add session with higher weight
        queries.insertSession(
            id = "ws-pr2", plan_id = null, training_day_id = null,
            record_date = "2026-01-15", training_type = "push",
            workout_status = "completed", started_at = testInstant.toString(),
            ended_at = testInstant.toString(), is_backfill = 0L,
            created_at = testInstant.toString(), updated_at = testInstant.toString(),
        )
        queries.insertWorkoutExercise(
            id = "we-pr2", workout_session_id = "ws-pr2", exercise_id = "ex-pr",
            order_index = 1L, note = null, suggested_weight = null, is_custom_weight = 0L,
            target_sets = 3L, target_reps = 5L, exercise_mode = "fixed", exercise_status = "completed",
            created_at = testInstant.toString(), updated_at = testInstant.toString(),
        )
        queries.insertExerciseSet(
            id = "set-pr2-0", workout_exercise_id = "we-pr2", set_index = 0L,
            target_weight = 110.0, actual_weight = 110.0, target_reps = 5L, actual_reps = 5L,
            is_completed = 1L, rest_started_at = null, rest_duration = null,
            created_at = testInstant.toString(), updated_at = testInstant.toString(),
        )
        repo.updateAfterWorkout("ws-pr2")
        assertEquals(110.0, repo.getRecord("ex-pr").first()!!.maxWeight)

        // Delete higher session and recalculate
        queries.transaction {
            queries.deleteSetsBySessionId("ws-pr2")
            queries.deleteWorkoutExercisesBySessionId("ws-pr2")
            queries.deleteSessionById("ws-pr2")
        }
        repo.recalculate("ex-pr")
        assertEquals(100.0, repo.getRecord("ex-pr").first()!!.maxWeight)
    }

    // --- WeightSuggestionRepository ---

    @Test
    fun gate_weightSuggestionRepository_cacheLayerAndRecalculation() = runTest {
        val db = createTestDatabase()
        val repo = WeightSuggestionRepositoryImpl(db)
        val queries = db.trainRecorderQueries

        // Insert exercise
        queries.insertOrIgnoreExercise(
            id = "ex-ws", display_name = "WS Squat", category = "core",
            weight_increment = 2.5, default_rest = 180L, is_custom = 0L,
            created_at = testInstant.toString(), updated_at = testInstant.toString(),
        )

        // No history -> null suggestion
        assertNull(repo.getSuggestion("ex-ws").first())

        // Insert workout data
        queries.insertSession(
            id = "ws-sug1", plan_id = null, training_day_id = null,
            record_date = "2026-01-15", training_type = "push",
            workout_status = "completed", started_at = testInstant.toString(),
            ended_at = testInstant.toString(), is_backfill = 0L,
            created_at = testInstant.toString(), updated_at = testInstant.toString(),
        )
        queries.insertWorkoutExercise(
            id = "we-sug1", workout_session_id = "ws-sug1", exercise_id = "ex-ws",
            order_index = 1L, note = null, suggested_weight = null, is_custom_weight = 0L,
            target_sets = 3L, target_reps = 5L, exercise_mode = "fixed", exercise_status = "completed",
            created_at = testInstant.toString(), updated_at = testInstant.toString(),
        )
        for (i in 0..2) {
            queries.insertExerciseSet(
                id = "set-sug1-$i", workout_exercise_id = "we-sug1", set_index = i.toLong(),
                target_weight = 100.0, actual_weight = 100.0, target_reps = 5L, actual_reps = 5L,
                is_completed = 1L, rest_started_at = null, rest_duration = null,
                created_at = testInstant.toString(), updated_at = testInstant.toString(),
            )
        }

        // Recalculate creates cached suggestion
        assertTrue(repo.recalculate("ex-ws").isSuccess)
        val suggestion = repo.getSuggestion("ex-ws").first()
        assertNotNull(suggestion)
        assertEquals(102.5, suggestion.suggestedWeight) // 100 + 2.5 increment
    }

    // ================================================================
    // 2. Use Cases Verification
    // ================================================================

    @Test
    fun gate_weightSuggester_incrementBranch() {
        val suggester = WeightSuggester()
        val sessions = listOf(
            WorkoutExerciseWithSets(
                workoutExercise = com.trainrecorder.domain.model.WorkoutExercise(
                    id = "we-1", workoutSessionId = "ws-1", exerciseId = "ex-1",
                    orderIndex = 0, note = null, suggestedWeight = 60.0, isCustomWeight = false,
                    targetSets = 3, targetReps = 5, exerciseMode = ExerciseMode.FIXED,
                    exerciseStatus = ExerciseStatus.COMPLETED,
                    createdAt = testInstant, updatedAt = testInstant,
                ),
                sets = (0..2).map { i ->
                    com.trainrecorder.domain.model.ExerciseSet(
                        id = "s-$i", workoutExerciseId = "we-1", setIndex = i,
                        targetWeight = 60.0, actualWeight = 60.0, targetReps = 5, actualReps = 5,
                        isCompleted = true, restStartedAt = null, restDuration = null,
                        createdAt = testInstant, updatedAt = testInstant,
                    )
                },
            )
        )

        val result = suggester.calculate("ex-1", 2.5, sessions)
        assertEquals(62.5, result.suggestedWeight)
        assertEquals(1, result.consecutiveCompletions)
    }

    @Test
    fun gate_weightSuggester_holdBranch() {
        val suggester = WeightSuggester()
        val sessions = listOf(
            WorkoutExerciseWithSets(
                workoutExercise = com.trainrecorder.domain.model.WorkoutExercise(
                    id = "we-1", workoutSessionId = "ws-1", exerciseId = "ex-1",
                    orderIndex = 0, note = null, suggestedWeight = 60.0, isCustomWeight = false,
                    targetSets = 3, targetReps = 5, exerciseMode = ExerciseMode.FIXED,
                    exerciseStatus = ExerciseStatus.COMPLETED,
                    createdAt = testInstant, updatedAt = testInstant,
                ),
                sets = listOf(
                    com.trainrecorder.domain.model.ExerciseSet(
                        id = "s-0", workoutExerciseId = "we-1", setIndex = 0,
                        targetWeight = 60.0, actualWeight = 60.0, targetReps = 5, actualReps = 4,
                        isCompleted = true, restStartedAt = null, restDuration = null,
                        createdAt = testInstant, updatedAt = testInstant,
                    ),
                ),
            )
        )

        val result = suggester.calculate("ex-1", 2.5, sessions)
        assertEquals(60.0, result.suggestedWeight) // hold
    }

    @Test
    fun gate_weightSuggester_deloadBranch() {
        val suggester = WeightSuggester()
        val sessions = (1..2).map { idx ->
            WorkoutExerciseWithSets(
                workoutExercise = com.trainrecorder.domain.model.WorkoutExercise(
                    id = "we-$idx", workoutSessionId = "ws-$idx", exerciseId = "ex-1",
                    orderIndex = 0, note = null, suggestedWeight = 60.0, isCustomWeight = false,
                    targetSets = 3, targetReps = 5, exerciseMode = ExerciseMode.FIXED,
                    exerciseStatus = ExerciseStatus.COMPLETED,
                    createdAt = testInstant, updatedAt = testInstant,
                ),
                sets = (0..2).map { i ->
                    com.trainrecorder.domain.model.ExerciseSet(
                        id = "s-$idx-$i", workoutExerciseId = "we-$idx", setIndex = i,
                        targetWeight = 60.0, actualWeight = 60.0, targetReps = 5, actualReps = 3,
                        isCompleted = true, restStartedAt = null, restDuration = null,
                        createdAt = testInstant, updatedAt = testInstant,
                    )
                },
            )
        }

        val result = suggester.calculate("ex-1", 2.5, sessions)
        // 60 * 0.9 = 54.0, floor(54.0 / 2.5) * 2.5 = 52.5
        assertEquals(52.5, result.suggestedWeight)
        assertEquals(2, result.consecutiveFailures)
    }

    @Test
    fun gate_weightSuggester_goodStateBranch() {
        val suggester = WeightSuggester()
        val sessions = (1..3).map { idx ->
            WorkoutExerciseWithSets(
                workoutExercise = com.trainrecorder.domain.model.WorkoutExercise(
                    id = "we-$idx", workoutSessionId = "ws-$idx", exerciseId = "ex-1",
                    orderIndex = 0, note = null, suggestedWeight = 60.0, isCustomWeight = false,
                    targetSets = 3, targetReps = 5, exerciseMode = ExerciseMode.FIXED,
                    exerciseStatus = ExerciseStatus.COMPLETED,
                    createdAt = testInstant, updatedAt = testInstant,
                ),
                sets = (0..2).map { i ->
                    com.trainrecorder.domain.model.ExerciseSet(
                        id = "s-$idx-$i", workoutExerciseId = "we-$idx", setIndex = i,
                        targetWeight = 60.0, actualWeight = 60.0, targetReps = 5, actualReps = 5,
                        isCompleted = true, restStartedAt = null, restDuration = null,
                        createdAt = testInstant, updatedAt = testInstant,
                    )
                },
            )
        }

        val result = suggester.calculate("ex-1", 2.5, sessions)
        assertEquals(SuggestionHint.GOOD_STATE, result.hint)
        assertEquals(3, result.consecutiveCompletions)
    }

    @Test
    fun gate_weightSuggester_firstTimeNullBranch() {
        val suggester = WeightSuggester()
        val result = suggester.calculate("ex-new", 2.5, emptyList())
        assertNull(result.suggestedWeight)
        assertEquals(SuggestionHint.FIRST_TIME, result.hint)
    }

    @Test
    fun gate_scheduleCalculator_weeklyFixedProducesCorrectDayTypes() {
        val calc = ScheduleCalculator()
        val plan = com.trainrecorder.domain.model.TrainingPlan(
            id = "plan-sc", displayName = "SC Plan", planMode = PlanMode.INFINITE_LOOP,
            cycleLength = null, scheduleMode = ScheduleDayType.WEEKLY_FIXED,
            intervalDays = null, isActive = true,
            createdAt = testInstant, updatedAt = testInstant,
        )
        val trainingDays = listOf(
            com.trainrecorder.domain.model.TrainingDay(
                id = "td-1", planId = "plan-sc", displayName = "Push", dayType = TrainingType.PUSH,
                orderIndex = 0, createdAt = testInstant, updatedAt = testInstant,
            ),
            com.trainrecorder.domain.model.TrainingDay(
                id = "td-2", planId = "plan-sc", displayName = "Pull", dayType = TrainingType.PULL,
                orderIndex = 1, createdAt = testInstant, updatedAt = testInstant,
            ),
        )

        // Monday 2026-01-12
        val start = LocalDate.parse("2026-01-12")
        val end = LocalDate.parse("2026-01-18")
        val result = calc.computeSchedule(plan, trainingDays, emptyList(), start, end)

        assertEquals(7, result.size)
        // Mon=Push, Tue=Pull, Wed-Sun=Rest
        assertEquals(com.trainrecorder.domain.usecase.DayType.TRAINING, result[0].type)
        assertEquals(TrainingType.PUSH, result[0].trainingDay?.dayType)
        assertEquals(com.trainrecorder.domain.usecase.DayType.TRAINING, result[1].type)
        assertEquals(TrainingType.PULL, result[1].trainingDay?.dayType)
        for (i in 2..6) {
            assertEquals(com.trainrecorder.domain.usecase.DayType.REST, result[i].type)
        }
    }

    @Test
    fun gate_scheduleCalculator_fixedIntervalProducesCorrectDayTypes() {
        val calc = ScheduleCalculator()
        val plan = com.trainrecorder.domain.model.TrainingPlan(
            id = "plan-fi", displayName = "FI Plan", planMode = PlanMode.INFINITE_LOOP,
            cycleLength = null, scheduleMode = ScheduleDayType.FIXED_INTERVAL,
            intervalDays = 1, isActive = true,
            createdAt = testInstant, updatedAt = testInstant,
        )
        val trainingDays = listOf(
            com.trainrecorder.domain.model.TrainingDay(
                id = "td-1", planId = "plan-fi", displayName = "Push", dayType = TrainingType.PUSH,
                orderIndex = 0, createdAt = testInstant, updatedAt = testInstant,
            ),
            com.trainrecorder.domain.model.TrainingDay(
                id = "td-2", planId = "plan-fi", displayName = "Legs", dayType = TrainingType.LEGS,
                orderIndex = 1, createdAt = testInstant, updatedAt = testInstant,
            ),
        )

        val start = LocalDate.parse("2026-01-12")
        val end = LocalDate.parse("2026-01-17")
        val result = calc.computeSchedule(plan, trainingDays, emptyList(), start, end)

        assertEquals(6, result.size)
        // Day1=Push, Day2=Rest, Day3=Legs, Day4=Rest, Day5=Push, Day6=Rest
        assertEquals(com.trainrecorder.domain.usecase.DayType.TRAINING, result[0].type)
        assertEquals(TrainingType.PUSH, result[0].trainingDay?.dayType)
        assertEquals(com.trainrecorder.domain.usecase.DayType.REST, result[1].type)
        assertEquals(com.trainrecorder.domain.usecase.DayType.TRAINING, result[2].type)
        assertEquals(TrainingType.LEGS, result[2].trainingDay?.dayType)
        assertEquals(com.trainrecorder.domain.usecase.DayType.REST, result[3].type)
        assertEquals(com.trainrecorder.domain.usecase.DayType.TRAINING, result[4].type)
        assertEquals(TrainingType.PUSH, result[4].trainingDay?.dayType)
        assertEquals(com.trainrecorder.domain.usecase.DayType.REST, result[5].type)
    }

    // ================================================================
    // 3. SQLDelight Verification
    // ================================================================

    @Test
    fun gate_sqlDelightSchemaCompilesWithoutErrors() {
        // If this test class compiles and runs, SQLDelight generated code exists and works.
        // The .sq file (793 lines) compiles to TrainRecorderDatabase with all queries.
        val db = createTestDatabase()
        assertNotNull(db)
        assertNotNull(db.trainRecorderQueries)
    }

    // ================================================================
    // 4. Integration: No Phase 1 Regressions
    // ================================================================

    @Test
    fun gate_phase1DomainModelsStillCompile() {
        // Phase 1 gate test verified 19 domain models. Ensure they still exist.
        val models = listOf(
            com.trainrecorder.domain.model.Exercise::class,
            com.trainrecorder.domain.model.TrainingPlan::class,
            com.trainrecorder.domain.model.TrainingDay::class,
            com.trainrecorder.domain.model.TrainingDayExercise::class,
            com.trainrecorder.domain.model.TrainingDaySetConfig::class,
            com.trainrecorder.domain.model.WorkoutSession::class,
            com.trainrecorder.domain.model.WorkoutExercise::class,
            com.trainrecorder.domain.model.ExerciseSet::class,
            com.trainrecorder.domain.model.WorkoutFeeling::class,
            com.trainrecorder.domain.model.ExerciseFeeling::class,
            com.trainrecorder.domain.model.PersonalRecord::class,
            com.trainrecorder.domain.model.WeightSuggestion::class,
            com.trainrecorder.domain.model.BodyMeasurement::class,
            com.trainrecorder.domain.model.OtherSportType::class,
            com.trainrecorder.domain.model.OtherSportMetric::class,
            com.trainrecorder.domain.model.OtherSportRecord::class,
            com.trainrecorder.domain.model.OtherSportMetricValue::class,
            com.trainrecorder.domain.model.TimerState::class,
            com.trainrecorder.domain.model.UserSettings::class,
        )
        assertEquals(19, models.size, "All 19 domain model classes still exist")
    }

    @Test
    fun gate_phase1RepositoryInterfacesStillExist() {
        val interfaces = listOf(
            ExerciseRepository::class,
            TrainingPlanRepository::class,
            WorkoutRepository::class,
            WeightSuggestionRepository::class,
            PersonalRecordRepository::class,
            BodyDataRepository::class,
            OtherSportRepository::class,
            com.trainrecorder.domain.repository.TimerService::class,
            SettingsRepository::class,
            FeelingRepository::class,
        )
        assertEquals(10, interfaces.size, "All 10 repository interfaces still exist")
    }

    @Test
    fun gate_phase1EnumValuesUnchanged() {
        assertEquals(3, WorkoutStatus.entries.size)
        assertEquals(4, ExerciseStatus.entries.size)
        assertEquals(5, TrainingType.entries.size)
        assertEquals(2, WeightUnit.entries.size)
        assertEquals(7, ExerciseCategory.entries.size)
        assertEquals(2, ScheduleDayType.entries.size)
        assertEquals(4, SuggestionHint.entries.size)
        assertEquals(2, ExerciseMode.entries.size)
        assertEquals(2, PlanMode.entries.size)
        assertEquals(2, MetricInputType.entries.size)
    }

    @Test
    fun gate_phase1KoinModulesStillLoad() {
        org.koin.core.context.startKoin {
            modules(com.trainrecorder.di.appModule)
        }.checkModules()
        org.koin.core.context.stopKoin()
    }
}

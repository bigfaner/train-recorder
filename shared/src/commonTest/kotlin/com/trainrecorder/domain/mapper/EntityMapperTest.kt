package com.trainrecorder.domain.mapper

import com.trainrecorder.db.Body_measurement
import com.trainrecorder.db.Exercise
import com.trainrecorder.db.Exercise_feeling
import com.trainrecorder.db.Exercise_set
import com.trainrecorder.db.Other_sport_metric
import com.trainrecorder.db.Other_sport_metric_value
import com.trainrecorder.db.Other_sport_record
import com.trainrecorder.db.Other_sport_type
import com.trainrecorder.db.Personal_record
import com.trainrecorder.db.Timer_state
import com.trainrecorder.db.Training_day
import com.trainrecorder.db.Training_day_exercise
import com.trainrecorder.db.Training_day_set_config
import com.trainrecorder.db.Training_plan
import com.trainrecorder.db.User_settings
import com.trainrecorder.db.Weight_suggestion
import com.trainrecorder.db.Workout_exercise
import com.trainrecorder.db.Workout_feeling
import com.trainrecorder.db.Workout_session
import com.trainrecorder.domain.model.BodyMeasurement
import com.trainrecorder.domain.model.ExerciseCategory
import com.trainrecorder.domain.model.ExerciseFeeling
import com.trainrecorder.domain.model.ExerciseMode
import com.trainrecorder.domain.model.ExerciseSet
import com.trainrecorder.domain.model.ExerciseStatus
import com.trainrecorder.domain.model.MetricInputType
import com.trainrecorder.domain.model.OtherSportMetric
import com.trainrecorder.domain.model.OtherSportMetricValue
import com.trainrecorder.domain.model.OtherSportRecord
import com.trainrecorder.domain.model.OtherSportType
import com.trainrecorder.domain.model.PersonalRecord
import com.trainrecorder.domain.model.PlanMode
import com.trainrecorder.domain.model.ScheduleDayType
import com.trainrecorder.domain.model.TimerState
import com.trainrecorder.domain.model.TrainingDay
import com.trainrecorder.domain.model.TrainingDayExercise
import com.trainrecorder.domain.model.TrainingDaySetConfig
import com.trainrecorder.domain.model.TrainingPlan
import com.trainrecorder.domain.model.TrainingType
import com.trainrecorder.domain.model.UserSettings
import com.trainrecorder.domain.model.WeightSuggestion
import com.trainrecorder.domain.model.WeightUnit
import com.trainrecorder.domain.model.WorkoutExercise
import com.trainrecorder.domain.model.WorkoutFeeling
import com.trainrecorder.domain.model.WorkoutSession
import com.trainrecorder.domain.model.WorkoutStatus
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals

class EntityMapperTest {

    private val testInstant = Instant.parse("2025-01-15T10:30:00Z")
    private val testDate = LocalDate.parse("2025-01-15")

    // ============================================================
    // UserSettings roundtrip
    // ============================================================

    @Test
    fun testUserSettingsRoundtrip() {
        val db = User_settings(
            id = "us-1",
            weight_unit = "kg",
            default_rest_seconds = 180L,
            training_reminder_enabled = 1L,
            vibration_enabled = 1L,
            sound_enabled = 0L,
            onboarding_completed = 0L,
            updated_at = "2025-01-15T10:30:00Z",
        )
        val domain = db.toDomain()
        val restored = domain.toDb()
        assertEquals(db, restored)
    }

    @Test
    fun testUserSettingsLbUnit() {
        val db = User_settings(
            id = "us-2",
            weight_unit = "lb",
            default_rest_seconds = 120L,
            training_reminder_enabled = 0L,
            vibration_enabled = 0L,
            sound_enabled = 1L,
            onboarding_completed = 1L,
            updated_at = "2025-01-15T10:30:00Z",
        )
        val domain = db.toDomain()
        assertEquals(WeightUnit.LB, domain.weightUnit)
        assertEquals(false, domain.trainingReminderEnabled)
        assertEquals(true, domain.onboardingCompleted)
        assertEquals(db, domain.toDb())
    }

    // ============================================================
    // Exercise roundtrip
    // ============================================================

    @Test
    fun testExerciseRoundtrip() {
        val db = Exercise(
            id = "ex-1",
            display_name = "Squat",
            category = "lower",
            weight_increment = 5.0,
            default_rest = 180L,
            is_custom = 0L,
            created_at = "2025-01-15T10:30:00Z",
            updated_at = "2025-01-15T10:30:00Z",
        )
        val domain = db.toDomain()
        assertEquals(ExerciseCategory.LOWER, domain.category)
        assertEquals(false, domain.isCustom)
        assertEquals(db, domain.toDb())
    }

    @Test
    fun testExerciseCustom() {
        val db = Exercise(
            id = "ex-2",
            display_name = "MyExercise",
            category = "custom",
            weight_increment = 2.5,
            default_rest = 90L,
            is_custom = 1L,
            created_at = "2025-01-15T10:30:00Z",
            updated_at = "2025-01-15T10:30:00Z",
        )
        val domain = db.toDomain()
        assertEquals(ExerciseCategory.CUSTOM, domain.category)
        assertEquals(true, domain.isCustom)
        assertEquals(db, domain.toDb())
    }

    // ============================================================
    // TrainingPlan roundtrip
    // ============================================================

    @Test
    fun testTrainingPlanRoundtrip() {
        val db = Training_plan(
            id = "tp-1",
            display_name = "PPL",
            plan_mode = "infinite_loop",
            cycle_length = null,
            schedule_mode = "weekly_fixed",
            interval_days = null,
            is_active = 1L,
            created_at = "2025-01-15T10:30:00Z",
            updated_at = "2025-01-15T10:30:00Z",
        )
        val domain = db.toDomain()
        assertEquals(PlanMode.INFINITE_LOOP, domain.planMode)
        assertEquals(ScheduleDayType.WEEKLY_FIXED, domain.scheduleMode)
        assertEquals(true, domain.isActive)
        assertEquals(db, domain.toDb())
    }

    @Test
    fun testTrainingPlanFixedCycle() {
        val db = Training_plan(
            id = "tp-2",
            display_name = "4Week",
            plan_mode = "fixed_cycle",
            cycle_length = 4L,
            schedule_mode = "fixed_interval",
            interval_days = 2L,
            is_active = 0L,
            created_at = "2025-01-15T10:30:00Z",
            updated_at = "2025-01-15T10:30:00Z",
        )
        val domain = db.toDomain()
        assertEquals(PlanMode.FIXED_CYCLE, domain.planMode)
        assertEquals(4, domain.cycleLength)
        assertEquals(2, domain.intervalDays)
        assertEquals(db, domain.toDb())
    }

    // ============================================================
    // TrainingDay roundtrip
    // ============================================================

    @Test
    fun testTrainingDayRoundtrip() {
        val db = Training_day(
            id = "td-1",
            plan_id = "tp-1",
            display_name = "Push Day",
            day_type = "push",
            order_index = 1L,
            created_at = "2025-01-15T10:30:00Z",
            updated_at = "2025-01-15T10:30:00Z",
        )
        val domain = db.toDomain()
        assertEquals(TrainingType.PUSH, domain.dayType)
        assertEquals(db, domain.toDb())
    }

    // ============================================================
    // TrainingDayExercise roundtrip
    // ============================================================

    @Test
    fun testTrainingDayExerciseRoundtrip() {
        val db = Training_day_exercise(
            id = "tde-1",
            training_day_id = "td-1",
            exercise_id = "ex-1",
            order_index = 1L,
            exercise_mode = "fixed",
            target_sets = 3L,
            target_reps = 5L,
            start_weight = 60.0,
            note = "Pause squat",
            rest_seconds = 180L,
            weight_increment = 2.5,
            created_at = "2025-01-15T10:30:00Z",
            updated_at = "2025-01-15T10:30:00Z",
        )
        val domain = db.toDomain()
        assertEquals(ExerciseMode.FIXED, domain.exerciseMode)
        assertEquals("Pause squat", domain.note)
        assertEquals(db, domain.toDb())
    }

    @Test
    fun testTrainingDayExerciseWithNulls() {
        val db = Training_day_exercise(
            id = "tde-2",
            training_day_id = "td-1",
            exercise_id = "ex-2",
            order_index = 2L,
            exercise_mode = "custom",
            target_sets = 4L,
            target_reps = 8L,
            start_weight = null,
            note = null,
            rest_seconds = 120L,
            weight_increment = 2.5,
            created_at = "2025-01-15T10:30:00Z",
            updated_at = "2025-01-15T10:30:00Z",
        )
        val domain = db.toDomain()
        assertEquals(ExerciseMode.CUSTOM, domain.exerciseMode)
        assertEquals(null, domain.startWeight)
        assertEquals(null, domain.note)
        assertEquals(db, domain.toDb())
    }

    // ============================================================
    // TrainingDaySetConfig roundtrip
    // ============================================================

    @Test
    fun testTrainingDaySetConfigRoundtrip() {
        val db = Training_day_set_config(
            id = "tdsc-1",
            day_exercise_id = "tde-1",
            set_index = 0L,
            target_reps = 5L,
            target_weight = 80.0,
        )
        val domain = db.toDomain()
        assertEquals(0, domain.setIndex)
        assertEquals(db, domain.toDb())
    }

    // ============================================================
    // WorkoutSession roundtrip
    // ============================================================

    @Test
    fun testWorkoutSessionRoundtrip() {
        val db = Workout_session(
            id = "ws-1",
            plan_id = "tp-1",
            training_day_id = "td-1",
            record_date = "2025-01-15",
            training_type = "push",
            workout_status = "in_progress",
            started_at = "2025-01-15T08:00:00Z",
            ended_at = null,
            is_backfill = 0L,
            created_at = "2025-01-15T08:00:00Z",
            updated_at = "2025-01-15T08:00:00Z",
        )
        val domain = db.toDomain()
        assertEquals(WorkoutStatus.IN_PROGRESS, domain.workoutStatus)
        assertEquals(TrainingType.PUSH, domain.trainingType)
        assertEquals(LocalDate.parse("2025-01-15"), domain.recordDate)
        assertEquals(db, domain.toDb())
    }

    @Test
    fun testWorkoutSessionCompletedPartial() {
        val db = Workout_session(
            id = "ws-2",
            plan_id = null,
            training_day_id = null,
            record_date = "2025-01-14",
            training_type = "other",
            workout_status = "completed_partial",
            started_at = null,
            ended_at = "2025-01-14T09:30:00Z",
            is_backfill = 1L,
            created_at = "2025-01-14T09:30:00Z",
            updated_at = "2025-01-14T09:30:00Z",
        )
        val domain = db.toDomain()
        assertEquals(WorkoutStatus.COMPLETED_PARTIAL, domain.workoutStatus)
        assertEquals(true, domain.isBackfill)
        assertEquals(null, domain.planId)
        assertEquals(db, domain.toDb())
    }

    // ============================================================
    // WorkoutExercise roundtrip
    // ============================================================

    @Test
    fun testWorkoutExerciseRoundtrip() {
        val db = Workout_exercise(
            id = "we-1",
            workout_session_id = "ws-1",
            exercise_id = "ex-1",
            order_index = 1L,
            note = null,
            suggested_weight = 80.0,
            is_custom_weight = 0L,
            target_sets = 3L,
            target_reps = 5L,
            exercise_mode = "fixed",
            exercise_status = "pending",
            created_at = "2025-01-15T08:00:00Z",
            updated_at = "2025-01-15T08:00:00Z",
        )
        val domain = db.toDomain()
        assertEquals(ExerciseStatus.PENDING, domain.exerciseStatus)
        assertEquals(ExerciseMode.FIXED, domain.exerciseMode)
        assertEquals(db, domain.toDb())
    }

    @Test
    fun testWorkoutExerciseInProgress() {
        val db = Workout_exercise(
            id = "we-2",
            workout_session_id = "ws-1",
            exercise_id = "ex-2",
            order_index = 2L,
            note = "Light warmup",
            suggested_weight = null,
            is_custom_weight = 1L,
            target_sets = 4L,
            target_reps = 10L,
            exercise_mode = "custom",
            exercise_status = "in_progress",
            created_at = "2025-01-15T08:00:00Z",
            updated_at = "2025-01-15T08:30:00Z",
        )
        val domain = db.toDomain()
        assertEquals(ExerciseStatus.IN_PROGRESS, domain.exerciseStatus)
        assertEquals(true, domain.isCustomWeight)
        assertEquals(db, domain.toDb())
    }

    // ============================================================
    // ExerciseSet roundtrip
    // ============================================================

    @Test
    fun testExerciseSetRoundtrip() {
        val db = Exercise_set(
            id = "es-1",
            workout_exercise_id = "we-1",
            set_index = 0L,
            target_weight = 80.0,
            actual_weight = 80.0,
            target_reps = 5L,
            actual_reps = 5L,
            is_completed = 1L,
            rest_started_at = "2025-01-15T08:05:00Z",
            rest_duration = 180L,
            created_at = "2025-01-15T08:00:00Z",
            updated_at = "2025-01-15T08:05:00Z",
        )
        val domain = db.toDomain()
        assertEquals(true, domain.isCompleted)
        assertEquals(180, domain.restDuration)
        assertEquals(db, domain.toDb())
    }

    @Test
    fun testExerciseSetIncomplete() {
        val db = Exercise_set(
            id = "es-2",
            workout_exercise_id = "we-1",
            set_index = 1L,
            target_weight = 80.0,
            actual_weight = 80.0,
            target_reps = 5L,
            actual_reps = null,
            is_completed = 0L,
            rest_started_at = null,
            rest_duration = null,
            created_at = "2025-01-15T08:00:00Z",
            updated_at = "2025-01-15T08:00:00Z",
        )
        val domain = db.toDomain()
        assertEquals(false, domain.isCompleted)
        assertEquals(null, domain.actualReps)
        assertEquals(db, domain.toDb())
    }

    // ============================================================
    // WorkoutFeeling roundtrip
    // ============================================================

    @Test
    fun testWorkoutFeelingRoundtrip() {
        val db = Workout_feeling(
            id = "wf-1",
            workout_session_id = "ws-1",
            fatigue_level = 7L,
            satisfaction_level = 8L,
            notes = "Great workout!",
            created_at = "2025-01-15T10:00:00Z",
            updated_at = "2025-01-15T10:00:00Z",
        )
        val domain = db.toDomain()
        assertEquals(7, domain.fatigueLevel)
        assertEquals(8, domain.satisfactionLevel)
        assertEquals(db, domain.toDb())
    }

    // ============================================================
    // ExerciseFeeling roundtrip
    // ============================================================

    @Test
    fun testExerciseFeelingRoundtrip() {
        val db = Exercise_feeling(
            id = "ef-1",
            workout_feeling_id = "wf-1",
            exercise_id = "ex-1",
            notes = "Felt strong",
            created_at = "2025-01-15T10:00:00Z",
            updated_at = "2025-01-15T10:00:00Z",
        )
        val domain = db.toDomain()
        assertEquals("Felt strong", domain.notes)
        assertEquals(db, domain.toDb())
    }

    @Test
    fun testExerciseFeelingNullNote() {
        val db = Exercise_feeling(
            id = "ef-2",
            workout_feeling_id = "wf-1",
            exercise_id = "ex-2",
            notes = null,
            created_at = "2025-01-15T10:00:00Z",
            updated_at = "2025-01-15T10:00:00Z",
        )
        val domain = db.toDomain()
        assertEquals(null, domain.notes)
        assertEquals(db, domain.toDb())
    }

    // ============================================================
    // PersonalRecord roundtrip
    // ============================================================

    @Test
    fun testPersonalRecordRoundtrip() {
        val db = Personal_record(
            id = "pr-1",
            exercise_id = "ex-1",
            max_weight = 120.0,
            max_volume = 600.0,
            max_weight_date = "2025-01-10",
            max_volume_date = "2025-01-12",
            max_weight_session_id = "ws-old-1",
            max_volume_session_id = "ws-old-2",
            created_at = "2025-01-10T10:00:00Z",
            updated_at = "2025-01-12T10:00:00Z",
        )
        val domain = db.toDomain()
        assertEquals(LocalDate.parse("2025-01-10"), domain.maxWeightDate)
        assertEquals(db, domain.toDb())
    }

    // ============================================================
    // WeightSuggestion roundtrip
    // ============================================================

    @Test
    fun testWeightSuggestionRoundtrip() {
        val db = Weight_suggestion(
            id = "wsg-1",
            exercise_id = "ex-1",
            suggested_weight = 82.5,
            based_on_session_id = "ws-1",
            consecutive_completions = 3L,
            consecutive_failures = 0L,
            last_calculated_at = "2025-01-15T10:00:00Z",
            created_at = "2025-01-15T10:00:00Z",
            updated_at = "2025-01-15T10:00:00Z",
        )
        val domain = db.toDomain()
        assertEquals(82.5, domain.suggestedWeight!!)
        assertEquals(db, domain.toDb())
    }

    @Test
    fun testWeightSuggestionFirstTime() {
        val db = Weight_suggestion(
            id = "wsg-2",
            exercise_id = "ex-new",
            suggested_weight = null,
            based_on_session_id = null,
            consecutive_completions = 0L,
            consecutive_failures = 0L,
            last_calculated_at = "2025-01-15T10:00:00Z",
            created_at = "2025-01-15T10:00:00Z",
            updated_at = "2025-01-15T10:00:00Z",
        )
        val domain = db.toDomain()
        assertEquals(null, domain.suggestedWeight)
        assertEquals(db, domain.toDb())
    }

    // ============================================================
    // BodyMeasurement roundtrip
    // ============================================================

    @Test
    fun testBodyMeasurementRoundtrip() {
        val db = Body_measurement(
            id = "bm-1",
            record_date = "2025-01-15",
            body_weight = 75.5,
            chest = 100.0,
            waist = 80.0,
            arm = 35.0,
            thigh = 55.0,
            notes = "Feeling lean",
            created_at = "2025-01-15T10:00:00Z",
            updated_at = "2025-01-15T10:00:00Z",
        )
        val domain = db.toDomain()
        assertEquals(LocalDate.parse("2025-01-15"), domain.recordDate)
        assertEquals(75.5, domain.bodyWeight!!)
        assertEquals(db, domain.toDb())
    }

    @Test
    fun testBodyMeasurementMinimal() {
        val db = Body_measurement(
            id = "bm-2",
            record_date = "2025-01-16",
            body_weight = 76.0,
            chest = null,
            waist = null,
            arm = null,
            thigh = null,
            notes = null,
            created_at = "2025-01-16T10:00:00Z",
            updated_at = "2025-01-16T10:00:00Z",
        )
        val domain = db.toDomain()
        assertEquals(null, domain.chest)
        assertEquals(db, domain.toDb())
    }

    // ============================================================
    // OtherSportType roundtrip
    // ============================================================

    @Test
    fun testOtherSportTypeRoundtrip() {
        val db = Other_sport_type(
            id = "ost-1",
            display_name = "Swimming",
            is_custom = 0L,
            created_at = "2025-01-15T10:00:00Z",
            updated_at = "2025-01-15T10:00:00Z",
        )
        val domain = db.toDomain()
        assertEquals(false, domain.isCustom)
        assertEquals(db, domain.toDb())
    }

    // ============================================================
    // OtherSportMetric roundtrip
    // ============================================================

    @Test
    fun testOtherSportMetricRoundtrip() {
        val db = Other_sport_metric(
            id = "osm-1",
            sport_type_id = "ost-1",
            metric_name = "Distance",
            metric_key = "distance",
            input_type = "number",
            is_required = 1L,
            unit = "m",
            created_at = "2025-01-15T10:00:00Z",
            updated_at = "2025-01-15T10:00:00Z",
        )
        val domain = db.toDomain()
        assertEquals(MetricInputType.NUMBER, domain.inputType)
        assertEquals(true, domain.isRequired)
        assertEquals(db, domain.toDb())
    }

    // ============================================================
    // OtherSportRecord roundtrip
    // ============================================================

    @Test
    fun testOtherSportRecordRoundtrip() {
        val db = Other_sport_record(
            id = "osr-1",
            sport_type_id = "ost-1",
            record_date = "2025-01-15",
            notes = "Pool session",
            created_at = "2025-01-15T10:00:00Z",
            updated_at = "2025-01-15T10:00:00Z",
        )
        val domain = db.toDomain()
        assertEquals(LocalDate.parse("2025-01-15"), domain.recordDate)
        assertEquals(db, domain.toDb())
    }

    // ============================================================
    // OtherSportMetricValue roundtrip
    // ============================================================

    @Test
    fun testOtherSportMetricValueRoundtrip() {
        val db = Other_sport_metric_value(
            id = "osmv-1",
            sport_record_id = "osr-1",
            metric_id = "osm-1",
            metric_value = "1500",
            created_at = "2025-01-15T10:00:00Z",
            updated_at = "2025-01-15T10:00:00Z",
        )
        val domain = db.toDomain()
        assertEquals("1500", domain.metricValue)
        assertEquals(db, domain.toDb())
    }

    // ============================================================
    // TimerState roundtrip
    // ============================================================

    @Test
    fun testTimerStateRoundtrip() {
        val db = Timer_state(
            id = "ts-1",
            workout_session_id = "ws-1",
            start_timestamp = "2025-01-15T08:05:00Z",
            total_duration_seconds = 180L,
            is_running = 1L,
            updated_at = "2025-01-15T08:05:00Z",
        )
        val domain = db.toDomain()
        assertEquals(true, domain.isRunning)
        assertEquals(180, domain.totalDurationSeconds)
        assertEquals(db, domain.toDb())
    }

    @Test
    fun testTimerStatePaused() {
        val db = Timer_state(
            id = "ts-2",
            workout_session_id = "ws-1",
            start_timestamp = "2025-01-15T08:10:00Z",
            total_duration_seconds = 300L,
            is_running = 0L,
            updated_at = "2025-01-15T08:10:00Z",
        )
        val domain = db.toDomain()
        assertEquals(false, domain.isRunning)
        assertEquals(db, domain.toDb())
    }

    // ============================================================
    // Enum completeness tests
    // ============================================================

    @Test
    fun testAllWorkoutStatusesHaveValues() {
        val statuses = WorkoutStatus.entries
        assertEquals(3, statuses.size)
        assertEquals("in_progress", WorkoutStatus.IN_PROGRESS.value)
        assertEquals("completed", WorkoutStatus.COMPLETED.value)
        assertEquals("completed_partial", WorkoutStatus.COMPLETED_PARTIAL.value)
    }

    @Test
    fun testAllExerciseStatusesHaveValues() {
        val statuses = ExerciseStatus.entries
        assertEquals(4, statuses.size)
    }

    @Test
    fun testAllTrainingTypesHaveValues() {
        val types = TrainingType.entries
        assertEquals(5, types.size)
    }

    @Test
    fun testAllExerciseCategoriesHaveValues() {
        val cats = ExerciseCategory.entries
        assertEquals(7, cats.size)
    }

    @Test
    fun testAllWeightUnitsHaveValues() {
        val units = WeightUnit.entries
        assertEquals(2, units.size)
    }

    @Test
    fun testWeightSuggestionHintComputation() {
        // First time - no history
        val firstTime = WeightSuggestion(
            id = "1", exerciseId = "ex", suggestedWeight = null,
            basedOnSessionId = null, consecutiveCompletions = 0, consecutiveFailures = 0,
            lastCalculatedAt = testInstant, createdAt = testInstant, updatedAt = testInstant,
        )
        assertEquals(com.trainrecorder.domain.model.SuggestionHint.FIRST_TIME, firstTime.hint)

        // Good state - 3+ consecutive completions
        val goodState = firstTime.copy(suggestedWeight = 80.0, consecutiveCompletions = 3)
        assertEquals(com.trainrecorder.domain.model.SuggestionHint.GOOD_STATE, goodState.hint)

        // Reduce - 3+ consecutive failures
        val reduce = firstTime.copy(suggestedWeight = 80.0, consecutiveFailures = 3)
        assertEquals(com.trainrecorder.domain.model.SuggestionHint.REDUCE_10PC, reduce.hint)

        // Normal
        val normal = firstTime.copy(suggestedWeight = 80.0, consecutiveCompletions = 1, consecutiveFailures = 0)
        assertEquals(com.trainrecorder.domain.model.SuggestionHint.NONE, normal.hint)
    }

    @Test
    fun testEnumFromValueRoundtrip() {
        // Verify all enum fromValue/value roundtrip
        WorkoutStatus.entries.forEach { status ->
            assertEquals(status, WorkoutStatus.fromValue(status.value))
        }
        ExerciseStatus.entries.forEach { status ->
            assertEquals(status, ExerciseStatus.fromValue(status.value))
        }
        TrainingType.entries.forEach { type ->
            assertEquals(type, TrainingType.fromValue(type.value))
        }
        WeightUnit.entries.forEach { unit ->
            assertEquals(unit, WeightUnit.fromValue(unit.value))
        }
        ExerciseCategory.entries.forEach { cat ->
            assertEquals(cat, ExerciseCategory.fromValue(cat.value))
        }
        ScheduleDayType.entries.forEach { mode ->
            assertEquals(mode, ScheduleDayType.fromValue(mode.value))
        }
        PlanMode.entries.forEach { mode ->
            assertEquals(mode, PlanMode.fromValue(mode.value))
        }
        ExerciseMode.entries.forEach { mode ->
            assertEquals(mode, ExerciseMode.fromValue(mode.value))
        }
        MetricInputType.entries.forEach { type ->
            assertEquals(type, MetricInputType.fromValue(type.value))
        }
    }
}

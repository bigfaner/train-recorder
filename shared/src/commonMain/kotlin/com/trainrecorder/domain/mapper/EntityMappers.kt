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

// ============================================================
// Helper extensions for type conversions
// ============================================================

private fun Long.toBoolean(): Boolean = this != 0L
private fun Boolean.toLong(): Long = if (this) 1L else 0L

// ============================================================
// UserSettings
// ============================================================

fun User_settings.toDomain(): UserSettings = UserSettings(
    id = id,
    weightUnit = WeightUnit.fromValue(weight_unit),
    defaultRestSeconds = default_rest_seconds.toInt(),
    trainingReminderEnabled = training_reminder_enabled.toBoolean(),
    vibrationEnabled = vibration_enabled.toBoolean(),
    soundEnabled = sound_enabled.toBoolean(),
    onboardingCompleted = onboarding_completed.toBoolean(),
    updatedAt = Instant.parse(updated_at),
)

fun UserSettings.toDb(): User_settings = User_settings(
    id = id,
    weight_unit = weightUnit.value,
    default_rest_seconds = defaultRestSeconds.toLong(),
    training_reminder_enabled = trainingReminderEnabled.toLong(),
    vibration_enabled = vibrationEnabled.toLong(),
    sound_enabled = soundEnabled.toLong(),
    onboarding_completed = onboardingCompleted.toLong(),
    updated_at = updatedAt.toString(),
)

// ============================================================
// Exercise
// ============================================================

fun Exercise.toDomain(): com.trainrecorder.domain.model.Exercise =
    com.trainrecorder.domain.model.Exercise(
        id = id,
        displayName = display_name,
        category = ExerciseCategory.fromValue(category),
        weightIncrement = weight_increment,
        defaultRest = default_rest.toInt(),
        isCustom = is_custom.toBoolean(),
        createdAt = Instant.parse(created_at),
        updatedAt = Instant.parse(updated_at),
    )

fun com.trainrecorder.domain.model.Exercise.toDb(): Exercise = Exercise(
    id = id,
    display_name = displayName,
    category = category.value,
    weight_increment = weightIncrement,
    default_rest = defaultRest.toLong(),
    is_custom = isCustom.toLong(),
    created_at = createdAt.toString(),
    updated_at = updatedAt.toString(),
)

// ============================================================
// TrainingPlan
// ============================================================

fun Training_plan.toDomain(): TrainingPlan = TrainingPlan(
    id = id,
    displayName = display_name,
    planMode = PlanMode.fromValue(plan_mode),
    cycleLength = cycle_length?.toInt(),
    scheduleMode = ScheduleDayType.fromValue(schedule_mode),
    intervalDays = interval_days?.toInt(),
    isActive = is_active.toBoolean(),
    createdAt = Instant.parse(created_at),
    updatedAt = Instant.parse(updated_at),
)

fun TrainingPlan.toDb(): Training_plan = Training_plan(
    id = id,
    display_name = displayName,
    plan_mode = planMode.value,
    cycle_length = cycleLength?.toLong(),
    schedule_mode = scheduleMode.value,
    interval_days = intervalDays?.toLong(),
    is_active = isActive.toLong(),
    created_at = createdAt.toString(),
    updated_at = updatedAt.toString(),
)

// ============================================================
// TrainingDay
// ============================================================

fun Training_day.toDomain(): TrainingDay = TrainingDay(
    id = id,
    planId = plan_id,
    displayName = display_name,
    dayType = TrainingType.fromValue(day_type),
    orderIndex = order_index.toInt(),
    createdAt = Instant.parse(created_at),
    updatedAt = Instant.parse(updated_at),
)

fun TrainingDay.toDb(): Training_day = Training_day(
    id = id,
    plan_id = planId,
    display_name = displayName,
    day_type = dayType.value,
    order_index = orderIndex.toLong(),
    created_at = createdAt.toString(),
    updated_at = updatedAt.toString(),
)

// ============================================================
// TrainingDayExercise
// ============================================================

fun Training_day_exercise.toDomain(): TrainingDayExercise = TrainingDayExercise(
    id = id,
    trainingDayId = training_day_id,
    exerciseId = exercise_id,
    orderIndex = order_index.toInt(),
    exerciseMode = ExerciseMode.fromValue(exercise_mode),
    targetSets = target_sets.toInt(),
    targetReps = target_reps.toInt(),
    startWeight = start_weight,
    note = note,
    restSeconds = rest_seconds.toInt(),
    weightIncrement = weight_increment,
    createdAt = Instant.parse(created_at),
    updatedAt = Instant.parse(updated_at),
)

fun TrainingDayExercise.toDb(): Training_day_exercise = Training_day_exercise(
    id = id,
    training_day_id = trainingDayId,
    exercise_id = exerciseId,
    order_index = orderIndex.toLong(),
    exercise_mode = exerciseMode.value,
    target_sets = targetSets.toLong(),
    target_reps = targetReps.toLong(),
    start_weight = startWeight,
    note = note,
    rest_seconds = restSeconds.toLong(),
    weight_increment = weightIncrement,
    created_at = createdAt.toString(),
    updated_at = updatedAt.toString(),
)

// ============================================================
// TrainingDaySetConfig
// ============================================================

fun Training_day_set_config.toDomain(): TrainingDaySetConfig = TrainingDaySetConfig(
    id = id,
    dayExerciseId = day_exercise_id,
    setIndex = set_index.toInt(),
    targetReps = target_reps.toInt(),
    targetWeight = target_weight,
)

fun TrainingDaySetConfig.toDb(): Training_day_set_config = Training_day_set_config(
    id = id,
    day_exercise_id = dayExerciseId,
    set_index = setIndex.toLong(),
    target_reps = targetReps.toLong(),
    target_weight = targetWeight,
)

// ============================================================
// WorkoutSession
// ============================================================

fun Workout_session.toDomain(): WorkoutSession = WorkoutSession(
    id = id,
    planId = plan_id,
    trainingDayId = training_day_id,
    recordDate = LocalDate.parse(record_date),
    trainingType = TrainingType.fromValue(training_type),
    workoutStatus = WorkoutStatus.fromValue(workout_status),
    startedAt = started_at?.let { Instant.parse(it) },
    endedAt = ended_at?.let { Instant.parse(it) },
    isBackfill = is_backfill.toBoolean(),
    createdAt = Instant.parse(created_at),
    updatedAt = Instant.parse(updated_at),
)

fun WorkoutSession.toDb(): Workout_session = Workout_session(
    id = id,
    plan_id = planId,
    training_day_id = trainingDayId,
    record_date = recordDate.toString(),
    training_type = trainingType.value,
    workout_status = workoutStatus.value,
    started_at = startedAt?.toString(),
    ended_at = endedAt?.toString(),
    is_backfill = isBackfill.toLong(),
    created_at = createdAt.toString(),
    updated_at = updatedAt.toString(),
)

// ============================================================
// WorkoutExercise
// ============================================================

fun Workout_exercise.toDomain(): WorkoutExercise = WorkoutExercise(
    id = id,
    workoutSessionId = workout_session_id,
    exerciseId = exercise_id,
    orderIndex = order_index.toInt(),
    note = note,
    suggestedWeight = suggested_weight,
    isCustomWeight = is_custom_weight.toBoolean(),
    targetSets = target_sets.toInt(),
    targetReps = target_reps.toInt(),
    exerciseMode = ExerciseMode.fromValue(exercise_mode),
    exerciseStatus = ExerciseStatus.fromValue(exercise_status),
    createdAt = Instant.parse(created_at),
    updatedAt = Instant.parse(updated_at),
)

fun WorkoutExercise.toDb(): Workout_exercise = Workout_exercise(
    id = id,
    workout_session_id = workoutSessionId,
    exercise_id = exerciseId,
    order_index = orderIndex.toLong(),
    note = note,
    suggested_weight = suggestedWeight,
    is_custom_weight = isCustomWeight.toLong(),
    target_sets = targetSets.toLong(),
    target_reps = targetReps.toLong(),
    exercise_mode = exerciseMode.value,
    exercise_status = exerciseStatus.value,
    created_at = createdAt.toString(),
    updated_at = updatedAt.toString(),
)

// ============================================================
// ExerciseSet
// ============================================================

fun Exercise_set.toDomain(): ExerciseSet = ExerciseSet(
    id = id,
    workoutExerciseId = workout_exercise_id,
    setIndex = set_index.toInt(),
    targetWeight = target_weight,
    actualWeight = actual_weight,
    targetReps = target_reps.toInt(),
    actualReps = actual_reps?.toInt(),
    isCompleted = is_completed.toBoolean(),
    restStartedAt = rest_started_at?.let { Instant.parse(it) },
    restDuration = rest_duration?.toInt(),
    createdAt = Instant.parse(created_at),
    updatedAt = Instant.parse(updated_at),
)

fun ExerciseSet.toDb(): Exercise_set = Exercise_set(
    id = id,
    workout_exercise_id = workoutExerciseId,
    set_index = setIndex.toLong(),
    target_weight = targetWeight,
    actual_weight = actualWeight,
    target_reps = targetReps.toLong(),
    actual_reps = actualReps?.toLong(),
    is_completed = isCompleted.toLong(),
    rest_started_at = restStartedAt?.toString(),
    rest_duration = restDuration?.toLong(),
    created_at = createdAt.toString(),
    updated_at = updatedAt.toString(),
)

// ============================================================
// WorkoutFeeling
// ============================================================

fun Workout_feeling.toDomain(): WorkoutFeeling = WorkoutFeeling(
    id = id,
    workoutSessionId = workout_session_id,
    fatigueLevel = fatigue_level.toInt(),
    satisfactionLevel = satisfaction_level.toInt(),
    notes = notes,
    createdAt = Instant.parse(created_at),
    updatedAt = Instant.parse(updated_at),
)

fun WorkoutFeeling.toDb(): Workout_feeling = Workout_feeling(
    id = id,
    workout_session_id = workoutSessionId,
    fatigue_level = fatigueLevel.toLong(),
    satisfaction_level = satisfactionLevel.toLong(),
    notes = notes,
    created_at = createdAt.toString(),
    updated_at = updatedAt.toString(),
)

// ============================================================
// ExerciseFeeling
// ============================================================

fun Exercise_feeling.toDomain(): ExerciseFeeling = ExerciseFeeling(
    id = id,
    workoutFeelingId = workout_feeling_id,
    exerciseId = exercise_id,
    notes = notes,
    createdAt = Instant.parse(created_at),
    updatedAt = Instant.parse(updated_at),
)

fun ExerciseFeeling.toDb(): Exercise_feeling = Exercise_feeling(
    id = id,
    workout_feeling_id = workoutFeelingId,
    exercise_id = exerciseId,
    notes = notes,
    created_at = createdAt.toString(),
    updated_at = updatedAt.toString(),
)

// ============================================================
// PersonalRecord
// ============================================================

fun Personal_record.toDomain(): PersonalRecord = PersonalRecord(
    id = id,
    exerciseId = exercise_id,
    maxWeight = max_weight,
    maxVolume = max_volume,
    maxWeightDate = LocalDate.parse(max_weight_date),
    maxVolumeDate = LocalDate.parse(max_volume_date),
    maxWeightSessionId = max_weight_session_id,
    maxVolumeSessionId = max_volume_session_id,
    createdAt = Instant.parse(created_at),
    updatedAt = Instant.parse(updated_at),
)

fun PersonalRecord.toDb(): Personal_record = Personal_record(
    id = id,
    exercise_id = exerciseId,
    max_weight = maxWeight,
    max_volume = maxVolume,
    max_weight_date = maxWeightDate.toString(),
    max_volume_date = maxVolumeDate.toString(),
    max_weight_session_id = maxWeightSessionId,
    max_volume_session_id = maxVolumeSessionId,
    created_at = createdAt.toString(),
    updated_at = updatedAt.toString(),
)

// ============================================================
// WeightSuggestion
// ============================================================

fun Weight_suggestion.toDomain(): WeightSuggestion = WeightSuggestion(
    id = id,
    exerciseId = exercise_id,
    suggestedWeight = suggested_weight,
    basedOnSessionId = based_on_session_id,
    consecutiveCompletions = consecutive_completions.toInt(),
    consecutiveFailures = consecutive_failures.toInt(),
    lastCalculatedAt = Instant.parse(last_calculated_at),
    createdAt = Instant.parse(created_at),
    updatedAt = Instant.parse(updated_at),
)

fun WeightSuggestion.toDb(): Weight_suggestion = Weight_suggestion(
    id = id,
    exercise_id = exerciseId,
    suggested_weight = suggestedWeight,
    based_on_session_id = basedOnSessionId,
    consecutive_completions = consecutiveCompletions.toLong(),
    consecutive_failures = consecutiveFailures.toLong(),
    last_calculated_at = lastCalculatedAt.toString(),
    created_at = createdAt.toString(),
    updated_at = updatedAt.toString(),
)

// ============================================================
// BodyMeasurement
// ============================================================

fun Body_measurement.toDomain(): BodyMeasurement = BodyMeasurement(
    id = id,
    recordDate = LocalDate.parse(record_date),
    bodyWeight = body_weight,
    chest = chest,
    waist = waist,
    arm = arm,
    thigh = thigh,
    notes = notes,
    createdAt = Instant.parse(created_at),
    updatedAt = Instant.parse(updated_at),
)

fun BodyMeasurement.toDb(): Body_measurement = Body_measurement(
    id = id,
    record_date = recordDate.toString(),
    body_weight = bodyWeight,
    chest = chest,
    waist = waist,
    arm = arm,
    thigh = thigh,
    notes = notes,
    created_at = createdAt.toString(),
    updated_at = updatedAt.toString(),
)

// ============================================================
// OtherSportType
// ============================================================

fun Other_sport_type.toDomain(): OtherSportType = OtherSportType(
    id = id,
    displayName = display_name,
    isCustom = is_custom.toBoolean(),
    createdAt = Instant.parse(created_at),
    updatedAt = Instant.parse(updated_at),
)

fun OtherSportType.toDb(): Other_sport_type = Other_sport_type(
    id = id,
    display_name = displayName,
    is_custom = isCustom.toLong(),
    created_at = createdAt.toString(),
    updated_at = updatedAt.toString(),
)

// ============================================================
// OtherSportMetric
// ============================================================

fun Other_sport_metric.toDomain(): OtherSportMetric = OtherSportMetric(
    id = id,
    sportTypeId = sport_type_id,
    metricName = metric_name,
    metricKey = metric_key,
    inputType = MetricInputType.fromValue(input_type),
    isRequired = is_required.toBoolean(),
    unit = unit,
    createdAt = Instant.parse(created_at),
    updatedAt = Instant.parse(updated_at),
)

fun OtherSportMetric.toDb(): Other_sport_metric = Other_sport_metric(
    id = id,
    sport_type_id = sportTypeId,
    metric_name = metricName,
    metric_key = metricKey,
    input_type = inputType.value,
    is_required = isRequired.toLong(),
    unit = unit,
    created_at = createdAt.toString(),
    updated_at = updatedAt.toString(),
)

// ============================================================
// OtherSportRecord
// ============================================================

fun Other_sport_record.toDomain(): OtherSportRecord = OtherSportRecord(
    id = id,
    sportTypeId = sport_type_id,
    recordDate = LocalDate.parse(record_date),
    notes = notes,
    createdAt = Instant.parse(created_at),
    updatedAt = Instant.parse(updated_at),
)

fun OtherSportRecord.toDb(): Other_sport_record = Other_sport_record(
    id = id,
    sport_type_id = sportTypeId,
    record_date = recordDate.toString(),
    notes = notes,
    created_at = createdAt.toString(),
    updated_at = updatedAt.toString(),
)

// ============================================================
// OtherSportMetricValue
// ============================================================

fun Other_sport_metric_value.toDomain(): OtherSportMetricValue = OtherSportMetricValue(
    id = id,
    sportRecordId = sport_record_id,
    metricId = metric_id,
    metricValue = metric_value,
    createdAt = Instant.parse(created_at),
    updatedAt = Instant.parse(updated_at),
)

fun OtherSportMetricValue.toDb(): Other_sport_metric_value = Other_sport_metric_value(
    id = id,
    sport_record_id = sportRecordId,
    metric_id = metricId,
    metric_value = metricValue,
    created_at = createdAt.toString(),
    updated_at = updatedAt.toString(),
)

// ============================================================
// TimerState
// ============================================================

fun Timer_state.toDomain(): TimerState = TimerState(
    id = id,
    workoutSessionId = workout_session_id,
    startTimestamp = Instant.parse(start_timestamp),
    totalDurationSeconds = total_duration_seconds.toInt(),
    isRunning = is_running.toBoolean(),
    updatedAt = Instant.parse(updated_at),
)

fun TimerState.toDb(): Timer_state = Timer_state(
    id = id,
    workout_session_id = workoutSessionId,
    start_timestamp = startTimestamp.toString(),
    total_duration_seconds = totalDurationSeconds.toLong(),
    is_running = isRunning.toLong(),
    updated_at = updatedAt.toString(),
)

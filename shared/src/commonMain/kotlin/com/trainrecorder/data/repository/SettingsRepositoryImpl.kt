package com.trainrecorder.data.repository

import app.cash.sqldelight.coroutines.asFlow
import app.cash.sqldelight.coroutines.mapToOne
import com.trainrecorder.db.TrainRecorderDatabase
import com.trainrecorder.domain.mapper.toDomain
import com.trainrecorder.domain.model.DomainError
import com.trainrecorder.domain.model.WeightUnit
import com.trainrecorder.domain.repository.DateRange
import com.trainrecorder.domain.repository.ExportFormat
import com.trainrecorder.domain.repository.ImportResult
import com.trainrecorder.domain.repository.SettingsRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.IO
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.datetime.Clock
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

/**
 * SQLDelight-backed implementation of SettingsRepository.
 */
class SettingsRepositoryImpl(
    private val database: TrainRecorderDatabase,
    private val json: Json = Json { ignoreUnknownKeys = true; prettyPrint = true },
) : SettingsRepository {

    private val queries = database.trainRecorderQueries
    private val settingsId = "default"

    override fun getSettings(): Flow<com.trainrecorder.domain.model.UserSettings> =
        queries.selectSettings().asFlow().mapToOne(Dispatchers.IO).map { it.toDomain() }

    override suspend fun updateWeightUnit(unit: WeightUnit): Result<Unit> = runCatching {
        val now = Clock.System.now().toString()
        queries.updateWeightUnit(unit.value, now, settingsId)
    }

    override suspend fun updateDefaultRest(seconds: Int): Result<Unit> = runCatching {
        val now = Clock.System.now().toString()
        queries.updateDefaultRest(seconds.toLong(), now, settingsId)
    }

    override suspend fun updateNotifications(reminder: Boolean, vibration: Boolean, sound: Boolean): Result<Unit> = runCatching {
        val now = Clock.System.now().toString()
        queries.updateNotifications(
            training_reminder_enabled = if (reminder) 1L else 0L,
            vibration_enabled = if (vibration) 1L else 0L,
            sound_enabled = if (sound) 1L else 0L,
            updated_at = now,
            id = settingsId,
        )
    }

    override suspend fun completeOnboarding(): Result<Unit> = runCatching {
        val now = Clock.System.now().toString()
        queries.completeOnboarding(now, settingsId)
    }

    override suspend fun exportData(format: ExportFormat, dateRange: DateRange?): Result<String> = runCatching {
        when (format) {
            ExportFormat.JSON -> exportAsJson(dateRange)
            ExportFormat.CSV -> throw DomainError.ExportFailedError("CSV export not yet implemented")
        }
    }

    override suspend fun importData(filePath: String): Result<ImportResult> = runCatching {
        throw DomainError.ExportFailedError("Import from file not yet supported in shared module")
    }

    override suspend fun importDataFromJson(jsonString: String): Result<ImportResult> = runCatching {
        // Validate schema first
        val jsonElement = try {
            Json.parseToJsonElement(jsonString)
        } catch (e: Exception) {
            throw DomainError.ExportFailedError("Invalid JSON: ${e.message}")
        }

        val obj = jsonElement as? JsonObject
            ?: throw DomainError.ExportFailedError("Expected JSON object at top level")

        // Check version
        val version = obj["version"]?.jsonPrimitive?.intOrNull
        if (version != 1) {
            throw DomainError.ExportFailedError("Unsupported version: $version (expected 1)")
        }

        var importedCount = 0
        var skippedCount = 0
        val errors = mutableListOf<String>()

        // Build ID mappings for all entities to regenerate IDs
        val allOldIds = mutableListOf<String>()
        listOf(
            "trainingPlans", "trainingDays", "trainingDayExercises",
            "trainingDaySetConfigs", "workoutSessions", "workoutExercises",
            "exerciseSets", "workoutFeelings", "exerciseFeelings",
            "personalRecords", "weightSuggestions", "bodyMeasurements",
            "otherSportTypes", "otherSportMetrics", "otherSportRecords",
            "otherSportMetricValues", "timerStates",
        ).forEach { key ->
            obj[key]?.jsonArray?.forEach { element ->
                (element as? JsonObject)?.get("id")?.jsonPrimitive?.contentOrNull?.let {
                    allOldIds.add(it)
                }
            }
        }

        val idMapping = allOldIds.associateWith { generateNewId() }

        // Helper to remap IDs
        fun remapId(oldId: String?): String? = oldId?.let { idMapping[it] ?: it }

        // Use transaction for atomic import with rollback
        queries.transactionWithResult {
            // Import training plans
            obj["trainingPlans"]?.jsonArray?.forEach { element ->
                try {
                    val row = element.jsonObject
                    val newId = remapId(row.str("id")) ?: generateNewId()
                    queries.insertPlan(
                        id = newId,
                        display_name = row.requireStr("display_name"),
                        plan_mode = row.requireStr("plan_mode"),
                        cycle_length = row.long("cycle_length"),
                        schedule_mode = row.requireStr("schedule_mode"),
                        interval_days = row.long("interval_days"),
                        is_active = row.long("is_active") ?: 0L,
                        created_at = row.requireStr("created_at"),
                        updated_at = row.requireStr("updated_at"),
                    )
                    importedCount++
                } catch (e: Exception) {
                    skippedCount++
                    errors.add("trainingPlan: ${e.message}")
                }
            }

            // Import training days
            obj["trainingDays"]?.jsonArray?.forEach { element ->
                try {
                    val row = element.jsonObject
                    val newId = remapId(row.str("id")) ?: generateNewId()
                    val newPlanId = remapId(row.str("plan_id")) ?: row.requireStr("plan_id")
                    queries.insertDay(
                        id = newId,
                        plan_id = newPlanId,
                        display_name = row.requireStr("display_name"),
                        day_type = row.requireStr("day_type"),
                        order_index = row.long("order_index") ?: 0L,
                        created_at = row.requireStr("created_at"),
                        updated_at = row.requireStr("updated_at"),
                    )
                    importedCount++
                } catch (e: Exception) {
                    skippedCount++
                    errors.add("trainingDay: ${e.message}")
                }
            }

            // Import training day exercises
            obj["trainingDayExercises"]?.jsonArray?.forEach { element ->
                try {
                    val row = element.jsonObject
                    val newId = remapId(row.str("id")) ?: generateNewId()
                    val newDayId = remapId(row.str("training_day_id")) ?: row.requireStr("training_day_id")
                    // Keep exercise_id as-is since exercise library is shared
                    queries.insertDayExercise(
                        id = newId,
                        training_day_id = newDayId,
                        exercise_id = row.requireStr("exercise_id"),
                        order_index = row.long("order_index") ?: 0L,
                        exercise_mode = row.str("exercise_mode") ?: "fixed",
                        target_sets = row.long("target_sets") ?: 3L,
                        target_reps = row.long("target_reps") ?: 5L,
                        start_weight = row.dbl("start_weight"),
                        note = row.str("note"),
                        rest_seconds = row.long("rest_seconds") ?: 180L,
                        weight_increment = row.dbl("weight_increment") ?: 2.5,
                        created_at = row.requireStr("created_at"),
                        updated_at = row.requireStr("updated_at"),
                    )
                    importedCount++
                } catch (e: Exception) {
                    skippedCount++
                    errors.add("trainingDayExercise: ${e.message}")
                }
            }

            // Import workout sessions
            obj["workoutSessions"]?.jsonArray?.forEach { element ->
                try {
                    val row = element.jsonObject
                    val newId = remapId(row.str("id")) ?: generateNewId()
                    queries.insertSession(
                        id = newId,
                        plan_id = remapId(row.str("plan_id")),
                        training_day_id = remapId(row.str("training_day_id")),
                        record_date = row.requireStr("record_date"),
                        training_type = row.requireStr("training_type"),
                        workout_status = row.str("workout_status") ?: "in_progress",
                        started_at = row.str("started_at"),
                        ended_at = row.str("ended_at"),
                        is_backfill = row.long("is_backfill") ?: 0L,
                        created_at = row.requireStr("created_at"),
                        updated_at = row.requireStr("updated_at"),
                    )
                    importedCount++
                } catch (e: Exception) {
                    skippedCount++
                    errors.add("workoutSession: ${e.message}")
                }
            }

            // Import workout exercises
            obj["workoutExercises"]?.jsonArray?.forEach { element ->
                try {
                    val row = element.jsonObject
                    val newId = remapId(row.str("id")) ?: generateNewId()
                    val newSessionId = remapId(row.str("workout_session_id")) ?: row.requireStr("workout_session_id")
                    queries.insertWorkoutExercise(
                        id = newId,
                        workout_session_id = newSessionId,
                        exercise_id = row.requireStr("exercise_id"),
                        order_index = row.long("order_index") ?: 0L,
                        note = row.str("note"),
                        suggested_weight = row.dbl("suggested_weight"),
                        is_custom_weight = row.long("is_custom_weight") ?: 0L,
                        target_sets = row.long("target_sets") ?: 3L,
                        target_reps = row.long("target_reps") ?: 5L,
                        exercise_mode = row.str("exercise_mode") ?: "fixed",
                        exercise_status = row.str("exercise_status") ?: "pending",
                        created_at = row.requireStr("created_at"),
                        updated_at = row.requireStr("updated_at"),
                    )
                    importedCount++
                } catch (e: Exception) {
                    skippedCount++
                    errors.add("workoutExercise: ${e.message}")
                }
            }

            // Import exercise sets
            obj["exerciseSets"]?.jsonArray?.forEach { element ->
                try {
                    val row = element.jsonObject
                    val newId = remapId(row.str("id")) ?: generateNewId()
                    val newWEId = remapId(row.str("workout_exercise_id")) ?: row.requireStr("workout_exercise_id")
                    queries.insertExerciseSet(
                        id = newId,
                        workout_exercise_id = newWEId,
                        set_index = row.long("set_index") ?: 0L,
                        target_weight = row.dbl("target_weight") ?: 0.0,
                        actual_weight = row.dbl("actual_weight") ?: 0.0,
                        target_reps = row.long("target_reps") ?: 0L,
                        actual_reps = row.long("actual_reps"),
                        is_completed = row.long("is_completed") ?: 0L,
                        rest_started_at = row.str("rest_started_at"),
                        rest_duration = row.long("rest_duration"),
                        created_at = row.requireStr("created_at"),
                        updated_at = row.requireStr("updated_at"),
                    )
                    importedCount++
                } catch (e: Exception) {
                    skippedCount++
                    errors.add("exerciseSet: ${e.message}")
                }
            }

            // Import workout feelings
            obj["workoutFeelings"]?.jsonArray?.forEach { element ->
                try {
                    val row = element.jsonObject
                    val newId = remapId(row.str("id")) ?: generateNewId()
                    val newSessionId = remapId(row.str("workout_session_id")) ?: row.requireStr("workout_session_id")
                    queries.insertWorkoutFeeling(
                        id = newId,
                        workout_session_id = newSessionId,
                        fatigue_level = row.long("fatigue_level") ?: 5L,
                        satisfaction_level = row.long("satisfaction_level") ?: 5L,
                        notes = row.str("notes"),
                        created_at = row.requireStr("created_at"),
                        updated_at = row.requireStr("updated_at"),
                    )
                    importedCount++
                } catch (e: Exception) {
                    skippedCount++
                    errors.add("workoutFeeling: ${e.message}")
                }
            }

            // Import exercise feelings
            obj["exerciseFeelings"]?.jsonArray?.forEach { element ->
                try {
                    val row = element.jsonObject
                    val newId = remapId(row.str("id")) ?: generateNewId()
                    val newWFId = remapId(row.str("workout_feeling_id")) ?: row.requireStr("workout_feeling_id")
                    queries.insertExerciseFeeling(
                        id = newId,
                        workout_feeling_id = newWFId,
                        exercise_id = row.requireStr("exercise_id"),
                        notes = row.str("notes"),
                        created_at = row.requireStr("created_at"),
                        updated_at = row.requireStr("updated_at"),
                    )
                    importedCount++
                } catch (e: Exception) {
                    skippedCount++
                    errors.add("exerciseFeeling: ${e.message}")
                }
            }

            // Import body measurements
            obj["bodyMeasurements"]?.jsonArray?.forEach { element ->
                try {
                    val row = element.jsonObject
                    val newId = remapId(row.str("id")) ?: generateNewId()
                    queries.insertBodyMeasurement(
                        id = newId,
                        record_date = row.requireStr("record_date"),
                        body_weight = row.dbl("body_weight"),
                        chest = row.dbl("chest"),
                        waist = row.dbl("waist"),
                        arm = row.dbl("arm"),
                        thigh = row.dbl("thigh"),
                        notes = row.str("notes"),
                        created_at = row.requireStr("created_at"),
                        updated_at = row.requireStr("updated_at"),
                    )
                    importedCount++
                } catch (e: Exception) {
                    skippedCount++
                    errors.add("bodyMeasurement: ${e.message}")
                }
            }

            ImportResult(importedCount = importedCount, skippedCount = skippedCount, errors = errors)
        }
    }

    override suspend fun clearAllData(): Result<Unit> = runCatching {
        queries.transaction {
            queries.deleteAllExerciseSets()
            queries.deleteAllWorkoutFeelings()
            queries.deleteAllExerciseFeelings()
            queries.deleteAllWorkoutExercises()
            queries.deleteAllWorkoutSessions()
            queries.deleteAllPersonalRecords()
            queries.deleteAllWeightSuggestions()
            queries.deleteAllBodyMeasurements()
            queries.deleteAllOtherSportMetricValues()
            queries.deleteAllOtherSportRecords()
            queries.deleteAllOtherSportMetrics()
            queries.deleteAllOtherSportTypes()
            queries.deleteAllTimerStates()
            queries.deleteAllTrainingDaySetConfigs()
            queries.deleteAllTrainingDayExercises()
            queries.deleteAllTrainingDays()
            queries.deleteAllTrainingPlans()
        }
    }

    /**
     * Initializes default settings if none exist. Should be called on app startup.
     */
    suspend fun ensureSettingsInitialized(): Result<Unit> = runCatching {
        val count = queries.countSettings().executeAsOne()
        if (count == 0L) {
            val now = Clock.System.now().toString()
            queries.insertSettings(
                id = settingsId,
                weight_unit = "kg",
                default_rest_seconds = 180L,
                training_reminder_enabled = 1L,
                vibration_enabled = 1L,
                sound_enabled = 0L,
                onboarding_completed = 0L,
                updated_at = now,
            )
        }
    }

    /**
     * Export all data as JSON using raw DB string values.
     * Uses kotlinx.serialization JsonElement types to build the export.
     */
    private fun exportAsJson(dateRange: DateRange?): String {
        val settingsRow = queries.selectSettings().executeAsOne()
        val exercises = queries.selectAllExercises().executeAsList()
        val plans = queries.selectAllTrainingPlans().executeAsList()
        val days = queries.selectAllTrainingDays().executeAsList()
        val dayExercises = queries.selectAllTrainingDayExercises().executeAsList()
        val setConfigs = queries.selectAllTrainingDaySetConfigs().executeAsList()

        // Filter sessions by date range if provided
        val sessions = if (dateRange != null) {
            queries.selectSessionsByDateRange(
                dateRange.start.toString(),
                dateRange.end.toString(),
            ).executeAsList()
        } else {
            queries.selectAllWorkoutSessions().executeAsList()
        }

        // Get session IDs for filtering related data
        val sessionIds = sessions.map { it.id }.toSet()

        val workoutExercises = if (dateRange != null) {
            queries.selectAllWorkoutExercises().executeAsList()
                .filter { it.workout_session_id in sessionIds }
        } else {
            queries.selectAllWorkoutExercises().executeAsList()
        }

        val workoutExerciseIds = workoutExercises.map { it.id }.toSet()

        val exerciseSets = if (dateRange != null) {
            queries.selectAllExerciseSets().executeAsList()
                .filter { it.workout_exercise_id in workoutExerciseIds }
        } else {
            queries.selectAllExerciseSets().executeAsList()
        }

        val workoutFeelings = if (dateRange != null) {
            queries.selectAllWorkoutFeelings().executeAsList()
                .filter { it.workout_session_id in sessionIds }
        } else {
            queries.selectAllWorkoutFeelings().executeAsList()
        }

        val workoutFeelingIds = workoutFeelings.map { it.id }.toSet()

        val exerciseFeelings = if (dateRange != null) {
            queries.selectAllExerciseFeelings().executeAsList()
                .filter { it.workout_feeling_id in workoutFeelingIds }
        } else {
            queries.selectAllExerciseFeelings().executeAsList()
        }

        val bodyMeasurements = if (dateRange != null) {
            queries.selectBodyMeasurementsByDateRange(
                dateRange.start.toString(),
                dateRange.end.toString(),
            ).executeAsList()
        } else {
            queries.selectAllBodyMeasurements().executeAsList()
        }

        val otherSportRecords = if (dateRange != null) {
            queries.selectSportRecordsByDateRange(
                dateRange.start.toString(),
                dateRange.end.toString(),
            ).executeAsList()
        } else {
            queries.selectAllOtherSportRecords().executeAsList()
        }

        val sportRecordIds = otherSportRecords.map { it.id }.toSet()

        val otherSportMetricValues = if (dateRange != null) {
            queries.selectAllOtherSportMetricValues().executeAsList()
                .filter { it.sport_record_id in sportRecordIds }
        } else {
            queries.selectAllOtherSportMetricValues().executeAsList()
        }

        // Always include all of these (not date-filtered)
        val personalRecords = queries.selectAllPersonalRecords().executeAsList()
        val weightSuggestions = queries.selectAllWeightSuggestions().executeAsList()
        val otherSportTypes = queries.selectAllOtherSportTypes().executeAsList()
        val otherSportMetrics = queries.selectAllOtherSportMetrics().executeAsList()
        val timerStates = queries.selectAllTimerStates().executeAsList()

        val exportJson = buildJsonObject {
            put("version", JsonPrimitive(1))
            put("exportedAt", JsonPrimitive(Clock.System.now().toString()))
            put("settings", serializeSettings(settingsRow))
            put("exercises", JsonArray(exercises.map { serializeExercise(it) }))
            put("trainingPlans", JsonArray(plans.map { serializeTrainingPlan(it) }))
            put("trainingDays", JsonArray(days.map { serializeTrainingDay(it) }))
            put("trainingDayExercises", JsonArray(dayExercises.map { serializeTrainingDayExercise(it) }))
            put("trainingDaySetConfigs", JsonArray(setConfigs.map { serializeTrainingDaySetConfig(it) }))
            put("workoutSessions", JsonArray(sessions.map { serializeWorkoutSession(it) }))
            put("workoutExercises", JsonArray(workoutExercises.map { serializeWorkoutExercise(it) }))
            put("exerciseSets", JsonArray(exerciseSets.map { serializeExerciseSet(it) }))
            put("workoutFeelings", JsonArray(workoutFeelings.map { serializeWorkoutFeeling(it) }))
            put("exerciseFeelings", JsonArray(exerciseFeelings.map { serializeExerciseFeeling(it) }))
            put("personalRecords", JsonArray(personalRecords.map { serializePersonalRecord(it) }))
            put("weightSuggestions", JsonArray(weightSuggestions.map { serializeWeightSuggestion(it) }))
            put("bodyMeasurements", JsonArray(bodyMeasurements.map { serializeBodyMeasurement(it) }))
            put("otherSportTypes", JsonArray(otherSportTypes.map { serializeOtherSportType(it) }))
            put("otherSportMetrics", JsonArray(otherSportMetrics.map { serializeOtherSportMetric(it) }))
            put("otherSportRecords", JsonArray(otherSportRecords.map { serializeOtherSportRecord(it) }))
            put("otherSportMetricValues", JsonArray(otherSportMetricValues.map { serializeOtherSportMetricValue(it) }))
            put("timerStates", JsonArray(timerStates.map { serializeTimerState(it) }))
        }

        return json.encodeToString(JsonObject.serializer(), exportJson)
    }

    // ============================================================
    // Serialization helpers
    // ============================================================

    private fun serializeSettings(row: com.trainrecorder.db.User_settings): JsonObject = buildJsonObject {
        put("id", JsonPrimitive(row.id))
        put("weight_unit", JsonPrimitive(row.weight_unit))
        put("default_rest_seconds", JsonPrimitive(row.default_rest_seconds))
        put("training_reminder_enabled", JsonPrimitive(row.training_reminder_enabled))
        put("vibration_enabled", JsonPrimitive(row.vibration_enabled))
        put("sound_enabled", JsonPrimitive(row.sound_enabled))
        put("onboarding_completed", JsonPrimitive(row.onboarding_completed))
        put("updated_at", JsonPrimitive(row.updated_at))
    }

    private fun serializeExercise(row: com.trainrecorder.db.Exercise): JsonObject = buildJsonObject {
        put("id", JsonPrimitive(row.id))
        put("display_name", JsonPrimitive(row.display_name))
        put("category", JsonPrimitive(row.category))
        put("weight_increment", JsonPrimitive(row.weight_increment))
        put("default_rest", JsonPrimitive(row.default_rest))
        put("is_custom", JsonPrimitive(row.is_custom))
        put("created_at", JsonPrimitive(row.created_at))
        put("updated_at", JsonPrimitive(row.updated_at))
    }

    private fun serializeTrainingPlan(row: com.trainrecorder.db.Training_plan): JsonObject = buildJsonObject {
        put("id", JsonPrimitive(row.id))
        put("display_name", JsonPrimitive(row.display_name))
        put("plan_mode", JsonPrimitive(row.plan_mode))
        nullableLong("cycle_length", row.cycle_length)
        put("schedule_mode", JsonPrimitive(row.schedule_mode))
        nullableLong("interval_days", row.interval_days)
        put("is_active", JsonPrimitive(row.is_active))
        put("created_at", JsonPrimitive(row.created_at))
        put("updated_at", JsonPrimitive(row.updated_at))
    }

    private fun serializeTrainingDay(row: com.trainrecorder.db.Training_day): JsonObject = buildJsonObject {
        put("id", JsonPrimitive(row.id))
        put("plan_id", JsonPrimitive(row.plan_id))
        put("display_name", JsonPrimitive(row.display_name))
        put("day_type", JsonPrimitive(row.day_type))
        put("order_index", JsonPrimitive(row.order_index))
        put("created_at", JsonPrimitive(row.created_at))
        put("updated_at", JsonPrimitive(row.updated_at))
    }

    private fun serializeTrainingDayExercise(row: com.trainrecorder.db.Training_day_exercise): JsonObject = buildJsonObject {
        put("id", JsonPrimitive(row.id))
        put("training_day_id", JsonPrimitive(row.training_day_id))
        put("exercise_id", JsonPrimitive(row.exercise_id))
        put("order_index", JsonPrimitive(row.order_index))
        put("exercise_mode", JsonPrimitive(row.exercise_mode))
        put("target_sets", JsonPrimitive(row.target_sets))
        put("target_reps", JsonPrimitive(row.target_reps))
        put("start_weight", JsonPrimitive(row.start_weight))
        nullableString("note", row.note)
        put("rest_seconds", JsonPrimitive(row.rest_seconds))
        put("weight_increment", JsonPrimitive(row.weight_increment))
        put("created_at", JsonPrimitive(row.created_at))
        put("updated_at", JsonPrimitive(row.updated_at))
    }

    private fun serializeTrainingDaySetConfig(row: com.trainrecorder.db.Training_day_set_config): JsonObject = buildJsonObject {
        put("id", JsonPrimitive(row.id))
        put("day_exercise_id", JsonPrimitive(row.day_exercise_id))
        put("set_index", JsonPrimitive(row.set_index))
        put("target_reps", JsonPrimitive(row.target_reps))
        put("target_weight", JsonPrimitive(row.target_weight))
    }

    private fun serializeWorkoutSession(row: com.trainrecorder.db.Workout_session): JsonObject = buildJsonObject {
        put("id", JsonPrimitive(row.id))
        nullableString("plan_id", row.plan_id)
        nullableString("training_day_id", row.training_day_id)
        put("record_date", JsonPrimitive(row.record_date))
        put("training_type", JsonPrimitive(row.training_type))
        put("workout_status", JsonPrimitive(row.workout_status))
        nullableString("started_at", row.started_at)
        nullableString("ended_at", row.ended_at)
        put("is_backfill", JsonPrimitive(row.is_backfill))
        put("created_at", JsonPrimitive(row.created_at))
        put("updated_at", JsonPrimitive(row.updated_at))
    }

    private fun serializeWorkoutExercise(row: com.trainrecorder.db.Workout_exercise): JsonObject = buildJsonObject {
        put("id", JsonPrimitive(row.id))
        put("workout_session_id", JsonPrimitive(row.workout_session_id))
        put("exercise_id", JsonPrimitive(row.exercise_id))
        put("order_index", JsonPrimitive(row.order_index))
        nullableString("note", row.note)
        put("suggested_weight", JsonPrimitive(row.suggested_weight))
        put("is_custom_weight", JsonPrimitive(row.is_custom_weight))
        put("target_sets", JsonPrimitive(row.target_sets))
        put("target_reps", JsonPrimitive(row.target_reps))
        put("exercise_mode", JsonPrimitive(row.exercise_mode))
        put("exercise_status", JsonPrimitive(row.exercise_status))
        put("created_at", JsonPrimitive(row.created_at))
        put("updated_at", JsonPrimitive(row.updated_at))
    }

    private fun serializeExerciseSet(row: com.trainrecorder.db.Exercise_set): JsonObject = buildJsonObject {
        put("id", JsonPrimitive(row.id))
        put("workout_exercise_id", JsonPrimitive(row.workout_exercise_id))
        put("set_index", JsonPrimitive(row.set_index))
        put("target_weight", JsonPrimitive(row.target_weight))
        put("actual_weight", JsonPrimitive(row.actual_weight))
        put("target_reps", JsonPrimitive(row.target_reps))
        nullableLong("actual_reps", row.actual_reps)
        put("is_completed", JsonPrimitive(row.is_completed))
        nullableString("rest_started_at", row.rest_started_at)
        nullableLong("rest_duration", row.rest_duration)
        put("created_at", JsonPrimitive(row.created_at))
        put("updated_at", JsonPrimitive(row.updated_at))
    }

    private fun serializeWorkoutFeeling(row: com.trainrecorder.db.Workout_feeling): JsonObject = buildJsonObject {
        put("id", JsonPrimitive(row.id))
        put("workout_session_id", JsonPrimitive(row.workout_session_id))
        put("fatigue_level", JsonPrimitive(row.fatigue_level))
        put("satisfaction_level", JsonPrimitive(row.satisfaction_level))
        nullableString("notes", row.notes)
        put("created_at", JsonPrimitive(row.created_at))
        put("updated_at", JsonPrimitive(row.updated_at))
    }

    private fun serializeExerciseFeeling(row: com.trainrecorder.db.Exercise_feeling): JsonObject = buildJsonObject {
        put("id", JsonPrimitive(row.id))
        put("workout_feeling_id", JsonPrimitive(row.workout_feeling_id))
        put("exercise_id", JsonPrimitive(row.exercise_id))
        nullableString("notes", row.notes)
        put("created_at", JsonPrimitive(row.created_at))
        put("updated_at", JsonPrimitive(row.updated_at))
    }

    private fun serializePersonalRecord(row: com.trainrecorder.db.Personal_record): JsonObject = buildJsonObject {
        put("id", JsonPrimitive(row.id))
        put("exercise_id", JsonPrimitive(row.exercise_id))
        put("max_weight", JsonPrimitive(row.max_weight))
        put("max_volume", JsonPrimitive(row.max_volume))
        put("max_weight_date", JsonPrimitive(row.max_weight_date))
        put("max_volume_date", JsonPrimitive(row.max_volume_date))
        put("max_weight_session_id", JsonPrimitive(row.max_weight_session_id))
        put("max_volume_session_id", JsonPrimitive(row.max_volume_session_id))
        put("created_at", JsonPrimitive(row.created_at))
        put("updated_at", JsonPrimitive(row.updated_at))
    }

    private fun serializeWeightSuggestion(row: com.trainrecorder.db.Weight_suggestion): JsonObject = buildJsonObject {
        put("id", JsonPrimitive(row.id))
        put("exercise_id", JsonPrimitive(row.exercise_id))
        nullableDouble("suggested_weight", row.suggested_weight)
        nullableString("based_on_session_id", row.based_on_session_id)
        put("consecutive_completions", JsonPrimitive(row.consecutive_completions))
        put("consecutive_failures", JsonPrimitive(row.consecutive_failures))
        put("last_calculated_at", JsonPrimitive(row.last_calculated_at))
        put("created_at", JsonPrimitive(row.created_at))
        put("updated_at", JsonPrimitive(row.updated_at))
    }

    private fun serializeBodyMeasurement(row: com.trainrecorder.db.Body_measurement): JsonObject = buildJsonObject {
        put("id", JsonPrimitive(row.id))
        put("record_date", JsonPrimitive(row.record_date))
        nullableDouble("body_weight", row.body_weight)
        nullableDouble("chest", row.chest)
        nullableDouble("waist", row.waist)
        nullableDouble("arm", row.arm)
        nullableDouble("thigh", row.thigh)
        nullableString("notes", row.notes)
        put("created_at", JsonPrimitive(row.created_at))
        put("updated_at", JsonPrimitive(row.updated_at))
    }

    private fun serializeOtherSportType(row: com.trainrecorder.db.Other_sport_type): JsonObject = buildJsonObject {
        put("id", JsonPrimitive(row.id))
        put("display_name", JsonPrimitive(row.display_name))
        put("is_custom", JsonPrimitive(row.is_custom))
        put("created_at", JsonPrimitive(row.created_at))
        put("updated_at", JsonPrimitive(row.updated_at))
    }

    private fun serializeOtherSportMetric(row: com.trainrecorder.db.Other_sport_metric): JsonObject = buildJsonObject {
        put("id", JsonPrimitive(row.id))
        put("sport_type_id", JsonPrimitive(row.sport_type_id))
        put("metric_name", JsonPrimitive(row.metric_name))
        put("metric_key", JsonPrimitive(row.metric_key))
        put("input_type", JsonPrimitive(row.input_type))
        put("is_required", JsonPrimitive(row.is_required))
        nullableString("unit", row.unit)
        put("created_at", JsonPrimitive(row.created_at))
        put("updated_at", JsonPrimitive(row.updated_at))
    }

    private fun serializeOtherSportRecord(row: com.trainrecorder.db.Other_sport_record): JsonObject = buildJsonObject {
        put("id", JsonPrimitive(row.id))
        put("sport_type_id", JsonPrimitive(row.sport_type_id))
        put("record_date", JsonPrimitive(row.record_date))
        nullableString("notes", row.notes)
        put("created_at", JsonPrimitive(row.created_at))
        put("updated_at", JsonPrimitive(row.updated_at))
    }

    private fun serializeOtherSportMetricValue(row: com.trainrecorder.db.Other_sport_metric_value): JsonObject = buildJsonObject {
        put("id", JsonPrimitive(row.id))
        put("sport_record_id", JsonPrimitive(row.sport_record_id))
        put("metric_id", JsonPrimitive(row.metric_id))
        put("metric_value", JsonPrimitive(row.metric_value))
        put("created_at", JsonPrimitive(row.created_at))
        put("updated_at", JsonPrimitive(row.updated_at))
    }

    private fun serializeTimerState(row: com.trainrecorder.db.Timer_state): JsonObject = buildJsonObject {
        put("id", JsonPrimitive(row.id))
        put("workout_session_id", JsonPrimitive(row.workout_session_id))
        put("start_timestamp", JsonPrimitive(row.start_timestamp))
        put("total_duration_seconds", JsonPrimitive(row.total_duration_seconds))
        put("is_running", JsonPrimitive(row.is_running))
        put("updated_at", JsonPrimitive(row.updated_at))
    }

    // ============================================================
    // JSON parsing helpers for import
    // ============================================================

    private fun JsonObject.str(key: String): String? =
        this[key]?.jsonPrimitive?.contentOrNull

    private fun JsonObject.requireStr(key: String): String =
        this[key]?.jsonPrimitive?.contentOrNull
            ?: throw IllegalArgumentException("Missing required field: $key")

    private fun JsonObject.long(key: String): Long? =
        this[key]?.jsonPrimitive?.let {
            try {
                if (it.isString) null else it.content.toLongOrNull()
            } catch (_: Exception) { null }
        }

    private fun JsonObject.dbl(key: String): Double? =
        this[key]?.jsonPrimitive?.let {
            try {
                if (it.isString) null else it.content.toDoubleOrNull()
            } catch (_: Exception) { null }
        }

    companion object {
        /** Unit conversion factor: 1 kg = 2.20462 lb */
        const val KG_TO_LB = 2.20462

        /** Convert kg to lb */
        fun kgToLb(kg: Double): Double = kg * KG_TO_LB

        /** Convert lb to kg */
        fun lbToKg(lb: Double): Double = lb / KG_TO_LB
    }
}

// ============================================================
// JSON builder helpers
// ============================================================

private fun buildJsonObject(builderAction: MutableMap<String, JsonElement>.() -> Unit): JsonObject {
    val map = mutableMapOf<String, JsonElement>()
    map.builderAction()
    return JsonObject(map)
}

private fun MutableMap<String, JsonElement>.nullableString(key: String, value: String?) {
    put(key, if (value != null) JsonPrimitive(value) else JsonNull)
}

private fun MutableMap<String, JsonElement>.nullableLong(key: String, value: Long?) {
    put(key, if (value != null) JsonPrimitive(value) else JsonNull)
}

private fun MutableMap<String, JsonElement>.nullableDouble(key: String, value: Double?) {
    put(key, if (value != null) JsonPrimitive(value) else JsonNull)
}

/**
 * Generate a new unique ID.
 */
private fun generateNewId(): String {
    val hexChars = "0123456789abcdef"
    val segments = listOf(8, 4, 4, 4, 12)
    return segments.joinToString("-") { length ->
        (1..length).map { hexChars.random() }.joinToString("")
    }
}

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
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
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
     * Export all data as JSON using raw DB string values to avoid
     * kotlinx.serialization issues with Instant/LocalDate types.
     */
    private fun exportAsJson(dateRange: DateRange?): String {
        // Build JSON manually using kotlinx.serialization JsonElement types
        // to avoid needing @Contextual serializers on Instant/LocalDate fields
        val settingsRow = queries.selectSettings().executeAsOne()
        val exercises = queries.selectAllExercises().executeAsList()
        val plans = queries.selectAllTrainingPlans().executeAsList()
        val days = queries.selectAllTrainingDays().executeAsList()
        val dayExercises = queries.selectAllTrainingDayExercises().executeAsList()
        val sessions = queries.selectAllWorkoutSessions().executeAsList()
        val workoutExercises = queries.selectAllWorkoutExercises().executeAsList()
        val exerciseSets = queries.selectAllExerciseSets().executeAsList()

        // Build a simple JSON string using StringBuilder
        val sb = StringBuilder()
        sb.append("{\n")
        sb.append("  \"version\": 1,\n")
        sb.append("  \"settings\": ${rowToJson(settingsRow)},\n")
        sb.append("  \"exerciseCount\": ${exercises.size},\n")
        sb.append("  \"planCount\": ${plans.size},\n")
        sb.append("  \"sessionCount\": ${sessions.size}\n")
        sb.append("}")
        return sb.toString()
    }

    private fun rowToJson(row: com.trainrecorder.db.User_settings): String {
        return """{"id":"${escape(row.id)}","weight_unit":"${escape(row.weight_unit)}","default_rest_seconds":${row.default_rest_seconds},"updated_at":"${escape(row.updated_at)}"}"""
    }

    private fun escape(s: String): String = s.replace("\\", "\\\\").replace("\"", "\\\"")

    companion object {
        /** Unit conversion factor: 1 kg = 2.20462 lb */
        const val KG_TO_LB = 2.20462

        /** Convert kg to lb */
        fun kgToLb(kg: Double): Double = kg * KG_TO_LB

        /** Convert lb to kg */
        fun lbToKg(lb: Double): Double = lb / KG_TO_LB
    }
}

package com.trainrecorder.domain.repository

import com.trainrecorder.domain.model.WeightUnit
import kotlinx.coroutines.flow.Flow

/**
 * Date range for export/import operations.
 */
data class DateRange(
    val start: kotlinx.datetime.LocalDate,
    val end: kotlinx.datetime.LocalDate,
)

/**
 * Export format options.
 */
enum class ExportFormat(val value: String) {
    JSON("json"),
    CSV("csv"),
    ;

    companion object {
        fun fromValue(value: String): ExportFormat =
            entries.firstOrNull { it.value == value }
                ?: throw IllegalArgumentException("Unknown ExportFormat: $value")
    }
}

/**
 * Result of a data import operation.
 */
data class ImportResult(
    val importedCount: Int,
    val skippedCount: Int,
    val errors: List<String>,
)

/**
 * Repository for user settings read/write operations.
 */
interface SettingsRepository {
    fun getSettings(): Flow<com.trainrecorder.domain.model.UserSettings>
    suspend fun updateWeightUnit(unit: WeightUnit): Result<Unit>
    suspend fun updateDefaultRest(seconds: Int): Result<Unit>
    suspend fun updateNotifications(reminder: Boolean, vibration: Boolean, sound: Boolean): Result<Unit>
    suspend fun completeOnboarding(): Result<Unit>
    suspend fun exportData(format: ExportFormat, dateRange: DateRange?): Result<String>
    suspend fun importData(filePath: String): Result<ImportResult>
    suspend fun importDataFromJson(jsonString: String): Result<ImportResult>
    suspend fun clearAllData(): Result<Unit>
}

package com.trainrecorder.ui.screens

import kotlinx.datetime.DateTimeUnit
import kotlinx.datetime.LocalDate
import kotlinx.datetime.minus
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonPrimitive

/**
 * Result of JSON schema validation for import.
 */
data class ValidationResult(
    val isValid: Boolean,
    val error: String? = null,
)

/**
 * A preset date range option for export.
 */
data class DateRangePreset(
    val label: String,
    val start: LocalDate?,
    val end: LocalDate?,
)

/**
 * Required top-level keys in the export JSON schema (version 1).
 */
private val REQUIRED_EXPORT_KEYS = setOf(
    "version",
    "settings",
    "exercises",
    "trainingPlans",
    "trainingDays",
    "trainingDayExercises",
    "trainingDaySetConfigs",
    "workoutSessions",
    "workoutExercises",
    "exerciseSets",
    "workoutFeelings",
    "exerciseFeelings",
    "personalRecords",
    "weightSuggestions",
    "bodyMeasurements",
    "otherSportTypes",
    "otherSportMetrics",
    "otherSportRecords",
    "otherSportMetricValues",
    "timerStates",
)

/** Supported export schema version. */
private const val SUPPORTED_VERSION = 1

/**
 * Validate that a JSON string conforms to the expected export schema.
 *
 * Checks: valid JSON, version == 1, all required top-level keys present.
 */
fun validateExportJson(jsonString: String): ValidationResult {
    if (jsonString.isBlank()) {
        return ValidationResult(isValid = false, error = "JSON string is empty")
    }

    val jsonElement = try {
        Json.parseToJsonElement(jsonString)
    } catch (e: Exception) {
        return ValidationResult(isValid = false, error = "Invalid JSON: ${e.message}")
    }

    val obj = jsonElement as? JsonObject
        ?: return ValidationResult(isValid = false, error = "Expected JSON object at top level")

    // Check version
    val version = obj["version"]?.jsonPrimitive?.intOrNull
    if (version == null) {
        return ValidationResult(isValid = false, error = "Missing or invalid 'version' field")
    }
    if (version != SUPPORTED_VERSION) {
        return ValidationResult(isValid = false, error = "Unsupported version: $version (expected $SUPPORTED_VERSION)")
    }

    // Check required keys
    val missingKeys = REQUIRED_EXPORT_KEYS.filter { !obj.containsKey(it) }
    if (missingKeys.isNotEmpty()) {
        return ValidationResult(
            isValid = false,
            error = "Missing required keys: ${missingKeys.joinToString(", ")}",
        )
    }

    return ValidationResult(isValid = true)
}

/**
 * Check if a date falls within the given range (inclusive).
 */
fun isWithinDateRange(date: LocalDate, start: LocalDate, end: LocalDate): Boolean {
    return date >= start && date <= end
}

/**
 * Generate a new unique ID to replace an old one during import.
 * Uses UUID format to avoid collisions with existing data.
 */
fun regenerateId(oldId: String): String {
    return generateUuid()
}

/**
 * Build a mapping from old IDs to new IDs for all provided IDs.
 * Used during import to regenerate all IDs and avoid conflicts.
 */
fun buildIdMapping(oldIds: List<String>): Map<String, String> {
    return oldIds.associateWith { generateUuid() }
}

/**
 * Generate a UUID-like string.
 * Simple implementation using random hex segments.
 */
private fun generateUuid(): String {
    val hexChars = "0123456789abcdef"
    val segments = listOf(8, 4, 4, 4, 12)
    return segments.joinToString("-") { length ->
        (1..length).map { hexChars.random() }.joinToString("")
    }
}

/**
 * Get the preset date range options for export filtering.
 */
fun getExportDateRangePresets(today: LocalDate): List<DateRangePreset> = listOf(
    DateRangePreset(label = "All", start = null, end = null),
    DateRangePreset(
        label = "Last 3 Months",
        start = today.minus(3, DateTimeUnit.MONTH),
        end = today,
    ),
    DateRangePreset(
        label = "Last 6 Months",
        start = today.minus(6, DateTimeUnit.MONTH),
        end = today,
    ),
)

/**
 * Get description text for what is preserved when clearing all data.
 */
fun getClearDataDescription(): String {
    return "This will delete all training sessions, plans, body measurements, and other sport records. " +
        "Your exercise library and settings will be preserved."
}

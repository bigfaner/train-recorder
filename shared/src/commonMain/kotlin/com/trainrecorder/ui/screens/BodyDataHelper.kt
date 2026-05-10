package com.trainrecorder.ui.screens

import com.trainrecorder.domain.model.BodyMeasurement
import com.trainrecorder.viewmodel.BodyMetric
import kotlinx.datetime.LocalDate

/**
 * Body data form validation result.
 */
data class BodyDataValidationResult(
    val isValid: Boolean,
    val weightError: String? = null,
)

/**
 * Validate body data form input.
 * Weight is required; all other fields are optional.
 */
fun validateBodyDataForm(
    weight: String?,
): BodyDataValidationResult {
    if (weight.isNullOrBlank()) {
        return BodyDataValidationResult(
            isValid = false,
            weightError = "Weight is required",
        )
    }
    val weightValue = weight.toDoubleOrNull()
    if (weightValue == null) {
        return BodyDataValidationResult(
            isValid = false,
            weightError = "Invalid weight value",
        )
    }
    if (weightValue <= 0) {
        return BodyDataValidationResult(
            isValid = false,
            weightError = "Weight must be positive",
        )
    }
    return BodyDataValidationResult(isValid = true)
}

/**
 * Compute the weight change trend between the latest and previous measurement.
 * Returns null if there are fewer than 2 measurements.
 */
fun computeWeightTrend(
    measurements: List<BodyMeasurement>,
): Pair<Double, Boolean>? {
    if (measurements.size < 2) return null
    val sorted = measurements.sortedBy { it.recordDate }
    val latest = sorted.last().bodyWeight ?: return null
    val previous = sorted[sorted.lastIndex - 1].bodyWeight ?: return null
    val delta = latest - previous
    return Pair(kotlin.math.abs(delta), delta <= 0) // (abs change, isDecreasing)
}

/**
 * Format a body measurement value with unit.
 */
fun formatMeasurementValue(value: Double?, unit: String): String {
    return value?.let { String.format("%.1f %s", it, unit) } ?: "-- $unit"
}

/**
 * Get the label for a body metric.
 */
fun getMetricLabel(metric: BodyMetric): String = when (metric) {
    BodyMetric.WEIGHT -> "Weight"
    BodyMetric.CHEST -> "Chest"
    BodyMetric.WAIST -> "Waist"
    BodyMetric.ARM -> "Arm"
    BodyMetric.THIGH -> "Thigh"
}

/**
 * Get the unit for a body metric.
 */
fun getMetricUnit(metric: BodyMetric): String = when (metric) {
    BodyMetric.WEIGHT -> "kg"
    BodyMetric.CHEST -> "cm"
    BodyMetric.WAIST -> "cm"
    BodyMetric.ARM -> "cm"
    BodyMetric.THIGH -> "cm"
}

/**
 * Body data tab types for the segmented control.
 */
enum class BodyDataTab {
    TREND,
    HISTORY,
}

/**
 * Get ordered list of body data tabs.
 */
fun getBodyDataTabs(): List<BodyDataTab> = BodyDataTab.entries

package com.trainrecorder.ui.screens

import com.trainrecorder.domain.model.MetricInputType
import com.trainrecorder.domain.model.OtherSportMetric

/**
 * A resolved metric input field for dynamic form rendering.
 */
data class MetricField(
    val metricId: String,
    val label: String,
    val unit: String?,
    val inputType: MetricInputType,
    val isRequired: Boolean,
)

/**
 * Resolve a list of OtherSportMetric into displayable input fields.
 * Each metric becomes a labeled input field with appropriate type and unit.
 */
fun resolveMetricFields(metrics: List<OtherSportMetric>): List<MetricField> {
    return metrics.map { metric ->
        MetricField(
            metricId = metric.id,
            label = metric.metricName,
            unit = metric.unit,
            inputType = metric.inputType,
            isRequired = metric.isRequired,
        )
    }
}

/**
 * Validate a metric input value based on its type.
 * Returns null if valid, or an error message string if invalid.
 */
fun validateMetricValue(
    value: String?,
    field: MetricField,
): String? {
    if (value.isNullOrBlank()) {
        return if (field.isRequired) "${field.label} is required" else null
    }
    return when (field.inputType) {
        MetricInputType.NUMBER -> {
            val num = value.toDoubleOrNull()
            if (num == null) "${field.label} must be a number" else null
        }
        MetricInputType.TEXT -> null
    }
}

/**
 * Validate all metric values for saving.
 * Returns a map of metricId -> error message for any invalid fields.
 */
fun validateAllMetrics(
    values: Map<String, String>,
    fields: List<MetricField>,
): Map<String, String> {
    val errors = mutableMapOf<String, String>()
    for (field in fields) {
        val value = values[field.metricId]
        val error = validateMetricValue(value, field)
        if (error != null) {
            errors[field.metricId] = error
        }
    }
    return errors
}

/**
 * Sport type grid column count for the type selection grid.
 */
const val SPORT_TYPE_GRID_COLUMNS = 3

/**
 * Available metric options for custom sport creation.
 */
data class MetricOption(
    val key: String,
    val displayName: String,
    val inputType: MetricInputType,
    val unit: String?,
)

/**
 * Preset metric options for custom sport creation.
 */
val PRESET_METRIC_OPTIONS = listOf(
    MetricOption("duration", "Duration", MetricInputType.NUMBER, "min"),
    MetricOption("distance", "Distance", MetricInputType.NUMBER, "km"),
    MetricOption("pace", "Pace", MetricInputType.TEXT, "min/km"),
    MetricOption("heart_rate", "Heart Rate", MetricInputType.NUMBER, "bpm"),
    MetricOption("calories", "Calories", MetricInputType.NUMBER, "kcal"),
)

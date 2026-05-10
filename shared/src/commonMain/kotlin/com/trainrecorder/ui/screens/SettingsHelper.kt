package com.trainrecorder.ui.screens

import com.trainrecorder.domain.model.WeightUnit

/**
 * Settings section types for grouped display.
 */
enum class SettingsSection {
    GENERAL,
    DATA_MANAGEMENT,
    ABOUT,
}

/**
 * A single settings item for the grouped settings list.
 */
data class SettingsItem(
    val key: String,
    val title: String,
    val subtitle: String?,
    val section: SettingsSection,
    val hasToggle: Boolean = false,
    val isDestructive: Boolean = false,
)

/**
 * Get the ordered list of settings items.
 */
fun getSettingsItems(weightUnit: WeightUnit): List<SettingsItem> = listOf(
    SettingsItem(
        key = "weight_unit",
        title = "Weight Unit",
        subtitle = if (weightUnit == WeightUnit.KG) "Kilograms (kg)" else "Pounds (lb)",
        section = SettingsSection.GENERAL,
        hasToggle = true,
    ),
    SettingsItem(
        key = "exercise_library",
        title = "Exercise Library",
        subtitle = "Manage custom exercises",
        section = SettingsSection.GENERAL,
    ),
    SettingsItem(
        key = "export_data",
        title = "Export Data",
        subtitle = "Export training history",
        section = SettingsSection.DATA_MANAGEMENT,
    ),
    SettingsItem(
        key = "import_data",
        title = "Import Data",
        subtitle = "Restore from backup",
        section = SettingsSection.DATA_MANAGEMENT,
    ),
    SettingsItem(
        key = "clear_data",
        title = "Clear All Data",
        subtitle = "Delete all training data",
        section = SettingsSection.DATA_MANAGEMENT,
        isDestructive = true,
    ),
)

/**
 * Settings sections in display order with their labels.
 */
val SETTINGS_SECTIONS = listOf(
    SettingsSection.GENERAL to "General",
    SettingsSection.DATA_MANAGEMENT to "Data Management",
    SettingsSection.ABOUT to "About",
)

/**
 * Validate export format selection.
 */
fun isValidExportFormat(format: String?): Boolean {
    return format != null && format in listOf("json", "csv")
}

/**
 * Build the confirmation message for clear data action.
 */
fun buildClearDataConfirmationMessage(): String {
    return "This will permanently delete all your training data, body measurements, and other sport records. " +
        "Your exercise library and settings will be preserved. This action cannot be undone."
}

/**
 * Format weight unit toggle label.
 */
fun formatWeightUnitLabel(unit: WeightUnit): String = when (unit) {
    WeightUnit.KG -> "kg"
    WeightUnit.LB -> "lb"
}

/**
 * Convert weight between units.
 */
fun convertWeight(value: Double, from: WeightUnit, to: WeightUnit): Double {
    if (from == to) return value
    return when (from) {
        WeightUnit.KG -> value * 2.20462 // kg to lb
        WeightUnit.LB -> value / 2.20462 // lb to kg
    }
}

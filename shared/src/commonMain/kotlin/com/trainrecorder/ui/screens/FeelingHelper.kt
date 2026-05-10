package com.trainrecorder.ui.screens

import com.trainrecorder.viewmodel.ExerciseFeelingUi

/**
 * Validate fatigue slider value (1-10 scale).
 */
fun validateFatigueLevel(level: Int): Int = level.coerceIn(1, 10)

/**
 * Validate satisfaction slider value (1-10 scale).
 */
fun validateSatisfactionLevel(level: Int): Int = level.coerceIn(1, 10)

/**
 * Check if high-fatigue warning should be shown.
 * Triggered when fatigue >= 8 AND satisfaction <= 4.
 */
fun shouldShowHighFatigueWarning(fatigue: Int, satisfaction: Int): Boolean {
    return fatigue >= 8 && satisfaction <= 4
}

/**
 * Format slider value label for display.
 */
fun formatSliderLabel(value: Int, labels: Pair<String, String>): String {
    return when (value) {
        1 -> labels.first
        10 -> labels.second
        else -> "$value"
    }
}

/**
 * Fatigue slider labels: "Easy" to "Exhausted".
 */
val FATIGUE_LABELS = Pair("Easy", "Exhausted")

/**
 * Satisfaction slider labels: "Poor" to "Perfect".
 */
val SATISFACTION_LABELS = Pair("Poor", "Perfect")

/**
 * Validate exercise notes (non-blank after trimming).
 */
fun isValidNotes(notes: String?): Boolean {
    return !notes.isNullOrBlank()
}

/**
 * Build exercise feeling notes map from UI list.
 */
fun buildExerciseNotesMap(
    exerciseFeelings: List<ExerciseFeelingUi>,
): Map<String, String> {
    return exerciseFeelings
        .filter { !it.notes.isNullOrBlank() }
        .associate { it.exerciseId to it.notes!! }
}

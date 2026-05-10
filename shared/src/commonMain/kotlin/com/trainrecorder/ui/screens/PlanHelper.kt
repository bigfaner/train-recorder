package com.trainrecorder.ui.screens

import com.trainrecorder.domain.model.ExerciseMode
import com.trainrecorder.domain.model.PlanMode
import com.trainrecorder.domain.model.ScheduleDayType
import com.trainrecorder.domain.model.TrainingDay
import com.trainrecorder.domain.model.TrainingDayExercise
import com.trainrecorder.domain.model.TrainingPlan
import com.trainrecorder.domain.model.TrainingType

/**
 * Day-of-week labels starting from Monday (index 0) through Sunday (index 6).
 * Used for schedule day-of-week selection buttons.
 */
val DAY_OF_WEEK_LABELS: List<String> = listOf(
    "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun",
)

/**
 * Get the display label for a plan mode.
 */
fun planModeLabel(mode: PlanMode): String = when (mode) {
    PlanMode.INFINITE_LOOP -> "Infinite Loop"
    PlanMode.FIXED_CYCLE -> "Fixed Cycle"
}

/**
 * Get the display label for a schedule mode.
 */
fun scheduleModeLabel(mode: ScheduleDayType): String = when (mode) {
    ScheduleDayType.WEEKLY_FIXED -> "Fixed Days"
    ScheduleDayType.FIXED_INTERVAL -> "Interval"
}

/**
 * Get the display label for a training type.
 */
fun trainingTypeLabel(type: TrainingType): String = when (type) {
    TrainingType.PUSH -> "Push"
    TrainingType.PULL -> "Pull"
    TrainingType.LEGS -> "Legs"
    TrainingType.OTHER -> "Other"
    TrainingType.CUSTOM -> "Custom"
}

/**
 * Get the display label for an exercise mode.
 */
fun exerciseModeLabel(mode: ExerciseMode): String = when (mode) {
    ExerciseMode.FIXED -> "Fixed"
    ExerciseMode.CUSTOM -> "Custom"
}

/**
 * Format an exercise summary string for display.
 * For fixed mode: "4x8" (sets x reps)
 * For custom mode: "3 sets (custom)"
 */
fun formatExerciseSummary(exercise: TrainingDayExercise): String = when (exercise.exerciseMode) {
    ExerciseMode.FIXED -> "${exercise.targetSets}x${exercise.targetReps}"
    ExerciseMode.CUSTOM -> "${exercise.targetSets} sets (custom)"
}

/**
 * Format a summary text for a list of items, joining with " | ".
 */
fun <T> formatDaySummary(items: List<T>, labelExtractor: (T) -> String): String {
    return items.map(labelExtractor).filter { it.isNotBlank() }.joinToString(" | ")
}

/**
 * Get the status text for a plan.
 */
fun planStatusText(plan: TrainingPlan): String = if (plan.isActive) "Active" else "Inactive"

/**
 * Format a human-readable description of the training interval.
 */
fun formatIntervalDescription(intervalDays: Int): String = when (intervalDays) {
    0 -> "Train every day"
    1 -> "1 rest day between sessions"
    else -> "$intervalDays rest days between sessions"
}

/**
 * Format the training day cycle order text.
 * E.g., "Push -> Pull -> Legs -> (cycle)"
 */
fun formatDayOrderText(days: List<TrainingDay>): String {
    if (days.isEmpty()) return ""
    val names = days.map { it.displayName }
    return names.joinToString(" -> ") + " -> (cycle)"
}

/**
 * Validate fixed mode exercise inputs.
 * Returns an error message string if invalid, null if valid.
 */
fun validateFixedModeInputs(sets: Int, reps: Int, weight: Double): String? = when {
    sets < 1 -> "Sets must be at least 1"
    reps < 1 -> "Reps must be at least 1"
    weight < 0 -> "Weight must be positive"
    else -> null
}

/**
 * Validate a plan name.
 * Returns an error message string if invalid, null if valid.
 */
fun validatePlanName(name: String): String? = when {
    name.isBlank() -> "Plan name is required"
    name.length > 100 -> "Plan name must be 100 characters or less"
    else -> null
}

/**
 * Toggle a day-of-week index in the selected set.
 * Adds if not present, removes if present.
 */
fun toggleDayOfWeek(selected: Set<Int>, dayIndex: Int): Set<Int> =
    if (dayIndex in selected) selected - dayIndex else selected + dayIndex

/**
 * Represents a day-of-week assignment to a training day.
 */
data class DayAssignment(
    val dayOfWeekIndex: Int,
    val dayLabel: String,
    val trainingDay: TrainingDay,
)

/**
 * Map selected day-of-week indices to training days.
 * Training days are assigned in cycle order to the sorted selected days.
 *
 * @param selectedDayIndices Set of day-of-week indices (0=Mon, 6=Sun)
 * @param trainingDays The training days to assign, in order
 * @return List of assignments, sorted by day-of-week index
 */
fun assignedDaysForSelection(
    selectedDayIndices: Set<Int>,
    trainingDays: List<TrainingDay>,
): List<DayAssignment> {
    if (selectedDayIndices.isEmpty() || trainingDays.isEmpty()) return emptyList()

    val sortedDays = selectedDayIndices.sorted()
    return sortedDays.mapIndexed { index, dayIndex ->
        val trainingDay = trainingDays[index % trainingDays.size]
        DayAssignment(
            dayOfWeekIndex = dayIndex,
            dayLabel = DAY_OF_WEEK_LABELS[dayIndex],
            trainingDay = trainingDay,
        )
    }
}

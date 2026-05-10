package com.trainrecorder.ui.screens

import com.trainrecorder.viewmodel.ExerciseSetUi
import com.trainrecorder.viewmodel.WorkoutExerciseUi
import com.trainrecorder.viewmodel.WorkoutProgress

/**
 * Result of advancing to the next exercise after completion.
 */
data class AdvanceResult(
    val newIndex: Int,
    val isWorkoutComplete: Boolean,
)

/**
 * Timer panel state for the bottom sheet.
 */
data class TimerPanelState(
    val remainingSeconds: Int,
    val totalDuration: Int,
    val isExpired: Boolean,
    val isVisible: Boolean,
) {
    val progress: Float get() = if (totalDuration > 0) {
        remainingSeconds.toFloat() / totalDuration
    } else 0f

    val displayMinutes: Int get() = remainingSeconds / 60
    val displaySeconds: Int get() = remainingSeconds % 60
    val displayText: String get() = "${displayMinutes}:${displaySeconds.toString().padStart(2, '0')}"
}

/**
 * Exit dialog state showing workout completion summary.
 */
data class ExitDialogState(
    val completedExercises: Int,
    val totalExercises: Int,
    val completedSets: Int,
    val totalSets: Int,
) {
    val hasProgress: Boolean get() = completedSets > 0
}

/**
 * Compute which exercise is currently expanded.
 *
 * The current exercise (by index) is expanded. All others are collapsed.
 * Completed/skipped exercises show summary only.
 */
fun computeExpandedIndex(
    exercises: List<WorkoutExerciseUi>,
    currentExerciseIndex: Int,
): Int = currentExerciseIndex.coerceIn(0, (exercises.size - 1).coerceAtLeast(0))

/**
 * Compute the next incomplete set index within an exercise.
 * Returns null if all sets are completed.
 */
fun findNextIncompleteSet(exercise: WorkoutExerciseUi): ExerciseSetUi? {
    return exercise.sets.find { !it.isCompleted }
}

/**
 * Advance to the next exercise after all sets of the current exercise are completed.
 *
 * Returns an AdvanceResult indicating the new current index and whether
 * the entire workout is complete (all exercises done or skipped).
 */
fun advanceToNextExercise(
    exercises: List<WorkoutExerciseUi>,
    currentExerciseIndex: Int,
): AdvanceResult {
    if (exercises.isEmpty()) return AdvanceResult(0, true)

    val remaining = exercises.withIndex().filter { (index, ex) ->
        index > currentExerciseIndex &&
            (ex.exerciseStatus == com.trainrecorder.domain.model.ExerciseStatus.PENDING ||
                ex.exerciseStatus == com.trainrecorder.domain.model.ExerciseStatus.IN_PROGRESS)
    }

    return if (remaining.isEmpty()) {
        AdvanceResult(currentExerciseIndex, true)
    } else {
        AdvanceResult(remaining.first().index, false)
    }
}

/**
 * Build exit dialog state from the current workout state.
 */
fun buildExitDialogState(
    exercises: List<WorkoutExerciseUi>,
    progress: WorkoutProgress,
): ExitDialogState {
    val completedSets = exercises.sumOf { ex ->
        ex.sets.count { it.isCompleted }
    }
    val totalSets = exercises.sumOf { it.targetSets }

    return ExitDialogState(
        completedExercises = progress.completedExercises,
        totalExercises = progress.totalExercises,
        completedSets = completedSets,
        totalSets = totalSets,
    )
}

/**
 * Format rest time for display.
 */
fun formatRestTime(seconds: Int): String {
    val mins = seconds / 60
    val secs = seconds % 60
    return "${mins}:${secs.toString().padStart(2, '0')}"
}

/**
 * Determine the set label for display (e.g., "Set 1/3").
 */
fun formatSetLabel(currentSet: Int, totalSets: Int): String {
    return "Set $currentSet/$totalSets"
}

/**
 * Check if a weight value differs from the suggested value (user modified).
 */
fun isWeightModified(currentWeight: Double?, suggestedWeight: Double?): Boolean {
    if (currentWeight == null || suggestedWeight == null) return false
    return currentWeight != suggestedWeight
}

/**
 * Compute the next suggested weight after completing all sets successfully.
 * Uses a simple increment if reps target was met.
 */
fun computeNextSuggestedWeight(
    currentWeight: Double,
    targetReps: Int,
    actualReps: Int,
    increment: Double,
): Double {
    return if (actualReps >= targetReps) {
        currentWeight + increment
    } else {
        currentWeight
    }
}

package com.trainrecorder.ui.screens

import com.trainrecorder.domain.model.Exercise
import com.trainrecorder.domain.model.ExerciseCategory

/**
 * Group exercises by their category.
 * Returns a map of category -> list of exercises in that category.
 */
fun groupByCategory(exercises: List<Exercise>): Map<ExerciseCategory, List<Exercise>> {
    return exercises.groupBy { it.category }
}

/**
 * Get the display label for an exercise category.
 */
fun getCategoryLabel(category: ExerciseCategory): String = when (category) {
    ExerciseCategory.CORE -> "Core"
    ExerciseCategory.UPPER_PUSH -> "Upper Push"
    ExerciseCategory.UPPER_PULL -> "Upper Pull"
    ExerciseCategory.LOWER -> "Lower"
    ExerciseCategory.ABS_CORE -> "Abs & Core"
    ExerciseCategory.SHOULDER -> "Shoulder"
    ExerciseCategory.CUSTOM -> "Custom"
}

/**
 * Ordered list of categories for display.
 */
val CATEGORY_DISPLAY_ORDER = listOf(
    ExerciseCategory.CORE,
    ExerciseCategory.UPPER_PUSH,
    ExerciseCategory.UPPER_PULL,
    ExerciseCategory.LOWER,
    ExerciseCategory.ABS_CORE,
    ExerciseCategory.SHOULDER,
    ExerciseCategory.CUSTOM,
)

/**
 * Filter exercises by search query (case-insensitive name match).
 */
fun filterExercisesByQuery(
    exercises: List<Exercise>,
    query: String,
): List<Exercise> {
    if (query.isBlank()) return exercises
    return exercises.filter { it.displayName.contains(query, ignoreCase = true) }
}

/**
 * Filter exercises by category.
 * Returns all exercises if category is null.
 */
fun filterExercisesByCategory(
    exercises: List<Exercise>,
    category: ExerciseCategory?,
): List<Exercise> {
    if (category == null) return exercises
    return exercises.filter { it.category == category }
}

/**
 * Validate exercise name for creation/editing.
 * Returns null if valid, or an error message if invalid.
 */
fun validateExerciseName(name: String?): String? {
    if (name.isNullOrBlank()) return "Exercise name is required"
    if (name.length < 2) return "Name must be at least 2 characters"
    return null
}

/**
 * Validate weight increment for exercise creation.
 */
fun validateWeightIncrement(increment: Double?): String? {
    if (increment == null) return "Weight increment is required"
    if (increment <= 0) return "Weight increment must be positive"
    return null
}

/**
 * Validate default rest seconds for exercise creation.
 */
fun validateDefaultRest(seconds: Int?): String? {
    if (seconds == null) return "Rest time is required"
    if (seconds <= 0) return "Rest time must be positive"
    return null
}

/**
 * Format exercise detail info: increment + rest.
 */
fun formatExerciseDetail(exercise: Exercise): String {
    val incrementStr = if (exercise.weightIncrement == exercise.weightIncrement.toLong().toDouble()) {
        "${exercise.weightIncrement.toLong()}kg"
    } else {
        "${exercise.weightIncrement}kg"
    }
    val restMins = exercise.defaultRest / 60
    val restSecs = exercise.defaultRest % 60
    val restStr = if (restMins > 0) "${restMins}m" else "${restSecs}s"
    return "+$incrementStr  $restStr rest"
}
